import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Play, Copy, Clock, Code2, Globe, Terminal, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type HistoryItem = {
  id: string
  timestamp: string
  endpoint: string
  method: string
  status: number | null
  time: number
}

export default function DebugBitrix() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador'

  const [url, setUrl] = useState('https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [body, setBody] = useState('{\n  \n}')
  const [loading, setLoading] = useState(false)

  const [response, setResponse] = useState<{
    status: number | null
    time: number | null
    data: any
    resHeaders: Record<string, string> | null
  }>({ status: null, time: null, data: null, resHeaders: null })

  const [history, setHistory] = useState<HistoryItem[]>([])

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('bitrix_api_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    if (data) {
      setHistory(
        data.map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          endpoint: item.endpoint,
          method: item.method,
          status: item.status_code,
          time: item.response_time_ms,
        })),
      )
    }
  }

  useEffect(() => {
    if (isAdmin === false) {
      navigate('/')
    } else {
      fetchHistory()
    }
  }, [isAdmin, navigate])

  if (!isAdmin) return null

  const handleSendRequest = async () => {
    if (!url.trim()) {
      toast.error('A URL do endpoint é obrigatória.')
      return
    }

    setLoading(true)
    setResponse({ status: null, time: null, data: null, resHeaders: null })

    let parsedHeaders: Record<string, string> = {}
    try {
      if (headers.trim()) {
        parsedHeaders = JSON.parse(headers)
      }
    } catch (e) {
      toast.error('Formato JSON inválido nos Headers.')
      setLoading(false)
      return
    }

    let parsedBody = null
    if (method !== 'GET' && method !== 'DELETE' && body.trim()) {
      try {
        parsedBody = JSON.parse(body)
      } catch (e) {
        toast.error('Formato JSON inválido no Body.')
        setLoading(false)
        return
      }
    }

    try {
      const { data: session } = await supabase.auth.getSession()
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bitrix-rate-limiter`

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({
          endpoint: url,
          method,
          headers: parsedHeaders,
          body: parsedBody,
        }),
      })

      const resData = await res.json()

      if (res.status === 429) {
        toast.error(resData.message || 'Rate limit atingido')
        setResponse({
          status: 429,
          time: null,
          resHeaders: {},
          data: resData,
        })
        return
      }

      setResponse({
        status: resData.status_code || res.status,
        time: resData.time_ms || 0,
        resHeaders: resData.response_headers || {},
        data: resData.data || resData,
      })

      if (resData.success) {
        toast.success('Requisição finalizada')
      } else {
        toast.error(resData.message || 'Falha na requisição')
      }

      fetchHistory()
    } catch (err: any) {
      toast.error('Falha ao conectar com o serviço: ' + err.message)
      setResponse({
        status: 0,
        time: null,
        resHeaders: {},
        data: { error: err.message },
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCurl = () => {
    let curl = `curl -X ${method} "${url}"`

    try {
      if (headers.trim()) {
        const parsed = JSON.parse(headers)
        Object.entries(parsed).forEach(([k, v]) => {
          curl += ` \\\n  -H "${k}: ${v}"`
        })
      }
    } catch (e) {
      // Ignore parse errors here, already validated on send
    }

    if (method !== 'GET' && body.trim()) {
      const escapedBody = body.replace(/'/g, "'\\''")
      curl += ` \\\n  -d '${escapedBody}'`
    }

    navigator.clipboard.writeText(curl)
    toast.success('Comando cURL copiado com sucesso!')
  }

  const handleClearHistory = async () => {
    const { error } = await supabase
      .from('bitrix_api_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      toast.error('Erro ao limpar histórico')
    } else {
      toast.success('Histórico limpo com sucesso')
      setHistory([])
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Admin - Debug Bitrix</h2>
        <p className="text-muted-foreground mt-1">
          Ferramenta para testar e auditar endpoints da API do Bitrix24 passando pelo Rate Limiter.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Configuração da Requisição
            </CardTitle>
            <CardDescription>Defina os parâmetros para a chamada à API.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="flex gap-2">
              <div className="w-1/4">
                <Label className="mb-2 block">Método</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="mb-2 block">URL do Endpoint</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://zionlogtec.bitrix24.com.br/rest/..."
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Headers (JSON)</Label>
              <Textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="font-mono text-sm min-h-[100px]"
                placeholder={'{\n  "Authorization": "Bearer token"\n}'}
              />
            </div>

            <div>
              <Label className="mb-2 block">Body (JSON)</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="font-mono text-sm min-h-[150px]"
                disabled={method === 'GET' || method === 'DELETE'}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSendRequest} disabled={loading} className="flex-1 gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Enviar Requisição
              </Button>
              <Button variant="outline" onClick={handleCopyCurl} className="gap-2 shrink-0">
                <Terminal className="w-4 h-4" />
                Copiar cURL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resposta */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Resultado da Requisição
            </CardTitle>
            <CardDescription>Retorno do servidor via Proxy Rate Limiter.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 border px-3 py-1.5 rounded-md bg-muted/30">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={
                    response.status === 429
                      ? 'destructive'
                      : response.status && response.status >= 200 && response.status < 300
                        ? 'default'
                        : response.status
                          ? 'destructive'
                          : 'secondary'
                  }
                  className={
                    response.status === 429
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : response.status && response.status >= 200 && response.status < 300
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : ''
                  }
                >
                  {response.status || '-'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 border px-3 py-1.5 rounded-md bg-muted/30">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tempo:</span>
                <span className="text-sm font-mono">
                  {response.time !== null ? `${response.time} ms` : '-'}
                </span>
              </div>
            </div>

            {response.status !== null ? (
              <Tabs defaultValue="body" className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger
                    value="body"
                    className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Body
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    Headers
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="body" className="flex-1 outline-none mt-2">
                  <ScrollArea className="h-[380px] w-full rounded-md border bg-slate-950 p-4">
                    <pre
                      className={cn(
                        'text-sm font-mono whitespace-pre-wrap break-all',
                        response.status === 429
                          ? 'text-amber-400'
                          : response.status >= 200 && response.status < 300
                            ? 'text-emerald-400'
                            : 'text-destructive/90',
                      )}
                    >
                      {typeof response.data === 'object'
                        ? JSON.stringify(response.data, null, 2)
                        : response.data}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="headers" className="flex-1 outline-none mt-2">
                  <ScrollArea className="h-[380px] w-full rounded-md border bg-slate-950 p-4">
                    <pre className="text-sm font-mono whitespace-pre-wrap break-all text-blue-400">
                      {JSON.stringify(response.resHeaders, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex-1 border rounded-md bg-muted/10 flex items-center justify-center min-h-[300px] text-muted-foreground font-mono text-sm">
                Aguardando execução da requisição...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Histórico de Testes</CardTitle>
            <CardDescription>Últimas 10 requisições realizadas através do Proxy.</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Histórico
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[180px]">Data/Hora</TableHead>
                <TableHead className="w-[100px]">Método</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px]">Tempo</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Nenhum registro no histórico.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                      {new Date(item.timestamp).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {item.method}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs truncate max-w-[300px]"
                      title={item.endpoint}
                    >
                      {item.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 429
                            ? 'destructive'
                            : item.status && item.status >= 200 && item.status < 300
                              ? 'default'
                              : 'destructive'
                        }
                        className={
                          item.status === 429
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : item.status && item.status >= 200 && item.status < 300
                              ? 'bg-emerald-500 hover:bg-emerald-600'
                              : ''
                        }
                      >
                        {item.status === 0 ? 'FALHA' : item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{item.time} ms</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setUrl(item.endpoint)
                          setMethod(item.method)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        title="Carregar no formulário"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
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
