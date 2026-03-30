import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen } from 'lucide-react'

// Define the structure for our documentation data
type DocItem = {
  title: string
  description: string
  lastUpdated: string
}

type DocModule = {
  id: string
  label: string
  items: DocItem[]
}

// Mock data based on the requested modules
const documentationData: DocModule[] = [
  {
    id: 'prospecting',
    label: 'Prospecting',
    items: [
      {
        title: 'Busca Avançada',
        description:
          'Utilize filtros avançados como CNAE, Localização (UF/Município) e Porte para encontrar leads altamente segmentados diretamente nas bases da Receita Federal e Casa dos Dados.',
        lastUpdated: '25/03/2026 14:30',
      },
      {
        title: 'Enriquecimento de Dados',
        description:
          'Rotina automática que consulta provedores externos para buscar informações complementares de contato, como e-mails de sócios, telefones secundários e faturamento estimado.',
        lastUpdated: '24/03/2026 09:15',
      },
      {
        title: 'Validação de CNPJ',
        description:
          'Serviço embutido nas Edge Functions para garantir que apenas CNPJs válidos e formatados corretamente sejam processados e enviados ao CRM.',
        lastUpdated: '20/03/2026 11:20',
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    items: [
      {
        title: 'Gestão de Usuários (RBAC)',
        description:
          'Módulo administrativo para criação, bloqueio e exclusão de usuários, com controle de acesso granular baseado em perfis (Administrador, Executivo, etc).',
        lastUpdated: '22/03/2026 10:00',
      },
      {
        title: 'Auditoria do Sistema',
        description:
          'Registro imutável de todas as ações sensíveis realizadas no sistema, incluindo visualizações, edições e exportações, garantindo total rastreabilidade.',
        lastUpdated: '26/03/2026 16:45',
      },
      {
        title: 'Controle de Acessos Suspeitos',
        description:
          'Monitoramento contínuo de atividades anômalas, como múltiplos logins simultâneos ou acesso a bases sensíveis fora do horário comercial (alerta de severidade alta).',
        lastUpdated: '25/03/2026 08:10',
      },
    ],
  },
  {
    id: 'lead-management',
    label: 'Lead Management',
    items: [
      {
        title: 'Meus Leads (CRM Kanban)',
        description:
          'Painel visual no formato Kanban que permite arrastar e soltar (Drag and Drop) os leads entre as diferentes etapas do funil de prospecção.',
        lastUpdated: '26/03/2026 10:20',
      },
      {
        title: 'Sincronização Bitrix24',
        description:
          'Mecanismo robusto que envia os leads salvos diretamente para o Bitrix24 como Negócios (Deals), utilizando sistema de Rate Limit e retentativas automáticas (Retry).',
        lastUpdated: '23/03/2026 15:50',
      },
      {
        title: 'Deduplicação de Empresas',
        description:
          'Sistema inteligente de Fuzzy Matching que detecta e alerta sobre possíveis empresas duplicadas na base antes do envio para o CRM, comparando CNPJ e Razão Social.',
        lastUpdated: '21/03/2026 14:05',
      },
      {
        title: 'Lembretes de Follow-up',
        description:
          'Notificações automáticas na plataforma e alertas via e-mail para lembrar o executivo de retomar contato com leads que estão há muito tempo na mesma fase do funil.',
        lastUpdated: '19/03/2026 09:30',
      },
    ],
  },
  {
    id: 'inteligencia-zion',
    label: 'Inteligência Zion',
    items: [
      {
        title: 'Clusters Estratégicos',
        description:
          'Agrupamento automatizado de setores (CNAEs) com base na performance histórica da carteira, indicando quais segmentos possuem maior prioridade e oportunidade.',
        lastUpdated: '24/03/2026 11:45',
      },
      {
        title: 'Geração de Abordagem (IA)',
        description:
          'Integração com a OpenAI (GPT-4) que analisa os dados do lead (CNAE, porte, dores) e gera automaticamente um texto persuasivo para e-mail ou LinkedIn.',
        lastUpdated: '25/03/2026 13:10',
      },
      {
        title: 'Fit Operacional Score',
        description:
          'Algoritmo que calcula uma pontuação para cada CNAE avaliando a taxa de sucesso de fechamento e o ticket médio histórico para guiar a prospecção.',
        lastUpdated: '22/03/2026 17:30',
      },
    ],
  },
  {
    id: 'performance-dashboard',
    label: 'Performance Dashboard',
    items: [
      {
        title: 'Métricas Principais',
        description:
          'Visão geral na tela inicial (Dashboard) apresentando o total de leads gerados, oportunidades criadas, leads convertidos e a taxa de conversão global.',
        lastUpdated: '26/03/2026 08:00',
      },
      {
        title: 'Análise de Carteira',
        description:
          'Gráficos interativos (Recharts) que demonstram a distribuição da carteira ativa por segmento, ticket médio e localização geográfica.',
        lastUpdated: '25/03/2026 18:20',
      },
      {
        title: 'Monitoramento de APIs',
        description:
          'Painel técnico voltado para administradores que exibe o tempo de resposta, volume de chamadas e erros detalhados das integrações Casa dos Dados e Bitrix24.',
        lastUpdated: '23/03/2026 12:15',
      },
    ],
  },
]

export default function Documentation() {
  const [activeTab, setActiveTab] = useState<string>(documentationData[0].id)

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Documentação do Sistema
          </h2>
          <p className="text-muted-foreground text-lg">
            Guia completo das funcionalidades e módulos do Lead Finder Zion.
          </p>
        </div>
      </div>

      <Tabs
        defaultValue={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="overflow-x-auto pb-2 shrink-0">
          <TabsList className="inline-flex w-auto justify-start">
            {documentationData.map((module) => (
              <TabsTrigger key={module.id} value={module.id} className="min-w-fit px-4">
                {module.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 relative mt-4 border rounded-md bg-muted/10">
          <ScrollArea className="h-full absolute inset-0">
            <div className="p-4 md:p-6">
              {documentationData.map((module) => (
                <TabsContent
                  key={module.id}
                  value={module.id}
                  className="m-0 border-none p-0 outline-none data-[state=active]:block data-[state=inactive]:hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {module.items.map((item, index) => (
                      <Card
                        key={index}
                        className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <CardHeader>
                          <CardTitle className="text-xl text-primary">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <CardDescription className="text-base text-foreground/80 leading-relaxed">
                            {item.description}
                          </CardDescription>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4 flex justify-end border-t bg-muted/5">
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground font-normal bg-background/50 border-muted"
                          >
                            Última atualização: {item.lastUpdated}
                          </Badge>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  )
}
