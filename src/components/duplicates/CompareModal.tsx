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
import { designTokens } from '@/constants/designTokens'

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
    <div className="flex-1 border rounded-xl p-5 space-y-5 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="border-b pb-3 flex items-start justify-between gap-4">
        <h3 className="font-semibold text-lg text-slate-800 leading-tight">{title}</h3>
        <Badge variant="secondary" className="font-mono whitespace-nowrap shrink-0">
          ID: {company?.bitrix_id}
        </Badge>
      </div>
      <div className="space-y-4 text-sm">
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
            Razão Social
          </span>
          <span className="font-medium text-base text-slate-900">
            {company?.company_name || '-'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
            CNPJ
          </span>
          <span className="font-mono bg-slate-50 px-2 py-1 rounded border inline-block text-slate-700">
            {company?.cnpj || '-'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
            CNAE Principal
          </span>
          <span className="text-slate-700">{company?.cnae_principal || '-'}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
              Localização
            </span>
            <span className="text-slate-700">
              {company?.city || '-'} / {company?.state || '-'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-1">
              Curva ABC
            </span>
            <Badge variant="outline" className="bg-slate-50 text-slate-700">
              {company?.curva_abc || 'Não classificado'}
            </Badge>
          </div>
        </div>
        <div className="pt-4 border-t">
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-bold mb-2">
            Informações de Contato
          </span>
          <div className="space-y-2 text-slate-600">
            <p className="flex items-center gap-2">
              <strong className="w-12 text-slate-400 font-medium">Email:</strong>{' '}
              <span className="truncate" title={company?.email}>
                {company?.email || '-'}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <strong className="w-12 text-slate-400 font-medium">Tel:</strong>{' '}
              <span className="truncate">{company?.phone || '-'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 bg-slate-50/50 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl" style={{ color: designTokens.colors.secondary[600] }}>
            Comparativo Detalhado
          </DialogTitle>
          <DialogDescription className="mt-1 flex items-center gap-2">
            Score de Similaridade:
            <Badge
              style={
                (record.similarity_score || 0) >= 90
                  ? { backgroundColor: designTokens.colors.success[500], color: '#fff' }
                  : { backgroundColor: designTokens.colors.warning[500], color: '#fff' }
              }
            >
              {Number(record.similarity_score || 0).toFixed(1)}%
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {renderCompanyCard('Registro Original', original)}
            {renderCompanyCard('Registro Duplicado', duplicate)}
          </div>

          <div className="mt-6 border rounded-xl p-4 shadow-sm bg-warning-50 border-warning-200">
            <h4
              className="font-semibold text-sm mb-2"
              style={{ color: designTokens.colors.warning[800] }}
            >
              Motivo da Sinalização (Auditoria)
            </h4>
            <p className="text-sm font-mono" style={{ color: designTokens.colors.warning[900] }}>
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
