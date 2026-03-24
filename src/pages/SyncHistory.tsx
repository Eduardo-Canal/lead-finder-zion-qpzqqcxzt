import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { RefreshCw, Search, CheckCircle2, XCircle } from 'lucide-react'

export default function SyncHistory() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('leads_bitrix_sync')
        .select(`
          id,
          lead_id,
          company_id,
          deal_id,
          status,
          error_message,
          error_log,
          created_at,
          kanban_id,
          stage_id,
          leads_salvos (
            razao_social,
            cnpj
          )
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'SUCESSO') {
          query = query.in('status', ['success', 'SUCESSO'])
        } else {
          query = query.in('status', ['error', 'ERRO'])
        }
      }

      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00Z`)
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59Z`)
      }

      const { data: result, error } = await query

      if (error) throw error
      setData(result || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Histórico de Sincronizações</h2>
          <p className="text-muted-foreground mt-1">Acompanhe o envio de leads para o Bitrix24.</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="SUCESSO">Sucesso</SelectItem>
                  <SelectItem value="ERRO">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-sm font-medium">Data Final</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>

            <Button onClick={fetchData} className="w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deal ID</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const isSuccess = item.status === 'success' || item.status === 'SUCESSO'
                  const razaoSocial = item.leads_salvos?.razao_social || 'Desconhecido'
                  const errorMsg = item.error_message || item.error_log

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {razaoSocial}
                        {item.leads_salvos?.cnpj && (
                          <span className="block text-xs text-muted-foreground font-normal mt-1">
                            {item.leads_salvos.cnpj}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isSuccess ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Sucesso
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" /> Erro
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.deal_id ? (
                          <Badge variant="outline" className="font-mono bg-muted text-xs">
                            #{item.deal_id}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm" title={errorMsg}>
                        {isSuccess ? (
                          <span className="text-emerald-600 font-medium">
                            Deal criado com sucesso
                          </span>
                        ) : (
                          <span className="text-destructive">
                            {errorMsg || 'Erro desconhecido'}
                          </span>
                        )}
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
