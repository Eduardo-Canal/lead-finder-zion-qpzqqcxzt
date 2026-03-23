import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export type LeadStatus = 'novo' | 'em_contato' | 'qualificado' | 'proposta' | 'ganho' | 'perdido'

export interface LeadSalvo {
  id: string
  razao_social: string
  nome_fantasia?: string
  cnpj?: string
  cnae_principal?: string
  cnaes_secundarios?: string[]
  cep?: string
  uf?: string
  municipio?: string
  bairro?: string
  logradouro?: string
  numero?: string
  complemento?: string
  telefone?: string
  email?: string
  capital_social?: number
  data_abertura?: string
  situacao_cadastral?: string
  status_contato: string
  user_id?: string
  created_at?: string
  bitrix_id?: string
  socios?: string
  data_situacao_cadastral?: string
  executivo_nome?: string
  ultima_data_contato?: string
  decisor_nome?: string
  decisor_telefone?: string
  decisor_email?: string
  historico_interacoes?: any[]
  observacoes?: string
  status?: LeadStatus
}

export type Lead = LeadSalvo

export interface Opportunity {
  id: string
  lead_id: string
  value: number
  probability: number
  stage: string
  leads_salvos?: LeadSalvo
}

interface MyLeadsStore {
  myLeads: LeadSalvo[]
  filteredLeads: LeadSalvo[]
  leads: LeadSalvo[]
  opportunities: Opportunity[]
  executives: string[]
  isLoading: boolean
  error: string | null
  filters: {
    search: string
    municipio: string
    status: string
    executivo: string
  }

  fetchLeads: () => Promise<void>
  setFilter: (key: string, value: string) => void
  updateStatus: (id: string, status: string) => Promise<void>
  updateDecisor: (id: string, nome: string, tel: string, email: string) => Promise<void>
  updateOpportunityStage: (id: string, stage: string) => Promise<void>
  createOpportunity: (
    leadId: string,
    value: number,
    probability: number,
    stage: string,
  ) => Promise<void>
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<void>
  addInteraction: (leadId: string, text: string) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  applyFilters: () => void
}

export const useMyLeadsStore = create<MyLeadsStore>((set, get) => ({
  myLeads: [],
  filteredLeads: [],
  leads: [],
  opportunities: [],
  executives: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    municipio: 'Todos',
    status: 'Todos',
    executivo: 'Todos',
  },

  fetchLeads: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usuário não autenticado')

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_salvos')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError

      const { data: oppsData, error: oppsError } = await supabase
        .from('opportunities')
        .select('*, leads_salvos(*)')

      let finalOpps: Opportunity[] = []
      if (!oppsError && oppsData) {
        finalOpps = oppsData as Opportunity[]
      }

      set({
        myLeads: (leadsData as LeadSalvo[]) || [],
        leads: (leadsData as LeadSalvo[]) || [],
        opportunities: finalOpps,
        isLoading: false,
      })
      get().applyFilters()
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  setFilter: (key: string, value: string) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }))
    get().applyFilters()
  },

  applyFilters: () => {
    const { myLeads, filters } = get()
    const filtered = myLeads.filter((lead) => {
      const matchSearch =
        filters.search === '' ||
        lead.razao_social?.toLowerCase().includes(filters.search.toLowerCase()) ||
        lead.nome_fantasia?.toLowerCase().includes(filters.search.toLowerCase()) ||
        lead.cnpj?.includes(filters.search)
      const matchMun = filters.municipio === 'Todos' || lead.municipio === filters.municipio
      const matchStatus = filters.status === 'Todos' || lead.status_contato === filters.status
      const matchExec = filters.executivo === 'Todos' || lead.executivo_nome === filters.executivo
      return matchSearch && matchMun && matchStatus && matchExec
    })
    set({ filteredLeads: filtered })
  },

  updateStatus: async (id: string, status: string) => {
    try {
      await supabase.from('leads_salvos').update({ status_contato: status }).eq('id', id)
      set((state) => {
        const myLeads = state.myLeads.map((l) =>
          l.id === id ? { ...l, status_contato: status } : l,
        )
        return { myLeads, leads: myLeads }
      })
      get().applyFilters()
    } catch (err) {
      console.error('Erro ao atualizar status do lead:', err)
      throw err
    }
  },

  updateDecisor: async (id: string, nome: string, tel: string, email: string) => {
    try {
      await supabase
        .from('leads_salvos')
        .update({ decisor_nome: nome, decisor_telefone: tel, decisor_email: email })
        .eq('id', id)
      set((state) => {
        const myLeads = state.myLeads.map((l) =>
          l.id === id
            ? { ...l, decisor_nome: nome, decisor_telefone: tel, decisor_email: email }
            : l,
        )
        return { myLeads, leads: myLeads }
      })
      get().applyFilters()
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  updateOpportunityStage: async (id: string, stage: string) => {
    try {
      await supabase.from('opportunities').update({ stage }).eq('id', id)
      set((state) => ({
        opportunities: state.opportunities.map((o) => (o.id === id ? { ...o, stage } : o)),
      }))
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  createOpportunity: async (leadId: string, value: number, probability: number, stage: string) => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .insert([{ lead_id: leadId, value, probability, stage }])
        .select('*, leads_salvos(*)')
        .single()
      if (error) throw error
      if (data) {
        set((state) => ({ opportunities: [...state.opportunities, data as Opportunity] }))
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  updateOpportunity: async (id: string, data: Partial<Opportunity>) => {
    try {
      const { data: updated, error } = await supabase
        .from('opportunities')
        .update(data)
        .eq('id', id)
        .select('*, leads_salvos(*)')
        .single()
      if (error) throw error
      if (updated) {
        set((state) => ({
          opportunities: state.opportunities.map((o) =>
            o.id === id ? (updated as Opportunity) : o,
          ),
        }))
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  addInteraction: async (leadId: string, text: string) => {
    try {
      const lead = get().myLeads.find((l) => l.id === leadId)
      const newInteraction = {
        data: new Date().toISOString(),
        texto: text,
        executivo_nome: 'Atual',
      }
      const historico = [...(lead?.historico_interacoes || []), newInteraction]
      await supabase
        .from('leads_salvos')
        .update({ historico_interacoes: historico })
        .eq('id', leadId)

      set((state) => {
        const myLeads = state.myLeads.map((l) =>
          l.id === leadId ? { ...l, historico_interacoes: historico } : l,
        )
        return { myLeads, leads: myLeads }
      })
      get().applyFilters()
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  deleteLead: async (id: string) => {
    try {
      await supabase.from('leads_salvos').delete().eq('id', id)
      set((state) => {
        const myLeads = state.myLeads.filter((lead) => lead.id !== id)
        return { myLeads, leads: myLeads }
      })
      get().applyFilters()
    } catch (err: any) {
      console.error('Erro ao excluir lead:', err)
      throw err
    }
  },
}))

export default useMyLeadsStore
