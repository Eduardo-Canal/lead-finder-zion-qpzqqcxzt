import { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Index from '@/pages/Index'
import Prospeccao from '@/pages/Prospeccao'
import MyLeads from '@/pages/MyLeads'
import SearchHistory from '@/pages/SearchHistory'
import UserManagement from '@/pages/UserManagement'
import ConfiguracoesAvancadas from '@/pages/ConfiguracoesAvancadas'
import RemindersConfig from '@/pages/RemindersConfig'
import AuditLogs from '@/pages/AuditLogs'
import DebugAPI from '@/pages/DebugAPI'
import DebugBitrix from '@/pages/DebugBitrix'
import MonitoramentoBitrix from '@/pages/MonitoramentoBitrix'
import InteligenciaZion from '@/pages/InteligenciaZion'
import NotFound from '@/pages/NotFound'
import UpdatePassword from '@/pages/UpdatePassword'
import useAuthStore, { AuthProvider } from '@/stores/useAuthStore'
import { LeadStoreProvider } from '@/stores/useLeadStore'
import { MyLeadsStoreProvider } from '@/stores/useMyLeadsStore'
import { UserManagementStoreProvider } from '@/stores/useUserManagementStore'
import { NotificationStoreProvider } from '@/stores/useNotificationStore'

const ProtectedRoute = ({
  children,
  isPasswordReset = false,
}: {
  children: ReactNode
  isPasswordReset?: boolean
}) => {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    )

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
        <MyLeadsStoreProvider>
          <UserManagementStoreProvider>
            <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
              <TooltipProvider>
                <Toaster />
                <Sonner />
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
                    <Route path="/configuracoes/lembretes" element={<RemindersConfig />} />
                    <Route path="/configuracoes/auditoria" element={<AuditLogs />} />
                    <Route path="/configuracoes/avancado" element={<ConfiguracoesAvancadas />} />
                    <Route path="/admin/debug-api" element={<DebugAPI />} />
                    <Route path="/admin/debug-bitrix" element={<DebugBitrix />} />
                    <Route path="/admin/monitoramento-bitrix" element={<MonitoramentoBitrix />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </BrowserRouter>
          </UserManagementStoreProvider>
        </MyLeadsStoreProvider>
      </LeadStoreProvider>
    </NotificationStoreProvider>
  </AuthProvider>
)

export default App
