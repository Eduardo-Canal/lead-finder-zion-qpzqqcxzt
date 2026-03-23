import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import useMyLeadsStore, { LeadSalvo, Opportunity } from '@/stores/useMyLeadsStore'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/Forms/FormStandards'

type OpportunityModalProps = {
  lead: LeadSalvo | null
  opportunity: Opportunity | null
  onClose: () => void
}

export function OpportunityModal({ lead, opportunity, onClose }: OpportunityModalProps) {
  const { createOpportunity, updateOpportunity } = useMyLeadsStore()

  const [value, setValue] = useState('')
  const [probability, setProbability] = useState([50])
  const [stage, setStage] = useState('prospecting')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (opportunity) {
      setValue(opportunity.value.toString())
      setProbability([opportunity.probability])
      setStage(opportunity.stage)
    } else {
      setValue('')
      setProbability([50])
      setStage('prospecting')
    }
  }, [opportunity, lead])

  const handleSave = async () => {
    if (!lead) return
    setSaving(true)

    try {
      const numValue = Number(value) || 0

      if (opportunity) {
        await updateOpportunity(opportunity.id, {
          value: numValue,
          probability: probability[0],
          stage: stage as any,
        })
        toast.success('Oportunidade atualizada!')
      } else {
        await createOpportunity(lead.id, numValue, probability[0], stage)
        toast.success('Oportunidade criada!')
      }
      onClose()
    } catch (err) {
      toast.error('Erro ao salvar oportunidade')
    } finally {
      setSaving(false)
    }
  }

  if (!lead) return null

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{opportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
          <DialogDescription>{lead.razao_social}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="value">Valor Estimado (R$)</Label>
            <Input
              id="value"
              type="number"
              placeholder="Ex: 5000"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <Label>Probabilidade de Fechamento</Label>
              <span className="text-sm font-medium text-primary">{probability[0]}%</span>
            </div>
            <Slider
              value={probability}
              onValueChange={setProbability}
              max={100}
              step={5}
              className="py-2"
            />
          </div>

          <div className="grid gap-2">
            <Label>Estágio no Funil</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospecting">Prospecção</SelectItem>
                <SelectItem value="qualification">Qualificação</SelectItem>
                <SelectItem value="proposal">Proposta</SelectItem>
                <SelectItem value="closing">Fechamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <SubmitButton onClick={handleSave} isLoading={saving} loadingText="Salvando...">
            Salvar
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
