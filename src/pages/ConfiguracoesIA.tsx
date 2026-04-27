import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import useAuthStore from '@/stores/useAuthStore'
import {
  Loader2,
  Building2,
  Package,
  UserCog,
  SlidersHorizontal,
  Eye,
  Save,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { DynamicFieldList } from '@/components/ui/dynamic-field-list'

// ─── Types ────────────────────────────────────────────────────
interface CompanyProfile {
  nome: string
  setor: string
  proposta_valor: string
  diferenciais: string[]
  cases_sucesso: string[]
  anos_mercado: string
}

interface ProductFeature {
  nome: string
  descricao: string
  beneficio: string
}

interface ProductSpecs {
  nome_produto: string
  features: ProductFeature[]
  casos_uso: string[]
  segmentos_alvo: string[]
}

interface Persona {
  cargo: string
  nivel_decisao: string
  dores: string[]
  motivacoes: string[]
  objecoes_comuns: string[]
}

interface PersonasConfig {
  personas: Persona[]
}

interface ApproachRules {
  tom: string
  comprimento: string
  estilo_cta: string
  canais_preferidos: string[]
  idioma: string
  instrucoes_adicionais: string
}

// ─── Defaults ─────────────────────────────────────────────────
const defaultCompany: CompanyProfile = {
  nome: '',
  setor: '',
  proposta_valor: '',
  diferenciais: [],
  cases_sucesso: [],
  anos_mercado: '',
}

const defaultProduct: ProductSpecs = {
  nome_produto: '',
  features: [],
  casos_uso: [],
  segmentos_alvo: [],
}

const defaultPersonas: PersonasConfig = { personas: [] }

const defaultRules: ApproachRules = {
  tom: 'Consultivo',
  comprimento: 'Medio',
  estilo_cta: 'Suave',
  canais_preferidos: ['email'],
  idioma: 'Portugues',
  instrucoes_adicionais: '',
}

const emptyPersona: Persona = {
  cargo: '',
  nivel_decisao: 'Tatico',
  dores: [],
  motivacoes: [],
  objecoes_comuns: [],
}

const emptyFeature: ProductFeature = { nome: '', descricao: '', beneficio: '' }

// ─── Prompt Builder (mirror of edge function logic) ──────────
function buildPromptPreview(
  company: CompanyProfile,
  product: ProductSpecs,
  personas: PersonasConfig,
  rules: ApproachRules,
): string {
  const lines: string[] = []

  lines.push('IDENTIDADE:')
  if (company.nome) {
    lines.push(
      `Voce e um especialista em vendas B2B da ${company.nome}${company.anos_mercado ? `, empresa com ${company.anos_mercado} anos` : ''} no mercado de ${company.setor || 'tecnologia'}.`,
    )
  }
  if (company.proposta_valor) lines.push(`Proposta de valor: ${company.proposta_valor}`)
  if (company.diferenciais.length)
    lines.push(`Diferenciais: ${company.diferenciais.join(', ')}`)
  if (company.cases_sucesso.length)
    lines.push(`Cases de sucesso: ${company.cases_sucesso.join(', ')}`)

  if (product.nome_produto) {
    lines.push('')
    lines.push(`PRODUTO - ${product.nome_produto}:`)
    if (product.features.length) {
      lines.push('Funcionalidades:')
      product.features.forEach((f) => {
        lines.push(`- ${f.nome}: ${f.descricao}${f.beneficio ? ` (Beneficio: ${f.beneficio})` : ''}`)
      })
    }
    if (product.segmentos_alvo.length)
      lines.push(`Segmentos-alvo: ${product.segmentos_alvo.join(', ')}`)
    if (product.casos_uso.length)
      lines.push(`Casos de uso: ${product.casos_uso.join(', ')}`)
  }

  if (personas.personas.length) {
    lines.push('')
    lines.push('PERSONAS-ALVO:')
    personas.personas.forEach((p) => {
      lines.push(`\nCargo: ${p.cargo} (${p.nivel_decisao})`)
      if (p.dores.length) lines.push(`Dores: ${p.dores.join(', ')}`)
      if (p.motivacoes.length) lines.push(`Motivacoes: ${p.motivacoes.join(', ')}`)
      if (p.objecoes_comuns.length) lines.push(`Objecoes comuns: ${p.objecoes_comuns.join(', ')}`)
    })
  }

  lines.push('')
  lines.push('REGRAS DE GERACAO:')
  lines.push(`Tom: ${rules.tom} | Comprimento: ${rules.comprimento} | CTA: ${rules.estilo_cta}`)
  if (rules.canais_preferidos.length)
    lines.push(`Canais preferidos: ${rules.canais_preferidos.join(', ')}`)
  if (rules.instrucoes_adicionais) lines.push(`\n${rules.instrucoes_adicionais}`)

  return lines.join('\n')
}

// ─── Main Component ──────────────────────────────────────────
export default function ConfiguracoesIA() {
  const { user, hasPermission } = useAuthStore()
  const isAdmin = user?.perfis_acesso?.nome === 'Administrador' || hasPermission('Acessar Admin')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [company, setCompany] = useState<CompanyProfile>(defaultCompany)
  const [product, setProduct] = useState<ProductSpecs>(defaultProduct)
  const [personas, setPersonas] = useState<PersonasConfig>(defaultPersonas)
  const [rules, setRules] = useState<ApproachRules>(defaultRules)

  // Preview & Test
  const [testCnae, setTestCnae] = useState('')
  const [testPorte, setTestPorte] = useState('')
  const [testDores, setTestDores] = useState('')
  const [testResult, setTestResult] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  // Persona expansion state
  const [expandedPersonas, setExpandedPersonas] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['ai_company_profile', 'ai_product_specs', 'ai_personas', 'ai_approach_rules'])

        if (data) {
          for (const row of data) {
            const val = row.value as any
            switch (row.key) {
              case 'ai_company_profile':
                setCompany({ ...defaultCompany, ...val })
                break
              case 'ai_product_specs':
                setProduct({ ...defaultProduct, ...val })
                break
              case 'ai_personas':
                setPersonas({ ...defaultPersonas, ...val })
                break
              case 'ai_approach_rules':
                setRules({ ...defaultRules, ...val })
                break
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar configuracoes IA:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin])

  const handleSave = async (key: string, value: any, label: string) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

      if (error) throw error
      toast.success(`${label} salvo com sucesso!`)
    } catch (err: any) {
      console.error(err)
      toast.error(`Erro ao salvar: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const promptPreview = useMemo(
    () => buildPromptPreview(company, product, personas, rules),
    [company, product, personas, rules],
  )

  const estimatedTokens = useMemo(() => Math.ceil(promptPreview.length / 4), [promptPreview])

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult('')
    try {
      const { data, error } = await supabase.functions.invoke('test-openai-prompt', {
        body: {
          cnae: testCnae,
          porte: testPorte,
          dores: testDores,
          useStructuredContext: true,
        },
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido')
      setTestResult(data.result)
      toast.success('Teste gerado com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar teste.')
    } finally {
      setIsTesting(false)
    }
  }

  // ─── Persona helpers ────────────────────────────────────────
  const addPersona = () => {
    const newIndex = personas.personas.length
    setPersonas({ personas: [...personas.personas, { ...emptyPersona }] })
    setExpandedPersonas((prev) => ({ ...prev, [newIndex]: true }))
  }

  const removePersona = (index: number) => {
    setPersonas({ personas: personas.personas.filter((_, i) => i !== index) })
  }

  const updatePersona = (index: number, field: keyof Persona, value: any) => {
    const updated = [...personas.personas]
    updated[index] = { ...updated[index], [field]: value }
    setPersonas({ personas: updated })
  }

  const togglePersona = (index: number) => {
    setExpandedPersonas((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  // ─── Feature helpers ────────────────────────────────────────
  const addFeature = () => {
    setProduct({ ...product, features: [...product.features, { ...emptyFeature }] })
  }

  const removeFeature = (index: number) => {
    setProduct({ ...product, features: product.features.filter((_, i) => i !== index) })
  }

  const updateFeature = (index: number, field: keyof ProductFeature, value: string) => {
    const updated = [...product.features]
    updated[index] = { ...updated[index], [field]: value }
    setProduct({ ...product, features: updated })
  }

  // ─── Channel toggle ─────────────────────────────────────────
  const toggleChannel = (channel: string) => {
    const current = rules.canais_preferidos
    setRules({
      ...rules,
      canais_preferidos: current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel],
    })
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
        <p className="text-muted-foreground">Voce nao tem permissao para acessar esta pagina.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Contexto IA - Abordagem Comercial</h2>
        <p className="text-muted-foreground mt-1">
          Configure o contexto que a Inteligencia Artificial usara para gerar abordagens comerciais
          personalizadas para cada lead.
        </p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="empresa" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm">
            <Building2 className="w-4 h-4 hidden sm:block" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="produto" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm">
            <Package className="w-4 h-4 hidden sm:block" /> Produto
          </TabsTrigger>
          <TabsTrigger value="personas" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm">
            <UserCog className="w-4 h-4 hidden sm:block" /> Personas
          </TabsTrigger>
          <TabsTrigger value="regras" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm">
            <SlidersHorizontal className="w-4 h-4 hidden sm:block" /> Regras
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center justify-center gap-1.5 text-xs sm:text-sm">
            <Eye className="w-4 h-4 hidden sm:block" /> Preview
          </TabsTrigger>
        </TabsList>

        {/* ═══ ABA EMPRESA ═══ */}
        <TabsContent value="empresa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Perfil da Empresa
              </CardTitle>
              <CardDescription>
                Informacoes sobre a Zion que serao usadas como contexto pela IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={company.nome}
                    onChange={(e) => setCompany({ ...company, nome: e.target.value })}
                    placeholder="Ex: Zion Logtec"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Setor de Atuacao</Label>
                  <Input
                    value={company.setor}
                    onChange={(e) => setCompany({ ...company, setor: e.target.value })}
                    placeholder="Ex: Tecnologia para Logistica"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anos no Mercado</Label>
                  <Input
                    value={company.anos_mercado}
                    onChange={(e) => setCompany({ ...company, anos_mercado: e.target.value })}
                    placeholder="Ex: 15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Proposta de Valor</Label>
                <Textarea
                  value={company.proposta_valor}
                  onChange={(e) => setCompany({ ...company, proposta_valor: e.target.value })}
                  placeholder="Descreva a proposta de valor principal da empresa..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Diferenciais Competitivos</Label>
                <DynamicFieldList
                  values={company.diferenciais}
                  onChange={(v) => setCompany({ ...company, diferenciais: v })}
                  placeholder="Adicionar diferencial..."
                />
              </div>

              <div className="space-y-2">
                <Label>Cases de Sucesso</Label>
                <DynamicFieldList
                  values={company.cases_sucesso}
                  onChange={(v) => setCompany({ ...company, cases_sucesso: v })}
                  placeholder="Ex: Reducao de 40% no tempo de separacao - Cliente X"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleSave('ai_company_profile', company, 'Perfil da empresa')}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ABA PRODUTO ═══ */}
        <TabsContent value="produto" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Especificacoes do Produto
              </CardTitle>
              <CardDescription>
                Detalhes do WMS e seus beneficios para contextualizar a IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input
                  value={product.nome_produto}
                  onChange={(e) => setProduct({ ...product, nome_produto: e.target.value })}
                  placeholder="Ex: Zion WMS"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Funcionalidades</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
                {product.features.map((feat, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 p-3 rounded-lg border bg-slate-50/50">
                    <Input
                      value={feat.nome}
                      onChange={(e) => updateFeature(i, 'nome', e.target.value)}
                      placeholder="Nome da funcionalidade"
                    />
                    <Input
                      value={feat.descricao}
                      onChange={(e) => updateFeature(i, 'descricao', e.target.value)}
                      placeholder="Descricao"
                    />
                    <Input
                      value={feat.beneficio}
                      onChange={(e) => updateFeature(i, 'beneficio', e.target.value)}
                      placeholder="Beneficio"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(i)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {product.features.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma funcionalidade adicionada.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Casos de Uso</Label>
                <DynamicFieldList
                  values={product.casos_uso}
                  onChange={(v) => setProduct({ ...product, casos_uso: v })}
                  placeholder="Ex: Gestao de estoque em tempo real"
                />
              </div>

              <div className="space-y-2">
                <Label>Segmentos-Alvo</Label>
                <DynamicFieldList
                  values={product.segmentos_alvo}
                  onChange={(v) => setProduct({ ...product, segmentos_alvo: v })}
                  placeholder="Ex: Industria, E-commerce, Varejo"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleSave('ai_product_specs', product, 'Produto')}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Produto
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ABA PERSONAS ═══ */}
        <TabsContent value="personas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary" /> Personas Decisoras
              </CardTitle>
              <CardDescription>
                Defina os perfis de decisores que a IA deve considerar ao gerar abordagens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={addPersona}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Persona
                </Button>
              </div>

              {personas.personas.map((persona, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => togglePersona(i)}
                  >
                    <span className="font-medium text-sm">
                      {persona.cargo || `Persona ${i + 1}`}
                      <span className="text-muted-foreground ml-2 font-normal">({persona.nivel_decisao})</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          removePersona(i)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedPersonas[i] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  {expandedPersonas[i] && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cargo</Label>
                          <Input
                            value={persona.cargo}
                            onChange={(e) => updatePersona(i, 'cargo', e.target.value)}
                            placeholder="Ex: Diretor de Logistica"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nivel de Decisao</Label>
                          <Select
                            value={persona.nivel_decisao}
                            onValueChange={(v) => updatePersona(i, 'nivel_decisao', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Estrategico">Estrategico (C-Level)</SelectItem>
                              <SelectItem value="Tatico">Tatico (Gerencia)</SelectItem>
                              <SelectItem value="Operacional">Operacional (Supervisao)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dores / Desafios</Label>
                        <DynamicFieldList
                          values={persona.dores}
                          onChange={(v) => updatePersona(i, 'dores', v)}
                          placeholder="Ex: Falta de visibilidade do estoque"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Motivacoes</Label>
                        <DynamicFieldList
                          values={persona.motivacoes}
                          onChange={(v) => updatePersona(i, 'motivacoes', v)}
                          placeholder="Ex: Reduzir custos operacionais"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Objecoes Comuns</Label>
                        <DynamicFieldList
                          values={persona.objecoes_comuns}
                          onChange={(v) => updatePersona(i, 'objecoes_comuns', v)}
                          placeholder="Ex: Custo de implantacao alto"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {personas.personas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma persona configurada. Clique em "Adicionar Persona" para comecar.
                </p>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleSave('ai_personas', personas, 'Personas')}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Personas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ABA REGRAS ═══ */}
        <TabsContent value="regras" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" /> Regras de Geracao
              </CardTitle>
              <CardDescription>
                Configure como a IA deve estruturar as abordagens comerciais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tom da Abordagem</Label>
                  <Select value={rules.tom} onValueChange={(v) => setRules({ ...rules, tom: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Consultivo">Consultivo</SelectItem>
                      <SelectItem value="Direto">Direto</SelectItem>
                      <SelectItem value="Empatico">Empatico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Comprimento</Label>
                  <Select
                    value={rules.comprimento}
                    onValueChange={(v) => setRules({ ...rules, comprimento: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Curto">Curto (2-3 paragrafos)</SelectItem>
                      <SelectItem value="Medio">Medio (4-5 paragrafos)</SelectItem>
                      <SelectItem value="Longo">Longo (6+ paragrafos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estilo do CTA</Label>
                  <Select
                    value={rules.estilo_cta}
                    onValueChange={(v) => setRules({ ...rules, estilo_cta: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Suave">Suave (convite aberto)</SelectItem>
                      <SelectItem value="Direto">Direto (acao clara)</SelectItem>
                      <SelectItem value="Urgente">Urgente (senso de urgencia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Canais Preferidos</Label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {['email', 'whatsapp', 'linkedin', 'ligacao'].map((channel) => (
                    <label key={channel} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={rules.canais_preferidos.includes(channel)}
                        onCheckedChange={() => toggleChannel(channel)}
                      />
                      <span className="text-sm capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Instrucoes Adicionais</Label>
                <Textarea
                  value={rules.instrucoes_adicionais}
                  onChange={(e) => setRules({ ...rules, instrucoes_adicionais: e.target.value })}
                  placeholder="Instrucoes livres para a IA. Ex: Nunca mencionar concorrentes. Sempre incluir ROI estimado."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => handleSave('ai_approach_rules', rules, 'Regras')}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Regras
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ABA PREVIEW & TESTE ═══ */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Preview do Prompt
              </CardTitle>
              <CardDescription>
                Visualize o prompt completo que sera enviado a IA. Estimativa: ~{estimatedTokens} tokens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={promptPreview}
                readOnly
                className="min-h-[250px] font-mono text-xs bg-slate-50"
              />
            </CardContent>
          </Card>

          <Card className="border-blue-200/50">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" /> Testar Geracao
              </CardTitle>
              <CardDescription>
                Simule a geracao de uma abordagem com dados de um lead ficticio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CNAE / Setor do Lead</Label>
                  <Input
                    value={testCnae}
                    onChange={(e) => setTestCnae(e.target.value)}
                    placeholder="Ex: 5211-7/99 - Depositos"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Porte</Label>
                  <Select value={testPorte} onValueChange={setTestPorte}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Micro Empresa">Micro Empresa</SelectItem>
                      <SelectItem value="Pequena Empresa">Pequena Empresa</SelectItem>
                      <SelectItem value="Media Empresa">Media Empresa</SelectItem>
                      <SelectItem value="Grande Empresa">Grande Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dores Observadas</Label>
                  <Input
                    value={testDores}
                    onChange={(e) => setTestDores(e.target.value)}
                    placeholder="Ex: Erros de inventario, atrasos"
                  />
                </div>
              </div>

              <Button
                onClick={handleTest}
                disabled={isTesting || !testCnae}
                className="w-full sm:w-auto"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Gerar Teste
              </Button>

              {testResult && (
                <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in-50 duration-500">
                  <h4 className="text-sm font-semibold mb-3 text-blue-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Resultado:
                  </h4>
                  <div className="text-sm whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {testResult}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
