import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type TestState = {
  status: 'idle' | 'running' | 'passed' | 'failed' | 'warning'
  logs: string[]
}

type TestCardProps = {
  name: string
  description: string
  state: TestState
  onRun: () => void
}

export function TestCard({ name, description, state, onRun }: TestCardProps) {
  const getStatusDisplay = () => {
    switch (state.status) {
      case 'running':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 w-24 justify-center">Testando...</Badge>
        )
      case 'passed':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 w-24 justify-center">PASSOU</Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="w-24 justify-center">
            FALHOU
          </Badge>
        )
      case 'warning':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white w-24 justify-center">
            AVISO
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-slate-400 w-24 justify-center">
            Pendente
          </Badge>
        )
    }
  }

  const getStatusIcon = () => {
    switch (state.status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
    }
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all',
        state.status === 'running' ? 'border-blue-200 shadow-sm' : '',
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 shrink-0">{getStatusIcon()}</div>
            <div className="space-y-1 w-full">
              <h4 className="font-semibold text-slate-800 leading-none">{name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0">
            {getStatusDisplay()}
            <Button
              size="sm"
              variant="outline"
              onClick={onRun}
              disabled={state.status === 'running'}
              className="gap-2 bg-slate-50"
            >
              {state.status === 'running' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 text-[#0066CC]" />
              )}
              Executar
            </Button>
          </div>
        </div>

        {state.logs.length > 0 && (
          <div className="bg-slate-950 text-slate-300 p-3 text-xs font-mono border-t border-slate-800">
            <ScrollArea className="h-24 w-full">
              <div className="space-y-1">
                {state.logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-slate-500 shrink-0" />
                    <span className="break-all">{log}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
