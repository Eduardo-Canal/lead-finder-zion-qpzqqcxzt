import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface WaMessage {
  key: {
    remoteJid: string   // número@s.whatsapp.net ou grupo@g.us
    fromMe: boolean
    id: string
  }
  messageType: string
  message?: {
    conversation?: string
    extendedTextMessage?: { text: string }
    imageMessage?: { caption?: string; mimetype: string }
    documentMessage?: { caption?: string; fileName?: string }
    audioMessage?: Record<string, unknown>
    videoMessage?: { caption?: string }
    stickerMessage?: Record<string, unknown>
  }
  messageTimestamp?: number
  pushName?: string
  contextInfo?: {
    stanzaId?: string
    quotedMessage?: Record<string, unknown>
    participant?: string
  }
  mediaUrl?: string
  mediaBase64?: string
}

interface WaWebhookPayload {
  event: string
  instance: string
  data: Record<string, unknown>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isGroup(jid: string): boolean {
  return jid.endsWith('@g.us')
}

function cleanPhone(jid: string): string {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '')
}

function extractText(msg: WaMessage): string {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.documentMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ''
  )
}

function extractMsgType(msg: WaMessage): string {
  if (msg.messageType) return msg.messageType
  if (msg.message?.conversation || msg.message?.extendedTextMessage) return 'texto'
  if (msg.message?.imageMessage) return 'imagem'
  if (msg.message?.documentMessage) return 'documento'
  if (msg.message?.audioMessage) return 'audio'
  if (msg.message?.videoMessage) return 'video'
  if (msg.message?.stickerMessage) return 'sticker'
  return 'texto'
}

// ─── Verificação de segurança ─────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const secret = Deno.env.get('WHATSAPP_WEBHOOK_SECRET') || ''
  if (!secret) return true
  const url = new URL(req.url)
  return url.searchParams.get('secret') === secret
}

// ─── Sub-handlers (invocados de forma assíncrona) ─────────────────────────────

async function invokeSubHandler(
  supabaseUrl: string,
  serviceRoleKey: string,
  functionName: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.warn(`Sub-handler ${functionName} falhou:`, err)
  }
}

// ─── Buscar ou criar conversa ─────────────────────────────────────────────────

async function upsertConversation(
  supabase: ReturnType<typeof createClient>,
  instanceId: string,
  phone: string,
  contactName: string,
  automacaoConfigId: string | null,
): Promise<{ id: string; estado: string; bot_ativo: boolean }> {
  const { data: existing } = await supabase
    .from('whatsapp_conversations')
    .select('id, estado, bot_ativo')
    .eq('instance_id', instanceId)
    .eq('phone', phone)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('whatsapp_conversations')
      .update({ contact_name: contactName, ultimo_contato: new Date().toISOString() })
      .eq('id', existing.id)
    return existing
  }

  const { data: created, error } = await supabase
    .from('whatsapp_conversations')
    .insert({
      instance_id: instanceId,
      phone,
      contact_name: contactName,
      estado: 'INICIO',
      bot_ativo: true,
      automacao_config_id: automacaoConfigId,
      ultimo_contato: new Date().toISOString(),
    })
    .select('id, estado, bot_ativo')
    .single()

  if (error) throw error
  return created
}

// ─── Salvar mensagem ──────────────────────────────────────────────────────────

