import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Trash2, CheckCircle, XCircle, Activity, Loader2 } from 'lucide-react'

type QASummaryProps = {
  total: number
  passed: number
  failed: number
  loadingClear: boolean
  onExport: () => void
  onClear: () => void
}

export function QASummary({
  total,
  passed,
  failed,
  loadingClear,
  onExport,
  onClear,
}: QASummaryProps) {
  const executed = passed + failed
  const rate = executed > 0 ? Math.round((passed / executed) * 100) : 0

  return (
    <Card className="bg-slate-800 text-white shadow-md border-none overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 md:gap-10 w-full md:w-auto">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
                Total Testes
              </p>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-300" />
                <span className="text-3xl font-bold">{total}</span>
              </div>
            </div>

            <div className="w-px h-12 bg-slate-700 hidden md:block"></div>

            <div>
              <p className="text-emerald-400/80 text-xs uppercase tracking-wider font-semibold mb-1">
                Passaram
              </p>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-3xl font-bold">{passed}</span>
              </div>
            </div>

            <div className="w-px h-12 bg-slate-700 hidden md:block"></div>

            <div>
              <p className="text-red-400/80 text-xs uppercase tracking-wider font-semibold mb-1">
                Falharam
              </p>
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-5 w-5" />
                <span className="text-3xl font-bold">{failed}</span>
              </div>
            </div>

            <div className="w-px h-12 bg-slate-700 hidden md:block"></div>

            <div>
              <p className="text-blue-300 text-xs uppercase tracking-wider font-semibold mb-1">
                Taxa Sucesso
              </p>
              <div className="text-3xl font-bold text-blue-400">{rate}%</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
            <Button
              onClick={onExport}
              variant="outline"
              className="bg-transparent border-slate-600 text-white hover:bg-slate-700 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório CSV
            </Button>
            <Button
              onClick={onClear}
              variant="destructive"
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-transparent hover:border-transparent"
              disabled={loadingClear}
            >
              {loadingClear ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Limpar Dados de Teste
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
