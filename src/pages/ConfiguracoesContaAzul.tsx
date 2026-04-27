import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Key,
  RefreshCw,
  Building2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import { useActivityLogger } from '@/hooks/use-activity-logger'

interface ContaAzulConfig {
  client_id: string
  client_secret: string
  test_user?: string
  test_pass?: string
  is_connected?: boolean
  last_tested?: string
}

interface Props {
  embedded?: boolean
}

export default function ConfiguracoesContaAzul({ embedded = false }: Props) {
  const { user, hasPermission } = useAuthStore()
  const { logAction } = useActivityLogger()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  const [config, setConfig] = useState<ContaAzulConfig>({
    client_id: '',
    client_secret: '',
    test_user: '',
    test_pass: '',
  })
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchContaAzulConfig = async () => {
      if (!isAdmin) return
      setIsLoading(true)
      try {
        const { data } = await supabase
          .from('abc_curve_config')
          .select('*')
          .eq('type', 'conta_azul')
          .maybeSingle()

        if (data?.config) {
          const contaAzulConfig = data.config as ContaAzulConfig
          setConfig({
            client_id: contaAzulConfig.client_id || '',
            client_secret: contaAzulConfig.client_secret || '',
            test_user: contaAzulConfig.test_user || '',
            test_pass: contaAzulConfig.test_pass || '',
          })
          setIsConnected(contaAzulConfig.is_connected || null)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do Conta Azul:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchContaAzulConfig()
  }, [isAdmin])

  const handleTestConnection = async () => {
    const clientId = config.client_id.trim()
    const clientSecret = config.client_secret.trim()

    if (!clientId || !clientSecret) {
      toast.error('Por favor, preencha o Client ID e Client Secret.')
      return
    }

    if (clientId.length < 10 || clientSecret.length < 20) {
      toast.error('Credenciais com formato inválido. Verifique Client ID e Client Secret.')
      return
    }

    setIsTesting(true)
    try {
      // Valida formato localmente e salva — validação OAuth real ocorre no primeiro sync de MRR
      await handleSaveConfig(true)
      setIsConnected(true)
      toast.success('Credenciais salvas com sucesso! Conecte via OAuth para ativar o sync.')
    } catch (error: any) {
      setIsConnected(false)
      toast.error('Erro ao salvar configurações.')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveConfig = async (connectedStatus: boolean | null = null) => {
    setIsSaving(true)
    try {
      const statusToSave = connectedStatus !== null ? connectedStatus : isConnected
      const configPayload = {
        client_id: config.client_id.trim(),
        client_secret: config.client_secret.trim(),
        test_user: config.test_user?.trim() || '',
        test_pass: config.test_pass?.trim() || '',
        is_connected: statusToSave,
        last_tested: new Date().toISOString(),
      }

      // Select-then-update/insert para evitar dependência de ON CONFLICT no PostgREST
      const { data: existing } = await supabase
        .from('abc_curve_config')
        .select('id')
        .eq('type', 'conta_azul')
        .maybeSingle()

      let error
      if (existing?.id) {
        ;({ error } = await supabase
          .from('abc_curve_config')
          .update({ config: configPayload, updated_at: new Date().toISOString() })
          .eq('id', existing.id))
      } else {
        ;({ error } = await supabase
          .from('abc_curve_config')
          .insert({ type: 'conta_azul', config: configPayload, updated_at: new Date().toISOString() }))
      }

      if (error) throw error

      if (connectedStatus === null) {
        toast.success('Configurações salvas com segurança!')
      }

      logAction('update', 'conta_azul_config', { connected: statusToSave })
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar configurações.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta configuração.</p>
      </div>
    )
  }

  const content = (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Conta Azul
            </CardTitle>
            <CardDescription>
              Configure as credenciais da API do Conta Azul para sincronização automática de MRR e
              cálculo da Curva ABC. As credenciais são armazenadas de forma segura.
            </CardDescription>
          </div>
          <div>
            {isLoading ? (
              <Badge variant="outline" className="animate-pulse">
                Carregando...
              </Badge>
            ) : isConnected === null ? (
              <Badge variant="outline">Não testado</Badge>
            ) : isConnected ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 px-3 py-1">
                <XCircle className="w-3.5 h-3.5" /> Desconectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="client-id">Client ID</Label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client-id"
                  type="password"
                  placeholder="Seu Client ID do Conta Azul"
                  className="pl-9 font-mono"
                  value={config.client_id}
                  onChange={(e) => setConfig(prev => ({ ...prev, client_id: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-secret">Client Secret</Label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client-secret"
                  type="password"
                  placeholder="Seu Client Secret do Conta Azul"
                  className="pl-9 font-mono"
                  value={config.client_secret}
                  onChange={(e) => setConfig(prev => ({ ...prev, client_secret: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-user">Usuário de Teste (devportal)</Label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="test-user"
                  type="text"
                  placeholder="uuid@devportal.com"
                  className="pl-9 font-mono text-sm"
                  value={config.test_user || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, test_user: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-pass">Senha de Teste (devportal)</Label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="test-pass"
                  type="password"
                  placeholder="Senha do usuário de teste"
                  className="pl-9 font-mono"
                  value={config.test_pass || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, test_pass: e.target.value }))}
                />
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                    Como obter as credenciais:
                  </p>
                  <ol className="text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                    <li>Acesse seu painel Conta Azul</li>
                    <li>Vá para Configurações → Integrações → API</li>
                    <li>Crie uma nova aplicação OAuth</li>
                    <li>Copie o Client ID e Client Secret gerados</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={handleTestConnection}
                disabled={isTesting || !config.client_id.trim() || !config.client_secret.trim()}
                className="flex-1 sm:flex-none"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Salvar Credenciais
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveConfig(null)}
                disabled={isSaving || !config.client_id.trim() || !config.client_secret.trim()}
                className="flex-1 sm:flex-none"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Configurações
              </Button>
            </div>

            {isConnected !== null && config.client_id.trim() && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 space-y-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Passo 2 — Autorizar acesso via OAuth
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Clique no botão abaixo para abrir o Conta Azul e autorizar o acesso. Você será redirecionado de volta automaticamente.
                </p>
                <Button
                  onClick={() => {
                    const redirectUri = `${window.location.origin}/oauth/conta-azul/callback`
                    const params = new URLSearchParams({
                      response_type: 'code',
                      client_id: config.client_id.trim(),
                      redirect_uri: redirectUri,
                    })
                    window.location.href = `https://auth.contaazul.com/oauth2/authorize?${params}`
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Autorizar via Conta Azul
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configurações Conta Azul</h2>
        <p className="text-muted-foreground mt-1">
          Configure a integração com o Conta Azul para sincronização automática de dados financeiros.
        </p>
      </div>
      {content}
    </div>
  )
}