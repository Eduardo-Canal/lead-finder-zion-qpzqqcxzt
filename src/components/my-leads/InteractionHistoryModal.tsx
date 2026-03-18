import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import useMyLeadsStore, { LeadSalvo } from '@/stores/useMyLeadsStore'
import { toast } from 'sonner'

interface InteractionHistoryModalProps {
  lead: LeadSalvo | null
  onClose: () => void
}

export function InteractionHistoryModal({ lead, onClose }: InteractionHistoryModalProps) {
  const { addInteraction } = useMyLeadsStore()
  const [newText, setNewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!lead) return null

  const history = Array.isArray(lead.historico_interacoes) ? lead.historico_interacoes : []

  const handleAdd = async () => {
    if (!newText.trim()) return
    setIsSubmitting(true)
    try {
      await addInteraction(lead.id, newText.trim())
      setNewText('')
      toast.success('Interação registrada com sucesso!')
    } catch (error) {
      toast.error('Erro ao registrar interação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('pt-BR')
    } catch {
      return isoStr
    }
  }

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Histórico de Atividades</DialogTitle>
          <DialogDescription>
            Registro de interações com{' '}
            <strong className="text-foreground">{lead.razao_social}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <ScrollArea className="h-[250px] pr-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma interação registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={idx} className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1.5 border-b border-muted-foreground/10 pb-1">
                      <span className="font-semibold text-foreground">{item.executivo_nome}</span>
                      <span>{formatDate(item.data)}</span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{item.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="space-y-3 pt-4 border-t">
            <Textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Digite a nova interação..."
              className="resize-none h-20"
            />
            <Button
              className="w-full"
              disabled={!newText.trim() || isSubmitting}
              onClick={handleAdd}
            >
              Registrar Interação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
