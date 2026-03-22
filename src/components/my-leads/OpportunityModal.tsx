import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import useMyLeadsStore, { LeadSalvo, Opportunity } from '@/stores/useMyLeadsStore'
import { toast } from 'sonner'

interface OpportunityModalProps {
  lead: LeadSalvo | null
  opportunity: Opportunity | null
  onClose: () => void
}

export function OpportunityModal({ lead, opportunity, onClose }: OpportunityModalProps) {
  const { createOpportunity, updateOpportunity } = useMyLeadsStore()
  const [value, setValue] = useState('')
  const [probability, setProbability] = useState('')
  const [stage, setStage] = useState('prospecting')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (opportunity) {
      setValue(opportunity.value.toString())
      setProbability(opportunity.probability.toString())
      setStage(opportunity.stage)
    } else {
      setValue('')
      setProbability('50')
      setStage('prospecting')
    }
  }, [opportunity, lead])

  if (!lead) return null

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const numValue = parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0
      const numProb = parseInt(probability, 10) || 0

      if (opportunity) {
        await updateOpportunity(opportunity.id, {
          value: numValue,
          probability: numProb,
          stage: stage as any,
        })
        toast.success('Oportunidade atualizada com sucesso!')
      } else {
        await createOpportunity(lead.id, numValue, numProb, stage)
        toast.success('Oportunidade criada com sucesso!')
      }
      onClose()
    } catch (e) {
      toast.error('Erro ao salvar oportunidade.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{opportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
          <DialogDescription>
            Configure os detalhes da oportunidade para{' '}
            <strong className="text-foreground">{lead.razao_social}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="stage">Estágio no Funil</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger id="stage">
                <SelectValue placeholder="Selecione o estágio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospecting">Prospecção</SelectItem>
                <SelectItem value="qualification">Qualificação</SelectItem>
                <SelectItem value="proposal">Proposta</SelectItem>
                <SelectItem value="closing">Fechamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Valor Estimado (R$)</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ex: 5000.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prob">Probabilidade de Fechamento (%)</Label>
            <Input
              id="prob"
              type="number"
              min="0"
              max="100"
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              placeholder="Ex: 50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            Salvar Oportunidade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
