import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useLeadStore from '@/stores/useLeadStore'
import useAuthStore from '@/stores/useAuthStore'
import { LeadDetailsModal } from './LeadDetailsModal'
import { cn, isValidCNPJ } from '@/lib/utils'
import {
  Copy,
  Building2,
  MapPin,
  Briefcase,
  FileText,
  Calendar,
  Mail,
  Phone,
  Users,
  CheckCircle2,
  ChevronRight,
  Activity,
  DollarSign,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState, LoadingTableRows } from '@/components/Notifications/StateBlocks'
import { designTokens } from '@/constants/designTokens'

const formatCnpj = (cnpj: string) => {
  if (!cnpj) return ''
  const cleaned = String(cnpj).replace(/\D/g, '')
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num || 0)
}

const formatDate = (date: string) => {
  if (!date || date === '-') return '-'
  try {
    const dStr = String(date)
    if (dStr.includes('T')) {
      const raw = dStr.split('T')[0]
      const parts = raw.split('-')
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
    if (dStr.includes('-')) {
      const parts = dStr.split('-')
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }

    const d = new Date(dStr)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    }
    return dStr
  } catch {
    return date
  }
}

const formatObjectField = (val: any): string => {
  if (val === null || val === undefined || val === '') return '-'
  if (typeof val === 'string' || typeof val === 'number') {
    const s = String(val).trim()
    return s === '' ? '-' : s
  }
  if (Array.isArray(val)) {
    const s = val
      .map(formatObjectField)
      .filter((v) => v !== '-')
      .join(', ')
    return s === '' ? '-' : s
  }
  if (typeof val === 'object') {
    if ('email' in val && typeof val.email === 'string') return val.email
    if ('telefone' in val && typeof val.telefone === 'string') return val.telefone
    if ('codigo' in val && 'descricao' in val) return `${val.codigo} - ${val.descricao}`
    if ('id' in val && 'descricao' in val) return `${val.id} - ${val.descricao}`
    if ('text' in val) return String(val.text)
    if ('nome' in val) return String(val.nome)
    if ('sigla' in val) return String(val.sigla)
    try {
      const str = JSON.stringify(val)
      return str === '{}' ? '-' : str
    } catch {
      return String(val)
    }
  }
  return String(val)
}

