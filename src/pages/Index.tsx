import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Users } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { designTokens } from '@/constants/designTokens'

const chartConfig = {
  count: {
    label: 'Quantidade',
    color: 'hsl(var(--primary))',
  },
}

export default function Index() {
  const [stats, setStats] = useState({
    total: 0,
    byStatus: [] as { name: string; count: number }[],
    byExecutive: [] as { name: string; count: number }[],
    recent: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)

      try {
        const { data: recentData } = await supabase
          .from('leads_salvos')
          .select('id, razao_social, status_contato, created_at, profiles(nome)')
          .order('created_at', { ascending: false })
          .limit(5)

        const { data: allData } = await supabase
          .from('leads_salvos')
          .select('status_contato, profiles(nome)')

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
            recent: recentData || [],
          })
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className={designTokens.layout.page}>
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[120px] w-full rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl mt-6" />
      </div>
    )
  }

  return (
    <div className={designTokens.layout.page}>
      <div>
        <h2 className={designTokens.typography.pageTitle}>Dashboard</h2>
        <p className={designTokens.typography.small}>
          Visão geral do desempenho de prospecção e produtividade da equipe.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90">
              Total de Leads Salvos
            </CardTitle>
            <Users className="h-4 w-4 text-primary-foreground/90" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">{stats.total}</div>
            <p className="text-xs text-primary-foreground/80 mt-1 font-medium">
              Acumulado no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads por Status</CardTitle>
            <CardDescription>Distribuição atual no funil de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full mt-4">
              <BarChart
                accessibilityLayer
                data={stats.byStatus}
                margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
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
                  fontSize={12}
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
                  maxBarSize={60}
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
            <ChartContainer config={chartConfig} className="h-[300px] w-full mt-4">
              <BarChart
                accessibilityLayer
                data={stats.byExecutive}
                margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
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
                  maxBarSize={60}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Atividades</CardTitle>
          <CardDescription>Os 5 leads mais recentes adicionados ao sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma atividade recente encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recent.map((lead) => (
                  <TableRow key={lead.id} className="group">
                    <TableCell className="font-medium text-foreground">
                      {lead.razao_social || 'Empresa não identificada'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={lead.status_contato === 'Convertido' ? 'default' : 'secondary'}
                        className={
                          lead.status_contato === 'Convertido'
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : ''
                        }
                      >
                        {lead.status_contato || 'Não Contatado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(lead.profiles as any)?.nome || 'Sem Responsável'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm tabular-nums">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
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
