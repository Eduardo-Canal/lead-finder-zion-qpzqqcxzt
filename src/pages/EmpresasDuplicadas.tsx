import { useEffect } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopySlash } from 'lucide-react'
import { PendingTab } from '@/components/duplicates/PendingTab'
import { HistoryTab } from '@/components/duplicates/HistoryTab'
import { PotentialTab } from '@/components/duplicates/PotentialTab'
import { designTokens } from '@/constants/designTokens'
import { cn } from '@/lib/utils'

export default function EmpresasDuplicadas() {
  const { user, hasPermission } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  useEffect(() => {
    if (isAdmin === false) {
      navigate('/')
    }
  }, [isAdmin, navigate])

  if (!isAdmin) return null

  return (
    <div className={cn(designTokens.layout.page, 'animate-fade-in')}>
      <div className="flex flex-col gap-2">
        <h2 className={cn(designTokens.typography.pageTitle, 'flex items-center gap-2')}>
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <CopySlash className="h-6 w-6" />
          </div>
          Empresas Duplicadas
        </h2>
        <p className={designTokens.typography.small}>
          Analise e mescle empresas com alto grau de similaridade detectadas pelo sistema de
          sincronização para manter a integridade da sua base de dados.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full space-y-6">
        <TabsList className="bg-slate-100/50 border flex-wrap h-auto w-fit max-w-full justify-start transition-all">
          <TabsTrigger value="pending">Pendentes de Revisão</TabsTrigger>
          <TabsTrigger value="potential">Varredura de Potenciais</TabsTrigger>
          <TabsTrigger value="history">Histórico de Merges</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-0 outline-none">
          <PendingTab />
        </TabsContent>
        <TabsContent value="potential" className="mt-0 outline-none">
          <PotentialTab />
        </TabsContent>
        <TabsContent value="history" className="mt-0 outline-none">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
