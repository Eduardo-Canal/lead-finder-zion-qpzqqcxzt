import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useEffect,
  useCallback,
} from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase/client'

export type LeadSalvo = {
  id: string
  razao_social: string
  cnpj: string
  cnae_principal: string
  municipio: string
  uf: string
  executivo_nome: string
  status_contato: string
  ultima_data_contato: string | null
  historico_interacoes: any[]
  decisor_nome: string | null
  decisor_telefone: string | null
  decisor_email: string | null
  telefone: string | null
  email: string | null
  observacoes: string | null
}

export type Opportunity = {
  id: string
  lead_id: string
  stage: 'prospecting' | 'qualification' | 'proposal' | 'closing'
  value: number
  probability: number
  expected_close_date: string | null
  leads_salvos?: { razao_social: string; cnpj: string }
}

export type MyLeadsFilters = {
  search: string
  municipio: string
  status: string
  executivo: string
}

type MyLeadsStoreContextType = {
  myLeads: LeadSalvo[]
  filteredLeads: LeadSalvo[]
  opportunities: Opportunity[]
  executives: string[]
  filters: MyLeadsFilters
  setFilter: (key: keyof MyLeadsFilters, value: string) => void
  updateStatus: (id: string, status: string) => Promise<void>
  addInteraction: (id: string, texto: string) => Promise<void>
  updateDecisor: (id: string, nome: string, telefone: string, email: string) => Promise<void>
  fetchOpportunities: () => Promise<void>
  createOpportunity: (
    leadId: string,
    value: number,
    probability: number,
    stage: string,
  ) => Promise<void>
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => Promise<void>
  updateOpportunityStage: (id: string, stage: string) => Promise<void>
}

const defaultFilters: MyLeadsFilters = {
  search: '',
  municipio: 'Todos',
  status: 'Todos',
  executivo: 'Todos',
}

const MyLeadsContext = createContext<MyLeadsStoreContextType | null>(null)

export function MyLeadsStoreProvider({ children }: { children: ReactNode }) {
  const [myLeads, setMyLeads] = useState<LeadSalvo[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [executives, setExecutives] = useState<string[]>([])
  const [filters, setFilters] = useState<MyLeadsFilters>(defaultFilters)
  const { user } = useAuthStore()

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase.from('leads_salvos').select('*, profiles(nome)')

    if (error || !data) {
      setMyLeads([])
      return
    }

    const enriched = data.map((lead: any) => ({
      ...lead,
      executivo_nome: lead.profiles?.nome || 'Desconhecido',
      historico_interacoes: Array.isArray(lead.historico_interacoes)
        ? lead.historico_interacoes
        : [],
      ultima_data_contato: lead.ultima_data_contato
        ? new Date(lead.ultima_data_contato).toLocaleDateString('pt-BR')
        : null,
    }))
    setMyLeads(enriched)
  }, [])

  const fetchOpportunities = useCallback(async () => {
    const { data, error } = await supabase.from('opportunities').select(`
        id, lead_id, stage, value, probability, expected_close_date,
        leads_salvos (razao_social, cnpj)
      `)

    if (!error && data) {
      setOpportunities(data as any)
    }
  }, [])

  const fetchExecutives = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('nome').eq('ativo', true)
    if (!error && data) {
      setExecutives(Array.from(new Set(data.map((p) => p.nome))).sort())
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchLeads()
      fetchExecutives()
      fetchOpportunities()
    }

    const handleRefetch = () => {
      fetchLeads()
      fetchExecutives()
      fetchOpportunities()
    }
    window.addEventListener('refetch-my-leads', handleRefetch)
    return () => window.removeEventListener('refetch-my-leads', handleRefetch)
  }, [user, fetchLeads, fetchExecutives, fetchOpportunities])

  const setFilter = (key: keyof MyLeadsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const updateStatus = async (id: string, status: string) => {
    if (!user) return
    const lead = myLeads.find((l) => l.id === id)
    if (!lead) return

    const now = new Date().toISOString()

    await supabase
      .from('leads_salvos')
      .update({
        status_contato: status,
        ultima_data_contato: now,
      })
      .eq('id', id)

    await supabase.from('contatos_realizados').insert({
      cnpj: lead.cnpj,
      executivo_id: user.id,
      executivo_nome: user.nome,
      data_contato: now,
    })

    fetchLeads()
  }

  const addInteraction = async (id: string, texto: string) => {
    if (!user) return
    const lead = myLeads.find((l) => l.id === id)
    if (!lead) return

    const newInteraction = {
      data: new Date().toISOString(),
      executivo_nome: user.nome,
      texto,
    }

    const updatedHistory = [newInteraction, ...lead.historico_interacoes]

    const { error } = await supabase
      .from('leads_salvos')
      .update({ historico_interacoes: updatedHistory })
      .eq('id', id)

    if (error) {
      console.error(error)
      throw error
    }

    fetchLeads()
  }

  const updateDecisor = async (id: string, nome: string, telefone: string, email: string) => {
    const { error } = await supabase
      .from('leads_salvos')
      .update({
        decisor_nome: nome || null,
        decisor_telefone: telefone || null,
        decisor_email: email || null,
      })
      .eq('id', id)

    if (error) throw error
    fetchLeads()
  }

  const createOpportunity = async (
    leadId: string,
    value: number,
    probability: number,
    stage: string,
  ) => {
    const { error } = await supabase.from('opportunities').insert({
      lead_id: leadId,
      value,
      probability,
      stage,
    })
    if (error) throw error
    fetchOpportunities()
  }

  const updateOpportunity = async (id: string, updates: Partial<Opportunity>) => {
    const { error } = await supabase.from('opportunities').update(updates).eq('id', id)
    if (error) throw error
    fetchOpportunities()
  }

  const updateOpportunityStage = async (id: string, stage: string) => {
    // Optimistic update
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, stage: stage as any } : o)))
    const { error } = await supabase.from('opportunities').update({ stage }).eq('id', id)
    if (error) {
      fetchOpportunities() // revert
      throw error
    }
  }

  const filteredLeads = useMemo(() => {
    return myLeads.filter((lead) => {
      if (filters.search) {
        const searchLow = filters.search.toLowerCase()
        if (
          !lead.razao_social.toLowerCase().includes(searchLow) &&
          !lead.cnpj.includes(searchLow)
        ) {
          return false
        }
      }
      if (filters.municipio !== 'Todos' && lead.municipio !== filters.municipio) return false
      if (filters.status !== 'Todos' && lead.status_contato !== filters.status) return false
      if (filters.executivo !== 'Todos' && lead.executivo_nome !== filters.executivo) return false

      return true
    })
  }, [myLeads, filters])

  return React.createElement(
    MyLeadsContext.Provider,
    {
      value: {
        myLeads,
        filteredLeads,
        opportunities,
        executives,
        filters,
        setFilter,
        updateStatus,
        addInteraction,
        updateDecisor,
        fetchOpportunities,
        createOpportunity,
        updateOpportunity,
        updateOpportunityStage,
      },
    },
    children,
  )
}

export default function useMyLeadsStore() {
  const context = useContext(MyLeadsContext)
  if (!context) throw new Error('useMyLeadsStore must be used within a MyLeadsStoreProvider')
  return context
}
