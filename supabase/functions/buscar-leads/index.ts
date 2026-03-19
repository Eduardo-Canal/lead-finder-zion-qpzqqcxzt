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
      limit = 10,
    } = payload

    // Sanitization: Ensure CNAE only contains digits to prevent API integration errors
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

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'API Indisponível. Token da API Casa dos Dados não configurado.',
          data: [],
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

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
        atividade_principal: [],
        natureza_juridica: [],
        uf: [],
        municipio: [],
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
      page: page,
    }

    if (cnaeCleaned.length > 0) {
      casadosDadosPayload.query.atividade_principal = cnaeCleaned
    }
    if (uf) {
      casadosDadosPayload.query.uf = [uf]
    }
    if (municipio) {
      casadosDadosPayload.query.municipio = [municipio.toUpperCase()]
    }
    if (situacao_cadastral) {
      casadosDadosPayload.query.situacao_cadastral = situacao_cadastral.toUpperCase()
    } else {
      casadosDadosPayload.query.situacao_cadastral = 'ATIVA'
    }
    if (porte) {
      casadosDadosPayload.query.porte = [porte.toUpperCase()]
    }

    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
      Origin: 'https://casadosdados.com.br',
      Referer: 'https://casadosdados.com.br/',
      'casadosdados-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
      'x-api-key': apiKey,
    }

    let response
    let externalError = null
    try {
      response = await fetch('https://api.casadosdados.com.br/v3/public/cnpj/search', {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(casadosDadosPayload),
      })

      if (!response.ok) {
        response = await fetch('https://api.casadosdados.com.br/v2/public/cnpj/search', {
          method: 'POST',
          headers: fetchHeaders,
          body: JSON.stringify(casadosDadosPayload),
        })
      }

      if (!response.ok) {
        externalError = await response.text()
        throw new Error(`External API Error: ${response.status}`)
      }
    } catch (e: any) {
      console.error('Fetch API error:', e.message, externalError)
      response = null
    }

    let data
    let isMock = false

    if (response) {
      try {
        data = await response.json()
      } catch (e) {
        console.error('Error parsing JSON:', e)
        data = null
      }
    }

    if (!data || data.success === false || data.error) {
      console.log('Using Mock Data due to External API failure or unavailability')
      isMock = true
      const mockResults = Array.from({ length: limit }).map((_, i) => {
        const id = (page - 1) * limit + i + 1
        const randomCnpj = `${Math.floor(Math.random() * 90 + 10)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}/0001-${Math.floor(Math.random() * 90 + 10)}`
        return {
          cnpj: randomCnpj,
          razao_social: `Empresa Exemplo ${id} LTDA (Demonstração)`,
          nome_fantasia: `Exemplo ${id}`,
          cnae_fiscal_principal: cnaeCleaned[0] || '6204000',
          municipio: municipio ? municipio.toUpperCase() : 'SÃO PAULO',
          uf: uf || 'SP',
          porte: porte || 'ME',
          situacao_cadastral: situacao_cadastral || 'ATIVA',
          capital_social: Math.floor(Math.random() * 100000),
          email: `contato${id}@exemplo.com.br`,
          telefone: `119${Math.floor(Math.random() * 90000000 + 10000000)}`,
        }
      })

      data = {
        success: true,
        data: {
          cnpj: mockResults,
          count: 50,
          pages: Math.ceil(50 / limit),
          page: page,
        },
      }
    }

    let rawResults = []
    let totalCount = 0
    let totalPages = 1
    let currentPage = page

    if (data.data && data.data.cnpj) {
      rawResults = data.data.cnpj || []
      totalCount = data.data.count || rawResults.length
      totalPages = data.data.pages || 1
      currentPage = data.data.page || page
    } else if (data.cnpj) {
      rawResults = data.cnpj || []
      totalCount = data.count || rawResults.length
      totalPages = data.pages || 1
    }

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
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})
