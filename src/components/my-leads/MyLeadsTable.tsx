import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Calendar, User, DollarSign, Sparkles } from 'lucide-react'
import { Dialog as ModalDialog, DialogContent as ModalDialogContent, DialogTitle as ModalDialogTitle } from '@/components/ui/dialog'
import useMyLeadsStore, { LeadSalvo } from '@/stores/useMyLeadsStore'
import { FilteredLead } from '@/stores/useLeadStore'
import { LeadDetailsModal } from '@/components/dashboard/LeadDetailsModal'
import useAuthStore from '@/stores/useAuthStore'
import { cn, isValidCNPJ } from '@/lib/utils'
import { toast } from 'sonner'
import { InteractionHistoryModal } from './InteractionHistoryModal'
import { OpportunityModal } from './OpportunityModal'
import { EmptyState } from '@/components/Notifications/StateBlocks'
import { designTokens } from '@/constants/designTokens'

const statusColors: Record<string, string> = {
  'Não Contatado': 'text-slate-600 bg-slate-100',
  'Em Prospecção': 'text-amber-700 bg-amber-100',
  'Proposta Enviada': 'text-blue-700 bg-blue-100',
  'Sem Interesse': 'text-rose-700 bg-rose-100',
  Convertido: 'text-emerald-700 bg-emerald-100',
}

