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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Loader2, Search, Target, Anchor, TrendingUp, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

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
  const [segmentoFilter, setSegmentoFilter] = useState('Todos')

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('get-clientes-por-cnae', {
        method: 'POST',
      })
      if (error) throw error
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

  const abcData = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0 }
    clients.forEach((c) => {
      const curva = (c.curva_abc || '').toUpperCase()
      if (curva.includes('A')) counts.A++
      else if (curva.includes('B')) counts.B++
      else if (curva.includes('C')) counts.C++
    })
    return [
      {
        name: 'Curva A',
        value: counts.A,
        fill: 'hsl(var(--chart-1))',
        key: 'A',
        desc: 'Melhores Clientes',
      },
      {
        name: 'Curva B',
        value: counts.B,
        fill: 'hsl(var(--chart-2))',
        key: 'B',
        desc: 'Clientes Médios',
      },
      {
        name: 'Curva C',
        value: counts.C,
        fill: 'hsl(var(--chart-3))',
        key: 'C',
        desc: 'Clientes Pequenos',
      },
    ].filter((d) => d.value > 0)
  }, [clients])

  const handleBuscarClones = (curva: string) => {
    const cnaes: Record<string, number> = {}
    clients
      .filter((c) => (c.curva_abc || '').toUpperCase().includes(curva))
      .forEach((c) => {
        if (c.cnae) cnaes[c.cnae] = (cnaes[c.cnae] || 0) + 1
      })
    const topCnaes = Object.entries(cnaes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((e) => e[0])
    clearFilters()
    topCnaes.forEach(addCnae)
    toast.success(`Buscando clones da Curva ${curva}.`)
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
      .sort((a, b) => a.count - b.count)
      .slice(0, 8)
  }, [clients, segmentoFilter])

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

      <Tabs defaultValue="abc" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="abc" className="gap-2">
            <Target className="w-4 h-4" /> Análise ABC
          </TabsTrigger>
          <TabsTrigger value="oceanos" className="gap-2">
            <Anchor className="w-4 h-4" /> Oceanos Azuis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abc" className="flex-1 overflow-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Curva ABC</CardTitle>
              <CardDescription>
                Encontre "clones" dos seus melhores clientes baseados no faturamento e histórico.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/2 h-[300px]">
                {abcData.length > 0 ? (
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={abcData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                        >
                          {abcData.map((e, i) => (
                            <Cell key={i} fill={e.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                    Sem dados de curva ABC
                  </div>
                )}
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                {abcData.map((item) => (
                  <div
                    key={item.key}
                    className="p-4 border rounded-xl flex justify-between items-center hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.value} clientes - {item.desc}
                      </p>
                    </div>
                    <Button onClick={() => handleBuscarClones(item.key)} variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Clones
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
