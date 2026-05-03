import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MessageSquare, Wifi, WifiOff, Users, Send, Clock,
  RefreshCw, BrainCircuit, Store, ChevronRight, Loader2,
  CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface InstanceStatus {
  id: string
  nome: string
  tipo: 'principal' | 'executivo'
  status: 'desconectado' | 'conectando' | 'conectado' | 'erro'
  numero: string
  bitrix_user_nome: string | null
  ultimo_ping: string | null
}

interface QueueStats {
  pendente: number
  enviando: number
  enviado: number
  erro: number
  cancelado: number
}

interface ConversaRecente {
  id: string
  phone: string
  contact_name: string | null
  estado: string
  ultimo_contato: string
  bot_ativo: boolean
}

interface GroupStatus {
  id: string
  nome: string
  group_id: string
  ativo: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: InstanceStatus['status'] }) {
  const cls = {
    conectado:    'bg-green-500',
    conectando:   'bg-yellow-500 animate-pulse',
    desconectado: 'bg-zinc-500',
    erro:         'bg-red-500',
  }[status]
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />
}

function estadoLabel(e: string) {
  const labels: Record<string, string> = {
    INICIO: 'Início',
    CONVERSANDO: 'Conversando',
    OFERTA_AGENDAMENTO: 'Oferta Agend.',
    COLETANDO_DIA: 'Coletando Dia',
    COLETANDO_HORARIO: 'Coletando Hora',
    AGENDADO: 'Agendado',
    HUMANO: 'Humano',
  }
  return labels[e] || e
}

function estadoCor(e: string) {
  const cores: Record<string, string> = {
    INICIO: 'text-slate-400',
    CONVERSANDO: 'text-blue-400',
    OFERTA_AGENDAMENTO: 'text-yellow-400',
    COLETANDO_DIA: 'text-orange-400',
    COLETANDO_HORARIO: 'text-orange-500',
    AGENDADO: 'text-green-400',
    HUMANO: 'text-red-400',
  }
  return cores[e] || 'text-muted-foreground'
}

