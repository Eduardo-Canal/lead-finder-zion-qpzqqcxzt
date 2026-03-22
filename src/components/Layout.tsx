import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/AppSidebar'
import { User, LogOut, Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HelpModal } from '@/components/HelpModal'
import useAuthStore from '@/stores/useAuthStore'
import useNotificationStore from '@/stores/useNotificationStore'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()

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
          <div className="flex items-center gap-2 sm:gap-4">
            <HelpModal />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-full h-9 w-9 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-white animate-in zoom-in"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50">
                  <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80 bg-transparent"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      Marcar lidas
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Você não tem novas notificações.
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.read && markAsRead(notif.id)}
                          className={cn(
                            'px-4 py-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-slate-50',
                            !notif.read ? 'bg-primary/5' : 'opacity-75',
                          )}
                        >
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <span
                              className={cn(
                                'text-sm font-semibold',
                                !notif.read ? 'text-foreground' : 'text-muted-foreground',
                              )}
                            >
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground/80 mt-2 block">
                            {new Date(notif.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-slate-100 py-1.5 px-3 rounded-full">
              <User className="h-4 w-4 text-[#0066CC]" />
              <span className="hidden sm:inline">{user?.nome || 'Visitante'}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors h-9 w-9 rounded-full sm:w-auto sm:px-3 sm:rounded-md"
              title="Sair"
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
