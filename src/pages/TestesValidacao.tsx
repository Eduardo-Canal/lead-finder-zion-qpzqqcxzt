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
}

const SECTIONS = ['Funcionalidade', 'Integração', 'Performance', 'Segurança', 'UX/UI'] as const

export default function TestesValidacao() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador'

  const [results, setResults] = useState<Record<string, TestState>>(
    QA_TESTS.reduce((acc, test) => ({ ...acc, [test.id]: { status: 'idle', logs: [] } }), {}),
  )
  const [clearing, setClearing] = useState(false)
  const [runningAll, setRunningAll] = useState(false)

  useEffect(() => {
    if (isAdmin === false) navigate('/')
  }, [isAdmin, navigate])

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

  const runTest = async (id: string) => {
    const test = QA_TESTS.find((t) => t.id === id)
    if (!test) return

    setResults((prev) => ({ ...prev, [id]: { status: 'running', logs: ['Iniciando teste...'] } }))

    const logFn = (msg: string) => {
      setResults((prev) => {
        const currentLogs = prev[id].logs
        return { ...prev, [id]: { ...prev[id], logs: [...currentLogs, msg] } }
      })
    }

    try {
      const passed = await test.run({ log: logFn, userId: user?.user_id })
      setResults((prev) => ({
        ...prev,
        [id]: {
          status: passed ? 'passed' : 'failed',
          logs: [...prev[id].logs, passed ? 'Finalizado: Sucesso' : 'Finalizado: Falha'],
        },
      }))
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [id]: { status: 'failed', logs: [...prev[id].logs, `Erro crítico: ${err.message}`] },
      }))
    }
  }

  const runAllTests = async () => {
    setRunningAll(true)
    for (const test of QA_TESTS) {
      await runTest(test.id)
      // Small delay between tests to allow UI updates
      await new Promise((res) => setTimeout(res, 300))
    }
    setRunningAll(false)
    toast.success('Todos os testes finalizados.')
  }

  const handleClear = async () => {
    setClearing(true)
    try {
      const logFn = () => {} // Silent clear logs
      await clearQATests(logFn)
      toast.success('Dados de teste removidos com sucesso.')
    } catch (err) {
      toast.error('Falha ao limpar dados de teste.')
    } finally {
      setClearing(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Secao', 'Nome', 'Status', 'Logs']
    const rows = QA_TESTS.map((t) => {
      const state = results[t.id]
      return [
        t.id,
        t.section,
        `"${t.name}"`,
        state.status,
        `"${state.logs.join(' | ').replace(/"/g, '""')}"`,
      ].join(',')
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio_qa_${new Date().getTime()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const passedCount = Object.values(results).filter((r) => r.status === 'passed').length
  const failedCount = Object.values(results).filter((r) => r.status === 'failed').length

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
        passed={passedCount}
        failed={failedCount}
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

        {SECTIONS.map((sec) => {
          const sectionTests = QA_TESTS.filter((t) => t.section === sec)
          return (
            <TabsContent key={sec} value={sec} className="space-y-4 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sectionTests.map((test) => (
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
          )
        })}
      </Tabs>
    </div>
  )
}
