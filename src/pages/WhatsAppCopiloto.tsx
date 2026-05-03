import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Copy, Check, MessageSquare, BrainCircuit, User, Clock,
  RefreshCw, Link2, Link2Off, Pencil, X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Conversa {
  id: string
  phone: string
  contact_name: string | null
  estado: string
  ultimo_contato: string
  bitrix_entity_id: string | null
  bitrix_entity_type: string | null
  instance: {
    nome: string
    bitrix_user_nome: string | null
  } | null
}

interface Mensagem {
  id: string
  direcao: 'recebida' | 'enviada'
  conteudo: string | null
  tipo: string
  criado_em: string
}

interface Sugestao {
  id: string
  conversation_id: string
  sugestoes: string[]
  contexto: string | null
  criado_em: string
}

const ENTITY_LABELS: Record<string, string> = {
  lead: 'Lead',
  deal: 'Negócio',
  contact: 'Contato',
  company: 'Empresa',
}

// ─── Hook: sugestões em tempo real ───────────────────────────────────────────

function useSugestoesRealtime(conversationId: string | null) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])

  useEffect(() => {
    if (!conversationId) {
      setSugestoes([])
      return
    }

    supabase
      .from('whatsapp_ai_suggestions')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('criado_em', { ascending: false })
      .limit(5)
      .then(({ data }) => setSugestoes(data || []))

    const channel = supabase
      .channel(`copiloto_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_ai_suggestions',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setSugestoes((prev) => [payload.new as Sugestao, ...prev.slice(0, 4)])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return sugestoes
}

// ─── Componente: card de sugestão ────────────────────────────────────────────

function SugestaoCard({ sugestao }: { sugestao: Sugestao }) {
  const [copiadoIdx, setCopiadoIdx] = useState<number | null>(null)
  const { toast } = useToast()

  const copiar = (texto: string, idx: number) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoIdx(idx)
      toast({ title: 'Copiado!', description: 'Sugestão copiada para a área de transferência.' })
      setTimeout(() => setCopiadoIdx(null), 2000)
    })
  }

  const tempoAtras = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'agora'
    if (min < 60) return `${min}min atrás`
    return `${Math.floor(min / 60)}h atrás`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BrainCircuit className="w-3 h-3" />
        <span>Em resposta a: <em className="text-foreground/70">&ldquo;{sugestao.contexto?.slice(0, 60)}{(sugestao.contexto?.length || 0) > 60 ? '…' : ''}&rdquo;</em></span>
        <span className="ml-auto">{tempoAtras(sugestao.criado_em)}</span>
      </div>
      {sugestao.sugestoes.map((s, i) => (
        <div
          key={i}
          className="group flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 p-3 hover:border-primary/40 hover:bg-muted/60 transition-all"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {i + 1}
          </span>
          <p className="flex-1 text-sm leading-relaxed">{s}</p>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => copiar(s, i)}
          >
            {copiadoIdx === i ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      ))}
    </div>
  )
}

// ─── Componente: histórico de mensagens ──────────────────────────────────────

function HistoricoMensagens({ conversationId }: { conversationId: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('whatsapp_messages')
      .select('id, direcao, conteudo, tipo, criado_em')
      .eq('conversation_id', conversationId)
      .order('criado_em', { ascending: false })
      .limit(30)
      .then(({ data }) => setMensagens((data || []).reverse()))

    const channel = supabase
      .channel(`msgs_${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => setMensagens((prev) => [...prev, payload.new as Mensagem]),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-80 pr-1">
      {mensagens.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-6">Nenhuma mensagem ainda</p>
      )}
      {mensagens.map((m) => (
        <div key={m.id} className={`flex ${m.direcao === 'enviada' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.direcao === 'enviada'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-muted text-foreground rounded-tl-sm'
            }`}
          >
            {m.conteudo || <em className="opacity-60">[{m.tipo}]</em>}
            <span className="mt-1 block text-right text-[10px] opacity-60">{formatHora(m.criado_em)}</span>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

// ─── Componente: vinculação Bitrix ────────────────────────────────────────────

function BitrixVinculo({
  conversa,
  onVinculado,
}: {
  conversa: Conversa
  onVinculado: (entityId: string | null, entityType: string | null) => void
}) {
  const [editando, setEditando] = useState(false)
  const [entityId, setEntityId] = useState('')
  const [entityType, setEntityType] = useState('lead')
  const [salvando, setSalvando] = useState(false)
  const { toast } = useToast()

  const vincular = async () => {
    if (!entityId.trim()) {
      toast({ title: 'Informe o ID do negócio/lead', variant: 'destructive' })
      return
    }
    setSalvando(true)
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ bitrix_entity_id: entityId.trim(), bitrix_entity_type: entityType })
      .eq('id', conversa.id)

    if (error) {
      toast({ title: 'Erro ao vincular', description: error.message, variant: 'destructive' })
    } else {
      onVinculado(entityId.trim(), entityType)
      setEditando(false)
      setEntityId('')
      toast({ title: 'Vinculado!', description: `Conversa associada ao ${ENTITY_LABELS[entityType]} #${entityId.trim()}` })
    }
    setSalvando(false)
  }

  const desvincular = async () => {
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ bitrix_entity_id: null, bitrix_entity_type: null })
      .eq('id', conversa.id)

    if (!error) {
      onVinculado(null, null)
      toast({ title: 'Desvinculado' })
    }
  }

  // Já vinculado
  if (conversa.bitrix_entity_id && !editando) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs">
        <Link2 className="w-3 h-3 text-blue-400 shrink-0" />
        <span className="text-blue-300 font-medium">
          {ENTITY_LABELS[conversa.bitrix_entity_type || 'lead'] || conversa.bitrix_entity_type} #{conversa.bitrix_entity_id}
        </span>
        <span className="text-muted-foreground ml-1">vinculado no Bitrix</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEntityId(conversa.bitrix_entity_id || '')
              setEntityType(conversa.bitrix_entity_type || 'lead')
              setEditando(true)
            }}
            title="Alterar vínculo"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={desvincular}
            title="Desvincular"
          >
            <Link2Off className="w-3 h-3" />
          </Button>
        </div>
      </div>
    )
  }

  // Formulário de vínculo
  if (editando || !conversa.bitrix_entity_id) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="deal">Negócio</SelectItem>
            <SelectItem value="contact">Contato</SelectItem>
            <SelectItem value="company">Empresa</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="h-7 w-32 text-xs font-mono"
          placeholder="ID (ex: 123)"
          value={entityId}
          onChange={e => setEntityId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && vincular()}
        />
        <Button size="sm" className="h-7 text-xs" onClick={vincular} disabled={salvando}>
          <Link2 className="w-3 h-3 mr-1" />
          Vincular
        </Button>
        {editando && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => { setEditando(false); setEntityId('') }}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          Insira o ID do card no Bitrix24
        </span>
      </div>
    )
  }

  return null
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function WhatsAppCopiloto() {
  const { user, hasPermission } = useAuthStore()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [semInstancia, setSemInstancia] = useState(false)
  const sugestoes = useSugestoesRealtime(conversaSelecionada?.id || null)

  const carregarConversas = useCallback(async () => {
    setCarregando(true)
    setSemInstancia(false)

    // Admin vê todos os executivos; não-admin vê só sua instância
    let query = supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('tipo', 'executivo')
      .eq('ativo', true)

    if (!isAdmin && user?.user_id) {
      query = query.eq('profile_user_id', user.user_id) as any
    }

    const { data: execInstances } = await query
    const execIds = (execInstances || []).map((i: any) => i.id)

    if (execIds.length === 0) {
      setConversas([])
      setCarregando(false)
      // Não-admin sem instância vinculada → mensagem específica
      if (!isAdmin) setSemInstancia(true)
      return
    }

    const { data } = await supabase
      .from('whatsapp_conversations')
      .select(`
        id, phone, contact_name, estado, ultimo_contato, instance_id,
        bitrix_entity_id, bitrix_entity_type,
        instance:instance_id (nome, bitrix_user_nome)
      `)
      .in('instance_id', execIds)
      .order('ultimo_contato', { ascending: false })
      .limit(50)

    setConversas((data || []) as Conversa[])
    setCarregando(false)
  }, [isAdmin, user?.user_id])

  useEffect(() => {
    carregarConversas()

    const channel = supabase
      .channel('copiloto_conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' },
        () => carregarConversas())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [carregarConversas])

  const handleVinculado = (entityId: string | null, entityType: string | null) => {
    if (!conversaSelecionada) return
    const updated = { ...conversaSelecionada, bitrix_entity_id: entityId, bitrix_entity_type: entityType }
    setConversaSelecionada(updated)
    setConversas(prev => prev.map(c => c.id === conversaSelecionada.id ? updated : c))
  }

  const estadoCor = (estado: string) => {
    const cores: Record<string, string> = {
      INICIO: 'bg-slate-500',
      CONVERSANDO: 'bg-blue-500',
      OFERTA_AGENDAMENTO: 'bg-yellow-500',
      COLETANDO_DIA: 'bg-orange-500',
      COLETANDO_HORARIO: 'bg-orange-600',
      AGENDADO: 'bg-green-500',
      HUMANO: 'bg-red-500',
    }
    return cores[estado] || 'bg-slate-400'
  }

  const formatUltimo = (iso: string) => {
    const d = new Date(iso)
    const hoje = new Date()
    if (d.toDateString() === hoje.toDateString()) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* ── Painel esquerdo: lista de conversas ── */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-500" />
            Co-Piloto WhatsApp
          </h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={carregarConversas}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {isAdmin && (
          <p className="text-[10px] text-muted-foreground px-1">
            Visão de gestor — todas as conversas dos executivos
          </p>
        )}

        <div className="flex-1 overflow-y-auto space-y-1">
          {carregando && (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Carregando...
            </div>
          )}
          {!carregando && semInstancia && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-2 px-2">
              <User className="w-8 h-8 opacity-30" />
              <p className="font-medium">Sem instância vinculada</p>
              <p className="text-xs">Solicite ao administrador vincular sua conta em Configurações → WhatsApp → Executivos.</p>
            </div>
          )}
          {!carregando && !semInstancia && conversas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-2">
              <User className="w-8 h-8 opacity-30" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          )}
          {conversas.map((c) => (
            <button
              key={c.id}
              onClick={() => setConversaSelecionada(c)}
              className={`w-full text-left rounded-lg p-3 border transition-all ${
                conversaSelecionada?.id === c.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border/40 hover:border-border hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">
                  {c.contact_name || c.phone}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatUltimo(c.ultimo_contato)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${estadoCor(c.estado)}`} />
                <span className="text-[11px] text-muted-foreground">{c.estado.replace(/_/g, ' ')}</span>
                {(c as any).instance?.bitrix_user_nome && (
                  <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1">
                    {(c as any).instance.bitrix_user_nome.split(' ')[0]}
                  </Badge>
                )}
                {c.bitrix_entity_id && (
                  <Link2 className="w-3 h-3 text-blue-400 ml-auto" title={`Vinculado: ${ENTITY_LABELS[c.bitrix_entity_type || ''] || c.bitrix_entity_type} #${c.bitrix_entity_id}`} />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator orientation="vertical" />

      {/* ── Painel direito: conversa + sugestões ── */}
      {!conversaSelecionada ? (
        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
          <div className="space-y-3">
            <BrainCircuit className="w-12 h-12 mx-auto opacity-20" />
            <p className="text-sm">Selecione uma conversa para ver as sugestões de IA</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Cabeçalho da conversa */}
          <div className="flex items-start justify-between shrink-0 gap-4">
            <div>
              <h3 className="font-semibold">
                {conversaSelecionada.contact_name || conversaSelecionada.phone}
              </h3>
              <p className="text-xs text-muted-foreground">
                {conversaSelecionada.phone}
                {(conversaSelecionada as any).instance?.bitrix_user_nome && (
                  <span> · Executivo: {(conversaSelecionada as any).instance.bitrix_user_nome}</span>
                )}
              </p>
            </div>
            <Badge variant="outline" className={`text-xs ${estadoCor(conversaSelecionada.estado)} bg-opacity-10 shrink-0`}>
              {conversaSelecionada.estado.replace(/_/g, ' ')}
            </Badge>
          </div>

          {/* Vinculação Bitrix */}
          <div className="shrink-0">
            <BitrixVinculo conversa={conversaSelecionada} onVinculado={handleVinculado} />
          </div>

          <div className="flex flex-1 gap-4 min-h-0">
            {/* Histórico */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="py-3 px-4 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversa
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden px-4 pb-4">
                <HistoricoMensagens conversationId={conversaSelecionada.id} />
              </CardContent>
            </Card>

            {/* Sugestões */}
            <Card className="w-96 shrink-0 flex flex-col min-h-0">
              <CardHeader className="py-3 px-4 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  Sugestões da IA
                  {sugestoes.length > 0 && (
                    <Badge className="ml-auto h-5 px-1.5 text-[10px]">
                      {sugestoes.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                {sugestoes.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <BrainCircuit className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs">Aguardando mensagens...</p>
                    <p className="text-xs opacity-60 mt-1">As sugestões aparecem automaticamente</p>
                  </div>
                )}
                {sugestoes.map((s) => (
                  <div key={s.id}>
                    <SugestaoCard sugestao={s} />
                    <Separator className="mt-4" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
