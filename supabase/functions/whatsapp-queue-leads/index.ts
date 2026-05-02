import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

// ─── Autorização ──────────────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const secret = Deno.env.get('WHATSAPP_SCHEDULER_SECRET') || 'zion-whatsapp-local-2026'
  const auth = req.headers.get('Authorization') || ''
  return auth === `Bearer ${secret}`
}

// ─── Substituição de variáveis de template ────────────────────────────────────

function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '')
}

// ─── Extrair telefone limpo ───────────────────────────────────────────────────

function extractPhone(lead: Record<string, any>): string | null {
  const raw: string = lead.telefone || lead.dados_completos?.telefone || ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10) return null
  // Garante prefixo 55 (Brasil)
  return digits.startsWith('55') ? digits : `55${digits}`
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  if (!isAuthorized(req)) return new Response('Unauthorized', { status: 401 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    // ── 1. Buscar instância principal conectada ────────────────────────────────
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('tipo', 'principal')
      .eq('ativo', true)
      .eq('status', 'conectado')
      .maybeSingle()

    if (!instance) {
      console.log('[queue-leads] nenhuma instância principal conectada — abortando')
      return new Response(JSON.stringify({ ok: true, enfileirados: 0, motivo: 'sem instancia' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 2. Buscar campanhas ativas com WhatsApp habilitado ─────────────────────
    const { data: campanhas } = await supabase
      .from('automacao_config')
      .select('id, whatsapp_template, whatsapp_delay_min, whatsapp_delay_max, whatsapp_limite_diario')
      .eq('ativo', true)
      .eq('whatsapp_ativo', true)

    if (!campanhas || campanhas.length === 0) {
      return new Response(JSON.stringify({ ok: true, enfileirados: 0, motivo: 'sem campanhas' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let totalEnfileirados = 0

    for (const campanha of campanhas) {
      if (!campanha.whatsapp_template) continue

      // ── 3. Quantos já foram enviados hoje nesta campanha ──────────────────
      const hoje = new Date()
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()

      const { count: enviadosHoje } = await supabase
        .from('whatsapp_send_queue')
        .select('id', { count: 'exact', head: true })
        .eq('automacao_config_id', campanha.id)
        .in('status', ['enviado', 'enviando'])
        .gte('criado_em', inicioHoje)

      const slotsDisponiveis = (campanha.whatsapp_limite_diario || 50) - (enviadosHoje || 0)
      if (slotsDisponiveis <= 0) {
        console.log(`[queue-leads] campanha ${campanha.id} atingiu limite diário`)
        continue
      }

      // ── 4. Leads elegíveis: enviado_bitrix, sem whatsapp_status, com telefone ─
      const { data: leads } = await supabase
        .from('leads_automacao_pendentes')
        .select('id, razao_social, cnpj, municipio, uf, porte, telefone, sugestao_abordagem, dados_completos')
        .eq('automacao_config_id', campanha.id)
        .eq('status', 'enviado_bitrix')
        .is('whatsapp_status', null)
        .limit(slotsDisponiveis)

      if (!leads || leads.length === 0) continue

      // ── 5. Calcular horários escalonados com delays aleatórios ─────────────
      // Começa a partir de agora + delay para não disparar tudo de uma vez
      let proximoEnvio = new Date()
      let enfileiradosCampanha = 0

      for (const lead of leads) {
        const phone = extractPhone(lead)
        if (!phone) {
          console.log(`[queue-leads] lead ${lead.cnpj} sem telefone válido — ignorado`)
          continue
        }

        // Template substitution
        const nomeEmpresa = lead.razao_social || ''
        const vars: Record<string, string> = {
          nome:       nomeEmpresa.split(' ')[0] || nomeEmpresa,
          empresa:    nomeEmpresa,
          cnpj:       lead.cnpj || '',
          municipio:  lead.municipio || '',
          uf:         lead.uf || '',
          porte:      lead.porte || '',
          abordagem:  lead.sugestao_abordagem || '',
        }
        const mensagem = applyTemplate(campanha.whatsapp_template, vars)

        // Adicionar delay aleatório para este item
        const delayMin = (campanha.whatsapp_delay_min || 45) * 1000
        const delayMax = (campanha.whatsapp_delay_max || 90) * 1000
        const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin
        proximoEnvio = new Date(proximoEnvio.getTime() + delay)

        const { error: queueError } = await supabase
          .from('whatsapp_send_queue')
          .insert({
            instance_id:         instance.id,
            automacao_config_id: campanha.id,
            lead_cnpj:           lead.cnpj,
            phone,
            contact_name:        nomeEmpresa,
            mensagem,
            status:              'pendente',
            agendado_para:       proximoEnvio.toISOString(),
          })

        if (queueError) {
          console.error(`[queue-leads] erro ao enfileirar ${lead.cnpj}:`, queueError.message)
          continue
        }

        // Marcar lead como na_fila
        await supabase
          .from('leads_automacao_pendentes')
          .update({ whatsapp_status: 'na_fila', whatsapp_phone: phone })
          .eq('id', lead.id)

        enfileiradosCampanha++
        totalEnfileirados++
      }

      console.log(`[queue-leads] campanha ${campanha.id}: ${enfileiradosCampanha} leads enfileirados`)
    }

    return new Response(JSON.stringify({ ok: true, enfileirados: totalEnfileirados }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('[queue-leads] erro:', err.message)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
