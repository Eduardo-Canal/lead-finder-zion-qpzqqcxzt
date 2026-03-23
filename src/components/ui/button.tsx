import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { designTokens } from '@/constants/designTokens'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: '', // Maps to primary
        primary: '',
        secondary: '',
        destructive: '',
        outline: 'border bg-background hover:bg-accent/50',
        ghost: 'bg-transparent hover:bg-accent/20',
        link: 'underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    const tokenStyles: React.CSSProperties = {
      borderRadius: designTokens.effects.borderRadius.md,
      fontFamily: designTokens.typography.fontFamily.sans,
    }

    if (variant === 'primary' || variant === 'default') {
      tokenStyles.backgroundColor = designTokens.colors.primary[500]
      tokenStyles.color = '#fff'
      tokenStyles.boxShadow = designTokens.effects.shadows.sm
    } else if (variant === 'secondary') {
      tokenStyles.backgroundColor = designTokens.colors.secondary[500]
      tokenStyles.color = '#fff'
      tokenStyles.boxShadow = designTokens.effects.shadows.sm
    } else if (variant === 'destructive') {
      tokenStyles.backgroundColor = designTokens.colors.error[500]
      tokenStyles.color = '#fff'
      tokenStyles.boxShadow = designTokens.effects.shadows.sm
    } else if (variant === 'outline') {
      tokenStyles.borderColor = designTokens.colors.neutral[300]
      tokenStyles.color = designTokens.colors.neutral[700]
    } else if (variant === 'ghost') {
      tokenStyles.color = designTokens.colors.neutral[700]
    } else if (variant === 'link') {
      tokenStyles.color = designTokens.colors.primary[500]
      tokenStyles.backgroundColor = 'transparent'
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{ ...tokenStyles, ...style }}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
