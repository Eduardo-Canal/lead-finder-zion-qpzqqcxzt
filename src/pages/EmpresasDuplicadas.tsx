import { useEffect } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopySlash } from 'lucide-react'
import { PendingTab } from '@/components/duplicates/PendingTab'
import { HistoryTab } from '@/components/duplicates/HistoryTab'
import { PotentialTab } from '@/components/duplicates/PotentialTab'
import { designTokens } from '@/constants/designTokens'

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
    <div className={designTokens.layout.page}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-accent flex items-center gap-2">
          <CopySlash className="h-6 w-6" />
          Empresas Duplicadas
        </h2>
        <p className={designTokens.typography.small}>
          Analise e mescle empresas com alto grau de similaridade detectadas pelo sistema de
          sincronização.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full space-y-6">
        <TabsList className="bg-slate-100/50 border flex-wrap h-auto w-fit max-w-full justify-start transition-all">
          <TabsTrigger value="pending">Pendentes de Revisão</TabsTrigger>
          <TabsTrigger value="potential">Empresas Duplicadas Potenciais</TabsTrigger>
          <TabsTrigger value="history">Histórico de Merges</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-0 animate-fade-in">
          <PendingTab />
        </TabsContent>
        <TabsContent value="potential" className="mt-0 animate-fade-in">
          <PotentialTab />
        </TabsContent>
        <TabsContent value="history" className="mt-0 animate-fade-in">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
