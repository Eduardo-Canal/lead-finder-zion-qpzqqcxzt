import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Loader2,
  RefreshCw,
  Search,
  Users,
  MapPin,
  Building2,
  BrainCircuit,
  Eye,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import useLeadStore from '@/stores/useLeadStore'

type Client = {
  id: string
  bitrix_id: number
  company_name: string
  cnpj: string
  cnae_principal: string
  segmento: string
  curva_abc: string
  email: string
  phone: string
  city: string
  state: string
  synced_at: string
}

const mapCurvaABC = (code: string | null) => {
  if (!code) return 'Não classificado'
  const map: Record<string, string> = {
    '7592': 'A+',
    '7594': 'A',
    '7596': 'B',
    '7598': 'C',
  }
  return map[code] || code
}

export default function InteligenciaZion() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedState, setSelectedState] = useState<string>('Todos')
  const [selectedCity, setSelectedCity] = useState<string>('Todas')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedModalCnae, setSelectedModalCnae] = useState<string | null>(null)

  const navigate = useNavigate()
  const { clearFilters, addCnae } = useLeadStore()

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('bitrix_clients_zion')
        .select('*')
        .order('company_name', { ascending: true })

      if (error) throw error
      if (data) setClients(data)
    } catch (err) {
      console.error('Error fetching clients:', err)
      toast.error('Erro ao carregar os dados dos clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()

    const channel = supabase
      .channel('public:bitrix_clients_zion')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bitrix_clients_zion' },
        () => {
          fetchClients()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('fetch-bitrix-clients-zion', {
        method: 'GET',
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Erro desconhecido na sincronização')

      toast.success('Sincronização com o Bitrix concluída!')
      await fetchClients()
    } catch (err: any) {
      console.error('Sync error:', err)
      toast.error(err.message || 'Falha ao sincronizar com o Bitrix24.')
    } finally {
      setSyncing(false)
    }
  }

  const handleBuscarLeads = (cnae: string) => {
    if (!cnae || cnae.toLowerCase() === 'não informado') {
      toast.warning('Este agrupamento não possui um código CNAE válido.')
      return
    }

    const cleanCnae = cnae.split(' - ')[0].trim()

    clearFilters()
    addCnae(cleanCnae)
    navigate('/prospeccao')
    toast.info(`Filtro CNAE (${cleanCnae}) aplicado. Inicie sua busca.`)
  }

  const handleOpenModal = (cnae: string) => {
    setSelectedModalCnae(cnae)
    setIsModalOpen(true)
  }

  // Derived state for filters
  const uniqueStates = useMemo(() => {
    const states = new Set(clients.map((c) => c.state).filter(Boolean))
    return Array.from(states).sort()
  }, [clients])

  const uniqueCities = useMemo(() => {
    let filtered = clients
    if (selectedState && selectedState !== 'Todos') {
      filtered = filtered.filter((c) => c.state === selectedState)
    }
    const cities = new Set(filtered.map((c) => c.city).filter(Boolean))
    return Array.from(cities).sort()
  }, [clients, selectedState])

  // Reset city if state changes and current city is not in new state
  useEffect(() => {
    if (selectedState !== 'Todos' && selectedCity !== 'Todas') {
      const cityExistsInState = clients.some(
        (c) => c.state === selectedState && c.city === selectedCity,
      )
      if (!cityExistsInState) setSelectedCity('Todas')
    }
  }, [selectedState, clients, selectedCity])

  // Filtered and grouped data
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (selectedState !== 'Todos' && c.state !== selectedState) return false
      if (selectedCity !== 'Todas' && c.city !== selectedCity) return false
      return true
    })
  }, [clients, selectedState, selectedCity])

  const tableData = useMemo(() => {
    const groups: Record<string, number> = {}
    filteredClients.forEach((c) => {
      const cnae = c.cnae_principal?.trim() || 'Não informado'
      groups[cnae] = (groups[cnae] || 0) + 1
    })

    return Object.entries(groups)
      .map(([cnae, count]) => ({ cnae, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredClients])

  const chartData = useMemo(() => {
    // Limit to top 10 for better pie chart visualization
    const topN = tableData.slice(0, 8)
    const others = tableData.slice(8).reduce((acc, curr) => acc + curr.count, 0)

    const result = [...topN]
    if (others > 0) {
      result.push({ cnae: 'Outros Setores', count: others })
    }
    return result
  }, [tableData])

  const chartConfig = useMemo(() => {
    const config: Record<string, any> = {}
    chartData.forEach((item, index) => {
      // Generate a vibrant color palette based on HSL
      const hue = (index * 137.5) % 360 // Golden angle approximation for distinct colors
      config[item.cnae] = {
        label: item.cnae,
        color: `hsl(${hue}, 70%, 50%)`,
      }
    })
    return config
  }, [chartData])

  const top8Cnaes = useMemo(() => {
    return tableData.slice(0, 8).map((x) => x.cnae)
  }, [tableData])

  const modalClients = useMemo(() => {
    if (!selectedModalCnae) return []
    return filteredClients.filter((c) => {
      const cnae = c.cnae_principal?.trim() || 'Não informado'
      if (selectedModalCnae === 'Outros Setores') {
        return !top8Cnaes.includes(cnae)
      }
      return cnae === selectedModalCnae
    })
  }, [filteredClients, selectedModalCnae, top8Cnaes])

  const handleCopyContacts = () => {
    if (!modalClients.length) return
    const text = modalClients
      .map((c) => `${c.company_name} - ${c.email || 'Sem e-mail'}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    toast.success('Contatos copiados para a área de transferência!')
  }

  const totalFiltered = filteredClients.length

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center text-muted-foreground animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Carregando dados da Inteligência Zion...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0066CC] flex items-center gap-2">
            <BrainCircuit className="h-6 w-6" />
            Inteligência Zion
          </h2>
          <p className="text-muted-foreground mt-1">
            Analise sua carteira atual de clientes e descubra novos oceanos azuis para prospecção.
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="outline"
          className="gap-2 shrink-0 bg-white"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sincronizar Bitrix
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#0066CC] to-blue-700 text-white shadow-md border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <h3 className="text-sm font-medium text-blue-100">Total de Clientes (Filtro)</h3>
              <Users className="h-5 w-5 text-blue-200" />
            </div>
            <div className="text-4xl font-bold tracking-tight mt-2">{totalFiltered}</div>
            <p className="text-xs text-blue-100 mt-1 opacity-80">
              {totalFiltered === clients.length ? 'Base completa' : 'Base filtrada'}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Setores Distintos (CNAEs)
              </h3>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold tracking-tight mt-2 text-slate-800">
              {tableData.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Atividades econômicas mapeadas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex flex-col justify-center h-full space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Estado (UF)
              </label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="bg-slate-50 h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Estados</SelectItem>
                  {uniqueStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Cidade
              </label>
              <Select
                value={selectedCity}
                onValueChange={setSelectedCity}
                disabled={selectedState === 'Todos' && uniqueCities.length > 50}
              >
                <SelectTrigger className="bg-slate-50 h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as Cidades</SelectItem>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart Card */}
        <Card className="lg:col-span-1 flex flex-col shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Setor</CardTitle>
            <CardDescription>Top 8 CNAEs mais representativos na base filtrada.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="cnae"
                    innerRadius={60}
                    outerRadius={100}
                    strokeWidth={2}
                    stroke="var(--background)"
                    paddingAngle={2}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={`cell-${entry.cnae}`}
                        fill={chartConfig[entry.cnae]?.color}
                        className="cursor-pointer hover:opacity-80 transition-opacity outline-none"
                        onClick={() => handleOpenModal(entry.cnae)}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel />}
                    cursor={{ fill: 'transparent' }}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg bg-slate-50/50 min-h-[250px]">
                Nenhum dado para exibir.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="lg:col-span-2 flex flex-col shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Análise de CNAEs (Oceanos Azuis)</CardTitle>
            <CardDescription>
              Identifique as atividades principais dos seus clientes atuais para espelhar na busca
              de novos leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[400px] w-full rounded-b-lg border-t">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[50%]">CNAE Principal</TableHead>
                    <TableHead className="text-center w-[20%]">Qtd. Clientes</TableHead>
                    <TableHead className="text-right pr-6 w-[30%]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                        Nenhum cliente encontrado com os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableData.map((row, index) => (
                      <TableRow
                        key={index}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: chartConfig[row.cnae]?.color || '#cbd5e1' }}
                            />
                            <span
                              className="truncate max-w-[300px] md:max-w-[400px]"
                              title={row.cnae}
                            >
                              {row.cnae}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono bg-slate-100">
                            {row.count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-500 hover:bg-slate-200 gap-1.5 h-8 px-2"
                              onClick={() => handleOpenModal(row.cnae)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Ver Clientes</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#0066CC] hover:bg-[#0066CC]/10 hover:text-[#0066CC] gap-1.5 h-8 px-2"
                              onClick={() => handleBuscarLeads(row.cnae)}
                              disabled={row.cnae.toLowerCase() === 'não informado'}
                            >
                              <Search className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Buscar Semelhantes</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Modal - Detalhamento de Clientes */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b shrink-0 flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <DialogTitle className="text-xl">Segmento: {selectedModalCnae}</DialogTitle>
              <DialogDescription className="mt-1.5 text-base">
                <span className="font-semibold text-slate-800">{modalClients.length}</span>{' '}
                {modalClients.length === 1
                  ? 'cliente Zion neste segmento'
                  : 'clientes Zion neste segmento'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContacts}
              className="gap-2 shrink-0 bg-slate-50 hover:bg-slate-100"
            >
              <Copy className="h-4 w-4" />
              Copiar Contatos
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-0 relative">
            <ScrollArea className="h-full w-full">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 shadow-sm z-10">
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Curva ABC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modalClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="font-medium text-slate-800">{client.company_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {client.cnpj || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="w-fit text-xs font-semibold">
                          {mapCurvaABC(client.curva_abc)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
