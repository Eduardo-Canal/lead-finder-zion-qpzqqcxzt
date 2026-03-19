import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import useAuthStore from '@/stores/useAuthStore'
import { Loader2, Settings } from 'lucide-react'

export default function ConfiguracoesAvancadas() {
  const { user } = useAuthStore()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.perfis_acesso?.nome === 'Administrador'

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes_sistema')
          .select('casadosdados_api_token')
          .eq('id', 1)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar configurações:', error)
        }

        if (data) {
          setToken(data.casadosdados_api_token || '')
        }
      } catch (err) {
        console.error('Erro inesperado:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin) {
      fetchConfig()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .update({ casadosdados_api_token: token || null })
        .eq('id', 1)

      if (error) throw error

      toast.success('Configurações salvas com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao salvar configurações. Verifique suas permissões.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar as Configurações Avançadas.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configurações Avançadas</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie integrações e parâmetros avançados do sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integração API Casa dos Dados
          </CardTitle>
          <CardDescription>
            Configure o token de acesso para os serviços de busca e enriquecimento de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-token">Token API Casa dos Dados</Label>
                <Input
                  id="api-token"
                  type="password"
                  placeholder="Insira o token da API..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
