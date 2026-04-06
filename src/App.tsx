import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'

import useAuthStore, { AuthProvider } from '@/stores/useAuthStore'
import { LeadStoreProvider } from '@/stores/useLeadStore'
import { UserManagementStoreProvider } from '@/stores/useUserManagementStore'
import { NotificationStoreProvider } from '@/stores/useNotificationStore'
import { ActivityMonitor } from '@/hooks/use-activity-logger'

// Helper for auto-reloading when a chunk fails to load (e.g. after a new deploy)
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false',
    )

    try {
      const component = await componentImport()
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false')
      return component
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true')
        window.location.reload()
      }
      throw error
    }
  })

const Layout = lazyWithRetry(() => import('@/components/Layout'))
const Login = lazyWithRetry(() => import('@/pages/Login'))
const Index = lazyWithRetry(() => import('@/pages/Index'))
const Prospeccao = lazyWithRetry(() => import('@/pages/Prospeccao'))
const MyLeads = lazyWithRetry(() => import('@/pages/MyLeads'))
const SearchHistory = lazyWithRetry(() => import('@/pages/SearchHistory'))
const UserManagement = lazyWithRetry(() => import('@/pages/UserManagement'))
const ConfiguracoesAvancadas = lazyWithRetry(() => import('@/pages/ConfiguracoesAvancadas'))
const RemindersConfig = lazyWithRetry(() => import('@/pages/RemindersConfig'))
const AuditLogs = lazyWithRetry(() => import('@/pages/AuditLogs'))
const Reports = lazyWithRetry(() => import('@/pages/Reports'))
const DebugAPI = lazyWithRetry(() => import('@/pages/DebugAPI'))
const DebugBitrix = lazyWithRetry(() => import('@/pages/DebugBitrix'))
const MonitoramentoBitrix = lazyWithRetry(() => import('@/pages/MonitoramentoBitrix'))
const TestesValidacao = lazyWithRetry(() => import('@/pages/TestesValidacao'))
const EmpresasDuplicadas = lazyWithRetry(() => import('@/pages/EmpresasDuplicadas'))
const InteligenciaZion = lazyWithRetry(() => import('@/pages/InteligenciaZion'))
const AnaliseCarteira = lazyWithRetry(() => import('@/pages/AnaliseCarteira'))
const CnaeDetails = lazyWithRetry(() => import('@/pages/CnaeDetails'))
const NotFound = lazyWithRetry(() => import('@/pages/NotFound'))
const UpdatePassword = lazyWithRetry(() => import('@/pages/UpdatePassword'))
const ChangePassword = lazyWithRetry(() => import('@/pages/ChangePassword'))
const ConfiguracoesBitrix = lazyWithRetry(() => import('@/pages/ConfiguracoesBitrix'))
const SyncHistory = lazyWithRetry(() => import('@/pages/SyncHistory'))
const Integracoes = lazyWithRetry(() => import('@/pages/Integracoes'))
const Documentation = lazyWithRetry(() => import('@/pages/Documentation'))
const TechnicalSpecs = lazyWithRetry(() => import('@/pages/TechnicalSpecs'))

const GlobalLoading = () => (
  <div className="flex min-h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando...</p>
    </div>
  </div>
)

const ProtectedRoute = ({
  children,
  isPasswordReset = false,
}: {
  children: React.ReactNode
  isPasswordReset?: boolean
}) => {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) return <GlobalLoading />

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (user.require_password_update && !isPasswordReset) {
    return <Navigate to="/atualizar-senha" replace />
  }

  if (!user.require_password_update && isPasswordReset) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const App = () => (
  <AuthProvider>
    <NotificationStoreProvider>
      <LeadStoreProvider>
        <UserManagementStoreProvider>
          <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
            <ActivityMonitor />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<GlobalLoading />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/atualizar-senha"
                    element={
                      <ProtectedRoute isPasswordReset>
                        <UpdatePassword />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/" element={<Index />} />
                    <Route path="/inteligencia-zion" element={<InteligenciaZion />} />
                    <Route path="/cnae/:cnae_code" element={<CnaeDetails />} />
                    <Route path="/analise-carteira" element={<AnaliseCarteira />} />
                    <Route path="/prospeccao" element={<Prospeccao />} />
                    <Route path="/meus-leads" element={<MyLeads />} />
                    <Route path="/meu-historico" element={<SearchHistory />} />
                    <Route path="/documentacao" element={<Documentation />} />
                    <Route path="/gestao-usuarios" element={<UserManagement />} />
                    <Route path="/perfil/alterar-senha" element={<ChangePassword />} />
                    <Route path="/configuracoes/lembretes" element={<RemindersConfig />} />
                    <Route
                      path="/configuracoes/historico-sincronizacao"
                      element={<SyncHistory />}
                    />
                    <Route path="/configuracoes/auditoria" element={<AuditLogs />} />
                    <Route path="/configuracoes/relatorios" element={<Reports />} />
                    <Route path="/configuracoes/avancado" element={<ConfiguracoesAvancadas />} />
                    <Route path="/configuracoes/bitrix24" element={<ConfiguracoesBitrix />} />
                    <Route path="/configuracoes/integracoes" element={<Integracoes />} />
                    <Route
                      path="/configuracoes/especificacoes-tecnicas"
                      element={<TechnicalSpecs />}
                    />
                    <Route
                      path="/configuracoes/empresas-duplicadas"
                      element={<EmpresasDuplicadas />}
                    />
                    <Route path="/admin/debug-api" element={<DebugAPI />} />
                    <Route path="/admin/debug-bitrix" element={<DebugBitrix />} />
                    <Route path="/admin/monitoramento-bitrix" element={<MonitoramentoBitrix />} />
                    <Route path="/admin/testes-validacao" element={<TestesValidacao />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </TooltipProvider>
          </BrowserRouter>
        </UserManagementStoreProvider>
      </LeadStoreProvider>
    </NotificationStoreProvider>
  </AuthProvider>
)

export default App
