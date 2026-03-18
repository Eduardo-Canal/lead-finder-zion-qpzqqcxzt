import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { mockDb } from '@/lib/db'

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
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  hasPermission: (perm: string) => boolean
}

const AuthContext = createContext<AuthStoreContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const sessionId = localStorage.getItem('zion_session')
      if (sessionId) {
        const profiles = await mockDb.getTable('profiles')
        const perfis = await mockDb.getTable('perfis_acesso')
        const profile = profiles.find((p: any) => p.user_id === sessionId)
        if (profile && profile.ativo) {
          const perfil = perfis.find((p: any) => p.id === profile.perfil_id)
          setUser({ ...profile, perfil_acesso: perfil })
        } else {
          localStorage.removeItem('zion_session')
        }
      }
      setLoading(false)
    }
    checkSession()
  }, [])

  const login = async (email: string, pass: string) => {
    const users = await mockDb.getTable('users')
    const u = users.find((u: any) => u.email === email && u.password === pass)
    if (!u) throw new Error('E-mail ou senha inválidos')

    const profiles = await mockDb.getTable('profiles')
    const profile = profiles.find((p: any) => p.user_id === u.id)
    if (!profile) throw new Error('Perfil de acesso não encontrado')
    if (!profile.ativo) throw new Error('Seu usuário está inativo')

    const perfis = await mockDb.getTable('perfis_acesso')
    const perfil = perfis.find((p: any) => p.id === profile.perfil_id)

    localStorage.setItem('zion_session', u.id)
    setUser({ ...profile, perfil_acesso: perfil })
  }

  const logout = () => {
    localStorage.removeItem('zion_session')
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