export function MyLeadsTable() {
  const { filteredLeads, opportunities, updateStatus, updateDecisor, setFilter } = useMyLeadsStore()
  const { hasPermission } = useAuthStore()
  const canEditStatus = hasPermission('Editar Status de Contato')

  const [editingInteractionsLead, setEditingInteractionsLead] = useState<LeadSalvo | null>(null)
  const [editingDecisor, setEditingDecisor] = useState<LeadSalvo | null>(null)
  const [oppModalLead, setOppModalLead] = useState<LeadSalvo | null>(null)
  const [approachLead, setApproachLead] = useState<FilteredLead | null>(null)
  const [decisorForm, setDecisorForm] = useState({ nome: '', telefone: '', email: '' })

  const openApproachModal = (lead: LeadSalvo) => {
    const asFiltered: FilteredLead = {
      id: lead.id,
      razao_social: lead.razao_social,
      cnpj: lead.cnpj || '',
      cnae_principal: lead.cnae_principal || '',
      cnaes_secundarios: lead.cnaes_secundarios || [],
      municipio: lead.municipio || '',
      uf: lead.uf || '',
      porte: '',
      situacao: lead.situacao_cadastral || '',
      capital_social: lead.capital_social || 0,
      data_abertura: lead.data_abertura || '',
      email: lead.email || '',
      telefone: lead.telefone || '',
      socios: lead.socios ? (typeof lead.socios === 'string' ? JSON.parse(lead.socios) : lead.socios) : [],
      contatado: true,
    }
    setApproachLead(asFiltered)
  }

  const openDecisorModal = (lead: LeadSalvo) => {
    setEditingDecisor(lead)
    setDecisorForm({
      nome: lead.decisor_nome || '',
      telefone: lead.decisor_telefone || '',
      email: lead.decisor_email || '',
    })
  }

  const handleSaveDecisor = async () => {
    if (editingDecisor) {
      try {
        await updateDecisor(
          editingDecisor.id,
          decisorForm.nome,
          decisorForm.telefone,
          decisorForm.email,
        )
        setEditingDecisor(null)
        toast.success('Informações do decisor salvas com sucesso!')
      } catch (err) {
        toast.error('Erro ao salvar as informações do decisor.')
      }
    }
  }

  return (
    <>
      <div className={cn(designTokens.layout.tableContainer, 'overflow-x-auto')}>
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center w-[160px] sticky left-0 z-10 bg-muted/50 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.08)]">Ações</TableHead>
              <TableHead className="min-w-[200px]">Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Município/UF</TableHead>
              <TableHead>Executivo Responsável</TableHead>
              <TableHead className="w-[150px]">Status de Contato</TableHead>
              <TableHead>Último Contato</TableHead>
              <TableHead>Nome do Decisor</TableHead>
              <TableHead>Telefone do Decisor</TableHead>
              <TableHead>E-mail do Decisor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  <EmptyState
                    title="Nenhum lead encontrado"
                    description="Tente ajustar seus filtros de busca ou adicione novos leads na Prospecção."
                    className="py-16"
                    actionLabel="Limpar Filtros"
                    onAction={() => {
                      setFilter('search', '')
                      setFilter('municipio', 'Todos')
                      setFilter('status', 'Todos')
                      setFilter('executivo', 'Todos')
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => {
                const hasOpp = opportunities.some((o) => o.lead_id === lead.id)

                return (
                  <TableRow
                    key={lead.id}
                    className="animate-fade-in group transition-colors hover:bg-slate-50/50"
                  >
                    <TableCell className="text-center sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openApproachModal(lead)}
                          className="h-8 w-8 hover:scale-105 transition-transform text-violet-600 bg-violet-50 hover:bg-violet-100"
                          title="Abordagem com IA"
                          aria-label="Abordagem com IA"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setOppModalLead(lead)}
                          className={cn(
                            'h-8 w-8 hover:scale-105 transition-transform',
                            hasOpp ? 'text-emerald-600 bg-emerald-50' : 'text-muted-foreground',
                          )}
                          title={hasOpp ? 'Editar Oportunidade' : 'Criar Oportunidade'}
                          aria-label={hasOpp ? 'Editar Oportunidade' : 'Criar Oportunidade'}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDecisorModal(lead)}
                          className={cn(
                            'h-8 w-8 hover:scale-105 transition-transform',
                            lead.decisor_nome || lead.decisor_telefone || lead.decisor_email
                              ? 'text-primary bg-primary/10'
                              : 'text-muted-foreground',
                          )}
                          title="Editar Decisor"
                          aria-label="Editar Decisor"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingInteractionsLead(lead)}
                          className={cn(
                            'h-8 w-8 hover:scale-105 transition-transform',
                            lead.historico_interacoes && lead.historico_interacoes.length > 0
                              ? 'text-accent bg-accent/10'
                              : 'text-muted-foreground',
                          )}
                          title="Histórico de Atividades"
                          aria-label="Histórico de Atividades"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {lead.razao_social}
                      <div className="text-xs text-muted-foreground font-normal mt-0.5">
                        CNAE: {lead.cnae_principal}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span>{lead.cnpj}</span>
                        {!isValidCNPJ(lead.cnpj || '') && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                            Dados Inválidos
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.municipio} - {lead.uf}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{lead.executivo_nome}</TableCell>
                    <TableCell>
                      <Select
                        value={lead.status_contato}
                        disabled={!canEditStatus}
                        onValueChange={(v: string) => {
                          updateStatus(lead.id, v)
                          toast.success('Status atualizado')
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-8 text-xs font-medium border-0 ring-1 ring-inset ring-black/5 focus:ring-2 focus:ring-primary transition-all',
                            statusColors[lead.status_contato] || statusColors['Não Contatado'],
                          )}
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Não Contatado">Não Contatado</SelectItem>
                          <SelectItem value="Em Prospecção">Em Prospecção</SelectItem>
                          <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                          <SelectItem value="Sem Interesse">Sem Interesse</SelectItem>
                          <SelectItem value="Convertido">Convertido</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {lead.ultima_data_contato || '-'}
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-sm max-w-[150px] truncate"
                      title={lead.decisor_nome || ''}
                    >
                      {lead.decisor_nome || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {lead.decisor_telefone || '-'}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-sm max-w-[150px] truncate"
                      title={lead.decisor_email || ''}
                    >
                      {lead.decisor_email || '-'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editingInteractionsLead && (
        <InteractionHistoryModal
          lead={editingInteractionsLead}
          onClose={() => setEditingInteractionsLead(null)}
        />
      )}

      {oppModalLead && (
        <OpportunityModal
          lead={oppModalLead}
          opportunity={opportunities.find((o) => o.lead_id === oppModalLead?.id) || null}
          onClose={() => setOppModalLead(null)}
        />
      )}

      <ModalDialog open={!!approachLead} onOpenChange={(open) => !open && setApproachLead(null)}>
        <ModalDialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col border-none shadow-2xl bg-transparent max-h-[95vh] md:max-h-[90vh]">
          <ModalDialogTitle className="sr-only">Abordagem Comercial</ModalDialogTitle>
          {approachLead && (
            <LeadDetailsModal lead={approachLead} onClose={() => setApproachLead(null)} initialTab="abordagem" forceIsSaved />
          )}
        </ModalDialogContent>
      </ModalDialog>

      <Dialog open={!!editingDecisor} onOpenChange={(open) => !open && setEditingDecisor(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Informações do Decisor</DialogTitle>
            <DialogDescription>
              Atualize os dados de contato do decisor para{' '}
              <strong className="text-foreground">{editingDecisor?.razao_social}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editNome">Nome do Decisor</Label>
              <Input
                id="editNome"
                value={decisorForm.nome}
                onChange={(e) => setDecisorForm((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTel">Telefone do Decisor</Label>
              <Input
                id="editTel"
                value={decisorForm.telefone}
                onChange={(e) => setDecisorForm((p) => ({ ...p, telefone: e.target.value }))}
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">E-mail do Decisor</Label>
              <Input
                id="editEmail"
                type="email"
                value={decisorForm.email}
                onChange={(e) => setDecisorForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Ex: joao@empresa.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDecisor(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDecisor}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
