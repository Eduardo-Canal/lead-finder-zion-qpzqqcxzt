import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { designTokens } from '@/constants/designTokens'

export function HistoryDetailsModal({
  isOpen,
  onClose,
  record,
}: {
  isOpen: boolean
  onClose: () => void
  record: any
}) {
  if (!record) return null

  const { fields_updated, reason, original_company_name, merged_to_company_name } = record

  const beforeData = fields_updated?.before || {}
  const afterData = fields_updated?.after || {}
  const leadsReassociated = fields_updated?.reassociated_leads || []

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50/50">
        <DialogHeader className="p-6 pb-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl" style={{ color: designTokens.colors.secondary[600] }}>
            Detalhes da Auditoria de Merge
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm">
            Motivo da operação:{' '}
            <strong className="text-slate-800">{reason || 'Não informado'}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500 bg-white inline-block px-2 py-1 rounded border shadow-sm">
                Dados Anteriores (Absorvida)
              </h3>
              <div className="bg-white border rounded-xl p-5 shadow-sm text-sm">
                <p className="font-medium text-base mb-4 text-slate-800 border-b pb-2">
                  {original_company_name || `ID: ${record.original_company_id}`}
                </p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 overflow-x-auto">
                  <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(beforeData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-primary bg-primary/10 inline-block px-2 py-1 rounded border border-primary/20 shadow-sm">
                Dados Atuais (Principal)
              </h3>
              <div className="bg-white border rounded-xl p-5 shadow-sm text-sm border-primary/20 ring-1 ring-primary/5">
                <p className="font-medium text-base mb-4 text-primary-700 border-b pb-2">
                  {merged_to_company_name || `ID: ${record.merged_to_company_id}`}
                </p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 overflow-x-auto">
                  <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(afterData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
              Leads Reassociados
            </h3>
            <div className="bg-white border rounded-xl p-5 shadow-sm">
              {leadsReassociated.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5 marker:text-primary">
                  {leadsReassociated.map((lead: any, i: number) => (
                    <li key={i}>{lead.name || lead.id}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic flex items-center h-8">
                  Nenhum lead foi reassociado nesta operação.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-white shrink-0">
          <DialogClose asChild>
            <Button variant="outline">Fechar Visualização</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
