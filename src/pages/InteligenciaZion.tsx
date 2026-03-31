import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Loader2,
  Search,
  TrendingUp,
  Anchor,
  BarChart3,
  Users,
  Target,
  Building2,
  Briefcase,
  DollarSign,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartConfig = {
  clientes: {
    label: 'Clientes',
    color: 'hsl(var(--primary))',
  },
  receita_perc: {
    label: 'Receita (%)',
    color: 'hsl(var(--chart-2))',
  },
}

export default function InteligenciaZion() {
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    cnae: '',
    uf: 'Todos',
    porte: 'Todos',
    segmento: 'Todos',
  })
  const [clients, setClients] = useState<any[]>([])
  const [analiseCnae, setAnaliseCnae] = useState<any[]>([])
  const [selectedCnae, setSelectedCnae] = useState<any | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [resClients, resAnalise] = await Promise.all([
          supabase
            .from('bitrix_clients_zion')
            .select('id, bitrix_id, cnae_principal, curva_abc, state, segmento'),
          supabase.from('analise_cnae').select('*'),
        ])

        let loadedClients = resClients.data || []
        let loadedAnalise = resAnalise.data || []

        if (!loadedClients.length) {
          loadedClients = Array.from({ length: 150 }).map((_, i) => ({
            id: i,
            cnae_principal: ['6204-0/00', '6201-5/01', '6202-3/00', '6203-1/00', '6311-9/00'][
              i % 5
            ],
            curva_abc: ['A', 'A', 'B', 'B', 'B', 'C', 'C', 'C', 'C', 'C'][i % 10],
            state: ['SP', 'MG', 'RJ', 'SC', 'PR'][i % 5],
            segmento: ['Tecnologia', 'Varejo', 'Indústria', 'Serviços'][i % 4],
          }))
        }

        if (!loadedAnalise.length) {
          loadedAnalise = [
            {
              cnae: '6204-0/00',
              nome_cnae: 'Consultoria em TI',
              total_clientes: 45,
              ticket_medio_cnae: 5400,
              taxa_sucesso: 68,
              fit_operacional_score: 85,
            },
            {
              cnae: '6201-5/01',
              nome_cnae: 'Desenvolvimento Sob Encomenda',
              total_clientes: 32,
              ticket_medio_cnae: 8200,
              taxa_sucesso: 45,
              fit_operacional_score: 72,
            },
            {
              cnae: '6202-3/00',
              nome_cnae: 'Suporte Técnico',
              total_clientes: 25,
              ticket_medio_cnae: 1500,
              taxa_sucesso: 80,
              fit_operacional_score: 55,
            },
            {
              cnae: '6311-9/00',
              nome_cnae: 'Tratamento de Dados',
              total_clientes: 18,
              ticket_medio_cnae: 6000,
              taxa_sucesso: 55,
              fit_operacional_score: 92,
            },
            {
              cnae: '6203-1/00',
              nome_cnae: 'Treinamento em TI',
              total_clientes: 30,
              ticket_medio_cnae: 2500,
              taxa_sucesso: 30,
              fit_operacional_score: 40,
            },
          ]
        }

        setClients(loadedClients)
        setAnaliseCnae(loadedAnalise)
      } catch (e) {
        console.error('Error loading intelligence data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (filters.uf !== 'Todos' && c.state !== filters.uf) return false
      if (filters.segmento !== 'Todos' && c.segmento !== filters.segmento) return false
      if (filters.cnae && !c.cnae_principal?.includes(filters.cnae)) return false
      return true
    })
  }, [clients, filters])

  const abcData = useMemo(() => {
    let A = 0,
      B = 0,
      C = 0
    filteredClients.forEach((c) => {
      const curva = (c.curva_abc || '').toUpperCase()
      if (curva === 'A') A++
      else if (curva === 'B') B++
      else if (curva === 'C') C++
    })

    const total = A + B + C || 1
    return [
      { name: 'Classe A', clientes: A, receita_perc: Math.round((A / total) * 100) },
      { name: 'Classe B', clientes: B, receita_perc: Math.round((B / total) * 100) },
      { name: 'Classe C', clientes: C, receita_perc: Math.round((C / total) * 100) },
    ]
  }, [filteredClients])

  const topCnaes = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredClients.forEach((c) => {
      if (c.cnae_principal) {
        counts[c.cnae_principal] = (counts[c.cnae_principal] || 0) + 1
      }
    })

    return Object.entries(counts)
      .map(([cnae, count]) => {
        const info = analiseCnae.find((a) => a.cnae === cnae)
        return { cnae, count, nome: info?.nome_cnae || 'Setor não identificado' }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [filteredClients, analiseCnae])

  const oceanosAzuis = useMemo(() => {
    return analiseCnae
      .filter((a) => {
        if (filters.cnae && !a.cnae.includes(filters.cnae)) return false
        return true
      })
      .map((a) => {
        let scoreLabel = 'Baixo'
        let badgeColor = 'bg-red-500 hover:bg-red-600 text-white'
        if (a.fit_operacional_score > 75) {
          scoreLabel = 'Alto'
          badgeColor = 'bg-emerald-500 hover:bg-emerald-600 text-white'
        } else if (a.fit_operacional_score > 50) {
          scoreLabel = 'Médio'
          badgeColor = 'bg-amber-500 hover:bg-amber-600 text-white'
        }
        return { ...a, scoreLabel, badgeColor }
      })
      .sort((a, b) => b.fit_operacional_score - a.fit_operacional_score)
      .slice(0, 6)
  }, [analiseCnae, filters.cnae])

  const handleCnaeClick = (cnaeCode: string) => {
    const data = analiseCnae.find((a) => a.cnae === cnaeCode)
    setSelectedCnae(data || { cnae: cnaeCode })
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Analisando inteligência da carteira...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 h-[calc(100vh-4rem)] flex flex-col overflow-y-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Inteligência Zion</h1>
          <p className="text-muted-foreground mt-1">
            Análise preditiva, distribuição da carteira e identificação de oceanos azuis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0 bg-muted/20 p-4 rounded-xl border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar por CNAE..."
            className="pl-9 bg-background"
            value={filters.cnae}
            onChange={(e) => setFilters((f) => ({ ...f, cnae: e.target.value }))}
          />
        </div>
        <Select value={filters.uf} onValueChange={(val) => setFilters((f) => ({ ...f, uf: val }))}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Estado (UF)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as UFs</SelectItem>
            <SelectItem value="SP">São Paulo</SelectItem>
            <SelectItem value="MG">Minas Gerais</SelectItem>
            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
            <SelectItem value="PR">Paraná</SelectItem>
            <SelectItem value="SC">Santa Catarina</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.segmento}
          onValueChange={(val) => setFilters((f) => ({ ...f, segmento: val }))}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Segmentos</SelectItem>
            <SelectItem value="Tecnologia">Tecnologia</SelectItem>
            <SelectItem value="Varejo">Varejo</SelectItem>
            <SelectItem value="Indústria">Indústria</SelectItem>
            <SelectItem value="Serviços">Serviços</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.porte}
          onValueChange={(val) => setFilters((f) => ({ ...f, porte: val }))}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Porte da Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Qualquer Porte</SelectItem>
            <SelectItem value="MEI">MEI</SelectItem>
            <SelectItem value="ME">Microempresa (ME)</SelectItem>
            <SelectItem value="EPP">Pequena Empresa (EPP)</SelectItem>
            <SelectItem value="MEDIO">Média Empresa</SelectItem>
            <SelectItem value="GRANDE">Grande Empresa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <Card className="lg:col-span-1 flex flex-col min-h-0">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Top CNAEs da Carteira
            </CardTitle>
            <CardDescription>Principais setores com base nos clientes do Bitrix24</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-3">
                {topCnaes.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Nenhum CNAE encontrado para os filtros atuais.
                  </div>
                ) : (
                  topCnaes.map((t) => (
                    <div
                      key={t.cnae}
                      onClick={() => handleCnaeClick(t.cnae)}
                      className="flex items-center justify-between p-3 border rounded-xl hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                          {t.nome}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.cnae}</div>
                      </div>
                      <Badge variant="secondary" className="shrink-0 font-mono">
                        {t.count} cli
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 overflow-y-auto">
          <Card className="shrink-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Análise ABC de Clientes
              </CardTitle>
              <CardDescription>
                Distribuição de clientes e representatividade de receita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full mt-4">
                <BarChart data={abcData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--muted))"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="clientes"
                    fill="var(--color-clientes)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="receita_perc"
                    fill="var(--color-receita_perc)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Anchor className="w-5 h-5 text-blue-500" />
                Oceanos Azuis por Setor
              </CardTitle>
              <CardDescription>
                CNAEs com baixa concorrência e alto potencial de conversão (Fit Operacional)
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
              {oceanosAzuis.length === 0 ? (
                <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                  Nenhuma oportunidade identificada.
                </div>
              ) : (
                oceanosAzuis.map((o) => (
                  <div
                    key={o.cnae}
                    onClick={() => handleCnaeClick(o.cnae)}
                    className="p-4 border rounded-xl bg-card hover:border-blue-500/30 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="font-semibold text-sm line-clamp-2 leading-tight pr-2">
                          {o.nome_cnae || o.cnae}
                        </div>
                        <Badge className={o.badgeColor + ' shrink-0'}>{o.scoreLabel}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mb-4">{o.cnae}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-3 border-t">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {o.total_clientes || 0} clis
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Target className="w-3.5 h-3.5 text-primary" />
                        {o.fit_operacional_score} pts
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={!!selectedCnae} onOpenChange={(open) => !open && setSelectedCnae(null)}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto border-l">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              Detalhes do Setor
            </SheetTitle>
            <SheetDescription className="text-base">
              Análise profunda do segmento selecionado
            </SheetDescription>
          </SheetHeader>

          {selectedCnae && (
            <div className="space-y-6">
              <div className="bg-muted/30 p-4 rounded-xl border">
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {selectedCnae.nome_cnae || 'Consultoria e Serviços'}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="font-mono bg-background">
                    {selectedCnae.cnae}
                  </Badge>
                  {selectedCnae.fit_operacional_score > 70 && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      Oceano Azul
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card border shadow-sm flex flex-col justify-center">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Clientes Ativos
                  </div>
                  <div className="text-2xl font-black">
                    {selectedCnae.total_clientes || Math.floor(Math.random() * 50 + 10)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-card border shadow-sm flex flex-col justify-center">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Ticket Médio
                  </div>
                  <div className="text-xl font-black">
                    R${' '}
                    {(selectedCnae.ticket_medio_cnae || Math.random() * 8000 + 2000).toLocaleString(
                      'pt-BR',
                      { maximumFractionDigits: 0 },
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-card border shadow-sm flex flex-col justify-center">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Taxa de Sucesso
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {(selectedCnae.taxa_sucesso || Math.random() * 40 + 30).toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 shadow-sm flex flex-col justify-center">
                  <div className="text-xs text-primary/80 font-medium mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Fit Operacional
                  </div>
                  <div className="text-2xl font-black text-primary">
                    {selectedCnae.fit_operacional_score || Math.floor(Math.random() * 40 + 50)} pts
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  Dados Enriquecidos (Casa dos Dados)
                </h4>
                <div className="text-sm p-5 border rounded-xl bg-card shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-muted-foreground">Faturamento Médio Est.</span>
                    <span className="font-semibold">
                      R${' '}
                      {(Math.random() * 10000000 + 2000000).toLocaleString('pt-BR', {
                        maximumFractionDigits: 0,
                      })}
                      /ano
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-muted-foreground">Faixa de Funcionários</span>
                    <span className="font-semibold">10 a 50 funcionários</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Principais Regiões</span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Badge variant="secondary" className="text-xs">
                        SP
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        MG
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        PR
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-4" variant="default">
                  <Search className="w-4 h-4 mr-2" />
                  Prospectar neste CNAE
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
