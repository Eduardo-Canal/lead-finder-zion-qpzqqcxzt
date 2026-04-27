import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ContaAzulCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(`Conta Azul retornou erro: ${error}`)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('Código de autorização não encontrado na URL.')
      return
    }

    const exchangeCode = async () => {
      try {
        const redirectUri = `${window.location.origin}/oauth/conta-azul/callback`

        const { data, error: fnError } = await supabase.functions.invoke('auth-contaazul', {
          body: { action: 'getTokens', code, redirectUri },
        })

        if (fnError) throw fnError
        if (!data?.success) throw new Error(data?.message || 'Erro ao obter tokens')

        setStatus('success')
        setMessage('Conta Azul conectado com sucesso! Agora você pode sincronizar o MRR.')
      } catch (err: any) {
        setStatus('error')
        setMessage(err.message || 'Falha ao trocar o código de autorização.')
      }
    }

    exchangeCode()
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 rounded-xl border bg-card p-8 shadow-lg text-center space-y-6">
        <h1 className="text-xl font-semibold">Conectando Conta Azul</h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Trocando código de autorização...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="text-emerald-700 font-medium">{message}</p>
            <Button onClick={() => navigate('/curva-abc')} className="mt-2">
              Ir para Curva ABC
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-12 h-12 text-destructive" />
            <p className="text-destructive">{message}</p>
            <Button variant="outline" onClick={() => navigate('/configuracoes/integracoes')}>
              Voltar às Configurações
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
