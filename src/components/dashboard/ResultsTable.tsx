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
import { Dialog, DialogContent } from '@/components/ui/dialog'
import useLeadStore from '@/stores/useLeadStore'
import useAuthStore from '@/stores/useAuthStore'
import { LeadDetailsModal } from './LeadDetailsModal'
import { cn } from '@/lib/utils'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export function ResultsTable() {
  const { filteredLeads, toggleContact, isSearching, pagination, searchLeads } = useLeadStore()
  const { hasPermission } = useAuthStore()
  const [selectedLeadCnpj, setSelectedLeadCnpj] = useState<string | null>(null)

  const selectedLead = filteredLeads.find((l) => l.cnpj === selectedLeadCnpj)
  const canContact = hasPermission('Marcar Contato')

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>CNAE Principal</TableHead>
              <TableHead>Município/UF</TableHead>
              <TableHead>Porte</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-[250px]">Contatado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isSearching ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Buscando leads na base de dados...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Nenhum lead encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id || lead.cnpj} className="animate-fade-in group">
                  <TableCell className="font-medium">{lead.razao_social}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {lead.cnpj}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={lead.cnae_principal}>
                    {lead.cnae_principal}
                  </TableCell>
                  <TableCell>
                    {lead.municipio} - {lead.uf}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.porte}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={lead.situacao === 'Ativa' ? 'default' : 'secondary'}
                      className={lead.situacao === 'Ativa' ? 'bg-primary text-white' : ''}
                    >
                      {lead.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.contatado ? (
                      <Badge
                        className={cn(
                          'bg-emerald-500 text-white flex gap-2 w-max items-center px-3 py-1 animate-in zoom-in-95',
                          canContact && 'hover:bg-emerald-600 cursor-pointer',
                        )}
                        onClick={() => canContact && toggleContact(lead.cnpj)}
                      >
                        Contatado por: {lead.contatadoPor} <br className="hidden" /> -{' '}
                        {lead.contatadoEm}
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
                            'text-sm select-none',
                            canContact
                              ? 'cursor-pointer text-muted-foreground'
                              : 'text-muted-foreground/50',
                          )}
                        >
                          Marcar contato
                        </label>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLeadCnpj(lead.cnpj)}
                      className="opacity-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!isSearching && filteredLeads.length > 0 && pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 border-t mt-auto gap-4">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Página <span className="font-medium text-foreground">{pagination.page}</span> de{' '}
              <span className="font-medium text-foreground">{pagination.totalPages}</span> (
              {pagination.totalCount} resultados)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchLeads(pagination.page - 1)}
                disabled={pagination.page <= 1 || isSearching}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchLeads(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isSearching}
              >
                Próxima <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLeadCnpj(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <LeadDetailsModal lead={selectedLead} onClose={() => setSelectedLeadCnpj(null)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
