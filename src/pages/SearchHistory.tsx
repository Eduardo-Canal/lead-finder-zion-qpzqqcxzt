import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import useLeadStore from '@/stores/useLeadStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { EmptyState, LoadingTableRows } from '@/components/Notifications/StateBlocks'
import {
  History,
  Search,
  MapPin,
  Building2,
  Calendar,
  Loader2,
  Play,
  Briefcase,
  Filter,
} from 'lucide-react'

export default function SearchHistory() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasResultsFilter, setHasResultsFilter] = useState('all')
  const [repeatingId, setRepeatingId] = useState<string | null>(null)

  const { user } = useAuthStore()
  const { setAllFilters, searchLeads } = useLeadStore()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.user_id) return

      try {
        const { data, error } = await supabase
          .from('search_history')
          .select('*')
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setHistory(data || [])
      } catch (err) {
        console.error('Erro ao carregar histórico:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  const parseArray = (str: string | null, defaultValue: string = 'Todos') => {
    if (!str || str === defaultValue) return []
    return str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const handleRepeatSearch = async (record: any) => {
    setRepeatingId(record.id)

    const cnaes = parseArray(record.cnae, '')
    const ufs = parseArray(record.estado, 'Todos')
    const porte = parseArray(record.porte, 'Todos')
    const municipio = record.cidade === 'Todas' ? '' : record.cidade || ''

    setAllFilters({
      cnaes,
      ufs,
      porte,
      municipio,
      search: '',
      capitalMinimo: '',
      situacao: 'ATIVA',
      contactStatus: 'Todos',
    })

    // Simulate small delay for UI feedback
    await new Promise((resolve) => setTimeout(resolve, 600))
    navigate('/prospeccao')

    setTimeout(() => {
      searchLeads(1)
      setRepeatingId(null)
    }, 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const filteredHistory = history.filter((record) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      (record.cnae && record.cnae.toLowerCase().includes(searchLower)) ||
      (record.cidade && record.cidade.toLowerCase().includes(searchLower)) ||
      (record.estado && record.estado.toLowerCase().includes(searchLower))

    if (!matchesSearch) return false

    if (hasResultsFilter === 'with_results') return (record.total_results || 0) > 0
    if (hasResultsFilter === 'no_results') return (record.total_results || 0) === 0

    return true
  })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-6 w-6 text-primary" />
            </div>
            Meu Histórico
          </h1>
          <p className="text-muted-foreground mt-2">
            Consulte suas prospecções anteriores e refaça buscas com um clique.
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                <Filter className="h-5 w-5 text-slate-500" />
                Suas Pesquisas
              </CardTitle>
              <CardDescription>
                Mostrando as suas últimas 50 pesquisas na plataforma.
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar histórico..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={hasResultsFilter} onValueChange={setHasResultsFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white">
                  <SelectValue placeholder="Resultados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os resultados</SelectItem>
                  <SelectItem value="with_results">Com leads</SelectItem>
                  <SelectItem value="no_results">Sem resultados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[180px]">Data e Hora</TableHead>
                <TableHead>Filtros Utilizados</TableHead>
                <TableHead className="w-[120px] text-center">Resultados</TableHead>
                <TableHead className="w-[140px] text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingTableRows columns={4} rows={5} />
              ) : filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64">
                    <EmptyState
                      icon={History}
                      title={
                        history.length === 0
                          ? 'Nenhum histórico encontrado'
                          : 'Nenhum resultado para os filtros'
                      }
                      description={
                        history.length === 0
                          ? 'Suas pesquisas aparecerão aqui assim que você buscar por leads.'
                          : 'Tente ajustar os termos de busca para encontrar o que procura.'
                      }
                      actionLabel={history.length === 0 ? 'Ir para Prospecção' : 'Limpar Filtros'}
                      onAction={
                        history.length === 0
                          ? () => navigate('/prospeccao')
                          : () => {
                              setSearchTerm('')
                              setHasResultsFilter('all')
                            }
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((record) => {
                  const [datePart, timePart] = formatDate(record.created_at).split(', ')
                  return (
                    <TableRow
                      key={record.id}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      <TableCell className="align-top py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-sm font-medium">{datePart}</span>
                        </div>
                        <div className="text-xs text-slate-500 ml-6 mt-0.5">{timePart}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-start gap-2">
                            <Briefcase className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span
                              className="text-sm font-medium text-slate-900 line-clamp-2"
                              title={record.cnae}
                            >
                              {record.cnae || 'Todos os CNAEs'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-6">
                            <Badge
                              variant="outline"
                              className="bg-white text-slate-600 gap-1.5 font-normal text-xs border-slate-200"
                            >
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {record.cidade !== 'Todas' && record.cidade
                                ? record.cidade
                                : 'Qualquer cidade'}
                              {record.estado !== 'Todos' && record.estado
                                ? ` - ${record.estado}`
                                : ''}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-white text-slate-600 gap-1.5 font-normal text-xs border-slate-200"
                            >
                              <Building2 className="h-3 w-3 text-slate-400" />
                              {record.porte !== 'Todos' && record.porte
                                ? record.porte
                                : 'Qualquer porte'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-top py-4">
                        <Badge
                          variant="secondary"
                          className={
                            record.total_results && record.total_results > 0
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-none'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 shadow-none'
                          }
                        >
                          {record.total_results || 0} leads
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right align-top py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 transition-all duration-200 group-hover:border-primary/30 group-hover:text-primary group-hover:bg-primary/5 shadow-sm"
                          onClick={() => handleRepeatSearch(record)}
                          disabled={repeatingId === record.id}
                        >
                          {repeatingId === record.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Buscando...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current opacity-70" />
                              <span>Repetir</span>
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
