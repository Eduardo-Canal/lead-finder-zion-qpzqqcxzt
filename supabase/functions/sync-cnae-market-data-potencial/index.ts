import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 1. Get token
    const { data: config } = await supabaseAdmin
      .from('configuracoes_sistema')
      .select('casadosdados_api_token')
      .eq('id', 1)
      .maybeSingle()

    const apiKey = config?.casadosdados_api_token?.trim() || ''

    if (!apiKey) {
      throw new Error('API Key Casa dos Dados não configurada.')
    }

    // 2. Iterate over Zion portfolio CNAEs
    const { data: clients } = await supabaseAdmin
      .from('bitrix_clients_zion')
      .select('cnae_principal')

    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum cliente na base.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const cnaeCounts: Record<string, number> = {}
    clients.forEach(c => {
      const cnae = c.cnae_principal?.trim()
      if (cnae && cnae !== 'Não classificado' && cnae !== 'ND') {
        const cleanCnae = cnae.replace(/\D/g, '')
        if (cleanCnae.length === 7) {
          cnaeCounts[cleanCnae] = (cnaeCounts[cleanCnae] || 0) + 1
        }
      }
    })

    const cnaesToProcess = Object.keys(cnaeCounts)
    const upserts = []

    // Get previous data to calculate trend
    const { data: prevDataList } = await supabaseAdmin
      .from('cnae_market_data_potencial')
      .select('cnae, potencial_mercado')

    const prevDataMap = new Map((prevDataList || []).map(p => [p.cnae, p.potencial_mercado]))

    for (const cnae of cnaesToProcess) {
      const clientes_zion = cnaeCounts[cnae]
      let potencial_mercado = 0
      let apiCalled = false

      // 7. Cache verification (last 30 days)
      const payloadToHash = { endpoint: 'search_potencial', cnae }
      const msgBuffer = new TextEncoder().encode(JSON.stringify(payloadToHash))
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const chave_cache = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const { data: cachedData } = await supabaseAdmin
        .from('cache_pesquisas')
        .select('total_registros, expira_em')
        .eq('chave_cache', chave_cache)
        .maybeSingle()

      if (cachedData && new Date(cachedData.expira_em) > new Date()) {
        potencial_mercado = cachedData.total_registros || 0
      } else {
        // 3. POST request to API
        try {
          const payloadSearch = {
              cnae_fiscal_principal: [cnae]
          }

          const tokenRaw = apiKey.replace(/^Bearer\s+/i, '').trim()

          const response = await fetch('https://api.casadosdados.com.br/v5/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'api-key': tokenRaw
            },
            body: JSON.stringify(payloadSearch)
          })

          apiCalled = true

          if (response.ok) {
            const data = await response.json()
            potencial_mercado = data.total || data.count || 0

            const expira_em = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            await supabaseAdmin.from('cache_pesquisas').upsert({
              chave_cache,
              resultados: [],
              total_registros: potencial_mercado,
              expira_em,
              parametros: payloadToHash
            }, { onConflict: 'chave_cache' })
          } else {
            // 9. Log error
            await supabaseAdmin.from('api_debug_logs').insert({
              cnae: cnae,
              status_http: response.status,
              sucesso: false,
              tempo_resposta_ms: 0,
              resposta_json: { error: await response.text() }
            })
          }
        } catch (err: any) {
          await supabaseAdmin.from('api_debug_logs').insert({
            cnae: cnae,
            status_http: 500,
            sucesso: false,
            tempo_resposta_ms: 0,
            resposta_json: { error: err.message }
          })
        }
      }

      if (apiCalled) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // 4. Calculate taxa_penetracao
      const taxa_penetracao = potencial_mercado > 0 ? Number(((clientes_zion / potencial_mercado) * 100).toFixed(2)) : 0

      // 5. Determine tendencia
      let tendencia = 'Estável'
      const prevPotencial = prevDataMap.get(cnae)
      if (prevPotencial !== undefined) {
        if (potencial_mercado > prevPotencial) tendencia = 'Crescente'
        else if (potencial_mercado < prevPotencial) tendencia = 'Decrescente'
      }

      upserts.push({
        cnae,
        potencial_mercado,
        clientes_zion,
        taxa_penetracao,
        tendencia,
        data_atualizacao: new Date().toISOString()
      })
    }

    // 6. Insert or update in cnae_market_data_potencial
    if (upserts.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('cnae_market_data_potencial')
        .upsert(upserts, { onConflict: 'cnae' })

      if (upsertError) {
        throw new Error(`Erro ao salvar dados de potencial: ${upsertError.message}`)
      }
    }

    return new Response(JSON.stringify({ success: true, processed: upserts.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('sync-cnae-market-data-potencial error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
