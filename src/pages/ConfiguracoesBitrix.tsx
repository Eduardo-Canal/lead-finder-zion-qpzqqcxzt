import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import useAuthStore from '@/stores/useAuthStore'
import { Loader2, Settings2, CheckCircle2, XCircle, RefreshCw, Key, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { fetchBitrixKanbans, refreshBitrixKanbans, BitrixKanbanStage } from '@/services/bitrix'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function ConfiguracoesBitrix({ embedded = false }: { embedded?: boolean }) {
  const { user, hasPermission } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [allStages, setAllStages] = useState<BitrixKanbanStage[]>([])

  const [selectedEntityType, setSelectedEntityType] = useState<string>('DEAL')
  const [selectedKanban, setSelectedKanban] = useState<string>('')
  const [selectedStage, setSelectedStage] = useState<string>('')
  const [webhookUrl, setWebhookUrl] = useState<string>('')
  const [savingWebhook, setSavingWebhook] = useState(false)

  const normalizeBitrixStages = (stages: any[]): BitrixKanbanStage[] => {
    if (!stages || !Array.isArray(stages)) return []

    return stages
      .filter((stage) => stage && typeof stage === 'object')
      .map((stage) => {
        const rawEntityType = stage.ENTITY_TYPE || stage.entity_type
        const rawEntityId = stage.ENTITY_ID || stage.entity_id

        const rawCategoryId = String(stage.CATEGORY_ID ?? stage.category_id ?? '')

        const entityType = rawEntityType
          ? String(rawEntityType).toUpperCase()
          : rawEntityId && String(rawEntityId).toUpperCase().includes('DEAL_STAGE')
          ? 'DEAL'
          : rawEntityId === 'STATUS'
          ? 'LEAD'
          : rawCategoryId === 'LEAD'
          ? 'LEAD'
          : 'DEAL' // fallback

        const categoryId = String(stage.CATEGORY_ID ?? stage.category_id ?? (entityType === 'LEAD' ? 'LEAD' : '0'))
        const statusId = String(stage.STATUS_ID ?? stage.status_id ?? stage.ID ?? stage.id ?? '')
        const sort = String(stage.SORT ?? stage.sort ?? '0')
        const name = String(stage.NAME ?? stage.name ?? 'Sem nome')
        const id = String(stage.ID ?? stage.id ?? statusId)

        return {
          ID: id,
          NAME: name,
          CATEGORY_ID: categoryId,
          STATUS_ID: statusId,
          SORT: sort,
          ENTITY_ID: String(rawEntityId ?? ''),
          ENTITY_TYPE: entityType,
        }
      })
      .filter((stage) => stage.ID && stage.NAME) // Remove stages inválidas
  }

  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  useEffect(() => {
    if (!isAdmin) return

    const init = async () => {
      setLoading(true)
      try {
        // Fetch saved settings
        const { data: settingsData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'bitrix24_defaults')
          .maybeSingle()

        if (settingsData?.value) {
          const val = settingsData.value as any
          if (val.entity_type) setSelectedEntityType(val.entity_type)
          if (val.kanban_id) setSelectedKanban(val.kanban_id)
          if (val.stage_id) setSelectedStage(val.stage_id)
        }

        // Fetch webhook URL
        const { data: webhookData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'bitrix24_webhook_url')
          .maybeSingle()

        if (webhookData?.value) {
          setWebhookUrl(String(webhookData.value))
        }

        // Buscar kanbans direto da API Bitrix via rate limiter (bypass edge function com cache sem ENTITY_TYPE)
        const res = await refreshBitrixKanbans()
        if (res.success && res.data && res.data.length > 0) {
          const normalized = normalizeBitrixStages(res.data)

          const dealCount = normalized.filter(s => s.ENTITY_TYPE === 'DEAL').length
          const leadCount = normalized.filter(s => s.ENTITY_TYPE === 'LEAD').length
          console.log(`[Bitrix] Stages carregados: ${normalized.length} total (DEAL=${dealCount}, LEAD=${leadCount})`)

          setAllStages(normalized)
          setIsConnected(true)
        } else {
          setAllStages([])
          setIsConnected(false)
          toast.error(
            res.error
              ? `Erro Bitrix24: ${res.error}`
              : 'Não foi possível carregar os funis do Bitrix24.',
          )
        }
      } catch (_err) {
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [isAdmin])

  const kanbanList = useMemo(() => {
    if (!allStages || !Array.isArray(allStages)) return []

    const filteredStages = allStages.filter((s) => s && s.ENTITY_TYPE === selectedEntityType)
    const ids = new Set(filteredStages.map((s) => s.CATEGORY_ID).filter(Boolean))
    return Array.from(ids)
      .sort((a, b) => {
        if (a === 'LEAD') return -1
        if (b === 'LEAD') return 1
        return Number(a) - Number(b)
      })
      .map((id) => ({
        id: String(id),
        name: id === 'LEAD' ? 'Funil de Leads' : id === '0' ? 'Geral (Padrão)' : `Funil ${id}`,
      }))
  }, [allStages, selectedEntityType])

  useEffect(() => {
    const filteredStages = allStages.filter((s) => s.ENTITY_TYPE === selectedEntityType)
    const ids = Array.from(new Set(filteredStages.map((s) => s.CATEGORY_ID))).sort((a, b) => {
      if (a === 'LEAD') return -1
      if (b === 'LEAD') return 1
      return Number(a) - Number(b)
    })

    if (ids.length === 0) {
      setSelectedKanban('')
      setSelectedStage('')
      return
    }

    if (!ids.includes(selectedKanban)) {
      setSelectedKanban(ids[0])
    }
  }, [allStages, selectedEntityType, selectedKanban])

  const stageList = useMemo(() => {
    if (!selectedKanban || !allStages || !Array.isArray(allStages)) return []
    return allStages
      .filter((s) => s && s.CATEGORY_ID === selectedKanban && s.ENTITY_TYPE === selectedEntityType)
      .sort((a, b) => Number(a.SORT) - Number(b.SORT))
  }, [allStages, selectedKanban, selectedEntityType])

  useEffect(() => {
    if (stageList.length === 0) {
      setSelectedStage('')
      return
    }

    const currentStageExists = stageList.some((s) => (s.STATUS_ID || s.ID) === selectedStage)
    if (!currentStageExists) {
      setSelectedStage(stageList[0]?.STATUS_ID || stageList[0]?.ID || '')
    }
  }, [stageList, selectedStage])

  // Auto-select first stage if kanban or entity type changes and current stage is not in the new list
  useEffect(() => {
    if ((selectedKanban && stageList.length > 0) || selectedEntityType) {
      const exists = stageList.find((s) => s.STATUS_ID === selectedStage)
      if (!exists) {
        setSelectedStage(stageList[0]?.STATUS_ID || '')
      }
    }
  }, [selectedKanban, selectedEntityType, stageList, selectedStage])

  const handleSave = async () => {
    if (!selectedEntityType || !selectedKanban || !selectedStage) {
      toast.warning('Selecione o tipo de entidade, Kanban e Fase.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        entity_type: selectedEntityType,
        kanban_id: selectedKanban,
        stage_id: selectedStage,
      }

      const { error } = await supabase.from('settings').upsert(
        {
          key: 'bitrix24_defaults',
          value: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )

      if (error) throw error

      toast.success('Configurações do Bitrix24 salvas com sucesso!')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error('Erro ao salvar as configurações.')
    } finally {
      setSaving(false)
    }
  }

  const handleRefreshKanbans = async () => {
    setLoading(true)
    const res = await refreshBitrixKanbans()
    if (res.success && res.data) {
      const normalized = normalizeBitrixStages(res.data)
      setAllStages(normalized)
      setIsConnected(true)
      toast.success('Funil atualizado com sucesso!')
    } else {
      setAllStages([])
      setIsConnected(false)
      toast.error('Não foi possível atualizar o funil do Bitrix24.')
    }
    setLoading(false)
  }

  const handleRefreshConnection = async () => {
    setLoading(true)
    const res = await refreshBitrixKanbans()
    if (res.success && res.data) {
      const normalized = normalizeBitrixStages(res.data)
      setAllStages(normalized)
      setIsConnected(true)
      toast.success('Funil atualizado com sucesso!')
    } else {
      setAllStages([])
      setIsConnected(false)
      toast.error('Não foi possível atualizar o funil do Bitrix24.')
    }
    setLoading(false)
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        embedded
          ? 'space-y-6 animate-fade-in'
          : 'max-w-4xl mx-auto space-y-6 animate-fade-in pb-12',
      )}
    >
      {!embedded && (
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Integração Bitrix24</h2>
          <p className="text-muted-foreground mt-1">
            Configure a conexão e as regras de mapeamento de funil (CRM).
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> Webhook do Bitrix24
          </CardTitle>
          <CardDescription>
            URL do webhook REST para integracao com o Bitrix24. Obtenha em: Bitrix24 &gt; Aplicativos &gt; Developer resources &gt; Outros &gt; Webhooks de entrada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  type="password"
                  placeholder="https://seudominio.bitrix24.com.br/rest/ID/TOKEN/"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  disabled={savingWebhook || !webhookUrl.trim()}
                  onClick={async () => {
                    setSavingWebhook(true)
                    try {
                      // Garantir que termina com /
                      let url = webhookUrl.trim()
                      if (!url.endsWith('/')) url += '/'
                      setWebhookUrl(url)

                      const { error } = await supabase.from('settings').upsert(
                        { key: 'bitrix24_webhook_url', value: JSON.stringify(url), updated_at: new Date().toISOString() },
                        { onConflict: 'key' },
                      )
                      if (error) throw error
                      toast.success('Webhook URL salva com sucesso!')
                    } catch (err: any) {
                      toast.error('Erro ao salvar: ' + err.message)
                    } finally {
                      setSavingWebhook(false)
                    }
                  }}
                >
                  {savingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formato: https://seudominio.bitrix24.com.br/rest/ID_USUARIO/TOKEN_WEBHOOK/
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" /> Status da Integração
            </CardTitle>
            <CardDescription>
              Verifique se a comunicação com o Bitrix24 está funcionando corretamente.
            </CardDescription>
          </div>
          <div>
            {isConnected === null ? (
              <Badge variant="outline" className="animate-pulse">
                Verificando...
              </Badge>
            ) : isConnected ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200 gap-1 px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 px-3 py-1">
                <XCircle className="w-3.5 h-3.5" /> Desconectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshConnection} disabled={loading}>
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Testar Conexão Novamente
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefreshKanbans} disabled={loading}>
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Atualizar Funil
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funil de Vendas (CRM)</CardTitle>
          <CardDescription>
            Defina para qual Kanban e Fase os novos leads serão enviados por padrão ao sincronizar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Carregando configurações...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Tipo de Entidade</Label>
                  <Select
                    value={selectedEntityType}
                    onValueChange={setSelectedEntityType}
                    disabled={!isConnected}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEAD">Leads</SelectItem>
                      <SelectItem value="DEAL">Oportunidades (Deals)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Funil</Label>
                  <Select
                    value={selectedKanban}
                    onValueChange={setSelectedKanban}
                    disabled={!isConnected || !selectedEntityType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funil..." />
                    </SelectTrigger>
                    <SelectContent>
                      {kanbanList.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.name || 'Funil sem nome'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estágio Inicial</Label>
                  <Select
                    value={selectedStage}
                    onValueChange={setSelectedStage}
                    disabled={!isConnected || !selectedKanban}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estágio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stageList.map((s) => {
                        const stageValue = s.STATUS_ID || s.ID
                        return (
                          <SelectItem key={stageValue} value={stageValue}>
                            {s.NAME || 'Estágio sem nome'}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isConnected && kanbanList.length === 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                  API conectada, mas nenhum funil foi carregado para o tipo de entidade selecionado.
                  Verifique se a função de busca de kanbans está retornando `ENTITY_TYPE` ou `ENTITY_ID` corretamente.
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={saving || !isConnected}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Configuração
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
