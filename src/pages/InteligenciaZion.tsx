import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import useLeadStore from '@/stores/useLeadStore'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Target,
  Anchor,
  TrendingUp,
  RefreshCw,
  Briefcase,
  Hexagon,
  Users,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const UFS = [
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

export default function InteligenciaZion() {
  const navigate = useNavigate()
  const { clearFilters, setAllFilters, addCnae } = useLeadStore()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [cnaeGroups, setCnaeGroups] = useState<any[]>([])
  const [segmentoFilter, setSegmentoFilter] = useState('Todos')

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('get-clientes-por-cnae', {
        method: 'POST',
      })
      if (error) throw error

      setCnaeGroups(data?.data || [])

      const allClients: any[] = []
      data?.data?.forEach((item: any) => item.clientes && allClients.push(...item.clientes))
      setClients(allClients)
    } catch (e) {
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      toast.loading('Sincronizando com Bitrix24...', { id: 'sync' })
      await supabase.functions.invoke('fetch-bitrix-clients-zion', { method: 'POST' })
      await supabase.functions.invoke('calculate-carteira-insights', { method: 'POST' })
      await loadData()
      toast.success('Dados atualizados com sucesso!', { id: 'sync' })
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`, { id: 'sync' })
    } finally {
      setSyncing(false)
    }
  }

  const handleBuscarClonesCnae = (cnae: string) => {
    clearFilters()
    addCnae(cnae)
    toast.success(`Buscando empresas para o CNAE ${cnae}.`)
    navigate('/prospeccao')
  }

  const oceanosData = useMemo(() => {
    const ufCounts: Record<string, number> = {}
    UFS.forEach((uf) => (ufCounts[uf] = 0))
    clients
      .filter((c) => segmentoFilter === 'Todos' || c.segmento === segmentoFilter)
      .forEach((c) => {
        const uf = c.uf?.toUpperCase()
        if (UFS.includes(uf)) ufCounts[uf]++
      })
    return Object.entries(ufCounts)
      .map(([uf, count]) => ({ uf, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [clients, segmentoFilter])

  const pieData = useMemo(() => {
    const sorted = [...cnaeGroups].sort((a, b) => b.count - a.count)
    const top = sorted.slice(0, 8)
    const others = sorted.slice(8)
    const othersCount = others.reduce((acc, curr) => acc + curr.count, 0)

    const data = top.map((g, i) => ({
      cnae: g.cnae,
      descricao: g.descricao,
      count: g.count,
      fill: `hsl(var(--chart-${(i % 5) + 1}))`,
    }))

    if (othersCount > 0) {
      data.push({
        cnae: 'Outros',
        descricao: 'Outros setores',
        count: othersCount,
        fill: 'hsl(var(--muted-foreground))',
      })
    }

    return data
  }, [cnaeGroups])

  const chartConfig = useMemo(() => {
    const config: Record<string, any> = {
      count: { label: 'Clientes' },
    }
    pieData.forEach((item) => {
      config[item.cnae] = {
        label: item.cnae,
        color: item.fill,
      }
    })
    return config
  }, [pieData])

  if (loading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )

  return (
    <div className="p-6 w-full mx-auto space-y-6 h-[calc(100vh-4rem)] flex flex-col animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inteligência Zion</h1>
          <p className="text-muted-foreground mt-1">
            Descubra perfis ideais e explore oceanos azuis na sua carteira.
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={syncing ? 'animate-spin mr-2' : 'mr-2'} />
          Sincronizar CRM
        </Button>
      </div>

      <Tabs defaultValue="cnae" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="cnae" className="gap-2">
            <Target className="w-4 h-4" /> Análise CNAE
          </TabsTrigger>
          <TabsTrigger value="oceanos" className="gap-2">
            <Anchor className="w-4 h-4" /> Oceanos Azuis
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="cnae"
          className="flex-1 data-[state=active]:flex flex-col min-h-0 mt-4 outline-none"
        >
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0 mb-6">
            <div className="bg-card rounded-xl border shadow-sm p-6 flex items-center justify-between group transition-all hover:shadow-md">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wide">
                  Total de Clientes
                </p>
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  {clients.length}
                </h3>
              </div>
              <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-6 flex items-center justify-between group transition-all hover:shadow-md">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wide">
                  Total de CNAEs
                </p>
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  {cnaeGroups.length}
                </h3>
              </div>
              <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                <Briefcase className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico */}
            <div className="lg:col-span-1 flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b shrink-0 bg-muted/10">
                <h3 className="text-lg font-semibold text-foreground">Composição da Carteira</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Distribuição percentual por setor
                </p>
              </div>
              <div className="flex-1 p-6 min-h-0 flex items-center justify-center relative">
                {cnaeGroups.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="w-full h-full min-h-[250px] aspect-auto"
                  >
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={pieData}
                        dataKey="count"
                        nameKey="cnae"
                        innerRadius="50%"
                        outerRadius="80%"
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <PieChartIcon className="w-12 h-12 mb-4 text-muted/30" />
                    <p>Sem dados suficientes.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabela */}
            <div className="lg:col-span-2 flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b shrink-0 bg-muted/10 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Top CNAE na Carteira</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sua base organizada pelos nichos mais relevantes
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-background">
                {cnaeGroups.length > 0 ? (
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                      <tr>
                        <th className="p-4 font-semibold text-muted-foreground border-b whitespace-nowrap">
                          CNAE
                        </th>
                        <th className="p-4 font-semibold text-muted-foreground text-center border-b whitespace-nowrap">
                          Total Cliente
                        </th>
                        <th className="p-4 font-semibold text-muted-foreground text-center border-b whitespace-nowrap">
                          Repres. %
                        </th>
                        <th className="p-4 font-semibold text-muted-foreground text-center border-b whitespace-nowrap w-[100px]">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cnaeGroups
                        .sort((a, b) => b.count - a.count)
                        .map((group) => (
                          <tr
                            key={group.cnae}
                            className="hover:bg-muted/20 transition-colors group"
                          >
                            <td className="p-4">
                              <div className="font-semibold text-foreground">{group.cnae}</div>
                              <div
                                className="text-xs text-muted-foreground line-clamp-1 mt-0.5"
                                title={group.descricao}
                              >
                                {group.descricao}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold px-3 py-1 rounded-md min-w-[2.5rem]">
                                {group.count}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <Badge
                                variant="secondary"
                                className="font-medium bg-muted/60 text-muted-foreground group-hover:bg-muted"
                              >
                                {group.percentual}%
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleBuscarClonesCnae(group.cnae)}
                                title="Buscar Clones"
                                className="hover:text-primary hover:bg-primary/10 h-9 w-9 text-muted-foreground group-hover:text-primary"
                              >
                                <Hexagon className="w-5 h-5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                    <Briefcase className="w-12 h-12 mb-4 text-muted/30" />
                    <p>Nenhum cliente classificado por CNAE.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="oceanos"
          className="flex-1 data-[state=active]:flex flex-col min-h-0 mt-4 outline-none"
        >
          <div className="flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden flex-1">
            <div className="p-6 border-b shrink-0 bg-muted/10">
              <h3 className="text-lg font-semibold text-foreground">Oceanos Azuis</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Regiões com menor saturação para focar sua estratégia e criar novas campanhas.
              </p>
            </div>
            <div className="p-6 space-y-6 overflow-auto flex-1 bg-background">
              <Select value={segmentoFilter} onValueChange={setSegmentoFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Segmentos</SelectItem>
                  {Array.from(new Set(clients.map((c) => c.segmento).filter(Boolean))).map((s) => (
                    <SelectItem key={s as string} value={s as string}>
                      {s as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {oceanosData.map((item, idx) => (
                  <div
                    key={item.uf}
                    className="flex justify-between items-center p-4 border rounded-xl hover:bg-muted/50 transition-colors bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {idx + 1}º
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{item.uf}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.count} clientes na base
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        clearFilters()
                        setAllFilters({ ufs: [item.uf] })
                        navigate('/prospeccao')
                      }}
                      size="sm"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Campanha
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
