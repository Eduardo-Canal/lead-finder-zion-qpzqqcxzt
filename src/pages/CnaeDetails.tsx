import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, Filter, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CURVAS = ['A+', 'A', 'B', 'C', 'Não classificado']
const MOCK_COMPANIES = Array.from({ length: 84 }).map((_, i) => ({
  id: i + 1,
  razao_social: `Empresa Fictícia de Comércio e Serviços ${i + 1} LTDA`,
  cnpj: `${Math.floor(10 + (i % 90))}.${Math.floor(100 + ((i * 7) % 899))}.${Math.floor(100 + ((i * 13) % 899))}/0001-${Math.floor(10 + (i % 89))}`,
  curva_abc: CURVAS[i % CURVAS.length],
}))

export default function CnaeDetails() {
  const { cnae_code } = useParams()
  const navigate = useNavigate()
  const [filterAbc, setFilterAbc] = useState('Todos')

  const decodedCnae = cnae_code ? decodeURIComponent(cnae_code) : 'CNAE Desconhecido'

  const filteredCompanies = useMemo(() => {
    if (filterAbc === 'Todos') return MOCK_COMPANIES
    return MOCK_COMPANIES.filter((c) => c.curva_abc === filterAbc)
  }, [filterAbc])

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
          <h3 className="text-lg font-semibold text-foreground">
            Empresas na Carteira ({filteredCompanies.length})
          </h3>
          <div className="relative w-full md:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={filterAbc}
              onChange={(e) => setFilterAbc(e.target.value)}
              className="w-full md:w-[200px] pl-9 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
            >
              <option value="Todos">Todas as Curvas</option>
              <option value="A+">Curva A+</option>
              <option value="A">Curva A</option>
              <option value="B">Curva B</option>
              <option value="C">Curva C</option>
              <option value="Não classificado">Não classificado</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
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
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="p-3 font-medium text-foreground">{company.razao_social}</td>
                  <td className="p-3 text-muted-foreground">{company.cnpj}</td>
                  <td className="p-3 text-center">
                    <Badge className={cn('font-medium', getBadgeColor(company.curva_abc))}>
                      {company.curva_abc}
                    </Badge>
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
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Nenhuma empresa encontrada para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
