import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { designTokens } from '@/constants/designTokens'
import { toast as sonnerToast } from 'sonner'

export const notify = {
  success: (msg: string, description?: string) => sonnerToast.success(msg, { description }),
  error: (msg: string, description?: string) => sonnerToast.error(msg, { description }),
  warning: (msg: string, description?: string) => sonnerToast.warning(msg, { description }),
  info: (msg: string, description?: string) => sonnerToast.info(msg, { description }),
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}: ConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent
        className="w-[95vw] sm:max-w-lg"
        style={{
          fontFamily: designTokens.typography.fontFamily.sans,
          borderRadius: designTokens.effects.borderRadius.xl,
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: designTokens.colors.neutral[900] }}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: designTokens.colors.neutral[500] }}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            style={{ borderRadius: designTokens.effects.borderRadius.md }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
              onClose()
            }}
            className={
              isDestructive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
            style={{
              borderRadius: designTokens.effects.borderRadius.md,
              ...(isDestructive
                ? { backgroundColor: designTokens.colors.error[500] }
                : { backgroundColor: designTokens.colors.primary[500] }),
            }}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function InlineAlert({
  type = 'info',
  title,
  message,
  className,
}: {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  className?: string
}) {
  const icons = {
    success: (
      <CheckCircle2 className="h-5 w-5" style={{ color: designTokens.colors.success[600] }} />
    ),
    error: <XCircle className="h-5 w-5" style={{ color: designTokens.colors.error[600] }} />,
    warning: (
      <AlertTriangle className="h-5 w-5" style={{ color: designTokens.colors.warning[600] }} />
    ),
    info: <Info className="h-5 w-5" style={{ color: designTokens.colors.secondary[600] }} />,
  }

  const styles = {
    success: {
      backgroundColor: designTokens.colors.success[50],
      borderColor: designTokens.colors.success[200],
      color: designTokens.colors.success[800],
    },
    error: {
      backgroundColor: designTokens.colors.error[50],
      borderColor: designTokens.colors.error[200],
      color: designTokens.colors.error[800],
    },
    warning: {
      backgroundColor: designTokens.colors.warning[50],
      borderColor: designTokens.colors.warning[200],
      color: designTokens.colors.warning[800],
    },
    info: {
      backgroundColor: designTokens.colors.secondary[50],
      borderColor: designTokens.colors.secondary[200],
      color: designTokens.colors.secondary[800],
    },
  }

  return (
    <Alert
      className={cn(className)}
      style={{
        ...styles[type],
        fontFamily: designTokens.typography.fontFamily.sans,
        borderRadius: designTokens.effects.borderRadius.md,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{icons[type]}</div>
        <div>
          {title && (
            <AlertTitle className="mb-1 font-semibold leading-none tracking-tight">
              {title}
            </AlertTitle>
          )}
          <AlertDescription className="text-sm opacity-90">{message}</AlertDescription>
        </div>
      </div>
    </Alert>
  )
}
