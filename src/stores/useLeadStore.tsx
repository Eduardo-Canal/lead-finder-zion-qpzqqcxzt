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
import { toast } from 'sonner'

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
  limit: number
}

type Pagination = {
  page: number
  totalPages: number
  totalCount: number
}

type LeadStoreContextType = {
  leads: FilteredLead[]
  filteredLeads: FilteredLead[]
  filters: Filters
  pagination: Pagination
  setFilter: (key: keyof Filters, value: any) => void
  addCnae: (cnae: string) => void
  removeCnae: (cnae: string) => void
  toggleUf: (uf: string, checked: boolean) => void
  toggleContact: (cnpj: string) => Promise<void>
  searchLeads: (page?: number) => Promise<void>
  isSearching: boolean
}

const defaultFilters: Filters = {
  cnaes: [],
  ufs: [],
  municipio: '',
  porte: '',
  situacao: 'ATIVA',
  capitalMinimo: '',
  search: '',
  cityQuick: '',
  sizeQuick: '',
  contactStatus: 'Todos',
  limit: 10,
}

const LeadContext = createContext<LeadStoreContextType | null>(null)

const safeString = (val: any): string => {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string' || typeof val === 'number') return String(val)
  if (typeof val === 'object') {
    if ('codigo' in val && 'descricao' in val) return `${val.codigo} - ${val.descricao}`
    if ('id' in val && 'descricao' in val) return `${val.id} - ${val.descricao}`
    if ('text' in val) return String(val.text)
    try {
      return JSON.stringify(val)
    } catch {
      return String(val)
    }
  }
  return String(val)
}

const mapEmpresaToLead = (empresa: any): any => {
  let situacaoStr = 'Ativa'

  if (empresa.situacao_cadastral) {
    if (
      typeof empresa.situacao_cadastral === 'object' &&
      empresa.situacao_cadastral.situacao_atual
    ) {
      situacaoStr = empresa.situacao_cadastral.situacao_atual
    } else if (typeof empresa.situacao_cadastral === 'string') {
      situacaoStr = empresa.situacao_cadastral
    }
  } else if (empresa.situacao && typeof empresa.situacao === 'string') {
    situacaoStr = empresa.situacao
  }

  let porteStr = '-'
  const porteData = empresa.porte_empresa || empresa.porte
  if (porteData) {
    if (typeof porteData === 'object') {
      const codigo = String(porteData.codigo || '')
      const desc = String(porteData.descricao || '').toUpperCase()
      if (codigo === '1' || desc.includes('MICRO')) {
        porteStr = 'Micro Empresa'
      } else if (codigo === '3' || desc.includes('PEQUENO')) {
        porteStr = 'Pequeno Porte'
      } else if (codigo === '5' || desc.includes('DEMAIS')) {
        porteStr = 'Demais'
      } else {
        porteStr = 'Demais'
      }
    } else if (typeof porteData === 'string') {
      const pUpper = porteData.toUpperCase()
      if (pUpper.includes('MICRO') || pUpper === 'ME' || pUpper === 'MEI')
        porteStr = 'Micro Empresa'
      else if (pUpper.includes('PEQUENO') || pUpper === 'EPP') porteStr = 'Pequeno Porte'
      else if (pUpper.trim() !== '') porteStr = 'Demais'
    }
  }

  return {
    id: safeString(empresa.cnpj),
    cnpj: safeString(empresa.cnpj),
    razao_social: safeString(empresa.razao_social) || '-',
    cnae_principal: safeString(empresa.cnae_fiscal_principal) || '-',
    cnaes_secundarios:
      Array.isArray(empresa.cnaes_secundarios) && empresa.cnaes_secundarios.length > 0
        ? empresa.cnaes_secundarios.map(safeString)
        : empresa.cnae_fiscal_secundaria
          ? safeString(empresa.cnae_fiscal_secundaria).split(',').map(safeString)
          : [],
    municipio: empresa.municipio || '-',
    uf: empresa.uf || '-',
    porte: porteStr,
    situacao: situacaoStr || '-',
    capital_social: empresa.capital_social ? Number(empresa.capital_social) : 0,
    data_abertura: empresa.data_inicio_atividade || empresa.data_abertura || '-',
    email: empresa.email || '-',
    telefone: empresa.telefone || '-',
    socios: typeof empresa.socios === 'string' ? JSON.parse(empresa.socios) : empresa.socios || [],
  }
}

