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
import { LeadDetailsModal } from './LeadDetailsModal'

export function ResultsTable() {
  const { filteredLeads, toggleContact } = useLeadStore()
  const [selectedLeadCnpj, setSelectedLeadCnpj] = useState<string | null>(null)

  const selectedLead = filteredLeads.find((l) => l.cnpj === selectedLeadCnpj)

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
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
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Nenhum lead encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.cnpj} className="animate-fade-in group">
                  <TableCell className="font-medium">{lead.razaoSocial}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {lead.cnpj}
                  </TableCell>
                  <TableCell>{lead.cnaePrincipal}</TableCell>
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
                        className="bg-emerald-500 hover:bg-emerald-600 text-white flex gap-2 w-max items-center px-3 py-1 animate-in zoom-in-95 cursor-pointer"
                        onClick={() => toggleContact(lead.cnpj)}
                      >
                        Contatado por: {lead.contatadoPor} <br className="hidden" /> -{' '}
                        {lead.contatadoEm}
                      </Badge>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`contact-${lead.cnpj}`}
                          checked={false}
                          onCheckedChange={() => toggleContact(lead.cnpj)}
                        />
                        <label
                          htmlFor={`contact-${lead.cnpj}`}
                          className="text-sm text-muted-foreground cursor-pointer select-none"
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
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLeadCnpj(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedLead && <LeadDetailsModal lead={selectedLead} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
