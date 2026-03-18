import { QuickFilters } from '@/components/dashboard/QuickFilters'
import { ResultsTable } from '@/components/dashboard/ResultsTable'
import useLeadStore from '@/stores/useLeadStore'

export default function Index() {
  const { filteredLeads } = useLeadStore()

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Painel de Prospecção</h2>
        <p className="text-muted-foreground mt-1">
          Encontrados {filteredLeads.length} leads com base nos filtros atuais.
        </p>
      </div>

      <QuickFilters />
      <ResultsTable />
    </div>
  )
}