function tempoAtras(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ─── Componente: métrica simples ─────────────────────────────────────────────

function MetricCard({
  title, value, icon: Icon, subtitle, variant = 'default',
}: {
  title: string
  value: string | number
  icon: React.ElementType
  subtitle?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const clsMap = {
    default: 'text-foreground',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger:  'text-red-400',
  }
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${clsMap[variant]}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <Icon className={`w-5 h-5 ${clsMap[variant]} opacity-70`} />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function WhatsAppDashboard() {
  const [instances, setInstances] = useState<InstanceStatus[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats>({ pendente: 0, enviando: 0, enviado: 0, erro: 0, cancelado: 0 })
  const [conversas, setConversas] = useState<ConversaRecente[]>([])
  const [grupos, setGrupos] = useState<GroupStatus[]>([])
  const [totalSugestoes, setTotalSugestoes] = useState(0)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    const hoje = new Date()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()

    const [instRes, queueRes, convRes, gruposRes, sugRes] = await Promise.all([
      supabase.from('whatsapp_instances').select('id, nome, tipo, status, numero, bitrix_user_nome, ultimo_ping').eq('ativo', true).order('tipo'),
      supabase.from('whatsapp_send_queue').select('status').gte('criado_em', inicioHoje),
      supabase.from('whatsapp_conversations').select('id, phone, contact_name, estado, ultimo_contato, bot_ativo').order('ultimo_contato', { ascending: false }).limit(10),
      supabase.from('whatsapp_group_config').select('id, nome, group_id, ativo').order('criado_em'),
      supabase.from('whatsapp_ai_suggestions').select('id', { count: 'exact', head: true }).gte('criado_em', inicioHoje),
    ])

    setInstances((instRes.data || []) as InstanceStatus[])

    const stats: QueueStats = { pendente: 0, enviando: 0, enviado: 0, erro: 0, cancelado: 0 }
    for (const item of (queueRes.data || [])) {
      const s = item.status as keyof QueueStats
      if (s in stats) stats[s]++
    }
    setQueueStats(stats)

    setConversas((convRes.data || []) as ConversaRecente[])
    setGrupos((gruposRes.data || []) as GroupStatus[])
    setTotalSugestoes(sugRes.count || 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const principalConectado = instances.some(i => i.tipo === 'principal' && i.status === 'conectado')
  const totalExecutivos = instances.filter(i => i.tipo === 'executivo').length
  const execConectados = instances.filter(i => i.tipo === 'executivo' && i.status === 'conectado').length
  const totalEnviadosHoje = queueStats.enviado + queueStats.enviando
  const humanoCount = conversas.filter(c => c.estado === 'HUMANO').length

  return (
    <div className="container mx-auto py-6 max-w-6xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-green-400" />
          <div>
            <h1 className="text-2xl font-bold">WhatsApp — Monitoramento</h1>
            <p className="text-sm text-muted-foreground">Visão geral do módulo em tempo real</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Número principal"
          value={principalConectado ? 'Conectado' : 'Offline'}
          icon={principalConectado ? Wifi : WifiOff}
          variant={principalConectado ? 'success' : 'danger'}
          subtitle={instances.find(i => i.tipo === 'principal')?.numero || '—'}
        />
        <MetricCard
          title="Executivos online"
          value={`${execConectados}/${totalExecutivos}`}
          icon={Users}
          variant={execConectados === totalExecutivos && totalExecutivos > 0 ? 'success' : totalExecutivos === 0 ? 'default' : 'warning'}
          subtitle="Números monitorados"
        />
        <MetricCard
          title="Enviados hoje"
          value={totalEnviadosHoje}
          icon={Send}
          variant="default"
          subtitle={`${queueStats.pendente} na fila · ${queueStats.erro} erros`}
        />
        <MetricCard
          title="Aguardam humano"
          value={humanoCount}
          icon={AlertCircle}
          variant={humanoCount > 0 ? 'warning' : 'default'}
          subtitle="Conversas transferidas"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instâncias */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Wifi className="w-4 h-4" />Instâncias</span>
                <Link to="/configuracoes/whatsapp">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    Gerenciar <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {instances.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma instância configurada</p>
              )}
              {instances.map(inst => (
                <div key={inst.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <StatusDot status={inst.status} />
                    <div>
                      <p className="text-sm font-medium leading-tight">{inst.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {inst.tipo === 'executivo' ? inst.bitrix_user_nome || 'Executivo' : 'Principal'}
                        {inst.numero ? ` · ${inst.numero}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {inst.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Grupos de feira */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Store className="w-4 h-4" />Grupos de Feira</span>
                <Link to="/configuracoes/whatsapp">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    Config <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {grupos.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum grupo cadastrado</p>
              )}
              {grupos.map(g => (
                <div key={g.id} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium leading-tight">{g.nome}</p>
                    <p className="text-xs text-muted-foreground font-mono">{g.group_id}</p>
                  </div>
                  <Badge variant={g.ativo ? 'default' : 'secondary'} className="text-[10px]">
                    {g.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Fila outbound */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="w-4 h-4" />
                Fila Outbound — Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Pendentes', value: queueStats.pendente, icon: Clock, cls: 'text-yellow-400' },
                { label: 'Enviando', value: queueStats.enviando, icon: Send, cls: 'text-blue-400' },
                { label: 'Enviados', value: queueStats.enviado, icon: CheckCircle, cls: 'text-green-400' },
                { label: 'Erros', value: queueStats.erro, icon: XCircle, cls: 'text-red-400' },
                { label: 'Cancelados', value: queueStats.cancelado, icon: AlertCircle, cls: 'text-zinc-400' },
              ].map(({ label, value, icon: Icon, cls }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${cls}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${value > 0 ? cls : 'text-muted-foreground'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Conversas recentes */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversas Recentes
                </span>
                <div className="flex items-center gap-2">
                  {totalSugestoes > 0 && (
                    <Badge className="h-5 text-[10px]">
                      <BrainCircuit className="w-3 h-3 mr-1" />
                      {totalSugestoes} sugestões hoje
                    </Badge>
                  )}
                  <Link to="/whatsapp/copiloto">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      Co-piloto <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversas.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa registrada</p>
              )}
              <div className="space-y-1">
                {conversas.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold bg-muted ${estadoCor(c.estado)}`}>
                        {(c.contact_name || c.phone).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          {c.contact_name || c.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className={`text-xs font-medium ${estadoCor(c.estado)}`}>
                          {estadoLabel(c.estado)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{tempoAtras(c.ultimo_contato)}</p>
                      </div>
                      {c.estado === 'HUMANO' && (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      {c.estado === 'AGENDADO' && (
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
