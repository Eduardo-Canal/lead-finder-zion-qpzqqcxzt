import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export type LeadStatus = 'novo' | 'em_contato' | 'qualificado' | 'proposta' | 'ganho' | 'perdido'

export interface Lead {
  id: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  cnae_principal: string
  cnaes_secundarios?: string[]
  cep: string
  uf: string
  municipio: string
  bairro: string
  logradouro: string
  numero: string
  complemento: string
  telefone: string
  email: string
  capital_social: number
  data_abertura: string
  situacao_cadastral: string
  status: LeadStatus
  user_id: string
  created_at: string
  bitrix_id?: string
  socios?: string
  data_situacao_cadastral?: string
}

interface MyLeadsStore {
  leads: Lead[]
  isLoading: boolean
  error: string | null
  fetchLeads: () => Promise<void>
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>
  deleteLead: (id: string) => Promise<void>
}

export const useMyLeadsStore = create<MyLeadsStore>((set) => ({
  leads: [],
  isLoading: false,
  error: null,

  fetchLeads: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('leads_salvos')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ leads: (data as Lead[]) || [], isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  updateLeadStatus: async (id: string, status: LeadStatus) => {
    try {
      const { error } = await supabase.from('leads_salvos').update({ status }).eq('id', id)

      if (error) throw error

      set((state) => ({
        leads: state.leads.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
      }))
    } catch (err: any) {
      console.error('Erro ao atualizar status do lead:', err)
      throw err
    }
  },

  deleteLead: async (id: string) => {
    try {
      const { error } = await supabase.from('leads_salvos').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        leads: state.leads.filter((lead) => lead.id !== id),
      }))
    } catch (err: any) {
      console.error('Erro ao excluir lead:', err)
      throw err
    }
  },
}))
