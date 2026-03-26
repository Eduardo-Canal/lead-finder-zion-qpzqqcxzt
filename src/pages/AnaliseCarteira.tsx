import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, BarChart3, TrendingUp, Briefcase, MapPin, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AnaliseCnae {
  id: string
  cnae: string
  nome_cnae: string
  total_clientes: number
  ticket_medio_cnae: number
  taxa_sucesso: number
  distribuicao_geografica: Record<string, number>
  fit_operacional_score: number
  updated_at: string
}

interface ClusterEstrategico {
  id: string
  cluster_name: string
  cnae_list: string[]
  total_empresas: number
  oportunidade_score: number
  prioridade: string
}

export default function AnaliseCarteira() {
  const [analises, setAnalises] = useState<AnaliseCnae[]>([])
  const [clusters, setClusters] = useState<ClusterEstrategico[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const { toast } = useToast()

  const fetchDados = async () => {
    setLoading(true)
    try {
      const { data: dataAnalise, error: errAnalise } = await supabase
        .from('analise_cnae')
        .select('*')
        .order('fit_operacional_score', { ascending: false })

      if (errAnalise) throw errAnalise

      const { data: dataClusters, error: errClusters } = await supabase
        .from('clusters_estrategicos')
        .select('*')
        .order('oportunidade_score', { ascending: false })

      if (errClusters) throw errClusters

      setAnalises(dataAnalise || [])
      setClusters(dataClusters || [])
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

      // Atualiza a listagem local
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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const formatPercent = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(
      (val || 0) / 100,
    )

  const topCnae = analises.length > 0 ? analises[0] : null
  const globalTicket =
    analises.length > 0
      ? analises.reduce((acc, curr) => acc + curr.ticket_medio_cnae * curr.total_clientes, 0) /
        analises.reduce((acc, curr) => acc + curr.total_clientes, 0)
      : 0

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 h-full flex flex-col animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Análise de Carteira</h1>
          <p className="text-muted-foreground mt-1">
            Insights estratégicos gerados automaticamente com base nos seus clientes atuais.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Setores (CNAEs)
            </CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analises.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Atendidos na base de clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio Global Estimado
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(globalTicket)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ponderado pelo volume de clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Melhor Setor Atual
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate" title={topCnae?.nome_cnae || 'N/D'}>
              {topCnae?.nome_cnae || 'N/D'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Score de Fit: {topCnae?.fit_operacional_score || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Tabela de CNAEs */}
        <Card className="xl:col-span-2 flex flex-col min-h-0">
          <CardHeader className="shrink-0">
            <CardTitle>Desempenho por CNAE</CardTitle>
            <CardDescription>
              Métricas detalhadas de ticket, conversão e fit por setor de atuação
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
                </div>
              ) : analises.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
                  Nenhum dado encontrado. Clique em "Recalcular Insights".
                </div>
              ) : (
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 p-4 text-xs font-semibold text-muted-foreground sticky top-0 backdrop-blur-md">
                    <div className="col-span-3">CNAE / SETOR</div>
                    <div className="col-span-2 text-center">CLIENTES</div>
                    <div className="col-span-2 text-right">TICKET MÉDIO</div>
                    <div className="col-span-2 text-center">TAXA SUCESSO</div>
                    <div className="col-span-1 text-center">SCORE</div>
                    <div className="col-span-2">DISTRIBUIÇÃO UF</div>
                  </div>
                  <div className="divide-y">
                    {analises.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-muted/30 transition-colors"
                      >
                        <div className="col-span-3">
                          <div className="font-medium">{item.cnae}</div>
                          <div
                            className="text-xs text-muted-foreground truncate"
                            title={item.nome_cnae}
                          >
                            {item.nome_cnae}
                          </div>
                        </div>
                        <div className="col-span-2 text-center font-medium">
                          {item.total_clientes}
                        </div>
                        <div className="col-span-2 text-right font-medium">
                          {formatCurrency(item.ticket_medio_cnae)}
                        </div>
                        <div className="col-span-2 text-center">
                          <Badge
                            variant={
                              item.taxa_sucesso > 70
                                ? 'default'
                                : item.taxa_sucesso > 40
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className={
                              item.taxa_sucesso > 70 ? 'bg-green-600 hover:bg-green-700' : ''
                            }
                          >
                            {formatPercent(item.taxa_sucesso)}
                          </Badge>
                        </div>
                        <div className="col-span-1 text-center font-bold text-primary">
                          {item.fit_operacional_score}
                        </div>
                        <div className="col-span-2 flex flex-wrap gap-1">
                          {Object.entries(item.distribuicao_geografica || {})
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .map(([uf, count]) => (
                              <Badge key={uf} variant="outline" className="text-[10px] px-1.5 py-0">
                                {uf} ({count as number})
                              </Badge>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Clusters Estratégicos */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="shrink-0">
            <CardTitle>Clusters Estratégicos</CardTitle>
            <CardDescription>
              Grupos de setores com alto potencial baseados na carteira atual
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-4">
            {loading ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
              </div>
            ) : clusters.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground text-sm text-center">
                Nenhum cluster identificado. Execute o recálculo.
              </div>
            ) : (
              clusters.map((cluster) => (
                <div
                  key={cluster.id}
                  className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-base text-foreground">{cluster.cluster_name}</h4>
                    <Badge
                      variant={cluster.prioridade === 'Alta' ? 'default' : 'secondary'}
                      className={cluster.prioridade === 'Alta' ? 'bg-primary' : ''}
                    >
                      {cluster.prioridade}
                    </Badge>
                  </div>
                  <div className="space-y-2 mt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Score de Oportunidade:</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(cluster.oportunidade_score)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total de Empresas (Base):</span>
                      <span className="font-medium text-foreground">{cluster.total_empresas}</span>
                    </div>
                    <div className="pt-2 border-t mt-2">
                      <span className="text-xs text-muted-foreground mb-1 block">
                        CNAEs do Cluster:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cluster.cnae_list?.map((cnae) => (
                          <Badge key={cnae} variant="outline" className="text-[10px] bg-muted/30">
                            {cnae}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
