import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const { cnaes, uf, municipio, porte, situacao_cadastral, page = 1, limit = 10 } = payload

    const apiKey = Deno.env.get('CASADOSDADOS_API_KEY')
    if (!apiKey) {
      throw new Error(
        'API Key da Casa dos Dados não configurada nos secrets (CASADOSDADOS_API_KEY).',
      )
    }

    const casadosDadosPayload: any = {
      query: {
        termo: [],
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

    if (cnaes && Array.isArray(cnaes) && cnaes.length > 0) {
      casadosDadosPayload.query.atividade_principal = cnaes
    }
    if (uf) {
      casadosDadosPayload.query.uf = [uf]
    }
    if (municipio) {
      casadosDadosPayload.query.municipio = [municipio.toUpperCase()]
    }
    if (situacao_cadastral) {
      casadosDadosPayload.query.situacao_cadastral = situacao_cadastral.toUpperCase()
    }
    if (porte) {
      casadosDadosPayload.query.porte = [porte.toUpperCase()]
    }

    // Pass the limit to the Casa dos Dados API payload
    if (limit) {
      casadosDadosPayload.limit = limit
      casadosDadosPayload.per_page = limit
      casadosDadosPayload.size = limit
    }

    const response = await fetch('https://api.casadosdados.com.br/v2/public/cnpj/pesquisa', {
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
      throw new Error(`Erro na API Casa dos Dados (${response.status}): ${errText}`)
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

    // Explicitly enforce the result limit threshold to ensure state consistency
    const results = rawResults.slice(0, limit).map((empresa: any) => ({
      cnpj: empresa.cnpj,
      razao_social: empresa.razao_social || empresa.nome_fantasia || '',
      cnae_fiscal_principal: empresa.cnae_fiscal_principal || empresa.atividade_principal || '',
      municipio: empresa.municipio,
      uf: empresa.uf,
      porte: empresa.porte || '',
      situacao_cadastral: empresa.situacao_cadastral,
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
