import React, { createContext, useContext, useState, ReactNode } from 'react'

export type UserRole = 'Admin' | 'User'

export type AuthUser = {
  name: string
  role: UserRole
}

type AuthStoreContextType = {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthStoreContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>({
    name: 'Executivo Zion',
    role: 'Admin', // Mocking an admin user by default for the story
  })

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        setUser,
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
