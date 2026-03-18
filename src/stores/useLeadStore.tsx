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
import { mockLeads } from '@/data/mock-leads'

export type FilteredLead = {
  id: string
  razao_social: string
  cnpj: string
  cnae_principal: string
  cnaes_secundarios: string[]
  municipio: string
  uf: string
  porte: string
  situacao: string
  capital_social: number
  data_abertura: string
  email: string
  telefone: string
  socios: any[]
  contatado: boolean
  contatadoPor?: string
  contatadoEm?: string
}

export type Filters = {
  cnaes: string[]
  ufs: string[]
  municipio: string
  porte: string
  situacao: string
  capitalMinimo: string
  search: string
  cityQuick: string
  sizeQuick: string
  contactStatus: string
}

type LeadStoreContextType = {
  leads: FilteredLead[]
  filteredLeads: FilteredLead[]
  filters: Filters
  setFilter: (key: keyof Filters, value: any) => void
  addCnae: (cnae: string) => void
  removeCnae: (cnae: string) => void
  toggleUf: (uf: string, checked: boolean) => void
  toggleContact: (cnpj: string) => Promise<void>
}

const defaultFilters: Filters = {
  cnaes: [],
  ufs: [],
  municipio: '',
  porte: '',
  situacao: '',
  capitalMinimo: '',
  search: '',
  cityQuick: '',
  sizeQuick: '',
  contactStatus: 'Todos',
}

const LeadContext = createContext<LeadStoreContextType | null>(null)

export function LeadStoreProvider({ children }: { children: ReactNode }) {
  const [leadsRaw, setLeadsRaw] = useState<any[]>([])
  const [contatos, setContatos] = useState<any[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const { user } = useAuthStore()

  const fetchLeads = useCallback(async () => {
    const { data: cData } = await supabase
      .from('contatos_realizados')
      .select('*')
      .order('data_contato', { ascending: false })

    if (cData) setContatos(cData)
    setLeadsRaw(mockLeads)
  }, [])

  useEffect(() => {
    if (user) fetchLeads()
  }, [user, fetchLeads])

  const setFilter = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const addCnae = (cnae: string) => {
    if (cnae && !filters.cnaes.includes(cnae)) {
      setFilters((prev) => ({ ...prev, cnaes: [...prev.cnaes, cnae] }))
    }
  }

  const removeCnae = (cnae: string) => {
    setFilters((prev) => ({ ...prev, cnaes: prev.cnaes.filter((c) => c !== cnae) }))
  }

  const toggleUf = (uf: string, checked: boolean) => {
    setFilters((prev) => {
      const ufs = checked ? [...prev.ufs, uf] : prev.ufs.filter((u) => u !== uf)
      return { ...prev, ufs }
    })
  }

  const toggleContact = async (cnpj: string) => {
    if (!user) return
    const existing = contatos.find((c) => c.cnpj === cnpj)

    if (existing) {
      await supabase.from('contatos_realizados').delete().eq('id', existing.id)
    } else {
      await supabase.from('contatos_realizados').insert({
        cnpj,
        executivo_id: user.id,
        executivo_nome: user.nome,
      })
    }
    fetchLeads()
  }

  const leads = useMemo<FilteredLead[]>(() => {
    return leadsRaw.map((lead) => {
      const contato = contatos.find((c) => c.cnpj === lead.cnpj)
      return {
        ...lead,
        contatado: !!contato,
        contatadoPor: contato?.executivo_nome,
        contatadoEm: contato
          ? new Date(contato.data_contato).toLocaleDateString('pt-BR')
          : undefined,
      }
    })
  }, [leadsRaw, contatos])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (
        filters.cnaes.length > 0 &&
        !filters.cnaes.includes(lead.cnae_principal) &&
        !lead.cnaes_secundarios.some((c: string) => filters.cnaes.includes(c))
      )
        return false
      if (filters.ufs.length > 0 && !filters.ufs.includes(lead.uf)) return false
      if (
        filters.municipio &&
        !lead.municipio.toLowerCase().includes(filters.municipio.toLowerCase())
      )
        return false
      if (filters.porte && lead.porte !== filters.porte) return false
      if (filters.situacao && lead.situacao !== filters.situacao) return false
      if (filters.capitalMinimo && lead.capital_social < Number(filters.capitalMinimo)) return false

      if (filters.search) {
        const searchLow = filters.search.toLowerCase()
        if (!lead.razao_social.toLowerCase().includes(searchLow) && !lead.cnpj.includes(searchLow))
          return false
      }

      if (
        filters.cityQuick &&
        filters.cityQuick !== 'Todos' &&
        lead.municipio !== filters.cityQuick
      )
        return false
      if (filters.sizeQuick && filters.sizeQuick !== 'Todos' && lead.porte !== filters.sizeQuick)
        return false

      if (filters.contactStatus === 'Contatado' && !lead.contatado) return false
      if (filters.contactStatus === 'Não Contatado' && lead.contatado) return false

      return true
    })
  }, [leads, filters])

  return React.createElement(
    LeadContext.Provider,
    {
      value: {
        leads,
        filteredLeads,
        filters,
        setFilter,
        addCnae,
        removeCnae,
        toggleUf,
        toggleContact,
      },
    },
    children,
  )
}

export default function useLeadStore() {
  const context = useContext(LeadContext)
  if (!context) throw new Error('useLeadStore must be used within a LeadStoreProvider')
  return context
}
