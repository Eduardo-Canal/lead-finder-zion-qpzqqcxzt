import { useEffect, useState, useMemo } from 'react'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Building2,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Building,
  BookmarkPlus,
  Sparkles,
  Calendar,
  Activity,
  DollarSign,
  Users,
  Loader2,
} from 'lucide-react'
import useLeadStore, { FilteredLead } from '@/stores/useLeadStore'
import useMyLeadsStore from '@/stores/useMyLeadsStore'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type LeadDetailsModalProps = {
  lead: FilteredLead
  onClose: () => void
}

const formatCurrency = (val: number | undefined) => {
  if (val === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function LeadDetailsModal({ lead, onClose }: LeadDetailsModalProps) {
  const { updateContactStatus } = useLeadStore()
  const { myLeads } = useMyLeadsStore()
  const [activeTab, setActiveTab] = useState('resumo')
  const [saving, setSaving] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enrichedData, setEnrichedData] = useState<any>(null)

  const isSaved = useMemo(() => {
    return myLeads.some((l) => l.cnpj === lead.cnpj)
  }, [myLeads, lead.cnpj])

  const handleSaveLead = async () => {
    if (isSaved) {
      toast.info('Este lead já está na sua carteira.')
      return
    }

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const authUser = userData.user
      if (!authUser) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUser.id)
        .single()

      if (!profile) throw new Error('Perfil não encontrado')

      const leadData = enrichedData || lead

      const newLead = {
        razao_social: leadData.razao_social,
        cnpj: leadData.cnpj,
        cnae_principal: leadData.cnae_principal || leadData.cnae_fiscal_principal,
        municipio: leadData.municipio,
        uf: leadData.uf,
        porte: leadData.porte,
        situacao: leadData.situacao || leadData.situacao_cadastral,
        capital_social: leadData.capital_social,
        data_abertura: leadData.data_abertura,
        email: leadData.email,
        telefone: leadData.telefone,
        socios: leadData.socios,
        salvo_por: profile.id,
        status_contato: 'Não Contatado',
      }

      const { error } = await supabase.from('leads_salvos').insert(newLead)
      if (error) throw error

      updateContactStatus(lead.cnpj, 'Em Prospecção')
      toast.success('Lead salvo na sua carteira com sucesso!')

      const event = new CustomEvent('refetch-my-leads')
      window.dispatchEvent(event)

      onClose()
    } catch (error: any) {
      toast.error('Erro ao salvar lead: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEnrichLead = async () => {
    setEnriching(true)
    try {
      const { data, error } = await supabase.functions.invoke('enriquecer-lead', {
        body: { cnpj: lead.cnpj },
      })

      if (error) throw error
      if (data.error) throw new Error(data.error)

      setEnrichedData(data)
      toast.success('Dados do lead enriquecidos com sucesso!')
    } catch (err: any) {
      console.error(err)
      toast.error('Não foi possível enriquecer os dados deste CNPJ no momento.')
    } finally {
      setEnriching(false)
    }
  }

  const displayData = enrichedData || lead
  const isEnriched = !!enrichedData

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5">
            <DialogTitle className="text-2xl font-bold text-slate-800 leading-tight">
              {displayData.razao_social}
            </DialogTitle>
            <DialogDescription className="font-mono text-sm text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> {lead.cnpj}
            </DialogDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={displayData.situacao?.toUpperCase() === 'ATIVA' ? 'default' : 'destructive'}
              className={cn(
                'px-3 py-1 text-xs uppercase tracking-wider font-bold shadow-sm',
                displayData.situacao?.toUpperCase() === 'ATIVA'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white',
              )}
            >
              {displayData.situacao || displayData.situacao_cadastral || 'Desconhecida'}
            </Badge>
            {isEnriched && (
              <Badge
                variant="outline"
                className="bg-indigo-50 text-indigo-700 border-indigo-200 px-2 py-0.5 shadow-sm font-semibold"
              >
                <Sparkles className="w-3 h-3 mr-1.5" /> Enriquecido
              </Badge>
            )}
          </div>
        </div>
      </DialogHeader>

      <div className="p-6 flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100/80 p-1 rounded-xl">
            <TabsTrigger value="resumo" className="rounded-lg data-[state=active]:shadow-sm">
              Resumo
            </TabsTrigger>
            <TabsTrigger value="contato" className="rounded-lg data-[state=active]:shadow-sm">
              Contatos
            </TabsTrigger>
            <TabsTrigger value="socios" className="rounded-lg data-[state=active]:shadow-sm">
              Sócios
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <TabsContent value="resumo" className="space-y-6 mt-0 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-primary/30 transition-colors">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      CNAE Principal
                    </h4>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      {displayData.cnae_principal || displayData.cnae_fiscal_principal || '-'}
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-500/30 transition-colors">
                  <div className="bg-blue-50 p-3 rounded-lg text-blue-600 shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Porte
                    </h4>
                    <p className="text-sm font-semibold text-slate-800">
                      {displayData.porte || '-'}
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
                  <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Capital Social
                    </h4>
                    <p className="text-sm font-semibold text-slate-800 font-mono text-base">
                      {formatCurrency(displayData.capital_social)}
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-amber-500/30 transition-colors">
                  <div className="bg-amber-50 p-3 rounded-lg text-amber-600 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Data de Abertura
                    </h4>
                    <p className="text-sm font-semibold text-slate-800">
                      {displayData.data_abertura || displayData.data_inicio_atividade || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {displayData.cnaes_secundarios && displayData.cnaes_secundarios.length > 0 && (
                <div className="mt-6 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Atividades Secundárias
                  </h4>
                  <ul className="space-y-2.5">
                    {displayData.cnaes_secundarios.map((cnae: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-slate-600 flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span className="font-medium">{cnae}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contato" className="space-y-6 mt-0 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h4 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                    <MapPin className="w-5 h-5 text-primary" /> Endereço
                  </h4>
                  {isEnriched && displayData.endereco_completo ? (
                    <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {displayData.endereco_completo}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm p-2 rounded-md hover:bg-slate-50 transition-colors">
                        <span className="text-slate-500 font-semibold">Município:</span>
                        <span className="font-bold text-slate-800">{displayData.municipio}</span>
                      </div>
                      <div className="flex justify-between text-sm p-2 rounded-md hover:bg-slate-50 transition-colors">
                        <span className="text-slate-500 font-semibold">Estado (UF):</span>
                        <span className="font-bold text-slate-800">{displayData.uf}</span>
                      </div>
                      <div className="flex justify-between text-sm p-2 rounded-md hover:bg-slate-50 transition-colors">
                        <span className="text-slate-500 font-semibold">CEP:</span>
                        <span className="font-bold text-slate-800">{displayData.cep || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h4 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                    <Phone className="w-5 h-5 text-primary" /> Contatos
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="break-all font-medium text-slate-700">
                        {displayData.email || 'Não informado'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-sm p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="font-medium text-slate-700 font-mono">
                        {displayData.telefone || 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="socios" className="mt-0 animate-fade-in">
              {!displayData.socios || displayData.socios.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Quadro Societário Indisponível
                  </h3>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto font-medium">
                    Não foram encontradas informações sobre os sócios desta empresa.
                    {!isEnriched && ' Experimente Enriquecer o Lead para buscar dados detalhados.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {displayData.socios.map((socio: any, i: number) => (
                    <div
                      key={i}
                      className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{socio.nome}</h4>
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">
                            {socio.qualificacao ? socio.qualificacao : 'Sócio'}
                          </p>
                        </div>
                      </div>
                      {socio.data_entrada && (
                        <Badge
                          variant="secondary"
                          className="w-fit font-medium bg-slate-100 text-slate-600"
                        >
                          Entrada: {socio.data_entrada}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      <DialogFooter className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex-1 flex items-center justify-start">
          {!isEnriched && (
            <Button
              variant="outline"
              onClick={handleEnrichLead}
              disabled={enriching}
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 font-semibold shadow-sm"
            >
              {enriching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {enriching ? 'Buscando...' : 'Enriquecer Lead (API Externa)'}
            </Button>
          )}
        </div>
        <Button variant="ghost" onClick={onClose} className="font-medium">
          Cancelar
        </Button>
        <Button
          onClick={handleSaveLead}
          disabled={saving || isSaved}
          className={cn(
            'gap-2 font-bold shadow-sm transition-all',
            isSaved
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-primary hover:bg-primary-600 text-white',
          )}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSaved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <BookmarkPlus className="w-4 h-4" />
          )}
          {saving ? 'Salvando...' : isSaved ? 'Lead na Carteira' : 'Salvar em Meus Leads'}
        </Button>
      </DialogFooter>
    </div>
  )
}
