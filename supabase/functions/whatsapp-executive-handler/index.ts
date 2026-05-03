import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { getBitrixWebhookUrl } from '../_shared/get-bitrix-url.ts'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RoutePayload {
  instance_id: string
  conversation_id: string
  message_db_id: string
  message: any
  phone: string
  contact_name: string
  text: string
  msg_type: string
  quoted_message_id: string | null
}

// ─── Buscar entidade Bitrix pelo telefone ─────────────────────────────────────

async function findBitrixEntityByPhone(
  bitrixUrl: string,
  phone: string,
): Promise<{ id: string; tipo: 'lead' | 'contact' | null }> {
  const digits = phone.replace(/\D/g, '')
  const phoneVariants = [digits, digits.startsWith('55') ? digits.slice(2) : `55${digits}`]

  for (const variant of phoneVariants) {
    try {
      // Uma única request retorna LEAD e CONTACT no mesmo resultado
      const res = await fetch(
        `${bitrixUrl}crm.duplicate.findByComm.json?type=PHONE&values[]=${encodeURIComponent(variant)}`,
      )
      const data = await res.json()
      const leads: number[] = data?.result?.LEAD || []
      if (leads.length > 0) return { id: String(leads[0]), tipo: 'lead' }
      const contacts: number[] = data?.result?.CONTACT || []
      if (contacts.length > 0) return { id: String(contacts[0]), tipo: 'contact' }
    } catch {
      // ignora erros de busca
    }
  }

  return { id: '', tipo: null }
}

// ─── Gerar sugestões de co-piloto via GPT-4o-mini ────────────────────────────

