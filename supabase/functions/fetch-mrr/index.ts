import { createSupabaseAdmin } from '../_shared/supabase-admin.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FETCH_TIMEOUT_MS = 25000
const BASE_URL = 'https://api-v2.contaazul.com'

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Timeout ao conectar com ${url} (>${FETCH_TIMEOUT_MS / 1000}s)`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function getStoredTokens(supabaseAdmin: any) {
  const { data } = await supabaseAdmin
    .from('tokens_contaazul')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .maybeSingle()
  return data
}

async function loadContaAzulCredentials(supabaseAdmin: any) {
  let clientId = Deno.env.get('CLIENT_ID') || ''
  let clientSecret = Deno.env.get('CLIENT_SECRET') || ''

  try {
    const { data } = await supabaseAdmin
      .from('abc_curve_config')
      .select('config')
      .eq('type', 'conta_azul')
      .maybeSingle()

    if (data?.config) {
      clientId = String(data.config.client_id || clientId)
      clientSecret = String(data.config.client_secret || clientSecret)
    }
  } catch {
    // fallback to env only
  }

  return { clientId, clientSecret }
}

async function refreshAccessToken(supabaseAdmin: any, refreshToken: string) {
  const tokenUrl = 'https://auth.contaazul.com/oauth2/token'
  const credentials = await loadContaAzulCredentials(supabaseAdmin)
  const payload = new URLSearchParams()
  payload.set('grant_type', 'refresh_token')
  payload.set('refresh_token', refreshToken)
  payload.set('client_id', credentials.clientId)
  payload.set('client_secret', credentials.clientSecret)

  const res = await fetchWithTimeout(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(JSON.stringify(data))

  await supabaseAdmin.from('tokens_contaazul').upsert({
    id: '00000000-0000-0000-0000-000000000001',
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_in
      ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  return data
}

async function getAccessToken(supabaseAdmin: any) {
  const stored = await getStoredTokens(supabaseAdmin)
  if (!stored) {
    throw new Error('Nenhum token Conta Azul registrado. Faça o fluxo de autenticação OAuth.')
  }

  if (stored.expires_at && new Date(stored.expires_at) < new Date()) {
    if (!stored.refresh_token) {
      throw new Error('Token expirado e refresh token não encontrado.')
    }
    const refreshed = await refreshAccessToken(supabaseAdmin, stored.refresh_token)
    return refreshed.access_token
  }

  return stored.access_token
}

async function callApi(accessToken: string, path: string) {
  const url = `${BASE_URL}${path}`
  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(JSON.stringify(data))
  return data
}

async function buscarPessoaPorCnpj(accessToken: string, cnpj: string): Promise<any | null> {
  const res = await callApi(accessToken, `/v1/pessoas?documento=${encodeURIComponent(cnpj)}&size=50`)
  const items: any[] = Array.isArray(res) ? res : (res.items || res.data || [])
  const cnpjLimpo = cnpj.replace(/\D/g, '')
  return items.find((p: any) => (p.documento || '').replace(/\D/g, '') === cnpjLimpo) ?? null
}

const PALAVRAS_IGNORADAS = new Set([
  // Sufixos jurídicos
  'ltda', 'ltda.', 's.a.', 'sa', 's/a', 'eireli', 'me', 'epp', 'inc', 'epp.',
  // Preposições / artigos
  'e', 'de', 'do', 'da', 'dos', 'das', 'em', 'com', 'the', '-', 'para',
  // Termos genéricos do setor logístico / comercial
  'logistica', 'logísticas', 'logístico', 'transportes', 'transporte',
  'comercio', 'comércio', 'importacao', 'exportacao', 'importação', 'exportação',
  'industria', 'indústria', 'servicos', 'serviços', 'solucoes', 'soluções',
  'express', 'cargo', 'cargas', 'brasil', 'nacional', 'group', 'grupo',
  'holding', 'armazens', 'armazéns', 'distribuicao', 'distribuição',
])

function palavrasSignificativas(nome: string): string[] {
  return nome.toLowerCase().split(/[\s\-\/]+/).filter(p => p.length > 2 && !PALAVRAS_IGNORADAS.has(p))
}

function similaridadeNomes(nomeA: string, nomeB: string): number {
  const palavrasA = new Set(palavrasSignificativas(nomeA))
  const palavrasB = new Set(palavrasSignificativas(nomeB))
  if (!palavrasA.size || !palavrasB.size) return 0
  let coincidencias = 0
  for (const p of palavrasA) {
    if (palavrasB.has(p)) coincidencias++
  }
  return coincidencias / Math.min(palavrasA.size, palavrasB.size)
}

// Busca por nome quando o CNPJ não localiza — retorna apenas resultado com alta similaridade de nome
async function buscarPessoaPorNome(accessToken: string, nomeOriginal: string): Promise<any | null> {
  const nomeTrimmed = nomeOriginal.trim()
  if (!nomeTrimmed) return null

  const palavras = palavrasSignificativas(nomeTrimmed)
  if (palavras.length < 2) return null

  // Busca pelas 2 primeiras palavras mais específicas (evita termos genéricos como "logística")
  const termoBusca = palavras.slice(0, 2).join(' ')

  const res = await callApi(accessToken, `/v1/pessoas?nome=${encodeURIComponent(termoBusca)}&size=20`)
  const items: any[] = Array.isArray(res) ? res : (res.items || res.data || [])
  if (!items.length) return null

  // Encontra o candidato com maior similaridade e exige mínimo de 50%
  let melhorCandidato: any = null
  let melhorSimilaridade = 0

  for (const item of items) {
    if (!item.documento?.replace(/\D/g, '')) continue
    const sim = similaridadeNomes(nomeTrimmed, item.nome || '')
    if (sim > melhorSimilaridade) {
      melhorSimilaridade = sim
      melhorCandidato = item
    }
  }

  return melhorSimilaridade >= 0.5 ? melhorCandidato : null
}

async function buscarContratosPorPessoa(accessToken: string, pessoaId: string): Promise<any[]> {
  const dataInicio = '2015-01-01'
  const dataFim = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const path = `/v1/contratos?pessoa_id=${encodeURIComponent(pessoaId)}&data_inicio=${dataInicio}&data_fim=${dataFim}&size=100`
  const res = await callApi(accessToken, path)
  const todos: any[] = Array.isArray(res) ? res : (res.itens || res.items || res.data || [])
  return todos.filter((c: any) => !c.cliente?.id || c.cliente.id === pessoaId)
}

function normalizeContratos(rawContratos: any[]): any[] {
  return rawContratos.map((c: any) => {
    const valor = Number(c.total ?? c.total_proximo_vencimento ?? c.valor ?? c.amount ?? 0)
    return {
      id: c.id ?? null,
      descricao: c.descricao ?? c.nome ?? (c.numero ? `Contrato #${c.numero}` : ''),
      valor: Number.isFinite(valor) ? valor : 0,
      status: c.status ?? c.situacao ?? 'DESCONHECIDO',
      periodicidade: c.termos?.tipo_expiracao ?? c.periodicidade ?? null,
    }
  })
}

