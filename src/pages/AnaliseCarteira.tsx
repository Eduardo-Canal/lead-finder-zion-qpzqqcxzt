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
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts'

interface AnaliseCnae {
  id: string
  cnae: string
  nome_cnae: string
  total_clientes: number
}

const chartConfig = {
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
        .select('id, cnae, nome_cnae, total_clientes')
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

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 h-full flex flex-col animate-fade-in-up">
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

      <Card className="flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Total de Clientes por CNAE</CardTitle>
          <CardDescription>
            Quantidade de clientes ativos ou histórico na carteira por CNAE principal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando gráfico...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
              Nenhum dado encontrado. Clique em "Recalcular Insights".
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="w-full aspect-auto h-[600px]">
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
                    <ChartTooltipContent hideLabel={false} labelKey="nome_cnae" indicator="line" />
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
    </div>
  )
}
