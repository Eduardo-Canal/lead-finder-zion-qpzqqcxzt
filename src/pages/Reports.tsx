import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts'
import { ShieldAlert, Loader2, Target, Percent, DollarSign, CalendarIcon } from 'lucide-react'

export default function Reports() {
  const { user, hasPermission } = useAuthStore()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('este_mes')
  const [leads, setLeads] = useState<any[]>([])
  const [opps, setOpps] = useState<any[]>([])

  useEffect(() => {
    if (!isAdmin) return
    const fetchData = async () => {
      setLoading(true)
      const now = new Date()
      let startDate = new Date()
      let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      if (dateFilter === 'este_mes') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (dateFilter === 'ultimo_mes') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      } else if (dateFilter === 'ultimos_3_meses') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      } else if (dateFilter === 'ultimos_12_meses') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
      }

      const [{ data: leadsData }, { data: oppsData }] = await Promise.all([
        supabase
          .from('leads_salvos')
          .select('id, created_at, status_contato, ultima_data_contato, profiles(nome)')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('opportunities')
          .select('id, stage, value, created_at, leads_salvos(cnae_principal)')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
      ])

      setLeads(leadsData || [])
      setOpps(oppsData || [])
      setLoading(false)
    }
    fetchData()
  }, [dateFilter, isAdmin])

  const { totalLeads, contactRate, conversionRate, roiData, execData, funnelData, execConfig } =
    useMemo(() => {
      const total = leads.length
      const contacted = leads.filter(
        (l) => l.ultima_data_contato || (l.status_contato && l.status_contato !== 'Não Contatado'),
      ).length
      const oppsInFunnel = opps.filter(
        (o) => o.stage === 'proposal' || o.stage === 'closing',
      ).length

      const rMap: Record<string, number> = {}
      opps.forEach((o) => {
        const cnae = o.leads_salvos?.cnae_principal || 'Não informado'
        rMap[cnae] = (rMap[cnae] || 0) + Number(o.value || 0)
      })

      const eMap: Record<string, number> = {}
      leads.forEach((l) => {
        const exec = l.profiles?.nome || 'Sem Responsável'
        eMap[exec] = (eMap[exec] || 0) + 1
      })

      const eData = Object.entries(eMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
      const eConf = eData.reduce(
        (acc, curr, idx) => ({
          ...acc,
          [`exec-${idx}`]: { label: curr.name, color: `hsl(${(idx * 137.5) % 360}, 70%, 50%)` },
        }),
        {} as any,
      )

      return {
        totalLeads: total,
        contactRate: total > 0 ? ((contacted / total) * 100).toFixed(1) : '0.0',
        conversionRate: total > 0 ? ((oppsInFunnel / total) * 100).toFixed(1) : '0.0',
        roiData: Object.entries(rMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
        execData: eData,
        execConfig: eConf,
        funnelData: [
          { stage: 'Leads', count: total, fill: 'hsl(210, 100%, 40%)' },
          {
            stage: 'Prospecção',
            count: opps.filter((o) => o.stage === 'prospecting').length,
            fill: 'hsl(210, 100%, 60%)',
          },
          {
            stage: 'Qualificação',
            count: opps.filter((o) => o.stage === 'qualification').length,
            fill: 'hsl(45, 93%, 47%)',
          },
          {
            stage: 'Proposta',
            count: opps.filter((o) => o.stage === 'proposal').length,
            fill: 'hsl(280, 100%, 60%)',
          },
          {
            stage: 'Fechamento',
            count: opps.filter((o) => o.stage === 'closing').length,
            fill: 'hsl(142, 70%, 45%)',
          },
        ].filter((d) => d.count > 0 || d.stage === 'Leads'),
      }
    }, [leads, opps])

  if (!isAdmin)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <ShieldAlert className="h-12 w-12 text-destructive opacity-80" />
        <h2 className="text-2xl font-bold text-destructive">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Esta área é exclusiva para administradores. Você não tem permissão para acessar os
          Relatórios.
        </p>
      </div>
    )

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0066CC]">
            Dashboard de Relatórios
          </h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe os principais KPIs e a performance do seu CRM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="este_mes">Este Mês</SelectItem>
              <SelectItem value="ultimo_mes">Último Mês</SelectItem>
              <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="ultimos_12_meses">Últimos 12 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{totalLeads}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Contato</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-[#0066CC]">
                  {contactRate}%
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-emerald-600">
                  {conversionRate}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>ROI por CNAE</CardTitle>
                <CardDescription>Valor em oportunidades geradas por setor.</CardDescription>
              </CardHeader>
              <CardContent>
                {roiData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground border-dashed border rounded-lg">
                    Sem dados no período
                  </div>
                ) : (
                  <ChartContainer
                    config={{ value: { label: 'ROI (R$)', color: 'hsl(var(--primary))' } }}
                    className="h-[250px] w-full"
                  >
                    <BarChart data={roiData} margin={{ bottom: 20 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        fontSize={10}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tickLine={false} axisLine={false} fontSize={10} />
                      <Tooltip
                        content={
                          <ChartTooltipContent
                            formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`}
                          />
                        }
                      />
                      <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Leads por Executivo</CardTitle>
                <CardDescription>Distribuição da carteira.</CardDescription>
              </CardHeader>
              <CardContent>
                {execData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground border-dashed border rounded-lg">
                    Sem dados
                  </div>
                ) : (
                  <ChartContainer config={execConfig} className="h-[250px] w-full">
                    <PieChart>
                      <Pie
                        data={execData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {execData.map((_, i) => (
                          <Cell key={`c-${i}`} fill={`var(--color-exec-${i})`} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>Funil de Vendas</CardTitle>
                <CardDescription>Volume de leads em cada etapa comercial.</CardDescription>
              </CardHeader>
              <CardContent>
                {funnelData.length <= 1 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground border-dashed border rounded-lg">
                    Sem dados de funil
                  </div>
                ) : (
                  <ChartContainer
                    config={{ count: { label: 'Qtd', color: 'hsl(var(--primary))' } }}
                    className="h-[250px] w-full"
                  >
                    <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                        {funnelData.map((entry, i) => (
                          <Cell key={`f-${i}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
