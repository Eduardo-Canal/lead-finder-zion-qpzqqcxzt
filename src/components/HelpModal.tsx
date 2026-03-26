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
  Filter,
  Sparkles,
  FileDown,
  Star,
  Waves,
  PieChart,
  LineChart,
  Save,
  Eye,
  Cloud,
  History,
  Settings2,
  Network,
  LayoutDashboard,
  ListChecks,
  Activity,
  Palette,
  SunMoon,
  Bell,
  Shield,
  Clock,
  Smartphone,
  EyeOff,
  Keyboard,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Subtopic = {
  id: string
  title: string
  desc: string[]
  steps: string[]
  icon: React.ElementType
  imageQuery: string
  related: string[]
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
    title: '🔍 Prospecção Inteligente',
    mainIcon: Target,
    subtopics: [
      {
        id: 't1-1',
        title: 'Como Buscar Leads por CNAE',
        desc: [
          'A busca por CNAE é o núcleo do Lead Finder Zion. Através dela, você localiza empresas do seu nicho de forma rápida e precisa.',
          'Utilize o autocompletar para inserir múltiplos códigos e segmentar perfeitamente sua campanha.',
        ],
        steps: [
          'Vá em "Painel de Prospecção" no menu principal.',
          'Digite o código ou nome da atividade no campo "CNAE".',
          'Selecione as sugestões listadas.',
          'Clique em "Buscar Leads" para carregar a lista.',
        ],
        icon: Search,
        imageQuery: 'business%20search',
        related: ['t1-2', 't1-3'],
      },
      {
        id: 't1-2',
        title: 'Filtros Avançados (Faturamento, Funcionários, Score)',
        desc: [
          'Filtros avançados ajudam a encontrar o lead ideal, analisando faturamento, tamanho e saúde financeira da empresa.',
          'Combine estes indicadores para focar a energia da sua equipe comercial nas melhores oportunidades do mercado.',
        ],
        steps: [
          'No Painel de Prospecção, expanda a área de "Filtros Avançados".',
          'Ajuste o slider de "Faturamento" para o valor desejado.',
          'Defina o número ideal de funcionários e o Score Mínimo.',
          'Execute a busca para aplicar as restrições.',
        ],
        icon: Filter,
        imageQuery: 'business%20analytics',
        related: ['t1-1', 't2-2'],
      },
      {
        id: 't1-3',
        title: 'Dados Enriquecidos da Casa dos Dados',
        desc: [
          'Ao buscar leads, nosso sistema cruza as informações com a base oficial da Casa dos Dados automaticamente.',
          'Isso garante acesso a e-mails reais, quadros societários atualizados e contatos decisivos para o seu fechamento.',
        ],
        steps: [
          'Realize uma pesquisa padrão por CNAE ou região.',
          'Aguarde a barra de "Enriquecimento" carregar no card da empresa.',
          'Visualize o "Score de Crédito" e os e-mails dos sócios.',
          'Utilize esses dados na sua abordagem de vendas.',
        ],
        icon: Sparkles,
        imageQuery: 'data%20server',
        related: ['t3-2'],
      },
      {
        id: 't1-4',
        title: 'Exportar Leads em Excel',
        desc: [
          'Se você precisa manipular os dados em outras ferramentas ou compartilhar com a equipe externa, a exportação é essencial.',
          'Os arquivos são gerados no formato CSV/Excel, contendo colunas ricas e dados consolidados para campanhas de marketing.',
        ],
        steps: [
          'Faça uma pesquisa com seus critérios.',
          'Clique no botão "Exportar" localizado no topo da lista de resultados.',
          'Escolha o formato e confirme o download.',
          'Abra o arquivo gerado na sua ferramenta de planilhas.',
        ],
        icon: FileDown,
        imageQuery: 'spreadsheet',
        related: ['t3-1'],
      },
    ],
  },
  {
    id: 't2',
    title: '📊 Inteligência Zion',
    mainIcon: Brain,
    subtopics: [
      {
        id: 't2-1',
        title: 'Análise ABC de Clientes',
        desc: [
          'O algoritmo Zion classifica automaticamente sua base de clientes importada em curva A, B e C com base no faturamento e histórico.',
          'Isso direciona sua prospecção para buscar "clones" dos seus melhores clientes (Curva A).',
        ],
        steps: [
          'Acesse o módulo "Inteligência Zion".',
          'Sincronize a base com seu CRM (Bitrix24).',
          'Visualize o gráfico de distribuição ABC.',
          'Clique sobre os perfis A para gerar novas buscas similares.',
        ],
        icon: Star,
        imageQuery: 'chart%20analysis',
        related: ['t2-3', 't1-1'],
      },
      {
        id: 't2-2',
        title: 'Oceanos Azuis - Oportunidades de Mercado',
        desc: [
          'Esta ferramenta analisa regiões e nichos onde seus concorrentes (ou você) ainda não atuam expressivamente.',
          'Encontre mercados não saturados para focar a estratégia comercial e obter melhores taxas de conversão.',
        ],
        steps: [
          'Abra a aba "Oceanos Azuis" dentro de Inteligência Zion.',
          'Selecione seu segmento principal no mapa de calor.',
          'Identifique os estados ou cidades com menor densidade de atendimento.',
          'Crie uma campanha focada na região sugerida.',
        ],
        icon: Waves,
        imageQuery: 'ocean%20blue',
        related: ['t1-1', 't2-4'],
      },
      {
        id: 't2-3',
        title: 'Relatórios de Performance',
        desc: [
          'Monitore a produtividade de cada executivo, a taxa de conversão e o retorno de suas listas de prospecção.',
          'Os relatórios cruzam dados de leads capturados com negócios gerados, oferecendo previsibilidade financeira.',
        ],
        steps: [
          'Acesse "Configurações > Relatórios".',
          'Selecione o período (ex: Últimos 30 dias).',
          'Analise os gráficos de "Taxa de Contato" e "Conversão".',
          'Exporte o PDF para apresentação gerencial, se necessário.',
        ],
        icon: PieChart,
        imageQuery: 'dashboard%20report',
        related: ['t2-4'],
      },
      {
        id: 't2-4',
        title: 'Interpretando Gráficos',
        desc: [
          'Nosso dashboard possui diversos gráficos interativos que reagem aos seus cliques. Cada cor representa um estágio do funil.',
          'Saber interpretar essas métricas é vital para identificar gargalos no processo de vendas da equipe.',
        ],
        steps: [
          'Navegue até a página inicial (Dashboard).',
          'Passe o mouse sobre os gráficos de barras ou pizza.',
          'Observe o Tooltip com o valor exato daquele segmento.',
          'Clique nos segmentos para isolar os dados na tabela abaixo.',
        ],
        icon: LineChart,
        imageQuery: 'data%20visualization',
        related: ['t2-3'],
      },
    ],
  },
  {
    id: 't3',
    title: '💼 Gestão de Meus Leads',
    mainIcon: ClipboardList,
    subtopics: [
      {
        id: 't3-1',
        title: 'Salvar Leads em Meus Leads',
        desc: [
          'Após encontrar a empresa ideal, salve-a na sua carteira para acompanhamento individualizado e ações futuras.',
          'Leads salvos ficam na sua base permanente e não expiram, permitindo o registro de todo o histórico de contatos.',
        ],
        steps: [
          'No painel de prospecção, localize um lead interessante.',
          'Clique no botão "Salvar Lead" ao lado do nome.',
          'Acesse o menu "Meus Leads" para ver sua carteira atualizada.',
          'Organize-os utilizando as tags de status.',
        ],
        icon: Save,
        imageQuery: 'save%20document',
        related: ['t3-2', 't1-1'],
      },
      {
        id: 't3-2',
        title: 'Visualizar Detalhes do Lead',
        desc: [
          'A ficha completa do lead concentra todas as informações cadastrais, o histórico de interações e os dados dos sócios.',
          'É o seu painel de controle antes de fazer a ligação, garantindo que a abordagem seja personalizada.',
        ],
        steps: [
          'Vá em "Meus Leads".',
          'Clique sobre a Razão Social da empresa na tabela.',
          'Um modal lateral se abrirá com os detalhes.',
          'Navegue entre as abas de "Visão Geral", "Sócios" e "Histórico".',
        ],
        icon: Eye,
        imageQuery: 'magnifying%20glass%20document',
        related: ['t3-1', 't3-3'],
      },
      {
        id: 't3-3',
        title: 'Enviar Lead para Bitrix24',
        desc: [
          'Integre sua prospecção com o fechamento criando automaticamente um Deal (Negócio) no Bitrix24 com apenas um clique.',
          'A Edge Function cria a empresa, vincula o Lead e adiciona-o na fase inicial do seu funil comercial.',
        ],
        steps: [
          'Abra os detalhes de um lead em "Meus Leads".',
          'Clique no botão verde "Enviar para Bitrix24".',
          'Aguarde o loader (o sistema está checando duplicidades).',
          'Uma notificação confirmará o ID do Deal criado com sucesso.',
        ],
        icon: Cloud,
        imageQuery: 'cloud%20sync',
        related: ['t4-1', 't3-4'],
      },
      {
        id: 't3-4',
        title: 'Histórico de Sincronizações',
        desc: [
          'Manter a rastreabilidade do que foi enviado ao CRM é importante para auditoria e controle de falhas de conexão.',
          'O histórico exibe um log completo de todos os envios, com o respectivo status e eventuais mensagens de erro.',
        ],
        steps: [
          'Acesse "Configurações > Histórico Bitrix24".',
          'Use os filtros no topo para buscar por data ou status.',
          'Verifique a coluna "Deal ID" para envios com sucesso.',
          'Em envios com erro, leia o motivo para poder corrigir os dados e tentar novamente.',
        ],
        icon: History,
        imageQuery: 'audit%20log',
        related: ['t3-3', 't4-4'],
      },
    ],
  },
  {
    id: 't4',
    title: '⚙️ Configurações de Integração',
    mainIcon: Settings2,
    subtopics: [
      {
        id: 't4-1',
        title: 'Conectar com Bitrix24',
        desc: [
          'Vincule o Lead Finder Zion ao seu ambiente do Bitrix24 via webhook inbound para automatizar o envio de Deals.',
          'Esse passo requer permissões administrativas e precisa ser feito apenas uma vez.',
        ],
        steps: [
          'Vá em "Configurações > Integração Bitrix24".',
          'Insira a URL do Webhook gerada no painel do seu Bitrix.',
          'Salve a credencial com segurança.',
          'O sistema testará a comunicação automaticamente.',
        ],
        icon: Network,
        imageQuery: 'server%20connection',
        related: ['t4-4', 't3-3'],
      },
      {
        id: 't4-2',
        title: 'Selecionar Kanban Padrão',
        desc: [
          'O Bitrix24 permite gerenciar múltiplos funis (Kanbans). O sistema Zion precisa saber para qual deles enviar os novos leads.',
          'Escolha o funil mais apropriado para a equipe de "Inbound/Outbound" ou "Prospecção".',
        ],
        steps: [
          'No painel de Configurações do Bitrix24, localize a seção "Funil Padrão".',
          'O sistema listará seus funis atuais.',
          'Selecione o funil desejado.',
          'Salve a configuração.',
        ],
        icon: LayoutDashboard,
        imageQuery: 'kanban%20board',
        related: ['t4-3'],
      },
      {
        id: 't4-3',
        title: 'Configurar Fase Padrão',
        desc: [
          'Além do Kanban, você define a fase exata onde o novo negócio (Deal) será inserido.',
          'Geralmente recomenda-se a primeira fase (ex: "Novo Lead" ou "Prospecção").',
        ],
        steps: [
          'Abaixo da seleção de Kanban, acesse a seleção de "Fase Inicial".',
          'O dropdown mostrará os estágios do Kanban escolhido.',
          'Selecione o estágio correspondente.',
          'Salve a configuração.',
        ],
        icon: ListChecks,
        imageQuery: 'workflow%20process',
        related: ['t4-2'],
      },
      {
        id: 't4-4',
        title: 'Testar Conexão',
        desc: [
          'Antes de escalar as operações da equipe, teste a conexão para garantir que não há bloqueios de firewall ou erro na chave de acesso.',
          'A rotina de validação realiza chamadas mockadas e atesta o funcionamento.',
        ],
        steps: [
          'Na tela de Integração, clique no botão "Testar Conexão".',
          'Aguarde a verificação de conectividade e leitura das permissões.',
          'Um alerta de sucesso verde aparecerá confirmando a integração.',
          'Em caso de falha, verifique o log detalhado exibido.',
        ],
        icon: Activity,
        imageQuery: 'system%20testing',
        related: ['t4-1'],
      },
    ],
  },
  {
    id: 't5',
    title: '🎨 Personalização da Plataforma',
    mainIcon: Palette,
    subtopics: [
      {
        id: 't5-1',
        title: 'Alterar Tema (Claro/Escuro)',
        desc: [
          'Para garantir conforto visual, especialmente em jornadas noturnas, adapte a interface para tons escuros.',
          'A plataforma se recorda da sua preferência entre os diferentes dispositivos.',
        ],
        steps: [
          'Abra o menu do seu "Perfil" no canto inferior ou superior da tela.',
          'Clique no botão de Alternância de Tema.',
          'Escolha entre "Claro", "Escuro" ou "Sistema".',
          'A interface se adaptará imediatamente.',
        ],
        icon: SunMoon,
        imageQuery: 'dark%20mode%20ui',
        related: ['t6-1'],
      },
      {
        id: 't5-2',
        title: 'Configurar Preferências de Notificação',
        desc: [
          'Selecione quais alertas deseja receber (novos leads, sucesso no Bitrix, alertas de follow-up).',
          'Isso evita a poluição do seu painel e mantém o foco no que realmente importa.',
        ],
        steps: [
          'Acesse "Meu Perfil".',
          'Vá na aba "Notificações".',
          'Ligue ou desligue os switches referentes a cada tipo de alerta.',
          'As configurações são salvas automaticamente.',
        ],
        icon: Bell,
        imageQuery: 'notification%20bell',
        related: ['t5-4'],
      },
      {
        id: 't5-3',
        title: 'Gerenciar Permissões de Usuários',
        desc: [
          'Como administrador, você pode restringir ações destrutivas ou o acesso ao módulo de auditoria para os demais usuários.',
          'Os perfis modulares garantem aderência às normas de governança da empresa.',
        ],
        steps: [
          'Acesse "Gestão de Usuários" no menu lateral.',
          'Selecione o usuário desejado e clique em "Editar".',
          'Altere o Perfil de Acesso do usuário na lista.',
          'Salve para aplicar instantaneamente as restrições.',
        ],
        icon: Shield,
        imageQuery: 'security%20shield',
        related: ['t4-1'],
      },
      {
        id: 't5-4',
        title: 'Configurar Lembretes',
        desc: [
          'Defina o tempo de cadência (em dias) em que deseja ser cobrado para retomar contato com leads.',
          'Esses lembretes mantêm o relacionamento aquecido e evitam a perda de prospecções em andamento.',
        ],
        steps: [
          'Vá em "Configurações > Lembretes Automáticos".',
          'Estabeleça os prazos de dias sem contato (Follow-up, Proposta, Fechamento).',
          'Ative os alertas no painel.',
          'O sistema enviará os avisos via central de notificações diariamente.',
        ],
        icon: Clock,
        imageQuery: 'calendar%20reminder',
        related: ['t5-2'],
      },
    ],
  },
  {
    id: 't6',
    title: '📱 Acessibilidade e Mobile',
    mainIcon: Smartphone,
    subtopics: [
      {
        id: 't6-1',
        title: 'Usar em Dispositivos Móveis',
        desc: [
          'O Lead Finder Zion é responsivo e pode ser acessado de tablets e smartphones sem perder funcionalidades cruciais.',
          'Ideal para prospecções rápidas ou conferência de dados em trânsito.',
        ],
        steps: [
          'Acesse a URL da plataforma pelo navegador do seu celular.',
          'Utilize o menu "Hambúrguer" (três barras) para abrir a navegação lateral.',
          'Para tabelas longas, deslize lateralmente o dedo para exibir colunas ocultas.',
          'Aproveite a experiência adaptada.',
        ],
        icon: Smartphone,
        imageQuery: 'mobile%20app',
        related: ['t5-1'],
      },
      {
        id: 't6-2',
        title: 'Reduzir Movimento (Acessibilidade)',
        desc: [
          'Se você tem sensibilidade a animações ou deseja economizar bateria e performance, ative o recurso de reduzir movimento.',
          'O sistema detectará as preferências nativas do seu sistema operacional também.',
        ],
        steps: [
          'Verifique as configurações de acessibilidade do seu Sistema Operacional (Windows/Mac/iOS/Android).',
          'Ative "Reduzir Movimento".',
          'Ao acessar a plataforma, a renderização pesada (como a Inteligência Zion Global) será pausada.',
          'O layout ficará mais estático e rápido.',
        ],
        icon: EyeOff,
        imageQuery: 'accessibility',
        related: ['t6-1'],
      },
      {
        id: 't6-3',
        title: 'Atalhos de Teclado',
        desc: [
          'Acelere sua operação utilizando teclas de atalho para ações diárias. Profissionais ganham minutos valiosos por semana.',
          'Descubra como fechar painéis ou confirmar modais rapidamente.',
        ],
        steps: [
          'Utilize "Ctrl+B" (ou Cmd+B) para expandir ou retrair o menu lateral.',
          'Pressione "Esc" para fechar modais de detalhes de leads e a aba de ajuda.',
          'Use as "Setas Direita/Esquerda" para rolar tabelas horizontais em foco.',
          'Pressione "Enter" para confirmar buscas.',
        ],
        icon: Keyboard,
        imageQuery: 'computer%20keyboard',
        related: ['t6-1'],
      },
      {
        id: 't6-4',
        title: 'Modo Offline',
        desc: [
          'Algumas páginas, como Meus Leads, possuem cache local progressivo e podem mostrar o histórico carregado mesmo se a conexão cair momentaneamente.',
          'Isso permite que você não perca os dados de contato do cliente enquanto ele estiver na linha.',
        ],
        steps: [
          'Ao carregar "Meus Leads", o sistema já faz um snapshot.',
          'Se a internet oscilar, você notará que a interface permanece utilizável.',
          'As ações de atualização aguardarão o retorno do sinal.',
          'As buscas complexas de CNPJ exigem rede e alertarão sobre a conexão.',
        ],
        icon: WifiOff,
        imageQuery: 'offline',
        related: ['t6-1'],
      },
    ],
  },
]

