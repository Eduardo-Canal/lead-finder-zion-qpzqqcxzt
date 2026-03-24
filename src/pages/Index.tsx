import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Users, Cloud, CloudOff, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LoadingCard, ErrorState } from '@/components/Notifications/StateBlocks'
import { designTokens } from '@/constants/designTokens'
import { ZionGlobalBackground } from '@/components/ZionGlobalBackground'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const chartConfig = {
  count: {
    label: 'Quantidade',
    color: 'hsl(var(--primary))',
  },
}

const BitrixBadge = ({
  synced,
  createdAt,
  isNew,
}: {
  synced: boolean
  createdAt: string
  isNew?: boolean
}) => {
  const isRecent = Date.now() - new Date(createdAt).getTime() < 60000 * 5 // 5 mins

  if (synced) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-indigo-50 text-indigo-700 border-indigo-200 gap-1.5 shadow-sm font-semibold transition-all duration-500',
          isNew && 'ring-2 ring-indigo-400 ring-offset-1 animate-pulse',
        )}
      >
        <Cloud className="w-3.5 h-3.5 text-indigo-500" /> Bitrix24
      </Badge>
    )
  }

  if (isRecent) {
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 shadow-sm font-semibold"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> Sincronizando...
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-500 border-slate-200 gap-1.5 shadow-sm font-medium"
    >
      <CloudOff className="w-3.5 h-3.5 text-slate-400" /> Não Sincronizado
    </Badge>
  )
}

