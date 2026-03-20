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
import useUserManagementStore, { ProfileTable } from '@/stores/useUserManagementStore'
import useAuthStore from '@/stores/useAuthStore'
import { EditUserModal } from './EditUserModal'
import { AddUserModal } from './AddUserModal'
import { toast } from 'sonner'

export function UsersTab() {
  const { users, profiles, toggleUserStatus, deleteUser } = useUserManagementStore()
  const { hasPermission, user: currentUser } = useAuthStore()
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const [userToDelete, setUserToDelete] = useState<ProfileTable | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAdmin = hasPermission('Acessar Admin')

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleUserStatus(id)
    const newStatus = currentStatus ? 'inativado' : 'ativado'
    toast.success(`Usuário ${newStatus} com sucesso.`)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      await deleteUser(userToDelete.id, userToDelete.user_id)
      toast.success('Usuário excluído permanentemente.')
      setUserToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir usuário.')
    } finally {
      setIsDeleting(false)
    }
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
              const isMe = u.id === currentUser?.id

              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.nome}
                    {isMe && (
                      <Badge variant="outline" className="ml-2 bg-slate-100 text-[10px]">
                        Você
                      </Badge>
                    )}
                  </TableCell>
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
                      variant={isActive ? 'secondary' : 'default'}
                      size="sm"
                      className={
                        isActive
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200'
                          : ''
                      }
                      onClick={() => handleToggleStatus(u.id, u.ativo)}
                    >
                      {isActive ? 'Inativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setUserToDelete(u)}
                      disabled={isMe}
                    >
                      Excluir
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

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.nome}</strong>? Esta
              ação é irreversível e removerá o acesso do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
