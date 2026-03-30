import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Loader2,
  Download,
  ShieldAlert,
  CalendarIcon,
  Activity,
  AlertOctagon,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function AuditLogs() {
  const { user, hasPermission } = useAuthStore()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  const [logs, setLogs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState({ activeSessions: 0, suspicious: 0, total: 0 })
  const [chartData, setChartData] = useState<any[]>([])
  const [filters, setFilters] = useState({
    user: 'Todos',
    action: 'Todas',
    date: undefined as Date | undefined,
  })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)

    const [sessRes, suspRes, usersRes] = await Promise.all([
      supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .is('logout_time', null),
      supabase
        .from('suspicious_activity')
        .select('*', { count: 'exact', head: true })
        .eq('resolvido', false),
      supabase.from('profiles').select('user_id, nome'),
    ])
    if (usersRes.data) setUsers(usersRes.data)

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50)
    if (filters.user !== 'Todos') query = query.eq('user_id', filters.user)
    if (filters.action !== 'Todas') query = query.eq('acao', filters.action)
    if (filters.date) {
      const start = new Date(filters.date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(filters.date)
      end.setHours(23, 59, 59, 999)
      query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
    }

    const { data: logData, count } = await query
    setLogs(logData || [])
    setStats({
      activeSessions: sessRes.count || 0,
      suspicious: suspRes.count || 0,
      total: count || 0,
    })

    const d = new Date()
    d.setDate(d.getDate() - 7)
    const { data: chartLogs } = await supabase
      .from('audit_logs')
      .select('created_at')
      .gte('created_at', d.toISOString())

    const days = Array.from({ length: 7 }, (_, i) => {
      const x = new Date()
      x.setDate(x.getDate() - i)
      return x.toISOString().split('T')[0]
    }).reverse()
    const counts = days.reduce((a, day) => ({ ...a, [day]: 0 }), {} as any)
    chartLogs?.forEach((l) => {
      const date = l.created_at.split('T')[0]
      if (counts[date] !== undefined) counts[date]++
    })
    setChartData(
      days.map((day) => ({
        date: day.split('-').reverse().slice(0, 2).join('/'),
        acessos: counts[day],
      })),
    )

    setLoading(false)
  }, [isAdmin, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const userMap = useMemo(
    () => users.reduce((acc, u) => ({ ...acc, [u.user_id]: u.nome }), {}),
    [users],
  )

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold text-red-500">Acesso Restrito</h2>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <ShieldAlert className="text-primary" /> Segurança e Auditoria
          </h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real de acessos e atividades.
          </p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="gap-2 bg-white">
          <Download className="h-4 w-4" /> Exportar Relatório (PDF)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="h-10 w-10 text-blue-500 bg-blue-50 p-2 rounded-full" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Sessões Ativas</p>
              <p className="text-2xl font-bold">{stats.activeSessions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <AlertOctagon className="h-10 w-10 text-red-500 bg-red-50 p-2 rounded-full" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Atividades Suspeitas</p>
              <p className="text-2xl font-bold">{stats.suspicious}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Activity className="h-10 w-10 text-emerald-500 bg-emerald-50 p-2 rounded-full" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Logs Filtrados</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="print:block">
        <CardHeader className="pb-2 print:hidden">
          <CardTitle className="text-lg">Volume de Acessos (Últimos 7 dias)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer
            config={{ acessos: { label: 'Acessos', color: 'hsl(var(--primary))' } }}
            className="h-[250px] w-full"
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                fill="#6b7280"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                fill="#6b7280"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="acessos"
                stroke="var(--color-acessos)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--color-acessos)' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border-b">
          <Select
            value={filters.user}
            onValueChange={(v) => setFilters((f) => ({ ...f, user: v }))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Usuários</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.user_id} value={u.user_id}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.action}
            onValueChange={(v) => setFilters((f) => ({ ...f, action: v }))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Ações</SelectItem>
              <SelectItem value="LOGIN">LOGIN</SelectItem>
              <SelectItem value="CREATE">CREATE</SelectItem>
              <SelectItem value="UPDATE">UPDATE</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('justify-start bg-white', !filters.date && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date ? filters.date.toLocaleDateString('pt-BR') : 'Filtrar por Data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0">
              <Calendar
                mode="single"
                selected={filters.date}
                onSelect={(d) => setFilters((f) => ({ ...f, date: d }))}
              />
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => setFilters((f) => ({ ...f, date: undefined }))}
                >
                  Limpar Data
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {userMap[log.user_id] || 'Sistema'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] uppercase',
                          log.acao === 'DELETE' && 'border-red-200 text-red-700',
                          log.acao === 'CREATE' && 'border-emerald-200 text-emerald-700',
                        )}
                      >
                        {log.acao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {log.tabela_acessada || '-'}
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <div
                        className="text-[10px] font-mono truncate bg-slate-100 p-1.5 rounded text-slate-600"
                        title={JSON.stringify(log.dados_acessados || {})}
                      >
                        {JSON.stringify(log.dados_acessados || {})}
                      </div>
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
