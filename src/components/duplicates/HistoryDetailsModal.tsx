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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl text-[#0066CC]">
            Detalhes da Auditoria de Merge
          </DialogTitle>
          <DialogDescription className="mt-1">
            Motivo: <strong>{reason || 'Não informado'}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
                Dados Anteriores (Absorvida)
              </h3>
              <div className="bg-white border rounded-md p-4 shadow-sm text-sm">
                <p className="font-medium mb-2 text-slate-800">
                  {original_company_name || `ID: ${record.original_company_id}`}
                </p>
                <pre className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(beforeData, null, 2)}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
                Dados Atuais (Principal)
              </h3>
              <div className="bg-white border rounded-md p-4 shadow-sm text-sm">
                <p className="font-medium mb-2 text-emerald-700">
                  {merged_to_company_name || `ID: ${record.merged_to_company_id}`}
                </p>
                <pre className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(afterData, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
              Leads Reassociados
            </h3>
            <div className="bg-white border rounded-md p-4 shadow-sm">
              {leadsReassociated.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                  {leadsReassociated.map((lead: any, i: number) => (
                    <li key={i}>{lead.name || lead.id}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">
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
