import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import useLeadStore from '@/stores/useLeadStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { History, Search, Loader2 } from 'lucide-react'

export default function SearchHistory() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

  const handleRepeatSearch = (record: any) => {
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

    navigate('/prospeccao')
    setTimeout(() => {
      searchLeads(1)
    }, 100)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center text-muted-foreground animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0066CC] flex items-center gap-2">
          <History className="h-6 w-6" />
          Meu Histórico
        </h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe suas últimas pesquisas de prospecção e refaça buscas facilmente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Buscas</CardTitle>
          <CardDescription>Mostrando as suas últimas 50 pesquisas na plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>CNAE(s)</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Porte</TableHead>
                <TableHead className="text-right">Resultados</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Você ainda não realizou nenhuma pesquisa.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((record) => (
                  <TableRow key={record.id} className="group">
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {new Date(record.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={record.cnae}>
                      {record.cnae || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">
                          {record.cidade !== 'Todas' && record.cidade
                            ? record.cidade
                            : 'Qualquer cidade'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {record.estado !== 'Todos' && record.estado
                            ? record.estado
                            : 'Qualquer estado'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs">
                        {record.porte}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {record.total_results || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleRepeatSearch(record)}
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Repetir Busca</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
