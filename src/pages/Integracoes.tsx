import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Wand2,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import { useActivityLogger } from '@/hooks/use-activity-logger'
import ConfiguracoesBitrix from './ConfiguracoesBitrix'
import ConfiguracoesAvancadas from './ConfiguracoesAvancadas'

export default function Integracoes() {
  const { user, hasPermission } = useAuthStore()
  const { logAction } = useActivityLogger()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  const [openAiKey, setOpenAiKey] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Estados para o teste de geração
  const [testCnae, setTestCnae] = useState('')
  const [testPorte, setTestPorte] = useState('')
  const [testDores, setTestDores] = useState('')
  const [generatedPitch, setGeneratedPitch] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

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

  const handleGeneratePitch = async () => {
    if (!openAiKey.trim()) {
      toast.error('Configure e salve a chave de API primeiro.')
      return
    }
    if (!testCnae || !testPorte || !testDores) {
      toast.error('Preencha todos os campos para um teste completo.')
      return
    }

    setIsGenerating(true)
    setGeneratedPitch('')
    try {
      const response = await supabase.functions.invoke('test-openai-prompt', {
        body: {
          apiKey: openAiKey.trim(),
          cnae: testCnae,
          porte: testPorte,
          dores: testDores,
        },
      })

      if (response.error) throw response.error
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro desconhecido')

      setGeneratedPitch(response.data.result)
      toast.success('Abordagem gerada com sucesso!')

      logAction('test', 'openai_integration', { cnae: testCnae, porte: testPorte })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Falha ao gerar abordagem. Verifique se a API Key é válida.')
    } finally {
      setIsGenerating(false)
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

          {/* Seção de Teste do OpenAI */}
          <Card className="mt-6 border-blue-200/50 dark:border-blue-900/50">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                Testar Geração de Abordagem
              </CardTitle>
              <CardDescription>
                Valide a qualidade das respostas da IA simulando o perfil de um lead real. Preencha
                os dados abaixo e veja como a IA estrutura uma mensagem de vendas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-cnae">Setor / CNAE</Label>
                  <Input
                    id="test-cnae"
                    placeholder="Ex: 6201-5/01 - Desenvolvimento de software..."
                    value={testCnae}
                    onChange={(e) => setTestCnae(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Porte da Empresa</Label>
                  <Select value={testPorte} onValueChange={setTestPorte}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o porte..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Micro Empresa">Micro Empresa</SelectItem>
                      <SelectItem value="Pequena Empresa">Pequena Empresa</SelectItem>
                      <SelectItem value="Média Empresa">Média Empresa</SelectItem>
                      <SelectItem value="Grande Empresa">Grande Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-dores">Principais Dores / Desafios</Label>
                <Textarea
                  id="test-dores"
                  placeholder="Ex: Processos manuais, perda de tempo na prospecção de novos clientes, baixa conversão..."
                  value={testDores}
                  onChange={(e) => setTestDores(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleGeneratePitch}
                  disabled={
                    isGenerating || !openAiKey.trim() || !testCnae || !testPorte || !testDores
                  }
                  className="w-full sm:w-auto"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4 mr-2" />
                  )}
                  Gerar Abordagem de Teste
                </Button>
              </div>

              {generatedPitch && (
                <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/50 animate-in fade-in-50 duration-500">
                  <h4 className="text-sm font-semibold mb-3 text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Resultado Gerado pela IA:
                  </h4>
                  <div className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                    {generatedPitch}
                  </div>
                </div>
              )}
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
