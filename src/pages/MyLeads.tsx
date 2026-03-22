import { MyLeadsFilters } from '@/components/my-leads/MyLeadsFilters'
import { MyLeadsTable } from '@/components/my-leads/MyLeadsTable'
import { MyLeadsKanban } from '@/components/my-leads/MyLeadsKanban'
import { MyLeadsExport } from '@/components/my-leads/MyLeadsExport'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useMyLeadsStore from '@/stores/useMyLeadsStore'
import { Kanban, List } from 'lucide-react'

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

      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-6 bg-white p-1 rounded-lg border shadow-sm w-fit">
          <TabsList className="bg-transparent border-none h-auto p-0">
            <TabsTrigger
              value="list"
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none px-4 py-2"
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </TabsTrigger>
            <TabsTrigger
              value="kanban"
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none px-4 py-2"
            >
              <Kanban className="w-4 h-4 mr-2" />
              Funil de Vendas
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="mt-0 space-y-6 focus-visible:outline-none">
          <MyLeadsFilters />
          <MyLeadsTable />
        </TabsContent>

        <TabsContent value="kanban" className="mt-0 focus-visible:outline-none">
          <MyLeadsKanban />
        </TabsContent>
      </Tabs>
    </div>
  )
}
