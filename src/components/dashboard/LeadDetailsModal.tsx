import { useState, useMemo, useEffect } from 'react'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Briefcase,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  BookmarkPlus,
  Sparkles,
  Calendar,
  Activity,
  DollarSign,
  Users,
  Loader2,
  Send,
  MessageSquare,
  ArrowRight,
  MessageCircle,
  RefreshCw,
} from 'lucide-react'
import useLeadStore, { FilteredLead } from '@/stores/useLeadStore'
import useMyLeadsStore from '@/stores/useMyLeadsStore'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type LeadDetailsModalProps = {
  lead: FilteredLead
  onClose: () => void
  initialTab?: string
  forceIsSaved?: boolean
}

const formatCurrency = (val: number | undefined) => {
  if (val === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function LeadDetailsModal({ lead, onClose, initialTab, forceIsSaved }: LeadDetailsModalProps) {
  const { updateContactStatus } = useLeadStore()
  const { myLeads } = useMyLeadsStore()
  const [activeTab, setActiveTab] = useState(initialTab || 'resumo')
  const [saving, setSaving] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enrichedData, setEnrichedData] = useState<any>(null)

  // Bitrix and Approach states
  const [showBitrixConfirm, setShowBitrixConfirm] = useState(false)
  const [sendingBitrix, setSendingBitrix] = useState(false)
  const [bitrixSent, setBitrixSent] = useState(false)
  const [isBitrixIntegrated, setIsBitrixIntegrated] = useState(false)
  const [approachData, setApproachData] = useState<any>(null)
  const [loadingApproach, setLoadingApproach] = useState(false)
  const [isGeneratingApproach, setIsGeneratingApproach] = useState(false)
  const [syncLogs, setSyncLogs] = useState<any[]>([])
  const [doresInput, setDoresInput] = useState('')

  const isSaved = useMemo(() => {
    return forceIsSaved || myLeads.some((l) => l.cnpj === lead.cnpj)
  }, [myLeads, lead.cnpj, forceIsSaved])

  const displayData = enrichedData || lead
  const isEnriched = !!enrichedData || displayData.faturamento_anual !== undefined

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      // Check Bitrix Integration
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'bitrix24_defaults')
        .maybeSingle()

      if (isMounted && settingsData?.value?.kanban_id && settingsData?.value?.stage_id) {
        setIsBitrixIntegrated(true)
      }

      // Check Approach Data
      const savedLead = myLeads.find((l) => l.cnpj === lead.cnpj)
      const resolvedLeadId = savedLead?.id || (forceIsSaved ? lead.id : null)
      if (resolvedLeadId) {
        setLoadingApproach(true)
        const { data: appData } = await supabase
          .from('lead_abordagens_comerciais')
          .select('*')
          .eq('lead_id', resolvedLeadId)
          .order('criado_em', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (isMounted) {
          setApproachData(appData)
          setLoadingApproach(false)
        }

        const { data: logsData } = await supabase
          .from('leads_bitrix_sync')
          .select('*')
          .eq('lead_id', resolvedLeadId)
          .order('created_at', { ascending: false })

        if (isMounted && logsData) {
          setSyncLogs(logsData)
        }
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [lead.cnpj, myLeads])

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
      console.log('[SaveLead] CNPJ:', leadData.cnpj, 'lead.cnpj:', lead.cnpj, 'type:', typeof leadData.cnpj)

      const newLead = {
        razao_social: leadData.razao_social,
        cnpj: leadData.cnpj || lead.cnpj || null,
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
        observacoes: leadData.potencial ? `Potencial: ${leadData.potencial}` : null,
      }

      const { error } = await supabase.from('leads_salvos').insert(newLead)
      if (error) throw error

      updateContactStatus(lead.cnpj, 'Em Prospecção')
      toast.success('Lead salvo na sua carteira com sucesso!')

      const event = new CustomEvent('refetch-my-leads')
      window.dispatchEvent(event)
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

  const handleGenerateApproach = async () => {
    const savedLead = myLeads.find((l) => l.cnpj === lead.cnpj)
    const leadId = savedLead?.id || (forceIsSaved ? lead.id : null)

    if (!leadId) {
      toast.error('Salve o lead primeiro para gerar uma abordagem.')
      return
    }

    setIsGeneratingApproach(true)
    const requestBody = {
      lead_id: leadId,
      cnae: displayData.cnae_principal || displayData.cnae_fiscal_principal,
      porte_empresa: displayData.porte,
      dores_principais: doresInput.trim() || null,
    }
    console.log('[Abordagem] Enviando:', requestBody)
    try {
      // Chamar diretamente via fetch para capturar o body de erro
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      const session = (await supabase.auth.getSession()).data.session

      const rawResponse = await fetch(`${supabaseUrl}/functions/v1/generate-commercial-approach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${session?.access_token || supabaseKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await rawResponse.json().catch(() => null)
      console.log('[Abordagem] Status:', rawResponse.status, 'Resposta:', data)

      if (!rawResponse.ok) {
        throw new Error(data?.error || `Erro HTTP ${rawResponse.status}`)
      }
      if (!data?.success) throw new Error(data?.error || 'Erro na geracao')

      toast.success('Abordagem gerada com sucesso!')

      const { data: newData } = await supabase
        .from('lead_abordagens_comerciais')
        .select('*')
        .eq('lead_id', leadId)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle()

      setApproachData(newData)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao gerar abordagem.')
    } finally {
      setIsGeneratingApproach(false)
    }
  }

  const handleSendBitrix = async () => {
    setSendingBitrix(true)
    const savedLead = myLeads.find((l) => l.cnpj === lead.cnpj)
    const resolvedLeadId = savedLead?.id || (forceIsSaved ? lead.id : null)
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'bitrix24_defaults')
        .single()

      if (settingsError || !settingsData?.value) {
        throw new Error(
          'Configurações do Bitrix24 não encontradas. Acesse Configurações > Integração Bitrix24.',
        )
      }

      const { kanban_id, stage_id } = settingsData.value as any

      if (!kanban_id || !stage_id) {
        throw new Error('Kanban ou Fase padrão não configurados.')
      }

      const lead_id = resolvedLeadId || lead.id
      const company_id = savedLead?.bitrix_id || null

      console.log('[Bitrix] Enviando deal:', { lead_id, company_id, kanban_id, stage_id })

      const { data, error } = await supabase.functions.invoke('create-deal-bitrix', {
        body: {
          lead_id,
          company_id,
          kanban_id,
          stage_id,
          lead_data: displayData,
        },
      })

      console.log('[Bitrix] Resposta:', { error: error?.message, data })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setBitrixSent(true)
      toast.success('Lead enviado para Bitrix24 com sucesso!')
      setShowBitrixConfirm(false)

      if (data?.company_id && savedLead && !savedLead.bitrix_id) {
        const event = new CustomEvent('refetch-my-leads')
        window.dispatchEvent(event)
      }

      if (resolvedLeadId) {
        const { data: logsData } = await supabase
          .from('leads_bitrix_sync')
          .select('*')
          .eq('lead_id', resolvedLeadId)
          .order('created_at', { ascending: false })
        if (logsData) {
          setSyncLogs(logsData)
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao enviar para Bitrix24.')
      if (resolvedLeadId) {
        const { data: logsData } = await supabase
          .from('leads_bitrix_sync')
          .select('*')
          .eq('lead_id', resolvedLeadId)
          .order('created_at', { ascending: false })
        if (logsData) {
          setSyncLogs(logsData)
        }
      }
    } finally {
      setSendingBitrix(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 min-h-0 overflow-hidden rounded-xl">
      <DialogHeader className="p-5 md:p-6 pb-4 bg-white border-b border-slate-100 shrink-0 z-10 shadow-sm relative">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5">
            <DialogTitle className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
              {displayData.razao_social}
            </DialogTitle>
            <DialogDescription className="font-mono text-sm text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> {lead.cnpj}
            </DialogDescription>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex gap-2">
              {displayData.potencial && displayData.potencial !== 'Indefinido' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'px-3 py-1 text-xs uppercase tracking-wider font-bold shadow-sm border',
                    displayData.potencial === 'Alto' &&
                      'bg-emerald-100 text-emerald-800 border-emerald-200',
                    displayData.potencial === 'Médio' &&
                      'bg-amber-100 text-amber-800 border-amber-200',
                    displayData.potencial === 'Baixo' && 'bg-red-100 text-red-800 border-red-200',
                  )}
                >
                  Potencial: {displayData.potencial}
                </Badge>
              )}
              <Badge
                variant={
                  displayData.situacao?.toUpperCase() === 'ATIVA' ? 'default' : 'destructive'
                }
                className={cn(
                  'px-3 py-1 text-xs uppercase tracking-wider font-bold shadow-sm',
                  displayData.situacao?.toUpperCase() === 'ATIVA'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white',
                )}
              >
                {displayData.situacao || displayData.situacao_cadastral || 'Desconhecida'}
              </Badge>
            </div>
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

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full h-full flex flex-col min-h-0"
        >
          <div className="px-5 md:px-6 pt-5 shrink-0 bg-slate-50 z-10">
            <TabsList className="flex w-full overflow-x-auto custom-scrollbar bg-slate-200/60 p-1 rounded-xl">
              <TabsTrigger
                value="resumo"
                className="flex-1 min-w-fit px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Resumo
              </TabsTrigger>
              <TabsTrigger
                value="contato"
                className="flex-1 min-w-fit px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Contatos
              </TabsTrigger>
              <TabsTrigger
                value="socios"
                className="flex-1 min-w-fit px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Sócios
              </TabsTrigger>
              <TabsTrigger
                value="abordagem"
                className="flex-1 min-w-fit px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Abordagem
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-5 md:px-6 pb-6 min-h-0 custom-scrollbar">
            <TabsContent value="resumo" className="space-y-6 mt-5 animate-fade-in outline-none">
              {!displayData.dados_incompletos && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Faturamento Estimado
                    </span>
                    <span className="text-lg font-bold text-indigo-900 font-mono">
                      {formatCurrency(displayData.faturamento_anual)}
                    </span>
                  </div>
                  <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Funcionários
                    </span>
                    <span className="text-lg font-bold text-indigo-900">
                      {displayData.numero_funcionarios || 'N/I'}
                    </span>
                  </div>
                  <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col gap-1 shadow-sm">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Score de Crédito
                    </span>
                    <span
                      className={cn(
                        'text-lg font-bold',
                        (displayData.score_credito || 0) > 70
                          ? 'text-emerald-600'
                          : (displayData.score_credito || 0) > 40
                            ? 'text-amber-600'
                            : 'text-red-600',
                      )}
                    >
                      {displayData.score_credito || 'N/I'} / 100
                    </span>
                  </div>
                </div>
              )}

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
                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
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

            <TabsContent value="contato" className="space-y-6 mt-5 animate-fade-in outline-none">
              {displayData.contatos_principais && displayData.contatos_principais.length > 0 && (
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-5 col-span-full">
                  <h4 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                    <Users className="w-5 h-5 text-indigo-500" /> Contatos Principais (Enriquecido)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayData.contatos_principais.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 border border-slate-100 bg-slate-50 rounded-lg flex flex-col gap-2"
                      >
                        <div className="font-bold text-slate-800">{c.nome}</div>
                        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                          {c.cargo}
                        </div>
                        {c.telefone && (
                          <div className="text-sm text-slate-600 font-mono flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5" /> {c.telefone}
                          </div>
                        )}
                        {c.email && (
                          <div className="text-sm text-slate-600 flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" /> {c.email}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="space-y-3">
                    {/* Emails */}
                    {displayData.emails_detalhados && displayData.emails_detalhados.length > 0 ? (
                      displayData.emails_detalhados.map((e: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-sm p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="break-all font-medium text-slate-700">{e.email}</span>
                          {!e.valido && <span className="text-xs text-red-400 ml-auto font-semibold">inválido</span>}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start gap-3 text-sm p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="break-all font-medium text-slate-700">{displayData.email || 'Não informado'}</span>
                      </div>
                    )}
                    {/* Telefones */}
                    {displayData.telefones_detalhados && displayData.telefones_detalhados.length > 0 ? (
                      displayData.telefones_detalhados.map((t: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-sm p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <Phone className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-medium text-slate-700 font-mono">{t.numero}</span>
                          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${t.tipo === 'celular' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                            {t.tipo === 'celular' ? '📱 WhatsApp' : '☎ Fixo'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start gap-3 text-sm p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="font-medium text-slate-700 font-mono">{displayData.telefone || 'Não informado'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="socios" className="mt-5 animate-fade-in outline-none">
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
                          {socio.faixa_etaria && (
                            <p className="text-xs text-indigo-600 font-medium mt-1">
                              Faixa etária: {socio.faixa_etaria}
                            </p>
                          )}
                          {socio.email && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" /> {socio.email}
                            </p>
                          )}
                          {socio.telefone && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {socio.telefone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {socio.tipo && (
                          <Badge variant="outline" className="text-xs font-medium">
                            {socio.tipo}
                          </Badge>
                        )}
                        {socio.data_entrada && (
                          <Badge
                            variant="secondary"
                            className="w-fit font-medium bg-slate-100 text-slate-600"
                          >
                            Entrada: {socio.data_entrada}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="abordagem" className="mt-5 animate-fade-in outline-none">
              {loadingApproach ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-slate-500">Buscando inteligência comercial...</p>
                </div>
              ) : approachData ? (
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 shadow-sm">
                    <h4 className="font-bold flex items-center gap-2 text-indigo-900 border-b border-indigo-100/50 pb-3 mb-4">
                      <Sparkles className="w-5 h-5 text-indigo-500" /> Abordagem Sugerida
                    </h4>
                    <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                      {approachData.abordagem_gerada}
                    </div>
                  </div>

                  {(approachData.argumentos_venda?.length > 0 ||
                    approachData.personas_decisoras?.length > 0 ||
                    approachData.proximos_passos?.length > 0 ||
                    approachData.canais_recomendados?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {approachData.personas_decisoras?.length > 0 && (
                        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <h5 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" /> Personas Decisoras
                          </h5>
                          <ul className="space-y-2">
                            {approachData.personas_decisoras.map((p: string, i: number) => (
                              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-primary">•</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {approachData.argumentos_venda?.length > 0 && (
                        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <h5 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Argumentos de
                            Venda
                          </h5>
                          <ul className="space-y-2">
                            {approachData.argumentos_venda.map((a: string, i: number) => (
                              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-emerald-500">•</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {approachData.proximos_passos?.length > 0 && (
                        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <h5 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-500" /> Próximos Passos
                          </h5>
                          <ul className="space-y-2">
                            {approachData.proximos_passos.map((p: string, i: number) => (
                              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-blue-500">{i + 1}.</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {approachData.canais_recomendados?.length > 0 && (
                        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <h5 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-purple-500" /> Canais Recomendados
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {approachData.canais_recomendados.map((c: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {syncLogs.length > 0 && (
                    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3 mb-4">
                        <RefreshCw className="w-5 h-5 text-primary" /> Histórico de Sincronizações
                      </h4>
                      <div className="space-y-3">
                        {syncLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(
                                  log.created_at || log.sent_at || Date.now(),
                                ).toLocaleString('pt-BR')}
                              </span>
                              <span className="text-xs text-slate-500 mt-1">
                                Deal ID: {log.deal_id || 'Não gerado'}
                              </span>
                            </div>
                            <Badge
                              variant={log.status === 'SUCESSO' ? 'default' : 'destructive'}
                              className={
                                log.status === 'SUCESSO'
                                  ? 'bg-emerald-500 hover:bg-emerald-600'
                                  : ''
                              }
                            >
                              {log.status === 'SUCESSO' ? 'Sucesso' : 'Erro'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Nenhuma abordagem gerada</h3>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto font-medium">
                    Gere uma abordagem comercial personalizada com Inteligência Artificial para este
                    lead.
                  </p>
                  {isSaved && (
                    <div className="mt-4 max-w-md mx-auto text-left">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Dores / desafios observados neste lead (opcional)
                      </label>
                      <textarea
                        value={doresInput}
                        onChange={(e) => setDoresInput(e.target.value)}
                        placeholder="Ex: Processos manuais, erros de inventário, atrasos na separação..."
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[60px] resize-none"
                      />
                    </div>
                  )}
                  <Button
                    onClick={handleGenerateApproach}
                    disabled={isGeneratingApproach || !isSaved}
                    className="mt-4 gap-2"
                  >
                    {isGeneratingApproach ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isGeneratingApproach ? 'Gerando...' : 'Gerar com IA'}
                  </Button>
                  {!isSaved && (
                    <p className="text-xs text-amber-600 mt-3">
                      Salve o lead na sua carteira primeiro para usar a IA.
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <DialogFooter className="p-4 md:px-6 bg-white border-t border-slate-200 shrink-0 flex flex-col sm:flex-row gap-3 relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex-1 flex flex-wrap items-center justify-start gap-2">
          {(!isEnriched || displayData.dados_incompletos) && (
            <Button
              variant="outline"
              onClick={handleEnrichLead}
              disabled={enriching}
              className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 font-semibold shadow-sm w-full sm:w-auto"
            >
              {enriching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {enriching ? 'Buscando...' : 'Enriquecer Lead Manualmente'}
            </Button>
          )}

          {isBitrixIntegrated && approachData && (
            <Button
              variant="default"
              onClick={() => setShowBitrixConfirm(true)}
              disabled={sendingBitrix || bitrixSent}
              className="gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold shadow-sm w-full sm:w-auto transition-colors"
            >
              {sendingBitrix ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sendingBitrix
                ? 'Enviando...'
                : bitrixSent
                  ? 'Enviado para Bitrix24'
                  : 'Enviar para Bitrix24'}
            </Button>
          )}
        </div>
        <Button variant="ghost" onClick={onClose} className="font-medium w-full sm:w-auto">
          Cancelar
        </Button>
        <Button
          onClick={handleSaveLead}
          disabled={saving || isSaved}
          className={cn(
            'gap-2 font-bold shadow-sm transition-all w-full sm:w-auto',
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

      <AlertDialog open={showBitrixConfirm} onOpenChange={setShowBitrixConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de Envio</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja enviar este lead com a abordagem gerada para o Bitrix24?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingBitrix}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleSendBitrix}
              disabled={sendingBitrix}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              {sendingBitrix ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
