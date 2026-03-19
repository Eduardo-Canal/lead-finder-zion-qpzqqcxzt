import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cnpj } = await req.json()

    if (!cnpj) {
      throw new Error('CNPJ não fornecido')
    }

    const cleanCnpj = cnpj.replace(/\D/g, '')

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
      throw new Error('API Indisponível. Token da API Casa dos Dados não configurado.')
    }

    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`)

    if (!response.ok) {
      throw new Error('Falha ao buscar dados no provedor externo (CNPJ.ws)')
    }

    const data = await response.json()

    const est = data.estabelecimento || {}

    const enderecoParts = [est.tipo_logradouro, est.logradouro].filter(Boolean).join(' ')

    const numero = est.numero || 'S/N'
    const complemento = est.complemento ? ` - ${est.complemento}` : ''

    const cidadeInfo = est.cidade?.nome ? `${est.cidade.nome} - ${est.estado?.sigla}` : ''
    const cep = est.cep ? `CEP: ${est.cep}` : ''

    const endereco_completo = [
      `${enderecoParts}, ${numero}${complemento}`,
      est.bairro,
      cidadeInfo,
      cep,
    ]
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
      cnae_fiscal_principal: est.atividade_principal
        ? `${est.atividade_principal.id} - ${est.atividade_principal.descricao}`
        : '',
      municipio: est.cidade?.nome || '',
      uf: est.estado?.sigla || '',
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
      status: 400,
    })
  }
})
