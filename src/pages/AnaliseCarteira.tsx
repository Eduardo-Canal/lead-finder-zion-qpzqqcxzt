import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList, PieChart, Pie } from 'recharts'

interface AnaliseCnae {
  id: string
  cnae: string
  nome_cnae: string
  total_clientes: number
  distribuicao_geografica: Record<string, number> | null
}

const barChartConfig = {
  total_clientes: {
    label: 'Clientes',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export default function AnaliseCarteira() {
  const [analises, setAnalises] = useState<AnaliseCnae[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const { toast } = useToast()

  const fetchDados = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('analise_cnae')
        .select('id, cnae, nome_cnae, total_clientes, distribuicao_geografica')
        .order('total_clientes', { ascending: false })

      if (error) throw error

      setAnalises(data || [])
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
      '#0066cc', // secondary
      '#f39200', // primary
      '#10b981', // success
      '#8b5cf6', // violet
      '#f59e0b', // warning
      '#0ea5e9', // cyan
      '#14b8a6', // teal
      '#64748b', // slate
      '#ec4899', // pink
      '#f43f5e', // rose
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
    </div>
  )
}
