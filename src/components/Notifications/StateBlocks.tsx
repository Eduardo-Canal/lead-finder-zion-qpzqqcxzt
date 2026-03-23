import { FolderOpen, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TableRow, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function EmptyState({
  title,
  description,
  className,
  icon: Icon = FolderOpen,
}: {
  title: string
  description?: string
  className?: string
  icon?: any
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center text-muted-foreground animate-fade-in',
        className,
      )}
    >
      <div className="bg-slate-100 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {description && <p className="text-sm mt-1 max-w-sm">{description}</p>}
    </div>
  )
}

export function LoadingTableRows({ columns = 5, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function ErrorState({
  title = 'Erro inesperado',
  description = 'Não foi possível carregar os dados.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center text-destructive animate-fade-in">
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm mt-1 max-w-sm opacity-90">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-destructive text-white rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
