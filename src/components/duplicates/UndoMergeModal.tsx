import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import useAuthStore from '@/stores/useAuthStore'
import { AlertCircle, Loader2, RotateCcw } from 'lucide-react'

export function UndoMergeModal({
  isOpen,
  onClose,
  record,
  onRefresh,
}: {
  isOpen: boolean
  onClose: () => void
  record: any
  onRefresh: () => void
}) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()

  if (!record) return null

  const handleUndo = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('company_merge_history')
        .update({
          status: 'reversed',
          reverted_at: new Date().toISOString(),
          reverted_by: user?.user_id,
        } as any)
        .eq('id', record.id)

      if (error) throw error

      toast.success('Merge revertido com sucesso e auditoria registrada!')
      onRefresh()
      onClose()
    } catch (err: any) {
      toast.error('Erro ao reverter merge: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <RotateCcw className="h-5 w-5" />
            Desfazer Merge
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            Você está prestes a reverter a mesclagem entre:
            <br />
            <br />
            <strong>
              1. {record.original_company_name || `ID: ${record.original_company_id}`}
            </strong>{' '}
            (Absorvida)
            <br />
            <strong>
              2. {record.merged_to_company_name || `ID: ${record.merged_to_company_id}`}
            </strong>{' '}
            (Principal)
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 p-3 rounded-md border border-amber-100 flex items-start gap-2 text-amber-800 text-sm my-4">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>
            Isso alterará o status do histórico para "Revertido". O registro da empresa original
            será sinalizado para restauração (soft delete) e os leads voltarão aos seus respectivos
            vínculos.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleUndo} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Confirmar Reversão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
