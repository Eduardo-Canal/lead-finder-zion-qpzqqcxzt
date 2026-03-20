import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, ShieldCheck, Target, Settings, ChevronRight } from 'lucide-react'
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
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import useAuthStore from '@/stores/useAuthStore'

export function AppSidebar() {
  const { hasPermission, user } = useAuthStore()
  const location = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="pt-6 pb-2 px-4">
        <h2 className="text-xl font-bold text-sidebar-foreground tracking-tight">Navegação</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 uppercase tracking-wider font-semibold">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent className="pt-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                  <Link to="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/prospeccao'}>
                  <Link to="/prospeccao">
                    <Target />
                    <span>Painel de Prospecção</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/meus-leads'}>
                  <Link to="/meus-leads">
                    <Users />
                    <span>Meus Leads</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {hasPermission('Acessar Admin') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/gestao-usuarios'}>
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
                              <span>Debug API</span>
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
    </Sidebar>
  )
}