export function LeadStoreProvider({ children }: { children: ReactNode }) {
  const [leadsRaw, setLeadsRaw] = useState<any[]>([])
  const [contatos, setContatos] = useState<any[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  })
  const [isSearching, setIsSearching] = useState(false)
  const { user } = useAuthStore()

  const fetchInitialData = useCallback(async () => {
    if (!user) return

    const { data: cData } = await supabase
      .from('contatos_realizados')
      .select('*')
      .order('data_contato', { ascending: false })

    if (cData) setContatos(cData)
  }, [user])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const searchLeads = async (pageToFetch?: number | any) => {
    if (!user) return

    if (filters.cnaes.length === 0) {
      toast.error('O filtro de CNAE Principal é obrigatório para realizar a busca.')
      return
    }

    setIsSearching(true)

    const isValidPage = typeof pageToFetch === 'number'
    const targetPage = isValidPage ? pageToFetch : 1

    if (!isValidPage) {
      setFilters((prev) => ({ ...prev, cityQuick: 'Todos' }))
    }

    const sanitizedCnaes = filters.cnaes
      .map((c) => (typeof c === 'string' ? c.replace(/\D/g, '') : String(c).replace(/\D/g, '')))
      .filter(Boolean)

    const payload = {
      cnae_fiscal_principal: sanitizedCnaes.length > 0 ? sanitizedCnaes : null,
      uf: filters.ufs.length > 0 ? filters.ufs : null,
      municipio:
        typeof filters.municipio === 'string' && filters.municipio.trim() !== ''
          ? [filters.municipio.trim()]
          : null,
      porte: typeof filters.porte === 'string' && filters.porte ? filters.porte : null,
      situacao_cadastral:
        typeof filters.situacao === 'string' && filters.situacao ? filters.situacao : null,
      page: targetPage,
      limit: typeof filters.limit === 'number' ? filters.limit : 10,
    }

    try {
      const { data, error } = await supabase.functions.invoke('buscar-leads', {
        body: payload,
      })

      console.log('Full API Response:', data)

      if (error) {
        console.error('Search API Connection Error:', error)
        toast.error('Erro ao conectar com o servidor. Verifique sua conexão.')
        setLeadsRaw([])
        setPagination({ page: targetPage, totalPages: 0, totalCount: 0 })
        return
      }

      if (data?.error) {
        toast.error(data.error)
        setLeadsRaw([])
        setPagination({ page: targetPage, totalPages: 0, totalCount: 0 })
        return
      }

      const results = (data?.cnpjs || []).map(mapEmpresaToLead)
      setLeadsRaw(results)
      setPagination({
        page: data?.page || targetPage,
        totalPages: data?.pages || 1,
        totalCount: data?.count || results.length,
      })

      if (results.length > 0) {
        toast.success(`${results.length} leads encontrados.`)
      } else {
        toast.info('Nenhum lead encontrado com estes filtros.')
      }
    } catch (err: any) {
      console.error('Error searching leads:', err)
      toast.error('Erro inesperado ao buscar leads.')
      setLeadsRaw([])
      setPagination({ page: targetPage, totalPages: 0, totalCount: 0 })
    } finally {
      setIsSearching(false)
    }
  }

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

    const { data: cData } = await supabase
      .from('contatos_realizados')
      .select('*')
      .order('data_contato', { ascending: false })
    if (cData) setContatos(cData)
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
        pagination,
        setFilter,
        addCnae,
        removeCnae,
        toggleUf,
        toggleContact,
        searchLeads,
        isSearching,
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
