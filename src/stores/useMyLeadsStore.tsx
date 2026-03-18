import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { mockMyLeads, MyLead, ContactStatus } from '@/data/mock-my-leads'

export type MyLeadsFilters = {
  search: string
  municipio: string
  status: string
  executivo: string
}

type MyLeadsStoreContextType = {
  myLeads: MyLead[]
  filteredLeads: MyLead[]
  filters: MyLeadsFilters
  setFilter: (key: keyof MyLeadsFilters, value: string) => void
  updateStatus: (id: string, status: ContactStatus) => void
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
  const [myLeads, setMyLeads] = useState<MyLead[]>(mockMyLeads)
  const [filters, setFilters] = useState<MyLeadsFilters>(defaultFilters)

  const setFilter = (key: keyof MyLeadsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const updateStatus = (id: string, status: ContactStatus) => {
    setMyLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === id) {
          return {
            ...lead,
            status,
            ultimoContato: new Date().toLocaleDateString('pt-BR'),
          }
        }
        return lead
      }),
    )
  }

  const updateObservation = (id: string, observacoes: string) => {
    setMyLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === id) {
          return { ...lead, observacoes }
        }
        return lead
      }),
    )
  }

  const filteredLeads = useMemo(() => {
    return myLeads.filter((lead) => {
      if (filters.search) {
        const searchLow = filters.search.toLowerCase()
        if (!lead.razaoSocial.toLowerCase().includes(searchLow) && !lead.cnpj.includes(searchLow)) {
          return false
        }
      }
      if (filters.municipio !== 'Todos' && lead.municipio !== filters.municipio) return false
      if (filters.status !== 'Todos' && lead.status !== filters.status) return false
      if (filters.executivo !== 'Todos' && lead.executivo !== filters.executivo) return false

      return true
    })
  }, [myLeads, filters])

  return (
    <MyLeadsContext.Provider
      value={{
        myLeads,
        filteredLeads,
        filters,
        setFilter,
        updateStatus,
        updateObservation,
      }}
    >
      {children}
    </MyLeadsContext.Provider>
  )
}

export default function useMyLeadsStore() {
  const context = useContext(MyLeadsContext)
  if (!context) throw new Error('useMyLeadsStore must be used within a MyLeadsStoreProvider')
  return context
}
