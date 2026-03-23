import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
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
import { Badge, badgeVariants } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Loader2,
  RefreshCw,
  Search,
  Users,
  MapPin,
  Building2,
  BrainCircuit,
  Eye,
  Download,
  Briefcase,
  Activity,
  FolderOpen,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import useLeadStore from '@/stores/useLeadStore'
import useAuthStore from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'
import { designTokens } from '@/constants/designTokens'
import { EmptyState, LoadingCard, LoadingTableRows } from '@/components/Notifications/StateBlocks'
import { Skeleton } from '@/components/ui/skeleton'

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

const getCurvaABCProps = (code: string | null) => {
  const map: Record<string, { label: string; colorClass: string }> = {
    '7592': { label: 'A+', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
    '7594': { label: 'A', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    '7596': { label: 'B', colorClass: 'bg-amber-100 text-amber-800 border-amber-200' },
    '7598': { label: 'C', colorClass: 'bg-red-100 text-red-800 border-red-200' },
  }
  return (
    map[code || ''] || {
      label: 'Não classificado',
      colorClass: 'bg-slate-100 text-slate-600 border-slate-200',
    }
  )
}

export default function InteligenciaZion() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selectedState, setSelectedState] = useState<string>('Todos')
  const [selectedCity, setSelectedCity] = useState<string>('Todas')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedModalCnae, setSelectedModalCnae] = useState<string | null>(null)
  const [selectedModalCurva, setSelectedModalCurva] = useState<string>('Todas')

  const navigate = useNavigate()
  const { clearFilters, addCnae } = useLeadStore()
  const { user } = useAuthStore()

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
    setSelectedModalCurva('Todas') // Reset filter on open
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

  const cnaeStats = useMemo(() => {
    return tableData.map((row) => {
      const clientsOfCnae = filteredClients.filter((c) => {
        const cnae = c.cnae_principal?.trim() || 'Não informado'
        return cnae === row.cnae
      })

      const curvas = clientsOfCnae.reduce(
        (acc, c) => {
          const label = getCurvaABCProps(c.curva_abc).label
          acc[label] = (acc[label] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        cnae: row.cnae,
        count: row.count,
        curvas,
      }
    })
  }, [tableData, filteredClients])

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
    let filtered = filteredClients.filter((c) => {
      const cnae = c.cnae_principal?.trim() || 'Não informado'
      if (selectedModalCnae === 'Outros Setores') {
        return !top8Cnaes.includes(cnae)
      }
      return cnae === selectedModalCnae
    })

    if (selectedModalCurva !== 'Todas') {
      filtered = filtered.filter((c) => {
        if (selectedModalCurva === 'unclassified') {
          return !['7592', '7594', '7596', '7598'].includes(c.curva_abc || '')
        }
        return c.curva_abc === selectedModalCurva
      })
    }

    return filtered
  }, [filteredClients, selectedModalCnae, top8Cnaes, selectedModalCurva])

  const totalFiltered = filteredClients.length

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new()

      const summaryData = [
        ['Relatório de Inteligência Zion'],
        ['Total de Clientes (Filtro)', totalFiltered],
        ['Setores Distintos (CNAEs)', tableData.length],
      ]
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo')

      const chartDataExport = [['Setor (CNAE)', 'Quantidade de Clientes']]
      chartData.forEach((item) => {
        chartDataExport.push([item.cnae, String(item.count)])
      })
      const wsChart = XLSX.utils.aoa_to_sheet(chartDataExport)
      XLSX.utils.book_append_sheet(wb, wsChart, 'Distribuição por Setor')

      const cnaeHeaders = [
        'CNAE Principal',
        'Total de Clientes',
        'A+',
        'A',
        'B',
        'C',
        'Não classificado',
      ]
      const cnaeRows = cnaeStats.map((stat) => [
        stat.cnae,
        stat.count,
        stat.curvas['A+'] || 0,
        stat.curvas['A'] || 0,
        stat.curvas['B'] || 0,
        stat.curvas['C'] || 0,
        stat.curvas['Não classificado'] || 0,
      ])
      const wsCnaes = XLSX.utils.aoa_to_sheet([cnaeHeaders, ...cnaeRows])
      XLSX.utils.book_append_sheet(wb, wsCnaes, 'Tabela de CNAEs')

      const clientHeaders = [
        'Empresa',
        'CNPJ',
        'CNAE Principal',
        'Curva ABC',
        'Cidade',
        'Estado',
        'Email',
        'Telefone',
      ]
      const clientRows = filteredClients.map((c) => [
        c.company_name,
        c.cnpj,
        c.cnae_principal || 'Não informado',
        getCurvaABCProps(c.curva_abc).label,
        c.city,
        c.state,
        c.email,
        c.phone,
      ])
      const wsClients = XLSX.utils.aoa_to_sheet([clientHeaders, ...clientRows])
      XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes Detalhados')

      XLSX.writeFile(wb, `Zion_Relatorio_${new Date().getTime()}.xlsx`)
      toast.success('Excel exportado com sucesso!')

      if (user?.user_id) {
        supabase
          .from('audit_logs')
          .insert({
            user_id: user.user_id,
            action: 'export',
            entity_type: 'lead',
            changes: { type: 'inteligencia_zion', format: 'excel', count: totalFiltered },
          })
          .catch((err) => console.error('Error logging audit', err))
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao exportar Excel')
    }
  }

  const handleExportPDF = async () => {
    try {
      setExporting(true)
      const pdf = new jsPDF('p', 'pt', 'a4')
      let y = 40

      pdf.setFontSize(18)
      pdf.text('Relatório de Inteligência Zion', 40, y)
      y += 30

      pdf.setFontSize(12)
      pdf.text(`Total de Clientes (Filtro): ${totalFiltered}`, 40, y)
      y += 20
      pdf.text(`Setores Distintos (CNAEs): ${tableData.length}`, 40, y)
      y += 30

      const chartElement = document.getElementById('chart-container-export')
      if (chartElement) {
        const canvas = await html2canvas(chartElement, { scale: 2 })
        const imgData = canvas.toDataURL('image/png')
        const pdfWidth = 400
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width

        if (y + pdfHeight > 800) {
          pdf.addPage()
          y = 40
        }

        pdf.addImage(imgData, 'PNG', 40, y, pdfWidth, pdfHeight)
        y += pdfHeight + 30
      }

      if (y > 750) {
        pdf.addPage()
        y = 40
      }

      pdf.setFontSize(14)
      pdf.setFont(undefined, 'bold')
      pdf.text('Tabela de CNAEs com Curva ABC', 40, y)
      y += 20

      pdf.setFontSize(10)

      for (const stat of cnaeStats) {
        if (y > 780) {
          pdf.addPage()
          y = 40
        }
        pdf.setFont(undefined, 'bold')
        const text = `${stat.cnae.substring(0, 70)}${stat.cnae.length > 70 ? '...' : ''}`
        pdf.text(text, 40, y)
        y += 15

        pdf.setFont(undefined, 'normal')
        const line2 = `Total: ${stat.count} | A+: ${stat.curvas['A+'] || 0} | A: ${stat.curvas['A'] || 0} | B: ${stat.curvas['B'] || 0} | C: ${stat.curvas['C'] || 0} | N/C: ${stat.curvas['Não classificado'] || 0}`
        pdf.text(line2, 50, y)
        y += 20
      }

      pdf.save(`Zion_Relatorio_${new Date().getTime()}.pdf`)
      toast.success('PDF exportado com sucesso!')

      if (user?.user_id) {
        supabase
          .from('audit_logs')
          .insert({
            user_id: user.user_id,
            action: 'export',
            entity_type: 'lead',
            changes: { type: 'inteligencia_zion', format: 'pdf', count: totalFiltered },
          })
          .catch((err) => console.error('Error logging audit', err))
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao exportar PDF')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className={cn(designTokens.layout.page, 'max-w-7xl mx-auto space-y-6 animate-fade-in')}>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div className="space-y-2 w-full sm:w-1/2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full rounded-full aspect-square mx-auto" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <LoadingTableRows columns={3} rows={6} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(designTokens.layout.page, 'max-w-7xl mx-auto space-y-6 animate-fade-in')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <BrainCircuit className="h-6 w-6" />
            Inteligência Zion
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Analise sua carteira atual de clientes e descubra novos oceanos azuis para prospecção.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-white" disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                Exportar para Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                Exportar para PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="primary"
            className="gap-2 shrink-0 shadow-sm"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Sincronizar Bitrix</span>
            <span className="sm:hidden">Sincronizar</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-600 text-white shadow-md border-none overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4">
            <Users className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between space-x-2">
              <h3 className="text-sm font-medium text-primary-50">Total de Clientes (Filtro)</h3>
              <Users className="h-5 w-5 text-primary-100" />
            </div>
            <div className="text-4xl font-bold tracking-tight mt-2">{totalFiltered}</div>
            <p className="text-xs text-primary-100 mt-1 opacity-90">
              {totalFiltered === clients.length ? 'Base completa' : 'Base filtrada'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Setores Distintos (CNAEs)
              </h3>
              <Activity className="h-5 w-5 text-secondary" />
            </div>
            <div className="text-3xl font-bold tracking-tight mt-2 text-slate-800">
              {tableData.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Atividades econômicas mapeadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-200">
          <CardContent className="p-5 flex flex-col justify-center h-full space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Estado (UF)
              </label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="bg-slate-50/50 h-9 transition-colors hover:bg-slate-50">
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
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Cidade
              </label>
              <Select
                value={selectedCity}
                onValueChange={setSelectedCity}
                disabled={selectedState === 'Todos' && uniqueCities.length > 50}
              >
                <SelectTrigger className="bg-slate-50/50 h-9 transition-colors hover:bg-slate-50">
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
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" /> Distribuição por Setor
            </CardTitle>
            <CardDescription>Top 8 CNAEs mais representativos na base filtrada.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4" id="chart-container-export">
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
              <div className="h-full min-h-[250px] flex items-center justify-center">
                <EmptyState
                  title="Nenhum dado"
                  description="Ajuste os filtros para ver o gráfico."
                  icon={Activity}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="lg:col-span-2 flex flex-col shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Análise de CNAEs (Oceanos Azuis)
            </CardTitle>
            <CardDescription>
              Identifique as atividades principais dos seus clientes atuais para espelhar na busca
              de novos leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[400px] w-full bg-white">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[45%] lg:w-[50%] min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" /> CNAE Principal
                      </div>
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap w-[15%]">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-3.5 w-3.5 shrink-0" /> Qtd. Clientes
                      </div>
                    </TableHead>
                    <TableHead className="text-right pr-6 whitespace-nowrap w-[40%] lg:w-[35%]">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-64">
                        <EmptyState
                          title="Nenhum setor encontrado"
                          description="Tente ajustar os filtros de estado ou cidade."
                          icon={FolderOpen}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableData.map((row, index) => (
                      <TableRow
                        key={index}
                        className="group hover:bg-primary-50/40 transition-colors cursor-pointer"
                        onClick={() => handleOpenModal(row.cnae)}
                      >
                        <TableCell className="font-medium text-slate-700 w-full max-w-0">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: chartConfig[row.cnae]?.color || '#cbd5e1' }}
                            />
                            <span
                              className="truncate group-hover:text-primary transition-colors block w-full"
                              title={row.cnae}
                            >
                              {row.cnae}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className="font-mono bg-slate-100/80 group-hover:bg-white transition-colors"
                          >
                            {row.count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4 whitespace-nowrap">
                          <div className="flex justify-end items-center gap-2 flex-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 gap-1.5 h-8 px-2.5 text-xs shadow-sm border-slate-200 bg-white shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenModal(row.cnae)
                              }}
                              title="Ver empresas deste CNAE"
                            >
                              <Eye className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden xl:inline">Ver Empresas</span>
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              className="gap-1.5 h-8 px-2.5 text-xs shadow-sm shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBuscarLeads(row.cnae)
                              }}
                              disabled={row.cnae.toLowerCase() === 'não informado'}
                              title="Buscar empresas semelhantes"
                            >
                              <Search className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden xl:inline">Buscar Semelhante</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Modal - Detalhamento de Clientes */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl h-[650px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50/50">
          <DialogHeader className="p-6 pb-4 border-b bg-white shrink-0 sticky top-0 z-20 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-6">
              <div className="flex flex-col items-start gap-1.5">
                <DialogTitle
                  className="text-xl line-clamp-2 leading-tight text-slate-800"
                  title={selectedModalCnae || ''}
                >
                  <span className="text-primary mr-1">Segmento:</span> {selectedModalCnae}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                    <span className={cn(badgeVariants({ variant: 'outline' }), 'bg-slate-50')}>
                      {modalClients.length}{' '}
                      {modalClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
                    </span>
                  </div>
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 bg-slate-50 p-1.5 rounded-lg border">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide pl-2">
                  Curva ABC:
                </span>
                <Select value={selectedModalCurva} onValueChange={setSelectedModalCurva}>
                  <SelectTrigger className="w-[150px] bg-white h-8 border-slate-200">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas as Curvas</SelectItem>
                    <SelectItem value="7592">A+</SelectItem>
                    <SelectItem value="7594">A</SelectItem>
                    <SelectItem value="7596">B</SelectItem>
                    <SelectItem value="7598">C</SelectItem>
                    <SelectItem value="unclassified">Não classificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>

          {/* Fixed Header Row for List */}
          <div className="flex items-center justify-between bg-slate-800 text-white pl-10 pr-12 py-3 shrink-0 z-10 shadow-md">
            <span className="font-semibold text-sm tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-300" /> Empresa
            </span>
            <span className="font-semibold text-sm tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-300" /> Curva ABC
            </span>
          </div>

          <div className="flex-1 overflow-hidden px-6 py-4 relative bg-slate-50/50">
            <ScrollArea className="h-full w-full pr-4 -mr-4">
              <div className="space-y-3 pb-2">
                {modalClients.length === 0 ? (
                  <div className="h-48 flex items-center justify-center">
                    <EmptyState
                      title="Nenhum cliente"
                      description="Nenhum cliente encontrado para este filtro de Curva ABC."
                      icon={Users}
                    />
                  </div>
                ) : (
                  modalClients.map((client) => {
                    const curva = getCurvaABCProps(client.curva_abc)
                    return (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-primary/30 hover:shadow-md transition-all group"
                      >
                        <div className="flex flex-col pr-4">
                          <span className="font-semibold text-slate-800 group-hover:text-primary transition-colors">
                            {client.company_name}
                          </span>
                          {client.cnpj && client.cnpj.trim() !== '' && (
                            <span className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1.5">
                              <FileText className="w-3 h-3" /> {client.cnpj}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`font-bold px-3 py-1 shrink-0 ${curva.colorClass} shadow-sm`}
                        >
                          {curva.label}
                        </Badge>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="px-6 py-3 border-t border-slate-200 bg-white shrink-0 mt-auto flex justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Fechar Detalhes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
