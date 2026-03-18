import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { mockLeads, Lead } from '@/data/mock-leads'

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
  leads: Lead[]
  filteredLeads: Lead[]
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
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

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

  const toggleContact = (cnpj: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.cnpj === cnpj) {
          const isNowContacted = !l.contatado
          return {
            ...l,
            contatado: isNowContacted,
            contatadoPor: isNowContacted ? 'Executivo Zion' : undefined,
            contatadoEm: isNowContacted ? new Date().toLocaleDateString('pt-BR') : undefined,
          }
        }
        return l
      }),
    )
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (
        filters.cnaes.length > 0 &&
        !filters.cnaes.includes(lead.cnaePrincipal) &&
        !lead.cnaesSecundarios.some((c) => filters.cnaes.includes(c))
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
      if (filters.capitalMinimo && lead.capitalSocial < Number(filters.capitalMinimo)) return false

      if (filters.search) {
        const searchLow = filters.search.toLowerCase()
        if (!lead.razaoSocial.toLowerCase().includes(searchLow) && !lead.cnpj.includes(searchLow))
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
