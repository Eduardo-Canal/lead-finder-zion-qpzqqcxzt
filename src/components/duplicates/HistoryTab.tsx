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
import { Eye, RotateCcw } from 'lucide-react'
import { HistoryDetailsModal } from './HistoryDetailsModal'
import { UndoMergeModal } from './UndoMergeModal'
import { designTokens } from '@/constants/designTokens'
import { EmptyState, LoadingTableRows } from '@/components/Notifications/StateBlocks'

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
      <Card className="shadow-sm transition-all duration-300 hover:shadow-md">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base font-semibold">Histórico de Merges</CardTitle>
          <CardDescription>
            Acompanhe e audite todas as mesclagens realizadas na base.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data
              </label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Usuário
              </label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="bg-white">
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white">
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
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Empresa Original (Absorvida)</TableHead>
              <TableHead>Empresa Principal (Merged)</TableHead>
              <TableHead>Quem Fez</TableHead>
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
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    title="Histórico vazio"
                    description="Nenhum merge foi realizado ainda ou corresponde aos filtros."
                    className="py-12"
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
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-medium text-slate-800">
                    {item.original_company_name || `ID: ${item.original_company_id}`}
                  </TableCell>
                  <TableCell className="font-medium text-accent">
                    {item.merged_to_company_name || `ID: ${item.merged_to_company_id}`}
                  </TableCell>
                  <TableCell>{profiles[item.merged_by] || 'Sistema'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.status === 'reversed'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }
                    >
                      {item.status === 'reversed' ? 'Revertido' : 'Concluído'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-accent hover:bg-blue-50"
                        onClick={() => setDetailsRecord(item)}
                        title="Ver Detalhes"
                        aria-label="Ver Detalhes do Merge"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.status !== 'reversed' && item.reversible !== false && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          onClick={() => setUndoRecord(item)}
                          title="Desfazer Merge"
                          aria-label="Desfazer Merge"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
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
