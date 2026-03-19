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
import { Loader2, Activity, Clock, CheckCircle2, XCircle, Code2, Play } from 'lucide-react'
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

export default function DebugAPI() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador'

  const [hasToken, setHasToken] = useState<boolean | null>(null)
  const [cnae, setCnae] = useState('')
  const [uf, setUf] = useState('')
  const [limit, setLimit] = useState<number | ''>(5)
  const [loading, setLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<any>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [httpStatus, setHttpStatus] = useState<number | null>(null)
  const [history, setHistory] = useState<any[]>([])

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
      .limit(5)

    if (data) setHistory(data)
  }

  const handleTestAPI = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLastResponse(null)
    setLatency(null)
    setHttpStatus(null)

    const start = performance.now()
    const cleanCnae = cnae.replace(/\D/g, '')

    try {
      const { data, error } = await supabase.functions.invoke('buscar-leads', {
        body: {
          cnae_fiscal_principal: cleanCnae ? [cleanCnae] : [],
          uf: uf && uf !== 'Todos' ? uf : null,
          limit: limit || 5,
        },
      })

      const end = performance.now()
      const timeTaken = Math.round(end - start)
      setLatency(timeTaken)

      let status = 200
      let success = true

      if (error) {
        status = error.status || 500
        success = false
        setLastResponse({ message: error.message, details: error })
      } else {
        setLastResponse(data)
        if (data?.status_http) {
          status = data.status_http
        } else if (data?.error) {
          status = 400
        }
        success = status >= 200 && status < 300
      }

      setHttpStatus(status)

      await supabase.from('api_debug_logs').insert({
        cnae: cleanCnae || null,
        uf: uf && uf !== 'Todos' ? uf : null,
        status_http: status,
        sucesso: success,
      })

      fetchHistory()
      toast.success('Teste concluído')
    } catch (err: any) {
      console.error(err)
      toast.error('Falha ao executar o teste')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) return null

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Admin - Debug API</h2>
        <p className="text-muted-foreground mt-1">
          Monitore o status da integração com a Casa dos Dados, realize testes manuais e analise as
          respostas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Status da Integração</CardTitle>
            <CardDescription>Verificação da Chave de API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-lg">
              <Activity className="h-6 w-6 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Token Casa dos Dados</p>
                {hasToken === null ? (
                  <span className="text-sm text-muted-foreground">Verificando...</span>
                ) : hasToken ? (
                  <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 mt-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Detectado
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="mt-1">
                    <XCircle className="h-3 w-3 mr-1" /> Não Detectado
                  </Badge>
                )}
              </div>
            </div>

            <form onSubmit={handleTestAPI} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>CNAE (Opcional)</Label>
                <Input
                  placeholder="Ex: 4683-4/00"
                  value={cnae}
                  onChange={(e) => setCnae(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>UF (Opcional)</Label>
                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todas as UFs</SelectItem>
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
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Resposta da API</CardTitle>
            <CardDescription>Visualizador em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4 min-h-[400px]">
            <div className="flex flex-wrap gap-4">
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
            </div>

            <ScrollArea className="flex-1 w-full rounded-md border bg-slate-950 p-4">
              {lastResponse ? (
                <pre className="text-emerald-400 text-sm font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm min-h-[200px]">
                  Aguardando execução do teste...
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas 5 Requisições</CardTitle>
          <CardDescription>Histórico de testes manuais realizados</CardDescription>
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
                history.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.cnae || '-'}</TableCell>
                    <TableCell>{log.uf || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {log.status_http || '-'}
                      </Badge>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
