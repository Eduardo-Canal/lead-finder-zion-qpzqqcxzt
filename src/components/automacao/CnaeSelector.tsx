import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Plus, Loader2, Briefcase } from 'lucide-react'

type CnaeGroup = {
  cnae: string
  descricao: string
  count: number
}

type Props = {
  value: string[]
  onChange: (cnaes: string[]) => void
  initialCnaes?: string[]
}

export function CnaeSelector({ value, onChange, initialCnaes }: Props) {
  const [cnaeGroups, setCnaeGroups] = useState<CnaeGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [manualInput, setManualInput] = useState('')

  useEffect(() => {
    setLoading(true)
    supabase.functions
      .invoke('get-clientes-por-cnae', { method: 'POST' })
      .then(({ data }) => setCnaeGroups(data?.data || []))
      .finally(() => setLoading(false))
  }, [])

  // Pre-select initial CNAEs (used when navigating from InteligenciaZion)
  useEffect(() => {
    if (initialCnaes && initialCnaes.length > 0) {
      const toAdd = initialCnaes.filter((c) => !value.includes(c))
      if (toAdd.length > 0) onChange([...value, ...toAdd])
    }
  }, [initialCnaes])

  const toggle = (cnae: string) => {
    const clean = cnae.replace(/\D/g, '')
    if (!clean) return
    if (value.includes(clean)) {
      onChange(value.filter((c) => c !== clean))
    } else {
      onChange([...value, clean])
    }
  }

  const addManual = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = manualInput.trim().replace(/\D/g, '')
    if (!clean || value.includes(clean)) return
    onChange([...value, clean])
    setManualInput('')
  }

  const remove = (cnae: string) => onChange(value.filter((c) => c !== cnae))

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-md min-h-[40px]">
          {value.map((cnae) => (
            <Badge key={cnae} variant="secondary" className="gap-1 pr-1 font-mono">
              {cnae}
              <button
                type="button"
                onClick={() => remove(cnae)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">Nenhum CNAE selecionado.</p>
      )}

      <Tabs defaultValue="carteira">
        <TabsList className="w-full">
          <TabsTrigger value="carteira" className="flex-1">
            Da Carteira
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex-1">
            Código Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="carteira" className="mt-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : cnaeGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Briefcase className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs text-center">
                Nenhum CNAE na carteira.
                <br />
                Sincronize o CRM em Inteligência Zion primeiro.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-52 rounded-md border">
              <div className="p-1.5 space-y-0.5">
                {cnaeGroups
                  .sort((a, b) => b.count - a.count)
                  .map((group) => {
                    const selected = value.includes(group.cnae.replace(/\D/g, ''))
                    return (
                      <button
                        key={group.cnae}
                        type="button"
                        onClick={() => toggle(group.cnae)}
                        className={`w-full text-left px-2.5 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted/60 text-foreground'
                        }`}
                      >
                        <span className="font-mono font-semibold shrink-0">{group.cnae}</span>
                        {group.descricao && (
                          <span className="text-xs opacity-75 truncate flex-1">
                            {group.descricao}
                          </span>
                        )}
                        <span className="text-xs opacity-60 shrink-0">
                          {group.count} {group.count === 1 ? 'cliente' : 'clientes'}
                        </span>
                      </button>
                    )
                  })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="manual" className="mt-2 space-y-2">
          <form onSubmit={addManual} className="flex gap-2">
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Ex: 4930201"
              className="font-mono"
            />
            <Button type="submit" variant="outline" size="icon" title="Adicionar CNAE">
              <Plus className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Digite o código CNAE (somente números) e clique em +.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
