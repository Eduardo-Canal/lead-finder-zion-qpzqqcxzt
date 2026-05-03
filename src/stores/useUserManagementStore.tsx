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
  require_password_update: boolean
  bitrix_user_id: string | null
  celular_corporativo: string | null
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
  deleteUser: (id: string, user_id: string) => Promise<void>
}

const UserManagementContext = createContext<UserManagementStoreContextType | null>(null)

export function UserManagementStoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ProfileTable[]>([])
  const [profiles, setProfiles] = useState<PerfilTable[]>([])
  const { user } = useAuthStore()

  const fetchData = useCallback(async () => {
    const { data: pData } = await supabase.from('profiles').select('*')
    const { data: pfData } = await supabase.from('perfis_acesso').select('*')

    if (pData) setUsers(pData as any)
    if (pfData) setProfiles(pfData as any)
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

  const deleteUser = async (id: string, authUserId: string) => {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    if (!token) throw new Error('Não autenticado')

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: authUserId }),
    })

    if (res.ok) {
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      await fetchData()
      return
    } else {
      const errData = await res.json().catch(() => null)
      throw new Error(errData?.error || 'Erro desconhecido ao excluir usuário.')
    }
  }

  const createUser = async (data: any) => {
    // 1. Tentar criar o usuário pela Edge Function (evita limite de e-mail e bypassa confirmação)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (token) {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          },
        )

        if (res.ok) {
          const result = await res.json()
          if (result.error) throw new Error(result.error)
          await fetchData()
          return
        } else if (res.status !== 404) {
          // Se não retornou 404 (endpoint existe mas falhou), mostramos o erro
          const errData = await res.json().catch(() => null)
          let errorMsg = errData?.error || 'Erro desconhecido ao criar usuário.'
          if (
            errorMsg.includes('already been registered') ||
            errorMsg.includes('already registered')
          ) {
            errorMsg = 'Já existe um usuário cadastrado com este e-mail.'
          }
          throw new Error(errorMsg)
        }
      }
    } catch (e: any) {
      // Repassa os erros reais de validação para a UI, mascara problemas de conectividade no fallback
      if (
        e.message &&
        !e.message.includes('Failed to fetch') &&
        !e.message.includes('fetch is not defined')
      ) {
        throw e
      }
      console.warn(
        'Edge function admin-create-user indisponível ou inacessível. Tentando via Client Frontend...',
        e.message,
      )
    }

    // 2. Fallback: usar o client secundário + Retry Lógico e UX de Erro
    const secondaryClient = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
      { auth: { storageKey: 'temp-auth-admin', persistSession: false } },
    )

    let retryCount = 0
    const maxRetries = 2

    while (retryCount <= maxRetries) {
      try {
        const { data: authData, error: authError } = await secondaryClient.auth.signUp({
          email: data.email,
          password: data.senha,
        })

        if (authError) {
          if (authError.status === 429 || authError.message.includes('rate limit')) {
            throw new Error('RATE_LIMIT')
          }
          let errorMsg = authError.message
          if (
            errorMsg.includes('already been registered') ||
            errorMsg.includes('already registered')
          ) {
            errorMsg = 'Já existe um usuário cadastrado com este e-mail.'
          }
          throw new Error(errorMsg)
        }

        if (!authData.user) throw new Error('Erro ao criar usuário na autenticação')

        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: authData.user.id,
          nome: data.nome,
          email: data.email,
          perfil_id: data.perfil_id,
          ativo: data.ativo,
          require_password_update: data.require_password_update,
          bitrix_user_id: data.bitrix_user_id || null,
          celular_corporativo: data.celular_corporativo || null,
        })

        if (profileError) throw new Error(profileError.message)

        await fetchData()
        return
      } catch (error: any) {
        if (error.message === 'RATE_LIMIT') {
          retryCount++
          if (retryCount <= maxRetries) {
            // Delay progressivo antes da nova tentativa (backoff)
            await new Promise((res) => setTimeout(res, 1500 * retryCount))
            continue
          } else {
            throw new Error(
              'Limite de segurança de envio de e-mails atingido pela provedora de acesso. Aguarde alguns instantes antes de criar um novo usuário.',
            )
          }
        }
        throw error
      }
    }
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
        deleteUser,
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
