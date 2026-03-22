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
import { MessageSquare, Calendar, User, Clock } from 'lucide-react'
import useMyLeadsStore, { LeadSalvo } from '@/stores/useMyLeadsStore'
import { toast } from 'sonner'

type InteractionHistoryModalProps = {
  lead: LeadSalvo | null
  onClose: () => void
}

export function InteractionHistoryModal({ lead, onClose }: InteractionHistoryModalProps) {
  const { addInteraction } = useMyLeadsStore()
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSaveInteraction = async () => {
    if (!newNote.trim() || !lead) return
    setSaving(true)
    try {
      await addInteraction(lead.id, newNote)
      setNewNote('')
      toast.success('Interação registrada com sucesso!')
    } catch (err) {
      toast.error('Erro ao registrar interação.')
    } finally {
      setSaving(false)
    }
  }

  if (!lead) return null

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-slate-50/50">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <MessageSquare className="h-5 w-5" />
            Histórico de Interações
          </DialogTitle>
          <DialogDescription className="mt-1.5">
            Registro de atividades para{' '}
            <strong className="text-foreground">{lead.razao_social}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b bg-white shrink-0 shadow-sm z-10">
            <Textarea
              placeholder="Descreva a nova interação (ligação, e-mail, reunião)..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="resize-none h-20 mb-3 bg-slate-50 focus-visible:bg-white transition-colors"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSaveInteraction}
                disabled={saving || !newNote.trim()}
                size="sm"
              >
                {saving ? 'Registrando...' : 'Registrar Interação'}
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4 bg-slate-50/30">
            <div className="space-y-4 pb-4">
              {!lead.historico_interacoes || lead.historico_interacoes.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center">
                  <Clock className="h-8 w-8 text-slate-300 mb-2" />
                  Nenhuma interação registrada ainda.
                </div>
              ) : (
                lead.historico_interacoes.map((int: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-lg border shadow-sm relative group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {int.executivo_nome}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(int.data).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {int.texto}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
