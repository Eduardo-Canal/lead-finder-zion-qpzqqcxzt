import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, GitMerge, Ban, TrendingUp, CheckCircle, Search, Filter } from 'lucide-react'
import { CompareModal } from '@/components/duplicates/CompareModal'
import { SuggestMergeModal } from '@/components/duplicates/SuggestMergeModal'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { EmptyState, LoadingTableRows } from '@/components/Notifications/StateBlocks'
import { designTokens } from '@/constants/designTokens'
import { SubmitButton } from '@/components/Forms/FormStandards'
import { notify } from '@/components/Notifications/NotificationSystem'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function PotentialTab() {
  const [potentials, setPotentials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [resolutionRate, setResolutionRate] = useState(0)

  const [minScore, setMinScore] = useState('75')
  const [similarityType, setSimilarityType] = useState('Todos')
  const [searchDate, setSearchDate] = useState('')

  const [suggestRecord, setSuggestRecord] = useState<any>(null)
  const [compareRecord, setCompareRecord] = useState<any>(null)

  const fetchStats = async () => {
    try {
      const { data: dups } = await supabase.from('company_duplicates').select('created_at, status')
      const { data: merges } = await supabase.from('company_merge_history').select('created_at')

      const totalDups = dups?.length || 0
      const resolved =
        dups?.filter((d) => d.status === 'merged' || d.status === 'ignored').length || 0

      setResolutionRate(totalDups > 0 ? (resolved / totalDups) * 100 : 0)

      const last30Days = Array.from({ length: 30 })
        .map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (29 - i))
          return d.toISOString().split('T')[0]
        })
        .reverse()

      const chart = last30Days.reverse().map((date) => {
        const dCount = dups?.filter((d) => d.created_at.startsWith(date)).length || 0
        const mCount = merges?.filter((m) => m.created_at.startsWith(date)).length || 0
        return { date, detectadas: dCount, resolvidas: mCount }
      })
      setChartData(chart)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPotentials = async () => {
    setLoading(true)
    try {
      const scoreParam = Number(minScore) > 0 ? Number(minScore) / 100 : 0.75
      const { data, error } = await supabase.rpc('find_potential_duplicates', {
        min_score: scoreParam,
      })
      if (error) throw error

      if (data && data.length > 0) {
        const ids = Array.from(new Set(data.flatMap((d: any) => [d.empresa1_id, d.empresa2_id])))
        const { data: companies } = await supabase
          .from('bitrix_clients_zion')
          .select('*')
          .in('bitrix_id', ids)

        const compMap = new Map()
        companies?.forEach((c) => compMap.set(c.bitrix_id, c))

        const enriched = data
          .map((d: any) => ({
            ...d,
            empresa1: compMap.get(d.empresa1_id),
            empresa2: compMap.get(d.empresa2_id),
          }))
          .filter((d: any) => d.empresa1 && d.empresa2)

        setPotentials(enriched)
      } else {
        setPotentials([])
      }
    } catch (err: any) {
      notify.error('Erro na varredura', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchPotentials()
  }, [])

  const handleIgnore = async (item: any) => {
    try {
      await supabase.from('company_duplicates').insert({
        original_company_id: item.empresa1_id,
        duplicate_company_id: item.empresa2_id,
        similarity_score: item.similarity_score,
        match_type: 'razao_social_single',
        status: 'ignored',
        notes: 'Ignorado a partir da busca de potenciais (Fuzzy Matching).',
      })
      notify.success('Sugestão ignorada', 'A potencial duplicidade foi removida desta lista.')
      setPotentials((prev) =>
        prev.filter(
          (p) => p.empresa1_id !== item.empresa1_id || p.empresa2_id !== item.empresa2_id,
        ),
      )
      fetchStats()
    } catch (e: any) {
      notify.error('Erro ao ignorar', e.message)
    }
  }

  const handleReview = (item: any) => {
    setCompareRecord({
      original: item.empresa1,
      duplicate: item.empresa2,
      similarity_score: item.similarity_score,
      notes: 'Fuzzy Match - Potencial duplicata identificada por similaridade de nome.',
    })
  }

  const filteredData = potentials.filter((p) => {
    if (similarityType !== 'Todos' && p.tipo_similaridade !== similarityType) return false
    if (searchDate) {
      const d1 = p.empresa1?.created_at?.split('T')[0]
      const d2 = p.empresa2?.created_at?.split('T')[0]
      if (d1 !== searchDate && d2 !== searchDate) return false
    }
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary-100 text-secondary-600 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Potenciais Encontradas
                  </p>
                  <h3 className="text-3xl font-bold text-slate-800">{potentials.length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success-100 text-success-600 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Resolução</p>
                  <h3 className="text-3xl font-bold text-slate-800">
                    {resolutionRate.toFixed(1)}%
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 bg-slate-50/50 border-b">
            <CardTitle className="text-base font-semibold">
              Tendência de Duplicatas (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                detectadas: { label: 'Detectadas', color: designTokens.colors.error[500] },
                resolvidas: { label: 'Resolvidas', color: designTokens.colors.success[500] },
              }}
              className="h-[180px] w-full"
            >
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  }
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  dy={10}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="detectadas"
                  stroke="var(--color-detectadas)"
                  fill="var(--color-detectadas)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="resolvidas"
                  stroke="var(--color-resolvidas)"
                  fill="var(--color-resolvidas)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base font-semibold">Varredura de Potenciais</CardTitle>
                <CardDescription>
                  O algoritmo analisa sua base inteira para identificar nomes muito semelhantes.
                </CardDescription>
              </div>
            </div>
            <SubmitButton
              onClick={fetchPotentials}
              isLoading={loading}
              size="sm"
              className="gap-2"
              loadingText="Varrendo..."
            >
              {!loading && <Search className="h-4 w-4" />}
              {!loading && 'Varrer Base Novamente'}
            </SubmitButton>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Score Mínimo (%)
              </label>
              <Input
                type="number"
                min="50"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tipo de Similaridade
              </label>
              <Select value={similarityType} onValueChange={setSimilarityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Razão Social (Fuzzy)">Razão Social (Fuzzy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data de Inclusão
              </label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={designTokens.layout.tableContainer}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa 1</TableHead>
              <TableHead>Empresa 2</TableHead>
              <TableHead className="text-center">Score (%)</TableHead>
              <TableHead>Tipo de Similaridade</TableHead>
              <TableHead className="text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingTableRows columns={5} rows={5} />
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64">
                  <EmptyState
                    title="Nenhuma potencial duplicidade"
                    description="Não foram detectadas empresas com nomes similares baseados nos seus filtros."
                    actionLabel={
                      similarityType !== 'Todos' || searchDate || minScore !== '75'
                        ? 'Limpar Filtros'
                        : undefined
                    }
                    onAction={() => {
                      setSimilarityType('Todos')
                      setSearchDate('')
                      setMinScore('75')
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div
                      className="font-medium text-slate-800 line-clamp-1"
                      title={item.empresa1?.company_name}
                    >
                      {item.empresa1?.company_name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {item.empresa1?.cnpj || 'Sem CNPJ'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="font-medium text-slate-800 line-clamp-1"
                      title={item.empresa2?.company_name}
                    >
                      {item.empresa2?.company_name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {item.empresa2?.cnpj || 'Sem CNPJ'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        item.similarity_score >= 90
                          ? 'bg-success-500 hover:bg-success-600'
                          : item.similarity_score >= 80
                            ? 'bg-warning-500 hover:bg-warning-600 text-white'
                            : 'bg-primary-500 hover:bg-primary-600'
                      }
                      style={
                        item.similarity_score >= 90
                          ? { backgroundColor: designTokens.colors.success[500], color: '#fff' }
                          : item.similarity_score >= 80
                            ? { backgroundColor: designTokens.colors.warning[500], color: '#fff' }
                            : { backgroundColor: designTokens.colors.primary[500], color: '#fff' }
                      }
                    >
                      {Number(item.similarity_score).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-[10px] uppercase">
                      {item.tipo_similaridade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleReview(item)}>
                            <Eye className="h-4 w-4 text-secondary-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Revisar Manualmente</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSuggestRecord(item)}
                          >
                            <GitMerge className="h-4 w-4 text-success-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sugerir Merge</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleIgnore(item)}>
                            <Ban className="h-4 w-4 text-error-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ignorar</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CompareModal
        isOpen={!!compareRecord}
        onClose={() => setCompareRecord(null)}
        record={compareRecord}
      />
      <SuggestMergeModal
        isOpen={!!suggestRecord}
        onClose={() => setSuggestRecord(null)}
        record={suggestRecord}
        onMerge={() => {
          setPotentials((prev) =>
            prev.filter(
              (p) =>
                p.empresa1_id !== suggestRecord?.empresa1_id ||
                p.empresa2_id !== suggestRecord?.empresa2_id,
            ),
          )
          fetchStats()
        }}
      />
    </div>
  )
}
