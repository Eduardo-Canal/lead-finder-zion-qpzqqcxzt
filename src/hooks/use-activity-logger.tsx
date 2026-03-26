import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'

export function useActivityLogger() {
  const { user } = useAuthStore()

  const logAction = useCallback(
    async (acao: string, tabela_acessada: string, dados_acessados?: any) => {
      if (!user) return

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) return

      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      }

      try {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-user-activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            event_type: 'action',
            user_id: user.user_id,
            session_token: token,
            device_info: deviceInfo,
            action_details: {
              acao,
              tabela_acessada,
              dados_acessados,
            },
          }),
        }).catch(console.error)
      } catch (e) {
        console.error('Failed to log activity', e)
      }
    },
    [user],
  )

  return { logAction }
}

export function ActivityMonitor() {
  const { logAction } = useActivityLogger()
  const location = useLocation()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user && location.pathname) {
      logAction('view', location.pathname, { path: location.pathname })
    }
  }, [location.pathname, user, logAction])

  return null
}
