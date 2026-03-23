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
import { Eye, RotateCcw, History } from 'lucide-react'
import { HistoryDetailsModal } from './HistoryDetailsModal'
import { UndoMergeModal } from './UndoMergeModal'
import { designTokens } from '@/constants/designTokens'
import { EmptyState, LoadingTableRows } from '@/components/Notifications/StateBlocks'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function HistoryTab() {
  const [data, setData] = useState<any[]>([])
  const [profiles, setProfiles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const [searchDate, setSearchDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [userFilter, setUserFilter] = useState('Todos')

  const [detailsRecord, setDetailsRecord] = useState<any>(null)
  const [undoRecord, setUndoRecord] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ data: historyRes }, { data: profilesRes }] = await Promise.all([
        supabase
          .from('company_merge_history')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, nome'),
      ])

      const profilesMap: Record<string, string> = {}
      profilesRes?.forEach((p) => {
        if (p.user_id) profilesMap[p.user_id] = p.nome
      })
      setProfiles(profilesMap)
      setData(historyRes || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = data.filter((d) => {
    if (statusFilter !== 'Todos' && (d.status || 'merged') !== statusFilter) return false
    if (userFilter !== 'Todos' && profiles[d.merged_by] !== userFilter) return false
    if (searchDate) {
      const dDate = new Date(d.created_at).toISOString().split('T')[0]
      if (dDate !== searchDate) return false
    }
    return true
  })

  const uniqueUsers = Array.from(new Set(data.map((d) => profiles[d.merged_by]).filter(Boolean)))

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader className="pb-4 border-b bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base font-semibold">Histórico de Merges</CardTitle>
              <CardDescription>
                Acompanhe e audite todas as mesclagens realizadas na base.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data do Merge
              </label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Realizado por
              </label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Usuários</SelectItem>
                  {uniqueUsers.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Status</SelectItem>
                  <SelectItem value="merged">Concluído</SelectItem>
                  <SelectItem value="reversed">Revertido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={designTokens.layout.tableContainer}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa Absorvida</TableHead>
              <TableHead>Empresa Principal</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Status</TableHead>
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
                    title="Histórico vazio"
                    description="Nenhum merge foi realizado ainda ou corresponde aos filtros."
                    actionLabel={
                      statusFilter !== 'Todos' || userFilter !== 'Todos' || searchDate
                        ? 'Limpar Filtros'
                        : undefined
                    }
                    onAction={() => {
                      setStatusFilter('Todos')
                      setUserFilter('Todos')
                      setSearchDate('')
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="font-medium text-slate-800 line-clamp-1">
                      {item.original_company_name || `ID: ${item.original_company_id}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-primary-600 line-clamp-1">
                      {item.merged_to_company_name || `ID: ${item.merged_to_company_id}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{profiles[item.merged_by] || 'Sistema'}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.status === 'reversed'
                          ? 'bg-warning-50 text-warning-800 border-warning-200'
                          : 'bg-success-50 text-success-800 border-success-200'
                      }
                    >
                      {item.status === 'reversed' ? 'Revertido' : 'Concluído'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetailsRecord(item)}
                          >
                            <Eye className="h-4 w-4 text-secondary-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver Detalhes</TooltipContent>
                      </Tooltip>

                      {item.status !== 'reversed' && item.reversible !== false && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setUndoRecord(item)}>
                              <RotateCcw className="h-4 w-4 text-warning-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Desfazer Merge</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <HistoryDetailsModal
        isOpen={!!detailsRecord}
        onClose={() => setDetailsRecord(null)}
        record={detailsRecord}
      />
      <UndoMergeModal
        isOpen={!!undoRecord}
        onClose={() => setUndoRecord(null)}
        record={undoRecord}
        onRefresh={fetchData}
      />
    </div>
  )
}
