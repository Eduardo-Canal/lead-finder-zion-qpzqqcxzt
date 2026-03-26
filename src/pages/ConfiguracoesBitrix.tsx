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
import { Loader2, Settings2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { fetchBitrixKanbans, BitrixKanbanStage } from '@/services/bitrix'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function ConfiguracoesBitrix({ embedded = false }: { embedded?: boolean }) {
  const { user, hasPermission } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [allStages, setAllStages] = useState<BitrixKanbanStage[]>([])

  const [selectedKanban, setSelectedKanban] = useState<string>('')
  const [selectedStage, setSelectedStage] = useState<string>('')

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
          if (val.kanban_id) setSelectedKanban(val.kanban_id)
          if (val.stage_id) setSelectedStage(val.stage_id)
        }

        // Fetch kanbans
        const res = await fetchBitrixKanbans()
        if (res.success && res.data) {
          setAllStages(res.data)
          setIsConnected(true)
        } else {
          setIsConnected(false)
          toast.error('Não foi possível conectar à API do Bitrix24.')
        }
      } catch (err) {
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [isAdmin])

  const kanbanList = useMemo(() => {
    const ids = new Set(allStages.map((s) => s.CATEGORY_ID))
    return Array.from(ids)
      .sort((a, b) => Number(a) - Number(b))
      .map((id) => ({
        id,
        name: id === '0' ? 'Geral (Padrão)' : `Funil ${id}`,
      }))
  }, [allStages])

  const stageList = useMemo(() => {
    if (!selectedKanban) return []
    return allStages
      .filter((s) => s.CATEGORY_ID === selectedKanban)
      .sort((a, b) => Number(a.SORT) - Number(b.SORT))
  }, [allStages, selectedKanban])

  // Auto-select first stage if kanban changes and current stage is not in the new list
  useEffect(() => {
    if (selectedKanban && stageList.length > 0) {
      const exists = stageList.find((s) => s.STATUS_ID === selectedStage)
      if (!exists) {
        setSelectedStage(stageList[0].STATUS_ID)
      }
    }
  }, [selectedKanban, stageList])

  const handleSave = async () => {
    if (!selectedKanban || !selectedStage) {
      toast.warning('Selecione um Kanban e uma Fase.')
      return
    }

    setSaving(true)
    try {
      const payload = {
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

  const handleRefreshConnection = async () => {
    setLoading(true)
    const res = await fetchBitrixKanbans()
    if (res.success && res.data) {
      setAllStages(res.data)
      setIsConnected(true)
      toast.success('Conexão atualizada com sucesso.')
    } else {
      setIsConnected(false)
      toast.error('Não foi possível conectar à API do Bitrix24.')
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
          <Button variant="outline" size="sm" onClick={handleRefreshConnection} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Testar Conexão Novamente
          </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Kanban Padrão</Label>
                  <Select
                    value={selectedKanban}
                    onValueChange={setSelectedKanban}
                    disabled={!isConnected}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Kanban..." />
                    </SelectTrigger>
                    <SelectContent>
                      {kanbanList.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fase Padrão</Label>
                  <Select
                    value={selectedStage}
                    onValueChange={setSelectedStage}
                    disabled={!isConnected || !selectedKanban}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fase inicial..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stageList.map((s) => (
                        <SelectItem key={s.STATUS_ID} value={s.STATUS_ID}>
                          {s.NAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
