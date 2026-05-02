import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface QueueItem {
  id: string
  instance_id: string
  automacao_config_id: string | null
  lead_cnpj: string | null
  phone: string
  contact_name: string | null
  mensagem: string
  tentativas: number
  max_tentativas: number
}

interface ModuleConfig {
  uazapi_base_url: string
  uazapi_global_token: string
  horario_inicio: string  // 'HH:MM'
  horario_fim: string     // 'HH:MM'
  dias_semana: number[]   // 0=dom, 1=seg ... 6=sab
}

// ─── Autorização ──────────────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const secret = Deno.env.get('WHATSAPP_SCHEDULER_SECRET') || 'zion-whatsapp-local-2026'
  const auth = req.headers.get('Authorization') || ''
  return auth === `Bearer ${secret}`
}

// ─── Verificar horário comercial ──────────────────────────────────────────────

function isBusinessHour(config: ModuleConfig): boolean {
  const now = new Date()
  const diaSemana = now.getDay()  // 0=dom ... 6=sab
  if (!config.dias_semana.includes(diaSemana)) return false

  const [hIni, mIni] = config.horario_inicio.split(':').map(Number)
  const [hFim, mFim] = config.horario_fim.split(':').map(Number)
  const minAtual = now.getHours() * 60 + now.getMinutes()
  const minIni = hIni * 60 + mIni
  const minFim = hFim * 60 + mFim

  return minAtual >= minIni && minAtual < minFim
}

// ─── Enviar mensagem via uazapi.dev ───────────────────────────────────────────

async function sendWhatsAppMessage(
  baseUrl: string,
  globalToken: string,
  instanceKey: string,
  phone: string,
  text: string,
): Promise<void> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/message/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: globalToken,
    },
    body: JSON.stringify({
      instanceName: instanceKey,
      number: phone,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`uazapi respondeu ${res.status}: ${body}`)
  }
}

// ─── Contar envios de hoje para uma campanha ──────────────────────────────────

