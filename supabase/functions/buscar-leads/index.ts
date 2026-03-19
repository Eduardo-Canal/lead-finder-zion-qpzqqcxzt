import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const {
      cnae_fiscal_principal,
      uf,
      municipio,
      porte,
      situacao_cadastral,
      page = 1,
      limit = 5,
    } = payload

    // Sanitization: Ensure CNAE only contains digits
    const cnaeCleaned = Array.isArray(cnae_fiscal_principal)
      ? cnae_fiscal_principal
          .map((c) => (typeof c === 'string' ? c.replace(/\D/g, '') : c))
          .filter(Boolean)
      : []

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const authHeader = req.headers.get('Authorization')

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } },
    })

    const { data: config } = await supabase
      .from('configuracoes_sistema')
      .select('casadosdados_api_token')
      .eq('id', 1)
      .maybeSingle()

    const apiKey = config?.casadosdados_api_token || Deno.env.get('CASADOSDADOS_API_KEY')

    const payloadToHash = {
      cnae: cnaeCleaned,
      uf: uf || null,
      municipio: municipio ? municipio.toUpperCase() : null,
      porte: porte ? porte.toUpperCase() : null,
      situacao: situacao_cadastral ? situacao_cadastral.toUpperCase() : 'ATIVA',
      page,
      limit,
    }

    const msgBuffer = new TextEncoder().encode(JSON.stringify(payloadToHash))
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const chave_cache = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    const { data: cachedData } = await supabase
      .from('cache_pesquisas')
      .select('resultados, total_registros, expira_em')
      .eq('chave_cache', chave_cache)
      .maybeSingle()

    if (cachedData && new Date(cachedData.expira_em) > new Date()) {
      return new Response(
        JSON.stringify({
          data: cachedData.resultados,
          page: page,
          count: cachedData.total_registros,
          pages: Math.ceil(cachedData.total_registros / limit) || 1,
          cached: true,
          isMock: false,
          status_http: 200,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const casadosDadosPayload: any = {
      query: {
        termo: [],
        atividade_principal: cnaeCleaned,
        natureza_juridica: [],
        uf: uf ? [uf] : [],
        municipio: municipio ? [municipio.toUpperCase()] : [],
        bairro: [],
        cep: [],
        ddd: [],
      },
      range_query: {
        data_abertura: { lte: null, gte: null },
        capital_social: { lte: null, gte: null },
      },
      exclusao: {
        natureza_juridica: [],
        atividade_principal: [],
        bairro: [],
        uf: [],
        municipio: [],
      },
      somente_mei: false,
      excluir_mei: false,
      com_email: false,
      incluir_atividade_secundaria: false,
      com_contato_telefonico: false,
      somente_fixo: false,
      somente_celular: false,
      somente_matriz: false,
      somente_filial: false,
      estado_inscricao: [],
      page: page,
    }

    if (situacao_cadastral) {
      casadosDadosPayload.query.situacao_cadastral = situacao_cadastral.toUpperCase()
    } else {
      casadosDadosPayload.query.situacao_cadastral = 'ATIVA'
    }

    if (porte) {
      casadosDadosPayload.query.porte = [porte.toUpperCase()]
    }

    let data
    let isMock = false

    if (apiKey) {
      try {
        const response = await fetch('https://api.casadosdados.com.br/v2/public/cnpj/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: apiKey,
            'casadosdados-api-key': apiKey,
            'x-api-key': apiKey,
          },
          body: JSON.stringify(casadosDadosPayload),
        })

        if (!response.ok) {
          let errorMsg = `Erro na API: ${response.status} ${response.statusText}`
          if (response.status === 401 || response.status === 403) {
            errorMsg = 'Token Inválido'
          } else if (response.status === 429) {
            errorMsg = 'Limite de Requisições Excedido'
          } else if (response.status === 400) {
            errorMsg = 'Requisição inválida (verifique os parâmetros)'
          }
          return new Response(
            JSON.stringify({
              error: errorMsg,
              data: [],
              page,
              count: 0,
              pages: 0,
              cached: false,
              isMock: false,
              status_http: response.status,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          )
        }

        data = await response.json()
      } catch (e) {
        console.error('Fetch API error:', e)
        return new Response(
          JSON.stringify({
            error: 'Erro de conexão com a API Casa dos Dados.',
            data: [],
            page,
            count: 0,
            pages: 0,
            cached: false,
            isMock: false,
            status_http: 500,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    if (!data || data.success === false || data.error || !data.data?.cnpj) {
      if (apiKey) {
        return new Response(
          JSON.stringify({
            error: data?.error || 'Formato de resposta inesperado da API.',
            data: [],
            page,
            count: 0,
            pages: 0,
            cached: false,
            isMock: false,
            status_http: 500,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      isMock = true
      const isTargetCnae = cnaeCleaned.includes('4683400')
      const fallbackCount = isTargetCnae ? Math.min(6, limit) : limit

      const mockResults = Array.from({ length: fallbackCount }).map((_, i) => {
        const id = (page - 1) * limit + i + 1
        const randomCnpj = `${Math.floor(Math.random() * 90 + 10)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}/0001-${Math.floor(Math.random() * 90 + 10)}`
        return {
          cnpj: isTargetCnae ? `12.345.678/0001-${10 + i}` : randomCnpj,
          razao_social: isTargetCnae
            ? `COMÉRCIO DE DEFENSIVOS AGRÍCOLAS ${id} LTDA`
            : `Empresa Exemplo ${id} LTDA (Demonstração)`,
          nome_fantasia: isTargetCnae ? `AGRO DEFENSIVOS ${id}` : `Exemplo ${id}`,
          cnae_fiscal_principal: cnaeCleaned[0] || '4683400',
          municipio: municipio ? municipio.toUpperCase() : 'SÃO PAULO',
          uf: uf || 'SP',
          porte: porte || 'DEMAIS',
          situacao_cadastral: situacao_cadastral || 'ATIVA',
          capital_social: Math.floor(Math.random() * 100000) + 50000,
          email: `contato${id}@exemplo.com.br`,
          telefone: `119${Math.floor(Math.random() * 90000000 + 10000000)}`,
        }
      })

      data = {
        success: true,
        data: {
          cnpj: mockResults,
          count: isTargetCnae ? 6 : 50,
          pages: Math.ceil((isTargetCnae ? 6 : 50) / limit),
          page: page,
        },
      }
    }

    let rawResults = data?.data?.cnpj || data?.cnpj || []
    let totalCount = data?.data?.count || data?.count || rawResults.length
    let totalPages = data?.data?.pages || data?.pages || 1
    let currentPage = data?.data?.page || data?.page || page

    const results = rawResults.slice(0, limit).map((empresa: any) => ({
      cnpj: empresa.cnpj,
      razao_social: empresa.razao_social || empresa.nome_fantasia || '',
      cnae_fiscal_principal: empresa.cnae_fiscal_principal || empresa.atividade_principal || '',
      municipio: empresa.municipio,
      uf: empresa.uf,
      porte: empresa.porte || '',
      situacao_cadastral: empresa.situacao_cadastral || 'Ativa',
      capital_social: empresa.capital_social || 0,
      email: empresa.email || '',
      telefone: empresa.telefone || empresa.ddd_telefone_1 || '',
    }))

    if (results && results.length > 0 && !isMock) {
      try {
        const expira_em = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        await supabase.from('cache_pesquisas').upsert(
          {
            chave_cache,
            resultados: results,
            total_registros: totalCount,
            expira_em,
          },
          { onConflict: 'chave_cache' },
        )
      } catch (err) {
        console.error('Error saving cache:', err)
      }
    }

    return new Response(
      JSON.stringify({
        data: results,
        page: currentPage,
        count: totalCount,
        pages: totalPages,
        cached: false,
        isMock,
        status_http: 200,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('buscar-leads Edge Function Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro desconhecido ao realizar a busca.',
        data: [],
        status_http: 500,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})
