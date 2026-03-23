import * as React from 'react'

import { cn } from '@/lib/utils'
import { designTokens } from '@/constants/designTokens'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, style, ...props }, ref) => {
    const tokenStyles: React.CSSProperties = {
      borderRadius: designTokens.effects.borderRadius.md,
      borderColor: error ? designTokens.colors.error[500] : designTokens.colors.neutral[300],
      fontFamily: designTokens.typography.fontFamily.sans,
      padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full border bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          error
            ? 'focus-visible:ring-red-500'
            : 'focus-visible:ring-primary focus-visible:border-primary',
          className,
        )}
        ref={ref}
        style={{ ...tokenStyles, ...style }}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
