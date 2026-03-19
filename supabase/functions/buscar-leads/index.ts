import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const start = performance.now()

  try {
    const payload = await req.json().catch(() => ({}))
    const {
      cnae_fiscal_principal,
      uf,
      municipio,
      situacao_cadastral,
      limit = 10,
      page = 1,
      bypass_cache = false,
    } = payload

    const cnaes = Array.isArray(cnae_fiscal_principal)
      ? cnae_fiscal_principal.map((c) => (typeof c === 'string' ? c.trim() : c)).filter(Boolean)
      : []

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const authHeader = req.headers.get('Authorization')

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } },
    })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: config } = await supabase
      .from('configuracoes_sistema')
      .select('casadosdados_api_token')
      .eq('id', 1)
      .maybeSingle()

    const apiKey = config?.casadosdados_api_token?.trim() || ''

    const payloadToHash = {
      cnaes,
      uf: uf || null,
      municipio: municipio || null,
      situacao_cadastral: situacao_cadastral || null,
      limit,
      page,
    }
    const msgBuffer = new TextEncoder().encode(JSON.stringify(payloadToHash))
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const chave_cache = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    if (!bypass_cache) {
      const { data: cachedData } = await supabase
        .from('cache_pesquisas')
        .select('resultados, total_registros, expira_em')
        .eq('chave_cache', chave_cache)
        .maybeSingle()

      if (cachedData && new Date(cachedData.expira_em) > new Date()) {
        const timeTaken = Math.round(performance.now() - start)

        await supabaseAdmin.from('api_debug_logs').insert({
          cnae: cnaes.join(', ') || null,
          uf: Array.isArray(uf) ? uf.join(', ') : uf || null,
          municipio: Array.isArray(municipio) ? municipio.join(', ') : municipio || null,
          limite: limit,
          status_http: 200,
          sucesso: true,
          tempo_resposta_ms: timeTaken,
          total_resultados: cachedData.total_registros,
          resposta_json: { cached: true, count: cachedData.total_registros },
        })

        return new Response(
          JSON.stringify({
            data: cachedData.resultados,
            page: page,
            count: cachedData.total_registros,
            pages: Math.ceil(cachedData.total_registros / limit) || 1,
            cached: true,
            status_http: 200,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    const casadosDadosPayload: any = {
      limite: limit || 10,
      page: page || 1,
    }

    if (cnaes && cnaes.length > 0) {
      casadosDadosPayload.codigo_atividade_principal = cnaes
    }

    if (uf && uf !== 'Todos') {
      casadosDadosPayload.uf = Array.isArray(uf) ? uf : [uf]
    }
    if (municipio && municipio !== 'Todos') {
      casadosDadosPayload.municipio = Array.isArray(municipio) ? municipio : [municipio]
    }
    if (situacao_cadastral && situacao_cadastral !== 'Todos') {
      casadosDadosPayload.situacao_cadastral = situacao_cadastral
    }

    let data
    let externalStatus = 200
    const fetchStart = performance.now()
    let timeTakenApi = 0

    if (apiKey) {
      try {
        let tokenRaw = apiKey.replace(/^Bearer\s+/i, '').trim()

        const response = await fetch('https://api.casadosdados.com.br/v5/cnpj/pesquisa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'api-key': tokenRaw,
          },
          body: JSON.stringify(casadosDadosPayload),
        })

        timeTakenApi = Math.round(performance.now() - fetchStart)
        externalStatus = response.status

        if (!response.ok) {
          let errorMsg = `Erro na API: ${response.status} ${response.statusText}`
          if (response.status === 401 || response.status === 403) {
            errorMsg =
              'Token Inválido ou Não Autorizado. Verifique o token nas Configurações Avançadas.'
          } else if (response.status === 429) {
            errorMsg = 'Limite de Requisições Excedido'
          } else if (response.status === 404) {
            errorMsg = 'Endpoint não encontrado (verifique a URL)'
          } else if (response.status === 400) {
            errorMsg = 'Requisição inválida (verifique os parâmetros da busca)'
          }

          let errorData = null
          try {
            errorData = await response.json()
          } catch (e) {}

          const finalError = { error: errorMsg, details: errorData }

          await supabaseAdmin.from('api_debug_logs').insert({
            cnae: cnaes.join(', ') || null,
            uf: Array.isArray(uf) ? uf.join(', ') : uf || null,
            municipio: Array.isArray(municipio) ? municipio.join(', ') : municipio || null,
            limite: limit,
            status_http: response.status,
            sucesso: false,
            tempo_resposta_ms: timeTakenApi,
            total_resultados: 0,
            resposta_json: errorData || finalError,
          })

          return new Response(
            JSON.stringify({
              error: errorMsg,
              data: [],
              page,
              count: 0,
              pages: 0,
              cached: false,
              status_http: response.status,
              raw_response: errorData,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
          )
        }

        data = await response.json()
      } catch (e: any) {
        timeTakenApi = Math.round(performance.now() - fetchStart)
        console.error('Fetch API error:', e)
        const errObj = { error: 'Erro de conexão com a API Casa dos Dados.', details: e.message }

        await supabaseAdmin.from('api_debug_logs').insert({
          cnae: cnaes.join(', ') || null,
          uf: Array.isArray(uf) ? uf.join(', ') : uf || null,
          municipio: Array.isArray(municipio) ? municipio.join(', ') : municipio || null,
          limite: limit,
          status_http: 500,
          sucesso: false,
          tempo_resposta_ms: timeTakenApi,
          total_resultados: 0,
          resposta_json: errObj,
        })

        return new Response(
          JSON.stringify({
            error: 'Erro de conexão com a API Casa dos Dados.',
            data: [],
            page,
            count: 0,
            pages: 0,
            cached: false,
            status_http: 500,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
        )
      }
    } else {
      const errObj = { error: 'Token da API Casa dos Dados não configurado.' }
      await supabaseAdmin.from('api_debug_logs').insert({
        cnae: cnaes.join(', ') || null,
        uf: Array.isArray(uf) ? uf.join(', ') : uf || null,
        municipio: Array.isArray(municipio) ? municipio.join(', ') : municipio || null,
        limite: limit,
        status_http: 401,
        sucesso: false,
        tempo_resposta_ms: 0,
        total_resultados: 0,
        resposta_json: errObj,
      })

      return new Response(
        JSON.stringify({
          error: 'Token da API Casa dos Dados não configurado.',
          data: [],
          page,
          count: 0,
          pages: 0,
          cached: false,
          status_http: 401,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    if (!data || data.error || data.success === false) {
      const finalError = data?.error || data?.message || 'Formato de resposta inesperado da API.'
      await supabaseAdmin.from('api_debug_logs').insert({
        cnae: cnaes.join(', ') || null,
        uf: Array.isArray(uf) ? uf.join(', ') : uf || null,
        municipio: Array.isArray(municipio) ? municipio.join(', ') : municipio || null,
        limite: limit,
        status_http: externalStatus || 500,
        sucesso: false,
        tempo_resposta_ms: timeTakenApi,
        total_resultados: 0,
        resposta_json: data || { error: finalError },
      })

      return new Response(
        JSON.stringify({
          error: finalError,
          data: [],
          page,
          count: 0,
          pages: 0,
          cached: false,
          status_http: externalStatus || 500,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    let rawResults = data?.data?.cnpj || data?.cnpj || data?.data || data?.resultados || data || []
    if (!Array.isArray(rawResults)) {
      rawResults = []
    }

    let totalCount = data?.data?.count || data?.count || data?.total || rawResults.length
    let totalPages = data?.data?.pages || data?.pages || data?.total_pages || 1
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

    if (results && results.length > 0) {
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

    await supabaseAdmin.from('api_debug_logs').insert({
      cnae: cnaes.join(', ') || null,
      uf: Array.isArray(uf) ? uf.join(', ') : uf || null,
      municipio: Array.isArray(municipio) ? municipio.join(', ') : municipio || null,
      limite: limit,
      status_http: externalStatus || 200,
      sucesso: true,
      tempo_resposta_ms: timeTakenApi,
      total_resultados: totalCount,
      resposta_json: data,
    })

    return new Response(
      JSON.stringify({
        data: results,
        page: currentPage,
        count: totalCount,
        pages: totalPages,
        cached: false,
        status_http: externalStatus || 200,
        raw_response: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message, data: [], status_http: 500 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
