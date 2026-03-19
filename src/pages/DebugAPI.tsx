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
  HelpCircle,
  AlertTriangle,
  Info,
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
  401: {
    title: '❌ Não Autorizado (Erro 401)',
    meaning: 'O token de acesso (API Key) é inválido ou expirou.',
    action: "Acesse a tela 'Avançado' e atualize o 'Token de Integração API Casa dos Dados'.",
  },
  403: {
    title: '❌ Proibido (Erro 403)',
    meaning:
      'Sua conta não tem permissão para acessar este recurso ou o limite do plano foi atingido.',
    action: 'Verifique seu saldo ou permissões na Casa dos Dados.',
  },
  404: {
    title: '❌ Recurso não encontrado (Erro 404)',
    meaning:
      'O servidor da Casa dos Dados não encontrou a informação solicitada ou o endereço da API está incorreto.',
    action: [
      'Verifique se o CNAE informado é válido e possui 7 dígitos.',
      'Confirme se a UF (Estado) está escrita corretamente (Ex: SP, RJ).',
      'Verifique se o Município possui caracteres especiais ou erros de digitação.',
      'Certifique-se de que a URL da API configurada no sistema está correta.',
    ],
  },
  429: {
    title: '❌ Limite de Requisições Excedido (Erro 429)',
    meaning: 'Você atingiu o limite de consultas permitidas pelo seu plano na Casa dos Dados.',
    action:
      'Aguarde alguns minutos antes de tentar novamente ou verifique o limite do seu plano contratado.',
  },
  '5xx': {
    title: '❌ Erro Interno no Servidor (Erro 5xx)',
    meaning: 'O serviço da Casa dos Dados está enfrentando instabilidades momentâneas.',
    action:
      'Tente novamente em instantes. Se o problema persistir, entre em contato com o suporte técnico da Casa dos Dados.',
  },
}

const getErrorExplanation = (status: number | null) => {
  if (!status || status < 400) return null
  if (status >= 500 && status <= 503) {
    return HTTP_ERROR_DICTIONARY['5xx']
  }
  return (
    HTTP_ERROR_DICTIONARY[status] || {
      title: `❌ Erro Desconhecido (Erro ${status})`,
      meaning: 'Ocorreu um erro não catalogado ao processar a requisição.',
      action: 'Verifique os logs detalhados ou contate o suporte.',
    }
  )
}

export default function DebugAPI() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador'

  const [hasToken, setHasToken] = useState<boolean | null>(null)
  const [cnae, setCnae] = useState('')
  const [uf, setUf] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [limit, setLimit] = useState<number | ''>(5)
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
      const dummyCnae = Math.floor(Math.random() * 9000000 + 1000000).toString()
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
          message: '✅ Conectado à API Casa dos Dados',
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
    const cleanCnae = cnae.replace(/\D/g, '')

    try {
      const { data, error } = await supabase.functions.invoke('buscar-leads', {
        body: {
          cnae_fiscal_principal: cleanCnae ? [cleanCnae] : [],
          uf: uf && uf !== 'Todos' ? uf : null,
          municipio: municipio ? municipio.trim() : null,
          limit: limit || 5,
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

      await supabase.from('api_debug_logs').insert({
        cnae: cleanCnae || null,
        uf: uf && uf !== 'Todos' ? uf : null,
        municipio: municipio || null,
        limite: limit || null,
        status_http: status,
        sucesso: success,
        tempo_resposta_ms: timeTaken,
        total_resultados: resultadosQtd,
        resposta_json: respostaJson,
      } as any)

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

  const errorExplanation = getErrorExplanation(httpStatus)

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Admin - Debug API</h2>
          <p className="text-muted-foreground mt-1">
            Monitore o status da integração com a Casa dos Dados, realize testes manuais e analise
            as respostas.
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Guia de Resolução de Erros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Guia Rápido de Erros</h4>
                <p className="text-sm text-muted-foreground">
                  Principais códigos de retorno e o que fazer em cada caso.
                </p>
              </div>
              <div className="space-y-4">
                {Object.values(HTTP_ERROR_DICTIONARY).map((err, idx) => (
                  <div key={idx} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-sm text-destructive">{err.title}</p>
                    <p className="text-sm mt-1">
                      <span className="font-semibold text-muted-foreground">Significa:</span>{' '}
                      {err.meaning}
                    </p>
                    <div className="text-sm mt-1">
                      <span className="font-semibold text-muted-foreground">Ações:</span>{' '}
                      {Array.isArray(err.action) ? (
                        <ul className="list-decimal pl-5 space-y-1 mt-1">
                          {err.action.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      ) : (
                        <span>{err.action}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
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
                  <Label>CNAE (Opcional)</Label>
                  <Input
                    placeholder="Ex: 4683-4/00"
                    value={cnae}
                    onChange={(e) => setCnae(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label>Município (Opcional)</Label>
                    <Input
                      placeholder="Ex: São Paulo"
                      value={municipio}
                      onChange={(e) => setMunicipio(e.target.value)}
                    />
                  </div>
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
            <CardTitle className="text-lg">Resposta da API</CardTitle>
            <CardDescription>Visualizador em tempo real dos dados retornados</CardDescription>
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

            {errorExplanation && (
              <Alert
                variant="destructive"
                className="animate-in fade-in slide-in-from-top-2 border-destructive/50 bg-destructive/5"
              >
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle className="font-semibold text-destructive">
                  {errorExplanation.title}
                </AlertTitle>
                <AlertDescription className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
                  <div>
                    <strong className="font-semibold block mb-1">O que significa:</strong>
                    <p>{errorExplanation.meaning}</p>
                  </div>
                  <div>
                    <strong className="font-semibold block mb-1">Ações para corrigir:</strong>
                    {Array.isArray(errorExplanation.action) ? (
                      <ul className="list-decimal pl-5 space-y-1">
                        {errorExplanation.action.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{errorExplanation.action}</p>
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
                  const logErrorExplanation = getErrorExplanation(log.status_http)

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

                          {logErrorExplanation && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-destructive/10 text-destructive shrink-0"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" side="top">
                                <div className="space-y-2 text-sm">
                                  <p className="font-semibold text-destructive flex items-center gap-2">
                                    {logErrorExplanation.title}
                                  </p>
                                  <p>
                                    <span className="font-medium text-muted-foreground">
                                      Significa:
                                    </span>{' '}
                                    {logErrorExplanation.meaning}
                                  </p>
                                  <div className="mt-1">
                                    <span className="font-medium text-muted-foreground">
                                      Ações para corrigir:
                                    </span>
                                    {Array.isArray(logErrorExplanation.action) ? (
                                      <ul className="list-decimal pl-5 space-y-1 mt-1">
                                        {logErrorExplanation.action.map((act, i) => (
                                          <li key={i}>{act}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="mt-1">{logErrorExplanation.action}</p>
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
