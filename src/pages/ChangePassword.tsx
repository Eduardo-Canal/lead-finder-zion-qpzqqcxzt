import { useState } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { KeyRound, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuthStore()

  const validations = [
    { label: 'Pelo menos 8 caracteres', test: (p: string) => p.length >= 8 },
    { label: 'Pelo menos 1 letra maiúscula', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Pelo menos 1 número', test: (p: string) => /[0-9]/.test(p) },
    {
      label: 'Pelo menos 1 caractere especial',
      test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(p),
    },
  ]

  const isValid =
    validations.every((v) => v.test(newPassword)) &&
    newPassword === confirmPassword &&
    newPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmação não coincidem.')
      return
    }

    if (!isValid) {
      toast.error('A nova senha não atende a todos os requisitos de segurança.')
      return
    }

    setLoading(true)
    try {
      const { error } = await updatePassword(currentPassword, newPassword)
      if (error) throw error

      toast.success('Senha atualizada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0066CC] flex items-center gap-2">
          <KeyRound className="h-6 w-6" />
          Alterar Senha
        </h2>
        <p className="text-muted-foreground mt-1">
          Gerencie as credenciais de acesso da sua conta com segurança.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atualização de Segurança</CardTitle>
          <CardDescription>
            Por motivos de segurança, pedimos que você informe sua senha atual para definir uma
            nova.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmação da Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Requisitos da nova senha:</h4>
              <ul className="space-y-2">
                {validations.map((v, i) => {
                  const pass = v.test(newPassword)
                  return (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      {pass ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/50" />
                      )}
                      <span className={cn(pass ? 'text-slate-700' : 'text-muted-foreground')}>
                        {v.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading || !isValid || !currentPassword}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Atualizar Senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
