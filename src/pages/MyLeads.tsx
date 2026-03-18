import { MyLeadsFilters } from '@/components/my-leads/MyLeadsFilters'
import { MyLeadsTable } from '@/components/my-leads/MyLeadsTable'
import { MyLeadsExport } from '@/components/my-leads/MyLeadsExport'
import useMyLeadsStore from '@/stores/useMyLeadsStore'

export default function MyLeads() {
  const { filteredLeads } = useMyLeadsStore()

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Meus Leads</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie seus {filteredLeads.length} leads salvos e acompanhe o funil de prospecção.
          </p>
        </div>
        <MyLeadsExport />
      </div>

      <MyLeadsFilters />
      <MyLeadsTable />
    </div>
  )
}
