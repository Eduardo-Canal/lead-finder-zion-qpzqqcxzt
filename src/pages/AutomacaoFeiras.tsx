import { useState, useEffect } from 'react'
import { Store, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface GroupConfig {
  id: string
  nome: string
  group_id: string
  descricao: string | null
  ativo: boolean
  criado_em: string
}

export default function AutomacaoFeiras() {
  const [grupos, setGrupos] = useState<GroupConfig[]>([])
  const [novoGrupoNome, setNovoGrupoNome] = useState('')
  const [novoGrupoId, setNovoGrupoId] = useState('')
  const [novoGrupoDesc, setNovoGrupoDesc] = useState('')
  const [criandoGrupo, setCriandoGrupo] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('whatsapp_group_config').select('*').order('criado_em')
      .then(({ data }) => {
        setGrupos(data || [])
        setLoading(false)
      })
  }, [])

  const handleCriarGrupo = async () => {
    if (!novoGrupoNome.trim() || !novoGrupoId.trim()) {
      toast.error('Informe o nome e o ID do grupo')
      return
    }
    setCriandoGrupo(true)
    try {
      const groupIdClean = novoGrupoId.trim().replace(/@g\.us$/, '')
      const { data, error } = await supabase.from('whatsapp_group_config').insert({
        nome: novoGrupoNome.trim(),
        group_id: groupIdClean,
        descricao: novoGrupoDesc.trim() || null,
        ativo: true,
      }).select().single()
      if (error) throw error
      setGrupos(prev => [...prev, data])
      setNovoGrupoNome('')
      setNovoGrupoId('')
      setNovoGrupoDesc('')
      toast.success('Grupo de feira cadastrado!')
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`)
    } finally {
      setCriandoGrupo(false)
    }
  }

  const handleToggleGrupo = async (id: string, ativo: boolean) => {
    await supabase.from('whatsapp_group_config').update({ ativo }).eq('id', id)
    setGrupos(prev => prev.map(g => g.id === id ? { ...g, ativo } : g))
  }

  const handleDeleteGrupo = async (id: string) => {
    if (!window.confirm('Remover este grupo de feira?')) return
    await supabase.from('whatsapp_group_config').delete().eq('id', id)
    setGrupos(prev => prev.filter(g => g.id !== id))
    toast.success('Grupo removido.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Store className="w-7 h-7 text-orange-400" />
        <div>
          <h1 className="text-2xl font-bold">Grupos de Feiras</h1>
          <p className="text-sm text-muted-foreground">
            Configure os grupos do WhatsApp onde os executivos enviam fotos de crachás para captura de leads
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4 text-orange-400" />
            Grupos de Feira / Evento
          </CardTitle>
          <CardDescription>
            Cada grupo do WhatsApp onde os executivos enviam fotos de crachás precisa estar
            cadastrado aqui. O sistema usará o group_id para identificar de qual evento veio o lead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {grupos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {grupos.map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
                  <div className="flex items-center gap-3">
                    <Store className={`w-7 h-7 ${g.ativo ? 'text-orange-400' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-sm">{g.nome}</p>
                      <p className="text-xs text-muted-foreground font-mono">{g.group_id}@g.us</p>
                      {g.descricao && <p className="text-xs text-muted-foreground">{g.descricao}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={g.ativo ? 'default' : 'secondary'} className="text-xs">
                      {g.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleGrupo(g.id, !g.ativo)}
                    >
                      {g.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteGrupo(g.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <Label>Adicionar grupo de feira</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome do evento/feira</Label>
                <Input
                  value={novoGrupoNome}
                  onChange={e => setNovoGrupoNome(e.target.value)}
                  placeholder='Ex: "Intermodal 2026"'
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">ID do grupo (sem @g.us)</Label>
                <Input
                  value={novoGrupoId}
                  onChange={e => setNovoGrupoId(e.target.value)}
                  placeholder="Ex: 120363xxxxxx@g.us ou só os números"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Descrição (opcional)</Label>
                <Input
                  value={novoGrupoDesc}
                  onChange={e => setNovoGrupoDesc(e.target.value)}
                  placeholder="Ex: Grupo de captura de leads — Intermodal SP 2026"
                />
              </div>
            </div>
            <Button onClick={handleCriarGrupo} disabled={criandoGrupo}>
              {criandoGrupo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Cadastrar grupo
            </Button>
            <p className="text-xs text-muted-foreground">
              Para obter o ID do grupo: no WhatsApp Web, abra o grupo → clique em "Informações do grupo".
              O ID fica no final da URL ou pode ser visto em "Convite via link" (formato numérico@g.us).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
