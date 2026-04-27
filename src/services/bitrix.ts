import { supabase } from '@/lib/supabase/client'

export interface BitrixKanbanStage {
  ID: string
  NAME: string
  CATEGORY_ID: string
  STATUS_ID: string
  SORT: string
  ENTITY_ID?: string
  ENTITY_TYPE?: string
}

export interface BitrixKanbansResponse {
  success: boolean
  cached: boolean
  data?: BitrixKanbanStage[]
  error?: string
}

const BITRIX_STATUS_LIST_URL_FALLBACK =
  'https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/crm.status.list.json'

/**
 * Busca a URL do webhook Bitrix24 configurada no banco.
 */
async function getBitrixStatusListUrl(): Promise<string> {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'bitrix24_webhook_url')
      .maybeSingle()

    if (data?.value) {
      let url = typeof data.value === 'string' ? data.value : String(data.value)
      url = url.replace(/^"+|"+$/g, '')
      if (!url.endsWith('/')) url += '/'
      return `${url}crm.status.list.json`
    }
  } catch {
    // fallback silencioso
  }
  return BITRIX_STATUS_LIST_URL_FALLBACK
}

/**
 * Processa status brutos do Bitrix24 em stages estruturados.
 */
const processRawStatuses = (allStatuses: any[]): BitrixKanbanStage[] => {
  const rawDeals = allStatuses.filter(
    (s: any) => s.ENTITY_ID && s.ENTITY_ID.includes('DEAL_STAGE'),
  )
  const rawLeads = allStatuses.filter((s: any) => s.ENTITY_ID === 'STATUS')

  const process = (statuses: any[], entityType: string): BitrixKanbanStage[] =>
    statuses.map((s: any) => {
      let categoryId = '0'
      if (entityType === 'DEAL' && s.ENTITY_ID !== 'DEAL_STAGE') {
        categoryId = s.ENTITY_ID.replace('DEAL_STAGE_', '')
      } else if (entityType === 'LEAD') {
        categoryId = 'LEAD'
      }

      return {
        ID: s.ID,
        NAME: s.NAME,
        CATEGORY_ID: categoryId,
        STATUS_ID: s.STATUS_ID || s.ID,
        SORT: s.SORT,
        ENTITY_ID: s.ENTITY_ID,
        ENTITY_TYPE: entityType,
      }
    })

  const kanbans = [...process(rawDeals, 'DEAL'), ...process(rawLeads, 'LEAD')].sort((a, b) => {
    if (a.ENTITY_TYPE !== b.ENTITY_TYPE) return a.ENTITY_TYPE === 'LEAD' ? -1 : 1
    if (a.CATEGORY_ID !== b.CATEGORY_ID) {
      if (a.CATEGORY_ID === 'LEAD') return -1
      if (b.CATEGORY_ID === 'LEAD') return 1
      return parseInt(a.CATEGORY_ID) - parseInt(b.CATEGORY_ID)
    }
    return parseInt(a.SORT) - parseInt(b.SORT)
  })

  return kanbans
}

/**
 * Busca kanbans via edge function (pode retornar dados do cache).
 */
export const fetchBitrixKanbans = async (): Promise<BitrixKanbansResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-bitrix-kanbans', {
      body: {},
      headers: { 'Content-Type': 'application/json' },
    })

    if (error) throw error
    return data as BitrixKanbansResponse
  } catch (err: any) {
    console.error('Erro ao buscar Kanbans do Bitrix24:', err)
    return { success: false, cached: false, error: err.message || 'Falha ao comunicar com o servidor.' }
  }
}

/**
 * Busca kanbans DIRETAMENTE da API do Bitrix24 via rate limiter,
 * processando os dados no cliente. Bypass da edge function.
 */
export const refreshBitrixKanbans = async (): Promise<BitrixKanbansResponse> => {
  try {
    const statusListUrl = await getBitrixStatusListUrl()
    const { data, error } = await supabase.functions.invoke('bitrix-rate-limiter', {
      body: {
        endpoint: statusListUrl,
        method: 'POST',
        body: {},
      },
      headers: { 'Content-Type': 'application/json' },
    })

    if (error) throw error
    if (!data?.success) throw new Error(data?.message || 'Erro no rate limiter')

    const allStatuses = data?.data?.result || []

    if (data?.data?.error) {
      throw new Error(`Bitrix24: ${data.data.error_description || data.data.error}`)
    }

    const kanbans = processRawStatuses(allStatuses)

    console.log('[Bitrix] Refresh direto - statuses brutos:', allStatuses.length,
      '| ENTITY_IDs:', [...new Set(allStatuses.map((s: any) => s.ENTITY_ID).filter(Boolean))],
      '| Processados: DEAL=', kanbans.filter(k => k.ENTITY_TYPE === 'DEAL').length,
      'LEAD=', kanbans.filter(k => k.ENTITY_TYPE === 'LEAD').length,
    )

    return { success: true, cached: false, data: kanbans }
  } catch (err: any) {
    console.error('Erro ao atualizar Kanbans do Bitrix24:', err)
    return { success: false, cached: false, error: err.message || 'Falha ao comunicar com o servidor.' }
  }
}
