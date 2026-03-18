import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersTab } from '@/components/user-management/UsersTab'
import { ProfilesTab } from '@/components/user-management/ProfilesTab'
import useAuthStore from '@/stores/useAuthStore'

export default function UserManagement() {
  const { hasPermission } = useAuthStore()

  if (!hasPermission('Acessar Admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar a Gestão de Usuários.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Gestão de Usuários</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie os usuários do sistema, seus status e configure os perfis de acesso.
        </p>
      </div>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="perfis">Perfis de Acesso</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="outline-none">
          <UsersTab />
        </TabsContent>
        <TabsContent value="perfis" className="outline-none">
          <ProfilesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