export default function Index() {
  const [stats, setStats] = useState({
    total: 0,
    byStatus: [] as { name: string; count: number }[],
    byExecutive: [] as { name: string; count: number }[],
    recent: [] as any[],
    allRawData: [] as any[],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [cadenceDays, setCadenceDays] = useState<number>(7)

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(false)

    try {
      const { data: recentData, error: err1 } = await supabase
        .from('leads_salvos')
        .select('id, cnpj, razao_social, status_contato, created_at, profiles(nome)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (err1) throw err1

      const { data: allData, error: err2 } = await supabase
        .from('leads_salvos')
        .select('status_contato, created_at, profiles(nome)')

      if (err2) throw err2

      let syncedCnpjs = new Set<string>()
      if (recentData && recentData.length > 0) {
        const cnpjs = recentData.map((r) => r.cnpj).filter(Boolean)
        if (cnpjs.length > 0) {
          const { data: bxData } = await supabase
            .from('bitrix_clients_zion')
            .select('cnpj')
            .in('cnpj', cnpjs)
          bxData?.forEach((b) => {
            if (b.cnpj) syncedCnpjs.add(b.cnpj)
          })
        }
      }

      const recentWithSync =
        recentData?.map((r) => ({
          ...r,
          synced_bitrix: r.cnpj ? syncedCnpjs.has(r.cnpj) : false,
        })) || []

      if (allData) {
        const total = allData.length

        const statusCounts: Record<string, number> = {
          'Não Contatado': 0,
          'Em Prospecção': 0,
          'Proposta Enviada': 0,
          'Sem Interesse': 0,
          Convertido: 0,
        }

        const execCounts: Record<string, number> = {}

        allData.forEach((lead) => {
          const st = lead.status_contato || 'Não Contatado'
          if (statusCounts[st] !== undefined) {
            statusCounts[st]++
          } else {
            statusCounts[st] = (statusCounts[st] || 0) + 1
          }

          const execName = (lead.profiles as any)?.nome || 'Sem Responsável'
          execCounts[execName] = (execCounts[execName] || 0) + 1
        })

        const byStatus = Object.keys(statusCounts).map((k) => ({
          name: k,
          count: statusCounts[k],
        }))
        const byExecutive = Object.keys(execCounts)
          .map((k) => ({ name: k, count: execCounts[k] }))
          .sort((a, b) => b.count - a.count)

        setStats({
          total,
          byStatus,
          byExecutive,
          recent: recentWithSync,
          allRawData: allData,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    const channel = supabase
      .channel('public:bitrix_clients_zion')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bitrix_clients_zion' },
        (payload) => {
          setStats((prev) => {
            const newRecent = prev.recent.map((r) => {
              if (r.cnpj === payload.new.cnpj) {
                return { ...r, synced_bitrix: true, recently_synced: true }
              }
              return r
            })
            return { ...prev, recent: newRecent }
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const cadenceData = useMemo(() => {
    if (!stats.allRawData || stats.allRawData.length === 0) return []

    const map: Record<string, number> = {}
    for (let i = cadenceDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      map[d.toISOString().split('T')[0]] = 0
    }

    stats.allRawData.forEach((lead) => {
      if (lead.created_at) {
        const d = lead.created_at.split('T')[0]
        if (map[d] !== undefined) map[d]++
      }
    })

    return Object.entries(map).map(([date, count]) => {
      const parts = date.split('-')
      return {
        date: `${parts[2]}/${parts[1]}`,
        count,
      }
    })
  }, [stats.allRawData, cadenceDays])

  if (loading) {
    return (
      <div className={designTokens.layout.page}>
        <div>
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <LoadingCard />
          <LoadingCard />
        </div>
        <LoadingCard />
      </div>
    )
  }

  if (error) {
    return (
      <div className={designTokens.layout.page}>
        <ErrorState onRetry={fetchDashboardData} />
      </div>
    )
  }

  return (
    <div className={designTokens.layout.page}>
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-10 shadow-md border-0 bg-[#020617] mb-2">
        <ZionGlobalBackground fallbackVariant="dark" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/95 via-[#020617]/70 to-transparent pointer-events-none z-0" />
        <div className="relative z-10 max-w-2xl animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Dashboard Lead Finder Zion
          </h2>
          <p className="text-slate-300 font-medium text-lg leading-relaxed">
            Conectividade global e inteligência de dados para maximizar suas oportunidades e
            impulsionar a performance da equipe comercial.
          </p>
        </div>
      </div>

      <div
        className="grid gap-4 grid-cols-1 md:grid-cols-3 mt-4 animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        <Card className="bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-center">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90">
              Total de Leads Salvos
            </CardTitle>
            <Users className="h-5 w-5 text-primary-foreground/90" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tight mt-2">{stats.total}</div>
            <p className="text-sm text-primary-foreground/80 mt-2 font-medium">
              Acumulado na sua base de dados
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
            <div>
              <CardTitle>Cadência de Captura</CardTitle>
              <CardDescription>Evolução de leads adicionados ao longo do tempo</CardDescription>
            </div>
            <Select value={cadenceDays.toString()} onValueChange={(v) => setCadenceDays(Number(v))}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-50 border-slate-200">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-1 pb-2">
            <ChartContainer config={chartConfig} className="h-[180px] w-full mt-2">
              <AreaChart
                accessibilityLayer
                data={cadenceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={11}
                  minTickGap={15}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={11}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2 }}
                  content={<ChartTooltipContent />}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#fillCount)"
                  activeDot={{ r: 6, fill: 'var(--color-count)', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div
        className="grid gap-4 md:grid-cols-2 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Leads por Status</CardTitle>
            <CardDescription>Distribuição atual no funil de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full mt-2">
              <BarChart
                accessibilityLayer
                data={stats.byStatus}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={11}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={11}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance por Executivo</CardTitle>
            <CardDescription>Volume de leads gerenciados por responsável</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full mt-2">
              <BarChart
                accessibilityLayer
                data={stats.byExecutive}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={11}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <CardTitle>Últimas Atividades e Integrações</CardTitle>
          <CardDescription>Monitoramento em tempo real dos leads mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-700">Empresa</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Responsável</TableHead>
                <TableHead className="font-semibold text-slate-700">Integração Bitrix</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma atividade recente encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recent.map((lead) => (
                  <TableRow key={lead.id} className="group hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium text-slate-800">
                      {lead.razao_social || 'Empresa não identificada'}
                      <div className="text-xs text-slate-400 font-normal mt-0.5">{lead.cnpj}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'font-semibold',
                          lead.status_contato === 'Convertido'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200',
                        )}
                      >
                        {lead.status_contato || 'Não Contatado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">
                      {(lead.profiles as any)?.nome || 'Sem Responsável'}
                    </TableCell>
                    <TableCell>
                      <BitrixBadge
                        synced={lead.synced_bitrix}
                        createdAt={lead.created_at}
                        isNew={lead.recently_synced}
                      />
                    </TableCell>
                    <TableCell className="text-right text-slate-500 text-sm tabular-nums">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
