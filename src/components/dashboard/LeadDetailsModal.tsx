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
  AlertTriangle,
  Building,
  BookmarkPlus,
  Loader2,
  Sparkles,
  AlertCircle,
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
    <div className="flex flex-col h-full bg-slate-50">
      <DialogHeader className="p-6 pb-4 bg-white border-b sticky top-0 z-10">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <DialogTitle className="text-xl text-[#0066CC] leading-tight">
              {displayData.razao_social}
            </DialogTitle>
            <DialogDescription className="font-mono text-sm">{lead.cnpj}</DialogDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={displayData.situacao?.toUpperCase() === 'ATIVA' ? 'default' : 'destructive'}
              className={
                displayData.situacao?.toUpperCase() === 'ATIVA'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : ''
              }
            >
              {displayData.situacao || displayData.situacao_cadastral || 'Desconhecida'}
            </Badge>
            {isEnriched && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                <Sparkles className="w-3 h-3 mr-1" /> Dados Enriquecidos
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="resumo">Resumo da Empresa</TabsTrigger>
            <TabsTrigger value="contato">Contatos & Endereço</TabsTrigger>
            <TabsTrigger value="socios">Quadro Societário</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <TabsContent value="resumo" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700 shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                        Atividade Principal (CNAE)
                      </h4>
                      <p className="text-sm font-medium">
                        {displayData.cnae_principal || displayData.cnae_fiscal_principal || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-700 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Porte</h4>
                      <p className="text-sm font-medium">{displayData.porte || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                        Capital Social
                      </h4>
                      <p className="text-sm font-medium">
                        {formatCurrency(displayData.capital_social)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-700 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                        Data de Abertura
                      </h4>
                      <p className="text-sm font-medium">
                        {displayData.data_abertura || displayData.data_inicio_atividade || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {displayData.cnaes_secundarios && displayData.cnaes_secundarios.length > 0 && (
                <div className="mt-6 p-4 bg-white rounded-lg border">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Atividades Secundárias
                  </h4>
                  <ul className="space-y-2">
                    {displayData.cnaes_secundarios.map((cnae: string, i: number) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span>{cnae}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contato" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-white rounded-lg border space-y-4">
                  <h4 className="font-semibold flex items-center gap-2 text-slate-800 border-b pb-2">
                    <MapPin className="w-4 h-4 text-primary" /> Endereço Principal
                  </h4>
                  {isEnriched && displayData.endereco_completo ? (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {displayData.endereco_completo}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Município:</span>
                        <span className="font-medium">{displayData.municipio}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estado (UF):</span>
                        <span className="font-medium">{displayData.uf}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CEP:</span>
                        <span className="font-medium">{displayData.cep || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white rounded-lg border space-y-4">
                  <h4 className="font-semibold flex items-center gap-2 text-slate-800 border-b pb-2">
                    <Phone className="w-4 h-4 text-primary" /> Contatos
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="break-all">{displayData.email || 'Não informado'}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span>{displayData.telefone || 'Não informado'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="socios" className="mt-0">
              {!displayData.socios || displayData.socios.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                  <Building className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-700">
                    Quadro Societário Indisponível
                  </h3>
                  <p className="text-slate-500 mt-1 max-w-md mx-auto">
                    Não foram encontradas informações sobre os sócios desta empresa na consulta
                    inicial.
                    {!isEnriched &&
                      ' Experimente Enriquecer o Lead para buscar dados mais profundos.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {displayData.socios.map((socio: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 bg-white rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800">{socio.nome}</h4>
                        <p className="text-sm text-muted-foreground capitalize mt-0.5">
                          {socio.qualificacao ? socio.qualificacao.toLowerCase() : 'Sócio'}
                        </p>
                      </div>
                      {socio.data_entrada && (
                        <Badge variant="secondary" className="w-fit font-normal">
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

      <DialogFooter className="p-4 bg-white border-t sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center justify-start">
          {!isEnriched && (
            <Button
              variant="outline"
              onClick={handleEnrichLead}
              disabled={enriching}
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
            >
              {enriching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {enriching ? 'Buscando dados...' : 'Enriquecer Lead (API Externa)'}
            </Button>
          )}
        </div>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSaveLead}
          disabled={saving || isSaved}
          className="gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSaved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <BookmarkPlus className="w-4 h-4" />
          )}
          {isSaved ? 'Lead na Carteira' : 'Salvar em Meus Leads'}
        </Button>
      </DialogFooter>
    </div>
  )
}
