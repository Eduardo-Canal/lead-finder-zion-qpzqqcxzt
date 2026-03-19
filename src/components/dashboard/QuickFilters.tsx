import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Download } from 'lucide-react'
import useLeadStore from '@/stores/useLeadStore'
import useAuthStore from '@/stores/useAuthStore'
import { useMemo } from 'react'
import { toast } from 'sonner'

export function QuickFilters() {
  const { filters, setFilter, leads } = useLeadStore()
  const { hasPermission } = useAuthStore()

  const availableCities = useMemo(() => {
    const cities = new Set(leads.map((l) => l.municipio))
    return Array.from(cities).sort()
  }, [leads])

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
      <div className="relative col-span-1 md:col-span-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Razão Social ou CNPJ"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={filters.cityQuick || 'Todos'} onValueChange={(v) => setFilter('cityQuick', v)}>
        <SelectTrigger>
          <SelectValue placeholder="Cidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Todas as Cidades</SelectItem>
          {availableCities.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sizeQuick || 'Todos'} onValueChange={(v) => setFilter('sizeQuick', v)}>
        <SelectTrigger>
          <SelectValue placeholder="Porte" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Qualquer Porte</SelectItem>
          <SelectItem value="MEI">MEI</SelectItem>
          <SelectItem value="ME">ME</SelectItem>
          <SelectItem value="EPP">EPP</SelectItem>
          <SelectItem value="Demais">Demais</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.limit?.toString() || '5'}
        onValueChange={(v) => setFilter('limit', Number(v))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Limite de resultados" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">5 resultados</SelectItem>
          <SelectItem value="10">10 resultados</SelectItem>
          <SelectItem value="25">25 resultados</SelectItem>
          <SelectItem value="50">50 resultados</SelectItem>
          <SelectItem value="100">100 resultados</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Select value={filters.contactStatus} onValueChange={(v) => setFilter('contactStatus', v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Status de Contato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Status</SelectItem>
            <SelectItem value="Não Contatado">Não Contatado</SelectItem>
            <SelectItem value="Contatado">Contatado</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          title="Exportar Lista"
          disabled={!hasPermission('Exportar Lista')}
          onClick={() => toast.success('Lista exportada com sucesso!')}
          className="shrink-0"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
