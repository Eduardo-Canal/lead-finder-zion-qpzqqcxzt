import { FilterPanel } from '@/components/dashboard/FilterPanel'
import { ResultsTable } from '@/components/dashboard/ResultsTable'
import useLeadStore from '@/stores/useLeadStore'
import { designTokens } from '@/constants/designTokens'

export default function Prospeccao() {
  const { filters } = useLeadStore()

  console.log('Prospeccao - Filters:', filters)
  console.log('Prospeccao - CNAEs:', filters.cnaes)
  console.log('Prospeccao - isSearchDisabled:', filters.cnaes.length === 0)

  const isSearchDisabled = filters.cnaes.length === 0

  return (
    <div className={designTokens.layout.page}>
      {/* Page Header */}
      <div className="flex flex-col space-y-1.5">
        <h2 className="text-3xl font-bold tracking-tight text-accent">Prospecção de Leads</h2>
        <p className="text-muted-foreground text-base max-w-3xl">
          Utilize o painel abaixo para buscar, filtrar e organizar novas empresas. Lembre-se de que
          o CNAE Principal é obrigatório para iniciar a busca na base de dados.
        </p>
      </div>

      {/* Unified Filter Panel */}
      <FilterPanel />

      {/* Warning if no search criteria is valid */}
      {isSearchDisabled && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100 flex items-center justify-center text-sm shadow-sm">
          Por favor, adicione ao menos um <strong>CNAE Principal</strong> no painel de filtros acima
          para começar a prospecção.
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        <ResultsTable />
      </div>
    </div>
  )
}
