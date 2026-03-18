import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import MyLeads from '@/pages/MyLeads'
import UserManagement from '@/pages/UserManagement'
import NotFound from '@/pages/NotFound'
import { AuthProvider } from '@/stores/useAuthStore'
import { LeadStoreProvider } from '@/stores/useLeadStore'
import { MyLeadsStoreProvider } from '@/stores/useMyLeadsStore'
import { UserManagementStoreProvider } from '@/stores/useUserManagementStore'

const App = () => (
  <AuthProvider>
    <LeadStoreProvider>
      <MyLeadsStoreProvider>
        <UserManagementStoreProvider>
          <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/meus-leads" element={<MyLeads />} />
                  <Route path="/gestao-usuarios" element={<UserManagement />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </BrowserRouter>
        </UserManagementStoreProvider>
      </MyLeadsStoreProvider>
    </LeadStoreProvider>
  </AuthProvider>
)

export default App
