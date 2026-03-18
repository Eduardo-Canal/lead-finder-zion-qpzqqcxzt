import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export type AuthUser = {
  id: string
  user_id: string
  nome: string
  email: string
  perfil_id: string
  ativo: boolean
  perfil_acesso: {
    nome: string
    permissoes: string[]
  }
}

type AuthStoreContextType = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, pass: string) => Promise<{ error: any }>
  logout: () => Promise<void>
  hasPermission: (perm: string) => boolean
}

const AuthContext = createContext<AuthStoreContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async (session: any) => {
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, perfil_acesso(*)')
        .eq('user_id', session.user.id)
        .single()

      if (profile && profile.ativo) {
        setUser(profile as any)
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      } else if (session) {
        fetchProfile(session)
      } else {
        setLoading(false)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    return { error }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const hasPermission = (perm: string) => {
    return user?.perfil_acesso?.permissoes?.includes(perm) || false
  }

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        loading,
        login,
        logout,
        hasPermission,
      },
    },
    children,
  )
}

export default function useAuthStore() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthStore must be used within an AuthProvider')
  return context
}