export function HelpModal() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null)
  const [expandedTopics, setExpandedTopics] = useState<string[]>(['t1'])

  const allSubtopics = useMemo(() => {
    return helpData.flatMap((t) => t.subtopics)
  }, [])

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return helpData
    const lowerQuery = searchQuery.toLowerCase()

    return helpData
      .map((topic) => {
        const isTopicMatch = topic.title.toLowerCase().includes(lowerQuery)
        const matchingSubtopics = topic.subtopics.filter(
          (sub) =>
            sub.title.toLowerCase().includes(lowerQuery) ||
            sub.desc.join(' ').toLowerCase().includes(lowerQuery) ||
            sub.steps.join(' ').toLowerCase().includes(lowerQuery),
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

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSearchQuery('')
        setSelectedSubtopic(null)
        setExpandedTopics(['t1'])
      }, 300)
    }
  }, [open])

  const handleRelatedClick = (relatedId: string) => {
    const target = allSubtopics.find((s) => s.id === relatedId)
    if (target) {
      setSelectedSubtopic(target)
      // Scroll right panel to top
      const scrollArea = document.getElementById('help-details-scroll')
      if (scrollArea) {
        scrollArea.scrollTop = 0
      }
    }
  }

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
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
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
              'flex-col w-full md:w-1/2 lg:w-[35%] p-4 md:p-6 md:pr-4 bg-white',
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
                                'w-full justify-start text-left font-medium h-auto py-2 px-3 text-sm transition-colors whitespace-normal break-words',
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
                              <span className="leading-snug">{sub.title}</span>
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
              'flex-col w-full md:w-1/2 lg:w-[65%] p-6 bg-slate-50/30 md:border-l border-slate-100 overflow-hidden',
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

                <ScrollArea id="help-details-scroll" className="flex-1 pr-4 -mr-4">
                  <div className="pb-8">
                    {selectedSubtopic.imageQuery && (
                      <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                        <img
                          src={`https://img.usecurling.com/p/800/300?q=${selectedSubtopic.imageQuery}&color=blue`}
                          alt="Ilustração do Tópico"
                          className="w-full h-auto object-cover max-h-[220px]"
                        />
                      </div>
                    )}

                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-6">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Descrição
                      </h4>
                      <div className="space-y-4">
                        {selectedSubtopic.desc.map((p, i) => (
                          <p key={i} className="text-slate-600 leading-relaxed text-[15px]">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>

                    {selectedSubtopic.steps && selectedSubtopic.steps.length > 0 && (
                      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-6">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                          Passo a Passo
                        </h4>
                        <ol className="space-y-4 relative">
                          {selectedSubtopic.steps.map((step, i) => (
                            <li
                              key={i}
                              className="flex gap-4 text-slate-600 text-[15px] items-start"
                            >
                              <span className="flex items-center justify-center bg-primary/10 text-primary min-w-6 h-6 rounded-full shrink-0 font-bold text-xs mt-0.5">
                                {i + 1}
                              </span>
                              <span className="pt-0.5 leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {selectedSubtopic.related && selectedSubtopic.related.length > 0 && (
                      <div className="mt-8 border-t pt-6 border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                          Tópicos Relacionados
                        </h4>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedSubtopic.related.map((rid) => {
                            const relatedItem = allSubtopics.find((s) => s.id === rid)
                            if (!relatedItem) return null
                            return (
                              <Button
                                key={rid}
                                variant="outline"
                                size="sm"
                                className="text-sm bg-white hover:bg-slate-50 border-slate-200"
                                onClick={() => handleRelatedClick(rid)}
                              >
                                <relatedItem.icon className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                {relatedItem.title}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    )}
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
                  aprender como extrair o máximo do sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
