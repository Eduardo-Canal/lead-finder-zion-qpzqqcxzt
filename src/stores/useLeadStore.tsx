import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react'
import { mockDb, generateId } from '@/lib/db'
import useAuthStore from '@/stores/useAuthStore'

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
  toggleContact: (cnpj: string) => void
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

  const fetchLeads = async () => {
    const data = await mockDb.getTable('leads_disponiveis')
    const cData = await mockDb.getTable('contatos_realizados')
    setLeadsRaw(data)
    setContatos(cData)
  }

  useEffect(() => {
    if (user) fetchLeads()
  }, [user])

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
      await mockDb.delete('contatos_realizados', existing.id)
    } else {
      await mockDb.insert('contatos_realizados', {
        id: generateId(),
        cnpj,
        executivo_id: user.id,
        executivo_nome: user.nome,
        data_contato: new Date().toLocaleDateString('pt-BR'),
        created_at: new Date().toISOString(),
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
        contatadoEm: contato?.data_contato,
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
