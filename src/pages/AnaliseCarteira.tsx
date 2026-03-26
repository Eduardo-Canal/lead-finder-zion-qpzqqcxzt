import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
  PieChart,
  Pie,
  LineChart,
  Line,
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AnaliseCnae {
  id: string
  cnae: string
  nome_cnae: string
  total_clientes: number
  distribuicao_geografica: Record<string, number> | null
  taxa_sucesso: number | null
}

interface SegmentoTicket {
  segmento: string
  ticket_medio: number
}

interface ClusterEstrategico {
  id: string
  cluster_name: string
  oportunidade_score: number | null
  prioridade: string | null
}

const barChartConfig = {
  total_clientes: {
    label: 'Clientes',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

const lineChartConfig = {
  taxa_sucesso: {
    label: 'Taxa de Sucesso (%)',
    color: 'hsl(var(--secondary))',
  },
} satisfies ChartConfig

export default function AnaliseCarteira() {
  const [analises, setAnalises] = useState<AnaliseCnae[]>([])
  const [segmentos, setSegmentos] = useState<SegmentoTicket[]>([])
  const [clusters, setClusters] = useState<ClusterEstrategico[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const { toast } = useToast()

  const fetchDados = async () => {
    setLoading(true)
    try {
      const [analiseRes, carteiraRes, clustersRes] = await Promise.all([
        supabase
          .from('analise_cnae')
          .select('id, cnae, nome_cnae, total_clientes, distribuicao_geografica, taxa_sucesso')
          .order('total_clientes', { ascending: false }),
        supabase.from('carteira_clientes').select('segmento, ticket_medio'),
        supabase
          .from('clusters_estrategicos')
          .select('id, cluster_name, oportunidade_score, prioridade')
          .order('oportunidade_score', { ascending: false }),
      ])

      if (analiseRes.error) throw analiseRes.error
      if (carteiraRes.error) throw carteiraRes.error
      if (clustersRes.error) throw clustersRes.error

      setAnalises(analiseRes.data || [])
      setClusters(clustersRes.data || [])

      const segmentMap: Record<string, { total: number; count: number }> = {}

      carteiraRes.data?.forEach((item) => {
        const seg = item.segmento || 'Não classificado'
        const val = Number(item.ticket_medio) || 0
        if (!segmentMap[seg]) {
          segmentMap[seg] = { total: 0, count: 0 }
        }
        if (val > 0) {
          segmentMap[seg].total += val
          segmentMap[seg].count += 1
        }
      })

      const processedSegments = Object.keys(segmentMap)
        .map((seg) => ({
          segmento: seg,
          ticket_medio:
            segmentMap[seg].count > 0 ? segmentMap[seg].total / segmentMap[seg].count : 0,
        }))
        .sort((a, b) => b.ticket_medio - a.ticket_medio)

      setSegmentos(processedSegments)
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [])

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      const { data, error } = await supabase.functions.invoke('calculate-carteira-insights')

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido ao processar função')

      toast({
        title: 'Insights Atualizados',
        description: 'Os dados da sua carteira foram recalculados com sucesso!',
      })

      fetchDados()
    } catch (error: any) {
      toast({
        title: 'Erro ao recalcular',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setRecalculating(false)
    }
  }

  const chartData = useMemo(() => {
    return analises.map((a) => ({
      cnae: a.cnae,
      nome_cnae: a.nome_cnae || 'Sem Nome',
      total_clientes: a.total_clientes,
    }))
  }, [analises])

  const lineChartData = useMemo(() => {
    return analises.map((a) => ({
      cnae: a.cnae,
      nome_cnae: a.nome_cnae || 'Sem Nome',
      taxa_sucesso: Number(a.taxa_sucesso) || 0,
    }))
  }, [analises])

  const { geoChartData, geoChartConfig } = useMemo(() => {
    const ufCounts: Record<string, number> = {}
    analises.forEach((a) => {
      if (a.distribuicao_geografica) {
        Object.entries(a.distribuicao_geografica).forEach(([uf, count]) => {
          if (uf && uf !== 'ND') {
            ufCounts[uf] = (ufCounts[uf] || 0) + Number(count)
          }
        })
      }
    })

    const sortedUfs = Object.entries(ufCounts)
      .map(([uf, count]) => ({ name: uf, value: count }))
      .sort((a, b) => b.value - a.value)

    const config: ChartConfig = {}
    const PREDEFINED_COLORS = [
      '#0066cc',
      '#f39200',
      '#10b981',
      '#8b5cf6',
      '#f59e0b',
      '#0ea5e9',
      '#14b8a6',
      '#64748b',
      '#ec4899',
      '#f43f5e',
    ]

    let data = sortedUfs.map((item, index) => {
      const key = item.name.toLowerCase()
      const color = PREDEFINED_COLORS[index % PREDEFINED_COLORS.length]
      config[key] = { label: item.name, color }
      return { ...item, fill: `var(--color-${key})` }
    })

    if (data.length > 7) {
      const top = data.slice(0, 6)
      const others = data.slice(6)
      const othersValue = others.reduce((acc, curr) => acc + curr.value, 0)
      top.push({ name: 'Outros', value: othersValue, fill: 'var(--color-outros)' })
      config['outros'] = { label: 'Outros', color: '#94a3b8' }
      data = top
    }

    return { geoChartData: data, geoChartConfig: config }
  }, [analises])

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Análise de Carteira</h1>
          <p className="text-muted-foreground mt-1">
            Visualização de clientes por setor (CNAE) com base nos dados mais recentes.
          </p>
        </div>
        <Button
          onClick={handleRecalculate}
          disabled={recalculating || loading}
          className="shrink-0"
        >
          {recalculating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Recalcular Insights
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Total de Clientes por CNAE</CardTitle>
            <CardDescription>
              Quantidade de clientes ativos ou histórico na carteira por CNAE principal.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando gráfico...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
                Nenhum dado encontrado. Clique em "Recalcular Insights".
              </div>
            ) : (
              <ChartContainer config={barChartConfig} className="w-full aspect-auto h-[450px]">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="cnae"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    width={100}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--color-muted)', opacity: 0.1 }}
                    content={
                      <ChartTooltipContent
                        hideLabel={false}
                        labelKey="nome_cnae"
                        indicator="line"
                      />
                    }
                  />
                  <Bar
                    dataKey="total_clientes"
                    fill="var(--color-total_clientes)"
                    radius={[0, 4, 4, 0]}
                    barSize={32}
                  >
                    <LabelList
                      dataKey="total_clientes"
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Distribuição Geográfica</CardTitle>
            <CardDescription>Concentração de clientes por Estado (UF).</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4 flex flex-col justify-center min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
              </div>
            ) : geoChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                Nenhum dado de localização encontrado.
              </div>
            ) : (
              <ChartContainer
                config={geoChartConfig}
                className="mx-auto aspect-square w-full max-h-[350px]"
              >
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={geoChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    strokeWidth={2}
                    paddingAngle={2}
                  />
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Ticket Médio por Segmento</CardTitle>
            <CardDescription>
              Média de valor do ticket dos clientes agrupada por segmento de atuação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
              </div>
            ) : segmentos.length === 0 ? (
              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                Nenhum dado de segmento encontrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Segmento</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentos.map((item) => (
                    <TableRow key={item.segmento}>
                      <TableCell className="font-medium">{item.segmento}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.ticket_medio)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Taxa de Sucesso por CNAE</CardTitle>
            <CardDescription>
              Percentual de conversão e sucesso dos clientes por setor (CNAE).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
              </div>
            ) : lineChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                Nenhum dado encontrado.
              </div>
            ) : (
              <ChartContainer config={lineChartConfig} className="w-full aspect-auto h-[350px]">
                <LineChart
                  data={lineChartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="cnae"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    cursor={{
                      stroke: 'var(--color-muted)',
                      strokeWidth: 1,
                      strokeDasharray: '3 3',
                    }}
                    content={<ChartTooltipContent indicator="line" labelKey="nome_cnae" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="taxa_sucesso"
                    stroke="var(--color-taxa_sucesso)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--color-taxa_sucesso)' }}
                    activeDot={{ r: 6, fill: 'var(--color-taxa_sucesso)' }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Clusters Estratégicos</CardTitle>
            <CardDescription>
              Oportunidades mapeadas e categorizadas por potencial de score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
              </div>
            ) : clusters.length === 0 ? (
              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                Nenhum cluster estratégico encontrado. Clique em "Recalcular Insights".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {clusters.map((cluster) => {
                  let colorClass = 'bg-rose-50 border-rose-200 text-rose-900' // Low priority

                  const p = cluster.prioridade?.toLowerCase()
                  if (p === 'alta' || (cluster.oportunidade_score || 0) > 5000) {
                    colorClass = 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  } else if (
                    p === 'média' ||
                    p === 'media' ||
                    (cluster.oportunidade_score || 0) > 2000
                  ) {
                    colorClass = 'bg-amber-50 border-amber-200 text-amber-900'
                  }

                  return (
                    <div
                      key={cluster.id}
                      className={cn(
                        'p-5 rounded-xl border flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-md cursor-default',
                        colorClass,
                      )}
                    >
                      <h4 className="font-semibold text-sm line-clamp-2 leading-tight">
                        {cluster.cluster_name}
                      </h4>
                      <div className="flex items-end justify-between mt-auto pt-3 border-t border-black/10">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            Prioridade
                          </span>
                          <span className="text-xs font-semibold capitalize">
                            {cluster.prioridade || 'Baixa'}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            Score
                          </span>
                          <span className="font-bold text-lg leading-none">
                            {cluster.oportunidade_score?.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
