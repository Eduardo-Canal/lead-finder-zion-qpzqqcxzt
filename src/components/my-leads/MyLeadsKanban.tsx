import { useState } from 'react'
import useMyLeadsStore, { Opportunity } from '@/stores/useMyLeadsStore'
import { cn } from '@/lib/utils'
import { OpportunityModal } from './OpportunityModal'
import { DollarSign, Percent } from 'lucide-react'

const STAGES = [
  {
    id: 'prospecting',
    label: 'Prospecção',
    color: 'border-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    id: 'qualification',
    label: 'Qualificação',
    color: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  {
    id: 'proposal',
    label: 'Proposta',
    color: 'border-purple-200',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
  },
  {
    id: 'closing',
    label: 'Fechamento',
    color: 'border-emerald-200',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
] as const

export function MyLeadsKanban() {
  const { opportunities, myLeads, updateOpportunityStage } = useMyLeadsStore()
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null)

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('oppId', id)
  }

  const onDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (activeStage !== stageId) {
      setActiveStage(stageId)
    }
  }

  const onDragLeave = () => {
    setActiveStage(null)
  }

  const onDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setActiveStage(null)
    const oppId = e.dataTransfer.getData('oppId')
    if (oppId) {
      updateOpportunityStage(oppId, stageId)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const editingLead = editingOpp ? myLeads.find((l) => l.id === editingOpp.lead_id) || null : null

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] min-h-[500px]">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.stage === stage.id)
          const totalValue = stageOpps.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)

          return (
            <div
              key={stage.id}
              className={cn(
                'flex-1 min-w-[300px] rounded-lg p-3 flex flex-col border transition-colors duration-200',
                activeStage === stage.id
                  ? `bg-slate-100 border-dashed border-primary`
                  : 'bg-slate-50/80 border-slate-200',
              )}
              onDragOver={(e) => onDragOver(e, stage.id)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, stage.id)}
            >
              <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">
                  {stage.label}
                </h3>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold border',
                    stage.bg,
                    stage.text,
                    stage.color,
                  )}
                >
                  {stageOpps.length}
                </span>
              </div>
              <div className="mb-4 px-1 text-lg font-bold text-slate-800 tracking-tight">
                {formatCurrency(totalValue)}
              </div>

              <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-2 scrollbar-thin">
                {stageOpps.length === 0 ? (
                  <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg text-muted-foreground text-sm flex-1 flex items-center justify-center">
                    Arraste leads para cá
                  </div>
                ) : (
                  stageOpps.map((opp) => (
                    <div
                      key={opp.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, opp.id)}
                      onClick={() => setEditingOpp(opp)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all hover:shadow-md animate-fade-in"
                    >
                      <div className="font-medium text-sm text-slate-900 leading-tight mb-1 truncate">
                        {opp.leads_salvos?.razao_social || 'Lead Desconhecido'}
                      </div>
                      <div className="text-xs text-slate-500 mb-3 font-mono">
                        {opp.leads_salvos?.cnpj || 'CNPJ não informado'}
                      </div>
                      <div className="flex justify-between items-center text-xs mt-auto pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1 font-semibold text-slate-700">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          {formatCurrency(Number(opp.value))}
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-0.5 px-1.5 py-0.5 rounded font-medium',
                            opp.probability >= 70
                              ? 'bg-emerald-50 text-emerald-700'
                              : opp.probability >= 40
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700',
                          )}
                        >
                          {opp.probability}
                          <Percent className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <OpportunityModal
        lead={editingLead}
        opportunity={editingOpp}
        onClose={() => setEditingOpp(null)}
      />
    </>
  )
}
