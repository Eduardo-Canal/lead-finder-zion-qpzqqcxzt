import { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Search,
  HelpCircle,
  ArrowLeft,
  Brain,
  Target,
  ClipboardList,
  ShieldCheck,
  Lightbulb,
  RefreshCw,
  Waves,
  MapPin,
  Copy,
  Star,
  Download,
  Database,
  Zap,
  Sparkles,
  CheckCircle,
  History,
  List,
  UserPlus,
  UserCheck,
  Clock,
  BarChart,
  Bell,
  Filter,
  Key,
  Activity,
  Eye,
  PieChart,
  Users,
  Lock,
  TrendingUp,
  Edit3,
  LineChart,
  FileDown,
  Beaker,
  MousePointerClick,
  Settings2,
  Network,
  Gauge,
  Shield,
  ListChecks,
  PlayCircle,
  Terminal,
  Save,
  Palette,
  CopySlash,
  Waypoints,
  FileCheck2,
  FileClock,
  Wand2,
  ThumbsUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Subtopic = {
  id: string
  title: string
  desc: string
  icon: React.ElementType
}

type Topic = {
  id: string
  title: string
  mainIcon: React.ElementType
  subtopics: Subtopic[]
}

const helpData: Topic[] = [
  {
    id: 't1',
    title: 'Inteligência Zion 🧠',
    mainIcon: Brain,
    subtopics: [
      {
        id: 't1-1',
        title: 'Sincronização com Bitrix24',
        desc: 'Mantenha sua base atualizada sincronizando clientes do CRM. Isso evita duplicidades e foca o time em novos leads reais.',
        icon: RefreshCw,
      },
      {
        id: 't1-2',
        title: 'Análise Oceanos Azuis',
        desc: 'Descubra nichos inexplorados cruzando dados de CNAEs e regiões. Ideal para direcionar sua prospecção ativa de forma inteligente.',
        icon: Waves,
      },
      {
        id: 't1-3',
        title: 'Descoberta por Região',
        desc: 'Filtre e identifique oportunidades de negócios quentes em estados e municípios específicos rapidamente através do painel.',
        icon: MapPin,
      },
      {
        id: 't1-4',
        title: 'Busca por Semelhança',
        desc: 'Encontre empresas com perfis idênticos aos seus melhores clientes atuais, aumentando substancialmente a taxa de conversão.',
        icon: Copy,
      },
      {
        id: 't1-5',
        title: 'Classificação ABC de Clientes',
        desc: 'Priorize contatos com base na curva ABC importada do seu CRM, focando energia e recursos onde há maior potencial de retorno.',
        icon: Star,
      },
      {
        id: 't1-6',
        title: 'Exportação de Dados',
        desc: 'Baixe planilhas consolidadas em formato CSV para análises externas, cruzamento de dados ou apresentações estratégicas.',
        icon: Download,
      },
    ],
  },
  {
    id: 't2',
    title: 'Prospecção 🎯',
    mainIcon: Target,
    subtopics: [
      {
        id: 't2-1',
        title: 'Busca Avançada',
        desc: 'Utilize filtros precisos de CNAE, localização, porte e situação cadastral para encontrar o lead perfeito para sua campanha.',
        icon: Search,
      },
      {
        id: 't2-2',
        title: 'Cache Inteligente',
        desc: 'O sistema salva buscas recentes por 30 dias para otimizar a velocidade e economizar seus créditos de API externa automaticamente.',
        icon: Database,
      },
      {
        id: 't2-3',
        title: 'Enriquecimento de Leads',
        desc: 'Obtenha dados completos de contato, quadro societário e endereço detalhado com apenas um clique no botão de enriquecer lead.',
        icon: Sparkles,
      },
      {
        id: 't2-4',
        title: 'Validação de Dados',
        desc: 'CNPJs são validados e formatados automaticamente para garantir que você invista tempo apenas em empresas reais e ativas.',
        icon: CheckCircle,
      },
      {
        id: 't2-5',
        title: 'Histórico de Buscas',
        desc: 'Acesse rapidamente suas pesquisas anteriores na aba Meu Histórico sem precisar reconfigurar todos os parâmetros e filtros.',
        icon: History,
      },
      {
        id: 't2-6',
        title: 'Paginação de Resultados',
        desc: 'Navegue de forma ágil por listas extensas de resultados (até milhares de registros) sem perda de performance ou lentidão.',
        icon: List,
      },
    ],
  },
  {
    id: 't3',
    title: 'Meus Leads 📋',
    mainIcon: ClipboardList,
    subtopics: [
      {
        id: 't3-1',
        title: 'Captura de Leads',
        desc: 'Salve empresas promissoras da aba de prospecção diretamente na sua carteira pessoal para acompanhamento e contato contínuo.',
        icon: UserPlus,
      },
      {
        id: 't3-2',
        title: 'Gestão de Contato',
        desc: 'Registre cada interação, atualize o status da conversa e mantenha o relacionamento com o lead sempre aquecido e documentado.',
        icon: UserCheck,
      },
      {
        id: 't3-3',
        title: 'Histórico e Decisores',
        desc: 'Mantenha os dados das pessoas-chave (decisores) e todo o histórico cronológico de conversas sempre à mão na ficha do lead.',
        icon: Clock,
      },
      {
        id: 't3-4',
        title: 'Status de Oportunidade',
        desc: 'Avance os leads pelo funil de vendas corporativo (Prospecção, Qualificação, Proposta, Fechamento) de forma visual e clara.',
        icon: BarChart,
      },
      {
        id: 't3-5',
        title: 'Lembretes Automáticos',
        desc: 'Receba notificações de follow-up baseadas no tempo sem contato, garantindo que nenhuma oportunidade de negócio esfrie.',
        icon: Bell,
      },
      {
        id: 't3-6',
        title: 'Filtro de Status de Contato',
        desc: 'Organize sua visão diária filtrando e focando rapidamente apenas nos leads que precisam de atenção ou contato imediato.',
        icon: Filter,
      },
    ],
  },
  {
    id: 't4',
    title: 'Governança 🔐',
    mainIcon: ShieldCheck,
    subtopics: [
      {
        id: 't4-1',
        title: 'Gestão de Acessos',
        desc: 'Controle com precisão quem pode visualizar, editar ou exportar dados através de perfis de permissão modulares e rigorosos.',
        icon: Key,
      },
      {
        id: 't4-2',
        title: 'Monitoramento de Integrações',
        desc: 'Verifique a saúde, estabilidade e o consumo diário das APIs externas (Bitrix e Casa dos Dados) no painel de administração.',
        icon: Activity,
      },
      {
        id: 't4-3',
        title: 'Auditoria de Ações',
        desc: 'Rastreie cada criação, edição ou exclusão feita no sistema para manter total segurança, compliance e conformidade dos dados.',
        icon: Eye,
      },
      {
        id: 't4-4',
        title: 'Relatórios de Performance',
        desc: 'Acompanhe as taxas de conversão, volume de contatos realizados e a eficiência geral de cada membro da sua equipe comercial.',
        icon: PieChart,
      },
      {
        id: 't4-5',
        title: 'Gestão de Usuários',
        desc: 'Adicione novos executivos, inative contas antigas ou altere os perfis dos membros diretamente pelo painel administrativo.',
        icon: Users,
      },
      {
        id: 't4-6',
        title: 'Alteração de Senha',
        desc: 'Troque credenciais de acesso com segurança. Administradores podem forçar atualizações de senha em lote se necessário.',
        icon: Lock,
      },
    ],
  },
  {
    id: 't5',
    title: 'Testes e Validação 🧪',
    mainIcon: Beaker,
    subtopics: [
      {
        id: 't5-1',
        title: 'Como Acessar a Página de Testes',
        desc: 'Exclusivo para admins. Acesse via menu lateral "Testes e Validação (QA)". Este painel é uma central automatizada para validar toda a saúde, integridade e regras de negócio da aplicação com um único clique.',
        icon: MousePointerClick,
      },
      {
        id: 't5-2',
        title: 'Testes de Funcionalidade',
        desc: 'Valida 11 recursos vitais: Paginação, Filtro de Status, Histórico, CNPJ, Curva ABC, Exportação, Funil Kanban, Lembretes, Auditoria, Relatórios e Senhas, garantindo a operação perfeita da plataforma de ponta a ponta.',
        icon: Settings2,
      },
      {
        id: 't5-3',
        title: 'Testes de Integração',
        desc: 'Verifica a comunicação crítica do sistema. Testa se as conexões com o banco Supabase, a integridade das Edge Functions e a geração segura de tokens pelo serviço de Autenticação estão totalmente operantes.',
        icon: Network,
      },
      {
        id: 't5-4',
        title: 'Testes de Performance',
        desc: 'Mede a velocidade da aplicação. O teste de Carregamento avalia se queries respondem rapidamente. O teste de Cache comprova a economia de tempo e créditos reutilizando pesquisas idênticas recentes.',
        icon: Gauge,
      },
      {
        id: 't5-5',
        title: 'Testes de Segurança',
        desc: 'Garante a blindagem dos dados da empresa. Valida as permissões de interface e testa as políticas RLS no banco, impedindo rigorosamente acessos indevidos a registros de outros usuários.',
        icon: Shield,
      },
      {
        id: 't5-6',
        title: 'Interpretando Resultados',
        desc: 'Status: PASSOU (verde) é sucesso, FALHOU (vermelho) alerta erro e AVISO (amarelo) indica lentidão. Utilize os botões para "Exportar Relatório CSV" completo e "Limpar Dados" para remover os registros fictícios gerados.',
        icon: ListChecks,
      },
      {
        id: 't5-7',
        title: 'Executar Todos os Testes',
        desc: 'O botão "Executar Todos os Testes" permite rodar todos os testes de QA simultaneamente em lote. O processamento ocorre sequencialmente de forma rápida, concluindo a bateria inteira em poucos segundos e de forma paralela sempre que possível.',
        icon: PlayCircle,
      },
      {
        id: 't5-8',
        title: 'Painel de Logs em Tempo Real',
        desc: 'Ao executar ou expandir os cards de teste, um terminal técnico é exibido no rodapé do card, oferecendo um diagnóstico detalhado. Ele mostra o que está acontecendo em tempo real, documentando comandos e retornos durante a execução.',
        icon: Terminal,
      },
      {
        id: 't5-9',
        title: 'Persistência de Resultados',
        desc: 'O sistema salva automaticamente o progresso no navegador (localStorage), garantindo que os resultados dos testes e logs permaneçam disponíveis após um refresh da página. Para limpar, utilize o botão "Limpar Dados de Teste".',
        icon: Save,
      },
      {
        id: 't5-10',
        title: 'Resumo de Métricas e Taxa de Sucesso',
        desc: 'A taxa de sucesso global é calculada em tempo real no topo do painel (total de testes que PASSARAM / total de testes executados × 100%). Interprete essa métrica para validar rapidamente a saúde geral e identificar se a aplicação está apta.',
        icon: Activity,
      },
      {
        id: 't5-11',
        title: 'Testes de UX/UI',
        desc: 'Esta categoria inclui 3 testes: Responsividade (adaptação de breakpoints), Help System (modais e busca de ajuda) e Ícones e Cores (aderência ao design system), garantindo uma experiência de usuário (UX) fluida e visualmente consistente.',
        icon: Palette,
      },
    ],
  },
  {
    id: 't6',
    title: 'Deduplicação de Empresas 🔄',
    mainIcon: CopySlash,
    subtopics: [
      {
        id: 't6-1',
        title: 'Como Funciona a Deduplicação Automática',
        desc: 'O sistema utiliza 3 níveis de busca para evitar dados repetidos: 1. CNPJ exato (busca sequencial segura); 2. Razão Social (com validação de similaridade para detectar variações de nome); 3. Criação de novo registro apenas quando nenhuma correspondência segura é encontrada.',
        icon: Waypoints,
      },
      {
        id: 't6-2',
        title: 'Seção Pendentes de Revisão',
        desc: 'Área dedicada para visualizar, comparar e revisar possíveis empresas duplicadas identificadas pelo sistema. Permite fazer a mesclagem (merge) manual escolhendo qual cadastro deve ser mantido como o principal.',
        icon: FileCheck2,
      },
      {
        id: 't6-3',
        title: 'Histórico de Merges',
        desc: 'Painel de auditoria completa de todas as mesclagens realizadas. Oferece rastreabilidade total (quem fez, quando e por que) e a possibilidade de reverter a operação (desfazer merge) devolvendo a empresa absorvida e os leads associados.',
        icon: FileClock,
      },
      {
        id: 't6-4',
        title: 'Análise Potencial com Fuzzy Matching',
        desc: 'Ferramenta proativa que varre toda a sua base de dados utilizando o algoritmo "Fuzzy Matching" para encontrar empresas com nomes muito parecidos. Oferece sugestões de merge pré-preenchidas e estatísticas como a "Taxa de Resolução".',
        icon: Wand2,
      },
      {
        id: 't6-5',
        title: 'Boas Práticas de Deduplicação',
        desc: 'Recomendações essenciais: Revise regularmente a aba "Pendentes", sempre compare os dados antes de confirmar um merge, e utilize o "Score Mínimo" na aba de "Potenciais" para focar nos conflitos com maior chance de serem a mesma empresa.',
        icon: ThumbsUp,
      },
    ],
  },
  {
    id: 't7',
    title: 'Dicas Rápidas 💡',
    mainIcon: Lightbulb,
    subtopics: [
      {
        id: 't7-1',
        title: 'Maximize Resultados com Filtros',
        desc: 'Combine filtros específicos de CNAE com a Curva ABC para focar os esforços do time nos leads com maior probabilidade de fechamento.',
        icon: TrendingUp,
      },
      {
        id: 't7-2',
        title: 'Use o Cache para Economizar',
        desc: 'Refazer buscas idênticas em menos de 30 dias não consome créditos adicionais da sua API externa. Aproveite esse recurso.',
        icon: Zap,
      },
      {
        id: 't7-3',
        title: 'Registre Sempre o Contato',
        desc: 'Atualize o status após cada ligação para garantir que o motor de lembretes automáticos envie as notificações na hora certa.',
        icon: Edit3,
      },
      {
        id: 't7-4',
        title: 'Acompanhe Métricas Regularmente',
        desc: 'Visite o dashboard de relatórios pelo menos semanalmente para calibrar sua estratégia de prospecção com base em dados reais.',
        icon: LineChart,
      },
      {
        id: 't7-5',
        title: 'Sincronize Bitrix Regularmente',
        desc: 'Mantenha os dados do Bitrix atualizados frequentemente para evitar o desgaste de ligar oferecendo serviços para quem já é cliente.',
        icon: RefreshCw,
      },
      {
        id: 't7-6',
        title: 'Exporte Dados para Apresentações',
        desc: 'Use a ferramenta de exportação em CSV para cruzar os leads capturados na Zion com outras ferramentas analíticas da empresa.',
        icon: FileDown,
      },
    ],
  },
]

export function HelpModal() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null)
  const [expandedTopics, setExpandedTopics] = useState<string[]>(['t1']) // Default expand first

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return helpData
    const lowerQuery = searchQuery.toLowerCase()

    return helpData
      .map((topic) => {
        const isTopicMatch = topic.title.toLowerCase().includes(lowerQuery)
        const matchingSubtopics = topic.subtopics.filter(
          (sub) =>
            sub.title.toLowerCase().includes(lowerQuery) ||
            sub.desc.toLowerCase().includes(lowerQuery),
        )

        if (isTopicMatch || matchingSubtopics.length > 0) {
          return {
            ...topic,
            subtopics: isTopicMatch ? topic.subtopics : matchingSubtopics,
          }
        }
        return null
      })
      .filter(Boolean) as Topic[]
  }, [searchQuery])

  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedTopics(filteredData.map((t) => t.id))
    } else {
      setExpandedTopics(['t1'])
    }
  }, [searchQuery, filteredData])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSearchQuery('')
        setSelectedSubtopic(null)
        setExpandedTopics(['t1'])
      }, 300)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-full h-9 w-9 transition-colors"
          title="Central de Ajuda"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="shrink-0 p-6 pb-4 border-b bg-slate-50/50">
          <DialogTitle className="text-xl flex items-center gap-2 text-[#0066CC]">
            <HelpCircle className="h-6 w-6 text-[#0066CC]" />
            Central de Ajuda - Lead Finder Zion
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-[500px]">
          {/* Left Panel - Topics List */}
          <div
            className={cn(
              'flex-col w-full md:w-1/2 lg:w-2/5 p-4 md:p-6 md:pr-4 bg-white',
              selectedSubtopic ? 'hidden md:flex' : 'flex',
            )}
          >
            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tópicos ou palavras-chave..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#0066CC]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
              {filteredData.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 px-4 text-sm">
                  Nenhum resultado encontrado para "{searchQuery}".
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  value={expandedTopics}
                  onValueChange={setExpandedTopics}
                  className="w-full"
                >
                  {filteredData.map((topic) => (
                    <AccordionItem value={topic.id} key={topic.id} className="border-b-slate-100">
                      <AccordionTrigger className="hover:no-underline hover:text-[#0066CC] transition-colors py-3">
                        <div className="flex items-center gap-2 text-left font-semibold">
                          <topic.mainIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          {topic.title}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3 pt-1">
                        <div className="flex flex-col gap-1">
                          {topic.subtopics.map((sub) => (
                            <Button
                              key={sub.id}
                              variant={selectedSubtopic?.id === sub.id ? 'secondary' : 'ghost'}
                              className={cn(
                                'w-full justify-start text-left font-medium h-auto py-2 px-3 text-sm transition-colors',
                                selectedSubtopic?.id === sub.id
                                  ? 'bg-[#0066CC]/10 text-[#0066CC] hover:bg-[#0066CC]/20'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                              )}
                              onClick={() => setSelectedSubtopic(sub)}
                            >
                              <sub.icon
                                className={cn(
                                  'h-4 w-4 mr-2 shrink-0',
                                  selectedSubtopic?.id === sub.id
                                    ? 'text-[#0066CC]'
                                    : 'text-slate-400',
                                )}
                              />
                              <span className="truncate">{sub.title}</span>
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Details View */}
          <div
            className={cn(
              'flex-col w-full md:w-1/2 lg:w-3/5 p-6 bg-slate-50/30 md:border-l border-slate-100',
              !selectedSubtopic ? 'hidden md:flex' : 'flex',
            )}
          >
            {selectedSubtopic ? (
              <div className="h-full flex flex-col animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="flex items-center mb-6 md:hidden shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubtopic(null)}
                    className="text-slate-600 border-slate-200"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                  </Button>
                </div>

                <div className="flex items-start gap-4 mb-6 shrink-0">
                  <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-[#0066CC]">
                    <selectedSubtopic.icon className="h-7 w-7" />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                      {selectedSubtopic.title}
                    </h3>
                  </div>
                </div>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Descrição Detalhada
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-[15px]">
                      {selectedSubtopic.desc}
                    </p>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 animate-in fade-in-0 duration-500">
                <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <HelpCircle className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Central de Ajuda</h3>
                <p className="text-[15px] text-slate-500 max-w-sm">
                  Selecione um tópico no menu lateral para visualizar a documentação detalhada e
                  aprender como extrair o máximo da Inteligência Zion.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
