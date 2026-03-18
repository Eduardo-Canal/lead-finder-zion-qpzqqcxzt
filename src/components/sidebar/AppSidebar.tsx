import { useState } from 'react'
import { X } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import useLeadStore from '@/stores/useLeadStore'

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

export function AppSidebar() {
  const { filters, setFilter, addCnae, removeCnae, toggleUf } = useLeadStore()
  const [cnaeInput, setCnaeInput] = useState('')

  const handleAddCnae = (e: React.FormEvent) => {
    e.preventDefault()
    if (cnaeInput.trim()) {
      addCnae(cnaeInput.trim())
      setCnaeInput('')
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="pt-6 pb-2 px-4">
        <h2 className="text-xl font-bold text-sidebar-foreground">Filtros Avançados</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>CNAE Registration</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <form onSubmit={handleAddCnae} className="flex gap-2 mt-2">
              <Input
                placeholder="Ex: 6201-5/01"
                value={cnaeInput}
                onChange={(e) => setCnaeInput(e.target.value)}
                className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border"
              />
              <Button type="submit" variant="secondary">
                Adicionar
              </Button>
            </form>
            <div className="flex flex-wrap gap-2 mt-3">
              {filters.cnaes.map((cnae) => (
                <Badge
                  key={cnae}
                  variant="secondary"
                  className="bg-sidebar-accent text-sidebar-foreground flex items-center gap-1 animate-in fade-in slide-in-from-left-2"
                >
                  {cnae}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeCnae(cnae)}
                  />
                </Badge>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Localização</SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-sidebar-foreground/80">UF</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-sidebar-accent text-sidebar-foreground border-sidebar-border"
                  >
                    {filters.ufs.length > 0
                      ? `${filters.ufs.length} selecionados`
                      : 'Selecione UFs'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <ScrollArea className="h-72">
                    {BRAZIL_STATES.map((uf) => (
                      <DropdownMenuCheckboxItem
                        key={uf}
                        checked={filters.ufs.includes(uf)}
                        onCheckedChange={(c) => toggleUf(uf, c)}
                      >
                        {uf}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              <Label className="text-sidebar-foreground/80">Município</Label>
              <Input
                placeholder="Ex: São Paulo"
                value={filters.municipio}
                onChange={(e) => setFilter('municipio', e.target.value)}
                className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Dados da Empresa</SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-sidebar-foreground/80">Porte</Label>
              <Select
                value={filters.porte}
                onValueChange={(v) => setFilter('porte', v === 'Todos' ? '' : v)}
              >
                <SelectTrigger className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="ME">ME</SelectItem>
                  <SelectItem value="EPP">EPP</SelectItem>
                  <SelectItem value="Demais">Demais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sidebar-foreground/80">Situação Cadastral</Label>
              <Select
                value={filters.situacao}
                onValueChange={(v) => setFilter('situacao', v === 'Todas' ? '' : v)}
              >
                <SelectTrigger className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Inapta">Inapta</SelectItem>
                  <SelectItem value="Baixada">Baixada</SelectItem>
                  <SelectItem value="Suspensa">Suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sidebar-foreground/80">Capital Social Mínimo</Label>
              <Input
                type="number"
                placeholder="Ex: 50000"
                value={filters.capitalMinimo}
                onChange={(e) => setFilter('capitalMinimo', e.target.value)}
                className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
