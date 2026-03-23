import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { designTokens } from '@/constants/designTokens'

export function SubmitButton({ isLoading, children, className, loadingText, ...props }: any) {
  return (
    <Button
      disabled={isLoading}
      className={cn('transition-all duration-200 active:scale-[0.98]', className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || 'Enviando...'}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export function FormError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium mt-1.5 animate-fade-in',
        className,
      )}
      style={{ color: designTokens.colors.error[600] }}
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

export function FormSuccess({ message, className }: { message?: string; className?: string }) {
  if (!message) return null
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium mt-1.5 animate-fade-in',
        className,
      )}
      style={{ color: designTokens.colors.success[600] }}
    >
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

export function FormGroup({ children, className }: any) {
  return <div className={cn('space-y-4', className)}>{children}</div>
}
