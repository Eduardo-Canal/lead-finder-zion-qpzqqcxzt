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
import useUserManagementStore from '@/stores/useUserManagementStore'
import { EditUserModal } from './EditUserModal'
import { toast } from 'sonner'

export function UsersTab() {
  const { users, profiles, toggleUserStatus } = useUserManagementStore()
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  const handleToggleStatus = (id: string, currentStatus: string) => {
    toggleUserStatus(id)
    const newStatus = currentStatus === 'Ativo' ? 'desativado' : 'ativado'
    toast.success(`Usuário ${newStatus} com sucesso.`)
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden animate-fade-in shadow-sm">
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
            const profile = profiles.find((p) => p.id === u.profileId)
            const isActive = u.status === 'Ativo'

            return (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50">
                    {profile?.name || 'Sem perfil'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={isActive ? 'default' : 'secondary'}
                    className={isActive ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                  >
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingUserId(u.id)}>
                    Editar
                  </Button>
                  <Button
                    variant={isActive ? 'destructive' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggleStatus(u.id, u.status)}
                  >
                    {isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {editingUserId && (
        <EditUserModal userId={editingUserId} onClose={() => setEditingUserId(null)} />
      )}
    </div>
  )
}
