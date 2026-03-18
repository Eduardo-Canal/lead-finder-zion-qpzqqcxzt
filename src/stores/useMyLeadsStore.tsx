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
  observacoes: string
  decisor_nome: string | null
  decisor_telefone: string | null
  decisor_email: string | null
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
  filters: MyLeadsFilters
  setFilter: (key: keyof MyLeadsFilters, value: string) => void
  updateStatus: (id: string, status: string) => Promise<void>
  updateObservation: (id: string, observacoes: string) => Promise<void>
  updateDecisor: (id: string, nome: string, telefone: string, email: string) => Promise<void>
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
      ultima_data_contato: lead.ultima_data_contato
        ? new Date(lead.ultima_data_contato).toLocaleDateString('pt-BR')
        : null,
    }))
    setMyLeads(enriched)
  }, [])

  useEffect(() => {
    if (user) fetchLeads()

    const handleRefetch = () => fetchLeads()
    window.addEventListener('refetch-my-leads', handleRefetch)
    return () => window.removeEventListener('refetch-my-leads', handleRefetch)
  }, [user, fetchLeads])

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

  const updateObservation = async (id: string, observacoes: string) => {
    await supabase.from('leads_salvos').update({ observacoes }).eq('id', id)
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

    if (error) {
      console.error(error)
      throw error
    }

    fetchLeads()
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
        filters,
        setFilter,
        updateStatus,
        updateObservation,
        updateDecisor,
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
