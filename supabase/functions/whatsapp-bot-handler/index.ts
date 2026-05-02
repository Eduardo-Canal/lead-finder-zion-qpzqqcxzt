import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { getBitrixWebhookUrl } from '../_shared/get-bitrix-url.ts'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RoutePayload {
  instance_id: string
  conversation_id: string
  conversation_estado: string
  bot_ativo: boolean
  message_db_id: string
  message: any
  phone: string
  contact_name: string
  text: string
  msg_type: string
}

type EstadoBot =
  | 'INICIO'
  | 'CONVERSANDO'
  | 'OFERTA_AGENDAMENTO'
  | 'COLETANDO_DIA'
  | 'COLETANDO_HORARIO'
  | 'AGENDADO'
  | 'HUMANO'

interface Conversa {
  id: string
  estado: EstadoBot
  bot_ativo: boolean
  agendamento_dia: string | null
  agendamento_hora: string | null
  bitrix_entity_id: string | null
  bitrix_entity_type: string | null
  automacao_config_id: string | null
}

// ─── Verificar horário comercial ──────────────────────────────────────────────

function isBusinessHour(
  horarioInicio: string,
  horarioFim: string,
  diasSemana: number[],
): boolean {
  const now = new Date()
  const diaSemana = now.getDay()
  if (!diasSemana.includes(diaSemana)) return false

  const [hIni, mIni] = horarioInicio.split(':').map(Number)
  const [hFim, mFim] = horarioFim.split(':').map(Number)
  const minAtual = now.getHours() * 60 + now.getMinutes()
  return minAtual >= hIni * 60 + mIni && minAtual < hFim * 60 + mFim
}

// ─── Enviar mensagem WhatsApp ─────────────────────────────────────────────────

async function sendMessage(
  baseUrl: string,
  token: string,
  instanceKey: string,
  phone: string,
  text: string,
): Promise<void> {
  await fetch(`${baseUrl.replace(/\/$/, '')}/message/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify({ instanceName: instanceKey, number: phone, text }),
  }).catch((e) => console.warn('[bot] falha ao enviar:', e))
}

// ─── GPT-4o-mini: resposta do chatbot ────────────────────────────────────────

async function gerarRespostaBot(
  historico: Array<{ role: 'user' | 'assistant'; content: string }>,
  promptBase: string,
  openaiKey: string,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        { role: 'system', content: promptBase },
        ...historico,
      ],
    }),
  })

  if (!res.ok) throw new Error(`OpenAI ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

// ─── Analisar resposta para agendamento ───────────────────────────────────────

function extrairDia(texto: string): string | null {
  const meses: Record<string, string> = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
  }
  // Tenta dd/mm ou dd de mês
  const rSlash = texto.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
  if (rSlash) {
    const dia = rSlash[1].padStart(2, '0')
    const mes = rSlash[2].padStart(2, '0')
    const ano = rSlash[3] ? rSlash[3].slice(-2) : new Date().getFullYear().toString().slice(-2)
    return `${dia}/${mes}/${ano.length === 2 ? '20' + ano : ano}`
  }

  const rExt = texto.match(/(\d{1,2})\s+de\s+([a-záàâãéêíóôõúç]+)/i)
  if (rExt) {
    const dia = rExt[1].padStart(2, '0')
    const mesKey = rExt[2].toLowerCase().slice(0, 3)
    const mes = meses[mesKey]
    if (mes) return `${dia}/${mes}/${new Date().getFullYear()}`
  }

  const diasSemana = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'sab', 'segunda-feira', 'terça-feira']
  for (const d of diasSemana) {
    if (texto.toLowerCase().includes(d)) return texto.trim()
  }

  return null
}

function extrairHora(texto: string): string | null {
  const r = texto.match(/(\d{1,2})[h:hH](\d{0,2})/i)
  if (r) {
    const h = r[1].padStart(2, '0')
    const m = (r[2] || '00').padStart(2, '0')
    return `${h}:${m}`
  }
  return null
}

