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

    // Strictly sanitize CNAEs to be numeric only as required by Casa dos Dados
    const cnaes = Array.isArray(cnae_fiscal_principal)
      ? cnae_fiscal_principal
          .map((c) => (typeof c === 'string' ? c.replace(/\D/g, '') : String(c).replace(/\D/g, '')))
          .filter(Boolean)
      : []

    if (!cnaes || cnaes.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'O filtro de CNAE é obrigatório.',
          cnpjs: [],
          page,
          count: 0,
          pages: 0,
          cached: false,
          status_http: 400,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

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
            cnpjs: cachedData.resultados,
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
      pagina: page || 1,
    }

    casadosDadosPayload.codigo_atividade_principal = cnaes

    if (uf && uf !== 'Todos') {
      casadosDadosPayload.uf = Array.isArray(uf) ? uf : [uf]
    }
    if (municipio && municipio !== 'Todos') {
      casadosDadosPayload.municipio = Array.isArray(municipio) ? municipio : [municipio]
    }

    // Inclusion of status filtering in the search request
    casadosDadosPayload.situacao_cadastral = situacao_cadastral
      ? Array.isArray(situacao_cadastral)
        ? situacao_cadastral
        : [situacao_cadastral]
      : ['ATIVA']

    let data
    let externalStatus = 200
    const fetchStart = performance.now()
    let timeTakenApi = 0

    if (apiKey) {
      try {
        let tokenRaw = apiKey.replace(/^Bearer\s+/i, '').trim()

        // Include the query string parameter tipo_resultado=completo in the request URL
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

        timeTakenApi = Math.round(performance.now() - fetchStart)
        externalStatus = response.status

        if (!response.ok) {
          let errorMsg = `Erro na API da Casa dos Dados (${response.status})`
          if (response.status === 401 || response.status === 403) {
            errorMsg =
              'Erro ao buscar leads: Verifique sua chave de API nas Configurações Avançadas.'
          } else if (response.status === 429) {
            errorMsg = 'Erro ao buscar leads: Limite de Requisições Excedido.'
          } else if (response.status === 404) {
            errorMsg = 'Erro ao buscar leads: Endpoint não encontrado.'
          } else if (response.status === 400) {
            errorMsg =
              'Erro ao buscar leads: Verifique o formato do CNAE e os demais filtros aplicados.'
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
              cnpjs: [],
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
            cnpjs: [],
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
          error:
            'Erro ao buscar leads: Token da API não configurado. Adicione nas Configurações Avançadas.',
          cnpjs: [],
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
          cnpjs: [],
          page,
          count: 0,
          pages: 0,
          cached: false,
          status_http: externalStatus || 500,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    let rawResults = data?.cnpjs
    if (!Array.isArray(rawResults)) {
      rawResults = []
    }

    let totalCount = data?.count || rawResults.length
    let totalPages = data?.pages || 1
    let currentPage = data?.page || page

    // Map the returned data, ensuring situacao_cadastral resolves to the proper string
    const results = rawResults.slice(0, limit).map((empresa: any) => {
      let situacao = empresa.situacao_cadastral
      if (typeof situacao === 'object' && situacao?.situacao_atual) {
        situacao = situacao.situacao_atual
      } else if (typeof situacao === 'string') {
        situacao = situacao
      }

      let telefoneFormatado = ''
      if (empresa.telefone) {
        telefoneFormatado = String(empresa.telefone)
      } else if (empresa.ddd_telefone_1 || empresa.telefone_1) {
        const ddd = empresa.ddd_telefone_1 ? `(${empresa.ddd_telefone_1}) ` : ''
        const num = empresa.telefone_1 || ''
        telefoneFormatado = `${ddd}${num}`.trim()
      } else if (empresa.contato_telefone) {
        telefoneFormatado = String(empresa.contato_telefone)
      }

      let emailFormatado = ''
      if (empresa.email) {
        emailFormatado =
          typeof empresa.email === 'string' ? empresa.email : JSON.stringify(empresa.email)
      } else if (empresa.contato_email) {
        emailFormatado = String(empresa.contato_email)
      }

      return {
        cnpj: empresa.cnpj,
        razao_social: empresa.razao_social || empresa.nome_fantasia || '',
        cnae_fiscal_principal: empresa.cnae_fiscal_principal || empresa.atividade_principal || '',
        municipio: empresa.municipio || '',
        uf: empresa.uf || '',
        porte: empresa.porte_empresa || empresa.porte || '',
        situacao_cadastral: situacao,
        capital_social: empresa.capital_social || 0,
        email: emailFormatado,
        telefone: telefoneFormatado,
        data_inicio_atividade: empresa.data_inicio_atividade || empresa.data_abertura || '',
      }
    })

    if (results && results.length > 0) {
      try {
        const expira_em = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        await supabase.from('cache_pesquisas').upsert(
          {
            chave_cache,
            resultados: results,
            total_registros: totalCount,
            expira_em,
            parametros: payloadToHash,
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
        cnpjs: results,
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
    return new Response(JSON.stringify({ error: error.message, cnpjs: [], status_http: 500 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
