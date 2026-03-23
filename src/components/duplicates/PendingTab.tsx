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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Eye, GitMerge, Ban, Filter } from 'lucide-react'
import { CompareModal } from '@/components/duplicates/CompareModal'
import { MergeModal } from '@/components/duplicates/MergeModal'
import { EmptyState, LoadingTableRows } from '@/components/Notifications/StateBlocks'
import { designTokens } from '@/constants/designTokens'
import { notify } from '@/components/Notifications/NotificationSystem'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function PendingTab() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [matchType, setMatchType] = useState('Todos')
  const [minScore, setMinScore] = useState('')
  const [searchDate, setSearchDate] = useState('')

  const [compareRecord, setCompareRecord] = useState<any>(null)
  const [mergeRecord, setMergeRecord] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: res, error } = await supabase
        .from('company_duplicates')
        .select(`
          *,
          original:bitrix_clients_zion!company_duplicates_original_company_id_fkey(*),
          duplicate:bitrix_clients_zion!company_duplicates_duplicate_company_id_fkey(*)
        `)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false })

      if (error) throw error
      setData(res || [])
    } catch (err) {
      console.error(err)
      notify.error(
        'Erro ao buscar registros',
        'Não foi possível carregar as duplicidades pendentes.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleIgnore = async (id: string) => {
    try {
      await supabase.from('company_duplicates').update({ status: 'ignored' }).eq('id', id)
      notify.success('Registro ignorado', 'A duplicidade foi marcada como ignorada com sucesso.')
      fetchData()
    } catch (err) {
      notify.error('Erro ao ignorar', 'Ocorreu um erro ao processar sua solicitação.')
    }
  }

  const filteredData = data.filter((d) => {
    if (matchType !== 'Todos' && d.match_type !== matchType) return false
    if (minScore && (d.similarity_score || 0) < Number(minScore)) return false
    if (searchDate) {
      const dDate = new Date(d.created_at).toISOString().split('T')[0]
      if (dDate !== searchDate) return false
    }
    return true
  })

  const getMatchTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      cnpj_exact: 'CNPJ Exato',
      razao_social_single: 'Razão Social (Única)',
      razao_social_multiple: 'Razão Social (Múltiplas)',
    }
    return map[type] || type
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base font-semibold">Filtros de Análise</CardTitle>
              <CardDescription>
                Filtre os registros para priorizar as validações mais críticas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tipo de Correspondência
              </label>
              <Select value={matchType} onValueChange={setMatchType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Tipos</SelectItem>
                  <SelectItem value="cnpj_exact">CNPJ Exato</SelectItem>
                  <SelectItem value="razao_social_single">Razão Social (Única)</SelectItem>
                  <SelectItem value="razao_social_multiple">Razão Social (Múltiplas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Score Mínimo (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 80"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data de Detecção
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
              <TableHead>Empresa Original</TableHead>
              <TableHead>Empresa Duplicada</TableHead>
              <TableHead>Correspondência</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead>Data Detecção</TableHead>
              <TableHead className="text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingTableRows columns={6} rows={5} />
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64">
                  <EmptyState
                    title="Nenhuma duplicidade pendente"
                    description="Sua base de dados está em ordem ou os filtros não retornaram resultados."
                    actionLabel={
                      matchType !== 'Todos' || minScore || searchDate ? 'Limpar Filtros' : undefined
                    }
                    onAction={() => {
                      setMatchType('Todos')
                      setMinScore('')
                      setSearchDate('')
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div
                      className="font-medium text-slate-800 line-clamp-1"
                      title={item.original?.company_name}
                    >
                      {item.original?.company_name || 'Desconhecido'}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {item.original?.cnpj || 'Sem CNPJ'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="font-medium text-slate-800 line-clamp-1"
                      title={item.duplicate?.company_name}
                    >
                      {item.duplicate?.company_name || 'Desconhecido'}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {item.duplicate?.cnpj || 'Sem CNPJ'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-[10px] uppercase">
                      {getMatchTypeLabel(item.match_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        (item.similarity_score || 0) >= 90
                          ? 'bg-success-500 hover:bg-success-600'
                          : (item.similarity_score || 0) >= 75
                            ? 'bg-warning-500 hover:bg-warning-600 text-white'
                            : 'bg-error-500 hover:bg-error-600'
                      }
                      style={
                        (item.similarity_score || 0) >= 90
                          ? { backgroundColor: designTokens.colors.success[500], color: '#fff' }
                          : (item.similarity_score || 0) >= 75
                            ? { backgroundColor: designTokens.colors.warning[500], color: '#fff' }
                            : { backgroundColor: designTokens.colors.error[500], color: '#fff' }
                      }
                    >
                      {Number(item.similarity_score || 0).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCompareRecord(item)}
                          >
                            <Eye className="h-4 w-4 text-secondary-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Visualizar Detalhes</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setMergeRecord(item)}>
                            <GitMerge className="h-4 w-4 text-success-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mesclar Empresas</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleIgnore(item.id)}>
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
      <MergeModal
        isOpen={!!mergeRecord}
        onClose={() => setMergeRecord(null)}
        record={mergeRecord}
        onMerge={fetchData}
      />
    </div>
  )
}
