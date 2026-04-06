import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const { cnpj } = payload

    if (!cnpj) {
      return new Response(JSON.stringify({ error: 'CNPJ não fornecido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const cleanCnpj = cnpj.replace(/\D/g, '')

    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`)

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Falha ao buscar dados no provedor externo',
          details: await response.text().catch(() => ''),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const data = await response.json()

    const est = data.estabelecimento || {}

    const rua = [est.tipo_logradouro, est.logradouro].filter(Boolean).join(' ')
    const endereco_completo = [rua, est.numero || 'S/N', est.complemento, est.bairro]
      .filter(Boolean)
      .join(', ')

    let telefone = ''
    if (est.ddd1 && est.telefone1) {
      telefone = `(${est.ddd1}) ${est.telefone1}`
    } else if (est.telefone1) {
      telefone = est.telefone1
    }

    const result = {
      razao_social: data.razao_social || '',
      nome_fantasia: est.nome_fantasia || data.nome_fantasia || '',
      cnae_fiscal_principal: est.atividade_principal
        ? `${est.atividade_principal.id} - ${est.atividade_principal.descricao}`
        : '',
      municipio: est.cidade?.nome || '',
      uf: est.estado?.sigla || '',
      cep: est.cep || '',
      porte: data.porte?.descricao || '',
      situacao_cadastral:
        est.situacao_cadastral === 'Ativa' ? 'Ativa' : est.situacao_cadastral || '',
      capital_social: data.capital_social ? Number(data.capital_social) : 0,
      data_abertura: est.data_inicio_atividade || '',
      email: est.email || '',
      telefone,
      endereco_completo,
      socios: (data.socios || []).map((s: any) => ({
        nome: s.nome || s.razao_social || '',
        qualificacao: s.qualificacao_socio?.descricao || '',
        data_entrada: s.data_entrada || '',
      })),
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
