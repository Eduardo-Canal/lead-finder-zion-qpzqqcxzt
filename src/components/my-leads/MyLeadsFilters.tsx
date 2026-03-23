import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import useMyLeadsStore from '@/stores/useMyLeadsStore'
import { useMemo } from 'react'
import { designTokens } from '@/constants/designTokens'
import { cn } from '@/lib/utils'

export function MyLeadsFilters() {
  const { filters, setFilter, myLeads, executives } = useMyLeadsStore()

  const availableCities = useMemo(() => {
    const cities = new Set(myLeads.map((l) => l.municipio))
    return Array.from(cities).sort()
  }, [myLeads])

  const availableExecutives = useMemo(() => {
    const execs = new Set([...executives, ...myLeads.map((l) => l.executivo_nome)])
    return Array.from(execs).sort()
  }, [myLeads, executives])

  return (
    <div className={cn(designTokens.layout.card, 'mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4')}>
      <div className="relative col-span-1 md:col-span-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Busque por Razão Social ou CNPJ"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-9 bg-slate-50/50"
        />
      </div>

      <Select value={filters.municipio} onValueChange={(v) => setFilter('municipio', v)}>
        <SelectTrigger className="bg-slate-50/50">
          <SelectValue placeholder="Município" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Todos os Municípios</SelectItem>
          {availableCities.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(v) => setFilter('status', v)}>
        <SelectTrigger className="bg-slate-50/50">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Todos os Status</SelectItem>
          <SelectItem value="Não Contatado">Não Contatado</SelectItem>
          <SelectItem value="Em Prospecção">Em Prospecção</SelectItem>
          <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
          <SelectItem value="Sem Interesse">Sem Interesse</SelectItem>
          <SelectItem value="Convertido">Convertido</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.executivo} onValueChange={(v) => setFilter('executivo', v)}>
        <SelectTrigger className="bg-slate-50/50">
          <SelectValue placeholder="Executivo Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Todos os Executivos</SelectItem>
          {availableExecutives.map((e) => (
            <SelectItem key={e} value={e}>
              {e}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
