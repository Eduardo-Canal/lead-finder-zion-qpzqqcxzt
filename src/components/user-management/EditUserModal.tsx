import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useUserManagementStore from '@/stores/useUserManagementStore'
import { toast } from 'sonner'

interface EditUserModalProps {
  userId: string
  onClose: () => void
}

export function EditUserModal({ userId, onClose }: EditUserModalProps) {
  const { users, profiles, updateUser } = useUserManagementStore()
  const user = users.find((u) => u.id === userId)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [perfilId, setPerfilId] = useState('')
  const [requirePasswordUpdate, setRequirePasswordUpdate] = useState(false)

  useEffect(() => {
    if (user) {
      setNome(user.nome)
      setEmail(user.email)
      setPerfilId(user.perfil_id)
      setRequirePasswordUpdate(user.require_password_update || false)
    }
  }, [user])

  const handleSave = () => {
    if (!user) return
    if (!nome.trim() || !email.trim() || !perfilId) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }

    updateUser(userId, {
      nome,
      email,
      perfil_id: perfilId,
      require_password_update: requirePasswordUpdate,
    })
    toast.success('Usuário atualizado com sucesso!')
    onClose()
  }

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Perfil atribuído</Label>
            <Select value={perfilId} onValueChange={setPerfilId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-slate-50 mt-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Exigir troca de senha</Label>
              <div className="text-[0.8rem] text-muted-foreground">
                Força atualização da senha no próximo login
              </div>
            </div>
            <Switch checked={requirePasswordUpdate} onCheckedChange={setRequirePasswordUpdate} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
