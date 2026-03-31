import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import useLeadStore from '@/stores/useLeadStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Search, Building2, Briefcase, RefreshCw, MapPin, Target } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function InteligenciaZion() {
  const navigate = useNavigate()
  const { clearFilters, setAllFilters, addCnae } = useLeadStore()

  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filters, setFilters] = useState({
    cnae: '',
    uf: 'Todos',
    porte: 'Todos',
    segmento: 'Todos',
  })
  const [clients, setClients] = useState<any[]>([])
  const [analiseCnae, setAnaliseCnae] = useState<any[]>([])

  // Accordion state
  const [expandedCnae, setExpandedCnae] = useState<string>('')
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set())

  const loadData = async () => {
    setLoading(true)
    try {
      const [resClients, resAnalise] = await Promise.all([
        supabase
          .from('bitrix_clients_zion')
          .select('id, bitrix_id, company_name, cnpj, cnae_principal, curva_abc, state, segmento'),
        supabase.from('analise_cnae').select('*'),
      ])

      setClients(resClients.data || [])
      setAnaliseCnae(resAnalise.data || [])
    } catch (e) {
      console.error('Error loading intelligence data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Clear selections when changing expanded CNAE
  useEffect(() => {
    setSelectedCompanyIds(new Set())
  }, [expandedCnae])

  const handleSyncData = async () => {
    try {
      setSyncing(true)
      toast.loading('Sincronizando clientes do Bitrix24...', { id: 'sync-bitrix' })

      const { data, error } = await supabase.functions.invoke('fetch-bitrix-clients-zion', {
        method: 'POST',
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido ao sincronizar')

      toast.loading('Calculando insights estratégicos...', { id: 'sync-bitrix' })
      await supabase.functions.invoke('calculate-carteira-insights', {
        method: 'POST',
      })

      toast.success(`Sincronização concluída! ${data.total_clients || 0} clientes atualizados.`, {
        id: 'sync-bitrix',
      })
      await loadData()
    } catch (err: any) {
      console.error('Sync error:', err)
      toast.error(`Erro ao sincronizar: ${err.message}`, { id: 'sync-bitrix' })
    } finally {
      setSyncing(false)
    }
  }

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (filters.uf !== 'Todos' && c.state !== filters.uf) return false
      if (filters.segmento !== 'Todos' && c.segmento !== filters.segmento) return false
      if (filters.cnae && !c.cnae_principal?.includes(filters.cnae)) return false
      return true
    })
  }, [clients, filters])

  const topCnaes = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredClients.forEach((c) => {
      if (c.cnae_principal) {
        counts[c.cnae_principal] = (counts[c.cnae_principal] || 0) + 1
      }
    })

    return Object.entries(counts)
      .map(([cnae, count]) => {
        const info = analiseCnae.find((a) => a.cnae === cnae)
        return { cnae, count, nome: info?.nome_cnae || 'Setor não identificado' }
      })
      .sort((a, b) => b.count - a.count)
  }, [filteredClients, analiseCnae])

  const expandedCnaeClients = useMemo(() => {
    if (!expandedCnae) return []
    return filteredClients.filter(
      (c) => c.cnae_principal === expandedCnae || c.cnae_principal?.includes(expandedCnae),
    )
  }, [filteredClients, expandedCnae])

  const toggleCompany = (id: string) => {
    const newSet = new Set(selectedCompanyIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedCompanyIds(newSet)
  }

  const toggleAll = () => {
    if (selectedCompanyIds.size === expandedCnaeClients.length) {
      setSelectedCompanyIds(new Set())
    } else {
      setSelectedCompanyIds(new Set(expandedCnaeClients.map((c) => c.id)))
    }
  }

  const handleProspectar = () => {
    if (!expandedCnae) return

    const selected = expandedCnaeClients.filter((c) => selectedCompanyIds.has(c.id))
    const ufs = Array.from(new Set(selected.map((c) => c.state).filter(Boolean)))

    clearFilters()
    addCnae(expandedCnae)

    if (ufs.length > 0) {
      setAllFilters({ ufs })
    }

    toast.success(`${selected.length} empresas usadas como referência. Filtros aplicados!`)
    navigate('/prospeccao')
  }

  const getCurvaBadgeColor = (curva: string) => {
    const c = (curva || '').toUpperCase()
    if (c.includes('A'))
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
    if (c.includes('B'))
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
    if (c.includes('C'))
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
    return 'bg-muted text-muted-foreground border-border'
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Analisando inteligência da carteira...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 h-[calc(100vh-4rem)] flex flex-col overflow-y-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Pré-Filtro Visual: Clientes Zion
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore sua carteira de clientes do Bitrix24 por setor e selecione os melhores perfis
            para prospecção.
          </p>
        </div>
        <Button onClick={handleSyncData} disabled={syncing || loading} className="gap-2 shrink-0">
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sincronizar Dados
        </Button>
      </div>

      {!loading && clients.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center border rounded-xl bg-muted/20 border-dashed py-12 px-4 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold text-foreground">Nenhum dado encontrado</h3>
          <p className="text-muted-foreground max-w-md mt-2 mb-6">
            A sua base de inteligência está vazia. Clique no botão de sincronização para buscar os
            clientes ativos no Bitrix24 e gerar a análise da carteira.
          </p>
          <Button onClick={handleSyncData} disabled={syncing}>
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Iniciar Primeira Sincronização
          </Button>
        </div>
      )}

      {clients.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0 bg-muted/20 p-4 rounded-xl border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por CNAE..."
                className="pl-9 bg-background"
                value={filters.cnae}
                onChange={(e) => setFilters((f) => ({ ...f, cnae: e.target.value }))}
              />
            </div>
            <Select
              value={filters.uf}
              onValueChange={(val) => setFilters((f) => ({ ...f, uf: val }))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Estado (UF)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas as UFs</SelectItem>
                <SelectItem value="SP">São Paulo</SelectItem>
                <SelectItem value="MG">Minas Gerais</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                <SelectItem value="PR">Paraná</SelectItem>
                <SelectItem value="SC">Santa Catarina</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.segmento}
              onValueChange={(val) => setFilters((f) => ({ ...f, segmento: val }))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Segmentos</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Varejo">Varejo</SelectItem>
                <SelectItem value="Indústria">Indústria</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.porte}
              onValueChange={(val) => setFilters((f) => ({ ...f, porte: val }))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Porte da Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Qualquer Porte</SelectItem>
                <SelectItem value="MEI">MEI</SelectItem>
                <SelectItem value="ME">Microempresa (ME)</SelectItem>
                <SelectItem value="EPP">Pequena Empresa (EPP)</SelectItem>
                <SelectItem value="MEDIO">Média Empresa</SelectItem>
                <SelectItem value="GRANDE">Grande Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="flex-1 flex flex-col min-h-0 border-primary/10 shadow-md">
            <CardHeader className="pb-3 shrink-0 bg-muted/30 border-b">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Top CNAEs da Carteira
                </span>
                <Badge variant="outline" className="font-normal">
                  {topCnaes.length} Setores encontrados
                </Badge>
              </CardTitle>
              <CardDescription>
                Clique em um setor para expandir os clientes, analisar a curva ABC e selecioná-los
                como referência para prospecção.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {topCnaes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                      Nenhum CNAE encontrado para os filtros atuais.
                    </div>
                  ) : (
                    <Accordion
                      type="single"
                      collapsible
                      value={expandedCnae}
                      onValueChange={setExpandedCnae}
                      className="space-y-4"
                    >
                      {topCnaes.map((t) => (
                        <AccordionItem
                          value={t.cnae}
                          key={t.cnae}
                          className="border rounded-xl px-2 bg-card shadow-sm transition-all hover:border-primary/40 data-[state=open]:border-primary/60 data-[state=open]:shadow-md overflow-hidden"
                        >
                          <AccordionTrigger className="hover:no-underline py-4 px-2 group">
                            <div className="flex flex-1 items-center justify-between text-left pr-4">
                              <div className="flex flex-col gap-1 min-w-0 pr-4">
                                <span className="font-semibold text-base truncate block text-foreground group-hover:text-primary transition-colors">
                                  {t.nome}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5" />
                                  {t.cnae}
                                </span>
                              </div>
                              <Badge variant="secondary" className="shrink-0 text-sm py-1 h-7">
                                {t.count} clientes
                              </Badge>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="pt-2 pb-4 px-2">
                            <div className="bg-muted/20 rounded-xl p-4 border flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                                <div className="space-y-1">
                                  <h4 className="font-medium text-sm flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-500" />
                                    Empresas associadas a este CNAE
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    Selecione as empresas que representam o seu Perfil de Cliente
                                    Ideal (ICP).
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 bg-background border p-1.5 rounded-lg shadow-sm">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs font-medium"
                                    onClick={toggleAll}
                                  >
                                    {selectedCompanyIds.size === expandedCnaeClients.length &&
                                    expandedCnaeClients.length > 0
                                      ? 'Desmarcar Todos'
                                      : 'Selecionar Todos'}
                                  </Button>
                                  <div className="w-px h-6 bg-border mx-1"></div>
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                    disabled={selectedCompanyIds.size === 0}
                                    onClick={handleProspectar}
                                  >
                                    <Search className="w-3.5 h-3.5 mr-1.5" />
                                    Usar como Referência ({selectedCompanyIds.size})
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {expandedCnaeClients.map((client) => (
                                  <label
                                    key={client.id}
                                    htmlFor={`client-${client.id}`}
                                    className={cn(
                                      'flex items-start space-x-3 p-3 border rounded-lg bg-background cursor-pointer transition-all duration-200',
                                      selectedCompanyIds.has(client.id)
                                        ? 'border-primary shadow-sm ring-1 ring-primary/20 bg-primary/5'
                                        : 'hover:border-primary/40 hover:bg-muted/50',
                                    )}
                                  >
                                    <Checkbox
                                      id={`client-${client.id}`}
                                      checked={selectedCompanyIds.has(client.id)}
                                      onCheckedChange={() => toggleCompany(client.id)}
                                      className="mt-1"
                                    />
                                    <div className="grid gap-1.5 leading-none flex-1 min-w-0">
                                      <div
                                        className="font-medium text-sm leading-snug truncate text-foreground"
                                        title={client.company_name}
                                      >
                                        {client.company_name || 'Empresa sem nome'}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            'text-[10px] h-5 px-1.5 font-semibold',
                                            getCurvaBadgeColor(client.curva_abc),
                                          )}
                                        >
                                          Curva {client.curva_abc || 'N/D'}
                                        </Badge>
                                        <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                                          {client.cnpj || 'S/ CNPJ'}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {client.state || 'S/ UF'}
                                        </span>
                                      </div>
                                    </div>
                                  </label>
                                ))}
                                {expandedCnaeClients.length === 0 && (
                                  <div className="col-span-full text-center py-8 text-sm text-muted-foreground bg-background rounded-lg border border-dashed">
                                    Nenhuma empresa encontrada para este setor após aplicar os
                                    filtros.
                                  </div>
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
