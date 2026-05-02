import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { getBitrixWebhookUrl } from '../_shared/get-bitrix-url.ts'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RoutePayload {
  instance_id: string
  conversation_id: string
  message_db_id: string
  message: any
  phone: string           // group_id (sem @g.us)
  contact_name: string
  is_group: boolean
  group_id: string
  text: string
  msg_type: string
  quoted_message_id: string | null
}

interface LeadDados {
  nome: string
  empresa: string
  cargo: string
  telefone: string
  email: string
  website: string
  cnpj: string
  observacoes: string
}

// ─── OCR via GPT-4o Vision ────────────────────────────────────────────────────

async function extractBusinessCard(
  imageBase64: string,
  caption: string,
  openaiKey: string,
): Promise<LeadDados> {
  const promptText = [
    'Extraia as informações do crachá ou cartão de visita nesta imagem.',
    'Retorne APENAS um JSON válido com os campos:',
    '{ "nome": "", "empresa": "", "cargo": "", "telefone": "", "email": "", "website": "", "cnpj": "", "observacoes": "" }',
    'Campos não encontrados devem ficar como string vazia.',
    'Não inclua explicações, apenas o JSON.',
    caption ? `\nAnotação do executivo sobre este contato: "${caption}"` : '',
  ].filter(Boolean).join('\n')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) throw new Error(`OpenAI respondeu ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content?.trim() || '{}'

  try {
    // Remove possível markdown ```json ... ```
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned) as LeadDados
  } catch {
    return { nome: '', empresa: '', cargo: '', telefone: '', email: '', website: '', cnpj: '', observacoes: caption }
  }
}

// ─── Download de mídia via uazapi.dev ─────────────────────────────────────────

async function downloadMedia(
  baseUrl: string,
  globalToken: string,
  instanceKey: string,
  messageId: string,
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/instance/${instanceKey}/media/${messageId}`
  const res = await fetch(url, {
    headers: { token: globalToken },
  })
  if (!res.ok) throw new Error(`Falha ao baixar mídia: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

// ─── Deduplicação Bitrix24 ────────────────────────────────────────────────────

async function findDuplicateLead(
  bitrixUrl: string,
  telefone: string,
  email: string,
): Promise<string | null> {
  const checks: Array<{ type: string; value: string }> = []
  if (telefone) checks.push({ type: 'PHONE', value: telefone.replace(/\D/g, '') })
  if (email) checks.push({ type: 'EMAIL', value: email })

  for (const check of checks) {
    try {
      const res = await fetch(
        `${bitrixUrl}crm.duplicate.findByComm.json?type=${check.type}&values[]=${encodeURIComponent(check.value)}`,
      )
      const data = await res.json()
      const leads: number[] = data?.result?.LEAD || []
      if (leads.length > 0) return String(leads[0])
    } catch {
      // continua para próxima verificação
    }
  }
  return null
}

// ─── Criar Lead no Bitrix24 ──────────────────────────────────────────────────

async function createBitrixLead(
  bitrixUrl: string,
  dados: LeadDados,
  caption: string,
  groupNome: string,
  automacaoConfigId: string | null,
): Promise<string> {
  const anoAtual = new Date().getFullYear()
  const titulo = dados.empresa
    ? `[${dados.empresa}] Feira / ${anoAtual}`
    : `[Lead Feira] ${anoAtual}`

  const comentario = [
    `[b]LEAD CAPTURADO EM FEIRA — ${groupNome}[/b]`,
    '',
    dados.nome     ? `[b]Nome:[/b] ${dados.nome}` : '',
    dados.empresa  ? `[b]Empresa:[/b] ${dados.empresa}` : '',
    dados.cargo    ? `[b]Cargo:[/b] ${dados.cargo}` : '',
    dados.telefone ? `[b]Telefone:[/b] ${dados.telefone}` : '',
    dados.email    ? `[b]E-mail:[/b] ${dados.email}` : '',
    dados.website  ? `[b]Site:[/b] ${dados.website}` : '',
    dados.cnpj     ? `[b]CNPJ:[/b] ${dados.cnpj}` : '',
    caption        ? `\n[b]Observação do executivo:[/b] ${caption}` : '',
    dados.observacoes && dados.observacoes !== caption
      ? `[b]Observações IA:[/b] ${dados.observacoes}` : '',
  ].filter(Boolean).join('\n')

  const fields: Record<string, any> = {
    TITLE: titulo,
    NAME: dados.nome.split(' ')[0] || dados.nome,
    LAST_NAME: dados.nome.split(' ').slice(1).join(' ') || '',
    COMPANY_TITLE: dados.empresa,
    POST: dados.cargo,
    OPENED: 'Y',
    SOURCE_ID: 'B24_APPLICATION',
    UTM_SOURCE: 'Lead Finder Zion — Feira',
    COMMENTS: comentario,
  }

  if (dados.telefone) {
    fields.PHONE = [{ VALUE: dados.telefone, VALUE_TYPE: 'WORK' }]
  }
  if (dados.email) {
    fields.EMAIL = [{ VALUE: dados.email, VALUE_TYPE: 'WORK' }]
  }
  if (dados.website) {
    fields.WEB = [{ VALUE: dados.website, VALUE_TYPE: 'WORK' }]
  }
  if (dados.cnpj) {
    fields.UF_CRM_LEAD_1644319583429 = dados.cnpj.replace(/\D/g, '')
  }

  const res = await fetch(`${bitrixUrl}crm.lead.add.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })

  const data = await res.json()
  if (!res.ok || !data.result) throw new Error(`Bitrix crm.lead.add falhou: ${JSON.stringify(data)}`)
  return String(data.result)
}

