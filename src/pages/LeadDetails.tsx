import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, Briefcase, Calendar, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useLeadStore from '@/stores/useLeadStore'

export default function LeadDetails() {
  const { cnpj } = useParams()
  const { leads, toggleContact } = useLeadStore()

  const lead = leads.find((l) => l.cnpj === decodeURIComponent(cnpj || ''))

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Lead não encontrado</h2>
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-primary">{lead.razaoSocial}</h2>
          <p className="text-muted-foreground">{lead.cnpj}</p>
        </div>
        <div className="ml-auto">
          {lead.contatado ? (
            <Badge
              className="bg-emerald-500 text-white text-base py-1.5 px-4 cursor-pointer hover:bg-emerald-600"
              onClick={() => toggleContact(lead.cnpj)}
            >
              Status: Contatado
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-base py-1.5 px-4 cursor-pointer hover:bg-slate-100"
              onClick={() => toggleContact(lead.cnpj)}
            >
              Status: Pendente
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Building2 className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Dados Principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Porte</p>
                <p className="font-medium">{lead.porte}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Situação</p>
                <Badge
                  variant={lead.situacao === 'Ativa' ? 'default' : 'secondary'}
                  className={lead.situacao === 'Ativa' ? 'bg-primary text-white' : ''}
                >
                  {lead.situacao}
                </Badge>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Natureza Jurídica</p>
              <p className="font-medium">{lead.naturezaJuridica}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Capital Social</p>
              <p className="font-medium text-emerald-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  lead.capitalSocial,
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Briefcase className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Atividades (CNAE)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Atividade Principal</p>
              <Badge className="mt-1 text-sm bg-primary">{lead.cnaePrincipal}</Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Atividades Secundárias
              </p>
              {lead.cnaesSecundarios.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {lead.cnaesSecundarios.map((cnae) => (
                    <Badge key={cnae} variant="outline">
                      {cnae}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma atividade secundária registrada.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapPin className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Localização</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Município / UF</p>
              <p className="font-medium text-lg">
                {lead.municipio} - {lead.uf}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Calendar className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Abertura</p>
              <p className="font-medium">{lead.dataAbertura}</p>
            </div>
            <Separator />
            {lead.contatado && (
              <div className="bg-emerald-50 p-3 rounded-md border border-emerald-100">
                <p className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                  <Info className="h-4 w-4" /> Contato Registrado
                </p>
                <p className="text-sm mt-1 text-emerald-700">
                  Realizado por <strong>{lead.contatadoPor}</strong> em {lead.contatadoEm}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
