import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Download,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  BarChart3,
  Presentation,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const CURVAS = ['Todos', 'A+', 'A', 'B', 'C', 'Não Classificado']

// --- CHART CONFIG ---
const chartConfig = {
  aPlus: { label: 'Curva A+', color: '#064e3b' },
  a: { label: 'Curva A', color: '#10b981' },
  b: { label: 'Curva B', color: '#f59e0b' },
  c: { label: 'Curva C', color: '#ef4444' },
  nc: { label: 'Não Classificado', color: '#94a3b8' },
} satisfies ChartConfig

export default function AnaliseCarteira() {
  const { toast } = useToast()
  const [filtroCurva, setFiltroCurva] = useState<string>('Todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos')

  const [clients, setClients] = useState<any[]>([])
  const [marketData, setMarketData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [clientsRes, marketRes] = await Promise.all([
          supabase.from('bitrix_clients_zion').select('cnae_principal, curva_abc, state'),
          supabase
            .from('cnae_market_data')
            .select('cnae_code, cnae_description, potencial_mercado, tendencia'),
        ])

        if (clientsRes.data) {
          // Normalize curves
          const normalizedClients = clientsRes.data.map((c) => {
            const rawCurve = c.curva_abc?.trim().toUpperCase() || ''
            return {
              ...c,
              normalizedCurve: ['A+', 'A', 'B', 'C'].includes(rawCurve)
                ? rawCurve
                : 'Não Classificado',
            }
          })
          setClients(normalizedClients)
        }

        if (marketRes.data) {
          const mData: Record<string, any> = {}
          marketRes.data.forEach((item) => {
            mData[item.cnae_code] = item
          })
          setMarketData(mData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar a análise de carteira.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const ESTADOS = useMemo(() => {
    const states = new Set(
      clients.map((c) => c.state).filter((s) => s && s !== 'Não informado' && s !== 'ND'),
    )
    return Array.from(states).sort()
  }, [clients])

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (filtroCurva !== 'Todos' && c.normalizedCurve !== filtroCurva) return false

      const state = c.state || 'Não informado'
      if (filtroEstado !== 'Todos' && state !== filtroEstado) return false

      return true
    })
  }, [clients, filtroCurva, filtroEstado])

  // Aggregate by CNAE
  const cnaesData = useMemo(() => {
    const map = new Map<string, any>()

    filteredClients.forEach((c) => {
      const code = c.cnae_principal || 'N/D'
      if (!map.has(code)) {
        const market = marketData[code] || {}
        map.set(code, {
          codigo: code,
          descricao: market.cnae_description || 'Setor não detalhado',
          total: 0,
          aPlus: 0,
          a: 0,
          b: 0,
          c: 0,
          nc: 0,
          potencial: market.potencial_mercado || 0,
          tendencia: market.tendencia || 'Estável',
        })
      }

      const data = map.get(code)
      data.total++

      if (c.normalizedCurve === 'A+') data.aPlus++
      else if (c.normalizedCurve === 'A') data.a++
      else if (c.normalizedCurve === 'B') data.b++
      else if (c.normalizedCurve === 'C') data.c++
      else data.nc++
    })

    const arr = Array.from(map.values())
    arr.forEach((item) => {
      item.penetracao = item.potencial > 0 ? (item.total / item.potencial) * 100 : 0
    })

    arr.sort((x, y) => y.total - x.total)
    return arr
  }, [filteredClients, marketData])

  const top10Data = useMemo(() => cnaesData.slice(0, 10), [cnaesData])

  // Executive Summary
  const summary = useMemo(() => {
    const s = { totalClientes: 0, totalCnaes: cnaesData.length, aPlus: 0, a: 0, b: 0, c: 0, nc: 0 }
    filteredClients.forEach((c) => {
      s.totalClientes++
      if (c.normalizedCurve === 'A+') s.aPlus++
      else if (c.normalizedCurve === 'A') s.a++
      else if (c.normalizedCurve === 'B') s.b++
      else if (c.normalizedCurve === 'C') s.c++
      else s.nc++
    })
    return s
  }, [filteredClients, cnaesData.length])

  const handleExport = () => {
    toast({
      title: 'Relatório Solicitado',
      description: 'O relatório em Excel está sendo gerado e o download iniciará em breve.',
    })
  }

  const handleCreateAlert = () => {
    toast({
      title: 'Alertas Inteligentes',
      description: 'Painel de configuração de alertas será aberto em uma nova janela.',
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Carregando inteligência de mercado...
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-fade-in-up max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Presentation className="w-8 h-8 text-primary" /> Análise de Carteira
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            Inteligência de mercado, penetração por setor e distribuição da Curva ABC.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" /> Exportar Relatório
          </Button>
          <Button
            onClick={handleCreateAlert}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            <Target className="w-4 h-4 mr-2" /> Criar Alertas/Metas
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-slate-500" />
            Filtros Avançados
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-600">Curva ABC</Label>
              <Select value={filtroCurva} onValueChange={setFiltroCurva}>
                <SelectTrigger className="bg-white border-slate-200 shadow-sm h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CURVAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-600">Estado / Região</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="bg-white border-slate-200 shadow-sm h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Estados</SelectItem>
                  {ESTADOS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Clientes
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1">
              {summary.totalClientes.toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total CNAEs
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1">
              {summary.totalCnaes.toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#064e3b] shadow-sm bg-emerald-50/30">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Curva A+
            </span>
            <span className="text-3xl font-extrabold text-[#064e3b] mt-1">
              {summary.aPlus.toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#10b981] shadow-sm bg-emerald-50/10">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Curva A
            </span>
            <span className="text-3xl font-extrabold text-[#10b981] mt-1">
              {summary.a.toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#f59e0b] shadow-sm bg-amber-50/30">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Curva B
            </span>
            <span className="text-3xl font-extrabold text-[#f59e0b] mt-1">
              {summary.b.toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#ef4444] shadow-sm bg-rose-50/30">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Curva C
            </span>
            <span className="text-3xl font-extrabold text-[#ef4444] mt-1">
              {summary.c.toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-slate-400 shadow-sm bg-slate-50/50">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Não Class.
            </span>
            <span className="text-3xl font-extrabold text-slate-600 mt-1">
              {summary.nc.toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Top 10 CNAEs na Carteira
          </CardTitle>
          <CardDescription>
            Principais setores classificados pelo volume de clientes ativos e distribuição de Curva
            ABC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {top10Data.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-slate-500">
              Nenhum dado disponível para os filtros selecionados.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="w-full aspect-auto h-[400px]">
              <BarChart
                data={top10Data}
                layout="vertical"
                margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="codigo"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={90}
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.1 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                <Bar dataKey="aPlus" stackId="a" fill="var(--color-aPlus)" />
                <Bar dataKey="a" stackId="a" fill="var(--color-a)" />
                <Bar dataKey="b" stackId="a" fill="var(--color-b)" />
                <Bar dataKey="c" stackId="a" fill="var(--color-c)" />
                <Bar dataKey="nc" stackId="a" fill="var(--color-nc)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg">Inteligência Estratégica por CNAE</CardTitle>
          <CardDescription>
            Detalhamento analítico e tendências de mercado baseadas na base atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[100px] font-bold text-slate-700">Código</TableHead>
                  <TableHead className="font-bold text-slate-700">Descrição CNAE</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Clientes</TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-[#064e3b]">
                    A+
                  </TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-[#10b981]">A</TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-[#f59e0b]">B</TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-[#ef4444]">C</TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-slate-500">
                    NC
                  </TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Potencial</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Penetração</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Tendência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cnaesData.map((row) => (
                  <TableRow key={row.codigo} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-semibold text-slate-900">{row.codigo}</TableCell>
                    <TableCell
                      className="max-w-[250px] truncate text-slate-600 font-medium"
                      title={row.descricao}
                    >
                      {row.descricao}
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-slate-900">
                      {row.total.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.aPlus > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 shadow-none font-bold">
                          {row.aPlus}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.a > 0 ? (
                        <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-0 shadow-none font-bold">
                          {row.a}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.b > 0 ? (
                        <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-0 shadow-none font-bold">
                          {row.b}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.c > 0 ? (
                        <Badge className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-0 shadow-none font-bold">
                          {row.c}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.nc > 0 ? (
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 shadow-none font-bold">
                          {row.nc}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-bold">
                      {row.potencial.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-bold text-slate-700">
                          {row.penetracao.toFixed(1)}%
                        </span>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(row.penetracao, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      {row.tendencia?.includes('Crescimento') ? (
                        <div className="flex items-center justify-end text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-md ml-auto w-max">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {row.tendencia}
                        </div>
                      ) : row.tendencia === 'Saturação' ? (
                        <div className="flex items-center justify-end text-rose-600 text-sm font-bold bg-rose-50 px-2 py-1 rounded-md ml-auto w-max">
                          <TrendingDown className="w-4 h-4 mr-1" />
                          {row.tendencia}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end text-slate-500 text-sm font-bold bg-slate-100 px-2 py-1 rounded-md ml-auto w-max">
                          <Minus className="w-4 h-4 mr-1" />
                          {row.tendencia}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {cnaesData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-slate-500 font-medium">
                      Nenhum dado encontrado para os filtros selecionados. Tente ajustar sua busca.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
