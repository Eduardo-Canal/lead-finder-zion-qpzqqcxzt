import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersTab } from '@/components/user-management/UsersTab'
import { ProfilesTab } from '@/components/user-management/ProfilesTab'
import useAuthStore from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Upload, Loader2 } from 'lucide-react'

export default function UserManagement() {
  const { hasPermission } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [publishOpen, setPublishOpen] = useState(false)
  const [featureName, setFeatureName] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  const handleConfirmPublish = async () => {
    if (!featureName || !moduleName || !description) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos para registrar a documentação.',
        variant: 'destructive',
      })
      return
    }

    setIsPublishing(true)
    try {
      const { error } = await supabase.functions.invoke('register-aspec-feature', {
        body: { featureName, moduleName, description },
      })

      if (error) throw error

      toast({ title: 'Sucesso', description: 'Documentação ASPEC atualizada automaticamente.' })
      setPublishOpen(false)
      setFeatureName('')
      setModuleName('')
      setDescription('')

      // Navegar e recarregar a página de documentação
      navigate('/documentacao')
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao registrar documentação',
        variant: 'destructive',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSkipPublish = () => {
    toast({ title: 'Publicado', description: 'Publicação concluída sem notas de atualização.' })
    setPublishOpen(false)
  }

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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Gestão de Usuários</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários do sistema, seus status e configure os perfis de acesso.
          </p>
        </div>

        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Upload className="w-4 h-4" />
              Publicar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Publicar Nova Versão</DialogTitle>
              <DialogDescription>
                Registre os detalhes da nova funcionalidade para atualizar a Documentação ASPEC
                automaticamente, ou pule para publicar sem notas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="featureName">Nome da Funcionalidade</Label>
                <Input
                  id="featureName"
                  placeholder="Ex: Nova Busca Avançada"
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moduleName">Módulo</Label>
                <Select value={moduleName} onValueChange={setModuleName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospecting">Prospecting</SelectItem>
                    <SelectItem value="governance">Governance</SelectItem>
                    <SelectItem value="lead-management">Lead Management</SelectItem>
                    <SelectItem value="inteligencia-zion">Inteligência Zion</SelectItem>
                    <SelectItem value="performance-dashboard">Performance Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição Breve</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o que mudou ou foi adicionado..."
                  className="min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleSkipPublish} disabled={isPublishing}>
                Pular
              </Button>
              <Button onClick={handleConfirmPublish} disabled={isPublishing}>
                {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