async function saveMessage(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  msg: WaMessage,
  direcao: 'recebida' | 'enviada',
): Promise<string> {
  const tipo = extractMsgType(msg)
  const conteudo = extractText(msg)
  const quotedId = msg.contextInfo?.stanzaId || null
  const mediaUrl = msg.mediaUrl || null

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .upsert(
      {
        conversation_id: conversationId,
        message_id: msg.key.id,
        quoted_message_id: quotedId,
        direcao,
        tipo: ['texto', 'imagem', 'documento', 'audio', 'video', 'sticker'].includes(tipo)
          ? tipo
          : 'texto',
        conteudo: conteudo || null,
        caption: msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || null,
        media_url: mediaUrl,
        processado: false,
      },
      { onConflict: 'message_id' },
    )
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

// ─── Handler de connection event ──────────────────────────────────────────────

async function handleConnectionEvent(
  supabase: ReturnType<typeof createClient>,
  instanceKey: string,
  data: Record<string, unknown>,
): Promise<void> {
  // Suporta ambos os formatos: { state, phoneNumber } e { instance: { status }, status: { jid } }
  const rawState =
    (data.state as string) ||
    (data.instance as any)?.status ||
    (data.status as any)?.state ||
    ''

  const connected = rawState === 'open' || rawState === 'connected'

  const jid = (data.status as any)?.jid || ''
  const phone =
    (data.phoneNumber as string) ||
    (jid ? jid.split('@')[0] : '') ||
    ''

  const updates: Record<string, unknown> = {
    status: connected ? 'conectado' : 'desconectado',
    ultimo_ping: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  }
  if (connected && phone) updates.numero = phone

  await supabase
    .from('whatsapp_instances')
    .update(updates)
    .eq('instance_key', instanceKey)
}

// ─── Normalizar mensagens do payload ─────────────────────────────────────────
// uazapi pode enviar: { data: { messages: [...] } } (array)
//                  ou: { data: { key: ..., message: ... } }  (mensagem direta)

function extractMessages(data: Record<string, unknown>): WaMessage[] {
  if (Array.isArray(data.messages)) return data.messages as WaMessage[]
  if (data.key) return [data as unknown as WaMessage]
  return []
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  if (!isAuthorized(req)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  let payload: WaWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { event, instance: instanceKey, data } = payload
  console.log(`[webhook-router] evento=${event} instância=${instanceKey}`)

  try {
    // ── 1. Buscar instância no banco ────────────────────────────────────────
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id, tipo, ativo')
      .eq('instance_key', instanceKey)
      .eq('ativo', true)
      .maybeSingle()

    if (!instance) {
      console.warn(`[webhook-router] instância desconhecida: ${instanceKey}`)
      return new Response('OK', { status: 200 })
    }

    // ── 2. Evento de conexão ────────────────────────────────────────────────
    // Aceita tanto "connection" (uazapi docs) como "connection.update" (legado)
    if (event === 'connection' || event === 'connection.update') {
      await handleConnectionEvent(supabase, instanceKey, data)
      return new Response('OK', { status: 200 })
    }

    // ── 3. Evento de mensagem ───────────────────────────────────────────────
    // Aceita tanto "messages" (uazapi docs) como "messages.upsert" (legado)
    if (event === 'messages' || event === 'messages.upsert') {
      const messages = extractMessages(data)

      for (const msg of messages) {
        const jid: string = msg.key?.remoteJid || ''
        if (!jid || jid === 'status@broadcast') continue

        const fromMe: boolean = msg.key.fromMe === true
        const phone = cleanPhone(jid)
        const contactName = msg.pushName || phone
        const isGroupMsg = isGroup(jid)

        const conversation = await upsertConversation(
          supabase, instance.id, phone, contactName, null,
        )

        const messageDbId = await saveMessage(
          supabase, conversation.id, msg, fromMe ? 'enviada' : 'recebida',
        )

        if (fromMe) continue

        const routePayload = {
          instance_id: instance.id,
          instance_tipo: instance.tipo,
          conversation_id: conversation.id,
          conversation_estado: conversation.estado,
          bot_ativo: conversation.bot_ativo,
          message_db_id: messageDbId,
          message: msg,
          phone,
          contact_name: contactName,
          is_group: isGroupMsg,
          group_id: isGroupMsg ? phone : null,
          text: extractText(msg),
          msg_type: extractMsgType(msg),
          quoted_message_id: msg.contextInfo?.stanzaId || null,
        }

        if (isGroupMsg) {
          await invokeSubHandler(supabaseUrl, serviceRoleKey, 'whatsapp-group-handler', routePayload)
        } else if (instance.tipo === 'executivo') {
          await invokeSubHandler(supabaseUrl, serviceRoleKey, 'whatsapp-executive-handler', routePayload)
        } else {
          await invokeSubHandler(supabaseUrl, serviceRoleKey, 'whatsapp-bot-handler', routePayload)
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err: any) {
    console.error('[webhook-router] erro:', err.message)
    return new Response('OK', { status: 200 })
  }
})
