import { cn } from '@/lib/utils'
import { designTokens } from '@/constants/designTokens'

function Skeleton({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md', className)}
      style={{ backgroundColor: designTokens.colors.neutral[200], ...style }}
      {...props}
    />
  )
}

export { Skeleton }
