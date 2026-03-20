import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ShieldAlert } from 'lucide-react'

export default function UpdatePassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const { forceUpdatePassword, user } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('As senhas não coincidem.')
    if (password.length < 6) return toast.error('A senha deve ter pelo menos 6 caracteres.')

    setLoading(true)
    try {
      const { error } = await forceUpdatePassword(password)
      if (error) throw error
      toast.success('Senha atualizada com sucesso!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border p-8 animate-fade-in-up">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-amber-100 p-3 rounded-full mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Atualização Obrigatória
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Olá {user?.nome}, para garantir a segurança do seu acesso, por favor defina uma nova
            senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar Nova Senha</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar e Acessar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
