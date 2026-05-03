import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Wifi, WifiOff, Loader2, QrCode, Plus, Trash2, RefreshCw, Save, Clock, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface WhatsappInstance {
  id: string
  nome: string
  numero: string
  tipo: 'principal' | 'executivo'
  instance_key: string
  status: 'desconectado' | 'conectando' | 'conectado' | 'erro'
  bitrix_user_id: string | null
  bitrix_user_nome: string | null
  ativo: boolean
  ultimo_ping: string | null
  criado_em: string
}

interface ModuleConfig {
  uazapi_base_url: string
  uazapi_global_token: string
  horario_inicio: string
  horario_fim: string
  dias_semana: number[]
  responsavel_bitrix_id: string
  responsavel_nome: string
  prompt_base: string
}

const DIAS_SEMANA = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function callManageInstance(payload: any) {
  const { data, error } = await supabase.functions.invoke('whatsapp-manage-instance', {
    body: payload,
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

function StatusBadge({ status }: { status: WhatsappInstance['status'] }) {
  if (status === 'conectado') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Wifi className="w-3 h-3 mr-1" />Conectado</Badge>
  if (status === 'conectando') return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Conectando</Badge>
  if (status === 'erro') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><WifiOff className="w-3 h-3 mr-1" />Erro</Badge>
  return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30"><WifiOff className="w-3 h-3 mr-1" />Desconectado</Badge>
}

// ─── Componente de QR Code ────────────────────────────────────────────────────

function QrCodeModal({
  instance,
  open,
  onClose,
  onConnected,
}: {
  instance: WhatsappInstance
  open: boolean
  onClose: () => void
  onConnected: (numero: string) => void
}) {
  const [qr, setQr] = useState<string>('')
  const [loadingQr, setLoadingQr] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchQr = useCallback(async () => {
    setLoadingQr(true)
    try {
      const res = await callManageInstance({ action: 'qr', instance_id: instance.id })
      const qrData: string = res?.qr || ''
      setQr(qrData.startsWith('data:') ? qrData : `data:image/png;base64,${qrData}`)
    } catch (err: any) {
      toast.error(`Erro ao obter QR Code: ${err.message}`)
    } finally {
      setLoadingQr(false)
    }
  }, [instance.id])

  const pollStatus = useCallback(async () => {
    try {
      const res = await callManageInstance({ action: 'status', instance_id: instance.id })
      if (res?.status === 'conectado') {
        toast.success('WhatsApp conectado com sucesso!')
        onConnected(res?.numero || '')
        onClose()
      }
    } catch {/* silencioso — continua polling */}
  }, [instance.id, onConnected, onClose])

  useEffect(() => {
    if (!open) return
    fetchQr()
    pollRef.current = setInterval(pollStatus, 4000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [open, fetchQr, pollStatus])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Conectar {instance.nome}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {loadingQr ? (
            <div className="flex items-center gap-2 h-48 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Gerando QR Code...</span>
            </div>
          ) : qr ? (
            <img src={qr} alt="QR Code WhatsApp" className="w-56 h-56 rounded-md border" />
          ) : (
            <p className="text-sm text-muted-foreground">QR Code indisponível</p>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo
          </p>
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Aguardando leitura do QR Code...
          </div>
          <Button variant="outline" size="sm" onClick={fetchQr} disabled={loadingQr}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Gerar novo QR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Componente de Card de Instância ─────────────────────────────────────────

function InstanceCard({
  instance,
  onRefreshStatus,
  onDelete,
  onDisconnect,
  onOpenQr,
}: {
  instance: WhatsappInstance
  onRefreshStatus: (id: string) => void
  onDelete: (id: string) => void
  onDisconnect: (id: string) => void
  onOpenQr: (instance: WhatsappInstance) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-green-400 shrink-0" />
        <div>
          <p className="font-medium text-sm">{instance.nome}</p>
          <p className="text-xs text-muted-foreground">
            {instance.numero ? instance.numero : 'Número não conectado'}
          </p>
          {instance.bitrix_user_nome && (
            <p className="text-xs text-muted-foreground">Executivo: {instance.bitrix_user_nome}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={instance.status} />
        {instance.status !== 'conectado' && (
          <Button size="sm" variant="outline" onClick={() => onOpenQr(instance)}>
            <QrCode className="w-3 h-3 mr-1" />
            Conectar
          </Button>
        )}
        {instance.status === 'conectado' && (
          <Button size="sm" variant="outline" onClick={() => onDisconnect(instance.id)}>
            <WifiOff className="w-3 h-3 mr-1" />
            Desconectar
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRefreshStatus(instance.id)} title="Verificar status">
          <RefreshCw className="w-3 h-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(instance.id)} title="Remover">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ConfiguracoesWhatsApp() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [instances, setInstances] = useState<WhatsappInstance[]>([])
  const [qrTarget, setQrTarget] = useState<WhatsappInstance | null>(null)

  const [config, setConfig] = useState<ModuleConfig>({
    uazapi_base_url: 'https://api.uazapi.dev',
    uazapi_global_token: '',
    horario_inicio: '08:00',
    horario_fim: '18:00',
    dias_semana: [1, 2, 3, 4, 5],
    responsavel_bitrix_id: '',
    responsavel_nome: '',
    prompt_base: '',
  })

  // Novo executivo
  const [novoExecNome, setNovoExecNome] = useState('')
  const [novoExecBitrixNome, setNovoExecBitrixNome] = useState('')
  const [novoExecBitrixId, setNovoExecBitrixId] = useState('')
  const [criandoExec, setCriandoExec] = useState(false)

  // Usuários do sistema para vincular à instância
  const [novoExecUserId, setNovoExecUserId] = useState('')
  const [usuariosSistema, setUsuariosSistema] = useState<{
    user_id: string
    nome: string
    bitrix_user_id: string | null
    celular_corporativo: string | null
  }[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('user_id, nome, bitrix_user_id, celular_corporativo')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => setUsuariosSistema(data || []))
  }, [])

  const handleSelectExecUser = (userId: string) => {
    setNovoExecUserId(userId)
    const u = usuariosSistema.find(x => x.user_id === userId)
    if (!u) return
    // Auto-preenche nome e ID Bitrix a partir do cadastro do usuário
    if (!novoExecBitrixNome) setNovoExecBitrixNome(u.nome)
    if (!novoExecBitrixId && u.bitrix_user_id) setNovoExecBitrixId(u.bitrix_user_id)
  }

  // ─── Carregamento inicial ───────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [configRes, instancesRes] = await Promise.all([
          callManageInstance({ action: 'get_config' }),
          callManageInstance({ action: 'list' }),
        ])
        if (configRes?.config) {
          const c = configRes.config
          setConfig({
            uazapi_base_url: c.uazapi_base_url || 'https://api.uazapi.dev',
            uazapi_global_token: c.uazapi_global_token || '',
            horario_inicio: c.horario_inicio || '08:00',
            horario_fim: c.horario_fim || '18:00',
            dias_semana: c.dias_semana || [1, 2, 3, 4, 5],
            responsavel_bitrix_id: c.responsavel_bitrix_id || '',
            responsavel_nome: c.responsavel_nome || '',
            prompt_base: c.prompt_base || '',
          })
        }
        setInstances((instancesRes?.instances || []).filter((i: WhatsappInstance) => i.ativo))
      } catch (err: any) {
        toast.error(`Erro ao carregar configurações: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ─── Salvar configurações globais ──────────────────────────────────────────

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      await callManageInstance({ action: 'save_config', ...config })
      toast.success('Configurações salvas com sucesso!')
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // ─── Atualizar status ───────────────────────────────────────────────────────

  const handleRefreshStatus = async (id: string) => {
    try {
      const res = await callManageInstance({ action: 'status', instance_id: id })
      setInstances(prev => prev.map(i => i.id === id ? { ...i, status: res.status } : i))
    } catch (err: any) {
      toast.error(`Erro ao verificar status: ${err.message}`)
    }
  }

  // ─── Desconectar ───────────────────────────────────────────────────────────

  const handleDisconnect = async (id: string) => {
    try {
      await callManageInstance({ action: 'disconnect', instance_id: id })
      setInstances(prev => prev.map(i => i.id === id ? { ...i, status: 'desconectado', numero: '' } : i))
      toast.success('Instância desconectada.')
    } catch (err: any) {
      toast.error(`Erro ao desconectar: ${err.message}`)
    }
  }

  // ─── Remover ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover esta instância? O histórico de conversas será mantido.')) return
    try {
      await callManageInstance({ action: 'delete', instance_id: id })
      setInstances(prev => prev.filter(i => i.id !== id))
      toast.success('Instância removida.')
    } catch (err: any) {
      toast.error(`Erro ao remover: ${err.message}`)
    }
  }

  // ─── Callback após conexão via QR ──────────────────────────────────────────

  const handleConnected = (instanceId: string, numero: string) => {
    setInstances(prev => prev.map(i =>
      i.id === instanceId ? { ...i, status: 'conectado', numero } : i
    ))
  }

  // ─── Criar instância executiva ──────────────────────────────────────────────

  const handleCriarExecutivo = async () => {
    if (!novoExecNome.trim()) { toast.error('Informe o nome do executivo'); return }
    setCriandoExec(true)
    try {
      const res = await callManageInstance({
        action: 'create',
        nome: novoExecNome.trim(),
        tipo: 'executivo',
        bitrix_user_nome: novoExecBitrixNome.trim() || undefined,
        bitrix_user_id: novoExecBitrixId.trim() || undefined,
        profile_user_id: novoExecUserId || undefined,
      })
      setInstances(prev => [...prev, res.instance])
      setNovoExecNome('')
      setNovoExecBitrixNome('')
      setNovoExecBitrixId('')
      setNovoExecUserId('')
      toast.success('Instância do executivo criada. Clique em "Conectar" para escanear o QR Code.')
    } catch (err: any) {
      toast.error(`Erro ao criar instância: ${err.message}`)
    } finally {
      setCriandoExec(false)
    }
  }

  const executivoInstances = instances.filter(i => i.tipo === 'executivo')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-7 h-7 text-green-400" />
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Automation</h1>
          <p className="text-sm text-muted-foreground">Gerencie executivos, horários de atendimento e comportamento do bot</p>
        </div>
      </div>

      <Tabs defaultValue="executivos">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="executivos">Executivos</TabsTrigger>
          <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="bot">Bot / IA</TabsTrigger>
        </TabsList>

        {/* ── ABA: EXECUTIVOS ── */}
        <TabsContent value="executivos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Números dos Executivos</CardTitle>
              <CardDescription>
                Cada executivo tem seu próprio número monitorado. Todas as conversas são
                logadas no Bitrix24 e o co-piloto IA gera sugestões em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {executivoInstances.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum executivo cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {executivoInstances.map(inst => (
                    <InstanceCard
                      key={inst.id}
                      instance={inst}
                      onRefreshStatus={handleRefreshStatus}
                      onDelete={handleDelete}
                      onDisconnect={handleDisconnect}
                      onOpenQr={setQrTarget}
                    />
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label>Adicionar executivo</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs text-muted-foreground">Nome da instância</Label>
                    <Input
                      value={novoExecNome}
                      onChange={e => setNovoExecNome(e.target.value)}
                      placeholder='Ex: "Número Carlos" ou "Vendas João"'
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Nome do executivo (Bitrix)</Label>
                    <Input
                      value={novoExecBitrixNome}
                      onChange={e => setNovoExecBitrixNome(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">ID do usuário no Bitrix24</Label>
                    <Input
                      value={novoExecBitrixId}
                      onChange={e => setNovoExecBitrixId(e.target.value)}
                      placeholder="ID numérico"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs text-muted-foreground">Usuário do sistema (para o Co-Piloto)</Label>
                    <Select value={novoExecUserId} onValueChange={handleSelectExecUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vincular a um usuário (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuariosSistema.map(u => (
                          <SelectItem key={u.user_id} value={u.user_id}>
                            {u.nome}
                            {u.celular_corporativo && (
                              <span className="ml-2 text-xs text-muted-foreground font-mono">
                                · {u.celular_corporativo}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Ao selecionar, o nome e ID Bitrix são preenchidos automaticamente.
                      O celular corporativo cadastrado aparece como referência.
                    </p>
                  </div>
                </div>
                <Button onClick={handleCriarExecutivo} disabled={criandoExec}>
                  {criandoExec ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Adicionar executivo
                </Button>
                <p className="text-xs text-muted-foreground">
                  Após criar, clique em "Conectar" e peça ao executivo para escanear o QR Code
                  com o celular dele. O número monitorado não precisa ser o principal da empresa.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: ATENDIMENTO ── */}
        <TabsContent value="atendimento" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário Comercial
              </CardTitle>
              <CardDescription>
                Dentro deste horário as mensagens são encaminhadas ao atendente humano.
                Fora dele o bot assume automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="space-y-1.5 flex-1">
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={config.horario_inicio}
                    onChange={e => setConfig(c => ({ ...c, horario_inicio: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    value={config.horario_fim}
                    onChange={e => setConfig(c => ({ ...c, horario_fim: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dias da semana</Label>
                <div className="flex gap-2 flex-wrap">
                  {DIAS_SEMANA.map(dia => (
                    <label key={dia.value} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <Checkbox
                        checked={config.dias_semana.includes(dia.value)}
                        onCheckedChange={checked => {
                          setConfig(c => ({
                            ...c,
                            dias_semana: checked
                              ? [...c.dias_semana, dia.value].sort()
                              : c.dias_semana.filter(d => d !== dia.value),
                          }))
                        }}
                      />
                      <span className="text-sm">{dia.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label>Responsável padrão (nome)</Label>
                <Input
                  value={config.responsavel_nome}
                  onChange={e => setConfig(c => ({ ...c, responsavel_nome: e.target.value }))}
                  placeholder="Ex: Débora"
                />
              </div>
              <div className="space-y-1.5">
                <Label>ID do responsável no Bitrix24</Label>
                <Input
                  value={config.responsavel_bitrix_id}
                  onChange={e => setConfig(c => ({ ...c, responsavel_bitrix_id: e.target.value }))}
                  placeholder="ID numérico do usuário no Bitrix24"
                />
              </div>

              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar configurações de atendimento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: BOT / IA ── */}
        <TabsContent value="bot" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Prompt Base do Assistente
              </CardTitle>
              <CardDescription>
                Instruções base que definem a personalidade e limites do bot. Cada campanha pode
                complementar este prompt com contexto específico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={config.prompt_base}
                onChange={e => setConfig(c => ({ ...c, prompt_base: e.target.value }))}
                placeholder="Você é assistente virtual da Zionlogtec..."
                rows={8}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Dicas: defina o tom (formal/informal), o que pode e não pode responder, como
                oferecer agendamento, e que nunca deve inventar preços ou prazos.
              </p>
              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar prompt
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal QR Code */}
      {qrTarget && (
        <QrCodeModal
          instance={qrTarget}
          open={!!qrTarget}
          onClose={() => setQrTarget(null)}
          onConnected={(numero) => {
            handleConnected(qrTarget.id, numero)
            setQrTarget(null)
          }}
        />
      )}
    </div>
  )
}
