import React, { createContext, useContext, useState, ReactNode } from 'react'

export const PERMISSIONS_LIST = [
  'Buscar Leads',
  'Salvar Leads',
  'Marcar Contato',
  'Editar Status de Contato',
  'Exportar Lista',
  'Acessar Admin',
] as const

export type Permission = (typeof PERMISSIONS_LIST)[number]

export type Profile = {
  id: string
  name: string
  permissions: Permission[]
}

export type User = {
  id: string
  name: string
  email: string
  profileId: string
  status: 'Ativo' | 'Inativo'
}

const mockProfiles: Profile[] = [
  { id: 'p1', name: 'Administrador', permissions: [...PERMISSIONS_LIST] },
  { id: 'p2', name: 'Visualizador', permissions: ['Buscar Leads'] },
]

const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'João Silva',
    email: 'joao.silva@zion.com',
    profileId: 'p1',
    status: 'Ativo',
  },
  {
    id: 'u2',
    name: 'Maria Santos',
    email: 'maria.santos@zion.com',
    profileId: 'p2',
    status: 'Ativo',
  },
  {
    id: 'u3',
    name: 'Pedro Costa',
    email: 'pedro.costa@zion.com',
    profileId: 'p2',
    status: 'Inativo',
  },
]

type UserManagementStoreContextType = {
  users: User[]
  profiles: Profile[]
  toggleUserStatus: (id: string) => void
  updateUser: (id: string, data: Partial<User>) => void
  createProfile: (name: string, permissions: Permission[]) => void
}

const UserManagementContext = createContext<UserManagementStoreContextType | null>(null)

export function UserManagementStoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles)

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) return { ...u, status: u.status === 'Ativo' ? 'Inativo' : 'Ativo' }
        return u
      }),
    )
  }

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))
  }

  const createProfile = (name: string, permissions: Permission[]) => {
    setProfiles((prev) => [...prev, { id: `p${Date.now()}`, name, permissions }])
  }

  return React.createElement(
    UserManagementContext.Provider,
    {
      value: {
        users,
        profiles,
        toggleUserStatus,
        updateUser,
        createProfile,
      },
    },
    children,
  )
}

export default function useUserManagementStore() {
  const context = useContext(UserManagementContext)
  if (!context) throw new Error('useUserManagementStore must be used within Provider')
  return context
}
