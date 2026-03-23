import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'
import { designTokens } from '@/constants/designTokens'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg font-sans',
          description: 'group-[.toast]:text-slate-500',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success: '!bg-emerald-50 !text-emerald-800 !border-emerald-200',
          error: '!bg-rose-50 !text-rose-800 !border-rose-200',
          warning: '!bg-amber-50 !text-amber-800 !border-amber-200',
          info: '!bg-blue-50 !text-blue-800 !border-blue-200',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
