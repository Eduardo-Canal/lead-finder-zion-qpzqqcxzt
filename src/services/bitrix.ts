import { supabase } from '@/lib/supabase/client'

export interface BitrixKanbanStage {
  ID: string
  NAME: string
  CATEGORY_ID: string
  STATUS_ID: string
  SORT: string
}

export interface BitrixKanbansResponse {
  success: boolean
  cached: boolean
  data?: BitrixKanbanStage[]
  error?: string
}

/**
 * Busca a lista de Kanbans e seus estágios diretamente do Bitrix24 via Edge Function.
 * Os dados são cacheados por 24h na própria Edge Function.
 */
export const fetchBitrixKanbans = async (): Promise<BitrixKanbansResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-bitrix-kanbans')

    if (error) {
      throw error
    }

    return data as BitrixKanbansResponse
  } catch (err: any) {
    console.error('Erro ao buscar Kanbans do Bitrix24:', err)
    return {
      success: false,
      cached: false,
      error: err.message || 'Falha ao comunicar com o servidor.',
    }
  }
}