function desejaAtendente(texto: string): boolean {
  const triggers = ['falar com atendente', 'falar com pessoa', 'humano', 'atendimento humano',
    'quero falar com', 'me passa para', 'transfere', 'não quero robô', 'nao quero robo']
  const t = texto.toLowerCase()
  return triggers.some((tr) => t.includes(tr))
}

function demonstraInteresse(texto: string): boolean {
  const triggers = ['quero', 'tenho interesse', 'me interessa', 'pode me', 'gostaria',
    'quando', 'como funciona', 'mais informações', 'me conta mais']
  const t = texto.toLowerCase()
  return triggers.some((tr) => t.includes(tr))
}

// ─── Buscar histórico de mensagens ────────────────────────────────────────────

async function buscarHistorico(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  limite = 12,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const { data } = await supabase
    .from('whatsapp_messages')
    .select('direcao, conteudo')
    .eq('conversation_id', conversationId)
    .eq('tipo', 'texto')
    .order('criado_em', { ascending: false })
    .limit(limite)

  if (!data) return []

  return data
    .reverse()
    .filter((m) => m.conteudo)
    .map((m) => ({
      role: m.direcao === 'recebida' ? 'user' : 'assistant',
      content: m.conteudo as string,
    }))
}

// ─── Criar atividade de agendamento no Bitrix ─────────────────────────────────

async function criarAgendamentoBitrix(
  bitrixUrl: string,
  conversa: Conversa,
  phone: string,
  contactName: string,
  dia: string,
  hora: string,
): Promise<void> {
  const entityId = conversa.bitrix_entity_id ? parseInt(conversa.bitrix_entity_id) : null
  const entityTypeId = conversa.bitrix_entity_type === 'deal' ? 2 : 1  // 1=lead, 2=deal

  const descricao = [
    `[b]Agendamento via WhatsApp[/b]`,
    ``,
    `[b]Contato:[/b] ${contactName} (${phone})`,
    `[b]Data:[/b] ${dia}`,
    `[b]Horário:[/b] ${hora}`,
    ``,
    `_Agendado automaticamente pelo bot LeadFinderZion_`,
  ].join('\n')

  const promises: Promise<any>[] = []

  // Notificação para o responsável
  promises.push(
    fetch(`${bitrixUrl}im.notify.system.add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        USER_ID: 1,  // será sobrescrito pelo responsavel_bitrix_id quando disponível
        MESSAGE: `📅 Novo agendamento via WhatsApp!\n*${contactName}* (${phone})\n📆 ${dia} às ${hora}`,
      }),
    }).catch(() => {}),
  )

  // Activity no lead/deal se existir
  if (entityId) {
    promises.push(
      fetch(`${bitrixUrl}crm.activity.todo.add.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerTypeId: entityTypeId,
          ownerId: entityId,
          description: descricao,
          deadline: `${dia} ${hora}:00`,
        }),
      }).catch(() => {}),
    )
  }

  await Promise.all(promises)
}

// ─── Transição de estado ──────────────────────────────────────────────────────

async function transicionarEstado(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  novoEstado: EstadoBot,
  extras: Record<string, any> = {},
): Promise<void> {
  await supabase
    .from('whatsapp_conversations')
    .update({ estado: novoEstado, ultimo_contato: new Date().toISOString(), ...extras })
    .eq('id', conversationId)
}

// ─── Salvar mensagem enviada ──────────────────────────────────────────────────