async function gerarSugestoesCoPiloto(
  historico: Array<{ role: string; content: string }>,
  mensagemAtual: string,
  nomeContato: string,
  openaiKey: string,
): Promise<string[]> {
  const promptSistema = [
    'Você é um assistente de vendas que ajuda executivos a responder mensagens no WhatsApp.',
    'Com base no histórico da conversa e na última mensagem recebida, sugira 3 respostas possíveis.',
    'As respostas devem ser:',
    '- Curtas (máximo 2 linhas)',
    '- Profissionais mas amigáveis',
    '- Variadas (uma mais direta, uma mais consultiva, uma mais empática)',
    'Retorne APENAS um array JSON com as 3 strings. Sem explicações.',
    `Contexto: conversa com ${nomeContato}.`,
  ].join('\n')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      temperature: 0.8,
      messages: [
        { role: 'system', content: promptSistema },
        ...historico.slice(-8),
        { role: 'user', content: `Última mensagem recebida: "${mensagemAtual}"\n\nGere 3 sugestões de resposta como array JSON.` },
      ],
    }),
  })

  if (!res.ok) throw new Error(`OpenAI ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content?.trim() || '[]'

  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch {
    return []
  }
}

// ─── Formatar mensagem para o Bitrix timeline ────────────────────────────────

function formatarMensagemBitrix(
  text: string,
  msgType: string,
  direcao: 'recebida' | 'enviada',
  contactName: string,
  executivoNome: string,
): string {
  const icon = direcao === 'recebida' ? '📥' : '📤'
  const quem = direcao === 'recebida' ? contactName : executivoNome
  const tipoLabel = msgType !== 'texto' ? ` [${msgType}]` : ''

  return [
    `${icon} [b]WhatsApp${tipoLabel}[/b] — ${quem}`,
    text || '[mídia sem texto]',
  ].join('\n')
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  let payload: RoutePayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { instance_id, conversation_id, message_db_id, phone, contact_name, text, msg_type } = payload

  try {
    // ── 1. Carregar dados da instância executiva ───────────────────────────────
    const [instanceRes, moduleConfigRes, openaiRes, bitrixUrl] = await Promise.all([
      supabase.from('whatsapp_instances')
        .select('instance_key, bitrix_user_id, bitrix_user_nome')
        .eq('id', instance_id).maybeSingle(),
      supabase.from('whatsapp_module_config')
        .select('uazapi_base_url, uazapi_global_token')
        .eq('id', 1).maybeSingle(),
      supabase.from('settings')
        .select('value').eq('key', 'openai_config').maybeSingle(),
      getBitrixWebhookUrl(supabase),
    ])

    const executivo = instanceRes.data
    const openaiKey: string = (openaiRes.data?.value as any)?.api_key || Deno.env.get('OPENAI_API_KEY') || ''

    // ── 2. Buscar entidade Bitrix pelo telefone do contato ─────────────────────
    let bitrixEntityId = ''
    let bitrixEntityType: 'lead' | 'contact' | null = null
    let entityTypeId = 1  // 1=lead, 3=contact

    // Verificar se a conversa já tem entidade vinculada
    const { data: convData } = await supabase
      .from('whatsapp_conversations')
      .select('bitrix_entity_id, bitrix_entity_type')
      .eq('id', conversation_id)
      .maybeSingle()

    if (convData?.bitrix_entity_id) {
      bitrixEntityId = convData.bitrix_entity_id
      bitrixEntityType = (convData.bitrix_entity_type as any) || 'lead'
      entityTypeId = bitrixEntityType === 'contact' ? 3 : 1
    } else if (bitrixUrl) {
      const found = await findBitrixEntityByPhone(bitrixUrl, phone)
      if (found.id) {
        bitrixEntityId = found.id
        bitrixEntityType = found.tipo
        entityTypeId = found.tipo === 'contact' ? 3 : 1

        // Vincular à conversa para não buscar novamente
        await supabase
          .from('whatsapp_conversations')
          .update({ bitrix_entity_id: found.id, bitrix_entity_type: found.tipo || 'lead' })
          .eq('id', conversation_id)
      }
    }

    // ── 3. Registrar mensagem no timeline do Bitrix (se entidade encontrada) ───
    if (bitrixUrl && bitrixEntityId && text) {
      const executivoNome = executivo?.bitrix_user_nome || 'Executivo'
      const comentario = formatarMensagemBitrix(text, msg_type, 'recebida', contact_name, executivoNome)

      fetch(`${bitrixUrl}crm.timeline.comment.add.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            ENTITY_ID:     parseInt(bitrixEntityId),
            ENTITY_TYPE_ID: entityTypeId,
            COMMENT: comentario,
          },
        }),
      }).catch((e) => console.warn('[executive] falha timeline Bitrix:', e))
    }

    // ── 4. Marcar mensagem como processada ────────────────────────────────────
    await supabase
      .from('whatsapp_messages')
      .update({ processado: true })
      .eq('id', message_db_id)

    // ── 5. Gerar sugestões de co-piloto (apenas para mensagens de texto) ───────
    if (msg_type !== 'texto' || !text.trim() || !openaiKey) {
      return new Response('OK', { status: 200 })
    }

    // Buscar histórico recente da conversa
    const { data: historico } = await supabase
      .from('whatsapp_messages')
      .select('direcao, conteudo')
      .eq('conversation_id', conversation_id)
      .eq('tipo', 'texto')
      .order('criado_em', { ascending: false })
      .limit(10)

    const msgs = (historico || []).reverse().filter((m) => m.conteudo).map((m) => ({
      role: m.direcao === 'recebida' ? 'user' : 'assistant',
      content: m.conteudo as string,
    }))

    const sugestoes = await gerarSugestoesCoPiloto(msgs, text, contact_name, openaiKey)
      .catch((e) => {
        console.warn('[executive] falha ao gerar sugestões:', e.message)
        return [] as string[]
      })

    if (sugestoes.length > 0) {
      // Buscar message_db_id como UUID para a FK
      const { data: msgRow } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('id', message_db_id)
        .maybeSingle()

      await supabase.from('whatsapp_ai_suggestions').insert({
        conversation_id: conversation_id,
        message_id:      msgRow?.id || null,
        sugestoes:       sugestoes,
        contexto:        text.slice(0, 200),
      })

      console.log(`[executive] ${sugestoes.length} sugestões geradas para ${phone}`)
    }

    return new Response('OK', { status: 200 })

  } catch (err: any) {
    console.error('[executive] erro:', err.message)
    return new Response('OK', { status: 200 })
  }
})
