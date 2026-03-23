import { useState, useEffect } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { GitMerge, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { notify } from '@/components/Notifications/NotificationSystem'
import { SubmitButton } from '@/components/Forms/FormStandards'
import { designTokens } from '@/constants/designTokens'

export function MergeModal({
  isOpen,
  onClose,
  record,
  onMerge,
}: {
  isOpen: boolean
  onClose: () => void
  record: any
  onMerge: () => void
}) {
  const [primary, setPrimary] = useState<'original' | 'duplicate'>('original')
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen) setPrimary('original')
  }, [isOpen])

  if (!record) return null

  const handleMerge = async () => {
    setLoading(true)
    try {
      const mergedToId =
        primary === 'original' ? record.original_company_id : record.duplicate_company_id
      const absorbedId =
        primary === 'original' ? record.duplicate_company_id : record.original_company_id

      const absorbedCompany = primary === 'original' ? record.duplicate : record.original
      const mergedToCompany = primary === 'original' ? record.original : record.duplicate

      const { error: updateError } = await supabase
        .from('company_duplicates')
        .update({
          status: 'merged',
          merged_by: user?.user_id,
          merged_at: new Date().toISOString(),
        })
        .eq('id', record.id)

      if (updateError) throw updateError

      const { error: historyError } = await supabase.from('company_merge_history').insert({
        original_company_id: absorbedId,
        merged_to_company_id: mergedToId,
        merged_by: user?.user_id,
        merged_at: new Date().toISOString(),
        reason: 'Mesclagem manual via interface de controle de duplicidades',
        reversible: true,
        original_company_name: absorbedCompany?.company_name || `Empresa ID: ${absorbedId}`,
        merged_to_company_name: mergedToCompany?.company_name || `Empresa ID: ${mergedToId}`,
        status: 'merged',
        fields_updated: {
          before: absorbedCompany,
          after: mergedToCompany,
          reassociated_leads: [],
        },
      } as any)

      if (historyError) throw historyError

      notify.success(
        'Mesclagem Concluída',
        'Empresas mescladas com sucesso e histórico registrado!',
      )
      onMerge()
      onClose()
    } catch (e: any) {
      notify.error('Erro ao mesclar', e.message)
    } finally {
      setLoading(false)
    }
  }

  const { original, duplicate } = record

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: designTokens.colors.primary[600] }}
          >
            <GitMerge className="h-5 w-5" />
            Confirmar Mesclagem
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Selecione qual registro será mantido como <strong>Principal</strong> na base de dados. O
            outro será marcado como secundário e absorvido.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <RadioGroup
            value={primary}
            onValueChange={(v: any) => setPrimary(v)}
            className="space-y-4"
          >
            <div
              className={cn(
                'flex items-start space-x-4 border p-5 rounded-xl cursor-pointer transition-all duration-200',
                primary === 'original'
                  ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                  : 'bg-white hover:bg-slate-50 hover:border-slate-300',
              )}
              onClick={() => setPrimary('original')}
            >
              <RadioGroupItem value="original" id="r-orig" className="mt-1" />
              <div className="grid gap-1.5 leading-none flex-1">
                <Label
                  htmlFor="r-orig"
                  className="font-semibold text-base cursor-pointer text-slate-800"
                >
                  Manter Registro Original
                </Label>
                <div className="mt-2 space-y-1">
                  <p
                    className="text-sm font-medium text-slate-700 line-clamp-1"
                    title={original?.company_name}
                  >
                    {original?.company_name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    CNPJ: {original?.cnpj || 'Sem CNPJ'}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={cn(
                'flex items-start space-x-4 border p-5 rounded-xl cursor-pointer transition-all duration-200',
                primary === 'duplicate'
                  ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                  : 'bg-white hover:bg-slate-50 hover:border-slate-300',
              )}
              onClick={() => setPrimary('duplicate')}
            >
              <RadioGroupItem value="duplicate" id="r-dup" className="mt-1" />
              <div className="grid gap-1.5 leading-none flex-1">
                <Label
                  htmlFor="r-dup"
                  className="font-semibold text-base cursor-pointer text-slate-800"
                >
                  Manter Registro Duplicado
                </Label>
                <div className="mt-2 space-y-1">
                  <p
                    className="text-sm font-medium text-slate-700 line-clamp-1"
                    title={duplicate?.company_name}
                  >
                    {duplicate?.company_name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    CNPJ: {duplicate?.cnpj || 'Sem CNPJ'}
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-warning-50 p-4 rounded-lg border border-warning-200 flex items-start gap-3 mt-4">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-warning-600" />
          <p className="text-sm text-warning-800 leading-relaxed">
            A ação de mesclagem atualizará os vínculos e manterá o histórico. Os dados da empresa
            absorvida não são excluídos definitivamente, permitindo reversão futura se necessário.
          </p>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          <SubmitButton
            onClick={handleMerge}
            isLoading={loading}
            className="gap-2"
            loadingText="Mesclando..."
          >
            {!loading && <GitMerge className="h-4 w-4" />}
            {!loading && 'Confirmar Mesclagem'}
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
