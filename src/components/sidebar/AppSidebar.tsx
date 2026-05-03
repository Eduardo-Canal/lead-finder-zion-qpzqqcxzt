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
  PieChart,
  History,
  UserCircle,
  BookOpen,
  BrainCircuit,
  Zap,
  MessageSquare,
  Bot,
  BarChart3,
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

  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

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
              <Collapsible
                defaultOpen={location.pathname === '/' || location.pathname === '/whatsapp/dashboard'}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Painel">
                      <LayoutDashboard />
                      <span>Painel</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location.pathname === '/'}>
                          <Link to="/"><span>Dashboard</span></Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === '/whatsapp/dashboard'}
                        >
                          <Link to="/whatsapp/dashboard">
                            <BarChart3 className="w-4 h-4 mr-1 text-green-300" />
                            <span>Dashboard WhatsApp</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible
                defaultOpen={
                  location.pathname.includes('/inteligencia') ||
                  location.pathname === '/analise-carteira'
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Inteligência">
                      <PieChart />
                      <span>Inteligência</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === '/inteligencia-zion'}
                        >
                          <Link to="/inteligencia-zion">
                            <span>Inteligência Zion</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === '/curva-abc'}
                        >
                          <Link to="/curva-abc">
                            <span>Curva ABC Financeira</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === '/analise-carteira'}
                        >
                          <Link to="/analise-carteira">
                            <span>Análise de Carteira</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

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

              <Collapsible
                defaultOpen={location.pathname.startsWith('/automacao')}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Automação">
                      <Zap />
                      <span>Automação</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === '/automacao'}
                        >
                          <Link to="/automacao"><span>Automação</span></Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === '/automacao/feiras'}
                        >
                          <Link to="/automacao/feiras"><span>Feiras</span></Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/whatsapp/copiloto'}
                  tooltip="Co-Piloto WhatsApp"
                >
                  <Link to="/whatsapp/copiloto">
                    <Bot className="text-blue-400" />
                    <span>Co-Piloto WhatsApp</span>
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/meu-historico'}
                  tooltip="Meu Histórico"
                >
                  <Link to="/meu-historico">
                    <History />
                    <span>Meu Histórico</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/documentacao'}
                  tooltip="Documentação"
                >
                  <Link to="/documentacao">
                    <BookOpen />
                    <span>Documentação</span>
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

              <Collapsible
                defaultOpen={location.pathname.includes('/perfil')}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Meu Perfil">
                      <UserCircle />
                      <span>Meu Perfil</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === '/perfil/alterar-senha'}
                        >
                          <Link to="/perfil/alterar-senha">
                            <span>Alterar Senha</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

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
                          isActive={location.pathname === '/configuracoes/lembretes'}
                        >
                          <Link to="/configuracoes/lembretes">
                            <span>Lembretes Automáticos</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={location.pathname === '/configuracoes/historico-sincronizacao'}
                        >
                          <Link to="/configuracoes/historico-sincronizacao">
                            <span>Histórico Bitrix24</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {isAdmin && (
                        <>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/configuracoes/integracoes'}
                            >
                              <Link to="/configuracoes/integracoes">
                                <span>Integrações (APIs)</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/configuracoes/whatsapp'}
                            >
                              <Link to="/configuracoes/whatsapp">
                                <MessageSquare className="w-4 h-4 mr-1 text-green-400" />
                                <span>WhatsApp</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/configuracoes/contexto-ia'}
                            >
                              <Link to="/configuracoes/contexto-ia">
                                <BrainCircuit className="w-4 h-4 mr-1" />
                                <span>Contexto IA</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={
                                location.pathname === '/configuracoes/especificacoes-tecnicas'
                              }
                            >
                              <Link to="/configuracoes/especificacoes-tecnicas">
                                <span>Especificações Técnicas</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/configuracoes/auditoria'}
                            >
                              <Link to="/configuracoes/auditoria">
                                <span>Auditoria do Sistema</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === '/configuracoes/empresas-duplicadas'}
                            >
                              <Link to="/configuracoes/empresas-duplicadas">
                                <span>Empresas Duplicadas</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        </>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
