import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react'
import useAuthStore from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase/client'
import { createClient } from '@supabase/supabase-js'

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
  toggleUserStatus: (id: string) => Promise<void>
  updateUser: (id: string, data: Partial<ProfileTable>) => Promise<void>
  createProfile: (nome: string, permissoes: Permission[]) => Promise<void>
  createUser: (data: any) => Promise<void>
}

const UserManagementContext = createContext<UserManagementStoreContextType | null>(null)

export function UserManagementStoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ProfileTable[]>([])
  const [profiles, setProfiles] = useState<PerfilTable[]>([])
  const { user } = useAuthStore()

  const fetchData = useCallback(async () => {
    const { data: pData } = await supabase.from('profiles').select('*')
    const { data: pfData } = await supabase.from('perfis_acesso').select('*')

    if (pData) setUsers(pData)
    if (pfData) setProfiles(pfData)
  }, [])

  useEffect(() => {
    if (user) fetchData()
  }, [user, fetchData])

  const toggleUserStatus = async (id: string) => {
    const u = users.find((x) => x.id === id)
    if (u) {
      await supabase.from('profiles').update({ ativo: !u.ativo }).eq('id', id)
      await fetchData()
    }
  }

  const updateUser = async (id: string, data: Partial<ProfileTable>) => {
    await supabase.from('profiles').update(data).eq('id', id)
    await fetchData()
  }

  const createProfile = async (nome: string, permissoes: Permission[]) => {
    await supabase.from('perfis_acesso').insert({ nome, permissoes })
    await fetchData()
  }

  const createUser = async (data: any) => {
    // Uses a secondary client to sign up the new user without affecting the current admin's session
    const secondaryClient = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
      { auth: { storageKey: 'temp-auth-admin', persistSession: false } },
    )

    const { data: authData, error: authError } = await secondaryClient.auth.signUp({
      email: data.email,
      password: data.senha,
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Erro ao criar usuário na autenticação')

    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: authData.user.id,
      nome: data.nome,
      email: data.email,
      perfil_id: data.perfil_id,
      ativo: data.ativo,
    })

    if (profileError) throw new Error(profileError.message)

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
        createUser,
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
