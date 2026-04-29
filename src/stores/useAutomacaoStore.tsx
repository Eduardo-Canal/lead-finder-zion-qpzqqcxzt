import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export type AutomacaoConfig = {
  id: string
  nome: string
  descricao: string | null
  cnaes: string[]
  ufs: string[] | null
  portes: string[] | null
  municipios: string[] | null
  limite_por_execucao: number
  contexto_ia: string | null
  bitrix_pipeline_id: string | null
  bitrix_stage_id: string | null
  bitrix_notification_group_id: string | null
  tipo: 'recorrente' | 'campanha'
  cron_expressao: string | null
  data_inicio: string | null
  data_fim: string | null
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export type ExecucaoAutomacao = {
  id: string
  automacao_config_id: string
  iniciado_em: string
  finalizado_em: string | null
  status: 'executando' | 'concluido' | 'erro'
  leads_encontrados: number
  leads_novos: number
  leads_duplicados: number
  leads_enviados_bitrix: number
  erro_mensagem: string | null
}

export type LeadAutomacao = {
  id: string
  automacao_config_id: string
  execucao_id: string | null
  cnpj: string
  razao_social: string | null
  cnae_principal: string | null
  municipio: string | null
  uf: string | null
  porte: string | null
  email: string | null
  telefone: string | null
  sugestao_abordagem: string | null
  score_relevancia: number
  status: 'pendente' | 'enviado_bitrix' | 'erro_envio' | 'contatado' | 'interessado' | 'nao_interessado'
  bitrix_lead_id: string | null
  observacao_sdr: string | null
  encontrado_em: string
}

export type CampanhaFormData = Omit<AutomacaoConfig, 'id' | 'criado_em' | 'atualizado_em'>

export type SchedulerConfig = {
  api_url: string
  secret_key: string
}

type AutomacaoStoreType = {
  campanhas: AutomacaoConfig[]
  execucoes: ExecucaoAutomacao[]
  leads: LeadAutomacao[]
  schedulerConfig: SchedulerConfig | null
  loadingCampanhas: boolean
  loadingExecucoes: boolean
  loadingLeads: boolean
  fetchCampanhas: () => Promise<void>
  fetchExecucoes: (configId?: string) => Promise<void>
  fetchLeads: (configId?: string) => Promise<void>
  createCampanha: (data: CampanhaFormData) => Promise<boolean>
  updateCampanha: (id: string, data: Partial<CampanhaFormData>) => Promise<boolean>
  deleteCampanha: (id: string) => Promise<boolean>
  toggleAtivo: (id: string, ativo: boolean) => Promise<void>
  fetchSchedulerConfig: () => Promise<void>
  saveSchedulerConfig: (config: SchedulerConfig) => Promise<boolean>
  syncCronJobs: () => Promise<number | null>
}

const AutomacaoContext = createContext<AutomacaoStoreType | null>(null)

export function AutomacaoStoreProvider({ children }: { children: ReactNode }) {
  const [campanhas, setCampanhas] = useState<AutomacaoConfig[]>([])
  const [execucoes, setExecucoes] = useState<ExecucaoAutomacao[]>([])
  const [leads, setLeads] = useState<LeadAutomacao[]>([])
  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig | null>(null)
  const [loadingCampanhas, setLoadingCampanhas] = useState(false)
  const [loadingExecucoes, setLoadingExecucoes] = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(false)

  const fetchCampanhas = useCallback(async () => {
    setLoadingCampanhas(true)
    try {
      const { data, error } = await supabase
        .from('automacao_config')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) throw error
      setCampanhas(data || [])
    } catch (e: any) {
      toast.error(`Erro ao carregar campanhas: ${e.message}`)
    } finally {
      setLoadingCampanhas(false)
    }
  }, [])

  const fetchExecucoes = useCallback(async (configId?: string) => {
    setLoadingExecucoes(true)
    try {
      let query = supabase
        .from('execucoes_automacao')
        .select('*')
        .order('iniciado_em', { ascending: false })
        .limit(100)
      if (configId) query = query.eq('automacao_config_id', configId)
      const { data, error } = await query
      if (error) throw error
      setExecucoes(data || [])
    } catch (e: any) {
      toast.error(`Erro ao carregar histórico: ${e.message}`)
    } finally {
      setLoadingExecucoes(false)
    }
  }, [])

  const fetchLeads = useCallback(async (configId?: string) => {
    setLoadingLeads(true)
    try {
      let query = supabase
        .from('leads_automacao_pendentes')
        .select('*')
        .order('encontrado_em', { ascending: false })
        .limit(500)
      if (configId) query = query.eq('automacao_config_id', configId)
      const { data, error } = await query
      if (error) throw error
      setLeads(data || [])
    } catch (e: any) {
      toast.error(`Erro ao carregar leads: ${e.message}`)
    } finally {
      setLoadingLeads(false)
    }
  }, [])

  const createCampanha = useCallback(
    async (data: CampanhaFormData): Promise<boolean> => {
      try {
        const { error } = await supabase.from('automacao_config').insert(data)
        if (error) throw error
        toast.success('Campanha criada com sucesso!')
        await fetchCampanhas()
        return true
      } catch (e: any) {
        toast.error(`Erro ao criar campanha: ${e.message}`)
        return false
      }
    },
    [fetchCampanhas],
  )

  const updateCampanha = useCallback(
    async (id: string, data: Partial<CampanhaFormData>): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('automacao_config')
          .update({ ...data, atualizado_em: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        toast.success('Campanha atualizada!')
        await fetchCampanhas()
        return true
      } catch (e: any) {
        toast.error(`Erro ao atualizar campanha: ${e.message}`)
        return false
      }
    },
    [fetchCampanhas],
  )

  const deleteCampanha = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from('automacao_config').delete().eq('id', id)
        if (error) throw error
        toast.success('Campanha excluída.')
        await fetchCampanhas()
        return true
      } catch (e: any) {
        toast.error(`Erro ao excluir campanha: ${e.message}`)
        return false
      }
    },
    [fetchCampanhas],
  )

  const toggleAtivo = useCallback(async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('automacao_config')
        .update({ ativo, atualizado_em: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      setCampanhas((prev) => prev.map((c) => (c.id === id ? { ...c, ativo } : c)))
      toast.success(ativo ? 'Campanha ativada.' : 'Campanha pausada.')
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`)
    }
  }, [])

  const fetchSchedulerConfig = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'automation_scheduler_config')
        .maybeSingle()
      setSchedulerConfig((data?.value as SchedulerConfig) || null)
    } catch {
      // silencioso — config pode não existir ainda
    }
  }, [])

  const saveSchedulerConfig = useCallback(async (config: SchedulerConfig): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'automation_scheduler_config', value: config }, { onConflict: 'key' })
      if (error) throw error
      setSchedulerConfig(config)
      toast.success('Configuração do agendador salva!')
      return true
    } catch (e: any) {
      toast.error(`Erro ao salvar configuração: ${e.message}`)
      return false
    }
  }, [])

  const syncCronJobs = useCallback(async (): Promise<number | null> => {
    try {
      const { data, error } = await supabase.rpc('sync_all_automacao_cron_jobs')
      if (error) throw error
      toast.success(`Agendamentos sincronizados! ${data} campanha(s) processada(s).`)
      return data as number
    } catch (e: any) {
      toast.error(`Erro ao sincronizar: ${e.message}`)
      return null
    }
  }, [])

  return (
    <AutomacaoContext.Provider
      value={{
        campanhas,
        execucoes,
        leads,
        schedulerConfig,
        loadingCampanhas,
        loadingExecucoes,
        loadingLeads,
        fetchCampanhas,
        fetchExecucoes,
        fetchLeads,
        createCampanha,
        updateCampanha,
        deleteCampanha,
        toggleAtivo,
        fetchSchedulerConfig,
        saveSchedulerConfig,
        syncCronJobs,
      }}
    >
      {children}
    </AutomacaoContext.Provider>
  )
}

export default function useAutomacaoStore() {
  const ctx = useContext(AutomacaoContext)
  if (!ctx) throw new Error('useAutomacaoStore must be used within AutomacaoStoreProvider')
  return ctx
}
