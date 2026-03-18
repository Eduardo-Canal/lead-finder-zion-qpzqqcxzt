import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/AppSidebar'
import { User } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'

export default function Layout() {
  const { user } = useAuthStore()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background min-h-screen flex flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary hover:bg-accent/10 hover:text-accent" />
            <h1 className="font-bold text-xl text-primary tracking-tight hidden sm:block">
              Lead Finder Zion
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-slate-100 py-1.5 px-3 rounded-full">
            <User className="h-4 w-4 text-accent" />
            <span>{user?.name || 'Visitante'}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