async function registrarDivergencia(
  supabaseAdmin: any,
  client: any,
  cnpjContaAzul: string,
  nomeContaAzul: string,
  mrr: number,
  contratos: any[],
) {
  // Verifica se já existe divergência pendente para este cliente
  const { data: existing } = await supabaseAdmin
    .from('cnpj_divergencias')
    .select('id,cnpj_contaazul')
    .eq('bitrix_id', client.bitrix_id)
    .eq('status', 'pendente')
    .maybeSingle()

  const cnpjBitrix = client.cnpj?.replace(/\D/g, '') || ''

  if (existing?.id) {
    // Atualiza se o CNPJ do Conta Azul mudou
    if (existing.cnpj_contaazul !== cnpjContaAzul) {
      await supabaseAdmin
        .from('cnpj_divergencias')
        .eq('id', existing.id)
        .update({ cnpj_contaazul: cnpjContaAzul, nome_contaazul: nomeContaAzul, mrr, contratos, detectado_em: new Date().toISOString() })
    }
  } else {
    await supabaseAdmin.from('cnpj_divergencias').insert({
      bitrix_id: client.bitrix_id,
      company_name: client.company_name,
      cnpj_bitrix: cnpjBitrix,
      cnpj_contaazul: cnpjContaAzul,
      nome_contaazul: nomeContaAzul,
      mrr,
      contratos,
      status: 'pendente',
    })
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const supabaseAdmin = createSupabaseAdmin()
    const token = await getAccessToken(supabaseAdmin)

    const cnpjs = Array.isArray(body.cnpjs) && body.cnpjs.length > 0 ? body.cnpjs : []
    const sincronizadoPor: string | null = body.user_id || null
    const sincronizadoPorNome: string | null = body.user_name || null

    const clientsRes = await supabaseAdmin
      .from('bitrix_clients_zion')
      .select('id,bitrix_id,company_name,cnpj,porte')
      .not('cnpj', 'is', null)
      .list()

    const clients = (clientsRes.data ?? []).filter((c: any) => c.cnpj?.replace(/\D/g, ''))
    const cnpjsLimpos = cnpjs.map((c: string) => c.replace(/\D/g, ''))
    const targets = cnpjsLimpos.length > 0
      ? clients.filter((c: any) => cnpjsLimpos.includes(c.cnpj?.replace(/\D/g, '')))
      : clients

    const results: any[] = []
    const agora = new Date().toISOString()
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

    for (const client of targets) {
      const cnpj = client.cnpj?.replace(/\D/g, '')
      if (!cnpj) continue

      await sleep(300)

      try {
        let pessoa = await buscarPessoaPorCnpj(token, cnpj)
        let divergenciaCnpj = false

        // Não encontrado por CNPJ — tenta por nome para detectar divergência
        if (!pessoa?.id) {
          await sleep(300)
          const pessoaPorNome = await buscarPessoaPorNome(token, client.company_name || '')

          if (pessoaPorNome?.id) {
            const cnpjContaAzul = (pessoaPorNome.documento || '').replace(/\D/g, '')
            const nomeContaAzul = pessoaPorNome.nome || pessoaPorNome.name || ''

            // Carrega contratos para registrar na divergência
            await sleep(300)
            const rawContratos = await buscarContratosPorPessoa(token, pessoaPorNome.id)
            const contratos = normalizeContratos(rawContratos)
            const mrr = contratos.reduce((sum, c) => sum + c.valor, 0)

            await registrarDivergencia(supabaseAdmin, client, cnpjContaAzul, nomeContaAzul, mrr, contratos)

            results.push({
              cnpj,
              success: false,
              divergencia: true,
              message: `CNPJ divergente: Bitrix=${cnpj} / ContaAzul=${cnpjContaAzul}`,
              cnpj_contaazul: cnpjContaAzul,
              nome_contaazul: nomeContaAzul,
              mrr,
            })
          } else {
            results.push({ cnpj, success: false, message: 'Cliente não encontrado no Conta Azul' })
          }
          continue
        }

        // Encontrado por CNPJ — verifica se o CNPJ do Conta Azul bate exatamente
        const cnpjContaAzulRetornado = (pessoa.documento || '').replace(/\D/g, '')
        if (cnpjContaAzulRetornado && cnpjContaAzulRetornado !== cnpj) {
          divergenciaCnpj = true
        }

        const rawContratos = await buscarContratosPorPessoa(token, pessoa.id)
        const contratos = normalizeContratos(rawContratos)
        const mrr = contratos.reduce((sum, c) => sum + c.valor, 0)
        const nomeCliente = pessoa.nome || pessoa.name || client.company_name || ''

        if (divergenciaCnpj) {
          await registrarDivergencia(supabaseAdmin, client, cnpjContaAzulRetornado, nomeCliente, mrr, contratos)
        }

        // Atualiza cache
        const { data: existingCache } = await supabaseAdmin
          .from('contaazul_cache')
          .select('id')
          .eq('cnpj', cnpj)
          .maybeSingle()

        if (existingCache?.id) {
          await supabaseAdmin.from('contaazul_cache')
            .eq('id', existingCache.id)
            .update({
              nome_cliente: nomeCliente,
              mrr,
              contratos,
              atualizado_em: agora,
              sincronizado_por: sincronizadoPor,
              sincronizado_por_nome: sincronizadoPorNome,
            })
        } else {
          await supabaseAdmin.from('contaazul_cache').insert({
            cnpj,
            nome_cliente: nomeCliente,
            mrr,
            contratos,
            atualizado_em: agora,
            sincronizado_por: sincronizadoPor,
            sincronizado_por_nome: sincronizadoPorNome,
          })
        }

        // Grava histórico
        await supabaseAdmin.from('contaazul_sync_historico').insert({
          cnpj,
          nome_cliente: nomeCliente,
          mrr,
          contratos,
          sincronizado_em: agora,
          sincronizado_por: sincronizadoPor,
          sincronizado_por_nome: sincronizadoPorNome,
        })

        // Atualiza bitrix_clients_zion
        await supabaseAdmin
          .from('bitrix_clients_zion')
          .eq('id', client.id)
          .update({ mrr, company_name: client.company_name ?? nomeCliente })

        results.push({ cnpj, success: true, mrr, nome_cliente: nomeCliente, contratos })
      } catch (clientErr: any) {
        results.push({ cnpj, success: false, message: clientErr.message || String(clientErr) })
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'MRR atualizado', data: results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: error.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
