import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SubmitButton({ isLoading, children, className, ...props }: any) {
  return (
    <Button
      disabled={isLoading}
      className={cn('transition-all duration-200 active:scale-[0.98]', className)}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-[0.8rem] font-medium text-destructive mt-1 animate-fade-in">{message}</p>
  )
}
