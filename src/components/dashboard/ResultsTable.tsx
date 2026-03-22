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
import useLeadStore from '@/stores/useLeadStore'
import useAuthStore from '@/stores/useAuthStore'
import { LeadDetailsModal } from './LeadDetailsModal'
import { cn } from '@/lib/utils'
import { Loader2, Copy } from 'lucide-react'
import { toast } from 'sonner'

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

const copyToClipboard = (text: string, label: string) => {
  if (!text || text === '-') return
  navigator.clipboard.writeText(text)
  toast.success(`${label} copiado para a área de transferência!`)
}

export function ResultsTable() {
  const { filteredLeads, toggleContact, isSearching, pagination, searchLeads, setFilter, filters } =
    useLeadStore()
  const { hasPermission } = useAuthStore()
  const [selectedLeadCnpj, setSelectedLeadCnpj] = useState<string | null>(null)

  const selectedLead = filteredLeads.find((l) => l.cnpj === selectedLeadCnpj)
  const canContact = hasPermission('Marcar Contato')

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col w-full overflow-x-auto">
        <Table className="min-w-[1600px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[160px]">CNPJ</TableHead>
              <TableHead className="w-[200px]">Razão Social</TableHead>
              <TableHead className="w-[180px]">CNAE Principal</TableHead>
              <TableHead className="w-[120px]">Município</TableHead>
              <TableHead className="w-[60px]">UF</TableHead>
              <TableHead className="w-[100px]">Porte</TableHead>
              <TableHead className="w-[120px]">Situação Cadastral</TableHead>
              <TableHead className="w-[120px]">Capital Social</TableHead>
              <TableHead className="w-[120px]">Data de Abertura</TableHead>
              <TableHead className="w-[250px]">E-mail</TableHead>
              <TableHead className="w-[200px]">Telefone</TableHead>
              <TableHead className="w-[120px]">Contatado</TableHead>
              <TableHead className="text-right w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isSearching ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-20 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Buscando leads na base de dados...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-10 text-muted-foreground">
                  Nenhum lead encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id || lead.cnpj}
                  className="animate-fade-in group text-xs sm:text-sm"
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    {formatCnpj(formatObjectField(lead.cnpj))}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate w-full cursor-help hover:text-primary transition-colors">
                          {formatObjectField(lead.razao_social) || '-'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="start"
                        className="max-w-[400px] break-words bg-slate-900 text-slate-50"
                      >
                        <p className="font-medium text-sm">
                          {formatObjectField(lead.razao_social) || '-'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate w-full cursor-help hover:text-primary transition-colors">
                          {formatObjectField(lead.cnae_principal) || '-'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="start"
                        className="max-w-[400px] break-words bg-slate-900 text-slate-50"
                      >
                        <p className="text-sm">{formatObjectField(lead.cnae_principal) || '-'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap truncate max-w-[120px]"
                    title={formatObjectField(lead.municipio)}
                  >
                    {formatObjectField(lead.municipio)}
                  </TableCell>
                  <TableCell>{formatObjectField(lead.uf)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="whitespace-nowrap">
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
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : ''
                      }
                    >
                      {formatObjectField(lead.situacao) || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatCurrency(lead.capital_social)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(lead.data_abertura)}
                  </TableCell>
                  <TableCell className="min-w-[250px] whitespace-normal break-all">
                    <div className="flex items-center justify-between gap-2 group/copy">
                      <span>{formatObjectField(lead.email)}</span>
                      {formatObjectField(lead.email) !== '-' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover/copy:opacity-100 shrink-0 text-muted-foreground hover:text-primary transition-all"
                          onClick={() => copyToClipboard(formatObjectField(lead.email), 'E-mail')}
                          title="Copiar E-mail"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[200px] whitespace-normal">
                    <div className="flex items-center justify-between gap-2 group/copy">
                      <span>{formatObjectField(lead.telefone)}</span>
                      {formatObjectField(lead.telefone) !== '-' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover/copy:opacity-100 shrink-0 text-muted-foreground hover:text-primary transition-all"
                          onClick={() =>
                            copyToClipboard(formatObjectField(lead.telefone), 'Telefone')
                          }
                          title="Copiar Telefone"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.contatado ? (
                      <Badge
                        className={cn(
                          'bg-emerald-500 text-white flex gap-1 w-max items-center px-2 py-1 animate-in zoom-in-95',
                          canContact && 'hover:bg-emerald-600 cursor-pointer',
                        )}
                        onClick={() => canContact && toggleContact(lead.cnpj)}
                        title={`Contatado por: ${lead.contatadoPor} em ${lead.contatadoEm}`}
                      >
                        Sim
                      </Badge>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`contact-${lead.cnpj}`}
                          checked={false}
                          disabled={!canContact}
                          onCheckedChange={() => canContact && toggleContact(lead.cnpj)}
                        />
                        <label
                          htmlFor={`contact-${lead.cnpj}`}
                          className={cn(
                            'text-xs select-none',
                            canContact
                              ? 'cursor-pointer text-muted-foreground'
                              : 'text-muted-foreground/50',
                          )}
                        >
                          Marcar
                        </label>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLeadCnpj(lead.cnpj)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filteredLeads.length > 0 && pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 border-t mt-auto gap-4 sticky left-0 right-0">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Itens por página:</span>
                <Select
                  value={filters.limit?.toString() || '10'}
                  onValueChange={(v) => {
                    const newLimit = Number(v)
                    setFilter('limit', newLimit)
                    searchLeads(1, newLimit)
                  }}
                  disabled={isSearching}
                >
                  <SelectTrigger className="h-8 w-[70px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center sm:text-left">
                Página <span className="font-medium text-foreground">{pagination.page}</span> de{' '}
                <span className="font-medium text-foreground">{pagination.totalPages}</span> (
                {pagination.totalCount} resultados)
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
                        : 'cursor-pointer',
                      'bg-white',
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
                        : 'cursor-pointer',
                      'bg-white',
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLeadCnpj(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Detalhes do Lead</DialogTitle>
          {selectedLead && (
            <LeadDetailsModal lead={selectedLead} onClose={() => setSelectedLeadCnpj(null)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
