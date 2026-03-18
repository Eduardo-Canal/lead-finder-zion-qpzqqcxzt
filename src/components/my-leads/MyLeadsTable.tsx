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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageSquare, Calendar, User } from 'lucide-react'
import useMyLeadsStore, { LeadSalvo } from '@/stores/useMyLeadsStore'
import useAuthStore from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  'Não Contatado': 'text-slate-600 bg-slate-100',
  'Em Prospecção': 'text-amber-700 bg-amber-100',
  'Proposta Enviada': 'text-blue-700 bg-blue-100',
  'Sem Interesse': 'text-rose-700 bg-rose-100',
  Convertido: 'text-emerald-700 bg-emerald-100',
}

export function MyLeadsTable() {
  const { filteredLeads, updateStatus, updateObservation, updateDecisor } = useMyLeadsStore()
  const { hasPermission } = useAuthStore()
  const canEditStatus = hasPermission('Editar Status de Contato')

  const [editingLead, setEditingLead] = useState<LeadSalvo | null>(null)
  const [obsText, setObsText] = useState('')

  const [editingDecisor, setEditingDecisor] = useState<LeadSalvo | null>(null)
  const [decisorForm, setDecisorForm] = useState({ nome: '', telefone: '', email: '' })

  const openObservationModal = (lead: LeadSalvo) => {
    setEditingLead(lead)
    setObsText(lead.observacoes || '')
  }

  const handleSaveObservation = () => {
    if (editingLead) {
      updateObservation(editingLead.id, obsText)
      setEditingLead(null)
      toast.success('Observações salvas com sucesso!')
    }
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
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[200px]">Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Município/UF</TableHead>
              <TableHead>Executivo Responsável</TableHead>
              <TableHead className="w-[150px]">Status de Contato</TableHead>
              <TableHead>Último Contato</TableHead>
              <TableHead>Nome do Decisor</TableHead>
              <TableHead>Telefone do Decisor</TableHead>
              <TableHead>E-mail do Decisor</TableHead>
              <TableHead className="text-center w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  Nenhum lead encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="animate-fade-in">
                  <TableCell className="font-medium">
                    {lead.razao_social}
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      CNAE: {lead.cnae_principal}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {lead.cnpj}
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
                          'h-8 text-xs font-medium border-0 ring-1 ring-inset ring-black/5 focus:ring-2 focus:ring-primary',
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
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDecisorModal(lead)}
                        className={cn(
                          'h-8 w-8',
                          lead.decisor_nome || lead.decisor_telefone || lead.decisor_email
                            ? 'text-primary'
                            : 'text-muted-foreground',
                        )}
                        title="Editar Decisor"
                      >
                        <User className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openObservationModal(lead)}
                        className={cn(
                          'h-8 w-8',
                          lead.observacoes ? 'text-primary' : 'text-muted-foreground',
                        )}
                        title="Observações"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Observações</DialogTitle>
            <DialogDescription>
              Adicione notas ou histórico de interação para{' '}
              <strong className="text-foreground">{editingLead?.razao_social}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={obsText}
              onChange={(e) => setObsText(e.target.value)}
              placeholder="Digite suas observações aqui..."
              className="min-h-[150px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLead(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveObservation}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
