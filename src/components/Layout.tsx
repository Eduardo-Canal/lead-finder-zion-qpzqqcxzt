import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/AppSidebar'
import { User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/useAuthStore'

export default function Layout() {
  const { user, logout } = useAuthStore()

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-background': '210 100% 40%', // Zion Blue #0066CC
          '--sidebar-foreground': '0 0% 100%', // White text
          '--sidebar-primary': '210 100% 50%', // Lighter blue for active items
          '--sidebar-primary-foreground': '0 0% 100%',
          '--sidebar-accent': '210 100% 32%', // Darker blue for hover states
          '--sidebar-accent-foreground': '0 0% 100%',
          '--sidebar-border': '210 100% 35%', // Subtle border
          '--sidebar-ring': '45 93% 47%', // Zion Orange/Yellow for focus ring (#F59E0B)
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="bg-background min-h-screen flex flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-[#0066CC] hover:bg-[#0066CC]/10 hover:text-[#0066CC]" />
            <h1 className="font-bold text-xl text-[#0066CC] tracking-tight hidden sm:block">
              Lead Finder Zion
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-slate-100 py-1.5 px-3 rounded-full">
              <User className="h-4 w-4 text-[#0066CC]" />
              <span>{user?.nome || 'Visitante'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden bg-[#F8FAFC]">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