export function ResultsTable() {
  const {
    filteredLeads,
    updateContactStatus,
    removeContact,
    isSearching,
    pagination,
    searchLeads,
    setFilter,
    filters,
    clearFilters,
  } = useLeadStore()
  const { hasPermission } = useAuthStore()
  const [selectedLeadCnpj, setSelectedLeadCnpj] = useState<string | null>(null)

  const selectedLead = filteredLeads.find((l) => l.cnpj === selectedLeadCnpj)
  const canContact = hasPermission('Marcar Contato')

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation()
    if (!text || text === '-') return
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado para a área de transferência!`)
  }

  return (
    <>
      <div
        className={cn(
          designTokens.layout.tableContainer,
          'flex flex-col w-full overflow-hidden border-slate-200 shadow-sm bg-white rounded-xl relative',
        )}
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[1600px]">
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b-slate-200">
                <TableHead className="w-[160px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" /> CNPJ
                  </div>
                </TableHead>
                <TableHead className="w-[220px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" /> Razão Social
                  </div>
                </TableHead>
                <TableHead className="w-[200px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" /> CNAE Principal
                  </div>
                </TableHead>
                <TableHead className="w-[130px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" /> Município
                  </div>
                </TableHead>
                <TableHead className="w-[70px] font-semibold text-slate-700">UF</TableHead>
                <TableHead className="w-[110px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-slate-400" /> Porte
                  </div>
                </TableHead>
                <TableHead className="w-[130px] font-semibold text-slate-700">Situação</TableHead>
                <TableHead className="w-[130px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-400" /> Capital
                  </div>
                </TableHead>
                <TableHead className="w-[130px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" /> Abertura
                  </div>
                </TableHead>
                <TableHead className="w-[230px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-slate-400" /> E-mail
                  </div>
                </TableHead>
                <TableHead className="w-[180px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" /> Telefone
                  </div>
                </TableHead>
                <TableHead className="w-[150px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" /> Status
                  </div>
                </TableHead>
                <TableHead className="text-right w-[80px] pr-6 font-semibold text-slate-700">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {isSearching ? (
                <LoadingTableRows columns={13} rows={10} />
              ) : filteredLeads.length === 0 ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={13} className="p-0">
                    <div className="h-96 flex items-center justify-center">
                      <EmptyState
                        title="Nenhum lead encontrado"
                        description="Ajuste os filtros ou inicie uma nova busca para obter resultados."
                        icon={Search}
                        actionLabel={filters.cnaes.length > 0 ? 'Limpar Filtros' : undefined}
                        onAction={clearFilters}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id || lead.cnpj}
                    className={cn(
                      'animate-fade-in group text-sm cursor-pointer transition-all duration-200 border-b-slate-100',
                      selectedLeadCnpj === lead.cnpj
                        ? 'bg-primary/5 ring-1 ring-inset ring-primary/20 shadow-sm z-10 relative'
                        : 'hover:bg-slate-50/80',
                    )}
                    onClick={() => setSelectedLeadCnpj(lead.cnpj)}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-slate-700 group-hover:text-primary transition-colors">
                          {formatCnpj(formatObjectField(lead.cnpj))}
                        </span>
                        {!isValidCNPJ(formatObjectField(lead.cnpj)) && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider font-semibold"
                          >
                            Inválido
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 max-w-[220px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate w-full group-hover:text-primary transition-colors">
                            {formatObjectField(lead.razao_social) || '-'}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="start"
                          className="max-w-[400px] break-words bg-slate-800 text-slate-50 font-medium"
                        >
                          {formatObjectField(lead.razao_social) || '-'}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="max-w-[200px] text-slate-600">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate w-full">
                            {formatObjectField(lead.cnae_principal) || '-'}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="start"
                          className="max-w-[400px] break-words bg-slate-800 text-slate-50"
                        >
                          {formatObjectField(lead.cnae_principal) || '-'}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      className="whitespace-nowrap truncate max-w-[130px] text-slate-600"
                      title={formatObjectField(lead.municipio)}
                    >
                      {formatObjectField(lead.municipio)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {formatObjectField(lead.uf)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap bg-white text-slate-600 font-medium border-slate-200"
                      >
                        {formatObjectField(lead.porte)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          formatObjectField(lead.situacao).toUpperCase() === 'ATIVA'
                            ? 'default'
                            : 'secondary'
                        }
                        className={
                          formatObjectField(lead.situacao).toUpperCase() === 'ATIVA'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 font-semibold'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 font-semibold'
                        }
                      >
                        {formatObjectField(lead.situacao) || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-slate-700">
                      {formatCurrency(lead.capital_social)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-600">
                      {formatDate(lead.data_abertura)}
                    </TableCell>
                    <TableCell className="min-w-[230px] whitespace-normal break-all text-slate-600">
                      <div className="flex items-center justify-between gap-2 group/copy">
                        <span className="line-clamp-2">{formatObjectField(lead.email)}</span>
                        {formatObjectField(lead.email) !== '-' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover/copy:opacity-100 shrink-0 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all bg-white shadow-sm border border-slate-100"
                            onClick={(e) => handleCopy(e, formatObjectField(lead.email), 'E-mail')}
                            title="Copiar E-mail"
                            aria-label="Copiar E-mail"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px] whitespace-normal text-slate-600">
                      <div className="flex items-center justify-between gap-2 group/copy">
                        <span className="font-mono">{formatObjectField(lead.telefone)}</span>
                        {formatObjectField(lead.telefone) !== '-' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover/copy:opacity-100 shrink-0 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all bg-white shadow-sm border border-slate-100"
                            onClick={(e) =>
                              handleCopy(e, formatObjectField(lead.telefone), 'Telefone')
                            }
                            title="Copiar Telefone"
                            aria-label="Copiar Telefone"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.contatado ? (
                        <div
                          className="flex flex-col gap-1.5 items-start"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={!canContact}>
                              <Badge
                                className={cn(
                                  'flex gap-1.5 w-max items-center px-2.5 py-1 animate-in zoom-in-95 shadow-sm border font-semibold',
                                  lead.status_contato === 'Em Negociação'
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200',
                                  canContact && 'cursor-pointer',
                                )}
                                title={`Contatado em: ${lead.contatadoEm}`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {lead.status_contato === 'Em Negociação'
                                  ? 'Em Negociação'
                                  : 'Contatado'}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="rounded-xl p-1 shadow-lg">
                              <DropdownMenuItem
                                onClick={() => updateContactStatus(lead.cnpj, 'Contatado')}
                                className="cursor-pointer font-medium"
                              >
                                Marcar como Contatado
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateContactStatus(lead.cnpj, 'Em Negociação')}
                                className="cursor-pointer font-medium"
                              >
                                Marcar como Em Negociação
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => removeContact(lead.cnpj)}
                                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer font-medium"
                              >
                                Remover Marcação
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {lead.contatadoPor && (
                            <div
                              className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[130px] font-medium tracking-wide flex items-center gap-1"
                              title={`Executivo responsável: ${lead.contatadoPor}`}
                            >
                              <Users className="w-3 h-3" /> {lead.contatadoPor.split(' ')[0]}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="flex items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            id={`contact-${lead.cnpj}`}
                            checked={false}
                            disabled={!canContact}
                            onCheckedChange={() =>
                              canContact && updateContactStatus(lead.cnpj, 'Contatado')
                            }
                            aria-label="Marcar como Contatado"
                            className="border-slate-300 text-primary focus:ring-primary/20"
                          />
                          <label
                            htmlFor={`contact-${lead.cnpj}`}
                            className={cn(
                              'text-xs select-none font-medium',
                              canContact
                                ? 'cursor-pointer text-slate-600 hover:text-primary transition-colors'
                                : 'text-slate-400',
                            )}
                          >
                            Marcar
                          </label>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all h-8 w-8 rounded-full"
                        aria-label="Ver Detalhes"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredLeads.length > 0 && pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 gap-4 mt-auto">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-sm text-slate-600 w-full sm:w-auto font-medium">
              <div className="flex items-center gap-2.5">
                <span className="whitespace-nowrap text-slate-500">Exibir por página:</span>
                <Select
                  value={filters.limit?.toString() || '10'}
                  onValueChange={(v) => {
                    const newLimit = Number(v)
                    setFilter('limit', newLimit)
                    searchLeads(1, newLimit)
                  }}
                  disabled={isSearching}
                >
                  <SelectTrigger className="h-8 w-[75px] bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-[75px]">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center sm:text-left text-slate-500">
                Página <span className="font-bold text-slate-800">{pagination.page}</span> de{' '}
                <span className="font-bold text-slate-800">{pagination.totalPages}</span>{' '}
                <span className="text-slate-400 mx-1">|</span>{' '}
                <span className="font-bold text-slate-800">{pagination.totalCount}</span> leads
              </div>
            </div>

            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (pagination.page > 1 && !isSearching) searchLeads(pagination.page - 1)
                    }}
                    className={cn(
                      pagination.page <= 1 || isSearching
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer hover:bg-slate-200 hover:text-slate-900',
                      'bg-white border border-slate-200 shadow-sm transition-colors',
                    )}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (pagination.page < pagination.totalPages && !isSearching)
                        searchLeads(pagination.page + 1)
                    }}
                    className={cn(
                      pagination.page >= pagination.totalPages || isSearching
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer hover:bg-slate-200 hover:text-slate-900',
                      'bg-white border border-slate-200 shadow-sm transition-colors',
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLeadCnpj(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50/50">
          <DialogTitle className="sr-only">Detalhes do Lead</DialogTitle>
          {selectedLead && (
            <LeadDetailsModal lead={selectedLead} onClose={() => setSelectedLeadCnpj(null)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
