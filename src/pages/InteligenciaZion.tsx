import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Trash2,
  Plus,
  Briefcase,
  Search,
  Filter,
  MapPin,
  Building2,
  Phone,
  Mail,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function InteligenciaZion() {
  const [cnaes, setCnaes] = useState<{ id: string; cnae: string; description: string }[]>(() => {
    try {
      const saved = localStorage.getItem('zion_cnaes')
      return saved
        ? JSON.parse(saved)
        : [
            { id: '1', cnae: '6204-0/00', description: 'Consultoria em tecnologia da informação' },
            {
              id: '2',
              cnae: '6201-5/01',
              description: 'Desenvolvimento de programas de computador sob encomenda',
            },
          ]
    } catch {
      return []
    }
  })

  const [newCnae, setNewCnae] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    localStorage.setItem('zion_cnaes', JSON.stringify(cnaes))
  }, [cnaes])

  const handleAdd = () => {
    if (!newCnae) return
    setCnaes([...cnaes, { id: Date.now().toString(), cnae: newCnae, description: newDesc }])
    setNewCnae('')
    setNewDesc('')
  }

  const handleRemove = (id: string) => {
    setCnaes(cnaes.filter((c) => c.id !== id))
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 h-[calc(100vh-4rem)] flex flex-col animate-fade-in-up">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Lead Finder Zion</h1>
          <p className="text-muted-foreground mt-1">
            Busque e gerencie leads B2B de forma inteligente.
          </p>
        </div>
        <Button>
          <Search className="w-4 h-4 mr-2" />
          Nova Busca de Leads
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar - Filtros e CNAEs */}
        <div className="col-span-1 flex flex-col gap-6 overflow-hidden">
          <Card className="shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Filtros Avançados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Localização</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input placeholder="Estado ou Cidade" className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capital Social Mínimo</Label>
                <Input type="number" placeholder="R$ 100.000,00" />
              </div>
              <Button className="w-full">Aplicar Filtros</Button>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Meus CNAEs
              </CardTitle>
              <CardDescription>Gerencie as áreas de interesse</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="space-y-2 shrink-0">
                <Input
                  placeholder="Código CNAE (Ex: 6204-0/00)"
                  value={newCnae}
                  onChange={(e) => setNewCnae(e.target.value)}
                />
                <Input
                  placeholder="Descrição (opcional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                <Button onClick={handleAdd} className="w-full" variant="secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar CNAE
                </Button>
              </div>

              <ScrollArea className="flex-1 -mx-4 px-4 mt-2">
                {cnaes.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Nenhum CNAE monitorado.
                  </div>
                ) : (
                  <div className="space-y-3 pr-4">
                    {cnaes.map((cnae) => (
                      <div
                        key={cnae.id}
                        className="group flex items-start justify-between p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-medium text-sm truncate">{cnae.cnae}</div>
                          {cnae.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {cnae.description}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(cnae.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0 h-8 w-8 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Área de Resultados */}
        <Card className="col-span-1 lg:col-span-3 flex flex-col min-h-0">
          <CardHeader className="border-b shrink-0 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Resultados da Busca</CardTitle>
                <CardDescription>Mostrando leads recentes do setor de tecnologia</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="Buscar leads na lista..." className="pl-9 bg-background" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto bg-muted/10">
            <div className="p-6 space-y-4">
              {/* Mock Lead 1 */}
              <div className="bg-background p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg mt-1">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                        Tech Solutions Brasil LTDA
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          Verificado
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        12.345.678/0001-90
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Adicionar ao CRM
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t text-sm">
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Briefcase className="w-3.5 h-3.5" /> CNAE Principal
                    </span>
                    <span className="font-medium">6204-0/00 - Consultoria em TI</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5" /> Localização
                    </span>
                    <span className="font-medium">São Paulo, SP - Pinheiros</span>
                  </div>
                  <div className="space-y-1">
                    <span className="flex items-center gap-2 text-foreground font-medium">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" /> (11) 98765-4321
                    </span>
                    <span className="flex items-center gap-2 text-foreground font-medium">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />{' '}
                      contato@techsolutions.com.br
                    </span>
                  </div>
                </div>
              </div>

              {/* Mock Lead 2 */}
              <div className="bg-background p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg mt-1">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                        Inovação Software S.A.
                        <Badge variant="secondary">Analisando</Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        98.765.432/0001-10
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Adicionar ao CRM
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t text-sm">
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Briefcase className="w-3.5 h-3.5" /> CNAE Principal
                    </span>
                    <span className="font-medium">6201-5/01 - Desenvolvimento de software</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5" /> Localização
                    </span>
                    <span className="font-medium">Campinas, SP - Centro</span>
                  </div>
                  <div className="space-y-1">
                    <span className="flex items-center gap-2 text-foreground font-medium">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" /> (19) 3232-1234
                    </span>
                    <span className="flex items-center gap-2 text-foreground font-medium">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />{' '}
                      comercial@inovasoftware.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
