import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, Filter, Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

const getCurvaAbcLabel = (code: string | null) => {
  switch (code) {
    case '7592':
      return 'A+'
    case '7594':
      return 'A'
    case '7596':
      return 'B'
    case '7598':
      return 'C'
    default:
      return 'N/A'
  }
}

const getBadgeColor = (curva: string) => {
  switch (curva) {
    case 'A+':
      return 'bg-emerald-700 hover:bg-emerald-800 text-white border-transparent'
    case 'A':
      return 'bg-green-500 hover:bg-green-600 text-white border-transparent'
    case 'B':
      return 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent'
    case 'C':
      return 'bg-red-500 hover:bg-red-600 text-white border-transparent'
    default:
      return 'bg-gray-500 hover:bg-gray-600 text-white border-transparent'
  }
}

export default function CnaeDetails() {
  const { cnae_code } = useParams()
  const navigate = useNavigate()
  const [filterAbc, setFilterAbc] = useState('Todos')
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const decodedCnae = cnae_code ? decodeURIComponent(cnae_code) : 'CNAE Desconhecido'

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!cnae_code) return
      setLoading(true)

      const { data, error } = await supabase
        .from('bitrix_clients_zion')
        .select('*')
        .eq('cnae_principal', decodedCnae)

      if (error) {
        toast.error('Erro ao buscar empresas deste CNAE')
        console.error(error)
      } else {
        setCompanies(data || [])
      }
      setLoading(false)
    }

    fetchCompanies()
  }, [decodedCnae, cnae_code])

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (filterAbc === 'Todos') return true
      return getCurvaAbcLabel(c.curva_abc) === filterAbc
    })
  }, [companies, filterAbc])

  return (
    <div className="p-6 w-full mx-auto space-y-6 flex flex-col animate-fade-in-up pb-20">
      <div className="flex items-center gap-4 shrink-0">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            Detalhes do CNAE
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {decodedCnae}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow border p-6 flex flex-col w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Empresas na Carteira
            {!loading && <Badge variant="secondary">{filteredCompanies.length}</Badge>}
          </h3>
          <div className="relative w-full md:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={filterAbc}
              onChange={(e) => setFilterAbc(e.target.value)}
              className="w-full md:w-[200px] pl-9 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              disabled={loading}
            >
              <option value="Todos">Todas as Curvas</option>
              <option value="A+">Curva A+</option>
              <option value="A">Curva A</option>
              <option value="B">Curva B</option>
              <option value="C">Curva C</option>
              <option value="N/A">Não classificado (N/A)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Carregando empresas...</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 font-semibold text-muted-foreground border-b">Razão Social</th>
                  <th className="p-3 font-semibold text-muted-foreground border-b">CNPJ</th>
                  <th className="p-3 font-semibold text-muted-foreground border-b text-center">
                    Curva ABC
                  </th>
                  <th className="p-3 font-semibold text-muted-foreground border-b text-center w-[80px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCompanies.map((company) => {
                  const label = getCurvaAbcLabel(company.curva_abc)
                  return (
                    <tr key={company.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="p-3 font-medium text-foreground">
                        {company.company_name || 'Empresa Sem Nome'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {company.cnpj || 'Não informado'}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={cn('font-medium', getBadgeColor(label))}>{label}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toast.info('Visualização detalhada em breve.')}
                          title="Visualizar"
                          className="h-8 w-8 text-muted-foreground group-hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Nenhuma empresa encontrada para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
