import { Lead } from '@/data/mock-leads'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MapPin, Search, Save, Building2, Users, History, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export function LeadDetailsModal({ lead }: { lead: Lead }) {
  const handleSave = () => {
    toast.success('Lead salvo com sucesso!')
  }

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lead.razaoSocial} ${lead.municipio} ${lead.uf}`,
  )}`

  const linkedinUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(
    lead.razaoSocial,
  )}`

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl flex items-center gap-2">{lead.razaoSocial}</DialogTitle>
        <DialogDescription>
          Detalhes completos da empresa e histórico de interação.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 mt-2">
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-primary" />
            Dados da Empresa
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Razão Social</p>
              <p className="font-medium">{lead.razaoSocial}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CNPJ</p>
              <p className="font-medium">{lead.cnpj}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CNAE Principal</p>
              <p className="font-medium">{lead.cnaePrincipal}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Município</p>
              <p className="font-medium">{lead.municipio}</p>
            </div>
            <div>
              <p className="text-muted-foreground">UF</p>
              <p className="font-medium">{lead.uf}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Porte</p>
              <p className="font-medium">{lead.porte}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Situação Cadastral</p>
              <Badge
                variant={lead.situacao === 'Ativa' ? 'default' : 'secondary'}
                className={lead.situacao === 'Ativa' ? 'bg-primary text-white' : ''}
              >
                {lead.situacao}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Capital Social</p>
              <p className="font-medium text-emerald-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  lead.capitalSocial,
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data de Abertura</p>
              <p className="font-medium">{lead.dataAbertura}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p className="font-medium flex items-center gap-1">
                <Mail className="w-3 h-3" /> {lead.email || 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p className="font-medium flex items-center gap-1">
                <Phone className="w-3 h-3" /> {lead.telefone || 'Não informado'}
              </p>
            </div>
          </div>
        </section>

        <Separator />

        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-primary" />
            Sócios
          </h3>
          {lead.socios && lead.socios.length > 0 ? (
            <div className="space-y-3">
              {lead.socios.map((socio, idx) => (
                <div
                  key={idx}
                  className="bg-muted/30 border p-3 rounded-md grid grid-cols-1 md:grid-cols-3 gap-2 text-sm"
                >
                  <div>
                    <p className="text-muted-foreground text-xs">Nome</p>
                    <p className="font-medium">{socio.nome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Qualificação</p>
                    <p className="font-medium">{socio.qualificacao}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Data de Entrada</p>
                    <p className="font-medium">{socio.dataEntrada}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum sócio registrado para esta empresa.
            </p>
          )}
        </section>

        <Separator />

        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-primary" />
            Histórico de Contato
          </h3>
          {lead.contatado ? (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-md text-sm">
              <p className="text-emerald-800 font-semibold mb-1 text-base">Status: Contatado</p>
              <p className="text-emerald-700">
                Contato registrado por <strong>{lead.contatadoPor}</strong> na data de{' '}
                <strong>{lead.contatadoEm}</strong>.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-md text-sm">
              <p className="text-slate-700 font-semibold mb-1 text-base">Status: Não Contatado</p>
              <p className="text-slate-500">
                Nenhum contato foi registrado com este lead até o momento. Utilize a tabela
                principal para marcar como contatado.
              </p>
            </div>
          )}
        </section>

        <Separator />

        <section className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-4 h-4 mr-2" />
              Ver no Maps
            </a>
          </Button>
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
              <Search className="w-4 h-4 mr-2" />
              Buscar no LinkedIn
            </a>
          </Button>
          <Button onClick={handleSave} className="flex-1 sm:flex-none sm:ml-auto">
            <Save className="w-4 h-4 mr-2" />
            Salvar Lead
          </Button>
        </section>
      </div>
    </>
  )
}