// ─── Enviar mensagem no grupo ──────────────────────────────────────────────────

async function sendGroupMessage(
  baseUrl: string,
  globalToken: string,
  instanceKey: string,
  groupJid: string,
  text: string,
): Promise<void> {
  await fetch(`${baseUrl.replace(/\/$/, '')}/message/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: globalToken,
    },
    body: JSON.stringify({
      instanceName: instanceKey,
      number: groupJid,
      text,
    }),
  }).catch((e) => console.warn('Falha ao enviar mensagem no grupo:', e))
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

  const {
    instance_id,
    conversation_id,
    message_db_id,
    message,
    group_id,
    text,
    msg_type,
    quoted_message_id,
  } = payload

  try {
    // ── 1. Verificar se grupo está configurado ──────────────────────────────
    const { data: groupConfig } = await supabase
      .from('whatsapp_group_config')
      .select('id, nome, automacao_config_id, instance_id')
      .eq('group_id', group_id)
      .eq('ativo', true)
      .maybeSingle()

    if (!groupConfig) {
      console.log(`[group-handler] grupo ${group_id} não configurado — ignorado`)
      return new Response('OK', { status: 200 })
    }

    // ── 2. Carregar dependências ────────────────────────────────────────────
    const [moduleConfigRes, instanceRes, openaiRes, bitrixUrl] = await Promise.all([
      supabase.from('whatsapp_module_config').select('uazapi_base_url, uazapi_global_token').eq('id', 1).maybeSingle(),
      supabase.from('whatsapp_instances').select('instance_key').eq('id', instance_id).maybeSingle(),
      supabase.from('settings').select('value').eq('key', 'openai_config').maybeSingle(),
      getBitrixWebhookUrl(supabase),
    ])

    const baseUrl = moduleConfigRes.data?.uazapi_base_url || 'https://api.uazapi.dev'
    const globalToken = moduleConfigRes.data?.uazapi_global_token || ''
    const instanceKey = instanceRes.data?.instance_key || ''
    const openaiKey: string = (openaiRes.data?.value as any)?.api_key || Deno.env.get('OPENAI_API_KEY') || ''
    const groupJid = `${group_id}@g.us`

    // ── 3. Resposta quotada → adicionar observação ao lead existente ────────
    if (msg_type === 'texto' && quoted_message_id && text.trim()) {
      const { data: originalMsg } = await supabase
        .from('whatsapp_messages')
        .select('metadata')
        .eq('message_id', quoted_message_id)
        .maybeSingle()

      const bitrixLeadId = originalMsg?.metadata?.bitrix_lead_id
      if (bitrixLeadId) {
        await fetch(`${bitrixUrl}crm.timeline.comment.add.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              ENTITY_ID: parseInt(bitrixLeadId),
              ENTITY_TYPE_ID: 1,
              COMMENT: `[b]Observação do executivo (via grupo ${groupConfig.nome}):[/b]\n${text}`,
            },
          }),
        }).catch((e) => console.warn('Falha ao adicionar comment Bitrix:', e))

        console.log(`[group-handler] observação adicionada ao lead ${bitrixLeadId}`)
      }
      return new Response('OK', { status: 200 })
    }

    // ── 4. Mensagem de imagem → OCR + criar lead ────────────────────────────
    if (msg_type !== 'imagem' && !message?.message?.imageMessage) {
      return new Response('OK', { status: 200 })
    }

    if (!openaiKey) {
      console.warn('[group-handler] OpenAI key não configurada')
      return new Response('OK', { status: 200 })
    }

    // 4a. Obter imagem em base64
    let imageBase64 = message?.mediaBase64 || ''
    if (!imageBase64 && globalToken && instanceKey) {
      try {
        imageBase64 = await downloadMedia(baseUrl, globalToken, instanceKey, message.key.id)
      } catch (e) {
        console.warn('[group-handler] falha ao baixar mídia:', e)
      }
    }

    if (!imageBase64) {
      console.warn('[group-handler] sem base64 disponível para OCR')
      return new Response('OK', { status: 200 })
    }

    // 4b. Caption do executivo
    const caption = message?.message?.imageMessage?.caption || message?.caption || ''

    // 4c. OCR via GPT-4o Vision
    let dados: LeadDados
    try {
      dados = await extractBusinessCard(imageBase64, caption, openaiKey)
    } catch (e: any) {
      console.error('[group-handler] OCR falhou:', e.message)
      if (globalToken && instanceKey) {
        await sendGroupMessage(baseUrl, globalToken, instanceKey, groupJid,
          '⚠️ Não consegui ler o crachá. Tente uma foto mais nítida.')
      }
      return new Response('OK', { status: 200 })
    }

    // 4d. Deduplicação no Bitrix
    const existingLeadId = await findDuplicateLead(bitrixUrl, dados.telefone, dados.email)
    let bitrixLeadId: string

    if (existingLeadId) {
      bitrixLeadId = existingLeadId
      // Adiciona observação ao lead já existente
      await fetch(`${bitrixUrl}crm.timeline.comment.add.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            ENTITY_ID: parseInt(existingLeadId),
            ENTITY_TYPE_ID: 1,
            COMMENT: `[b]Contato reencontrado na ${groupConfig.nome}[/b]\n${caption ? `Obs: ${caption}` : ''}`,
          },
        }),
      }).catch(() => {})
    } else {
      // 4e. Criar lead no Bitrix
      bitrixLeadId = await createBitrixLead(
        bitrixUrl,
        dados,
        caption,
        groupConfig.nome,
        groupConfig.automacao_config_id,
      )
    }

    // 4f. Vincular message_db_id ao lead (para respostas futuras)
    await supabase
      .from('whatsapp_messages')
      .update({
        processado: true,
        metadata: {
          bitrix_lead_id: bitrixLeadId,
          lead_duplicado: !!existingLeadId,
          lead_dados: dados,
        },
      })
      .eq('id', message_db_id)

    // 4g. Confirmação no grupo
    if (globalToken && instanceKey) {
      const linhas = [
        existingLeadId
          ? `♻️ Lead já existia no Bitrix (ID ${bitrixLeadId}) — observação adicionada.`
          : `✅ Lead cadastrado no Bitrix (ID ${bitrixLeadId})`,
        '',
        dados.nome     ? `👤 *${dados.nome}*` : '',
        dados.empresa  ? `🏢 ${dados.empresa}` : '',
        dados.cargo    ? `💼 ${dados.cargo}` : '',
        dados.telefone ? `📱 ${dados.telefone}` : '',
        dados.email    ? `📧 ${dados.email}` : '',
        '',
        '_Responda esta mensagem para adicionar observações ao lead._',
      ].filter((l) => l !== undefined).join('\n')

      await sendGroupMessage(baseUrl, globalToken, instanceKey, groupJid, linhas)
    }

    console.log(`[group-handler] lead ${bitrixLeadId} (${existingLeadId ? 'existente' : 'novo'}) — ${dados.nome || 'sem nome'}`)
    return new Response('OK', { status: 200 })

  } catch (err: any) {
    console.error('[group-handler] erro:', err.message)
    return new Response('OK', { status: 200 })
  }
})