async function salvarMensagemBot(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  texto: string,
): Promise<void> {
  await supabase.from('whatsapp_messages').insert({
    conversation_id: conversationId,
    message_id:     `bot_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    direcao:        'enviada',
    tipo:           'texto',
    conteudo:       texto,
    processado:     true,
  }).catch(() => {})
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

  const { instance_id, conversation_id, bot_ativo, message_db_id, phone, contact_name, text, msg_type } = payload

  // Só processa texto
  if (msg_type !== 'texto' || !text.trim()) {
    return new Response('OK', { status: 200 })
  }

  try {
    // ── 1. Carregar configuração do módulo ────────────────────────────────────
    const [moduleConfigRes, instanceRes, openaiRes, bitrixUrl] = await Promise.all([
      supabase.from('whatsapp_module_config')
        .select('uazapi_base_url, uazapi_global_token, horario_inicio, horario_fim, dias_semana, prompt_base, responsavel_bitrix_id, responsavel_nome')
        .eq('id', 1).maybeSingle(),
      supabase.from('whatsapp_instances')
        .select('instance_key').eq('id', instance_id).maybeSingle(),
      supabase.from('settings')
        .select('value').eq('key', 'openai_config').maybeSingle(),
      getBitrixWebhookUrl(supabase),
    ])

    const cfg = moduleConfigRes.data
    if (!cfg) return new Response('OK', { status: 200 })

    const baseUrl = cfg.uazapi_base_url || 'https://api.uazapi.dev'
    const globalToken = cfg.uazapi_global_token || ''
    const instanceKey = instanceRes.data?.instance_key || ''
    const openaiKey: string = (openaiRes.data?.value as any)?.api_key || Deno.env.get('OPENAI_API_KEY') || ''

    if (!globalToken || !instanceKey) {
      console.warn('[bot] token ou instanceKey ausente')
      return new Response('OK', { status: 200 })
    }

    // ── 2. Carregar conversa completa ─────────────────────────────────────────
    const { data: conversa } = await supabase
      .from('whatsapp_conversations')
      .select('id, estado, bot_ativo, agendamento_dia, agendamento_hora, bitrix_entity_id, bitrix_entity_type, automacao_config_id')
      .eq('id', conversation_id)
      .maybeSingle()

    if (!conversa) return new Response('OK', { status: 200 })

    // ── 3. Se bot desligado → apenas marcar como HUMANO sem responder ─────────
    if (!conversa.bot_ativo) {
      console.log(`[bot] conversa ${conversation_id} está em modo humano — ignorado`)
      return new Response('OK', { status: 200 })
    }

    // ── 4. Verificar se é horário comercial ───────────────────────────────────
    const emHorario = isBusinessHour(cfg.horario_inicio, cfg.horario_fim, cfg.dias_semana)

    // ── 5. Máquina de estados ─────────────────────────────────────────────────

    const estado = conversa.estado as EstadoBot

    // ─── AGENDADO ou HUMANO: não responder ────────────────────────────────────
    if (estado === 'AGENDADO' || estado === 'HUMANO') {
      return new Response('OK', { status: 200 })
    }

    // ─── Fora de horário comercial: mensagem de ausência ──────────────────────
    if (!emHorario) {
      // Só envia uma vez ao entrar no estado INICIO fora de horário
      if (estado === 'INICIO') {
        const msgAusencia = [
          `Olá, ${contact_name}! 👋`,
          ``,
          `No momento estamos fora do horário de atendimento.`,
          `Atendemos de segunda a sexta, das ${cfg.horario_inicio} às ${cfg.horario_fim}.`,
          ``,
          `Deixe sua mensagem que retornaremos em breve! 😊`,
        ].join('\n')

        await sendMessage(baseUrl, globalToken, instanceKey, phone, msgAusencia)
        await salvarMensagemBot(supabase, conversation_id, msgAusencia)
        await transicionarEstado(supabase, conversation_id, 'CONVERSANDO')
      }
      // Fora de horário, continua sem responder (mensagem já enviada)
      return new Response('OK', { status: 200 })
    }

    // ─── Pedido de atendente humano ────────────────────────────────────────────
    if (desejaAtendente(text)) {
      const msgHandoff = [
        `Entendido! Vou conectar você com um de nossos atendentes. 🙋`,
        ``,
        `Em breve alguém da equipe entrará em contato.`,
        `Horário de atendimento: ${cfg.horario_inicio} às ${cfg.horario_fim}.`,
      ].join('\n')

      await sendMessage(baseUrl, globalToken, instanceKey, phone, msgHandoff)
      await salvarMensagemBot(supabase, conversation_id, msgHandoff)
      await transicionarEstado(supabase, conversation_id, 'HUMANO', { bot_ativo: false })

      // Notificar responsável no Bitrix
      if (bitrixUrl) {
        fetch(`${bitrixUrl}im.notify.system.add.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            USER_ID: cfg.responsavel_bitrix_id || 1,
            MESSAGE: `🆘 *${contact_name}* (${phone}) solicitou atendimento humano no WhatsApp.`,
          }),
        }).catch(() => {})
      }

      return new Response('OK', { status: 200 })
    }

    // ─── COLETANDO_DIA ────────────────────────────────────────────────────────
    if (estado === 'COLETANDO_DIA') {
      const dia = extrairDia(text)
      if (dia) {
        const msgHora = `Ótimo! Qual horário seria melhor para você? (ex: 14h, 10:30h)`
        await sendMessage(baseUrl, globalToken, instanceKey, phone, msgHora)
        await salvarMensagemBot(supabase, conversation_id, msgHora)
        await transicionarEstado(supabase, conversation_id, 'COLETANDO_HORARIO', { agendamento_dia: dia })
      } else {
        const msgRetry = `Não entendi a data. Pode me dizer no formato dd/mm ou "segunda-feira"?`
        await sendMessage(baseUrl, globalToken, instanceKey, phone, msgRetry)
        await salvarMensagemBot(supabase, conversation_id, msgRetry)
      }
      return new Response('OK', { status: 200 })
    }

    // ─── COLETANDO_HORARIO ────────────────────────────────────────────────────
    if (estado === 'COLETANDO_HORARIO') {
      const hora = extrairHora(text)
      if (hora) {
        const dia = conversa.agendamento_dia || 'a definir'
        const msgConfirma = [
          `✅ Perfeito! Agendamento confirmado:`,
          ``,
          `📅 Data: ${dia}`,
          `🕐 Horário: ${hora}`,
          ``,
          `Nossa equipe entrará em contato. Até lá! 😊`,
        ].join('\n')

        await sendMessage(baseUrl, globalToken, instanceKey, phone, msgConfirma)
        await salvarMensagemBot(supabase, conversation_id, msgConfirma)
        await transicionarEstado(supabase, conversation_id, 'AGENDADO', {
          agendamento_hora: hora,
          bot_ativo: false,
        })

        // Criar atividade no Bitrix
        if (bitrixUrl) {
          await criarAgendamentoBitrix(bitrixUrl, conversa, phone, contact_name, dia, hora)
        }

        // Marcar lead como agendado na fila outbound se existir
        await supabase
          .from('leads_automacao_pendentes')
          .update({ whatsapp_status: 'agendado' })
          .eq('whatsapp_phone', phone.replace(/\D/g, ''))
          .in('whatsapp_status', ['enviado', 'respondido'])

      } else {
        const msgRetry = `Não identifiquei o horário. Pode informar assim: "14h" ou "10:30"?`
        await sendMessage(baseUrl, globalToken, instanceKey, phone, msgRetry)
        await salvarMensagemBot(supabase, conversation_id, msgRetry)
      }
      return new Response('OK', { status: 200 })
    }

    // ─── OFERTA_AGENDAMENTO ───────────────────────────────────────────────────
    if (estado === 'OFERTA_AGENDAMENTO') {
      const textoLower = text.toLowerCase()
      const aceitou = ['sim', 's', 'ok', 'pode', 'claro', 'quero', 'vamos', 'combinado', 'perfeito']
        .some((t) => textoLower.includes(t))
      const recusou = ['não', 'nao', 'n', 'agora não', 'depois', 'outra hora']
        .some((t) => textoLower === t || textoLower.startsWith(t))

      if (aceitou) {
        const msgDia = `Ótimo! Qual data seria melhor para você? (ex: amanhã, 15/05, segunda-feira)`
        await sendMessage(baseUrl, globalToken, instanceKey, phone, msgDia)
        await salvarMensagemBot(supabase, conversation_id, msgDia)
        await transicionarEstado(supabase, conversation_id, 'COLETANDO_DIA')
      } else if (recusou) {
        const msgFim = `Tudo bem! Quando quiser conversar é só chamar. 😊`
        await sendMessage(baseUrl, globalToken, instanceKey, phone, msgFim)
        await salvarMensagemBot(supabase, conversation_id, msgFim)
        await transicionarEstado(supabase, conversation_id, 'CONVERSANDO')
      } else {
        // Continua conversando
        if (!openaiKey) return new Response('OK', { status: 200 })
        const historico = await buscarHistorico(supabase, conversation_id)
        const resposta = await gerarRespostaBot(historico, cfg.prompt_base, openaiKey)
        if (resposta) {
          await sendMessage(baseUrl, globalToken, instanceKey, phone, resposta)
          await salvarMensagemBot(supabase, conversation_id, resposta)
        }
      }
      return new Response('OK', { status: 200 })
    }

    // ─── INICIO ou CONVERSANDO: GPT-4o-mini ───────────────────────────────────
    if (!openaiKey) {
      const msgSemIA = `Olá! 👋 Recebemos sua mensagem. Em breve nossa equipe entrará em contato.`
      await sendMessage(baseUrl, globalToken, instanceKey, phone, msgSemIA)
      await salvarMensagemBot(supabase, conversation_id, msgSemIA)
      await transicionarEstado(supabase, conversation_id, 'CONVERSANDO')
      return new Response('OK', { status: 200 })
    }

    if (estado === 'INICIO') {
      // Saudação inicial + primeira resposta
      await transicionarEstado(supabase, conversation_id, 'CONVERSANDO')
    }

    const historico = await buscarHistorico(supabase, conversation_id)
    const resposta = await gerarRespostaBot(historico, cfg.prompt_base, openaiKey)

    if (!resposta) return new Response('OK', { status: 200 })

    await sendMessage(baseUrl, globalToken, instanceKey, phone, resposta)
    await salvarMensagemBot(supabase, conversation_id, resposta)

    // ── 6. Verificar se é hora de oferecer agendamento ────────────────────────
    // Após 2+ trocas de mensagens e lead demonstra interesse
    if (historico.length >= 3 && demonstraInteresse(text)) {
      const jaOfertado = historico.some((m) =>
        m.role === 'assistant' && m.content.includes('agendamento'),
      )
      if (!jaOfertado) {
        // Pequena pausa para parecer natural
        await new Promise((r) => setTimeout(r, 2000))
        const msgOferta = `\n\nGostaríamos de apresentar nossas soluções em detalhes. Posso agendar uma conversa com nosso time? 📅`
        await sendMessage(baseUrl, globalToken, instanceKey, phone, msgOferta)
        await salvarMensagemBot(supabase, conversation_id, msgOferta)
        await transicionarEstado(supabase, conversation_id, 'OFERTA_AGENDAMENTO')

        // Marcar lead como respondido na fila outbound
        await supabase
          .from('leads_automacao_pendentes')
          .update({ whatsapp_status: 'respondido' })
          .eq('whatsapp_phone', phone.replace(/\D/g, ''))
          .eq('whatsapp_status', 'enviado')
      }
    }

    // Marcar mensagem como processada
    await supabase
      .from('whatsapp_messages')
      .update({ processado: true })
      .eq('id', message_db_id)

    return new Response('OK', { status: 200 })

  } catch (err: any) {
    console.error('[bot] erro:', err.message)
    return new Response('OK', { status: 200 })
  }
})
