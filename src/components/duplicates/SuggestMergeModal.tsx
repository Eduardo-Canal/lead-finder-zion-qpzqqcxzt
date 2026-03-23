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
import { Badge } from '@/components/ui/badge'

export function SuggestMergeModal({
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
  const [primary, setPrimary] = useState<'empresa1' | 'empresa2'>('empresa1')
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen && record) {
      // Pré-seleciona a empresa com dados mais completos
      const s1 = [
        record.empresa1?.email,
        record.empresa1?.phone,
        record.empresa1?.cnpj,
        record.empresa1?.city,
      ].filter(Boolean).length
      const s2 = [
        record.empresa2?.email,
        record.empresa2?.phone,
        record.empresa2?.cnpj,
        record.empresa2?.city,
      ].filter(Boolean).length

      setPrimary(s1 >= s2 ? 'empresa1' : 'empresa2')
    }
  }, [isOpen, record])

  if (!record) return null

  const handleMerge = async () => {
    setLoading(true)
    try {
      const mergedToId = primary === 'empresa1' ? record.empresa1_id : record.empresa2_id
      const absorbedId = primary === 'empresa1' ? record.empresa2_id : record.empresa1_id
      const mergedToCompany = primary === 'empresa1' ? record.empresa1 : record.empresa2
      const absorbedCompany = primary === 'empresa1' ? record.empresa2 : record.empresa1

      // 1. Registra a duplicidade já como resolvida (merged)
      const { data: dupData, error: dupError } = await supabase
        .from('company_duplicates')
        .insert({
          original_company_id: absorbedId,
          duplicate_company_id: mergedToId,
          similarity_score: record.similarity_score,
          match_type: 'razao_social_single',
          status: 'merged',
          merged_by: user?.user_id,
          merged_at: new Date().toISOString(),
          notes: 'Merged direto via sugestão de Fuzzy Matching.',
        })
        .select()
        .single()

      if (dupError) throw dupError

      // 2. Insere histórico de merge
      const { error: histError } = await supabase.from('company_merge_history').insert({
        original_company_id: absorbedId,
        merged_to_company_id: mergedToId,
        merged_by: user?.user_id,
        merged_at: new Date().toISOString(),
        reason: 'Mesclagem via sugestão inteligente de duplicatas potenciais',
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

      if (histError) throw histError

      toast.success('Empresas mescladas com sucesso!')
      onMerge()
      onClose()
    } catch (e: any) {
      toast.error('Erro ao mesclar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const { empresa1, empresa2 } = record

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <GitMerge className="h-5 w-5" />
            Sugerir Merge
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            O sistema pré-selecionou o registro mais completo. Confirme qual será mantido como{' '}
            <strong>Principal</strong>.
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
                primary === 'empresa1'
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50',
              )}
              onClick={() => setPrimary('empresa1')}
            >
              <RadioGroupItem value="empresa1" id="r-e1" className="mt-1" />
              <div className="grid gap-1.5 leading-none flex-1">
                <Label
                  htmlFor="r-e1"
                  className="font-semibold text-base cursor-pointer text-slate-800"
                >
                  Manter {empresa1?.company_name}
                </Label>
                <p className="text-xs text-muted-foreground font-mono">
                  CNPJ: {empresa1?.cnpj || 'Sem CNPJ'}
                </p>
                <div className="flex gap-2 mt-1.5">
                  {empresa1?.email && (
                    <Badge variant="secondary" className="text-[10px]">
                      Email
                    </Badge>
                  )}
                  {empresa1?.phone && (
                    <Badge variant="secondary" className="text-[10px]">
                      Telefone
                    </Badge>
                  )}
                  {empresa1?.city && (
                    <Badge variant="secondary" className="text-[10px]">
                      Localização
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div
              className={cn(
                'flex items-start space-x-3 border p-4 rounded-lg cursor-pointer transition-all',
                primary === 'empresa2'
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-white hover:bg-slate-50',
              )}
              onClick={() => setPrimary('empresa2')}
            >
              <RadioGroupItem value="empresa2" id="r-e2" className="mt-1" />
              <div className="grid gap-1.5 leading-none flex-1">
                <Label
                  htmlFor="r-e2"
                  className="font-semibold text-base cursor-pointer text-slate-800"
                >
                  Manter {empresa2?.company_name}
                </Label>
                <p className="text-xs text-muted-foreground font-mono">
                  CNPJ: {empresa2?.cnpj || 'Sem CNPJ'}
                </p>
                <div className="flex gap-2 mt-1.5">
                  {empresa2?.email && (
                    <Badge variant="secondary" className="text-[10px]">
                      Email
                    </Badge>
                  )}
                  {empresa2?.phone && (
                    <Badge variant="secondary" className="text-[10px]">
                      Telefone
                    </Badge>
                  )}
                  {empresa2?.city && (
                    <Badge variant="secondary" className="text-[10px]">
                      Localização
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-amber-50 p-3 rounded-md border border-amber-100 flex items-start gap-2 text-amber-800 text-xs mb-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>A empresa preterida será desativada e todo o histórico será auditado com segurança.</p>
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
