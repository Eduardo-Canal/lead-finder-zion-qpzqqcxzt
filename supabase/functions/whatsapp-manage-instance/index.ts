import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

// ─── Helpers uazapi.dev ────────────────────────────────────────────────────────

async function uazapiRequest(
  baseUrl: string,
  token: string,
  path: string,
  method = 'GET',
  body?: any,
): Promise<any> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.message || data?.error || data?.msg || data?.detail || data?.description
    throw new Error(msg ? String(msg) : `uazapi HTTP ${res.status}: ${JSON.stringify(data)}`)
  }
  return data
}

/**
 * Para o tier gratuito (free.uazapi.com), cada instância tem seu próprio token.
 * As operações por instância usam esse token diretamente na URL base (sem /instance/{key}).
 * Para servidor dedicado (pago), usa o token global com /instance/{key}/{op}.
 */
function instanceApiRequest(
  baseUrl: string,
  globalToken: string,
  instanceKey: string,
  instanceToken: string | null | undefined,
  operation: string,
  method = 'GET',
  body?: any,
): Promise<any> {
  if (instanceToken?.trim()) {
    return uazapiRequest(baseUrl, instanceToken.trim(), operation, method, body)
  }
  return uazapiRequest(baseUrl, globalToken, `/instance/${instanceKey}${operation}`, method, body)
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: moduleConfig } = await supabase
      .from('whatsapp_module_config')
      .select('uazapi_base_url, uazapi_global_token')
      .eq('id', 1)
      .maybeSingle()

    const baseUrl = moduleConfig?.uazapi_base_url || 'https://free.uazapi.com'
    const globalToken = moduleConfig?.uazapi_global_token || ''

    const payload = await req.json().catch(() => ({}))
    const { action } = payload

    // ── LIST ─────────────────────────────────────────────────────────────────
    if (action === 'list') {
      const { data: instances, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('criado_em', { ascending: true })

      if (error) throw error
      return json({ instances: instances || [] })
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    if (action === 'create') {
      const {
        nome, tipo, bitrix_user_id, bitrix_user_nome, profile_user_id,
        instance_key: providedKey, instance_token: providedToken,
      } = payload

      if (!nome) return json({ error: 'Campo "nome" obrigatório' }, 400)

      let instanceKey: string
      let uazapiRes: any = null

      if (providedKey?.trim()) {
        instanceKey = providedKey.trim()
      } else {
        if (!globalToken) return json({ error: 'Token uazapi não configurado. Configure em Configurações > WhatsApp.' }, 400)
        const nomeSlug = nome.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'inst'
        instanceKey = `zion${nomeSlug}${Date.now().toString(36)}`
        uazapiRes = await uazapiRequest(baseUrl, globalToken, '/instance/create', 'POST', {
          instanceName: instanceKey,
        })
      }

      const { data: instance, error: insertError } = await supabase
        .from('whatsapp_instances')
        .insert({
          nome,
          tipo: tipo || 'executivo',
          instance_key: instanceKey,
          instance_token: providedToken?.trim() || null,
          status: 'desconectado',
          bitrix_user_id: bitrix_user_id || null,
          bitrix_user_nome: bitrix_user_nome || null,
          profile_user_id: profile_user_id || null,
        })
        .select()
        .single()

      if (insertError) throw insertError
      return json({ instance, uazapi: uazapiRes })
    }

    // ── UPDATE_TOKEN — salvar token da instância ──────────────────────────────
    if (action === 'update_token') {
      const { instance_id, instance_token } = payload
      if (!instance_id) return json({ error: 'instance_id obrigatório' }, 400)

      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ instance_token: instance_token?.trim() || null, atualizado_em: new Date().toISOString() })
        .eq('id', instance_id)

      if (error) throw error
      return json({ success: true })
    }

    // ── QR ────────────────────────────────────────────────────────────────────
    if (action === 'qr') {
      const { instance_id } = payload
      if (!instance_id) return json({ error: 'instance_id obrigatório' }, 400)

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_key, instance_token, status')
        .eq('id', instance_id)
        .maybeSingle()

      if (!instance) return json({ error: 'Instância não encontrada' }, 404)
      if (!instance.instance_token && !globalToken) {
        return json({ error: 'Token da instância não configurado. Informe o Instance Token obtido no painel uazapi.dev.' }, 400)
      }

      await supabase
        .from('whatsapp_instances')
        .update({ status: 'conectando', atualizado_em: new Date().toISOString() })
        .eq('id', instance_id)

      const qrRes = await instanceApiRequest(
        baseUrl, globalToken, instance.instance_key, instance.instance_token, '/qr',
      )

      return json({ qr: qrRes?.qrcode || qrRes?.base64 || qrRes?.qr || qrRes })
    }

    // ── STATUS ────────────────────────────────────────────────────────────────
    if (action === 'status') {
      const { instance_id } = payload
      if (!instance_id) return json({ error: 'instance_id obrigatório' }, 400)

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_key, instance_token')
        .eq('id', instance_id)
        .maybeSingle()

      if (!instance) return json({ error: 'Instância não encontrada' }, 404)

      const statusRes = await instanceApiRequest(
        baseUrl, globalToken, instance.instance_key, instance.instance_token, '/status',
      )

      const rawStatus: string = statusRes?.state || statusRes?.status || statusRes?.connection || ''
      const connected = rawStatus === 'open' || rawStatus === 'connected'
      const newStatus = connected ? 'conectado' : 'desconectado'

      await supabase
        .from('whatsapp_instances')
        .update({
          status: newStatus,
          ultimo_ping: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', instance_id)

      return json({ status: newStatus, raw: rawStatus })
    }

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    if (action === 'disconnect') {
      const { instance_id } = payload
      if (!instance_id) return json({ error: 'instance_id obrigatório' }, 400)

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_key, instance_token')
        .eq('id', instance_id)
        .maybeSingle()

      if (!instance) return json({ error: 'Instância não encontrada' }, 404)

      if (instance.instance_token || globalToken) {
        await instanceApiRequest(
          baseUrl, globalToken, instance.instance_key, instance.instance_token, '/logout', 'DELETE',
        ).catch(() => {/* ignora se já estava desconectado */})
      }

      await supabase
        .from('whatsapp_instances')
        .update({ status: 'desconectado', numero: '', atualizado_em: new Date().toISOString() })
        .eq('id', instance_id)

      return json({ success: true })
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (action === 'delete') {
      const { instance_id } = payload
      if (!instance_id) return json({ error: 'instance_id obrigatório' }, 400)

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_key, instance_token, tipo')
        .eq('id', instance_id)
        .maybeSingle()

      if (!instance) return json({ error: 'Instância não encontrada' }, 404)

      // Para servidor dedicado (pago) com admin token, remove via API
      if (globalToken && !instance.instance_token) {
        await uazapiRequest(baseUrl, globalToken, `/instance/${instance.instance_key}/delete`, 'DELETE')
          .catch(() => {})
      }

      await supabase
        .from('whatsapp_instances')
        .update({ ativo: false, status: 'desconectado', atualizado_em: new Date().toISOString() })
        .eq('id', instance_id)

      return json({ success: true })
    }

    // ── UPDATE_NUMBER ─────────────────────────────────────────────────────────
    if (action === 'update_number') {
      const { instance_id, numero } = payload
      if (!instance_id || !numero) return json({ error: 'instance_id e numero obrigatórios' }, 400)

      await supabase
        .from('whatsapp_instances')
        .update({ numero, status: 'conectado', atualizado_em: new Date().toISOString() })
        .eq('id', instance_id)

      return json({ success: true })
    }

    // ── SAVE_CONFIG ───────────────────────────────────────────────────────────
    if (action === 'save_config') {
      const {
        uazapi_base_url, uazapi_global_token, horario_inicio, horario_fim,
        dias_semana, responsavel_bitrix_id, responsavel_nome, prompt_base,
      } = payload

      const updates: any = { atualizado_em: new Date().toISOString() }
      if (uazapi_base_url !== undefined) updates.uazapi_base_url = uazapi_base_url
      if (uazapi_global_token !== undefined) updates.uazapi_global_token = uazapi_global_token
      if (horario_inicio !== undefined) updates.horario_inicio = horario_inicio
      if (horario_fim !== undefined) updates.horario_fim = horario_fim
      if (dias_semana !== undefined) updates.dias_semana = dias_semana
      if (responsavel_bitrix_id !== undefined) updates.responsavel_bitrix_id = responsavel_bitrix_id
      if (responsavel_nome !== undefined) updates.responsavel_nome = responsavel_nome
      if (prompt_base !== undefined) updates.prompt_base = prompt_base

      const { error } = await supabase.from('whatsapp_module_config').update(updates).eq('id', 1)
      if (error) throw error
      return json({ success: true })
    }

    // ── GET_CONFIG ────────────────────────────────────────────────────────────
    if (action === 'get_config') {
      const { data: config, error } = await supabase
        .from('whatsapp_module_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (error) throw error
      return json({ config })
    }

    return json({ error: `Ação desconhecida: ${action}` }, 400)
  } catch (err: any) {
    console.error('whatsapp-manage-instance error:', err)
    return json({ error: err.message }, 500)
  }
})

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
