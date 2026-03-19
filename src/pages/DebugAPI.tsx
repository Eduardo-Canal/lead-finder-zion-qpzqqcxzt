import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Loader2,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Code2,
  Play,
  Hash,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const BRAZIL_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

const HTTP_ERROR_DICTIONARY: Record<
  number | string,
  { title: string; meaning: string; action: string | string[] }
> = {
  400: {
    title: '❌ Requisição Inválida (Erro 400)',
    meaning: 'O formato dos dados enviados está incorreto (ex: estrutura do payload).',
    action: [
      'Verifique se o CNAE possui o formato correto e contém caracteres especiais (ex: 5211-7/01).',
      'Confirme se o objeto JSON enviado segue exatamente a estrutura: {"cnaes": [...], "uf": "XX", "limite": 10}.',
    ],
  },
  401: {
    title: '❌ Não Autorizado (Erro 401)',
    meaning: 'O token de acesso (API Key) é inválido ou expirou.',
    action:
      "Acesse a tela 'Avançado' e atualize o 'Token de Integração API Casa dos Dados' garantindo que ele inclui o formato Bearer correto.",
  },
  403: {
    title: '❌ Proibido (Erro 403)',
    meaning: 'Sua conta não tem permissão para acessar este recurso.',
    action: 'Verifique seu saldo ou permissões na plataforma Casa dos Dados.',
  },
  404: {
    title: '❌ Endpoint não encontrado (Erro 404)',
    meaning: 'O servidor da Casa dos Dados não encontrou a rota solicitada.',
    action: [
      'Confirme se o endpoint na Edge Function está apontando para /v5/cnpj/pesquisa.',
      'Verifique se não há erros de digitação na URL.',
    ],
  },
  429: {
    title: '❌ Limite de Requisições Excedido (Erro 429)',
    meaning: 'Você atingiu o limite de consultas permitidas pelo seu plano.',
    action: 'Aguarde alguns minutos antes de tentar novamente.',
  },
  '5xx': {
    title: '❌ Erro Interno no Servidor (Erro 5xx)',
    meaning: 'O serviço da Casa dos Dados está enfrentando instabilidades.',
    action: 'Tente novamente em instantes.',
  },
}

const getStatusExplanation = (status: number | null) => {
  if (!status) return null
  if (status >= 200 && status < 300) {
    return {
      type: 'success',
      title: '✅ Integração Operacional',
      meaning:
        'A API respondeu corretamente e o novo endpoint está validando os dados com sucesso.',
      action:
        'Nenhuma ação necessária. A integração está operando normalmente com o payload correto e preservando a integridade dos códigos CNAE.',
    }
  }
  if (status >= 500 && status <= 503) {
    return { type: 'error', ...HTTP_ERROR_DICTIONARY['5xx'] }
  }
  return HTTP_ERROR_DICTIONARY[status]
    ? { type: 'error', ...HTTP_ERROR_DICTIONARY[status] }
    : {
        type: 'error',
        title: `❌ Erro Desconhecido (Erro ${status})`,
        meaning: 'Ocorreu um erro não catalogado ao processar a requisição.',
        action: 'Verifique os logs detalhados da Edge Function para investigar.',
      }
}

