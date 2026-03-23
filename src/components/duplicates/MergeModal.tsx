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
import { toast } from 'sonner'
import useAuthStore from '@/stores/useAuthStore'
import { Loader2, GitMerge, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      })

      if (historyError) throw historyError

      toast.success('Empresas mescladas com sucesso e histórico registrado!')
      onMerge()
      onClose()
    } catch (e: any) {
      toast.error('Erro ao mesclar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const { original, duplicate } = record

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <GitMerge className="h-5 w-5" />
            Mesclar Cadastros
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Selecione qual registro será mantido como <strong>Principal</strong> na base de dados. O
            outro será marcado como secundário/absorvido.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={primary}
            onValueChange={(v: any) => setPrimary(v)}
            className="space-y-4"
          >
            <div
              className={cn(
                'flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-all',
                primary === 'original'
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50',
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
                <p
                  className="text-sm text-slate-600 mt-1 line-clamp-1"
                  title={original?.company_name}
                >
                  {original?.company_name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  CNPJ: {original?.cnpj || 'Sem CNPJ'}
                </p>
              </div>
            </div>

            <div
              className={cn(
                'flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-all',
                primary === 'duplicate'
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50',
              )}
              onClick={() => setPrimary('duplicate')}
            >
              <RadioGroupItem value="duplicate" id="r-dup" className="mt-1" />
              <div className="grid gap-1.5 leading-none flex-1">
                <Label
                  htmlFor="r-dup"
                  className="font-semibold text-base cursor-pointer text-slate-800"
                >
                  Manter Registro Novo (Duplicado)
                </Label>
                <p
                  className="text-sm text-slate-600 mt-1 line-clamp-1"
                  title={duplicate?.company_name}
                >
                  {duplicate?.company_name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  CNPJ: {duplicate?.cnpj || 'Sem CNPJ'}
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-amber-50 p-3 rounded-md border border-amber-100 flex items-start gap-2 text-amber-800 text-xs mb-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            A ação de mesclagem atualizará os vínculos de histórico e não exclui os dados da empresa
            absorvida, garantindo a possibilidade de reversão futura.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleMerge}
            disabled={loading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GitMerge className="h-4 w-4" />
            )}
            Confirmar Mesclagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
