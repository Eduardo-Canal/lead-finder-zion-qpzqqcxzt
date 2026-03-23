import { useEffect, useState } from 'react'
import { useMyLeadsStore } from '@/stores/useMyLeadsStore'
import { MyLeadsTable } from '@/components/my-leads/MyLeadsTable'
import { MyLeadsKanban } from '@/components/my-leads/MyLeadsKanban'
import { MyLeadsFilters } from '@/components/my-leads/MyLeadsFilters'
import { MyLeadsExport } from '@/components/my-leads/MyLeadsExport'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutList, Trello, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MyLeads() {
  const { leads, isLoading, error, fetchLeads } = useMyLeadsStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cnpj?.includes(searchTerm)

    const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Leads</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe o status de seus leads capturados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchLeads()}
            disabled={isLoading}
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <MyLeadsExport leads={filteredLeads} />
        </div>
      </div>

      <MyLeadsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Erro ao carregar leads: {error}
        </div>
      )}

      <Tabs defaultValue="table" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <LayoutList className="h-4 w-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <Trello className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
          <div className="text-sm text-muted-foreground">
            {filteredLeads.length}{' '}
            {filteredLeads.length === 1 ? 'lead encontrado' : 'leads encontrados'}
          </div>
        </div>

        <TabsContent value="table" className="mt-0">
          <MyLeadsTable leads={filteredLeads} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="kanban" className="mt-0">
          <MyLeadsKanban leads={filteredLeads} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
