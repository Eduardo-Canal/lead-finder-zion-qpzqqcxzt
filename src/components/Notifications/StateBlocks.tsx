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
        'flex flex-col items-center justify-center p-12 text-center text-muted-foreground animate-fade-in',
        className,
      )}
    >
      <div
        className="bg-slate-100 p-4 rounded-full mb-4"
        style={{ backgroundColor: designTokens.colors.neutral[100] }}
      >
        <Icon className="w-8 h-8" style={{ color: designTokens.colors.neutral[400] }} />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: designTokens.colors.neutral[700] }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mt-1 max-w-sm" style={{ color: designTokens.colors.neutral[500] }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6" variant="outline">
          {actionLabel}
        </Button>
      )}
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

export function LoadingCard() {
  return (
    <div
      className="rounded-xl border bg-white p-6 space-y-4 shadow-sm"
      style={{ borderColor: designTokens.colors.neutral[200] }}
    >
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

export function LoadingList({ items = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border p-4 rounded-xl"
          style={{ borderColor: designTokens.colors.neutral[200] }}
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
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
        'flex flex-col items-center justify-center p-12 text-center animate-fade-in',
        className,
      )}
    >
      <div
        className="bg-red-50 p-4 rounded-full mb-4"
        style={{ backgroundColor: designTokens.colors.error[50] }}
      >
        <AlertCircle className="w-8 h-8" style={{ color: designTokens.colors.error[500] }} />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: designTokens.colors.neutral[800] }}>
        {title}
      </h3>
      <p className="text-sm mt-1 max-w-sm" style={{ color: designTokens.colors.neutral[500] }}>
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
