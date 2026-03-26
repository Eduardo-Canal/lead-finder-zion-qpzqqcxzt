import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Search,
  SlidersHorizontal,
  Trash2,
  Plus,
  X,
  ChevronDown,
  Download,
  Briefcase,
  MapPin,
  Building,
  Activity,
  DollarSign,
  Users,
} from 'lucide-react'
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
import { designTokens } from '@/constants/designTokens'
import { useActivityLogger } from '@/hooks/use-activity-logger'

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
  { label: 'Micro Empresa (ME)', value: 'ME' },
  { label: 'Pequeno Porte (EPP)', value: 'EPP' },
  { label: 'Demais (Médio/Grande)', value: 'DEMAIS' },
]

const formatCurrencyShort = (val: number) => {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`
  return `R$ ${val}`
}

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
    filteredLeads,
  } = useLeadStore()
  const { hasPermission } = useAuthStore()
  const { logAction } = useActivityLogger()
  const [cnaeInput, setCnaeInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  const handleAddCnae = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (cnaeInput.trim()) {
      addCnae(cnaeInput.trim())
      setCnaeInput('')
    }
  }

  const exportToCsv = () => {
    if (filteredLeads.length === 0) {
      toast.error('Nenhum lead para exportar.')
      return
    }

    logAction('export', 'empresas_rfb', { count: filteredLeads.length, filters })

    const headers = [
      'CNPJ',
      'Razão Social',
      'CNAE',
      'Município',
      'UF',
      'Porte',
      'Situação',
      'Capital Social',
      'Potencial',
      'Faturamento',
      'Funcionários',
      'Score',
      'Email',
      'Telefone',
    ]

    const rows = filteredLeads.map((lead) => [
      lead.cnpj,
      `"${(lead.razao_social || '').replace(/"/g, '""')}"`,
      `"${(lead.cnae_principal || '').replace(/"/g, '""')}"`,
      `"${lead.municipio || ''}"`,
      lead.uf,
      lead.porte,
      lead.situacao,
      lead.capital_social || 0,
      lead.potencial || '-',
      lead.faturamento_anual || 0,
      lead.numero_funcionarios || 0,
      lead.score_credito || 0,
      `"${(lead.email || '').replace(/"/g, '""')}"`,
      `"${(lead.telefone || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `leads_zion_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Lista exportada com sucesso!')
  }

  const isSearchDisabled = filters.cnaes.length === 0

  return (
    <div
      className={cn(
        designTokens.layout.card,
        'p-5 md:p-6 space-y-5 animate-fade-in-up border-slate-200',
      )}
    >
      {/* Top Bar - Main Actions & Quick Search */}
      <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-end">
        <div className="w-full lg:flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Local Search */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" /> Filtrar na Tabela Atual
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Razão Social ou CNPJ..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="pl-9 bg-slate-50 focus:bg-white transition-colors border-slate-200"
              />
            </div>
          </div>

          {/* Mandatory CNAE (API) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> CNAE Principal (Obrigatório)*
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 6201-5/01"
                value={cnaeInput}
                onChange={(e) => setCnaeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCnae()}
                className={cn(
                  'bg-slate-50 focus:bg-white transition-colors',
                  filters.cnaes.length === 0
                    ? 'border-primary/50 focus:border-primary'
                    : 'border-slate-200',
                )}
              />
              <Button
                type="button"
                onClick={() => handleAddCnae()}
                variant="secondary"
                className="px-3 shrink-0 shadow-sm"
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
            className="flex-1 sm:flex-none gap-2 font-medium bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            {isExpanded ? 'Ocultar Filtros' : 'Filtros Avançados'}
          </Button>
          <Button
            onClick={() => searchLeads(1)}
            disabled={isSearching || isSearchDisabled}
            className={cn(
              'flex-1 sm:flex-none gap-2 shadow-sm font-semibold transition-all active:scale-[0.98]',
              !isSearchDisabled && 'bg-primary hover:bg-primary-600 text-white shadow-primary/20',
              isSearchDisabled && 'opacity-50',
            )}
          >
            <Search className="h-4 w-4" />
            Buscar Leads
          </Button>
        </div>
      </div>

      {/* Selected CNAEs Tags */}
      {filters.cnaes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" /> CNAEs Selecionados:
          </span>
          {filters.cnaes.map((cnae) => (
            <Badge
              key={cnae}
              variant="secondary"
              className="flex items-center gap-1.5 bg-white text-primary border-primary/20 py-1 px-3 shadow-sm hover:bg-primary/5 transition-colors"
            >
              {cnae}
              <X
                className="h-3.5 w-3.5 cursor-pointer hover:text-red-500 transition-colors opacity-70 hover:opacity-100"
                onClick={() => removeCnae(cnae)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Collapsible Advanced Filters */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="pt-6 border-t border-slate-100 mt-5 space-y-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* UF */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> Estados (UF)
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal bg-white hover:bg-slate-50 border-slate-200"
                  >
                    <span className="truncate text-slate-700">
                      {filters.ufs.length > 0
                        ? `${filters.ufs.length} estado(s) selecionado(s)`
                        : 'Todos os Estados'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-2 rounded-xl shadow-lg border-slate-100">
                  <ScrollArea className="h-64">
                    <div className="pr-3">
                      {BRAZIL_STATES.map((uf) => (
                        <DropdownMenuCheckboxItem
                          key={uf}
                          checked={filters.ufs.includes(uf)}
                          onCheckedChange={(c) => toggleUf(uf, c)}
                          className="cursor-pointer rounded-md my-0.5"
                        >
                          {uf}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Municipio */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-slate-400" /> Município
              </Label>
              <Input
                placeholder="Ex: São Paulo"
                value={filters.municipio}
                onChange={(e) => setFilter('municipio', e.target.value)}
                className="bg-white focus:bg-white transition-colors border-slate-200"
              />
            </div>

            {/* Porte */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-slate-400" /> Porte da Empresa
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal bg-white hover:bg-slate-50 border-slate-200"
                  >
                    <span className="truncate text-slate-700">
                      {filters.porte.length > 0
                        ? `${filters.porte.length} porte(s) selecionado(s)`
                        : 'Qualquer Porte'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 rounded-xl shadow-lg border-slate-100">
                  {COMPANY_SIZES.map((size) => (
                    <DropdownMenuCheckboxItem
                      key={size.value}
                      checked={filters.porte.includes(size.value)}
                      onCheckedChange={(c) => togglePorte(size.value, c)}
                      className="cursor-pointer rounded-md my-0.5"
                    >
                      {size.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Situação */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-slate-400" /> Situação Cadastral
              </Label>
              <Select
                value={filters.situacao || 'Todas'}
                onValueChange={(v) => setFilter('situacao', v === 'Todas' ? '' : v)}
              >
                <SelectTrigger className="bg-white hover:bg-slate-50 border-slate-200 transition-colors">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-slate-100">
                  <SelectItem value="Todas">Todas as Situações</SelectItem>
                  <SelectItem value="ATIVA">Ativa</SelectItem>
                  <SelectItem value="INAPTA">Inapta</SelectItem>
                  <SelectItem value="BAIXADA">Baixada</SelectItem>
                  <SelectItem value="SUSPENSA">Suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Capital Social Mínimo */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Capital Social Mín.
              </Label>
              <Input
                placeholder="Ex: 50000"
                type="number"
                min="0"
                value={filters.capitalMinimo}
                onChange={(e) => setFilter('capitalMinimo', e.target.value)}
                className="bg-white focus:bg-white transition-colors border-slate-200"
              />
            </div>

            {/* Quantidade (Limit) da Busca */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-slate-400" /> Qtde. por Busca
              </Label>
              <Select
                value={filters.limit?.toString() || '10'}
                onValueChange={(v) => setFilter('limit', Number(v))}
              >
                <SelectTrigger className="bg-white hover:bg-slate-50 border-slate-200 transition-colors">
                  <SelectValue placeholder="Selecione a quantidade" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-slate-100">
                  <SelectItem value="5">5 leads</SelectItem>
                  <SelectItem value="10">10 leads</SelectItem>
                  <SelectItem value="20">20 leads</SelectItem>
                  <SelectItem value="50">50 leads</SelectItem>
                  <SelectItem value="100">100 leads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Faturamento (Enriquecido) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-indigo-400" /> Faturamento Anual
                </Label>
                <span className="text-xs text-slate-500 font-medium">
                  {formatCurrencyShort(filters.faturamento[0])} -{' '}
                  {filters.faturamento[1] >= 10000000
                    ? 'R$ 10M+'
                    : formatCurrencyShort(filters.faturamento[1])}
                </span>
              </div>
              <Slider
                min={0}
                max={10000000}
                step={100000}
                value={filters.faturamento}
                onValueChange={(val) => setFilter('faturamento', val)}
              />
            </div>

            {/* Funcionários (Enriquecido) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-indigo-400" /> Funcionários
                </Label>
                <span className="text-xs text-slate-500 font-medium">
                  {filters.funcionarios[0]} -{' '}
                  {filters.funcionarios[1] >= 500 ? '500+' : filters.funcionarios[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={500}
                step={10}
                value={filters.funcionarios}
                onValueChange={(val) => setFilter('funcionarios', val)}
              />
            </div>

            {/* Score (Enriquecido) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-400" /> Score Crédito Mín.
                </Label>
                <span className="text-xs text-slate-500 font-medium">{filters.scoreMin}</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[filters.scoreMin]}
                onValueChange={(val) => setFilter('scoreMin', val[0])}
              />
            </div>

            {/* Status de Contato */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-slate-400" /> Status na Tabela
              </Label>
              <Select
                value={filters.contactStatus || 'Todos'}
                onValueChange={(v) => setFilter('contactStatus', v)}
              >
                <SelectTrigger className="bg-white hover:bg-slate-50 border-slate-200 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-slate-100">
                  <SelectItem value="Todos">Todos os Status</SelectItem>
                  <SelectItem value="Não Contatados">Não Contatados</SelectItem>
                  <SelectItem value="Contatados">Contatados</SelectItem>
                  <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer Actions of Filter Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-4 border-t border-slate-100 gap-4">
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto font-medium transition-colors"
              onClick={clearFilters}
              disabled={isSearching}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Todos os Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPermission('Exportar Lista') || filteredLeads.length === 0}
              onClick={exportToCsv}
              className="gap-2 w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-200 shadow-sm font-medium text-slate-700"
            >
              <Download className="h-4 w-4 text-slate-400" />
              Exportar Resultados
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
