import { supabase } from '@/lib/supabase/client'

export interface ContaAzulConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  testUser: string
  testPass: string
}

export interface CurveThresholds {
  mode: 'fixo' | 'pareto'
  a_plus_min: number
  a_min: number
  b_min: number
  c_min: number
}

export interface OracleTier {
  porte: 'pequeno' | 'medio' | 'grande'
  custo_mensal: number
}

export interface CurvaAbcRow {
  id: string
  cnpj: string
  company_name?: string
  mrr: number
  custo_infra: number | null
  margem_liquida: number | null
  curva_abc_anterior?: string | null
  curva_abc_calculada?: string | null
  mudanca?: string
}

export async function loadContaAzulConfig(): Promise<ContaAzulConfig> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'contaazul_config')
    .maybeSingle()

  return {
    clientId: data?.value?.clientId ?? '',
    clientSecret: data?.value?.clientSecret ?? '',
    redirectUri: data?.value?.redirectUri ?? '',
    testUser: data?.value?.testUser ?? '',
    testPass: data?.value?.testPass ?? '',
  }
}

export async function saveContaAzulConfig(config: ContaAzulConfig) {
  const { error } = await supabase.from('settings').upsert(
    {
      key: 'contaazul_config',
      value: config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )

  if (error) throw error
}

export async function loadCurveThresholds(): Promise<CurveThresholds> {
  const { data } = await (supabase as any)
    .from('abc_curve_config')
    .select('*')
    .limit(1)
    .maybeSingle()

  return (
    data ?? {
      mode: 'fixo',
      a_plus_min: 4000,
      a_min: 2500,
      b_min: 1000,
      c_min: 0,
    }
  )
}

export async function saveCurveThresholds(data: CurveThresholds) {
  const rows = await (supabase as any)
    .from('abc_curve_config')
    .select('id')
    .limit(1)

  const payload = { ...data, updated_at: new Date().toISOString() }
  if (rows?.data?.[0]?.id) {
    const { error } = await (supabase as any)
      .from('abc_curve_config')
      .update(payload)
      .eq('id', rows.data[0].id)
    if (error) throw error
    return
  }

  const { error } = await (supabase as any)
    .from('abc_curve_config')
    .insert(payload)
  if (error) throw error
}

export async function loadOracleTiers(): Promise<OracleTier[]> {
  const { data } = await (supabase as any)
    .from('oracle_cost_config')
    .select('*')
    .order('porte', { ascending: true })

  if (data?.length) {
    return data
  }

  return [
    { porte: 'pequeno', custo_mensal: 100 },
    { porte: 'medio', custo_mensal: 300 },
    { porte: 'grande', custo_mensal: 800 },
  ]
}

export async function saveOracleTiers(tiers: OracleTier[]) {
  const inserts = tiers.map((tier) => ({
    porte: tier.porte,
    custo_mensal: tier.custo_mensal,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await (supabase as any)
    .from('oracle_cost_config')
    .upsert(inserts, { onConflict: 'porte' })

  if (error) throw error
}

export async function loadAbcHistory() {
  const { data, error } = await (supabase as any)
    .from('abc_historico')
    .select('*')
    .order('data', { ascending: false })
    .limit(200)

  if (error) throw error
  return data ?? []
}

export async function fetchMrr() {
  const response = await supabase.functions.invoke('fetch-mrr', { body: {} })
  if (response.error) throw response.error
  return response.data
}

export async function calculateAbc() {
  const response = await supabase.functions.invoke('calculate-abc', { body: {} })
  if (response.error) throw response.error
  return response.data
}

export async function updateBitrixCurve(rows: any[]) {
  const response = await supabase.functions.invoke('update-bitrix', { body: { rows } })
  if (response.error) throw response.error
  return response.data
}

export async function testContaAzulConnection() {
  const response = await supabase.functions.invoke('auth-contaazul', {
    body: { action: 'validate' },
  })
  if (response.error) throw response.error
  return response.data
}
