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
import useAuthStore from '@/stores/useAuthStore'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { notify } from '@/components/Notifications/NotificationSystem'
import { SubmitButton } from '@/components/Forms/FormStandards'
import { designTokens } from '@/constants/designTokens'

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

      notify.success('Reversão Concluída', 'Merge revertido com sucesso e auditoria registrada!')
      onRefresh()
      onClose()
    } catch (err: any) {
      notify.error('Erro na reversão', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: designTokens.colors.warning[600] }}
          >
            <RotateCcw className="h-5 w-5" />
            Desfazer Merge
          </DialogTitle>
          <DialogDescription className="pt-3 text-base leading-relaxed">
            Você está prestes a reverter a mesclagem entre:
            <div className="mt-3 bg-slate-50 p-3 rounded-lg border text-sm text-slate-700 space-y-2">
              <p>
                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block mb-0.5">
                  Absorvida
                </span>
                {record.original_company_name || `ID: ${record.original_company_id}`}
              </p>
              <div className="border-t border-slate-200"></div>
              <p>
                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block mb-0.5">
                  Principal
                </span>
                {record.merged_to_company_name || `ID: ${record.merged_to_company_id}`}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-warning-50 p-4 rounded-lg border border-warning-200 flex items-start gap-3 mt-2 mb-4">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-warning-600" />
          <p className="text-sm text-warning-800">
            Isso alterará o status do histórico para "Revertido". O registro da empresa original
            será sinalizado para restauração e os vínculos retornarão ao estado anterior.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          <SubmitButton
            variant="destructive"
            onClick={handleUndo}
            isLoading={loading}
            className="gap-2"
            loadingText="Revertendo..."
          >
            {!loading && <RotateCcw className="h-4 w-4" />}
            {!loading && 'Confirmar Reversão'}
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
