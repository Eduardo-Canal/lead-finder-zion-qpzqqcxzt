import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilteredLead } from '@/stores/useLeadStore'
import { MapPin, Building2, Phone, Mail, FileText, Calendar, Landmark } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LeadDetailsModalProps {
  lead: FilteredLead | null
  onClose: () => void
}

export function LeadDetailsModal({ lead, onClose }: LeadDetailsModalProps) {
  const { user } = useAuthStore()

  if (!lead) return null

  const handleSaveLead = async () => {
    if (!user) {
      toast.error('Usuário não autenticado.')
      return
    }

    try {
      const { error } = await supabase.from('leads_salvos').insert({
        razao_social: lead.razao_social,
        cnpj: lead.cnpj,
        cnae_principal: lead.cnae_principal,
        municipio: lead.municipio,
        uf: lead.uf,
        porte: lead.porte,
        situacao: lead.situacao,
        capital_social: lead.capital_social,
        data_abertura: lead.data_abertura,
        email: lead.email,
        telefone: lead.telefone,
        socios: lead.socios,
        salvo_por: user.id,
        status_contato: 'Não Contatado',
      })

      if (error) throw error

      toast.success('Lead salvo com sucesso!')
      window.dispatchEvent(new Event('refetch-my-leads'))
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao salvar o lead.')
    }
  }

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl flex items-start gap-2">
            <Building2 className="w-5 h-5 text-primary mt-1 shrink-0" />
            <span className="leading-tight">{lead.razao_social}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="font-mono">
              {lead.cnpj}
            </Badge>
            <Badge
              variant={lead.situacao === 'Ativa' ? 'default' : 'secondary'}
              className={
                lead.situacao === 'Ativa' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''
              }
            >
              {lead.situacao}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  CNAE Principal
                </span>
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  {lead.cnae_principal}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Localização
                </span>
                <p className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {lead.municipio} - {lead.uf}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Porte</span>
                <p className="text-sm font-medium">{lead.porte}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Capital Social
                </span>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-muted-foreground" />
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    lead.capital_social,
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Data de Abertura
                </span>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {new Date(lead.data_abertura).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm border-b pb-1">Informações de Contato</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{lead.email || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{lead.telefone || 'Não informado'}</span>
                </div>
              </div>
            </div>

            {lead.socios && lead.socios.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b pb-1">Quadro Societário</h4>
                <ul className="space-y-2">
                  {lead.socios.map((socio: any, idx: number) => (
                    <li key={idx} className="text-sm flex flex-col">
                      <span className="font-medium">{socio.nome}</span>
                      <span className="text-xs text-muted-foreground">{socio.qualificacao}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t bg-slate-50 flex justify-end gap-2 shrink-0 rounded-b-lg">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handleSaveLead}>Salvar em "Meus Leads"</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
