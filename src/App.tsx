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

const Layout = lazy(() => import('@/components/Layout'))
const Login = lazy(() => import('@/pages/Login'))
const Index = lazy(() => import('@/pages/Index'))
const Prospeccao = lazy(() => import('@/pages/Prospeccao'))
const MyLeads = lazy(() => import('@/pages/MyLeads'))
const SearchHistory = lazy(() => import('@/pages/SearchHistory'))
const UserManagement = lazy(() => import('@/pages/UserManagement'))
const ConfiguracoesAvancadas = lazy(() => import('@/pages/ConfiguracoesAvancadas'))
const RemindersConfig = lazy(() => import('@/pages/RemindersConfig'))
const AuditLogs = lazy(() => import('@/pages/AuditLogs'))
const Reports = lazy(() => import('@/pages/Reports'))
const DebugAPI = lazy(() => import('@/pages/DebugAPI'))
const DebugBitrix = lazy(() => import('@/pages/DebugBitrix'))
const MonitoramentoBitrix = lazy(() => import('@/pages/MonitoramentoBitrix'))
const TestesValidacao = lazy(() => import('@/pages/TestesValidacao'))
const EmpresasDuplicadas = lazy(() => import('@/pages/EmpresasDuplicadas'))
const InteligenciaZion = lazy(() => import('@/pages/InteligenciaZion'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const UpdatePassword = lazy(() => import('@/pages/UpdatePassword'))
const ChangePassword = lazy(() => import('@/pages/ChangePassword'))

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
                    <Route path="/prospeccao" element={<Prospeccao />} />
                    <Route path="/meus-leads" element={<MyLeads />} />
                    <Route path="/meu-historico" element={<SearchHistory />} />
                    <Route path="/gestao-usuarios" element={<UserManagement />} />
                    <Route path="/perfil/alterar-senha" element={<ChangePassword />} />
                    <Route path="/configuracoes/lembretes" element={<RemindersConfig />} />
                    <Route path="/configuracoes/auditoria" element={<AuditLogs />} />
                    <Route path="/configuracoes/relatorios" element={<Reports />} />
                    <Route path="/configuracoes/avancado" element={<ConfiguracoesAvancadas />} />
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
