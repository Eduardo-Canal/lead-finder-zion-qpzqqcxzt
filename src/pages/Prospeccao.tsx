import { AdvancedFilters } from '@/components/dashboard/AdvancedFilters'
import { QuickFilters } from '@/components/dashboard/QuickFilters'
import { ResultsTable } from '@/components/dashboard/ResultsTable'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import useLeadStore from '@/stores/useLeadStore'

export default function Prospeccao() {
  const { searchLeads, filters, isSearching } = useLeadStore()
  const isCnaeEmpty = !filters.cnaes || filters.cnaes.length === 0

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Prospecção de Leads</h2>
        <p className="text-muted-foreground mt-1">
          Busque e filtre novas empresas para adicionar ao seu funil.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0 space-y-4">
          <AdvancedFilters />
          <Button
            className="w-full gap-2"
            onClick={() => searchLeads(1)}
            disabled={isSearching || isCnaeEmpty}
          >
            <Search className="w-4 h-4" />
            Buscar Leads
          </Button>
          {isCnaeEmpty && (
            <p className="text-xs text-destructive text-center font-medium mt-1">
              CNAE é obrigatório para a busca
            </p>
          )}
        </div>
        <div className="flex-1 space-y-6 min-w-0">
          <QuickFilters />
          <ResultsTable />
        </div>
      </div>
    </div>
  )
}
