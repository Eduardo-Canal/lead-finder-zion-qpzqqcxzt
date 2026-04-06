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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const COLORS = [
  '#EF4444',
  '#F97316',
  '#FBBF24',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#9CA3AF',
  '#92400E',
  '#EC4899',
]

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
      fill: COLORS[i % COLORS.length],
    }))

    if (othersCount > 0) {
      data.push({
        cnae: 'Outros',
        descricao: 'Outros setores',
        count: othersCount,
        fill: COLORS[top.length % COLORS.length],
      })
    }

    return data
  }, [cnaeGroups])

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180)
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180)

    if (percent < 0.05) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-bold drop-shadow-md"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Removido chartConfig pois usamos Recharts puro com ResponsiveContainer

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
          className="flex-1 data-[state=active]:flex flex-col min-h-0 mt-4 outline-none w-full"
        >
          {/* Linha Superior: 2 Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
            <div className="bg-card rounded-lg shadow border p-6 flex items-center justify-between group transition-all">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wide">
                  TOTAL DE CLIENTES
                </p>
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  {clients.length}
                </h3>
              </div>
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Users className="w-7 h-7" />
              </div>
            </div>
            <div className="bg-card rounded-lg shadow border p-6 flex items-center justify-between group transition-all">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wide">
                  TOTAL DE CNAES
                </p>
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  {cnaeGroups.length}
                </h3>
              </div>
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Briefcase className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Linha Inferior: Gráfico + Tabela */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6 min-h-0 flex-1">
            {/* Coluna Esquerda: Gráfico (70%) */}
            <div className="lg:col-span-2 bg-card rounded-lg shadow border p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-foreground mb-2">Composição da Carteira</h3>
              <div className="w-full">
                {cnaeGroups.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [`${value} clientes`, name]}
                      />
                      <Pie
                        data={pieData}
                        dataKey="count"
                        nameKey="cnae"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <PieChartIcon className="w-12 h-12 mb-4 text-muted/30" />
                    <p>Sem dados suficientes.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita: Tabela (30%) */}
            <div className="lg:col-span-1 bg-card rounded-lg shadow border p-4 flex flex-col overflow-y-auto max-h-[450px]">
              <h3 className="text-lg font-semibold text-foreground mb-4 shrink-0">
                Top CNAE na Carteira
              </h3>
              <div className="flex-1">
                {cnaeGroups.length > 0 ? (
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/40 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground border-b">CNAE</th>
                        <th className="p-3 font-semibold text-muted-foreground text-center border-b">
                          Total
                        </th>
                        <th className="p-3 font-semibold text-muted-foreground text-center border-b w-[60px]">
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
                            <td className="p-3">
                              <div
                                className="font-semibold text-foreground line-clamp-1"
                                title={group.cnae}
                              >
                                {group.cnae}
                              </div>
                              <div
                                className="text-xs text-muted-foreground line-clamp-1 mt-0.5"
                                title={group.descricao}
                              >
                                {group.descricao}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md min-w-[2rem] text-xs">
                                {group.count}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleBuscarClonesCnae(group.cnae)}
                                title="Buscar Clones"
                                className="hover:text-primary hover:bg-primary/10 h-8 w-8 text-muted-foreground group-hover:text-primary"
                              >
                                <Hexagon className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Briefcase className="w-10 h-10 mb-4 text-muted/30" />
                    <p className="text-sm">Nenhum dado encontrado.</p>
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
