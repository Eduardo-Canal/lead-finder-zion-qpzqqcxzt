import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, BellRing, Settings2, Info } from 'lucide-react'

export default function RemindersConfig() {
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [followUp, setFollowUp] = useState(7)
  const [proposal, setProposal] = useState(3)
  const [closing, setClosing] = useState(1)
  const [applyToExisting, setApplyToExisting] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('user_reminder_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (data) {
          setFollowUp(data.follow_up_days)
          setProposal(data.proposal_days)
          setClosing(data.closing_days)
        } else {
          // Fallback limits default
          setFollowUp(7)
          setProposal(3)
          setClosing(1)
        }
      } catch (err) {
        console.error('Erro ao buscar configurações de lembretes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)

    try {
      // Upsert preferences
      const { error: upsertError } = await supabase.from('user_reminder_settings').upsert(
        {
          user_id: user.id,
          follow_up_days: followUp,
          proposal_days: proposal,
          closing_days: closing,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

      if (upsertError) throw upsertError

      // Update existing reminders if requested
      if (applyToExisting) {
        await supabase
          .from('reminders')
          .update({ days_interval: followUp })
          .eq('user_id', user.id)
          .eq('reminder_type', 'follow_up')
        await supabase
          .from('reminders')
          .update({ days_interval: proposal })
          .eq('user_id', user.id)
          .eq('reminder_type', 'proposal')
        await supabase
          .from('reminders')
          .update({ days_interval: closing })
          .eq('user_id', user.id)
          .eq('reminder_type', 'closing')
      }

      toast.success('Configurações de lembretes salvas com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao salvar as configurações: ' + err.message)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Lembretes Automáticos</h2>
        <p className="text-muted-foreground mt-1">
          Configure as regras de relacionamento com seus leads. Defina em quantos dias o sistema
          deve alertá-lo para cada tipo de pendência.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Cadência de Follow-up
          </CardTitle>
          <CardDescription>
            Estas configurações determinarão quando o ícone de notificações será ativado no topo da
            tela e quais e-mails você receberá diariamente da automação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando configurações...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2 p-4 border rounded-lg bg-slate-50/50">
                  <Label htmlFor="follow_up" className="text-base font-semibold text-blue-700">
                    Prospecção
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Dias sem contato para disparar aviso de follow-up rotineiro.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="follow_up"
                      type="number"
                      min={1}
                      max={90}
                      value={followUp}
                      onChange={(e) => setFollowUp(Number(e.target.value))}
                      className="bg-white font-mono"
                    />
                    <span className="text-sm text-muted-foreground font-medium">dias</span>
                  </div>
                </div>

                <div className="space-y-2 p-4 border rounded-lg bg-slate-50/50">
                  <Label htmlFor="proposal" className="text-base font-semibold text-purple-700">
                    Proposta
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Dias após o envio da proposta para checar o status.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="proposal"
                      type="number"
                      min={1}
                      max={30}
                      value={proposal}
                      onChange={(e) => setProposal(Number(e.target.value))}
                      className="bg-white font-mono"
                    />
                    <span className="text-sm text-muted-foreground font-medium">dias</span>
                  </div>
                </div>

                <div className="space-y-2 p-4 border rounded-lg bg-slate-50/50">
                  <Label htmlFor="closing" className="text-base font-semibold text-emerald-700">
                    Fechamento
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Dias para alerta em leads muito próximos de conversão.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="closing"
                      type="number"
                      min={1}
                      max={30}
                      value={closing}
                      onChange={(e) => setClosing(Number(e.target.value))}
                      className="bg-white font-mono"
                    />
                    <span className="text-sm text-muted-foreground font-medium">dias</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-blue-900">Como funciona a automação?</h4>
                  <p className="text-sm text-blue-800/80 leading-relaxed">
                    O servidor verifica diariamente todas as suas negociações ativas. Se o tempo
                    desde o último contato (ou da criação do lembrete) ultrapassar os dias
                    configurados acima, uma notificação será enviada para você.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="applyToExisting"
                    checked={applyToExisting}
                    onCheckedChange={(c) => setApplyToExisting(!!c)}
                  />
                  <Label
                    htmlFor="applyToExisting"
                    className="font-normal text-muted-foreground cursor-pointer"
                  >
                    Aplicar estes intervalos aos lembretes já ativos
                  </Label>
                </div>

                <Button type="submit" disabled={saving} className="w-full sm:w-auto gap-2">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Settings2 className="h-4 w-4" />
                  )}
                  Salvar Preferências
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
