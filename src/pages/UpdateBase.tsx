import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAuthStore from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Database, UploadCloud, AlertCircle, FileText } from 'lucide-react'

function parseLine(text: string) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"' && text[i + 1] === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function parseDate(val: string) {
  if (!val) return null
  val = val.trim()
  if (val.match(/^\d{8}$/))
    return `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`
  if (val.match(/^\d{2}\/\d{2}\/\d{4}$/))
    return `${val.substring(6, 10)}-${val.substring(3, 5)}-${val.substring(0, 2)}`
  return val
}

export default function UpdateBase() {
  const { hasPermission } = useAuthStore()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (hasPermission('Acessar Admin')) {
      fetchLastUpdate()
    }
  }, [hasPermission])

  const fetchLastUpdate = async () => {
    try {
      const { data } = await (supabase as any)
        .from('configuracoes_sistema')
        .select('data_ultima_atualizacao_rfb')
        .eq('id', 1)
        .single()
      if (data && data.data_ultima_atualizacao_rfb) {
        setLastUpdate(data.data_ultima_atualizacao_rfb)
      }
    } catch (e) {
      console.error('Error fetching last update:', e)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (selected.name.endsWith('.csv')) {
        setFile(selected)
        setErrorMsg(null)
      } else {
        setFile(null)
        toast.error('Por favor, selecione um arquivo .csv válido.')
      }
    }
  }

  const handleImport = async () => {
    if (!file) return
    setIsUploading(true)
    setErrorMsg(null)
    setProgress(0)

    try {
      const CHUNK_SIZE = 1024 * 1024 // 1MB chunks
      let offset = 0
      const decoder = new TextDecoder('utf-8')
      let leftover = ''
      let headers: string[] = []
      let isFirstLine = true
      let batch: any[] = []
      const BATCH_LIMIT = 3000

      const sendBatch = async (items: any[]) => {
        const { data, error } = await supabase.functions.invoke('importar-rfb', {
          body: { items },
        })
        if (error) throw new Error(error.message)
        if (data?.error) throw new Error(data.error)
      }

      while (offset < file.size) {
        const slice = file.slice(offset, offset + CHUNK_SIZE)
        const buffer = await slice.arrayBuffer()
        const text = decoder.decode(buffer, { stream: true })

        const lines = (leftover + text).split('\n')
        leftover = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          const cols = parseLine(line)

          if (isFirstLine) {
            headers = cols.map((c) => c.trim().toLowerCase())
            isFirstLine = false
            if (!headers.includes('cnpj') && !headers.includes('cnpj_basico')) {
              throw new Error('Formato de CSV inválido: coluna "cnpj" não encontrada.')
            }
            continue
          }

          const obj: any = {}
          headers.forEach((h, i) => {
            obj[h] = cols[i]
          })

          const cnpj = obj['cnpj'] || obj['cnpj_basico']
          if (cnpj) {
            batch.push({
              cnpj: cnpj.trim(),
              razao_social: obj['razao_social'] || null,
              cnae_fiscal_principal: obj['cnae_fiscal_principal'] || null,
              cnaes_secundarios: obj['cnaes_secundarios']
                ? obj['cnaes_secundarios'].split(',').map((s: string) => s.trim())
                : [],
              municipio: obj['municipio'] || null,
              uf: obj['uf'] || null,
              porte: obj['porte'] || null,
              situacao_cadastral: obj['situacao_cadastral'] || null,
              capital_social: obj['capital_social']
                ? parseFloat(obj['capital_social'].replace(',', '.'))
                : 0,
              data_abertura: parseDate(obj['data_abertura']) || null,
              email: obj['email'] || null,
              telefone_1: obj['telefone'] || obj['telefone_1'] || null,
            })
          }

          if (batch.length >= BATCH_LIMIT) {
            await sendBatch(batch)
            batch = []
            setProgress(Math.round((offset / file.size) * 100))
          }
        }
        offset += CHUNK_SIZE
        await new Promise((r) => setTimeout(r, 10)) // Yield to main thread
      }

      if (leftover.trim()) {
        const cols = parseLine(leftover)
        const obj: any = {}
        headers.forEach((h, i) => {
          obj[h] = cols[i]
        })
        const cnpj = obj['cnpj'] || obj['cnpj_basico']
        if (cnpj) {
          batch.push({
            cnpj: cnpj.trim(),
            razao_social: obj['razao_social'] || null,
            cnae_fiscal_principal: obj['cnae_fiscal_principal'] || null,
            cnaes_secundarios: obj['cnaes_secundarios']
              ? obj['cnaes_secundarios'].split(',').map((s: string) => s.trim())
              : [],
            municipio: obj['municipio'] || null,
            uf: obj['uf'] || null,
            porte: obj['porte'] || null,
            situacao_cadastral: obj['situacao_cadastral'] || null,
            capital_social: obj['capital_social']
              ? parseFloat(obj['capital_social'].replace(',', '.'))
              : 0,
            data_abertura: parseDate(obj['data_abertura']) || null,
            email: obj['email'] || null,
            telefone_1: obj['telefone'] || obj['telefone_1'] || null,
          })
        }
      }

      if (batch.length > 0) {
        await sendBatch(batch)
      }

      setProgress(100)

      const now = new Date().toISOString()
      await (supabase as any)
        .from('configuracoes_sistema')
        .upsert({ id: 1, data_ultima_atualizacao_rfb: now })
      setLastUpdate(now)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      toast.success('Base de dados atualizada com sucesso!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o arquivo CSV')
      toast.error('Ocorreu um erro durante a importação.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!hasPermission('Acessar Admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Atualização da Base RFB</h2>
        <p className="text-muted-foreground mt-1">
          Faça o upload do arquivo CSV com os dados abertos da Receita Federal para manter a base de
          leads atualizada.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Sincronização de Dados
          </CardTitle>
          <CardDescription>
            Última atualização da base:{' '}
            <strong className="text-foreground">
              {lastUpdate ? new Date(lastUpdate).toLocaleString('pt-BR') : 'Nunca atualizado'}
            </strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="csv-upload">Arquivo CSV (RFB)</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
                className="max-w-md cursor-pointer"
              />
              <Button
                onClick={handleImport}
                disabled={!file || isUploading}
                className="gap-2 shrink-0"
              >
                <UploadCloud className="w-4 h-4" />
                {isUploading ? 'Processando...' : 'Importar Arquivo RFB'}
              </Button>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText className="w-4 h-4" /> {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{' '}
                MB)
              </p>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border">
              <div className="flex justify-between text-sm font-medium">
                <span>Progresso da Importação</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center animate-pulse mt-2">
                Processando dados em lotes e atualizando o banco. Por favor, não feche esta página.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-md">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">Falha na importação</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
