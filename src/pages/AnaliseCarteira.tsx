import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Download,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  BarChart3,
  Presentation,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// --- MOCK DATA GENERATION ---
const ESTADOS = ['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'BA', 'GO', 'MT', 'ES']
const CURVAS = ['Todos', 'A+', 'A', 'B', 'C', 'Não Classificado']

const CNAES_REF = [
  {
    codigo: '4930-2/02',
    desc: 'Transporte rodoviário de carga, exceto produtos perigosos e mudanças, intermunicipal, interestadual e internacional',
    weight: 100,
  },
  {
    codigo: '4930-2/01',
    desc: 'Transporte rodoviário de carga, exceto produtos perigosos e mudanças, municipal',
    weight: 80,
  },
  { codigo: '4930-2/03', desc: 'Transporte rodoviário de produtos perigosos', weight: 60 },
  {
    codigo: '5229-0/99',
    desc: 'Outras atividades auxiliares dos transportes terrestres não especificadas anteriormente',
    weight: 50,
  },
  { codigo: '5212-5/00', desc: 'Carga e descarga', weight: 45 },
  {
    codigo: '5211-7/99',
    desc: 'Depósitos de mercadorias para terceiros, exceto armazéns gerais e guarda-móveis',
    weight: 40,
  },
  { codigo: '5250-8/04', desc: 'Organização logística do transporte de carga', weight: 40 },
  { codigo: '4930-2/04', desc: 'Transporte rodoviário de mudanças', weight: 35 },
  { codigo: '5320-2/02', desc: 'Serviços de entrega rápida', weight: 35 },
  {
    codigo: '5250-8/03',
    desc: 'Agenciamento de cargas, exceto para o transporte marítimo',
    weight: 30,
  },
  {
    codigo: '7739-0/99',
    desc: 'Aluguel de outras máquinas e equipamentos comerciais e industriais não especificados, sem operador',
    weight: 25,
  },
  {
    codigo: '4619-2/00',
    desc: 'Representantes comerciais e agentes do comércio de mercadorias em geral não especializado',
    weight: 25,
  },
  {
    codigo: '4530-7/01',
    desc: 'Comércio por atacado de peças e acessórios novos para veículos automotores',
    weight: 20,
  },
  {
    codigo: '4530-7/03',
    desc: 'Comércio a varejo de peças e acessórios novos para veículos automotores',
    weight: 20,
  },
  {
    codigo: '4520-0/01',
    desc: 'Serviços de manutenção e reparação mecânica de veículos automotores',
    weight: 20,
  },
  {
    codigo: '7490-1/04',
    desc: 'Atividades de intermediação e agenciamento de serviços e negócios em geral',
    weight: 15,
  },
  {
    codigo: '4639-7/01',
    desc: 'Comércio atacadista de produtos alimentícios em geral',
    weight: 15,
  },
  {
    codigo: '4789-0/99',
    desc: 'Comércio varejista de outros produtos não especificados anteriormente',
    weight: 15,
  },
  {
    codigo: '4923-0/02',
    desc: 'Serviço de transporte de passageiros - locação de automóveis com motorista',
    weight: 15,
  },
  { codigo: '5223-1/00', desc: 'Estacionamento de veículos', weight: 10 },
  {
    codigo: '4649-4/99',
    desc: 'Comércio atacadista de outros equipamentos e artigos de uso pessoal e doméstico',
    weight: 10,
  },
  {
    codigo: '8211-3/00',
    desc: 'Serviços combinados de escritório e apoio administrativo',
    weight: 10,
  },
  {
    codigo: '8299-2/99',
    desc: 'Outras atividades de serviços prestados principalmente às empresas',
    weight: 10,
  },
  { codigo: '4681-8/05', desc: 'Comércio atacadista de lubrificantes', weight: 8 },
  {
    codigo: '4661-3/00',
    desc: 'Comércio atacadista de defensivos agrícolas, adubos, fertilizantes e corretivos do solo',
    weight: 8,
  },
  {
    codigo: '4637-1/99',
    desc: 'Comércio atacadista especializado em outros produtos alimentícios não especificados',
    weight: 8,
  },
  { codigo: '4744-0/99', desc: 'Comércio varejista de ferragens e ferramentas', weight: 5 },
  { codigo: '4672-9/00', desc: 'Comércio atacadista de ferragens e ferramentas', weight: 5 },
  {
    codigo: '4679-6/99',
    desc: 'Comércio atacadista de materiais de construção em geral',
    weight: 5,
  },
  {
    codigo: '4663-0/00',
    desc: 'Comércio atacadista de máquinas e equipamentos para uso industrial; partes e peças',
    weight: 5,
  },
  {
    codigo: '3314-7/10',
    desc: 'Manutenção e reparação de máquinas e equipamentos para uso geral',
    weight: 5,
  },
  {
    codigo: '2599-3/99',
    desc: 'Fabricação de outros produtos de metal não especificados anteriormente',
    weight: 5,
  },
  { codigo: '7112-0/00', desc: 'Serviços de engenharia', weight: 5 },
  {
    codigo: '6201-5/01',
    desc: 'Desenvolvimento de programas de computador sob encomenda',
    weight: 5,
  },
]

const MOCK_CLIENTS: any[] = []
let idCounter = 1
CNAES_REF.forEach((cnae) => {
  const numClients = cnae.weight * 2 + (idCounter % 5)
  for (let i = 0; i < numClients; i++) {
    const r = (idCounter * 13) % 100
    let curve = 'Não Classificado'
    if (r < 5) curve = 'A+'
    else if (r < 20) curve = 'A'
    else if (r < 50) curve = 'B'
    else if (r < 80) curve = 'C'

    const s = (idCounter * 7) % ESTADOS.length

    MOCK_CLIENTS.push({
      id: String(idCounter++),
      cnae: cnae.codigo,
      curvaAbc: curve,
      estado: ESTADOS[s],
    })
  }
})

const MOCK_STATS = CNAES_REF.reduce(
  (acc, cnae, idx) => {
    const pot = cnae.weight * 50 + ((idx * 137) % 500)
    const trendDir = idx % 3 === 0 ? 'down' : idx % 5 === 0 ? 'neutral' : 'up'
    const trendVal = ((idx * 1.3) % 15).toFixed(1)
    acc[cnae.codigo] = {
      potencial: pot,
      tendencia: { dir: trendDir, val: Number(trendVal) },
    }
    return acc
  },
  {} as Record<string, any>,
)

// --- CHART CONFIG ---
const chartConfig = {
  aPlus: { label: 'Curva A+', color: '#064e3b' },
  a: { label: 'Curva A', color: '#10b981' },
  b: { label: 'Curva B', color: '#f59e0b' },
  c: { label: 'Curva C', color: '#ef4444' },
  nc: { label: 'Não Classificado', color: '#94a3b8' },
} satisfies ChartConfig

export default function AnaliseCarteira() {
  const { toast } = useToast()
  const [filtroCurva, setFiltroCurva] = useState<string>('Todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos')

  // Filter clients
  const filteredClients = useMemo(() => {
    return MOCK_CLIENTS.filter((c) => {
      if (filtroCurva !== 'Todos' && c.curvaAbc !== filtroCurva) return false
      if (filtroEstado !== 'Todos' && c.estado !== filtroEstado) return false
      return true
    })
  }, [filtroCurva, filtroEstado])

  // Aggregate by CNAE
  const cnaesData = useMemo(() => {
    const map = new Map<string, any>()

    filteredClients.forEach((c) => {
      if (!map.has(c.cnae)) {
        const ref = CNAES_REF.find((x) => x.codigo === c.cnae)
        map.set(c.cnae, {
          codigo: c.cnae,
          descricao: ref?.desc || '',
          total: 0,
          aPlus: 0,
          a: 0,
          b: 0,
          c: 0,
          nc: 0,
          potencial: MOCK_STATS[c.cnae]?.potencial || 0,
          tendencia: MOCK_STATS[c.cnae]?.tendencia || { dir: 'neutral', val: 0 },
        })
      }
      const data = map.get(c.cnae)
      data.total++
      if (c.curvaAbc === 'A+') data.aPlus++
      else if (c.curvaAbc === 'A') data.a++
      else if (c.curvaAbc === 'B') data.b++
      else if (c.curvaAbc === 'C') data.c++
      else data.nc++
    })

    const arr = Array.from(map.values())
    arr.forEach((item) => {
      item.penetracao = item.potencial > 0 ? (item.total / item.potencial) * 100 : 0
    })

    arr.sort((x, y) => y.total - x.total)
    return arr
  }, [filteredClients])

  const top10Data = useMemo(() => cnaesData.slice(0, 10), [cnaesData])

  // Executive Summary
  const summary = useMemo(() => {
    const s = { totalClientes: 0, totalCnaes: cnaesData.length, aPlus: 0, a: 0, b: 0, c: 0, nc: 0 }
    filteredClients.forEach((c) => {
      s.totalClientes++
      if (c.curvaAbc === 'A+') s.aPlus++
      else if (c.curvaAbc === 'A') s.a++
      else if (c.curvaAbc === 'B') s.b++
      else if (c.curvaAbc === 'C') s.c++
      else s.nc++
    })
    return s
  }, [filteredClients, cnaesData.length])

  const handleExport = () => {
    toast({
      title: 'Relatório Solicitado',
      description: 'O relatório em Excel está sendo gerado e o download iniciará em breve.',
    })
  }

  const handleCreateAlert = () => {
    toast({
      title: 'Alertas Inteligentes',
      description: 'Painel de configuração de alertas será aberto em uma nova janela.',
    })
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-fade-in-up max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Presentation className="w-8 h-8 text-primary" /> Análise de Carteira
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            Inteligência de mercado, penetração por setor e distribuição da Curva ABC.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" /> Exportar Relatório
          </Button>
          <Button
            onClick={handleCreateAlert}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            <Target className="w-4 h-4 mr-2" /> Criar Alertas/Metas
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-slate-500" />
            Filtros Avançados
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-600">Curva ABC</Label>
              <Select value={filtroCurva} onValueChange={setFiltroCurva}>
                <SelectTrigger className="bg-white border-slate-200 shadow-sm h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CURVAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-600">Estado / Região</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="bg-white border-slate-200 shadow-sm h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Estados</SelectItem>
                  {ESTADOS.sort().map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Clientes
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1">
              {summary.totalClientes.toLocaleString()}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total CNAEs
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1">
              {summary.totalCnaes.toLocaleString()}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#064e3b] shadow-sm bg-emerald-50/30">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Curva A+
            </span>
            <span className="text-3xl font-extrabold text-[#064e3b] mt-1">
              {summary.aPlus.toLocaleString()}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#10b981] shadow-sm bg-emerald-50/10">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Curva A
            </span>
            <span className="text-3xl font-extrabold text-[#10b981] mt-1">
              {summary.a.toLocaleString()}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#f59e0b] shadow-sm bg-amber-50/30">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Curva B
            </span>
            <span className="text-3xl font-extrabold text-[#f59e0b] mt-1">
              {summary.b.toLocaleString()}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#ef4444] shadow-sm bg-rose-50/30">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Curva C
            </span>
            <span className="text-3xl font-extrabold text-[#ef4444] mt-1">
              {summary.c.toLocaleString()}
            </span>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-slate-400 shadow-sm bg-slate-50/50">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Não Class.
            </span>
            <span className="text-3xl font-extrabold text-slate-600 mt-1">
              {summary.nc.toLocaleString()}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Top 10 CNAEs na Carteira
          </CardTitle>
          <CardDescription>
            Principais setores classificados pelo volume de clientes ativos e distribuição de Curva
            ABC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {top10Data.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-slate-500">
              Nenhum dado disponível para os filtros selecionados.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="w-full aspect-auto h-[400px]">
              <BarChart
                data={top10Data}
                layout="vertical"
                margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="codigo"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.1 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                <Bar dataKey="aPlus" stackId="a" fill="var(--color-aPlus)" />
                <Bar dataKey="a" stackId="a" fill="var(--color-a)" />
                <Bar dataKey="b" stackId="a" fill="var(--color-b)" />
                <Bar dataKey="c" stackId="a" fill="var(--color-c)" />
                <Bar dataKey="nc" stackId="a" fill="var(--color-nc)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg">Inteligência Estratégica por CNAE</CardTitle>
          <CardDescription>
            Detalhamento analítico e tendências de mercado baseadas na base atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[100px] font-bold text-slate-700">Código</TableHead>
                  <TableHead className="font-bold text-slate-700">Descrição CNAE</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Clientes</TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-[#064e3b]">
                    A+
                  </TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-[#10b981]">A</TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-[#f59e0b]">B</TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-[#ef4444]">C</TableHead>
                  <TableHead className="text-center w-[60px] font-bold text-slate-500">
                    NC
                  </TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Potencial</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Penetração</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Tendência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cnaesData.map((row) => (
                  <TableRow key={row.codigo} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-semibold text-slate-900">{row.codigo}</TableCell>
                    <TableCell
                      className="max-w-[250px] truncate text-slate-600 font-medium"
                      title={row.descricao}
                    >
                      {row.descricao}
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-slate-900">
                      {row.total}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.aPlus > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 shadow-none font-bold">
                          {row.aPlus}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.a > 0 ? (
                        <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-0 shadow-none font-bold">
                          {row.a}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.b > 0 ? (
                        <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-0 shadow-none font-bold">
                          {row.b}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.c > 0 ? (
                        <Badge className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-0 shadow-none font-bold">
                          {row.c}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.nc > 0 ? (
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 shadow-none font-bold">
                          {row.nc}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-bold">
                      {row.potencial.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-bold text-slate-700">
                          {row.penetracao.toFixed(1)}%
                        </span>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(row.penetracao, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      {row.tendencia.dir === 'up' ? (
                        <div className="flex items-center justify-end text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-md ml-auto w-max">
                          <TrendingUp className="w-4 h-4 mr-1" />+{row.tendencia.val}%
                        </div>
                      ) : row.tendencia.dir === 'down' ? (
                        <div className="flex items-center justify-end text-rose-600 text-sm font-bold bg-rose-50 px-2 py-1 rounded-md ml-auto w-max">
                          <TrendingDown className="w-4 h-4 mr-1" />-{row.tendencia.val}%
                        </div>
                      ) : (
                        <div className="flex items-center justify-end text-slate-500 text-sm font-bold bg-slate-100 px-2 py-1 rounded-md ml-auto w-max">
                          <Minus className="w-4 h-4 mr-1" />
                          0.0%
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {cnaesData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-slate-500 font-medium">
                      Nenhum dado encontrado para os filtros selecionados. Tente ajustar sua busca.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
