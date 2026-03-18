import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useEffect,
  useCallback,
} from 'react'
import { mockDb } from '@/lib/db'
import useAuthStore from '@/stores/useAuthStore'

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
  updateStatus: (id: string, status: string) => void
  updateObservation: (id: string, observacoes: string) => void
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
    const data = await mockDb.getTable('leads_salvos')
    const profiles = await mockDb.getTable('profiles')

    const enriched = data.map((lead: any) => {
      const p = profiles.find((p: any) => p.id === lead.salvo_por)
      return {
        ...lead,
        executivo_nome: p ? p.nome : 'Desconhecido',
      }
    })
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
    await mockDb.update('leads_salvos', id, {
      status_contato: status,
      ultima_data_contato: new Date().toLocaleDateString('pt-BR'),
    })
    fetchLeads()
  }

  const updateObservation = async (id: string, observacoes: string) => {
    await mockDb.update('leads_salvos', id, { observacoes })
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
