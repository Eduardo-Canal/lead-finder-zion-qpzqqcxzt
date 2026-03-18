import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FilteredLead } from '@/stores/useLeadStore'
import {
  MapPin,
  Building2,
  Phone,
  Mail,
  FileText,
  Calendar,
  Landmark,
  ExternalLink,
  Map,
  AlertCircle,
  Loader2,
  MessageSquare,
  User,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LeadDetailsModalProps {
  lead: FilteredLead | null
  onClose: () => void
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'Não informado'
  try {
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-')
      if (year && month && day) {
        return `${day}/${month}/${year}`
      }
    }
    return new Date(dateStr).toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

export function LeadDetailsModal({ lead, onClose }: LeadDetailsModalProps) {
  const { user } = useAuthStore()
  const [enrichedData, setEnrichedData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [existingLeadId, setExistingLeadId] = useState<string | null>(null)
  const [decisorNome, setDecisorNome] = useState('')
  const [decisorTelefone, setDecisorTelefone] = useState('')
  const [decisorEmail, setDecisorEmail] = useState('')
  const [historicoInteracoes, setHistoricoInteracoes] = useState<any[]>([])
  const [novaInteracao, setNovaInteracao] = useState('')

  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchEnrichedData = async () => {
    if (!lead?.cnpj) return
    setLoading(true)
    setError(null)
    setEnrichedData(null)
    setExistingLeadId(null)
    setDecisorNome('')
    setDecisorTelefone('')
    setDecisorEmail('')
    setHistoricoInteracoes([])
    setNovaInteracao('')

    try {
      const { data: savedLead } = await supabase
        .from('leads_salvos')
        .select('id, decisor_nome, decisor_telefone, decisor_email, historico_interacoes')
        .eq('cnpj', lead.cnpj)
        .maybeSingle()

      if (savedLead) {
        setExistingLeadId(savedLead.id)
        setDecisorNome(savedLead.decisor_nome || '')
        setDecisorTelefone(savedLead.decisor_telefone || '')
        setDecisorEmail(savedLead.decisor_email || '')
        setHistoricoInteracoes(
          Array.isArray(savedLead.historico_interacoes) ? savedLead.historico_interacoes : [],
        )
      }

      const { data, error: invokeError } = await supabase.functions.invoke('enriquecer-lead', {
        body: { cnpj: lead.cnpj },
      })

      if (invokeError) {
        setError(invokeError.message || 'Erro ao enriquecer dados.')
      } else if (data?.error) {
        setError(data.error)
      } else {
        setEnrichedData(data)
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (lead) {
      fetchEnrichedData()
    }
  }, [lead?.cnpj])

  const handleForceRefresh = async () => {
    setShowRefreshConfirm(false)
    if (!lead?.cnpj) return

    setIsRefreshing(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('enriquecer-lead', {
        body: { cnpj: lead.cnpj },
      })

      if (invokeError) throw invokeError
      if (data?.error) throw new Error(data.error)

      setEnrichedData(data)

      if (existingLeadId) {
        const { error: updateError } = await supabase
          .from('leads_salvos')
          .update({
            razao_social: data.razao_social,
            cnae_principal: data.cnae_fiscal_principal || data.cnae_principal,
            municipio: data.municipio,
            uf: data.uf,
            porte: data.porte,
            situacao: data.situacao_cadastral || data.situacao,
            capital_social: data.capital_social,
            data_abertura: data.data_abertura,
            email: data.email,
            telefone: data.telefone,
            socios: data.socios,
          })
          .eq('id', existingLeadId)

        if (updateError) throw updateError
      }

      toast.success('Dados da empresa atualizados com sucesso!')
      window.dispatchEvent(new Event('refetch-my-leads'))
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar dados.')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!lead) return null

  const handleRegistrarInteracao = async () => {
    if (!user || !novaInteracao.trim()) return

    const interaction = {
      data: new Date().toISOString(),
      executivo_nome: user.nome,
      texto: novaInteracao.trim(),
    }

    const updatedHistory = [interaction, ...historicoInteracoes]

    if (existingLeadId) {
      try {
        const { error } = await supabase
          .from('leads_salvos')
          .update({ historico_interacoes: updatedHistory })
          .eq('id', existingLeadId)

        if (error) throw error
        setHistoricoInteracoes(updatedHistory)
        setNovaInteracao('')
        toast.success('Interação registrada com sucesso!')
        window.dispatchEvent(new Event('refetch-my-leads'))
      } catch (err: any) {
        toast.error('Erro ao registrar interação.')
      }
    } else {
      setHistoricoInteracoes(updatedHistory)
      setNovaInteracao('')
      toast.success('Interação adicionada! Salve o lead para persistir.')
    }
  }

  const handleSaveLead = async () => {
    if (!user) {
      toast.error('Usuário não autenticado.')
      return
    }

    const dataToSave = enrichedData || lead

    try {
      if (existingLeadId) {
        const { error: updateError } = await supabase
          .from('leads_salvos')
          .update({
            decisor_nome: decisorNome || null,
            decisor_telefone: decisorTelefone || null,
            decisor_email: decisorEmail || null,
          })
          .eq('id', existingLeadId)

        if (updateError) throw updateError
        toast.success('Informações do lead atualizadas com sucesso!')
      } else {
        const { error: saveError } = await supabase.from('leads_salvos').insert({
          razao_social: dataToSave.razao_social,
          cnpj: lead.cnpj,
          cnae_principal: dataToSave.cnae_fiscal_principal || dataToSave.cnae_principal,
          municipio: dataToSave.municipio,
          uf: dataToSave.uf,
          porte: dataToSave.porte,
          situacao: dataToSave.situacao_cadastral || dataToSave.situacao,
          capital_social: dataToSave.capital_social,
          data_abertura: dataToSave.data_abertura,
          email: dataToSave.email,
          telefone: dataToSave.telefone,
          socios: dataToSave.socios,
          salvo_por: user.id,
          status_contato: 'Não Contatado',
          decisor_nome: decisorNome || null,
          decisor_telefone: decisorTelefone || null,
          decisor_email: decisorEmail || null,
          historico_interacoes: historicoInteracoes,
        })

        if (saveError) throw saveError
        toast.success('Lead salvo com sucesso!')
      }

      window.dispatchEvent(new Event('refetch-my-leads'))
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao salvar o lead.')
    }
  }

  const googleMapsUrl = enrichedData?.endereco_completo
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enrichedData.endereco_completo)}`
    : null

  const linkedInUrl = enrichedData?.razao_social
    ? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(enrichedData.razao_social)}`
    : null

  return (
    <>
      <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle className="text-xl flex items-start gap-2">
              <Building2 className="w-5 h-5 text-primary mt-1 shrink-0" />
              <span className="leading-tight">
                {loading ? (
                  <Skeleton className="h-6 w-64" />
                ) : (
                  enrichedData?.razao_social || lead.razao_social
                )}
              </span>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="font-mono">
                {lead.cnpj}
              </Badge>
              {!loading && (
                <Badge
                  variant={
                    (enrichedData?.situacao_cadastral || lead.situacao) === 'Ativa'
                      ? 'default'
                      : 'secondary'
                  }
                  className={
                    (enrichedData?.situacao_cadastral || lead.situacao) === 'Ativa'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : ''
                  }
                >
                  {enrichedData?.situacao_cadastral || lead.situacao}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            {loading ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-10 space-y-4 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Enriquecendo dados da empresa...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Erro na consulta</h4>
                  <p className="text-sm mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-background"
                    onClick={fetchEnrichedData}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : enrichedData ? (
              <div className="space-y-6 pb-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRefreshConfirm(true)}
                    disabled={isRefreshing || loading}
                    className="gap-2"
                  >
                    <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                    Atualizar dados da empresa
                  </Button>
                  {googleMapsUrl && (
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                        <Map className="w-4 h-4" /> Ver no Maps
                      </a>
                    </Button>
                  )}
                  {linkedInUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2 text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/10"
                    >
                      <a href={linkedInUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4" /> Buscar no LinkedIn
                      </a>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      CNAE Principal
                    </span>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="line-clamp-2" title={enrichedData.cnae_fiscal_principal}>
                        {enrichedData.cnae_fiscal_principal || 'Não informado'}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      Localização
                    </span>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      {enrichedData.municipio} - {enrichedData.uf}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      Endereço Completo
                    </span>
                    <p className="text-sm font-medium">
                      {enrichedData.endereco_completo || 'Não informado'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      Porte
                    </span>
                    <p className="text-sm font-medium">{enrichedData.porte || 'Não informado'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      Capital Social
                    </span>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-muted-foreground shrink-0" />
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(enrichedData.capital_social || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold">
                      Data de Abertura
                    </span>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      {formatDate(enrichedData.data_abertura)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Informações de Contato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{enrichedData.email || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">{enrichedData.telefone || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {enrichedData.socios && enrichedData.socios.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm border-b pb-1">Quadro Societário</h4>
                    <ul className="space-y-2">
                      {enrichedData.socios.map((socio: any, idx: number) => (
                        <li key={idx} className="text-sm flex flex-col p-2 bg-muted/50 rounded-md">
                          <span className="font-medium">{socio.nome}</span>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">
                              {socio.qualificacao || 'Sócio'}
                            </span>
                            {socio.data_entrada && (
                              <span className="text-xs text-muted-foreground">
                                Entrada: {formatDate(socio.data_entrada)}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3 mt-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                    <User className="w-4 h-4" /> Informações do Decisor{' '}
                    {existingLeadId ? '' : '(Opcional)'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="decisorNome"
                        className="text-xs text-muted-foreground font-semibold"
                      >
                        Nome
                      </Label>
                      <Input
                        id="decisorNome"
                        value={decisorNome}
                        onChange={(e) => setDecisorNome(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="h-8 text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="decisorTelefone"
                        className="text-xs text-muted-foreground font-semibold"
                      >
                        Telefone
                      </Label>
                      <Input
                        id="decisorTelefone"
                        value={decisorTelefone}
                        onChange={(e) => setDecisorTelefone(e.target.value)}
                        placeholder="Ex: (11) 99999-9999"
                        className="h-8 text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="decisorEmail"
                        className="text-xs text-muted-foreground font-semibold"
                      >
                        E-mail
                      </Label>
                      <Input
                        id="decisorEmail"
                        value={decisorEmail}
                        onChange={(e) => setDecisorEmail(e.target.value)}
                        placeholder="Ex: joao@empresa.com"
                        className="h-8 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-4 bg-muted/30 p-4 rounded-lg border">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Histórico de Atividades
                  </h4>

                  <div className="space-y-3">
                    {historicoInteracoes.length > 0 ? (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                        {historicoInteracoes.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-background p-3 rounded border text-sm space-y-1"
                          >
                            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1 border-b border-muted pb-1">
                              <span className="font-semibold text-foreground">
                                {item.executivo_nome}
                              </span>
                              <span>{new Date(item.data).toLocaleString('pt-BR')}</span>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap">{item.texto}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma interação registrada.</p>
                    )}

                    <div className="space-y-2 pt-2 border-t border-muted">
                      <Textarea
                        value={novaInteracao}
                        onChange={(e) => setNovaInteracao(e.target.value)}
                        placeholder="Registre uma nova interação..."
                        className="resize-none h-20 text-sm bg-background"
                      />
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={handleRegistrarInteracao}
                        disabled={!novaInteracao.trim()}
                      >
                        Registrar Interação
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </ScrollArea>

          <div className="p-6 pt-4 border-t bg-slate-50 flex justify-end gap-2 shrink-0 rounded-b-lg">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={handleSaveLead} disabled={loading || !!error}>
              {existingLeadId ? 'Atualizar Lead Salvo' : 'Salvar em "Meus Leads"'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRefreshConfirm} onOpenChange={setShowRefreshConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar atualização</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente atualizar os dados desta empresa? Esta ação irá consumir 1 consulta
              do seu plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceRefresh}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
