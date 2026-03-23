import { useEffect } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopySlash } from 'lucide-react'
import { PendingTab } from '@/components/duplicates/PendingTab'
import { HistoryTab } from '@/components/duplicates/HistoryTab'

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
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0066CC] flex items-center gap-2">
          <CopySlash className="h-6 w-6" />
          Empresas Duplicadas
        </h2>
        <p className="text-muted-foreground mt-1">
          Analise e mescle empresas com alto grau de similaridade detectadas pelo sistema de
          sincronização.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full space-y-6">
        <TabsList className="bg-slate-100/50 border">
          <TabsTrigger value="pending">Pendentes de Revisão</TabsTrigger>
          <TabsTrigger value="history">Histórico de Merges</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-0">
          <PendingTab />
        </TabsContent>
        <TabsContent value="history" className="mt-0">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
