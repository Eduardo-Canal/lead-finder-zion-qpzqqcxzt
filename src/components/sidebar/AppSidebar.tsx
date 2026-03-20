import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Target,
  Settings,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/useAuthStore'

export function AppSidebar() {
  const { hasPermission, user } = useAuthStore()
  const location = useLocation()
  const { toggleSidebar, state } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-16 shrink-0 items-center justify-between px-4 group-data-[collapsible=icon]:px-2 flex-row border-b border-sidebar-border/20">
        <h2 className="text-lg font-bold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden truncate">
          Menu Principal
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 shrink-0 group-data-[collapsible=icon]:mx-auto"
          title={state === 'expanded' ? 'Recolher Menu' : 'Expandir Menu'}
        >
          {state === 'expanded' ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 uppercase tracking-wider font-semibold group-data-[collapsible=icon]:hidden">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent className="pt-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/'} tooltip="Dashboard">
                  <Link to="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/prospeccao'}
                  tooltip="Painel de Prospecção"
                >
                  <Link to="/prospeccao">
                    <Target />
                    <span>Painel de Prospecção</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/meus-leads'}
                  tooltip="Meus Leads"
                >
                  <Link to="/meus-leads">
                    <Users />
                    <span>Meus Leads</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {hasPermission('Acessar Admin') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/gestao-usuarios'}
                    tooltip="Gestão de Usuários"
                  >
                    <Link to="/gestao-usuarios">
                      <ShieldCheck />
                      <span>Gestão de Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {user?.perfis_acesso?.nome === 'Administrador' && (
                <Collapsible
                  defaultOpen={
                    location.pathname.includes('/configuracoes') ||
                    location.pathname.includes('/admin')
                  }
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Configurações">
                        <Settings />
                        <span>Configurações</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname === '/configuracoes/avancado'}
                          >
                            <Link to="/configuracoes/avancado">
                              <span>Avançado</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname === '/admin/debug-api'}
                          >
                            <Link to="/admin/debug-api">
                              <span>Debug API Casa dos Dados</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname === '/admin/debug-bitrix'}
                          >
                            <Link to="/admin/debug-bitrix">
                              <span>Debug API Bitrix24</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.pathname === '/admin/monitoramento-bitrix'}
                          >
                            <Link to="/admin/monitoramento-bitrix">
                              <span>Monitoramento Bitrix</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
