import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { Trash2, Activity, Clock, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MonitoramentoBitrix() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador'

  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<{
    max_requests: number
    time_window_minutes: number
  } | null>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    try {
      const { data: cfgData } = await supabase
        .from('bitrix_rate_limit_config')
        .select('max_requests, time_window_minutes')
        .limit(1)
        .maybeSingle()

      if (cfgData) setConfig(cfgData)

      const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const { data: logsData } = await supabase
        .from('bitrix_api_logs')
        .select('id, timestamp, endpoint, method, status_code, response_time_ms')
        .gte('timestamp', sixtyMinsAgo)
        .order('timestamp', { ascending: false })
        .limit(1000)

      if (logsData) {
        setRecentLogs(logsData)
      }
    } catch (err) {
      console.error('Erro ao buscar dados do monitoramento:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin === false) {
      navigate('/')
      return
    }

    if (isAdmin) {
      fetchData()
      const interval = setInterval(fetchData, 5000)
      return () => clearInterval(interval)
    }
  }, [isAdmin, navigate, fetchData])

  const handleReset = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o histórico de requisições?')) return

    try {
      const { error } = await supabase
        .from('bitrix_api_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Deletes all records safely

      if (error) throw error
      toast.success('Histórico de requisições limpo com sucesso')
      fetchData()
    } catch (err: any) {
      toast.error('Erro ao limpar histórico: ' + err.message)
    }
  }

  if (!isAdmin) return null

  // --- Calculations ---
  const now = Date.now()
  const last100 = recentLogs.slice(0, 100)
  const last20 = recentLogs.slice(0, 20)

  // 1. Chart Data (Last 60 minutes bucketed by minute)
  const chartMap = new Map()
  for (let i = 0; i < 60; i++) {
    const minDate = new Date(now - i * 60 * 1000)
    const timeLabel = minDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    chartMap.set(timeLabel, { time: timeLabel, count: 0 })
  }

  recentLogs.forEach((log) => {
    const t = new Date(log.timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    if (chartMap.has(t)) {
      chartMap.get(t).count += 1
    }
  })
  const chartData = Array.from(chartMap.values()).reverse()

  // 2. Error Rate (Last 100 requests)
  const errorCount = last100.filter((l) => l.status_code >= 400).length
  const errorRate = last100.length > 0 ? Math.round((errorCount / last100.length) * 100) : 0

  let errorColor = 'text-emerald-500'
  if (errorRate >= 5 && errorRate <= 10) errorColor = 'text-amber-500'
  else if (errorRate > 10) errorColor = 'text-destructive'

  // 3. Avg Time
  const totalTime = last100.reduce((acc, l) => acc + (l.response_time_ms || 0), 0)
  const avgTime = last100.length > 0 ? Math.round(totalTime / last100.length) : 0

  // 4. Rate Limit Usage
  const maxReqs = config?.max_requests || 2
  const windowMins = config?.time_window_minutes || 1
  const windowStartMs = now - windowMins * 60 * 1000

  const currentUsage = recentLogs.filter(
    (l) => new Date(l.timestamp).getTime() >= windowStartMs,
  ).length
  const usagePercent = maxReqs > 0 ? (currentUsage / maxReqs) * 100 : 0
  const isNearLimit = usagePercent > 80

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Monitoramento Bitrix</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe a saúde, performance e limites da integração com o Bitrix24 em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="animate-pulse bg-emerald-50 text-emerald-600 border-emerald-200"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
            Atualizando em tempo real
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Resetar Contador
          </Button>
        </div>
      </div>

      {isNearLimit && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Atenção: Rate Limit Próximo</AlertTitle>
          <AlertDescription>
            O consumo de API atingiu {Math.round(usagePercent)}% do limite permitido configurado (
            {maxReqs} requisições a cada {windowMins} minuto(s)).
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Uso do Rate Limit
            </CardTitle>
            <Activity
              className={cn('h-4 w-4', isNearLimit ? 'text-destructive' : 'text-muted-foreground')}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentUsage}{' '}
              <span className="text-lg text-muted-foreground font-normal">/ {maxReqs}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requisições usadas nos últimos {windowMins} min
            </p>
            <div className="w-full h-2 bg-secondary rounded-full mt-3 overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  isNearLimit ? 'bg-destructive' : 'bg-primary',
                )}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Erro
            </CardTitle>
            {errorRate < 5 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle className={cn('h-4 w-4', errorColor)} />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', errorColor)}>{errorRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado nas últimas 100 requisições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgTime} <span className="text-lg text-muted-foreground font-normal">ms</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Latência média (últimas 100 reqs)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volume de Requisições</CardTitle>
          <CardDescription>
            Tráfego recebido pela Edge Function nos últimos 60 minutos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ count: { label: 'Requisições', color: 'hsl(var(--primary))' } }}
            className="h-[250px] w-full"
          >
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                minTickGap={30}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Requisições</CardTitle>
          <CardDescription>Auditoria detalhada das 20 chamadas mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Timestamp</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && last20.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : last20.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma requisição registrada.
                  </TableCell>
                </TableRow>
              ) : (
                last20.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.method}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs truncate max-w-[200px] sm:max-w-[300px]"
                      title={log.endpoint}
                    >
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status_code === 429
                            ? 'destructive'
                            : log.status_code && log.status_code < 300
                              ? 'default'
                              : log.status_code && log.status_code < 500
                                ? 'secondary'
                                : 'destructive'
                        }
                        className={cn(
                          log.status_code === 429
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : log.status_code && log.status_code < 300
                              ? 'bg-emerald-500 hover:bg-emerald-600'
                              : log.status_code && log.status_code < 500
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : '',
                        )}
                      >
                        {log.status_code || 'FALHA'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono whitespace-nowrap">
                      {log.response_time_ms !== null ? `${log.response_time_ms} ms` : '-'}
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
