import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import useUserManagementStore from '@/stores/useUserManagementStore'
import { toast } from 'sonner'

const formSchema = z.object({
  nome: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  perfil_id: z.string().min(1, 'Selecione um perfil'),
  ativo: z.boolean().default(true),
  require_password_update: z.boolean().default(true),
  bitrix_user_id: z.string().optional(),
  celular_corporativo: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
  const { profiles, createUser } = useUserManagementStore()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      perfil_id: '',
      ativo: true,
      require_password_update: true,
      bitrix_user_id: '',
      celular_corporativo: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await createUser(values)
      toast.success('Usuário criado com sucesso!')
      form.reset()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar usuário')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) form.reset()
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Incluir Usuário</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="perfil_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="bitrix_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID no Bitrix24</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 42" className="font-mono" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="celular_corporativo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular Corporativo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 11999990000" className="font-mono" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Opcionais — usados para pré-preencher instâncias WhatsApp de executivos.
            </p>

            <div className="space-y-3 pt-2">
              <FormField
                control={form.control}
                name="require_password_update"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-slate-50">
                    <div className="space-y-0.5">
                      <FormLabel>Exigir troca de senha</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        Força atualização da senha no próximo login
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Status</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        Definir conta como ativa
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
