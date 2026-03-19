import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FilteredLead } from '@/stores/useLeadStore'
import { Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LeadDetailsModalProps {
  lead: FilteredLead | null
  onClose: () => void
}

const formatCurrency = (val: any) => {
  if (val === null || val === undefined || val === '') return '-'
  const num = Number(val)
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}

const formatCnpj = (cnpj: string) => {
  if (!cnpj) return '-'
  return (
    String(cnpj)
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') || '-'
  )
}

const formatDate = (date: string) => {
  if (!date) return '-'
  try {
    if (date.includes('-')) {
      const [year, month, day] = date.split('-')
      if (year && month && day) return `${day}/${month}/${year}`
    }
    return new Date(date).toLocaleDateString('pt-BR')
  } catch {
    return date
  }
}

const Field = ({
  label,
  value,
  colSpan = false,
}: {
  label: string
  value: React.ReactNode
  colSpan?: boolean
}) => {
  const displayValue = value === null || value === undefined || value === '' ? '-' : value
  return (
    <div className={`space-y-1 ${colSpan ? 'md:col-span-2' : ''}`}>
      <span className="text-xs text-muted-foreground uppercase font-semibold">{label}</span>
      <div className="text-sm font-medium text-foreground">{displayValue}</div>
    </div>
  )
}

export function LeadDetailsModal({ lead, onClose }: LeadDetailsModalProps) {
  const { user } = useAuthStore()
  const [enrichedData, setEnrichedData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingLeadId, setExistingLeadId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!lead?.cnpj) return
    const fetch = async () => {
      setLoading(true)
      setError(null)
      setEnrichedData(null)
      setExistingLeadId(null)
      try {
        const { data: saved } = await supabase
          .from('leads_salvos')
          .select('id')
          .eq('cnpj', lead.cnpj)
          .maybeSingle()
        if (saved) setExistingLeadId(saved.id)
        const { data, error: invErr } = await supabase.functions.invoke('enriquecer-lead', {
          body: { cnpj: lead.cnpj },
        })
        if (invErr) throw invErr
        if (data?.error) throw new Error(data.error)
        setEnrichedData(data)
      } catch (err: any) {
        setError(err.message || 'Erro de conexão')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [lead?.cnpj])

  const handleRefresh = async () => {
    if (!lead?.cnpj) return
    setIsRefreshing(true)
    try {
      const { data, error: invErr } = await supabase.functions.invoke('enriquecer-lead', {
        body: { cnpj: lead.cnpj },
      })
      if (invErr) throw invErr
      if (data?.error) throw new Error(data.error)
      setEnrichedData(data)
      if (existingLeadId) {
        await supabase
          .from('leads_salvos')
          .update({ razao_social: data.razao_social })
          .eq('id', existingLeadId)
      }
      toast.success('Dados atualizados com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar dados')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSaveLead = async () => {
    if (!user) return toast.error('Usuário não autenticado.')
    const d = enrichedData || lead
    try {
      if (existingLeadId) {
        toast.success('Lead já está salvo em Meus Leads.')
      } else {
        await supabase.from('leads_salvos').insert({
          razao_social: d.razao_social,
          cnpj: lead!.cnpj,
          cnae_principal: d.cnae_fiscal_principal || d.cnae_principal,
          municipio: d.municipio,
          uf: d.uf,
          porte: d.porte,
          situacao: d.situacao_cadastral || d.situacao,
          capital_social: d.capital_social,
          data_abertura: d.data_abertura,
          email: d.email,
          telefone: d.telefone,
          salvo_por: user.id,
          status_contato: 'Não Contatado',
        })
        toast.success('Lead salvo com sucesso!')
      }
      window.dispatchEvent(new Event('refetch-my-leads'))
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar o lead.')
    }
  }

  if (!lead) return null
  const d = enrichedData || lead
  const mapUrl = d?.endereco_completo
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.endereco_completo)}`
    : null
  const linkUrl = d?.razao_social
    ? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(d.razao_social)}`
    : null

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col p-0">
        <DialogTitle className="sr-only">Detalhes da Empresa</DialogTitle>
        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Enriquecendo dados da empresa...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Erro na consulta</h4>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 pb-4">
              <section>
                <h3 className="text-lg font-bold border-b pb-2 mb-4">1. Identificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <Field label="CNPJ" value={formatCnpj(lead.cnpj)} />
                  <Field label="Razão Social" value={d.razao_social} />
                  <Field label="Nome Fantasia" value={d.nome_fantasia} />
                  <Field label="Status" value={d.situacao_cadastral || d.situacao} />
                </div>
              </section>
              <section>
                <h3 className="text-lg font-bold border-b pb-2 mb-4">2. Localização</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <Field label="Endereço Completo" value={d.endereco_completo} colSpan />
                  <Field label="Município" value={d.municipio} />
                  <Field label="UF" value={d.uf} />
                  <Field label="CEP" value={d.cep} />
                  <Field
                    label="Localização no Mapa"
                    value={
                      mapUrl ? (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          Ver no Maps
                        </a>
                      ) : (
                        '-'
                      )
                    }
                  />
                </div>
              </section>
              <section>
                <h3 className="text-lg font-bold border-b pb-2 mb-4">3. Dados Comerciais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <Field
                    label="CNAE Principal"
                    value={d.cnae_fiscal_principal || d.cnae_principal}
                  />
                  <Field label="Porte" value={d.porte} />
                  <Field label="Data de Abertura" value={formatDate(d.data_abertura)} />
                  <Field label="Capital Social" value={formatCurrency(d.capital_social)} />
                </div>
              </section>
              <section>
                <h3 className="text-lg font-bold border-b pb-2 mb-4">4. Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <Field label="Email" value={d.email} />
                  <Field label="Telefone" value={d.telefone} />
                </div>
              </section>
            </div>
          )}
        </ScrollArea>
        <div className="p-6 border-t bg-slate-50 shrink-0 rounded-b-lg">
          <h3 className="text-lg font-bold mb-4">5. Ações</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || loading}>
              Atualizar dados
            </Button>
            <Button
              variant="outline"
              asChild
              className={!mapUrl || loading ? 'pointer-events-none opacity-50' : ''}
            >
              <a href={mapUrl || '#'} target={mapUrl ? '_blank' : '_self'}>
                Ver no Maps
              </a>
            </Button>
            <Button
              variant="outline"
              asChild
              className={
                !linkUrl || loading
                  ? 'pointer-events-none opacity-50 text-[#0A66C2] border-[#0A66C2]/30'
                  : 'text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/10'
              }
            >
              <a href={linkUrl || '#'} target={linkUrl ? '_blank' : '_self'}>
                Buscar no LinkedIn
              </a>
            </Button>
            <Button onClick={handleSaveLead} disabled={loading || !!error}>
              Salvar em Meus Leads
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
