import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Bot,
  Database,
  Workflow,
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import ConfiguracoesBitrix from './ConfiguracoesBitrix'
import ConfiguracoesAvancadas from './ConfiguracoesAvancadas'

export default function Integracoes() {
  const { user, hasPermission } = useAuthStore()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  const [openAiKey, setOpenAiKey] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOpenAiConfig = async () => {
      if (!isAdmin) return
      setIsLoading(true)
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'openai_config')
          .maybeSingle()

        if (data?.value) {
          const config = data.value as any
          if (config.api_key) {
            setOpenAiKey(config.api_key)
          }
          if (config.is_connected !== undefined) {
            setIsConnected(config.is_connected)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do OpenAI:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchOpenAiConfig()
  }, [isAdmin])

  const handleTestConnection = async () => {
    if (!openAiKey.trim()) {
      toast.error('Por favor, insira uma chave de API.')
      return
    }

    setIsTesting(true)
    try {
      const response = await supabase.functions.invoke('test-openai-connection', {
        body: { apiKey: openAiKey.trim() },
      })

      if (response.error) throw response.error
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro desconhecido')

      setIsConnected(true)
      toast.success('Conexão com OpenAI estabelecida com sucesso!')

      handleSaveKey(true)
    } catch (error: any) {
      console.error(error)
      setIsConnected(false)
      toast.error(error.message || 'Falha ao conectar com OpenAI. Verifique sua chave.')
      handleSaveKey(false)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveKey = async (connectedStatus: boolean | null = null) => {
    setIsSaving(true)
    try {
      const statusToSave = connectedStatus !== null ? connectedStatus : isConnected
      const { error } = await supabase.from('settings').upsert(
        {
          key: 'openai_config',
          value: {
            api_key: openAiKey.trim(),
            is_connected: statusToSave,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )

      if (error) throw error

      if (connectedStatus === null) {
        toast.success('Chave salva com segurança!')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar chave.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Integrações do Sistema</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie as conexões com serviços externos e APIs para potencializar o sistema.
        </p>
      </div>

      <Tabs defaultValue="openai" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="openai" className="flex items-center justify-center gap-2">
            <Bot className="w-4 h-4 hidden sm:block" /> OpenAI
          </TabsTrigger>
          <TabsTrigger value="bitrix" className="flex items-center justify-center gap-2">
            <Workflow className="w-4 h-4 hidden sm:block" /> Bitrix24
          </TabsTrigger>
          <TabsTrigger value="casadosdados" className="flex items-center justify-center gap-2">
            <Database className="w-4 h-4 hidden sm:block" /> Casa dos Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="openai" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" /> Inteligência Artificial (OpenAI)
                </CardTitle>
                <CardDescription>
                  Configure a chave de API da OpenAI para habilitar recursos de inteligência
                  artificial no sistema. A chave é armazenada de forma segura através do Supabase
                  Secrets.
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
                  <Label htmlFor="openai-key">Secret API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        className="pl-9 font-mono"
                        value={openAiKey}
                        onChange={(e) => setOpenAiKey(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sua chave nunca será exibida publicamente. Ela é encriptada e armazenada no
                    cofre de segurança.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleTestConnection}
                    disabled={isTesting || !openAiKey.trim()}
                    className="flex-1 sm:flex-none"
                  >
                    {isTesting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Testar Conexão
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSaveKey(null)}
                    disabled={isSaving || !openAiKey.trim()}
                    className="flex-1 sm:flex-none"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Chave
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bitrix" className="animate-in fade-in-50 duration-500">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium">Configurações do Bitrix24</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie a sincronização de leads com o seu CRM.
              </p>
            </div>
            <ConfiguracoesBitrix embedded />
          </div>
        </TabsContent>

        <TabsContent value="casadosdados" className="animate-in fade-in-50 duration-500">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium">API Casa dos Dados</h3>
              <p className="text-sm text-muted-foreground">
                Configure a busca de CNPJs e recursos de cache.
              </p>
            </div>
            <ConfiguracoesAvancadas embedded />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
