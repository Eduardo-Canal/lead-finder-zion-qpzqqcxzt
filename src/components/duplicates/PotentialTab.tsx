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
import { toast } from 'sonner'
import { Eye, GitMerge, Ban, TrendingUp, CheckCircle, Search } from 'lucide-react'
import { CompareModal } from '@/components/duplicates/CompareModal'
import { SuggestMergeModal } from '@/components/duplicates/SuggestMergeModal'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { EmptyState, LoadingTableRows } from '@/components/Notifications/StateBlocks'
import { designTokens } from '@/constants/designTokens'
import { cn } from '@/lib/utils'

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
      toast.error('Erro ao buscar duplicatas potenciais: ' + err.message)
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
      toast.success('Sugestão ignorada e registrada no histórico.')
      setPotentials((prev) =>
        prev.filter(
          (p) => p.empresa1_id !== item.empresa1_id || p.empresa2_id !== item.empresa2_id,
        ),
      )
      fetchStats()
    } catch (e: any) {
      toast.error('Erro ao ignorar: ' + e.message)
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
          <Card className="shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Potenciais Encontradas
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800">{potentials.length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Resolução</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {resolutionRate.toFixed(1)}%
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm transition-all hover:shadow-md lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Tendência de Duplicatas (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                detectadas: { label: 'Detectadas', color: 'hsl(var(--destructive))' },
                resolvidas: { label: 'Resolvidas', color: 'hsl(var(--primary))' },
              }}
              className="h-[160px] w-full"
            >
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  }
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="detectadas"
                  stroke="var(--color-detectadas)"
                  fill="var(--color-detectadas)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="resolvidas"
                  stroke="var(--color-resolvidas)"
                  fill="var(--color-resolvidas)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">Varredura de Potenciais</CardTitle>
              <CardDescription>
                O algoritmo Fuzzy Matching analisa sua base inteira para identificar empresas com
                nomes muito semelhantes.
              </CardDescription>
            </div>
            <Button
              onClick={fetchPotentials}
              disabled={loading}
              size="sm"
              className={cn(designTokens.animations.buttonClick, 'gap-2')}
            >
              <Search className="h-4 w-4" />
              Varrer Base Novamente
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Score Mínimo (%)
              </label>
              <Input
                type="number"
                min="50"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tipo de Similaridade
              </label>
              <Select value={similarityType} onValueChange={setSimilarityType}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Razão Social (Fuzzy)">Razão Social (Fuzzy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data Inclusão (Bitrix)
              </label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={designTokens.layout.tableContainer}>
        <Table>
          <TableHeader className="bg-slate-50">
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
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    title="Nenhuma potencial duplicidade"
                    description="Não foram detectadas empresas com nomes similares baseados nos seus filtros atuais."
                    className="py-12"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, i) => (
                <TableRow key={i} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    <div
                      className="font-medium text-slate-800 line-clamp-1"
                      title={item.empresa1?.company_name}
                    >
                      {item.empresa1?.company_name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
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
                    <div className="text-xs text-muted-foreground font-mono">
                      {item.empresa2?.cnpj || 'Sem CNPJ'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        item.similarity_score >= 90
                          ? 'bg-emerald-500'
                          : item.similarity_score >= 80
                            ? 'bg-amber-500'
                            : 'bg-orange-500'
                      }
                    >
                      {Number(item.similarity_score).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-slate-100 font-normal text-[10px] uppercase"
                    >
                      {item.tipo_similaridade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-50 text-accent"
                        onClick={() => handleReview(item)}
                        title="Revisar Manualmente"
                        aria-label="Revisar Manualmente"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-emerald-50 text-emerald-600"
                        onClick={() => setSuggestRecord(item)}
                        title="Sugerir Merge"
                        aria-label="Sugerir Merge"
                      >
                        <GitMerge className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50 text-destructive"
                        onClick={() => handleIgnore(item)}
                        title="Ignorar"
                        aria-label="Ignorar Potencial Duplicidade"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
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
