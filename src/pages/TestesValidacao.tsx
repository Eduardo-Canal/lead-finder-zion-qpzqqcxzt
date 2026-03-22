import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TestCard } from '@/components/qa/TestCard'
import { QASummary } from '@/components/qa/QASummary'
import { QA_TESTS, clearQATests } from '@/lib/qa-tests'
import useAuthStore from '@/stores/useAuthStore'
import { toast } from 'sonner'
import { ShieldAlert, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TestState = {
  status: 'idle' | 'running' | 'passed' | 'failed' | 'warning'
  logs: string[]
  lastRunAt?: string
}

const SECTIONS = ['Funcionalidade', 'Integração', 'Performance', 'Segurança', 'UX/UI'] as const
const STORAGE_KEY = '@leadfinder:qa_test_results'

const loadInitialState = (): Record<string, TestState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : {}
    return QA_TESTS.reduce(
      (acc, t) => {
        const p = parsed[t.id]
        return {
          ...acc,
          [t.id]: p
            ? { ...p, status: p.status === 'running' ? 'idle' : p.status }
            : { status: 'idle', logs: [] },
        }
      },
      {} as Record<string, TestState>,
    )
  } catch (e) {
    return QA_TESTS.reduce((acc, t) => ({ ...acc, [t.id]: { status: 'idle', logs: [] } }), {})
  }
}

export default function TestesValidacao() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador'

  const [results, setResults] = useState<Record<string, TestState>>(loadInitialState)
  const [clearing, setClearing] = useState(false)
  const [runningAll, setRunningAll] = useState(false)

  useEffect(() => {
    if (isAdmin === false) navigate('/')
  }, [isAdmin, navigate])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  }, [results])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <ShieldAlert className="h-12 w-12 text-destructive opacity-80" />
        <h2 className="text-2xl font-bold text-destructive">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Apenas administradores podem acessar a central de testes de QA.
        </p>
      </div>
    )
  }

  const getFormattedNow = () => {
    return new Date()
      .toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', ' -')
  }

  const runTest = async (id: string) => {
    const test = QA_TESTS.find((t) => t.id === id)
    if (!test) return

    setResults((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'running', logs: ['Iniciando teste...'] },
    }))

    const logFn = (msg: string) => {
      setResults((prev) => ({ ...prev, [id]: { ...prev[id], logs: [...prev[id].logs, msg] } }))
    }

    try {
      const passed = await test.run({ log: logFn, userId: user?.user_id })
      setResults((prev) => ({
        ...prev,
        [id]: {
          status: passed ? 'passed' : 'failed',
          logs: [...prev[id].logs, passed ? 'Finalizado: Sucesso' : 'Finalizado: Falha'],
          lastRunAt: getFormattedNow(),
        },
      }))
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [id]: {
          status: 'failed',
          logs: [...prev[id].logs, `Erro crítico: ${err.message}`],
          lastRunAt: getFormattedNow(),
        },
      }))
    }
  }

  const runAllTests = async () => {
    setRunningAll(true)
    for (const test of QA_TESTS) {
      await runTest(test.id)
      await new Promise((res) => setTimeout(res, 300)) // Small delay for UI updates
    }
    setRunningAll(false)
    toast.success('Todos os testes finalizados.')
  }

  const handleClear = async () => {
    setClearing(true)
    try {
      await clearQATests(() => {})
      setResults(
        QA_TESTS.reduce((acc, t) => ({ ...acc, [t.id]: { status: 'idle', logs: [] } }), {}),
      )
      toast.success('Dados de teste removidos com sucesso.')
    } catch (err) {
      toast.error('Falha ao limpar dados de teste.')
    } finally {
      setClearing(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Secao', 'Nome', 'Status', 'Ultima Execucao', 'Logs']
    const rows = QA_TESTS.map((t) => {
      const s = results[t.id]
      return [
        t.id,
        t.section,
        `"${t.name}"`,
        s.status,
        `"${s.lastRunAt || 'Nunca'}"`,
        `"${s.logs.join(' | ').replace(/"/g, '""')}"`,
      ].join(',')
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_qa_${new Date().getTime()}.csv`
    link.click()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0066CC]">
            Testes e Validação (QA)
          </h2>
          <p className="text-muted-foreground mt-1">
            Painel automatizado para garantir a saúde e integridade do ecossistema Inteligência
            Zion.
          </p>
        </div>
        <Button
          onClick={runAllTests}
          disabled={runningAll}
          className="gap-2 bg-[#0066CC] hover:bg-[#0066CC]/90"
        >
          <PlayCircle className="h-4 w-4" />
          {runningAll ? 'Executando...' : 'Executar Todos os Testes'}
        </Button>
      </div>

      <QASummary
        total={QA_TESTS.length}
        passed={Object.values(results).filter((r) => r.status === 'passed').length}
        failed={Object.values(results).filter((r) => r.status === 'failed').length}
        onClear={handleClear}
        onExport={handleExportCSV}
        loadingClear={clearing}
      />

      <Tabs defaultValue={SECTIONS[0]} className="w-full">
        <TabsList className="bg-slate-100 p-1 flex-wrap h-auto justify-start mb-6">
          {SECTIONS.map((sec) => (
            <TabsTrigger
              key={sec}
              value={sec}
              className="data-[state=active]:bg-white data-[state=active]:text-[#0066CC] data-[state=active]:shadow-sm px-4 py-2"
            >
              {sec}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((sec) => (
          <TabsContent key={sec} value={sec} className="space-y-4 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {QA_TESTS.filter((t) => t.section === sec).map((test) => (
                <TestCard
                  key={test.id}
                  name={test.name}
                  description={test.description}
                  state={results[test.id]}
                  onRun={() => runTest(test.id)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
