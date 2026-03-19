import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import useLeadStore from '@/stores/useLeadStore'

export function AdvancedFilters() {
  const { filters, addCnae, removeCnae, setFilter } = useLeadStore()
  const [cnaeInput, setCnaeInput] = useState('')

  const handleAddCnae = () => {
    if (cnaeInput) {
      addCnae(cnaeInput)
      setCnaeInput('')
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-6 sticky top-6">
      <div>
        <h3 className="text-lg font-medium">Filtros Avançados</h3>
        <p className="text-sm text-muted-foreground">Especifique os critérios de busca.</p>
      </div>

      <div className="space-y-3">
        <Label>CNAE Principal</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: 4683-4/00"
            value={cnaeInput}
            onChange={(e) => setCnaeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCnae()}
          />
          <Button
            type="button"
            onClick={handleAddCnae}
            variant="secondary"
            className="px-3 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {filters.cnaes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.cnaes.map((cnae) => (
              <Badge
                key={cnae}
                variant="secondary"
                className="flex items-center gap-1 bg-muted/80 hover:bg-muted"
              >
                {cnae}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors"
                  onClick={() => removeCnae(cnae)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Estado (UF)</Label>
        <Input
          placeholder="Ex: SP, RJ"
          value={filters.ufs[0] || ''}
          onChange={(e) => {
            const uf = e.target.value.toUpperCase()
            if (uf) {
              setFilter('ufs', [uf])
            } else {
              setFilter('ufs', [])
            }
          }}
          maxLength={2}
        />
      </div>

      <div className="space-y-3">
        <Label>Município</Label>
        <Input
          placeholder="Ex: São Paulo"
          value={filters.municipio}
          onChange={(e) => setFilter('municipio', e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <Label>Situação Cadastral</Label>
        <Select value={filters.situacao || 'ATIVA'} onValueChange={(v) => setFilter('situacao', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ATIVA">Ativa</SelectItem>
            <SelectItem value="INAPTA">Inapta</SelectItem>
            <SelectItem value="BAIXADA">Baixada</SelectItem>
            <SelectItem value="SUSPENSA">Suspensa</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
