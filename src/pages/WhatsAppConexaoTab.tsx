import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Wifi, WifiOff, Loader2, QrCode, Plus, Trash2, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

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

interface ConexaoConfig {
  uazapi_base_url: string
  uazapi_global_token: string
}

async function callManageInstance(payload: any) {
  const { data, error } = await supabase.functions.invoke('whatsapp-manage-instance', { body: payload })
  if (error) {
    const body = await (error as any).context?.json?.().catch(() => null)
    throw new Error(body?.error || error.message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

function StatusBadge({ status }: { status: WhatsappInstance['status'] }) {
  if (status === 'conectado') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Wifi className="w-3 h-3 mr-1" />Conectado</Badge>
  if (status === 'conectando') return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Conectando</Badge>
  if (status === 'erro') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><WifiOff className="w-3 h-3 mr-1" />Erro</Badge>
  return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30"><WifiOff className="w-3 h-3 mr-1" />Desconectado</Badge>
}

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
    } catch {/* silencioso */}
  }, [instance.id, onConnected, onClose])

  useEffect(() => {
    if (!open) return
    fetchQr()
    pollRef.current = setInterval(pollStatus, 4000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
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

export default function WhatsAppConexaoTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [instances, setInstances] = useState<WhatsappInstance[]>([])
  const [qrTarget, setQrTarget] = useState<WhatsappInstance | null>(null)
  const [config, setConfig] = useState<ConexaoConfig>({
    uazapi_base_url: 'https://api.uazapi.dev',
    uazapi_global_token: '',
  })
  const [novoPrincipalNome, setNovoPrincipalNome] = useState('')
  const [criandoPrincipal, setCriandoPrincipal] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [configRes, instancesRes] = await Promise.all([
          callManageInstance({ action: 'get_config' }),
          callManageInstance({ action: 'list' }),
        ])
        if (configRes?.config) {
          setConfig({
            uazapi_base_url: configRes.config.uazapi_base_url || 'https://api.uazapi.dev',
            uazapi_global_token: configRes.config.uazapi_global_token || '',
          })
        }
        const all = (instancesRes?.instances || []).filter((i: WhatsappInstance) => i.ativo)
        setInstances(all.filter((i: WhatsappInstance) => i.tipo === 'principal'))
      } catch (err: any) {
        toast.error(`Erro ao carregar configurações: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      await callManageInstance({
        action: 'save_config',
        uazapi_base_url: config.uazapi_base_url,
        uazapi_global_token: config.uazapi_global_token,
      })
      toast.success('Configurações salvas com sucesso!')
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCriarPrincipal = async () => {
    if (!novoPrincipalNome.trim()) { toast.error('Informe um nome para a instância'); return }
    setCriandoPrincipal(true)
    try {
      const res = await callManageInstance({
        action: 'create',
        nome: novoPrincipalNome.trim(),
        tipo: 'principal',
      })
      setInstances(prev => [...prev, res.instance])
      setNovoPrincipalNome('')
      toast.success('Instância criada. Clique em "Conectar" para escanear o QR Code.')
    } catch (err: any) {
      toast.error(`Erro ao criar instância: ${err.message}`)
    } finally {
      setCriandoPrincipal(false)
    }
  }

  const handleRefreshStatus = async (id: string) => {
    try {
      const res = await callManageInstance({ action: 'status', instance_id: id })
      setInstances(prev => prev.map(i => i.id === id ? { ...i, status: res.status } : i))
    } catch (err: any) {
      toast.error(`Erro ao verificar status: ${err.message}`)
    }
  }

  const handleDisconnect = async (id: string) => {
    try {
      await callManageInstance({ action: 'disconnect', instance_id: id })
      setInstances(prev => prev.map(i => i.id === id ? { ...i, status: 'desconectado', numero: '' } : i))
      toast.success('Instância desconectada.')
    } catch (err: any) {
      toast.error(`Erro ao desconectar: ${err.message}`)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credenciais uazapi.dev</CardTitle>
          <CardDescription>Token global para gerenciar instâncias. Obtenha em uazapi.dev após criar sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>URL da API</Label>
            <Input
              value={config.uazapi_base_url}
              onChange={e => setConfig(c => ({ ...c, uazapi_base_url: e.target.value }))}
              placeholder="https://api.uazapi.dev"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Token Global</Label>
            <Input
              type="password"
              value={config.uazapi_global_token}
              onChange={e => setConfig(c => ({ ...c, uazapi_global_token: e.target.value }))}
              placeholder="Token de autenticação da API"
            />
          </div>
          <Button onClick={handleSaveConfig} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar credenciais
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Número Principal</CardTitle>
          <CardDescription>
            Número usado pela Zion para contato direto com leads (Débora / testes).
            Pode ser substituído a qualquer momento sem afetar o histórico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {instances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum número principal cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {instances.map(inst => (
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

          <div className="space-y-2">
            <Label>Adicionar / substituir número principal</Label>
            <div className="flex gap-2">
              <Input
                value={novoPrincipalNome}
                onChange={e => setNovoPrincipalNome(e.target.value)}
                placeholder='Ex: "Número Débora" ou "Testes Eduardo"'
                className="flex-1"
              />
              <Button onClick={handleCriarPrincipal} disabled={criandoPrincipal}>
                {criandoPrincipal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Após criar, clique em "Conectar" e escaneie o QR Code com o celular.
            </p>
          </div>
        </CardContent>
      </Card>

      {qrTarget && (
        <QrCodeModal
          instance={qrTarget}
          open={!!qrTarget}
          onClose={() => setQrTarget(null)}
          onConnected={(numero) => {
            setInstances(prev => prev.map(i => i.id === qrTarget!.id ? { ...i, status: 'conectado', numero } : i))
            setQrTarget(null)
          }}
        />
      )}
    </div>
  )
}
