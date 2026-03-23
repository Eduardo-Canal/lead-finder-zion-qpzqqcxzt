import { FolderOpen, AlertCircle, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TableRow, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { designTokens } from '@/constants/designTokens'

export function EmptyState({
  title,
  description,
  className,
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
}: {
  title: string
  description?: string
  className?: string
  icon?: any
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center text-muted-foreground animate-fade-in h-full w-full',
        className,
      )}
    >
      <div className="bg-slate-50 p-5 rounded-full mb-5 shadow-sm border border-slate-100">
        <Icon className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-slate-800">{title}</h3>
      {description && (
        <p className="text-sm mt-2 max-w-sm text-slate-500 font-medium">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6 gap-2" variant="outline">
          <RefreshCw className="w-4 h-4" /> {actionLabel}
        </Button>
      )}
    </div>
  )
}

export function LoadingTableRows({ columns = 5, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="animate-pulse hover:bg-transparent">
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-5 w-full bg-slate-100 rounded-md" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function LoadingCard() {
  return (
    <div
      className="rounded-xl border bg-white p-6 space-y-4 shadow-sm animate-pulse"
      style={{ borderColor: designTokens.colors.neutral[200] }}
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-1/3 bg-slate-100" />
        <Skeleton className="h-6 w-6 rounded-full bg-slate-100" />
      </div>
      <Skeleton className="h-10 w-1/2 bg-slate-100 mt-2" />
      <Skeleton className="h-3 w-1/4 bg-slate-100" />
    </div>
  )
}

export function LoadingList({ items = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border p-4 rounded-xl shadow-sm animate-pulse"
          style={{ borderColor: designTokens.colors.neutral[200] }}
        >
          <Skeleton className="h-12 w-12 rounded-full bg-slate-100" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4 bg-slate-100" />
            <Skeleton className="h-3 w-1/2 bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorState({
  title = 'Ocorreu um erro',
  description = 'Não foi possível carregar as informações.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center animate-fade-in h-full w-full',
        className,
      )}
    >
      <div className="bg-red-50 p-5 rounded-full mb-5 shadow-sm border border-red-100">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-slate-800">{title}</h3>
      <p className="text-sm mt-2 max-w-sm text-slate-500 font-medium">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6 gap-2">
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
