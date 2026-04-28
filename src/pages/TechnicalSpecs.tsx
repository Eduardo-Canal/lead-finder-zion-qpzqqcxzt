import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase/client'
import { Layers, Activity, Search, ShieldCheck, PieChart, Info, Server, TrendingUp, LineChart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TechnicalSpec {
  id: string
  module: string
  feature_title: string
  stack: string[]
  status: 'Em desenvolvimento' | 'Pronto' | 'Deprecado' | string
  description: string
  updated_at: string
}

const MODULES = [
  { id: 'Prospecting', label: 'Prospecting', icon: Search },
  { id: 'Governance', label: 'Governance', icon: ShieldCheck },
  { id: 'Lead Management', label: 'Lead Management', icon: Layers },
  { id: 'Inteligência Zion', label: 'Inteligência Zion', icon: PieChart },
  { id: 'Curva ABC Financeira', label: 'Curva ABC Financeira', icon: TrendingUp },
  { id: 'Análise de Carteira', label: 'Análise de Carteira', icon: LineChart },
  { id: 'Performance Dashboard', label: 'Performance Dashboard', icon: Activity },
]

export default function TechnicalSpecs() {
  const [specs, setSpecs] = useState<TechnicalSpec[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSpecs()

    // Inscreve-se para escutar mudanças em tempo real na tabela
    const channel = supabase
      .channel('public:technical_specs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_specs' }, () => {
        fetchSpecs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchSpecs = async () => {
    try {
      // Como a tabela foi recém-criada na migration e não está no types.ts, ignoramos o TS na query
      const { data, error } = await supabase
        .from('technical_specs' as any)
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setSpecs(data || [])
    } catch (error: any) {
      console.error('Error fetching technical specs:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: error.message || 'Não foi possível buscar as especificações técnicas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pronto':
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 hover:bg-green-500/20 border border-green-200 dark:border-green-900/50">
            Pronto
          </Badge>
        )
      case 'Em desenvolvimento':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 hover:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-900/50">
            Em desenvolvimento
          </Badge>
        )
      case 'Deprecado':
        return (
          <Badge className="bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 hover:bg-slate-500/20 border border-slate-200 dark:border-slate-800">
            Deprecado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Server className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Especificações Técnicas</h1>
        </div>
        <p className="text-muted-foreground ml-11">
          Visão arquitetural e status de desenvolvimento das funcionalidades do Lead Finder Zion.
        </p>
      </div>

      <Tabs defaultValue="Prospecting" className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="w-full pb-4">
          <TabsList className="h-12 w-full justify-start gap-2 bg-transparent p-0">
            {MODULES.map((mod) => (
              <TabsTrigger
                key={mod.id}
                value={mod.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex items-center gap-2 rounded-full px-5 py-2.5 transition-all"
              >
                <mod.icon className="h-4 w-4" />
                {mod.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="flex-1 overflow-auto rounded-xl border bg-card/40 p-4 sm:p-6 backdrop-blur-sm">
          {MODULES.map((mod) => {
            const moduleSpecs = specs.filter((s) => s.module === mod.id)

            return (
              <TabsContent
                key={mod.id}
                value={mod.id}
                className="m-0 h-full focus-visible:outline-none"
              >
                {loading ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="flex flex-col border-muted/50">
                        <CardHeader className="gap-2 pb-4">
                          <div className="flex justify-between">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-5/6 mb-4" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-9 w-full" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : moduleSpecs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {moduleSpecs.map((spec) => (
                      <Card
                        key={spec.id}
                        className="flex flex-col overflow-hidden transition-all hover:shadow-md hover:border-primary/20 group"
                      >
                        <CardHeader className="pb-3 pt-5">
                          <div className="flex items-start justify-between gap-3">
                            <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary transition-colors">
                              {spec.feature_title}
                            </CardTitle>
                            <div className="shrink-0">{getStatusBadge(spec.status)}</div>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1 pb-4 flex flex-col gap-4">
                          <p
                            className="line-clamp-3 text-sm text-muted-foreground flex-1"
                            title={spec.description}
                          >
                            {spec.description ||
                              'Nenhuma descrição detalhada disponível para esta funcionalidade.'}
                          </p>

                          <div className="space-y-2.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                              Tech Stack
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {spec.stack && Array.isArray(spec.stack) && spec.stack.length > 0 ? (
                                spec.stack.map((tech, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="font-medium text-[11px] px-2 py-0 h-5"
                                  >
                                    {tech}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  Stack não informada
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>

                        <CardFooter className="pt-0 pb-5">
                          <Button
                            variant="outline"
                            className="w-full gap-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <Info className="h-4 w-4" />
                            Ver Detalhes Técnicos
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[400px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 text-center animate-in fade-in">
                    <div className="rounded-full bg-muted p-4">
                      <Layers className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Ainda não há especificações técnicas documentadas para o módulo {mod.label}.
                    </p>
                  </div>
                )}
              </TabsContent>
            )
          })}
        </div>
      </Tabs>
    </div>
  )
}
