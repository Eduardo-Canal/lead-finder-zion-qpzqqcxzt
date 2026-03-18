import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

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

    const apiKey = Deno.env.get('CASADOSDADOS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'API Key da Casa dos Dados não configurada nos secrets.',
          data: [],
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

    if (
      cnae_fiscal_principal &&
      Array.isArray(cnae_fiscal_principal) &&
      cnae_fiscal_principal.length > 0
    ) {
      casadosDadosPayload.query.atividade_principal = cnae_fiscal_principal
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

    // Changing to the actual active endpoint for standard searches to prevent 404s
    const response = await fetch('https://api.casadosdados.com.br/v2/public/cnpj/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'casadosdados-api-key': apiKey,
        Authorization: `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
      body: JSON.stringify(casadosDadosPayload),
    })

    if (!response.ok) {
      const errText = await response.text()
      let message = `Erro na API Casa dos Dados (${response.status})`

      if (response.status === 404) {
        message =
          'O endpoint de busca está temporariamente indisponível ou alterado na Casa dos Dados.'
      } else if (response.status >= 500) {
        message = 'Serviço externo Casa dos Dados indisponível no momento.'
      }

      console.error('Casa dos Dados Error:', message, errText)

      // Returning 200 with an error object ensures graceful handling on the frontend without a hard runtime crash
      return new Response(JSON.stringify({ error: message, data: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const data = await response.json()

    let rawResults = []
    let totalCount = 0
    let totalPages = 1
    let currentPage = page

    if (data.success !== false && data.data) {
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

    return new Response(
      JSON.stringify({
        data: results,
        page: currentPage,
        count: totalCount,
        pages: totalPages,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('buscar-leads Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message, data: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
