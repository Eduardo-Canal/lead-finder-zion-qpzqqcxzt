import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import useUserManagementStore, {
  Permission,
  PERMISSIONS_LIST,
} from '@/stores/useUserManagementStore'
import { toast } from 'sonner'
import { Users, Shield } from 'lucide-react'

export function ProfilesTab() {
  const { profiles, users, createProfile } = useUserManagementStore()
  const [nome, setNome] = useState('')
  const [perms, setPerms] = useState<Permission[]>([])

  const handleToggle = (p: Permission) => {
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const handleSave = () => {
    if (!nome.trim()) {
      return toast.error('O nome do perfil é obrigatório')
    }
    if (perms.length === 0) {
      return toast.error('Selecione ao menos uma permissão para o perfil.')
    }

    createProfile(nome.trim(), perms)
    setNome('')
    setPerms([])
    toast.success('Perfil criado com sucesso!')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="md:col-span-1 space-y-4">
        <h3 className="text-lg font-medium tracking-tight">Perfis Existentes</h3>
        {profiles.map((p) => {
          const userCount = users.filter((u) => u.perfil_id === p.id).length

          return (
            <Card key={p.id} className="shadow-sm transition-all hover:shadow-md">
              <CardHeader className="p-4">
                <CardTitle className="text-base text-primary mb-1">{p.nome}</CardTitle>
                <CardDescription className="flex flex-col gap-1.5 mt-2">
                  <span className="flex items-center text-slate-700 bg-slate-100 w-max px-2 py-0.5 rounded-full text-xs font-medium">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    {userCount} {userCount === 1 ? 'usuário vinculado' : 'usuários vinculados'}
                  </span>
                  <span className="flex items-center text-muted-foreground text-xs mt-1">
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    {p.permissoes?.length || 0}{' '}
                    {p.permissoes?.length === 1 ? 'permissão ativa' : 'permissões ativas'}
                  </span>
                </CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <div className="md:col-span-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Criar Perfil</CardTitle>
            <CardDescription>
              Configure um novo nível de acesso selecionando as permissões desejadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profileName">Nome do Perfil</Label>
              <Input
                id="profileName"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Analista de Vendas"
              />
            </div>
            <div className="space-y-3">
              <Label>Permissões do Sistema</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-md p-4 bg-slate-50">
                {PERMISSIONS_LIST.map((p) => (
                  <div key={p} className="flex items-start space-x-3">
                    <Checkbox
                      id={`perm-${p}`}
                      checked={perms.includes(p)}
                      onCheckedChange={() => handleToggle(p)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={`perm-${p}`}
                      className="cursor-pointer font-normal text-sm leading-tight"
                    >
                      {p}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              Criar Perfil de Acesso
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
