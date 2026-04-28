import { useState, useEffect } from 'react'
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
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

type DocumentationRecord = {
  id: string
  module: string
  feature_name: string
  description: string
  updated_at: string
  version: number
}

const MODULE_LABELS: Record<string, string> = {
  prospecting: 'Prospecção',
  governance: 'Governança',
  'lead-management': 'Gestão de Leads',
  'inteligencia-zion': 'Inteligência Zion',
  'curva-abc-financeira': 'Curva ABC Financeira',
  'analise-carteira': 'Análise de Carteira',
  'performance-dashboard': 'Performance Dashboard',
}

const MODULE_ORDER = [
  'prospecting',
  'governance',
  'lead-management',
  'inteligencia-zion',
  'curva-abc-financeira',
  'analise-carteira',
  'performance-dashboard',
]

const DocumentationSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} className="flex flex-col h-full shadow-sm bg-card">
        <CardHeader>
          <div className="h-6 w-3/4 bg-muted animate-pulse rounded"></div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-4/6 bg-muted animate-pulse rounded"></div>
        </CardContent>
        <CardFooter className="mt-auto pt-4 flex justify-end border-t bg-muted/5">
          <div className="h-5 w-40 bg-muted animate-pulse rounded-full"></div>
        </CardFooter>
      </Card>
    ))}
  </div>
)

export default function Documentation() {
  const [activeTab, setActiveTab] = useState<string>('prospecting')
  const [docs, setDocs] = useState<Record<string, DocumentationRecord[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('documentation')
          .select('*')
          .order('updated_at', { ascending: false })

        if (error) {
          console.error('Error fetching documentation:', error)
          return
        }

        if (data) {
          const grouped = (data as DocumentationRecord[]).reduce(
            (acc, curr) => {
              if (!acc[curr.module]) {
                acc[curr.module] = []
              }
              acc[curr.module].push(curr)
              return acc
            },
            {} as Record<string, DocumentationRecord[]>,
          )
          setDocs(grouped)

          const firstModule =
            MODULE_ORDER.find((m) => grouped[m] && grouped[m].length > 0) || MODULE_ORDER[0]
          setActiveTab(firstModule)
        }
      } catch (err) {
        console.error('Unexpected error fetching documentation:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDocs()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm')
    } catch {
      return dateString
    }
  }

  const activeModules = MODULE_ORDER

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto pb-2 shrink-0">
          <TabsList className="inline-flex w-auto justify-start">
            {activeModules.map((moduleId) => (
              <TabsTrigger key={moduleId} value={moduleId} className="min-w-fit px-4">
                {MODULE_LABELS[moduleId] || moduleId}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 relative mt-4 border rounded-md bg-muted/10">
          <ScrollArea className="h-full absolute inset-0">
            <div className="p-4 md:p-6">
              {activeModules.map((moduleId) => {
                const items = docs[moduleId] || []

                return (
                  <TabsContent
                    key={moduleId}
                    value={moduleId}
                    className="m-0 border-none p-0 outline-none data-[state=active]:block data-[state=inactive]:hidden"
                  >
                    {loading ? (
                      <DocumentationSkeleton />
                    ) : items.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        Nenhuma documentação cadastrada para este módulo.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                          <Card
                            key={item.id}
                            className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200 bg-card"
                          >
                            <CardHeader>
                              <CardTitle className="text-xl text-primary">
                                {item.feature_name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <CardDescription className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                {item.description}
                              </CardDescription>
                            </CardContent>
                            <CardFooter className="mt-auto pt-4 flex justify-end border-t bg-muted/5">
                              <Badge
                                variant="outline"
                                className="text-xs text-muted-foreground font-normal bg-background/50 border-muted"
                              >
                                Última atualização: {formatDate(item.updated_at)}
                              </Badge>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  )
}