export default function DebugAPI() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador'

  const [hasToken, setHasToken] = useState<boolean | null>(null)
  const [cnae, setCnae] = useState('')
  const [uf, setUf] = useState('')
  const [limit, setLimit] = useState<number | ''>(10)
  const [loading, setLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<any>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [httpStatus, setHttpStatus] = useState<number | null>(null)
  const [totalResults, setTotalResults] = useState<number | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [isJsonOpen, setIsJsonOpen] = useState(true)

  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    if (isAdmin === false) {
      navigate('/')
      return
    }
    if (isAdmin) {
      fetchStatus()
      fetchHistory()
    }
  }, [isAdmin, navigate])

  const fetchStatus = async () => {
    const { data } = await supabase
      .from('configuracoes_sistema')
      .select('casadosdados_api_token')
      .eq('id', 1)
      .single()

    setHasToken(!!data?.casadosdados_api_token)
  }

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('api_debug_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    if (data) setHistory(data)
  }

  const handleValidateConnection = async () => {
    setIsValidating(true)
    setValidationResult(null)

    try {
      const dummyCnae = '5211-7/01'
      const { data, error } = await supabase.functions.invoke('buscar-leads', {
        body: {
          cnae_fiscal_principal: [dummyCnae],
          limit: 1,
        },
      })

      if (error) {
        setValidationResult({
          success: false,
          message: `❌ Erro na conexão: ${error.message || error.status || 'Erro interno'}`,
        })
        return
      }

      const status = data?.status_http || 200

      if (status >= 200 && status < 300 && !data?.error && !data?.isMock) {
        setValidationResult({
          success: true,
          message: '✅ Conectado à API Casa dos Dados (Novo Endpoint v5)',
        })
      } else {
        const errorMsg = data?.error || (data?.isMock ? 'Token ausente ou inválido' : status)
        setValidationResult({
          success: false,
          message: `❌ Erro na conexão: ${errorMsg}`,
        })
      }
    } catch (err: any) {
      setValidationResult({
        success: false,
        message: `❌ Erro na conexão: ${err.message || 'Erro inesperado'}`,
      })
    } finally {
      setIsValidating(false)
      fetchHistory()
    }
  }

  const handleTestAPI = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLastResponse(null)
    setLatency(null)
    setHttpStatus(null)
    setTotalResults(null)

    const start = performance.now()
    const cleanCnae = cnae.trim()

    try {
      const { data, error } = await supabase.functions.invoke('buscar-leads', {
        body: {
          cnae_fiscal_principal: cleanCnae ? [cleanCnae] : [],
          uf: uf && uf !== 'Todos' ? uf : null,
          limit: limit || 10,
          bypass_cache: true,
        },
      })

      const end = performance.now()
      const timeTaken = Math.round(end - start)
      setLatency(timeTaken)

      let status = 200
      let success = true
      let resultadosQtd = 0
      let respostaJson = null

      if (error) {
        status = error.status || 500
        success = false
        respostaJson = { message: error.message, details: error }
      } else {
        respostaJson = data?.raw_response || data
        if (data?.status_http) {
          status = data.status_http
        } else if (data?.error) {
          status = 400
        }
        success = status >= 200 && status < 300
        resultadosQtd = data?.count ?? (data?.data?.length || 0)
      }

      setLastResponse(respostaJson)
      setHttpStatus(status)
      setTotalResults(resultadosQtd)
      setIsJsonOpen(success)

      fetchHistory()
      toast[success ? 'success' : 'error'](
        success ? 'Teste concluído com sucesso' : 'Falha na requisição',
      )
    } catch (err: any) {
      console.error(err)
      toast.error('Falha ao executar o teste')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) return null

  const statusExplanation = getStatusExplanation(httpStatus)

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Admin - Debug API</h2>
          <p className="text-muted-foreground mt-1">
            Monitore o status da integração com o novo endpoint da Casa dos Dados, preserve filtros
            essenciais e analise respostas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Status da Integração</CardTitle>
            <CardDescription>Verificação da Chave de API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 bg-muted/50 p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Token Casa dos Dados</p>
                  {hasToken === null ? (
                    <span className="text-sm text-muted-foreground">Verificando...</span>
                  ) : hasToken ? (
                    <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 mt-1">
                      ✅ Token detectado
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="mt-1">
                      ❌ Token não configurado
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleValidateConnection}
                disabled={isValidating}
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4 mr-2" />
                )}
                Validar Conexão
              </Button>

              {validationResult && (
                <div
                  className={cn(
                    'text-sm p-3 rounded-md border flex items-start gap-2 break-words',
                    validationResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                      : 'bg-destructive/10 border-destructive/20 text-destructive',
                  )}
                >
                  <span className="font-medium leading-relaxed">{validationResult.message}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium mb-4">Teste de Requisição Manual</h3>
              <form onSubmit={handleTestAPI} className="space-y-4">
                <div className="space-y-2">
                  <Label>CNAE (Opcional - Mantém formatação)</Label>
                  <Input
                    placeholder="Ex: 5211-7/01"
                    value={cnae}
                    onChange={(e) => setCnae(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>UF (Opcional)</Label>
                  <Select value={uf} onValueChange={setUf}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todas</SelectItem>
                      {BRAZIL_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Limite de Resultados</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={limit}
                    onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value) : '')}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Testar API
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Ações Recomendadas e Feedback</CardTitle>
            <CardDescription>Auditoria baseada no retorno do endpoint</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex items-center gap-2 border px-3 py-2 rounded-md bg-muted/30">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status HTTP:</span>
                <Badge
                  variant={
                    httpStatus && httpStatus < 300
                      ? 'default'
                      : httpStatus
                        ? 'destructive'
                        : 'secondary'
                  }
                  className={
                    httpStatus && httpStatus < 300 ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                  }
                >
                  {httpStatus || '-'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 border px-3 py-2 rounded-md bg-muted/30">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tempo:</span>
                <span className="text-sm">{latency ? `${latency} ms` : '-'}</span>
              </div>
              <div className="flex items-center gap-2 border px-3 py-2 rounded-md bg-muted/30">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Resultados:</span>
                <span className="text-sm font-mono">
                  {totalResults !== null ? totalResults : '-'}
                </span>
              </div>
            </div>

            {statusExplanation && (
              <Alert
                variant={statusExplanation.type === 'success' ? 'default' : 'destructive'}
                className={cn(
                  'animate-in fade-in slide-in-from-top-2 border',
                  statusExplanation.type === 'success'
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-destructive/50 bg-destructive/5',
                )}
              >
                {statusExplanation.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                <AlertTitle
                  className={cn(
                    'font-semibold',
                    statusExplanation.type === 'success' ? 'text-emerald-600' : 'text-destructive',
                  )}
                >
                  {statusExplanation.title}
                </AlertTitle>
                <AlertDescription className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
                  <div>
                    <strong className="font-semibold block mb-1">Status Atual:</strong>
                    <p>{statusExplanation.meaning}</p>
                  </div>
                  <div>
                    <strong className="font-semibold block mb-1">Ações Recomendadas:</strong>
                    {Array.isArray(statusExplanation.action) ? (
                      <ul className="list-decimal pl-5 space-y-1">
                        {statusExplanation.action.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{statusExplanation.action}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {lastResponse ? (
              <Collapsible
                open={isJsonOpen}
                onOpenChange={setIsJsonOpen}
                className="w-full border rounded-md mt-4"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                  <h4 className="text-sm font-medium">Resposta JSON (Auditoria)</h4>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                      {isJsonOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <ScrollArea className="w-full bg-slate-950 p-4 max-h-[500px]">
                    <pre
                      className={cn(
                        'text-sm font-mono whitespace-pre-wrap break-all',
                        httpStatus && httpStatus < 300 ? 'text-emerald-400' : 'text-destructive/90',
                      )}
                    >
                      {JSON.stringify(lastResponse, null, 2)}
                    </pre>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="flex-1 border rounded-md bg-muted/10 flex items-center justify-center min-h-[300px] text-muted-foreground font-mono text-sm mt-4">
                Aguardando execução do teste...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Testes</CardTitle>
          <CardDescription>Últimas 10 requisições manuais realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Timestamp</TableHead>
                <TableHead>CNAE</TableHead>
                <TableHead>UF</TableHead>
                <TableHead>Status HTTP</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((log) => {
                  const logExplanation = getStatusExplanation(log.status_http)

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.cnae || '-'}</TableCell>
                      <TableCell>{log.uf || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              log.status_http && log.status_http < 300 ? 'default' : 'destructive'
                            }
                            className={cn(
                              'font-mono',
                              log.status_http && log.status_http < 300
                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                : '',
                            )}
                          >
                            {log.status_http || '-'}
                          </Badge>

                          {logExplanation && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    'h-6 w-6 rounded-full shrink-0',
                                    logExplanation.type === 'success'
                                      ? 'text-emerald-500 hover:bg-emerald-500/10'
                                      : 'text-destructive hover:bg-destructive/10',
                                  )}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" side="top">
                                <div className="space-y-2 text-sm">
                                  <p
                                    className={cn(
                                      'font-semibold flex items-center gap-2',
                                      logExplanation.type === 'success'
                                        ? 'text-emerald-600'
                                        : 'text-destructive',
                                    )}
                                  >
                                    {logExplanation.title}
                                  </p>
                                  <p>
                                    <span className="font-medium text-muted-foreground">
                                      Status:
                                    </span>{' '}
                                    {logExplanation.meaning}
                                  </p>
                                  <div className="mt-1">
                                    <span className="font-medium text-muted-foreground">
                                      Ações Recomendadas:
                                    </span>
                                    {Array.isArray(logExplanation.action) ? (
                                      <ul className="list-decimal pl-5 space-y-1 mt-1">
                                        {logExplanation.action.map((act, i) => (
                                          <li key={i}>{act}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="mt-1">{logExplanation.action}</p>
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.sucesso ? (
                          <span className="flex items-center text-emerald-600 font-medium text-sm">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Sucesso
                          </span>
                        ) : (
                          <span className="flex items-center text-destructive font-medium text-sm">
                            <XCircle className="h-4 w-4 mr-1" /> Falha
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
