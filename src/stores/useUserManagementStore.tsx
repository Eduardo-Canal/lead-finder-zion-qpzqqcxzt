import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react'
import { mockDb, generateId } from '@/lib/db'
import useAuthStore from '@/stores/useAuthStore'

export const PERMISSIONS_LIST = [
  'Buscar Leads',
  'Salvar Leads',
  'Marcar Contato',
  'Editar Status de Contato',
  'Exportar Lista',
  'Acessar Admin',
] as const

export type Permission = (typeof PERMISSIONS_LIST)[number]

export type ProfileTable = {
  id: string
  user_id: string
  nome: string
  email: string
  perfil_id: string
  ativo: boolean
}

export type PerfilTable = {
  id: string
  nome: string
  permissoes: Permission[]
}

type UserManagementStoreContextType = {
  users: ProfileTable[]
  profiles: PerfilTable[]
  toggleUserStatus: (id: string) => void
  updateUser: (id: string, data: Partial<ProfileTable>) => void
  createProfile: (nome: string, permissoes: Permission[]) => void
}

const UserManagementContext = createContext<UserManagementStoreContextType | null>(null)

export function UserManagementStoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ProfileTable[]>([])
  const [profiles, setProfiles] = useState<PerfilTable[]>([])
  const { user } = useAuthStore()

  const fetchData = useCallback(async () => {
    const u = await mockDb.getTable('profiles')
    const p = await mockDb.getTable('perfis_acesso')
    setUsers(u)
    setProfiles(p)
  }, [])

  useEffect(() => {
    if (user) fetchData()
  }, [user, fetchData])

  const toggleUserStatus = async (id: string) => {
    const u = users.find((x) => x.id === id)
    if (u) {
      await mockDb.update('profiles', id, { ativo: !u.ativo })
      await fetchData()
    }
  }

  const updateUser = async (id: string, data: Partial<ProfileTable>) => {
    await mockDb.update('profiles', id, data)
    await fetchData()
  }

  const createProfile = async (nome: string, permissoes: Permission[]) => {
    await mockDb.insert('perfis_acesso', {
      id: `p_${generateId()}`,
      nome,
      permissoes,
    })
    await fetchData()
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
