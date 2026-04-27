import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 1. Obter a chave da API Casa dos Dados
    const { data: config } = await supabaseAdmin
      .from('configuracoes_sistema')
      .select('casadosdados_api_token')
      .eq('id', 1)
      .maybeSingle()

    const apiKey = config?.casadosdados_api_token?.trim() || ''

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key Casa dos Dados não configurada.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Buscar clientes e agrupar métricas por CNAE
    const { data: clients } = await supabaseAdmin
      .from('bitrix_clients_zion')
      .select('cnae_principal, curva_abc')

    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum cliente encontrado na base.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: analiseData } = await supabaseAdmin.from('analise_cnae').select('cnae, nome_cnae')

    const descMap = new Map((analiseData || []).map((a) => [a.cnae, a.nome_cnae]))

    const cnaeData: Record<
      string,
      { total: number; a_plus: number; a: number; b: number; c: number; nao_classificado: number }
    > = {}

    clients.forEach((c) => {
      const cnae = c.cnae_principal?.trim() || ''
      if (!cnae || cnae === 'Não classificado') return

      if (!cnaeData[cnae]) {
        cnaeData[cnae] = { total: 0, a_plus: 0, a: 0, b: 0, c: 0, nao_classificado: 0 }
      }

      cnaeData[cnae].total++

      const curva = (c.curva_abc || '').toUpperCase()
      if (curva === 'A+') cnaeData[cnae].a_plus++
      else if (curva === 'A') cnaeData[cnae].a++
      else if (curva === 'B') cnaeData[cnae].b++
      else if (curva === 'C') cnaeData[cnae].c++
      else cnaeData[cnae].nao_classificado++
    })

    const upserts = []

    // 3. Obter potencial de mercado para cada CNAE
    for (const cnae of Object.keys(cnaeData)) {
      const cleanCnae = cnae.replace(/\D/g, '')
      if (!cleanCnae || cleanCnae.length !== 7) continue

      let potencial_mercado = 0
      let apiCalled = false

      const payloadToHash = {
        cnaes: [cleanCnae],
        uf: null,
        municipio: null,
        situacao_cadastral: ['ATIVA'],
        porte: null,
        limit: 1,
        page: 1,
      }

      const msgBuffer = new TextEncoder().encode(JSON.stringify(payloadToHash))
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const chave_cache = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      const { data: cachedData } = await supabaseAdmin
        .from('cache_pesquisas')
        .select('total_registros, expira_em')
        .eq('chave_cache', chave_cache)
        .maybeSingle()

      if (cachedData && new Date(cachedData.expira_em) > new Date()) {
        potencial_mercado = cachedData.total_registros || 0
      } else {
        try {
          const casadosDadosPayload = {
            limite: 1,
            pagina: 1,
            codigo_atividade_principal: [cleanCnae],
            situacao_cadastral: ['ATIVA'],
          }

          const tokenRaw = apiKey.replace(/^Bearer\s+/i, '').trim()

          const response = await fetch(
            'https://api.casadosdados.com.br/v5/cnpj/pesquisa?tipo_resultado=completo',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'api-key': tokenRaw,
              },
              body: JSON.stringify(casadosDadosPayload),
            },
          )

          apiCalled = true

          if (response.ok) {
            try {
              const data = await response.json()
              if (data.success !== false) {
                potencial_mercado = data.count || 0

                const expira_em = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                await supabaseAdmin.from('cache_pesquisas').upsert(
                  {
                    chave_cache,
                    resultados: data.cnpjs?.slice(0, 1) || [],
                    total_registros: potencial_mercado,
                    expira_em,
                    parametros: payloadToHash,
                  },
                  { onConflict: 'chave_cache' },
                )
              }
            } catch (jsonError) {
              console.error(`Erro ao fazer parse JSON para CNAE ${cnae}:`, jsonError)
              // Tentar ler como texto para debug
              try {
                const responseText = await response.text()
                console.error('Resposta bruta:', responseText)
              } catch (textError) {
                console.error('Erro ao ler resposta como texto:', textError)
              }
            }
          } else {
            console.error(`Erro HTTP ${response.status} para CNAE ${cnae}`)
            // Tentar ler resposta de erro
            try {
              const errorText = await response.text()
              console.error('Resposta de erro:', errorText)
            } catch (errorReadError) {
              console.error('Erro ao ler resposta de erro:', errorReadError)
            }
          }
        } catch (err) {
          console.error(`Erro ao buscar potencial para CNAE ${cnae}:`, err)
        }
      }

      // Adiciona um pequeno delay se a API foi chamada para evitar limite de requisições rápidas
      if (apiCalled) {
        await new Promise((resolve) => setTimeout(resolve, 600))
      }

      const total_clientes = cnaeData[cnae].total
      const taxa_penetracao =
        potencial_mercado > 0 ? Number(((total_clientes / potencial_mercado) * 100).toFixed(2)) : 0

      let tendencia = 'Estável'
      if (taxa_penetracao < 5 && potencial_mercado > 1000) tendencia = 'Crescimento Acelerado'
      else if (taxa_penetracao >= 5 && taxa_penetracao < 15) tendencia = 'Crescimento Moderado'
      else if (taxa_penetracao >= 15) tendencia = 'Saturação'

      upserts.push({
        cnae_code: cnae,
        cnae_description: descMap.get(cnae) || 'Descrição não informada',
        total_clientes,
        a_plus: cnaeData[cnae].a_plus,
        a: cnaeData[cnae].a,
        b: cnaeData[cnae].b,
        c: cnaeData[cnae].c,
        nao_classificado: cnaeData[cnae].nao_classificado,
        potencial_mercado,
        taxa_penetracao,
        tendencia,
        data_atualizacao: new Date().toISOString(),
      })
    }

    // 4. Armazenar os resultados na tabela cnae_market_data
    if (upserts.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('cnae_market_data')
        .upsert(upserts, { onConflict: 'cnae_code' })

      if (upsertError) {
        throw new Error(`Erro ao atualizar cnae_market_data: ${upsertError.message}`)
      }
    }

    return new Response(JSON.stringify({ success: true, processed_cnaes: upserts.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('sync-cnae-market-data error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
