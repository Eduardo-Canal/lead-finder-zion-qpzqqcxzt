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
    const { cnae_fiscal_principal, uf, limit = 10, page = 1, bypass_cache = false } = payload

    // Feature: Data Integrity Preservation - Do NOT remove special characters
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

    // Admin client to bypass RLS for logging
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: config } = await supabase
      .from('configuracoes_sistema')
      .select('casadosdados_api_token')
      .eq('id', 1)
      .maybeSingle()

    const apiKey = config?.casadosdados_api_token || Deno.env.get('CASADOSDADOS_API_KEY')

    const payloadToHash = { cnaes, uf: uf || null, limit, page }
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
          uf: uf || null,
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
            isMock: false,
            status_http: 200,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    // Feature: Payload Optimization - Exact structure required
    const casadosDadosPayload: any = {
      cnaes: cnaes,
      limite: limit || 10,
    }

    if (uf && uf !== 'Todos') {
      casadosDadosPayload.uf = uf
    }

    let data
    let isMock = false
    let externalStatus = 200
    const fetchStart = performance.now()
    let timeTakenApi = 0

    if (apiKey) {
      try {
        // Feature: Header Authentication standardization
        const tokenFormatted = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`

        // Feature: Endpoint Update to v5
        const response = await fetch('https://api.casadosdados.com.br/v5/cnpj/pesquisa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: tokenFormatted,
          },
          body: JSON.stringify(casadosDadosPayload),
        })

        timeTakenApi = Math.round(performance.now() - fetchStart)
        externalStatus = response.status

        if (!response.ok) {
          let errorMsg = `Erro na API: ${response.status} ${response.statusText}`
          if (response.status === 401 || response.status === 403) {
            errorMsg = 'Token Inválido ou Não Autorizado'
          } else if (response.status === 429) {
            errorMsg = 'Limite de Requisições Excedido'
          } else if (response.status === 404) {
            errorMsg = 'Endpoint não encontrado (verifique a URL)'
          } else if (response.status === 400) {
            errorMsg = 'Requisição inválida (verifique o formato do CNAE e limites)'
          }

          let errorData = null
          try {
            errorData = await response.json()
          } catch (e) {}

          const finalError = { error: errorMsg, details: errorData }

          await supabaseAdmin.from('api_debug_logs').insert({
            cnae: cnaes.join(', ') || null,
            uf: uf || null,
            limite: limit,
            status_http: response.status,
            sucesso: false,
            tempo_resposta_ms: timeTakenApi,
            total_resultados: 0,
            resposta_json: finalError,
          })

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
          uf: uf || null,
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
            isMock: false,
            status_http: 500,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
        )
      }
    }

    if (!data || data.error) {
      if (apiKey) {
        const finalError = data?.error || 'Formato de resposta inesperado da API.'
        await supabaseAdmin.from('api_debug_logs').insert({
          cnae: cnaes.join(', ') || null,
          uf: uf || null,
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
            isMock: false,
            status_http: externalStatus || 500,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
        )
      }

      isMock = true
      const isTargetCnae = cnaes.some((c) => c.includes('4683'))
      const fallbackCount = isTargetCnae ? Math.min(6, limit) : limit

      const mockResults = Array.from({ length: fallbackCount }).map((_, i) => {
        const id = (page - 1) * limit + i + 1
        return {
          cnpj: `12.345.678/0001-${10 + i}`,
          razao_social: isTargetCnae
            ? `COMÉRCIO DE DEFENSIVOS AGRÍCOLAS ${id} LTDA`
            : `Empresa Exemplo ${id} LTDA (Demonstração)`,
          nome_fantasia: isTargetCnae ? `AGRO DEFENSIVOS ${id}` : `Exemplo ${id}`,
          cnae_fiscal_principal: cnaes[0] || '4683-4/00',
          municipio: 'SÃO PAULO',
          uf: uf || 'SP',
          porte: 'DEMAIS',
          situacao_cadastral: 'ATIVA',
          capital_social: 50000,
          email: `contato${id}@exemplo.com.br`,
          telefone: `11988887777`,
        }
      })

      data = { success: true, data: mockResults, count: fallbackCount, pages: 1, page: page }
    }

    // Response Handling flexibility
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

    if (!isMock) {
      await supabaseAdmin.from('api_debug_logs').insert({
        cnae: cnaes.join(', ') || null,
        uf: uf || null,
        limite: limit,
        status_http: externalStatus || 200,
        sucesso: true,
        tempo_resposta_ms: timeTakenApi,
        total_resultados: totalCount,
        resposta_json: data,
      })
    }

    return new Response(
      JSON.stringify({
        data: results,
        page: currentPage,
        count: totalCount,
        pages: totalPages,
        cached: false,
        isMock,
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
