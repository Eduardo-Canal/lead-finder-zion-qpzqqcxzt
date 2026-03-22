import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Loader2, Download, ShieldAlert, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ACTIONS = ['create', 'update', 'delete', 'login', 'export']
const ENTITIES = ['lead', 'user', 'search', 'config', 'profile']

const getActionBadge = (action: string) => {
  switch (action.toLowerCase()) {
    case 'create':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Create</Badge>
    case 'update':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Update</Badge>
    case 'delete':
      return <Badge variant="destructive">Delete</Badge>
    case 'login':
      return <Badge className="bg-purple-500 hover:bg-purple-600">Login</Badge>
    case 'export':
      return <Badge className="bg-amber-500 text-white hover:bg-amber-600">Export</Badge>
    default:
      return (
        <Badge variant="outline" className="uppercase text-[10px]">
          {action}
        </Badge>
      )
  }
}

export default function AuditLogs() {
  const { user, hasPermission } = useAuthStore()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  const [logs, setLogs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [selectedUser, setSelectedUser] = useState('Todos')
  const [selectedAction, setSelectedAction] = useState('Todas')
  const [selectedEntity, setSelectedEntity] = useState('Todas')
  const [date, setDate] = useState<Date | undefined>()

  const pageSize = 50

  useEffect(() => {
    if (isAdmin) {
      supabase
        .from('profiles')
        .select('user_id, nome')
        .then(({ data }) => {
          if (data) setUsers(data)
        })
    }
  }, [isAdmin])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('audit_logs').select('*', { count: 'exact' })

    if (selectedUser !== 'Todos') query = query.eq('user_id', selectedUser)
    if (selectedAction !== 'Todas') query = query.eq('action', selectedAction)
    if (selectedEntity !== 'Todas') query = query.eq('entity_type', selectedEntity)
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
    }

    query = query.order('created_at', { ascending: false })
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, count, error } = await query

    if (error) {
      toast.error('Erro ao buscar logs de auditoria.')
      console.error(error)
    } else {
      setLogs(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [selectedUser, selectedAction, selectedEntity, date, page, pageSize])

  useEffect(() => {
    if (isAdmin) {
      fetchLogs()
    }
  }, [fetchLogs, isAdmin])

  const handleExport = async () => {
    setExporting(true)
    try {
      let query = supabase.from('audit_logs').select('*')

      if (selectedUser !== 'Todos') query = query.eq('user_id', selectedUser)
      if (selectedAction !== 'Todas') query = query.eq('action', selectedAction)
      if (selectedEntity !== 'Todas') query = query.eq('entity_type', selectedEntity)
      if (date) {
        const start = new Date(date)
        start.setHours(0, 0, 0, 0)
        const end = new Date(date)
        end.setHours(23, 59, 59, 999)
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      }

      query = query.order('created_at', { ascending: false }).limit(5000)

      const { data, error } = await query
      if (error) throw error

      const userMap = users.reduce(
        (acc, u) => ({ ...acc, [u.user_id]: u.nome }),
        {} as Record<string, string>,
      )

      const csvRows = [
        ['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'Detalhes'],
        ...(data || []).map((log) => [
          new Date(log.created_at).toLocaleString('pt-BR'),
          userMap[log.user_id] || log.user_id || 'Sistema',
          log.action,
          log.entity_type,
          JSON.stringify(log.changes || {}).replace(/"/g, '""'),
        ]),
      ]

      const csvContent = '\uFEFF' + csvRows.map((row) => `"${row.join('","')}"`).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `auditoria_${new Date().getTime()}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Log exportado com sucesso!')
    } catch (err) {
      toast.error('Erro ao exportar log.')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const userMap = useMemo(() => {
    return users.reduce((acc, u) => ({ ...acc, [u.user_id]: u.nome }), {} as Record<string, string>)
  }, [users])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <ShieldAlert className="h-12 w-12 text-destructive opacity-80" />
        <h2 className="text-2xl font-bold text-destructive">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Esta área é exclusiva para administradores. Você não tem permissão para acessar os Logs de
          Auditoria.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0066CC] flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Auditoria do Sistema
          </h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe o histórico de ações e modificações realizadas pelos usuários.
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting}
          variant="outline"
          className="gap-2 bg-white shrink-0"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar Log (CSV)
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base font-semibold">Filtros de Pesquisa</CardTitle>
          <CardDescription>Refine a busca para encontrar registros específicos.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Usuário
              </label>
              <Select
                value={selectedUser}
                onValueChange={(u) => {
                  setSelectedUser(u)
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Usuários</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id || 'unknown'}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ação
              </label>
              <Select
                value={selectedAction}
                onValueChange={(a) => {
                  setSelectedAction(a)
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as Ações</SelectItem>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a} className="uppercase">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Entidade
              </label>
              <Select
                value={selectedEntity}
                onValueChange={(e) => {
                  setSelectedEntity(e)
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as Entidades</SelectItem>
                  {ENTITIES.map((e) => (
                    <SelectItem key={e} value={e} className="capitalize">
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal bg-white',
                      !date && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? date.toLocaleDateString('pt-BR') : <span>Qualquer data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d)
                      setPage(1)
                    }}
                    initialFocus
                  />
                  {date && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        className="w-full text-xs"
                        onClick={() => {
                          setDate(undefined)
                          setPage(1)
                        }}
                      >
                        Limpar Filtro de Data
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm flex flex-col">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[180px]">Data/Hora</TableHead>
                <TableHead className="w-[200px]">Usuário</TableHead>
                <TableHead className="w-[120px]">Ação</TableHead>
                <TableHead className="w-[120px]">Entidade</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      Carregando logs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum registro encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {userMap[log.user_id] || log.user_id || 'Sistema'}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-slate-100 uppercase text-[10px] tracking-wider text-slate-600"
                      >
                        {log.entity_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div
                        className="text-xs font-mono truncate text-muted-foreground bg-slate-50 p-1.5 rounded border border-slate-100"
                        title={JSON.stringify(log.changes || {})}
                      >
                        {JSON.stringify(log.changes || {})}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && totalPages > 1 && (
            <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
              <div className="text-sm text-muted-foreground hidden sm:block">
                Mostrando <span className="font-medium">{(page - 1) * pageSize + 1}</span> a{' '}
                <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> de{' '}
                <span className="font-medium">{totalCount}</span> registros
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={(e) => {
                        e.preventDefault()
                        if (page > 1) setPage((p) => p - 1)
                      }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-sm px-4 font-medium">
                      Página {page} de {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => {
                        e.preventDefault()
                        if (page < totalPages) setPage((p) => p + 1)
                      }}
                      className={
                        page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
