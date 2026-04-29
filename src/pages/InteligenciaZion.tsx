import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import useLeadStore from '@/stores/useLeadStore'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  RefreshCw,
  Briefcase,
  Hexagon,
  Users,
  PieChart as PieChartIcon,
  Eye,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

const COLORS = [
  '#EF4444',
  '#F97316',
  '#FBBF24',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#9CA3AF',
  '#92400E',
  '#EC4899',
]

export default function InteligenciaZion() {
  const navigate = useNavigate()
  const { clearFilters, addCnae } = useLeadStore()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [cnaeGroups, setCnaeGroups] = useState<any[]>([])
  const [visibleCnaes, setVisibleCnaes] = useState(5)

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('get-clientes-por-cnae', {
        method: 'POST',
      })
      if (error) throw error

      setCnaeGroups(data?.data || [])

      const allClients: any[] = []
      data?.data?.forEach((item: any) => item.clientes && allClients.push(...item.clientes))
      setClients(allClients)
    } catch (e) {
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      toast.loading('Sincronizando com Bitrix24...', { id: 'sync' })
      await supabase.functions.invoke('fetch-bitrix-clients-zion', { method: 'POST' })
      await supabase.functions.invoke('calculate-carteira-insights', { method: 'POST' })
      await loadData()
      toast.success('Dados atualizados com sucesso!', { id: 'sync' })
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`, { id: 'sync' })
    } finally {
      setSyncing(false)
    }
  }

  const handleBuscarClonesCnae = (cnae: string) => {
    console.log('handleBuscarClonesCnae - CNAE selecionado:', cnae)
    clearFilters()
    console.log('handleBuscarClonesCnae - Após clearFilters')
    addCnae(cnae)
    console.log('handleBuscarClonesCnae - Após addCnae, filters:', { clearFilters, addCnae })
    toast.success(`Buscando empresas para o CNAE ${cnae}.`)
    navigate('/prospeccao')
  }

  const pieData = useMemo(() => {
    const sorted = [...cnaeGroups].sort((a, b) => b.count - a.count)
    const top = sorted.slice(0, 8)
    const others = sorted.slice(8)
    const othersCount = others.reduce((acc, curr) => acc + curr.count, 0)

    const data = top.map((g, i) => ({
      cnae: g.cnae,
      descricao: g.descricao,
      count: g.count,
      fill: COLORS[i % COLORS.length],
    }))

    if (othersCount > 0) {
      data.push({
        cnae: 'Outros',
        descricao: 'Outros setores',
        count: othersCount,
        fill: COLORS[top.length % COLORS.length],
      })
    }

    return data
  }, [cnaeGroups])

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180)
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180)

    if (percent < 0.05) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-bold drop-shadow-md"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (loading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )

  return (
    <div className="p-6 w-full mx-auto space-y-6 flex flex-col animate-fade-in-up pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inteligência Zion</h1>
          <p className="text-muted-foreground mt-1">
            Descubra perfis ideais e explore a composição da sua carteira.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/automacao')}>
            <Zap className="w-4 h-4 mr-2" />
            Automação
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={syncing ? 'animate-spin mr-2' : 'mr-2'} />
            Sincronizar CRM
          </Button>
        </div>
      </div>

      <div className="w-full space-y-6 mt-4">
        {/* Linha Superior: 2 Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg shadow border px-6 flex items-center justify-between group transition-all h-[80px]">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                TOTAL DE CLIENTES
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {clients.length}
              </h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-card rounded-lg shadow border px-6 flex items-center justify-between group transition-all h-[80px]">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                TOTAL DE CNAES
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {cnaeGroups.length}
              </h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Linha Inferior: Gráfico + Tabela */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
          {/* Coluna Esquerda: Gráfico (60% - col-span-3) */}
          <div className="lg:col-span-3 bg-card rounded-lg shadow border p-6 flex flex-col w-full min-h-[400px]">
            <h3 className="text-lg font-semibold text-foreground mb-4">Composição da Carteira</h3>
            <div className="w-full flex-1 min-h-[400px]">
              {cnaeGroups.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <RechartsTooltip
                      formatter={(value: number, name: string) => [`${value} clientes`, name]}
                    />
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="cnae"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <PieChartIcon className="w-12 h-12 mb-4 text-muted/30" />
                  <p>Sem dados suficientes.</p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Tabela (40% - col-span-2) */}
          <div className="lg:col-span-2 bg-card rounded-lg shadow border p-4 flex flex-col w-full h-fit">
            <h3 className="text-lg font-semibold text-foreground mb-4 shrink-0">
              Top CNAE na Carteira
            </h3>
            <div className="flex-1">
              {cnaeGroups.length > 0 ? (
                <>
                  <table className="w-full text-sm text-left border-collapse mb-4">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 font-semibold text-muted-foreground border-b">CNAE</th>
                        <th className="p-3 font-semibold text-muted-foreground text-center border-b">
                          Total
                        </th>
                        <th className="p-3 font-semibold text-muted-foreground text-center border-b w-[90px]">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cnaeGroups
                        .sort((a, b) => b.count - a.count)
                        .slice(0, visibleCnaes)
                        .map((group) => (
                          <tr
                            key={group.cnae}
                            className="hover:bg-muted/20 transition-colors group"
                          >
                            <td className="p-3">
                              <div
                                className="font-semibold text-foreground line-clamp-1"
                                title={group.cnae}
                              >
                                {group.cnae}
                              </div>
                              <div
                                className="text-xs text-muted-foreground line-clamp-1 mt-0.5"
                                title={group.descricao}
                              >
                                {group.descricao}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                onClick={() =>
                                  navigate(
                                    `/cnae-details?cnae_code=${encodeURIComponent(group.cnae)}`,
                                  )
                                }
                                className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md min-w-[2rem] text-xs cursor-pointer hover:bg-primary/30 transition-colors shadow-sm hover:shadow"
                                title="Ver Detalhes do CNAE"
                              >
                                {group.count}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    navigate(
                                      `/cnae-details?cnae_code=${encodeURIComponent(group.cnae)}`,
                                    )
                                  }
                                  title="Ver Detalhes"
                                  className="hover:text-primary hover:bg-primary/10 h-8 w-8 text-muted-foreground group-hover:text-primary"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleBuscarClonesCnae(group.cnae)}
                                  title="Buscar Clones"
                                  className="hover:text-primary hover:bg-primary/10 h-8 w-8 text-muted-foreground group-hover:text-primary"
                                >
                                  <Hexagon className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    navigate(`/automacao?cnae=${encodeURIComponent(group.cnae)}`)
                                  }
                                  title="Criar automação para este CNAE"
                                  className="hover:text-amber-500 hover:bg-amber-50 h-8 w-8 text-muted-foreground"
                                >
                                  <Zap className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {visibleCnaes < cnaeGroups.length && (
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleCnaes((prev) => prev + 5)}
                        className="w-full"
                      >
                        Ver Todos os CNAEs
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-muted-foreground">
                  <Briefcase className="w-10 h-10 mb-4 text-muted/30" />
                  <p className="text-sm">Nenhum dado encontrado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
