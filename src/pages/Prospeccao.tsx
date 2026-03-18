import { QuickFilters } from '@/components/dashboard/QuickFilters'
import { ResultsTable } from '@/components/dashboard/ResultsTable'
import useLeadStore from '@/stores/useLeadStore'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from 'lucide-react'

export default function Prospeccao() {
  const { filteredLeads, searchLeads, isSearching } = useLeadStore()

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Painel de Prospecção</h2>
          <p className="text-muted-foreground mt-1">
            Encontrados {filteredLeads.length} leads com base nos filtros atuais.
          </p>
        </div>
        <Button onClick={() => searchLeads()} disabled={isSearching} className="gap-2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Buscar Leads
        </Button>
      </div>

      <QuickFilters />
      <ResultsTable />
    </div>
  )
}
