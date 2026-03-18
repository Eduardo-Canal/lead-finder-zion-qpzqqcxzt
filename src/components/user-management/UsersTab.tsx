import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import useUserManagementStore from '@/stores/useUserManagementStore'
import useAuthStore from '@/stores/useAuthStore'
import { EditUserModal } from './EditUserModal'
import { AddUserModal } from './AddUserModal'
import { toast } from 'sonner'

export function UsersTab() {
  const { users, profiles, toggleUserStatus } = useUserManagementStore()
  const { hasPermission } = useAuthStore()
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const isAdmin = hasPermission('Acessar Admin')

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleUserStatus(id)
    const newStatus = currentStatus ? 'desativado' : 'ativado'
    toast.success(`Usuário ${newStatus} com sucesso.`)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Incluir Usuário
          </Button>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil atribuído</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const profile = profiles.find((p) => p.id === u.perfil_id)
              const isActive = u.ativo

              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50">
                      {profile?.nome || 'Sem perfil'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className={isActive ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                    >
                      {isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingUserId(u.id)}>
                      Editar
                    </Button>
                    <Button
                      variant={isActive ? 'destructive' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggleStatus(u.id, u.ativo)}
                    >
                      {isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {editingUserId && (
        <EditUserModal userId={editingUserId} onClose={() => setEditingUserId(null)} />
      )}

      <AddUserModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </div>
  )
}
