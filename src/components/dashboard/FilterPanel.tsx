import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Search, SlidersHorizontal, Trash2, Plus, X, ChevronDown, Download } from 'lucide-react'
import useLeadStore from '@/stores/useLeadStore'
import useAuthStore from '@/stores/useAuthStore'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const BRAZIL_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

const COMPANY_SIZES = [
  { label: 'MEI', value: 'MEI' },
  { label: 'ME', value: 'ME' },
  { label: 'EPP', value: 'EPP' },
  { label: 'Demais', value: 'DEMAIS' },
]

export function FilterPanel() {
  const {
    filters,
    setFilter,
    addCnae,
    removeCnae,
    toggleUf,
    togglePorte,
    clearFilters,
    searchLeads,
    isSearching,
  } = useLeadStore()
  const { hasPermission } = useAuthStore()
  const [cnaeInput, setCnaeInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  const handleAddCnae = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (cnaeInput.trim()) {
      addCnae(cnaeInput.trim())
      setCnaeInput('')
    }
  }

  const isSearchDisabled = filters.cnaes.length === 0

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 md:p-6 space-y-5 animate-fade-in-up">
      {/* Top Bar - Main Actions & Quick Search */}
      <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-end">
        <div className="w-full lg:flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Local Search */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Filtrar na Tabela
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Razão Social ou CNPJ..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="pl-9 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Mandatory CNAE (API) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#0066CC] uppercase tracking-wide">
              CNAE Principal (Obrigatório)*
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 6201-5/01"
                value={cnaeInput}
                onChange={(e) => setCnaeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCnae()}
                className={cn('bg-slate-50/50', filters.cnaes.length === 0 && 'border-blue-300')}
              />
              <Button
                type="button"
                onClick={() => handleAddCnae()}
                variant="secondary"
                className="px-3 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 sm:flex-none gap-2 font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {isExpanded ? 'Ocultar Filtros' : 'Filtros Avançados'}
          </Button>
          <Button
            onClick={() => searchLeads(1)}
            disabled={isSearching || isSearchDisabled}
            className="flex-1 sm:flex-none gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white border-none shadow-sm font-semibold transition-all active:scale-95"
          >
            <Search className="h-4 w-4" />
            Buscar Leads
          </Button>
        </div>
      </div>

      {/* Selected CNAEs Tags */}
      {filters.cnaes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground mr-1">Selecionados:</span>
          {filters.cnaes.map((cnae) => (
            <Badge
              key={cnae}
              variant="secondary"
              className="flex items-center gap-1.5 bg-blue-50 text-[#0066CC] hover:bg-blue-100 border-blue-200 py-1 px-2.5 shadow-sm"
            >
              {cnae}
              <X
                className="h-3.5 w-3.5 cursor-pointer hover:text-red-500 transition-colors"
                onClick={() => removeCnae(cnae)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Collapsible Advanced Filters */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="pt-6 border-t mt-5 space-y-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* UF */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Estados (UF)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal bg-slate-50/50"
                  >
                    <span className="truncate">
                      {filters.ufs.length > 0
                        ? `${filters.ufs.length} estado(s) selecionado(s)`
                        : 'Todos os Estados'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-2">
                  <ScrollArea className="h-64">
                    {BRAZIL_STATES.map((uf) => (
                      <DropdownMenuCheckboxItem
                        key={uf}
                        checked={filters.ufs.includes(uf)}
                        onCheckedChange={(c) => toggleUf(uf, c)}
                        className="cursor-pointer"
                      >
                        {uf}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Municipio */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Município</Label>
              <Input
                placeholder="Ex: São Paulo"
                value={filters.municipio}
                onChange={(e) => setFilter('municipio', e.target.value)}
                className="bg-slate-50/50"
              />
            </div>

            {/* Porte */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Porte da Empresa</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal bg-slate-50/50"
                  >
                    <span className="truncate">
                      {filters.porte.length > 0
                        ? `${filters.porte.length} porte(s) selecionado(s)`
                        : 'Qualquer Porte'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-2">
                  {COMPANY_SIZES.map((size) => (
                    <DropdownMenuCheckboxItem
                      key={size.value}
                      checked={filters.porte.includes(size.value)}
                      onCheckedChange={(c) => togglePorte(size.value, c)}
                      className="cursor-pointer"
                    >
                      {size.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Situação */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Situação Cadastral</Label>
              <Select
                value={filters.situacao || 'Todas'}
                onValueChange={(v) => setFilter('situacao', v === 'Todas' ? '' : v)}
              >
                <SelectTrigger className="bg-slate-50/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  <SelectItem value="ATIVA">Ativa</SelectItem>
                  <SelectItem value="INAPTA">Inapta</SelectItem>
                  <SelectItem value="BAIXADA">Baixada</SelectItem>
                  <SelectItem value="SUSPENSA">Suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Capital Mínimo */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Capital Social Mínimo</Label>
              <Input
                type="number"
                placeholder="Ex: 50000"
                value={filters.capitalMinimo}
                onChange={(e) => setFilter('capitalMinimo', e.target.value)}
                className="bg-slate-50/50"
              />
            </div>

            {/* Status de Contato */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Filtrar por Status (Local)</Label>
              <Select
                value={filters.contactStatus || 'Todos'}
                onValueChange={(v) => setFilter('contactStatus', v)}
              >
                <SelectTrigger className="bg-slate-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Status</SelectItem>
                  <SelectItem value="Não Contatado">Não Contatado</SelectItem>
                  <SelectItem value="Contatado">Contatado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer Actions of Filter Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-4 border-t border-dashed">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive w-full sm:w-auto"
              onClick={clearFilters}
              disabled={isSearching}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Todos os Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPermission('Exportar Lista')}
              onClick={() => toast.success('Lista exportada com sucesso!')}
              className="gap-2 w-full sm:w-auto bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Exportar Tabela
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
