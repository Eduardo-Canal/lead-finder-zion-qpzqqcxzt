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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export function CompareModal({
  isOpen,
  onClose,
  record,
}: {
  isOpen: boolean
  onClose: () => void
  record: any
}) {
  if (!record) return null

  const { original, duplicate } = record

  const renderCompanyCard = (title: string, company: any) => (
    <div className="flex-1 border rounded-lg p-5 space-y-5 bg-white shadow-sm">
      <div className="border-b pb-3 flex items-start justify-between">
        <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
        <Badge variant="secondary" className="font-mono">
          ID: {company?.bitrix_id}
        </Badge>
      </div>
      <div className="space-y-4 text-sm">
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
            Razão Social
          </span>
          <span className="font-medium text-base">{company?.company_name || '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
            CNPJ
          </span>
          <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border">
            {company?.cnpj || '-'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
            CNAE Principal
          </span>
          <span>{company?.cnae_principal || '-'}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
              Localização
            </span>
            <span>
              {company?.city || '-'} / {company?.state || '-'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
              Curva ABC
            </span>
            <Badge variant="outline">{company?.curva_abc || 'Não classificado'}</Badge>
          </div>
        </div>
        <div className="pt-2 border-t">
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-2">
            Informações de Contato
          </span>
          <div className="space-y-1.5 text-slate-600">
            <p className="flex items-center gap-2">
              <strong className="w-12 text-slate-400 font-normal">Email:</strong>{' '}
              {company?.email || '-'}
            </p>
            <p className="flex items-center gap-2">
              <strong className="w-12 text-slate-400 font-normal">Tel:</strong>{' '}
              {company?.phone || '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 bg-slate-50 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl text-[#0066CC]">Comparativo Detalhado</DialogTitle>
          <DialogDescription className="mt-1">
            Score de Similaridade:{' '}
            <strong className="text-emerald-600 ml-1 text-base">
              {Number(record.similarity_score || 0).toFixed(1)}%
            </strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {renderCompanyCard('Registro Original', original)}
            {renderCompanyCard('Registro Duplicado', duplicate)}
          </div>

          <div className="mt-6 border border-amber-200 rounded-lg p-4 bg-amber-50 shadow-sm">
            <h4 className="font-semibold text-amber-800 text-sm mb-2">
              Motivo da Sinalização (Auditoria)
            </h4>
            <p className="text-amber-700/90 text-sm font-mono">
              {record.notes || 'Detecção automática via rotina de sincronização.'}
            </p>
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
