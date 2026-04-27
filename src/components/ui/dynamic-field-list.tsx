import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

interface DynamicFieldListProps {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  maxItems?: number
}

export function DynamicFieldList({
  values,
  onChange,
  placeholder = 'Adicionar item...',
  maxItems = 20,
}: DynamicFieldListProps) {
  const [draft, setDraft] = useState('')

  const handleAdd = () => {
    const trimmed = draft.trim()
    if (!trimmed || values.length >= maxItems) return
    onChange([...values, trimmed])
    setDraft('')
  }

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!draft.trim() || values.length >= maxItems}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700 border"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
