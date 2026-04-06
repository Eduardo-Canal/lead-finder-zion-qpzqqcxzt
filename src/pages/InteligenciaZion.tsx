import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import useLeadStore from '@/stores/useLeadStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Search,
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
    <div className="p-6 max-w-6xl mx-auto space-y-6 h-[calc(100vh-4rem)] flex flex-col animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Inteligência Zion</h1>
          <p className="text-muted-foreground mt-1">
            Descubra perfis ideais e explore oceanos azuis.
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

        <TabsContent value="cnae" className="flex-1 overflow-auto mt-4">
          <div className="flex flex-col gap-6 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Clientes</p>
                    <h3 className="text-2xl font-bold">{clients.length}</h3>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de CNAEs</p>
                    <h3 className="text-2xl font-bold">{cnaeGroups.length}</h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 flex-1 pb-4">
              <Card className="flex flex-col border-none shadow-none md:border md:shadow-sm">
                <CardHeader className="shrink-0 px-0 md:px-6">
                  <CardTitle>Composição da Carteira</CardTitle>
                  <CardDescription>Distribuição percentual por setor</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex-col pb-0 px-0 md:px-6 min-h-0 flex items-center justify-center">
                  {cnaeGroups.length > 0 ? (
                    <ChartContainer
                      config={chartConfig}
                      className="w-full aspect-square max-h-[300px]"
                    >
                      <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie
                          data={pieData}
                          dataKey="count"
                          nameKey="cnae"
                          innerRadius={60}
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
                      <PieChartIcon className="w-12 h-12 mb-4 text-muted/50" />
                      <p>Sem dados suficientes.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col border-none shadow-none md:border md:shadow-sm">
                <CardHeader className="shrink-0 px-0 md:px-6">
                  <CardTitle>Top CNAE na Carteira</CardTitle>
                  <CardDescription>
                    Sua base organizada pelos nichos mais relevantes
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto min-h-0 px-0 md:px-6">
                  {cnaeGroups.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto bg-background h-full">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="p-3 font-medium">CNAE</th>
                            <th className="p-3 font-medium text-center whitespace-nowrap">
                              Total Cliente
                            </th>
                            <th className="p-3 font-medium text-center whitespace-nowrap">
                              Repres. %
                            </th>
                            <th className="p-3 font-medium text-center">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {cnaeGroups
                            .sort((a, b) => b.count - a.count)
                            .map((group) => (
                              <tr key={group.cnae} className="hover:bg-muted/30 transition-colors">
                                <td className="p-3 min-w-[200px]">
                                  <div className="font-semibold text-primary">{group.cnae}</div>
                                  <div
                                    className="text-xs text-muted-foreground line-clamp-2 mt-0.5"
                                    title={group.descricao}
                                  >
                                    {group.descricao}
                                  </div>
                                </td>
                                <td className="p-3 text-center font-medium">{group.count}</td>
                                <td className="p-3 text-center">
                                  <Badge variant="secondary" className="font-normal">
                                    {group.percentual}%
                                  </Badge>
                                </td>
                                <td className="p-3 text-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleBuscarClonesCnae(group.cnae)}
                                    title="Buscar Clones"
                                    className="hover:text-primary hover:bg-primary/10"
                                  >
                                    <Hexagon className="w-5 h-5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-lg p-8">
                      <Briefcase className="w-12 h-12 mb-4 text-muted/50" />
                      <p>Nenhum cliente classificado por CNAE.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="oceanos" className="flex-1 overflow-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Oceanos Azuis</CardTitle>
              <CardDescription>
                Regiões com menor saturação para focar sua estratégia e criar novas campanhas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    className="flex justify-between items-center p-4 border rounded-xl hover:bg-muted/50 transition-colors"
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
