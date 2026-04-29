import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { CnaeSelector } from './CnaeSelector'
import useAutomacaoStore, { AutomacaoConfig, CampanhaFormData } from '@/stores/useAutomacaoStore'

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const COMPANY_SIZES = [
  { label: 'MEI', value: 'MEI' },
  { label: 'Micro Empresa (ME)', value: 'ME' },
  { label: 'Pequeno Porte (EPP)', value: 'EPP' },
  { label: 'Demais (Médio/Grande)', value: 'DEMAIS' },
]

type Props = {
  open: boolean
  onClose: () => void
  campaign?: AutomacaoConfig | null
  initialCnaes?: string[]
}

const today = () => new Date().toISOString().slice(0, 10)

export function CampaignFormModal({ open, onClose, campaign, initialCnaes }: Props) {
  const { createCampanha, updateCampanha } = useAutomacaoStore()

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<'recorrente' | 'campanha'>('recorrente')
  const [cnaes, setCnaes] = useState<string[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [portes, setPortes] = useState<string[]>([])
  const [limiteExecucao, setLimiteExecucao] = useState(50)
  const [contextoIa, setContextoIa] = useState('')
  const [dataInicio, setDataInicio] = useState(today())
  const [dataFim, setDataFim] = useState('')
  const [notifGroupId, setNotifGroupId] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (campaign) {
      setNome(campaign.nome)
      setDescricao(campaign.descricao || '')
      setTipo(campaign.tipo)
      setCnaes(campaign.cnaes || [])
      setUfs(campaign.ufs || [])
      setPortes(campaign.portes || [])
      setLimiteExecucao(campaign.limite_por_execucao)
      setContextoIa(campaign.contexto_ia || '')
      setDataInicio(campaign.data_inicio || today())
      setDataFim(campaign.data_fim || '')
      setNotifGroupId(campaign.bitrix_notification_group_id || '')
      setAtivo(campaign.ativo)
    } else {
      setNome('')
      setDescricao('')
      setTipo('recorrente')
      setCnaes(initialCnaes || [])
      setUfs([])
      setPortes([])
      setLimiteExecucao(50)
      setContextoIa('')
      setDataInicio(today())
      setDataFim('')
      setNotifGroupId('')
      setAtivo(true)
    }
  }, [campaign, open, initialCnaes])

  const toggleUf = (uf: string) => {
    setUfs((prev) => (prev.includes(uf) ? prev.filter((u) => u !== uf) : [...prev, uf]))
  }

  const togglePorte = (porte: string) => {
    setPortes((prev) => (prev.includes(porte) ? prev.filter((p) => p !== porte) : [...prev, porte]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    if (cnaes.length === 0) return

    setSaving(true)
    const payload: CampanhaFormData = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      tipo,
      cnaes,
      ufs: ufs.length > 0 ? ufs : null,
      portes: portes.length > 0 ? portes : null,
      municipios: null,
      limite_por_execucao: limiteExecucao,
      contexto_ia: contextoIa.trim() || null,
      bitrix_pipeline_id: null,
      bitrix_stage_id: null,
      bitrix_notification_group_id: notifGroupId.trim() || null,
      cron_expressao: '0 2 * * *',
      data_inicio: dataInicio || null,
      data_fim: tipo === 'campanha' && dataFim ? dataFim : null,
      ativo,
    }

    const ok = campaign
      ? await updateCampanha(campaign.id, payload)
      : await createCampanha(payload)

    setSaving(false)
    if (ok) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>{campaign ? 'Editar Campanha' : 'Nova Campanha de Automação'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <form id="campaign-form" onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* Identificação */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Identificação
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">
                    Nome da campanha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Transportadoras ES — Q2 2026"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                    <SelectTrigger id="tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recorrente">Recorrente (roda toda noite)</SelectItem>
                      <SelectItem value="campanha">Campanha (período definido)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Objetivo desta automação, contexto da campanha..."
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Período */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Período
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dataInicio">Data de início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dataFim">
                    Data de encerramento{' '}
                    {tipo === 'recorrente' && (
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    )}
                  </Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    min={dataInicio}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Filtros de busca */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Filtros de Busca
              </h3>

              {/* CNAEs */}
              <div className="space-y-1.5">
                <Label>
                  CNAEs-alvo <span className="text-destructive">*</span>
                </Label>
                <CnaeSelector value={cnaes} onChange={setCnaes} initialCnaes={initialCnaes} />
                {cnaes.length === 0 && (
                  <p className="text-xs text-destructive">Selecione ao menos um CNAE.</p>
                )}
              </div>

              {/* Limite */}
              <div className="space-y-1.5">
                <Label htmlFor="limite">Leads por execução</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="limite"
                    type="number"
                    min={1}
                    max={500}
                    value={limiteExecucao}
                    onChange={(e) => setLimiteExecucao(Number(e.target.value))}
                    className="w-28"
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo de empresas buscadas por execução noturna.
                  </p>
                </div>
              </div>

              {/* Portes */}
              <div className="space-y-2">
                <Label>Portes de empresa (vazio = todos)</Label>
                <div className="flex flex-wrap gap-4">
                  {COMPANY_SIZES.map((s) => (
                    <label
                      key={s.value}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={portes.includes(s.value)}
                        onCheckedChange={() => togglePorte(s.value)}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Estados */}
              <div className="space-y-2">
                <Label>Estados — UFs (vazio = todos)</Label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                  {BRAZIL_STATES.map((uf) => (
                    <label
                      key={uf}
                      className={`flex items-center justify-center text-xs font-mono py-1 px-0.5 rounded border cursor-pointer transition-colors ${
                        ufs.includes(uf)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={ufs.includes(uf)}
                        onChange={() => toggleUf(uf)}
                      />
                      {uf}
                    </label>
                  ))}
                </div>
                {ufs.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => setUfs([])}
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
            </div>

            <Separator />

            {/* Contexto IA */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Contexto para a IA
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Descreva o contexto desta campanha. A IA usará isso para gerar abordagens
                  comerciais personalizadas para cada lead encontrado.
                </p>
              </div>
              <Textarea
                value={contextoIa}
                onChange={(e) => setContextoIa(e.target.value)}
                placeholder="Ex: Campanha pré-feira de logística ES. Foco em transportadoras que possam se interessar por rastreamento de frotas. Abordagem deve ser direta e mencionar a fair."
                rows={4}
              />
            </div>

            <Separator />

            {/* Notificação Bitrix */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Notificação Bitrix24
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="notifGroup">ID do grupo Bitrix24 para notificação matinal</Label>
                <Input
                  id="notifGroup"
                  value={notifGroupId}
                  onChange={(e) => setNotifGroupId(e.target.value)}
                  placeholder="Ex: 42"
                  className="w-36"
                />
                <p className="text-xs text-muted-foreground">
                  O sistema enviará um resumo dos leads encontrados para este grupo toda manhã.
                  Deixe em branco para desativar.
                </p>
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ativo" className="text-sm font-medium">
                  Campanha ativa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Campanhas inativas não são executadas pelo agendador.
                </p>
              </div>
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="campaign-form" disabled={saving || cnaes.length === 0}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {campaign ? 'Salvar alterações' : 'Criar campanha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
