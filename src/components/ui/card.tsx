import * as React from 'react'

import { cn } from '@/lib/utils'
import { designTokens } from '@/constants/designTokens'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => {
    const tokenStyles: React.CSSProperties = {
      borderRadius: designTokens.effects.borderRadius.xl,
      boxShadow: designTokens.effects.shadows.DEFAULT,
      borderColor: designTokens.colors.neutral[200],
      borderWidth: designTokens.effects.borderWidth.DEFAULT,
      borderStyle: 'solid',
      fontFamily: designTokens.typography.fontFamily.sans,
      backgroundColor: '#ffffff',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'text-card-foreground transition-all duration-300 hover:shadow-md overflow-hidden',
          className,
        )}
        style={{ ...tokenStyles, ...style }}
        {...props}
      />
    )
  },
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      style={{ padding: designTokens.spacing[6], ...style }}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      style={{ color: designTokens.colors.neutral[900], ...style }}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      style={{ color: designTokens.colors.neutral[500], ...style }}
      {...props}
    />
  ),
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      style={{ padding: `0 ${designTokens.spacing[6]} ${designTokens.spacing[6]}`, ...style }}
      {...props}
    />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center border-t', className)}
      style={{
        padding: designTokens.spacing[6],
        borderColor: designTokens.colors.neutral[100],
        backgroundColor: designTokens.colors.neutral[50],
        ...style,
      }}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