async function countEnviadosHoje(
  supabase: ReturnType<typeof createClient>,
  automacaoConfigId: string,
): Promise<number> {
  const hoje = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()

  const { count } = await supabase
    .from('whatsapp_send_queue')
    .select('id', { count: 'exact', head: true })
    .eq('automacao_config_id', automacaoConfigId)
    .in('status', ['enviado', 'enviando'])
    .gte('enviado_em', inicioHoje)

  return count || 0
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  if (!isAuthorized(req)) return new Response('Unauthorized', { status: 401 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    // ── 1. Carregar configuração do módulo ────────────────────────────────────
    const { data: moduleConfig } = await supabase
      .from('whatsapp_module_config')
      .select('uazapi_base_url, uazapi_global_token, horario_inicio, horario_fim, dias_semana')
      .eq('id', 1)
      .maybeSingle()

    if (!moduleConfig) {
      console.warn('[send-scheduler] módulo WhatsApp não configurado')
      return new Response(JSON.stringify({ ok: true, enviados: 0, motivo: 'sem config' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const config = moduleConfig as ModuleConfig

    // ── 2. Verificar horário comercial ────────────────────────────────────────
    if (!isBusinessHour(config)) {
      console.log('[send-scheduler] fora do horário comercial — abortando')
      return new Response(JSON.stringify({ ok: true, enviados: 0, motivo: 'fora horario' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!config.uazapi_global_token) {
      console.warn('[send-scheduler] token uazapi não configurado')
      return new Response(JSON.stringify({ ok: true, enviados: 0, motivo: 'sem token' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 3. Buscar instância principal conectada ───────────────────────────────
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_key')
      .eq('tipo', 'principal')
      .eq('ativo', true)
      .eq('status', 'conectado')
      .maybeSingle()

    if (!instance?.instance_key) {
      console.log('[send-scheduler] nenhuma instância principal conectada')
      return new Response(JSON.stringify({ ok: true, enviados: 0, motivo: 'sem instancia' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 4. Buscar itens vencidos na fila ──────────────────────────────────────
    // Limita a 10 por execução (a cada 5 min) para não sobrecarregar
    const agora = new Date().toISOString()
    const { data: items } = await supabase
      .from('whatsapp_send_queue')
      .select('id, instance_id, automacao_config_id, lead_cnpj, phone, contact_name, mensagem, tentativas, max_tentativas')
      .eq('status', 'pendente')
      .eq('instance_id', instance.id)
      .lte('agendado_para', agora)
      .order('agendado_para', { ascending: true })
      .limit(10)

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ ok: true, enviados: 0, motivo: 'fila vazia' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Cache de contagem de envios por campanha (evita múltiplas queries)
    const limiteCache: Record<string, { enviados: number; limite: number }> = {}

    let totalEnviados = 0
    let totalErros = 0

    for (const item of items as QueueItem[]) {
      // ── 5. Verificar limite diário por campanha ─────────────────────────
      if (item.automacao_config_id) {
        if (!limiteCache[item.automacao_config_id]) {
          // Buscar configuração de limite da campanha
          const { data: camp } = await supabase
            .from('automacao_config')
            .select('whatsapp_limite_diario')
            .eq('id', item.automacao_config_id)
            .maybeSingle()

          const enviados = await countEnviadosHoje(supabase, item.automacao_config_id)
          limiteCache[item.automacao_config_id] = {
            enviados,
            limite: camp?.whatsapp_limite_diario || 50,
          }
        }

        const cache = limiteCache[item.automacao_config_id]
        if (cache.enviados >= cache.limite) {
          console.log(`[send-scheduler] campanha ${item.automacao_config_id} atingiu limite diário — cancelando item`)
          await supabase
            .from('whatsapp_send_queue')
            .update({ status: 'cancelado', erro_mensagem: 'Limite diário atingido', atualizado_em: new Date().toISOString() })
            .eq('id', item.id)
          continue
        }
      }

      // ── 6. Marcar como enviando (lock otimista) ─────────────────────────
      const { error: lockError } = await supabase
        .from('whatsapp_send_queue')
        .update({ status: 'enviando', atualizado_em: new Date().toISOString() })
        .eq('id', item.id)
        .eq('status', 'pendente')  // garante que não foi pego por outra execução

      if (lockError) continue  // outro processo pegou primeiro

      try {
        // ── 7. Enviar mensagem ────────────────────────────────────────────
        await sendWhatsAppMessage(
          config.uazapi_base_url,
          config.uazapi_global_token,
          instance.instance_key,
          item.phone,
          item.mensagem,
        )

        // ── 8. Marcar como enviado ────────────────────────────────────────
        await supabase
          .from('whatsapp_send_queue')
          .update({
            status:      'enviado',
            enviado_em:  new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', item.id)

        // ── 9. Atualizar status do lead ───────────────────────────────────
        if (item.lead_cnpj && item.automacao_config_id) {
          await supabase
            .from('leads_automacao_pendentes')
            .update({
              whatsapp_status:    'enviado',
              whatsapp_enviado_em: new Date().toISOString(),
            })
            .eq('cnpj', item.lead_cnpj)
            .eq('automacao_config_id', item.automacao_config_id)
        }

        // Atualizar cache de contagem
        if (item.automacao_config_id && limiteCache[item.automacao_config_id]) {
          limiteCache[item.automacao_config_id].enviados++
        }

        totalEnviados++
        console.log(`[send-scheduler] enviado para ${item.phone} (${item.contact_name || item.lead_cnpj})`)

      } catch (sendErr: any) {
        console.error(`[send-scheduler] falha ao enviar para ${item.phone}:`, sendErr.message)
        totalErros++

        const novasTentativas = (item.tentativas || 0) + 1
        const statusFinal = novasTentativas >= (item.max_tentativas || 3) ? 'erro' : 'pendente'

        // Se erro permanente, atualiza lead também
        if (statusFinal === 'erro' && item.lead_cnpj && item.automacao_config_id) {
          await supabase
            .from('leads_automacao_pendentes')
            .update({ whatsapp_status: 'erro' })
            .eq('cnpj', item.lead_cnpj)
            .eq('automacao_config_id', item.automacao_config_id)
        }

        // Reagendar com backoff exponencial (tentativas × 5 min)
        const backoffMs = novasTentativas * 5 * 60 * 1000
        const proximaTentativa = new Date(Date.now() + backoffMs).toISOString()

        await supabase
          .from('whatsapp_send_queue')
          .update({
            status:        statusFinal,
            tentativas:    novasTentativas,
            erro_mensagem: sendErr.message,
            agendado_para: statusFinal === 'pendente' ? proximaTentativa : null,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', item.id)
      }
    }

    console.log(`[send-scheduler] concluído — enviados: ${totalEnviados}, erros: ${totalErros}`)
    return new Response(
      JSON.stringify({ ok: true, enviados: totalEnviados, erros: totalErros }),
      { headers: { 'Content-Type': 'application/json' } },
    )

  } catch (err: any) {
    console.error('[send-scheduler] erro geral:', err.message)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
