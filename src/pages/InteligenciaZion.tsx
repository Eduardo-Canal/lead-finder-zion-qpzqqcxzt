import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import useLeadStore from '@/stores/useLeadStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import {
  Loader2,
  Search,
  Building2,
  Briefcase,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const getCurvaBadgeColor = (curva: string) => {
  const c = (curva || '').toUpperCase()
  if (c.includes('A'))
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
  if (c.includes('B'))
    return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
  if (c.includes('C'))
    return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
  return 'bg-muted text-muted-foreground border-border'
}

export default function InteligenciaZion() {
  const navigate = useNavigate()
  const { clearFilters, setAllFilters, addCnae } = useLeadStore()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filters, setFilters] = useState({
    cnae: '',
    uf: 'Todos',
    porte: 'Todos',
    segmento: 'Todos',
  })
  const [clients, setClients] = useState<any[]>([])
  const [analiseCnae, setAnaliseCnae] = useState<any[]>([])
  const [expandedRow, setExpandedRow] = useState<string>('')
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set())

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('get-clientes-por-cnae', {
        method: 'POST',
      })
      if (error) throw error

      if (data?.success && data?.data) {
        const allClients: any[] = []
        const cnaeInfo: any[] = []

        data.data.forEach((item: any) => {
          if (item.clientes) {
            allClients.push(...item.clientes)
          }
          cnaeInfo.push({
            cnae: item.cnae,
            nome_cnae: item.descricao,
            percentual: item.percentual,
          })
        })

        setClients(allClients)
        setAnaliseCnae(cnaeInfo)
      } else {
        setClients([])
        setAnaliseCnae([])
      }
    } catch (e) {
      console.error('Error loading intelligence data:', e)
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setSelectedCompanyIds(new Set())
  }, [expandedRow])

  const handleSyncData = async () => {
    try {
      setSyncing(true)
      toast.loading('Atualizando dados...', { id: 'sync-data' })
      await loadData()
      toast.success('Dados atualizados com sucesso!', { id: 'sync-data' })
    } catch (err: any) {
      toast.error(`Erro ao atualizar: ${err.message}`, { id: 'sync-data' })
    } finally {
      setSyncing(false)
    }
  }

  const filteredClients = useMemo(
    () =>
      clients.filter((c) => {
        if (filters.uf !== 'Todos' && c.uf !== filters.uf) return false
        if (filters.segmento !== 'Todos' && c.segmento !== filters.segmento) return false
        if (filters.porte !== 'Todos' && c.porte !== filters.porte) return false
        if (filters.cnae && !c.cnae?.includes(filters.cnae)) return false
        return true
      }),
    [clients, filters],
  )

  const topCnaes = useMemo(() => {
    const counts: Record<string, number> = {}
    const setores: Record<string, string> = {}
    filteredClients.forEach((c) => {
      if (c.cnae) {
        counts[c.cnae] = (counts[c.cnae] || 0) + 1
        if (!setores[c.cnae] && c.segmento) {
          setores[c.cnae] = c.segmento
        }
      }
    })
    return Object.entries(counts)
      .map(([cnae, count]) => {
        const info = analiseCnae.find((a) => a.cnae === cnae)
        return {
          cnae,
          count,
          nome: info?.nome_cnae || 'Descrição não informada',
          setor: setores[cnae] || 'Não classificado',
          percentual: info?.percentual || 0,
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [filteredClients, analiseCnae])

  const expandedCnaeClients = useMemo(() => {
    if (!expandedRow) return []
    return filteredClients.filter((c) => c.cnae === expandedRow || c.cnae?.includes(expandedRow))
  }, [filteredClients, expandedRow])

  const toggleCompany = (id: string) => {
    const newSet = new Set(selectedCompanyIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedCompanyIds(newSet)
  }

  const toggleAll = () => {
    if (selectedCompanyIds.size === expandedCnaeClients.length) setSelectedCompanyIds(new Set())
    else setSelectedCompanyIds(new Set(expandedCnaeClients.map((c) => c.id)))
  }

  const handleProspectar = () => {
    if (!expandedRow) return
    const selected = expandedCnaeClients.filter((c) => selectedCompanyIds.has(c.id))
    const ufs = Array.from(new Set(selected.map((c) => c.uf).filter(Boolean)))
    clearFilters()
    addCnae(expandedRow)
    if (ufs.length > 0) setAllFilters({ ufs })
    toast.success(`${selected.length} empresas usadas como referência. Filtros aplicados!`)
    navigate('/prospeccao')
  }

  const chartData = useMemo(() => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ]
    return topCnaes.map((t, index) => ({
      name: t.nome,
      cnae: t.cnae,
      value: t.count,
      percentual: t.percentual,
      fill: colors[index % colors.length],
    }))
  }, [topCnaes])

  const chartConfig = useMemo(() => {
    const config: Record<string, any> = { clientes: { label: 'Clientes' } }
    chartData.forEach((item) => {
      config[item.cnae] = { label: item.cnae, color: item.fill }
    })
    return config
  }, [chartData])

  if (loading)
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 h-[calc(100vh-4rem)] flex flex-col overflow-y-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Inteligência Zion</h1>
          <p className="text-muted-foreground mt-1">
            Explore sua carteira por setor e selecione perfis para prospecção.
          </p>
        </div>
        <Button onClick={handleSyncData} disabled={syncing || loading} className="gap-2 shrink-0">
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}{' '}
          Sincronizar Dados
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border rounded-xl bg-muted/20 border-dashed py-12 px-4 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold text-foreground">Nenhum dado encontrado</h3>
          <p className="text-muted-foreground max-w-md mt-2 mb-6">
            A base de inteligência está vazia. Sincronize para começar.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0 bg-muted/20 p-4 rounded-xl border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar CNAE..."
                className="pl-9 bg-background"
                value={filters.cnae}
                onChange={(e) => setFilters((f) => ({ ...f, cnae: e.target.value }))}
              />
            </div>
            <Select value={filters.uf} onValueChange={(v) => setFilters((f) => ({ ...f, uf: v }))}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas as UFs</SelectItem>
                <SelectItem value="SP">SP</SelectItem>
                <SelectItem value="MG">MG</SelectItem>
                <SelectItem value="RJ">RJ</SelectItem>
                <SelectItem value="PR">PR</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.segmento}
              onValueChange={(v) => setFilters((f) => ({ ...f, segmento: v }))}
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
              onValueChange={(v) => setFilters((f) => ({ ...f, porte: v }))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Porte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Qualquer Porte</SelectItem>
                <SelectItem value="MEI">MEI</SelectItem>
                <SelectItem value="ME">ME</SelectItem>
                <SelectItem value="EPP">EPP</SelectItem>
                <SelectItem value="MEDIO">Média Empresa</SelectItem>
                <SelectItem value="GRANDE">Grande Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {topCnaes.length > 0 && (
            <Card className="shrink-0 shadow-sm border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle>Distribuição de Clientes por CNAE</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-1/2 h-[220px]">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="cnae"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {chartData.map((e, i) => (
                            <Cell key={i} fill={e.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                <ScrollArea className="h-[220px] w-full md:w-1/2">
                  <div className="flex flex-col gap-3 pr-4">
                    {chartData.map((item) => (
                      <div key={item.cnae} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0 pr-4">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="font-medium truncate" title={item.name}>
                            {item.cnae} - {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground shrink-0">
                          <span>{item.value}</span>
                          <span className="w-12 text-right">
                            {item.percentual > 0
                              ? `${item.percentual}%`
                              : `${((item.value / Math.max(1, filteredClients.length)) * 100).toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <Card className="flex-1 flex flex-col min-h-0 border-primary/10 shadow-md">
            <CardHeader className="pb-3 shrink-0 bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Detalhamento por Setor
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                {topCnaes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed m-6 rounded-xl">
                    Nenhum CNAE encontrado.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Setor</TableHead>
                        <TableHead>CNAE</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Quantidade de Clientes</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCnaes.map((t) => {
                        const rows = [
                          <TableRow
                            key={t.cnae}
                            className={cn(
                              'cursor-pointer',
                              expandedRow === t.cnae && 'bg-muted/50',
                            )}
                            onClick={() =>
                              setExpandedRow((prev) => (prev === t.cnae ? '' : t.cnae))
                            }
                          >
                            <TableCell className="font-medium">{t.setor}</TableCell>
                            <TableCell className="font-mono text-xs">{t.cnae}</TableCell>
                            <TableCell className="max-w-[250px] truncate" title={t.nome}>
                              {t.nome}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{t.count}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                {expandedRow === t.cnae ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>,
                        ]

                        if (expandedRow === t.cnae) {
                          rows.push(
                            <TableRow
                              key={`${t.cnae}-expanded`}
                              className="bg-muted/5 hover:bg-muted/5"
                            >
                              <TableCell colSpan={5} className="p-0 border-b-2 border-primary/20">
                                <div className="p-4 animate-in fade-in slide-in-from-top-2">
                                  <div className="flex justify-between items-center pb-3 mb-3 border-b border-border/50">
                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                      <Building2 className="w-4 h-4 text-blue-500" /> Empresas
                                      associadas
                                    </h4>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={toggleAll}>
                                        {selectedCompanyIds.size === expandedCnaeClients.length &&
                                        expandedCnaeClients.length > 0
                                          ? 'Desmarcar Todos'
                                          : 'Selecionar Todos'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={handleProspectar}
                                        disabled={selectedCompanyIds.size === 0}
                                      >
                                        <Search className="w-3.5 h-3.5 mr-1.5" /> Usar como
                                        Referência ({selectedCompanyIds.size})
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {expandedCnaeClients.map((client) => (
                                      <label
                                        key={client.id}
                                        className={cn(
                                          'flex items-start space-x-3 p-3 border rounded-lg bg-background cursor-pointer transition-all',
                                          selectedCompanyIds.has(client.id)
                                            ? 'border-primary ring-1 ring-primary/20 bg-primary/5'
                                            : 'hover:border-primary/40 hover:bg-muted/50',
                                        )}
                                      >
                                        <Checkbox
                                          checked={selectedCompanyIds.has(client.id)}
                                          onCheckedChange={() => toggleCompany(client.id)}
                                          className="mt-1"
                                        />
                                        <div className="grid gap-1.5 flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate text-foreground">
                                            {client.nome || 'S/N'}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                'text-[10px] h-5 px-1.5',
                                                getCurvaBadgeColor(client.curva_abc),
                                              )}
                                            >
                                              Curva {client.curva_abc || 'N/D'}
                                            </Badge>
                                          </div>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>,
                          )
                        }

                        return rows
                      })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
