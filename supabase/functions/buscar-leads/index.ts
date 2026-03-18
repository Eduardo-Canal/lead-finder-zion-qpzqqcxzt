import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

// For demonstration purposes, we will use a diverse pool of valid CNPJs to simulate a database.
// The search function will fetch real data from external APIs for these CNPJs and then apply
// the requested filters dynamically.
const MOCK_CNPJS = [
  '00000000000191', // Banco do Brasil
  '33592510000154', // Vale
  '60746948000112', // Bradesco
  '06990590000123', // Google
  '18236120000158', // Nubank
  '07526557000100', // Ambev
  '02558157000162', // Vivo
  '01109184000195', // Itau
  '02421421000111', // TIM
  '33000167000101', // Petrobras
  '00360305000104', // Caixa Economica
  '61532644000115', // Itau Unibanco
  '10222236000100', // Localiza
  '47508411000156', // Pao de Acucar
  '10281711000156', // Porto Seguro
]

async function fetchCnpjData(cnpj: string) {
  // Try BrasilAPI first
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) {
      const data = await res.json()
      return {
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        cnae_fiscal_principal: data.cnae_fiscal_principal_codigo
          ? `${data.cnae_fiscal_principal_codigo} - ${data.cnae_fiscal_principal_descricao}`
          : '',
        cnaes_secundarios:
          data.cnaes_secundarios?.map((c: any) => `${c.codigo} - ${c.descricao}`) || [],
        municipio: data.municipio,
        uf: data.uf,
        porte: data.porte,
        situacao_cadastral:
          data.descricao_situacao_cadastral === 'ATIVA'
            ? 'Ativa'
            : data.descricao_situacao_cadastral || '',
        capital_social: data.capital_social || 0,
        data_abertura: data.data_inicio_atividade,
        email: data.email || '',
        telefone_1: data.ddd_telefone_1 || '',
      }
    }
  } catch (e: any) {
    console.warn(`BrasilAPI failed for ${cnpj}: ${e.message}`)
  }

  // Fallback to CNPJ.ws
  try {
    const res = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) {
      const data = await res.json()
      const est = data.estabelecimento || {}
      return {
        cnpj: est.cnpj,
        razao_social: data.razao_social,
        cnae_fiscal_principal: est.atividade_principal
          ? `${est.atividade_principal.id} - ${est.atividade_principal.descricao}`
          : '',
        cnaes_secundarios:
          est.atividades_secundarias?.map((c: any) => `${c.id} - ${c.descricao}`) || [],
        municipio: est.cidade?.nome,
        uf: est.estado?.sigla,
        porte: data.porte?.descricao,
        situacao_cadastral: est.situacao_cadastral === 'Ativa' ? 'Ativa' : est.situacao_cadastral,
        capital_social: data.capital_social ? Number(data.capital_social) : 0,
        data_abertura: est.data_inicio_atividade,
        email: est.email || '',
        telefone_1: est.telefone1 || '',
      }
    }
  } catch (e: any) {
    console.warn(`CNPJ.ws failed for ${cnpj}: ${e.message}`)
  }

  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const { cnaes, uf, municipio, porte, situacao_cadastral, capital_social_minimo } = payload

    // Fetch all base data in parallel from external APIs
    const promises = MOCK_CNPJS.map((cnpj) => fetchCnpjData(cnpj))
    const results = await Promise.all(promises)

    let leads = results.filter((r): r is NonNullable<typeof r> => r !== null)

    // Apply filters dynamically in memory
    if (cnaes && Array.isArray(cnaes) && cnaes.length > 0) {
      leads = leads.filter((l) => cnaes.some((c) => l.cnae_fiscal_principal?.includes(c)))
    }
    if (uf) {
      leads = leads.filter((l) => l.uf === uf)
    }
    if (municipio) {
      leads = leads.filter((l) => l.municipio?.toLowerCase().includes(municipio.toLowerCase()))
    }
    if (porte) {
      leads = leads.filter((l) => l.porte?.toLowerCase() === porte.toLowerCase())
    }
    if (situacao_cadastral) {
      leads = leads.filter(
        (l) => l.situacao_cadastral?.toLowerCase() === situacao_cadastral.toLowerCase(),
      )
    }
    if (capital_social_minimo !== undefined && capital_social_minimo !== null) {
      leads = leads.filter((l) => l.capital_social >= Number(capital_social_minimo))
    }

    // Limit to 100 results
    leads = leads.slice(0, 100)

    return new Response(JSON.stringify({ data: leads }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
