import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Settings2, RefreshCw, Clock3, History, ExternalLink, Building2, Clock, AlertTriangle, CheckCircle, XCircle, Pencil } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import useAuthStore from '@/stores/useAuthStore'
import {
  loadContaAzulConfig,
  saveContaAzulConfig,
  loadCurveThresholds,
  saveCurveThresholds,
  loadOracleTiers,
  saveOracleTiers,
  loadAbcHistory,
} from '@/services/curvaAbc'

const initialCurveConfig = {
  mode: 'fixo',
  a_plus_min: 4000,
  a_min: 2500,
  b_min: 1000,
  c_min: 0,
}

const defaultOracleTiers = [
  { porte: 'pequeno', custo_mensal: 100 },
  { porte: 'medio', custo_mensal: 300 },
  { porte: 'grande', custo_mensal: 800 },
]

const pieColors = ['#0f766e', '#16a34a', '#f59e0b', '#ef4444']

const getCurvaAbcLabel = (code: string | null | undefined): string => {
  switch (String(code ?? '').trim()) {
    case '7592': case 'A+': return 'A+'
    case '7594': case 'A':  return 'A'
    case '7596': case 'B':  return 'B'
    case '7598': case 'C':  return 'C'
    default: return 'Não classificado'
  }
}

export default function CurvaAbc() {
  const { user, hasPermission } = useAuthStore()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  const [activeTab, setActiveTab] = useState('recalcular')
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)

  const [diffRows, setDiffRows] = useState<any[]>([])
  const [historyRows, setHistoryRows] = useState<any[]>([])
  const [clientList, setClientList] = useState<any[]>([])
  const [clientListLoading, setClientListLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showFontesDialog, setShowFontesDialog] = useState(false)
  const [editCnpjClient, setEditCnpjClient] = useState<any>(null)
  const [cnpjInput, setCnpjInput] = useState('')
  const [savingCnpj, setSavingCnpj] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [drawerSource, setDrawerSource] = useState<'contaazul' | 'oracle' | null>(null)
  const [drawerData, setDrawerData] = useState<any>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [curveConfig, setCurveConfig] = useState<any>(initialCurveConfig)
  const [oracleTiers, setOracleTiers] = useState(defaultOracleTiers)
  const [contaAzulConfig, setContaAzulConfig] = useState<any>({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    testUser: '',
    testPass: '',
  })
  const [divergencias, setDivergencias] = useState<any[]>([])
  const [divergenciasLoading, setDivergenciasLoading] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>('')

  useEffect(() => {
    if (!isAdmin) return

    const loadConfig = async () => {
      setConfigLoading(true)
      try {
        const accountConfig = await loadContaAzulConfig()
        const thresholds = await loadCurveThresholds()
        const tiers = await loadOracleTiers()
        setContaAzulConfig(accountConfig)
        setCurveConfig(thresholds)
        setOracleTiers(tiers)
      } catch (error) {
        console.error('Erro ao carregar configuração da Curva ABC:', error)
        toast.error('Falha ao carregar configurações. Tente novamente.')
      } finally {
        setConfigLoading(false)
      }
    }

    loadConfig()
    ;(async () => {
      setHistoryLoading(true)
      try {
        setHistoryRows(await loadAbcHistory())
      } catch (error) {
        console.error(error)
      } finally {
        setHistoryLoading(false)
      }
    })()
  }, [isAdmin])

  const loadClientList = async () => {
    setClientListLoading(true)
    try {
      const { data: clients } = await supabase
        .from('bitrix_clients_zion')
        .select('id,company_name,cnpj,porte,mrr,curva_abc_calculada')
        .not('cnpj', 'is', null)
        .order('company_name', { ascending: true })

      const { data: caches } = await supabase
        .from('contaazul_cache')
        .select('cnpj,mrr,atualizado_em,sincronizado_por_nome')

      const cacheMap = new Map((caches ?? []).map((c: any) => [c.cnpj?.replace(/\D/g, ''), c]))

      setClientList(
        (clients ?? []).map((c: any) => {
          const cnpjClean = c.cnpj?.replace(/\D/g, '')
          const cache = cacheMap.get(cnpjClean)
          return { ...c, temContaAzul: !!cache, ultimoSync: cache?.atualizado_em, syncPor: cache?.sincronizado_por_nome }
        }),
      )
    } catch (err) {
      console.error(err)
    } finally {
      setClientListLoading(false)
    }
  }

  const loadDivergencias = async () => {
    setDivergenciasLoading(true)
    try {
      const { data } = await supabase
        .from('cnpj_divergencias')
        .select('*')
        .eq('status', 'pendente')
        .order('detectado_em', { ascending: false })
      setDivergencias(data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setDivergenciasLoading(false)
    }
  }

  const handleResolveDivergencia = async (id: string, action: 'aprovar' | 'rejeitar') => {
    setResolvingId(id)
    try {
      const response = await supabase.functions.invoke('resolve-cnpj-divergence', {
        body: { divergencia_id: id, action, user_id: user?.id, user_name: user?.nome || user?.email },
      })
      if (response.error || !response.data?.success) {
        throw new Error(response.error?.message || response.data?.message || 'Falha ao resolver divergência')
      }
      toast.success(action === 'aprovar' ? 'CNPJ atualizado com sucesso.' : 'Divergência rejeitada.')
      setDivergencias(prev => prev.filter(d => d.id !== id))
      if (action === 'aprovar') loadClientList()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resolver divergência.')
    } finally {
      setResolvingId(null)
    }
  }

  const handleSetCnpj = async () => {
    if (!editCnpjClient || !cnpjInput.trim()) return
    setSavingCnpj(true)
    try {
      const response = await supabase.functions.invoke('set-client-cnpj', {
        body: {
          bitrix_id: editCnpjClient.bitrix_id,
          cnpj: cnpjInput.trim(),
          user_id: user?.id,
          user_name: user?.nome || user?.email,
        },
      })
      if (response.error || !response.data?.success) {
        throw new Error(response.error?.message || response.data?.message || 'Falha ao definir CNPJ')
      }
      toast.success(response.data.message)
      setEditCnpjClient(null)
      setCnpjInput('')
      loadClientList()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao definir CNPJ.')
    } finally {
      setSavingCnpj(false)
    }
  }

  const handleOpenDrawer = async (client: any, source: 'contaazul' | 'oracle') => {
    setSelectedClient(client)
    setDrawerSource(source)
    setDrawerData(null)
    setDrawerLoading(true)

    try {
      const cnpjClean = client.cnpj?.replace(/\D/g, '')
      if (source === 'contaazul') {
        const { data } = await supabase
          .from('contaazul_cache')
          .select('*')
          .eq('cnpj', cnpjClean)
          .maybeSingle()
        setDrawerData(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDrawerLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadClientList()
      loadDivergencias()
    }
  }, [isAdmin])

  const handleFetchAndCalculate = async () => {
    setLoading(true)
    try {
      const fetchResponse = await supabase.functions.invoke('fetch-mrr', {
        body: { user_id: user?.id, user_name: user?.nome || user?.email },
      })
      if (fetchResponse.error || !fetchResponse.data?.success) {
        throw new Error(fetchResponse.error?.message || fetchResponse.data?.message || 'Falha ao buscar MRR')
      }

      const calculateResponse = await supabase.functions.invoke('calculate-abc', { body: {} })
      if (calculateResponse.error || !calculateResponse.data?.success) {
        throw new Error(calculateResponse.error?.message || calculateResponse.data?.message || 'Falha ao calcular Curva ABC')
      }

      setDiffRows(calculateResponse.data?.rows ?? calculateResponse.data ?? [])
      toast.success('Dados de MRR e Curva ABC atualizados para revisão.')
      setActiveTab('recalcular')
      loadClientList()
      loadDivergencias()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao atualizar dados da Curva ABC.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmUpdate = async () => {
    if (!diffRows.length) {
      toast.warning('Não há alterações para confirmar.')
      return
    }

    setUpdating(true)
    try {
      const response = await supabase.functions.invoke('update-bitrix', { body: { rows: diffRows } })
      if (response.error || !response.data?.success) {
        throw new Error(response.error?.message || response.data?.message || 'Falha ao enviar atualização para Bitrix')
      }

      toast.success('Atualização enviada ao Bitrix e histórico registrado.')
      setDiffRows([])
      setHistoryRows(await loadAbcHistory())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Erro ao confirmar atualização no Bitrix.')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      await saveContaAzulConfig(contaAzulConfig)
      await saveCurveThresholds(curveConfig)
      await saveOracleTiers(oracleTiers)
      toast.success('Configuração salva com sucesso.')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Falha ao salvar configurações. Verifique o console.')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    try {
      const response = await supabase.functions.invoke('auth-contaazul', { body: { action: 'validate' } })
      if (response.error || !response.data?.success) {
        throw new Error(response.error?.message || response.data?.message || 'Falha na validação.')
      }
      setConnectionStatus('Conexão valida. As credenciais foram registradas corretamente.')
      toast.success('Configuração Conta Azul validada.')
    } catch (error: any) {
      console.error(error)
      setConnectionStatus('Falha ao validar a conexão. Verifique as credenciais.')
      toast.error(error.message || 'Falha ao testar conexão Conta Azul.')
    } finally {
      setTestingConnection(false)
    }
  }

  const groupedHistory = useMemo(() => {
    const map = new Map<string, number>()
    historyRows.forEach((item) => {
      const date = new Date(item.data).toLocaleDateString('pt-BR')
      map.set(date, (map.get(date) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [historyRows])

  const pieData = useMemo(() => {
    const counts = { 'A+': 0, A: 0, B: 0, C: 0 }
    historyRows.forEach((item) => {
      const curve = item.curva_nova || 'C'
      counts[curve] = (counts[curve] ?? 0) + 1
    })
    return [
      { name: 'A+', value: counts['A+'] },
      { name: 'A', value: counts['A'] },
      { name: 'B', value: counts['B'] },
      { name: 'C', value: counts['C'] },
    ]
  }, [historyRows])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">Somente administradores podem acessar o painel de Curva ABC.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Curva ABC Financeira</h2>
        <p className="text-muted-foreground mt-1">
          Calcule a curva ABC com base em MRR Conta Azul, custos de Oracle e atualize o campo no Bitrix24.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-4xl gap-2">
          <TabsTrigger value="recalcular" className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Recalcular
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center justify-center gap-2">
            <History className="w-4 h-4" /> Histórico
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center justify-center gap-2">
            <Settings2 className="w-4 h-4" /> Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recalcular" className="space-y-6">
          {/* Ações principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Recalcular Curva ABC</CardTitle>
              <CardDescription>
                Busque o MRR em Conta Azul, calcule a curva com base nos custos configurados e revise antes de atualizar Bitrix.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="font-medium">Fluxo de execução</p>
                  <p className="text-sm text-muted-foreground">
                    1. Buscar MRR 2. Calcular curva 3. Revisar diferenças 4. Confirmar atualização no Bitrix.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={handleFetchAndCalculate} disabled={loading}>
                    {loading ? 'Buscando e calculando...' : 'Buscar Dados'}
                  </Button>
                  <Button variant="secondary" onClick={handleConfirmUpdate} disabled={updating || diffRows.length === 0}>
                    {updating ? 'Confirmando...' : 'Confirmar atualização'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowFontesDialog(true)}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Fontes de Dados
                  </Button>
                </div>
              </div>

              {diffRows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Cliente / CNPJ</th>
                        <th className="px-4 py-3">MRR</th>
                        <th className="px-4 py-3">Custo Tier</th>
                        <th className="px-4 py-3">Margem</th>
                        <th className="px-4 py-3">Curva Atual</th>
                        <th className="px-4 py-3">Curva Nova</th>
                        <th className="px-4 py-3">Mudança</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {diffRows.map((item, index) => (
                        <tr key={`${item.cnpj}-${index}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{item.company_name || 'Cliente não identificado'}</div>
                            <div className="text-xs text-slate-500">{item.cnpj}</div>
                          </td>
                          <td className="px-4 py-3">{Number(item.mrr ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                          <td className="px-4 py-3">{Number(item.custo_infra ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                          <td className="px-4 py-3">{Number(item.margem_liquida ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                          <td className="px-4 py-3">{getCurvaAbcLabel(item.curva_abc)}</td>
                          <td className="px-4 py-3">{item.curva_abc_calculada || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={item.mudanca === 'subiu' ? 'success' : item.mudanca === 'desceu' ? 'destructive' : 'secondary'}>
                              {item.mudanca === 'subiu' ? 'Subiu' : item.mudanca === 'desceu' ? 'Desceu' : 'Manteve'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Divergências de CNPJ pendentes */}
          {(divergenciasLoading || divergencias.length > 0) && (
            <Card className="border-amber-200 bg-amber-50/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Divergências de CNPJ — Revisão Necessária
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Clientes encontrados no Conta Azul com CNPJ diferente do cadastrado no Bitrix.
                  O Conta Azul é a fonte financeira oficial — autorize a atualização para corrigir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {divergenciasLoading ? (
                  <div className="flex items-center gap-2 text-amber-700 py-2">
                    <Clock3 className="h-4 w-4 animate-spin" /> Carregando divergências...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {divergencias.map((div) => (
                      <div key={div.id} className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-800">{div.company_name}</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                              <span>
                                <span className="text-slate-500">CNPJ Bitrix: </span>
                                <span className="font-mono text-red-600">{div.cnpj_bitrix || '—'}</span>
                              </span>
                              <span>
                                <span className="text-slate-500">CNPJ Conta Azul: </span>
                                <span className="font-mono text-emerald-700 font-medium">{div.cnpj_contaazul}</span>
                              </span>
                              {div.nome_contaazul && div.nome_contaazul !== div.company_name && (
                                <span>
                                  <span className="text-slate-500">Nome no CA: </span>
                                  <span className="text-slate-700">{div.nome_contaazul}</span>
                                </span>
                              )}
                              <span>
                                <span className="text-slate-500">MRR: </span>
                                <span className="font-semibold text-emerald-700">
                                  {Number(div.mrr ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Detectado em {new Date(div.detectado_em).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              disabled={resolvingId === div.id}
                              onClick={() => handleResolveDivergencia(div.id, 'rejeitar')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={resolvingId === div.id}
                              onClick={() => handleResolveDivergencia(div.id, 'aprovar')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {resolvingId === div.id ? 'Atualizando...' : 'Autorizar atualização'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dialog definir CNPJ */}
          <Dialog open={!!editCnpjClient} onOpenChange={(open) => { if (!open) { setEditCnpjClient(null); setCnpjInput('') } }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" /> Definir CNPJ
                </DialogTitle>
                <DialogDescription>
                  {editCnpjClient?.company_name} — informe o CNPJ que será gravado localmente e enviado ao Bitrix.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 space-y-4">
                <div>
                  <Label htmlFor="cnpj-input" className="text-sm font-medium">CNPJ</Label>
                  <Input
                    id="cnpj-input"
                    placeholder="00.000.000/0000-00"
                    value={cnpjInput}
                    onChange={e => setCnpjInput(e.target.value)}
                    className="mt-1 font-mono"
                    onKeyDown={e => { if (e.key === 'Enter') handleSetCnpj() }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setEditCnpjClient(null); setCnpjInput('') }}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSetCnpj}
                    disabled={savingCnpj || !cnpjInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {savingCnpj ? 'Salvando...' : 'Salvar e enviar ao Bitrix'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Fontes de Dados */}
          <Dialog open={showFontesDialog} onOpenChange={(open) => { setShowFontesDialog(open); if (!open) setClientSearch('') }}>
            <DialogContent className="max-w-4xl w-full max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" /> Clientes e Fontes de Dados
                </DialogTitle>
                <DialogDescription>
                  Clique em "Conta Azul" para visualizar os dados sincronizados de cada cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por nome ou CNPJ..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {clientSearch && (
                    <button
                      onClick={() => setClientSearch('')}
                      className="text-xs text-slate-400 hover:text-slate-700"
                    >
                      Limpar
                    </button>
                  )}
                  <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
                    {clientList.filter(c =>
                      !clientSearch ||
                      c.company_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                      (c.cnpj?.replace(/\D/g, '') || '').includes(clientSearch.replace(/\D/g, ''))
                    ).length} de {clientList.length} clientes
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={loadClientList} disabled={clientListLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${clientListLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto mt-2">
                {clientListLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-6">
                    <Clock3 className="h-4 w-4 animate-spin" /> Carregando clientes...
                  </div>
                ) : clientList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                    Nenhum cliente com CNPJ encontrado. Sincronize o Bitrix24 primeiro.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">CNPJ</th>
                          <th className="px-4 py-3">MRR</th>
                          <th className="px-4 py-3">Curva ABC</th>
                          <th className="px-4 py-3">Conta Azul</th>
                          <th className="px-4 py-3">Oracle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {clientList.filter(c =>
                          !clientSearch ||
                          c.company_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          (c.cnpj?.replace(/\D/g, '') || '').includes(clientSearch.replace(/\D/g, ''))
                        ).map((client) => (
                          <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium">{client.company_name || '—'}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                              {client.cnpj ? (
                                client.cnpj
                              ) : (
                                <button
                                  onClick={() => { setEditCnpjClient(client); setCnpjInput('') }}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 hover:underline"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Definir CNPJ
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {client.mrr != null
                                ? Number(client.mrr).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : <span className="text-slate-400 text-xs">Não sincronizado</span>}
                            </td>
                            <td className="px-4 py-3">
                              {client.curva_abc_calculada
                                ? <Badge variant="outline">{client.curva_abc_calculada}</Badge>
                                : <span className="text-slate-400 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => { setShowFontesDialog(false); handleOpenDrawer(client, 'contaazul') }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {client.temContaAzul ? 'Ver dados' : 'Sem dados'}
                              </button>
                              {client.ultimoSync && (
                                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {new Date(client.ultimoSync).toLocaleString('pt-BR')}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs text-slate-400 border-slate-200">
                                Em breve
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Drawer de detalhes Conta Azul */}
          <Sheet open={drawerSource === 'contaazul' && selectedClient !== null} onOpenChange={(open) => { if (!open) { setSelectedClient(null); setDrawerSource(null) } }}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" /> Conta Azul — {selectedClient?.company_name}
                </SheetTitle>
                <SheetDescription>
                  Dados sincronizados da API do Conta Azul para este cliente.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {drawerLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4 animate-spin" /> Carregando...
                  </div>
                ) : !drawerData ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                    Nenhum dado sincronizado para este cliente. Execute "Buscar Dados" para sincronizar.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-xs text-slate-500 mb-1">Cliente</p>
                        <p className="font-medium">{drawerData.nome_cliente || '—'}</p>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="text-xs text-slate-500 mb-1">MRR (Prazo Indeterminado)</p>
                        <p className="font-semibold text-emerald-700">
                          {Number(drawerData.mrr ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Contratos com periodicidade NUNCA</p>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-3 col-span-2">
                        <p className="text-xs text-slate-500 mb-1">Última sincronização</p>
                        <p className="font-medium">
                          {drawerData.atualizado_em
                            ? new Date(drawerData.atualizado_em).toLocaleString('pt-BR')
                            : '—'}
                          {drawerData.sincronizado_por_nome && (
                            <span className="text-slate-500 ml-2">por {drawerData.sincronizado_por_nome}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-2">Contratos / Serviços</p>
                      {!drawerData.contratos || drawerData.contratos.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                          Nenhum contrato recorrente encontrado.
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                              <tr>
                                <th className="px-3 py-2 text-left">Descrição</th>
                                <th className="px-3 py-2 text-left">Valor</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-left">Periodicidade</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {drawerData.contratos.map((c: any, i: number) => {
                                const contaMrr = c.ativo && c.periodicidade === 'NUNCA'
                                return (
                                <tr key={c.id || i} className={contaMrr ? 'bg-emerald-50 hover:bg-emerald-100' : 'hover:bg-slate-50 opacity-60'}>
                                  <td className="px-3 py-2">
                                    <span>{c.descricao || '—'}</span>
                                    {contaMrr && <span className="ml-2 text-xs font-medium text-emerald-600">MRR</span>}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-emerald-700">
                                    {Number(c.valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge variant={c.status === 'ATIVO' ? 'default' : 'secondary'} className="text-xs">
                                      {c.status || '—'}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 text-slate-500">{c.periodicidade || '—'}</td>
                                </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mudanças</CardTitle>
              <CardDescription>
                Visualize a evolução das mudanças de curva ABC e a distribuição das classificações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4 animate-spin" /> Carregando histórico...
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Mudanças por Dia</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={groupedHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `${value}`} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Distribuição por Curva</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={50} label>
                          {pieData.map((entry, index) => (
                            <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-blue-200/50 dark:border-blue-900/50">
              <CardHeader>
                <CardTitle>Últimas alterações</CardTitle>
                <CardDescription>As últimas 50 entradas no histórico de curva ABC.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {historyRows.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                    Nenhum registro de histórico encontrado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyRows.slice(0, 8).map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">{item.cliente_cnpj}</p>
                            <p className="text-sm text-slate-500">{new Date(item.data).toLocaleString('pt-BR')}</p>
                          </div>
                          <Badge variant={item.mudanca === 'subiu' ? 'success' : item.mudanca === 'desceu' ? 'destructive' : 'secondary'}>
                            {item.mudanca || 'manteve'}
                          </Badge>
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                          {item.curva_anterior || 'N/A'} → {item.curva_nova || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Conta Azul</CardTitle>
              <CardDescription>Informe as credenciais e teste a validação da integração.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="clientId">CLIENT_ID</Label>
                  <Input
                    id="clientId"
                    value={contaAzulConfig.clientId}
                    onChange={(e) => setContaAzulConfig({ ...contaAzulConfig, clientId: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="clientSecret">CLIENT_SECRET</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={contaAzulConfig.clientSecret}
                    onChange={(e) => setContaAzulConfig({ ...contaAzulConfig, clientSecret: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="redirectUri">REDIRECT_URI</Label>
                  <Input
                    id="redirectUri"
                    value={contaAzulConfig.redirectUri}
                    onChange={(e) => setContaAzulConfig({ ...contaAzulConfig, redirectUri: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="testUser">TEST_USER</Label>
                  <Input
                    id="testUser"
                    value={contaAzulConfig.testUser}
                    onChange={(e) => setContaAzulConfig({ ...contaAzulConfig, testUser: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="testPass">TEST_PASS</Label>
                  <Input
                    id="testPass"
                    type="password"
                    value={contaAzulConfig.testPass}
                    onChange={(e) => setContaAzulConfig({ ...contaAzulConfig, testPass: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">Salve as credenciais para permitir a autenticação e caching do Conta Azul.</p>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Button variant="secondary" onClick={handleTestConnection} disabled={testingConnection || savingConfig}>
                    {testingConnection ? 'Testando...' : 'Testar conexão'}
                  </Button>
                  <Button onClick={handleSaveConfig} disabled={savingConfig || configLoading}>
                    {savingConfig ? 'Salvando...' : 'Salvar Configuração'}
                  </Button>
                </div>
              </div>
              {connectionStatus && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{connectionStatus}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiers Oracle</CardTitle>
              <CardDescription>Defina o custo mensal para cada tier de infraestrutura.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-3">
              {oracleTiers.map((tier, index) => (
                <div key={tier.porte} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold capitalize">{tier.porte}</p>
                  <Input
                    type="number"
                    value={tier.custo_mensal ?? 0}
                    onChange={(e) => {
                      const next = [...oracleTiers]
                      next[index].custo_mensal = Number(e.target.value)
                      setOracleTiers(next)
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Faixas ABC</CardTitle>
              <CardDescription>Configure os limites financeiros usados para classificar A+/A/B/C.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div>
                <Label htmlFor="mode">Modo</Label>
                <Input
                  id="mode"
                  value={curveConfig.mode}
                  onChange={(e) => setCurveConfig({ ...curveConfig, mode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="aPlusMin">A+ (min)</Label>
                <Input
                  id="aPlusMin"
                  type="number"
                  value={curveConfig.a_plus_min}
                  onChange={(e) => setCurveConfig({ ...curveConfig, a_plus_min: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="aMin">A (min)</Label>
                <Input
                  id="aMin"
                  type="number"
                  value={curveConfig.a_min}
                  onChange={(e) => setCurveConfig({ ...curveConfig, a_min: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="bMin">B (min)</Label>
                <Input
                  id="bMin"
                  type="number"
                  value={curveConfig.b_min}
                  onChange={(e) => setCurveConfig({ ...curveConfig, b_min: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="cMin">C (min)</Label>
                <Input
                  id="cMin"
                  type="number"
                  value={curveConfig.c_min}
                  onChange={(e) => setCurveConfig({ ...curveConfig, c_min: Number(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
