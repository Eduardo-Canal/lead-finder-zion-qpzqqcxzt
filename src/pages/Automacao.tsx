import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAutomacaoStore, {
  AutomacaoConfig,
  ExecucaoAutomacao,
  LeadAutomacao,
} from '@/stores/useAutomacaoStore'
import { CampaignFormModal } from '@/components/automacao/CampaignFormModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Loader2,
  Zap,
  RefreshCw,
  Pencil,
  Trash2,
  Play,
  Pause,
  Search,
  Bot,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function duration(start: string | null, end: string | null) {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.round(ms / 60000)}min`
}

// ─── status badges ───────────────────────────────────────────────────────────

function StatusCampanha({ c }: { c: AutomacaoConfig }) {
  if (!c.ativo) return <Badge variant="secondary">Pausada</Badge>
  if (c.tipo === 'campanha' && c.data_fim && c.data_fim < new Date().toISOString().slice(0, 10))
    return <Badge variant="outline" className="text-muted-foreground">Finalizada</Badge>
  return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Ativa</Badge>
}

function StatusExecucao({ status }: { status: ExecucaoAutomacao['status'] }) {
  if (status === 'concluido')
    return (
      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
      </span>
    )
  if (status === 'erro')
    return (
      <span className="flex items-center gap-1 text-destructive text-xs font-medium">
        <XCircle className="w-3.5 h-3.5" /> Erro
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
      <Clock className="w-3.5 h-3.5" /> Executando
    </span>
  )
}

function StatusLead({ status }: { status: LeadAutomacao['status'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
    enviado_bitrix: { label: 'No Bitrix', cls: 'bg-emerald-100 text-emerald-700' },
    erro_envio: { label: 'Erro envio', cls: 'bg-red-100 text-red-700' },
    contatado: { label: 'Contatado', cls: 'bg-blue-100 text-blue-700' },
    interessado: { label: 'Interessado', cls: 'bg-purple-100 text-purple-700' },
    nao_interessado: { label: 'Não interessado', cls: 'bg-gray-100 text-gray-500' },
  }
  const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  )
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'primary',
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color?: string
}) {
  return (
    <div className="bg-card rounded-lg border shadow-sm px-5 flex items-center justify-between h-[76px]">
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
      <div className={`p-2.5 rounded-full bg-${color}/10 text-${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

// ─── campaigns tab ────────────────────────────────────────────────────────────

function CampanhasTab({
  onEdit,
  onNew,
}: {
  onEdit: (c: AutomacaoConfig) => void
  onNew: () => void
}) {
  const { campanhas, loadingCampanhas, fetchCampanhas, toggleAtivo, deleteCampanha } =
    useAutomacaoStore()
  const [deleteTarget, setDeleteTarget] = useState<AutomacaoConfig | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteCampanha(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
  }

  if (loadingCampanhas) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (campanhas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
        <Zap className="w-10 h-10 opacity-30" />
        <p>Nenhuma campanha configurada ainda.</p>
        <Button size="sm" onClick={onNew}>
          <Plus className="w-4 h-4 mr-1" /> Criar primeira campanha
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Campanha</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                Tipo
              </th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                CNAEs
              </th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                Limite/exec.
              </th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campanhas.map((c) => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{c.nome}</div>
                  {c.descricao && (
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {c.descricao}
                    </div>
                  )}
                  {(c.data_inicio || c.data_fim) && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                      {c.data_inicio && `Início: ${c.data_inicio}`}
                      {c.data_fim && ` · Fim: ${c.data_fim}`}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-muted-foreground capitalize">{c.tipo}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusCampanha c={c} />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {(c.cnaes || []).slice(0, 3).map((cnae) => (
                      <span
                        key={cnae}
                        className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded"
                      >
                        {cnae}
                      </span>
                    ))}
                    {c.cnaes && c.cnaes.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{c.cnaes.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <span className="text-sm font-mono">{c.limite_por_execucao}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleAtivo(c.id, !c.ativo)}
                        >
                          {c.ativo ? (
                            <Pause className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Play className="w-4 h-4 text-emerald-500" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{c.ativo ? 'Pausar' : 'Ativar'}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(c)}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              A campanha <strong>{deleteTarget?.nome}</strong> e todos os seus leads e execuções
              associados serão excluídos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── leads tab ────────────────────────────────────────────────────────────────

function LeadsTab() {
  const { campanhas, leads, loadingLeads, fetchLeads } = useAutomacaoStore()
  const [filterCampanha, setFilterCampanha] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filterCampanha !== 'all' && l.automacao_config_id !== filterCampanha) return false
      if (filterStatus !== 'all' && l.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          l.razao_social?.toLowerCase().includes(q) ||
          l.cnpj?.includes(q) ||
          l.municipio?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [leads, filterCampanha, filterStatus, search])

  const campanhaName = (id: string) => campanhas.find((c) => c.id === id)?.nome || '—'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razão social, CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCampanha} onValueChange={setFilterCampanha}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as campanhas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as campanhas</SelectItem>
            {campanhas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="enviado_bitrix">No Bitrix</SelectItem>
            <SelectItem value="erro_envio">Erro envio</SelectItem>
            <SelectItem value="contatado">Contatado</SelectItem>
            <SelectItem value="interessado">Interessado</SelectItem>
            <SelectItem value="nao_interessado">Não interessado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchLeads()}
          disabled={loadingLeads}
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loadingLeads ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'lead encontrado' : 'leads encontrados'}
      </div>

      {loadingLeads ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
          <Bot className="w-10 h-10 opacity-30" />
          <p>Nenhum lead encontrado.</p>
        </div>
      ) : (
        <ScrollArea className="rounded-md border h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Empresa</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                  Campanha
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                  Contato
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">
                  Abordagem IA
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                  Encontrado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground line-clamp-1">
                      {l.razao_social || '—'}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{l.cnpj}</div>
                    {(l.municipio || l.uf) && (
                      <div className="text-xs text-muted-foreground">
                        {[l.municipio, l.uf].filter(Boolean).join(' / ')}
                      </div>
                    )}
                    {l.porte && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                        {l.porte}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {campanhaName(l.automacao_config_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {l.email && (
                      <div className="text-xs truncate max-w-[160px]" title={l.email}>
                        {l.email}
                      </div>
                    )}
                    {l.telefone && <div className="text-xs text-muted-foreground">{l.telefone}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusLead status={l.status} />
                    {l.bitrix_lead_id && (
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                        #{l.bitrix_lead_id}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell max-w-[220px]">
                    {l.sugestao_abordagem ? (
                      <p className="text-xs text-muted-foreground line-clamp-3" title={l.sugestao_abordagem}>
                        {l.sugestao_abordagem}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(l.encontrado_em)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  )
}

// ─── history tab ─────────────────────────────────────────────────────────────

function HistoricoTab() {
  const { campanhas, execucoes, loadingExecucoes, fetchExecucoes } = useAutomacaoStore()
  const [filterCampanha, setFilterCampanha] = useState('all')

  useEffect(() => {
    fetchExecucoes()
  }, [fetchExecucoes])

  const filtered = useMemo(() => {
    if (filterCampanha === 'all') return execucoes
    return execucoes.filter((e) => e.automacao_config_id === filterCampanha)
  }, [execucoes, filterCampanha])

  const campanhaName = (id: string) => campanhas.find((c) => c.id === id)?.nome || '—'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterCampanha} onValueChange={setFilterCampanha}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todas as campanhas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as campanhas</SelectItem>
            {campanhas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchExecucoes()}
          disabled={loadingExecucoes}
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loadingExecucoes ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loadingExecucoes ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
          <BarChart3 className="w-10 h-10 opacity-30" />
          <p>Nenhuma execução registrada ainda.</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Campanha
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Iniciado em
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                  Encontrados
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                  Novos
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                  Duplicados
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                  Enviados Bitrix
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                  Duração
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium line-clamp-1">
                      {campanhaName(e.automacao_config_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(e.iniciado_em)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusExecucao status={e.status} />
                    {e.status === 'erro' && e.erro_mensagem && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="w-3.5 h-3.5 text-destructive mx-auto mt-1 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          {e.erro_mensagem}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-sm font-mono">{e.leads_encontrados}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-sm font-mono font-semibold text-emerald-600">
                      {e.leads_novos}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-sm font-mono text-muted-foreground">
                      {e.leads_duplicados}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-sm font-mono">{e.leads_enviados_bitrix}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground font-mono">
                      {duration(e.iniciado_em, e.finalizado_em)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function Automacao() {
  const [searchParams] = useSearchParams()
  const { campanhas, leads, loadingCampanhas, fetchCampanhas, fetchLeads } = useAutomacaoStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AutomacaoConfig | null>(null)

  // CNAEs pré-selecionados quando navegando da InteligenciaZion via ?cnae=
  const initialCnae = searchParams.get('cnae')
  const initialCnaes = initialCnae ? [initialCnae] : undefined

  useEffect(() => {
    fetchCampanhas()
    fetchLeads()
    if (initialCnae) setModalOpen(true)
  }, [])

  const handleEdit = (c: AutomacaoConfig) => {
    setEditTarget(c)
    setModalOpen(true)
  }

  const handleNew = () => {
    setEditTarget(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditTarget(null)
  }

  // Stats
  const ativas = campanhas.filter((c) => c.ativo).length
  const leadsEstaSemana = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    return leads.filter((l) => new Date(l.encontrado_em) >= cutoff).length
  }, [leads])
  const leadsNoBitrix = leads.filter((l) => l.status === 'enviado_bitrix').length

  return (
    <div className="p-6 w-full mx-auto space-y-6 animate-fade-in-up pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automação de Prospecção</h1>
          <p className="text-muted-foreground mt-1">
            Configure campanhas noturnas e acompanhe os leads gerados automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchCampanhas()}
            disabled={loadingCampanhas}
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loadingCampanhas ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Campanhas" value={campanhas.length} icon={Zap} />
        <StatCard
          label="Campanhas Ativas"
          value={ativas}
          icon={Play}
          color="emerald-500"
        />
        <StatCard label="Leads esta semana" value={leadsEstaSemana} icon={Bot} color="blue-500" />
        <StatCard
          label="Enviados ao Bitrix"
          value={leadsNoBitrix}
          icon={CheckCircle2}
          color="purple-500"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campanhas" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="campanhas" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Leads Gerados
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Histórico de Execuções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campanhas" className="mt-0">
          <CampanhasTab onEdit={handleEdit} onNew={handleNew} />
        </TabsContent>

        <TabsContent value="leads" className="mt-0">
          <LeadsTab />
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <HistoricoTab />
        </TabsContent>
      </Tabs>

      <CampaignFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        campaign={editTarget}
        initialCnaes={initialCnaes}
      />
    </div>
  )
}
