import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import useAuthStore from '@/stores/useAuthStore'
import { Loader2, Settings, Database, Trash2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ConfiguracoesAvancadas() {
  const { user } = useAuthStore()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [cnaeCache, setCnaeCache] = useState('')
  const [clearingCache, setClearingCache] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)

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

  const handleClearCache = async (all: boolean) => {
    if (!all && !cnaeCache.trim()) {
      toast.error('Por favor, informe um CNAE para limpar.')
      return
    }

    if (all) setClearingAll(true)
    else setClearingCache(true)

    try {
      const { data, error } = await supabase.rpc('limpar_cache_pesquisas', {
        p_cnae: all ? null : cnaeCache.trim(),
      })

      if (error) throw error

      const count = Number(data) || 0

      if (all) {
        toast.success(`Todo o cache foi limpo! (${count} registros removidos)`)
        setCnaeCache('')
      } else {
        toast.success(`Cache do CNAE ${cnaeCache} limpo! (${count} registros removidos)`)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao limpar cache. Verifique o console para mais detalhes.')
    } finally {
      setClearingAll(false)
      setClearingCache(false)
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
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configurações Avançadas</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie integrações, caches e parâmetros do sistema.
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
                Salvar Configurações
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="border-orange-200/50 dark:border-orange-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
            <Database className="h-5 w-5" />
            Gerenciamento de Cache
          </CardTitle>
          <CardDescription>
            Limpe os dados de pesquisas temporárias armazenados no banco para forçar a busca de
            informações atualizadas da API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-orange-50/50 text-orange-800 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/50">
            <AlertCircle className="h-4 w-4 !text-orange-600 dark:!text-orange-500" />
            <AlertDescription>
              A limpeza de cache pode aumentar o consumo da sua cota na API Casa dos Dados
              temporariamente.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
              <div>
                <Label className="text-base font-medium">Limpar por CNAE</Label>
                <p className="text-sm text-muted-foreground mb-3 mt-1">
                  Remove do cache apenas as pesquisas que incluam este CNAE.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 463100"
                  value={cnaeCache}
                  onChange={(e) => setCnaeCache(e.target.value)}
                  className="bg-background"
                />
                <Button
                  variant="outline"
                  onClick={() => handleClearCache(false)}
                  disabled={clearingCache || !cnaeCache.trim()}
                >
                  {clearingCache ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-lg bg-red-50/30 border-red-100 dark:bg-red-950/10 dark:border-red-900/30">
              <div>
                <Label className="text-base font-medium text-red-600 dark:text-red-500">
                  Limpeza Global
                </Label>
                <p className="text-sm text-muted-foreground mb-3 mt-1">
                  Remove todo o histórico de pesquisas temporárias do sistema.
                </p>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  if (confirm('Tem certeza que deseja apagar TODO o cache de pesquisas?')) {
                    handleClearCache(true)
                  }
                }}
                disabled={clearingAll}
              >
                {clearingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Limpar Todo o Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
