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
import { MessageSquare, Calendar } from 'lucide-react'
import useMyLeadsStore from '@/stores/useMyLeadsStore'
import { ContactStatus, MyLead } from '@/data/mock-my-leads'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const statusColors: Record<ContactStatus, string> = {
  'Não Contatado': 'text-slate-600 bg-slate-100',
  'Em Prospecção': 'text-amber-700 bg-amber-100',
  'Proposta Enviada': 'text-blue-700 bg-blue-100',
  'Sem Interesse': 'text-rose-700 bg-rose-100',
  Convertido: 'text-emerald-700 bg-emerald-100',
}

export function MyLeadsTable() {
  const { filteredLeads, updateStatus, updateObservation } = useMyLeadsStore()
  const [editingLead, setEditingLead] = useState<MyLead | null>(null)
  const [obsText, setObsText] = useState('')

  const openObservationModal = (lead: MyLead) => {
    setEditingLead(lead)
    setObsText(lead.observacoes)
  }

  const handleSaveObservation = () => {
    if (editingLead) {
      updateObservation(editingLead.id, obsText)
      setEditingLead(null)
      toast.success('Observações salvas com sucesso!')
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
              <TableHead className="w-[180px]">Status de Contato</TableHead>
              <TableHead>Último Contato</TableHead>
              <TableHead className="text-center w-[100px]">Obs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum lead encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="animate-fade-in">
                  <TableCell className="font-medium">
                    {lead.razaoSocial}
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      CNAE: {lead.cnae}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {lead.cnpj}
                  </TableCell>
                  <TableCell>
                    {lead.municipio} - {lead.uf}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.executivo}</TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(v: ContactStatus) => {
                        updateStatus(lead.id, v)
                        toast.success('Status atualizado')
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          'h-8 text-xs font-medium border-0 ring-1 ring-inset ring-black/5 focus:ring-2 focus:ring-primary',
                          statusColors[lead.status],
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
                      {lead.ultimoContato}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openObservationModal(lead)}
                      className={cn(
                        'h-8 w-8',
                        lead.observacoes ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
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
              <strong className="text-foreground">{editingLead?.razaoSocial}</strong>.
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
    </>
  )
}
