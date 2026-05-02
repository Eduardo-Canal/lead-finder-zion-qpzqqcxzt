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
    stanzaId?: string          // ID da mensagem quotada
    quotedMessage?: Record<string, unknown>
    participant?: string       // em grupos: quem enviou
  }
  // uazapi v2 pode trazer mídia já em base64 ou URL
  mediaUrl?: string
  mediaBase64?: string
}

interface WaWebhookPayload {
  event: string
  instance: string       // instance_key configurado no create
  data: {
    messages?: WaMessage[]
    // connection.update
    state?: string
    phoneNumber?: string
    // outros eventos
    [key: string]: unknown
  }
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
  if (!secret) return true  // sem secret configurado aceita tudo (dev)
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
    // Atualiza nome do contato e timestamp se diferente
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

// ─── Handler de connection.update ────────────────────────────────────────────

async function handleConnectionUpdate(
  supabase: ReturnType<typeof createClient>,
  instanceKey: string,
  data: WaWebhookPayload['data'],
): Promise<void> {
  const rawState: string = (data.state as string) || ''
  const connected = rawState === 'open' || rawState === 'connected'
  const phone: string = (data.phoneNumber as string) || ''

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

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Webhook só aceita POST
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
      return new Response('OK', { status: 200 })  // aceita mas ignora
    }

    // ── 2. Evento de conexão ────────────────────────────────────────────────
    if (event === 'connection.update') {
      await handleConnectionUpdate(supabase, instanceKey, data)
      return new Response('OK', { status: 200 })
    }

    // ── 3. Evento de mensagem ───────────────────────────────────────────────
    if (event === 'messages.upsert' && Array.isArray(data.messages)) {
      for (const msg of data.messages) {
        const jid: string = msg.key?.remoteJid || ''
        if (!jid) continue

        // Mensagens de status do WhatsApp são ignoradas
        if (jid === 'status@broadcast') continue

        const fromMe: boolean = msg.key.fromMe === true
        const phone = cleanPhone(jid)
        const contactName = msg.pushName || phone
        const isGroupMsg = isGroup(jid)

        // ── 3a. Buscar/criar conversa ───────────────────────────────────────
        const conversation = await upsertConversation(
          supabase,
          instance.id,
          phone,
          contactName,
          null,
        )

        // ── 3b. Salvar mensagem ─────────────────────────────────────────────
        const messageDbId = await saveMessage(
          supabase,
          conversation.id,
          msg,
          fromMe ? 'enviada' : 'recebida',
        )

        // ── 3c. Roteamento ──────────────────────────────────────────────────
        // Só processa mensagens RECEBIDAS — enviadas são apenas logadas
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
          // → Módulo Feira (T04)
          await invokeSubHandler(supabaseUrl, serviceRoleKey, 'whatsapp-group-handler', routePayload)
        } else if (instance.tipo === 'executivo') {
          // → Monitoramento executivo + co-piloto (T16)
          await invokeSubHandler(supabaseUrl, serviceRoleKey, 'whatsapp-executive-handler', routePayload)
        } else {
          // → Chatbot / resposta leads (T10–T14)
          await invokeSubHandler(supabaseUrl, serviceRoleKey, 'whatsapp-bot-handler', routePayload)
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err: any) {
    console.error('[webhook-router] erro:', err.message)
    // Sempre retorna 200 para o uazapi.dev não ficar reprocessando
    return new Response('OK', { status: 200 })
  }
})
