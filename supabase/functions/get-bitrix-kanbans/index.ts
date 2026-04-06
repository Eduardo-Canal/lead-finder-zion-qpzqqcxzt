import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  // Lida com CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const cacheKey = 'bitrix_kanbans_deal_stages'

    // 1. Verifica se existe cache válido (menos de 24h)
    const { data: cachedData, error: cacheError } = await supabaseAdmin
      .from('cache_pesquisas')
      .select('resultados, expira_em')
      .eq('chave_cache', cacheKey)
      .maybeSingle()

    if (!cacheError && cachedData && new Date(cachedData.expira_em) > new Date()) {
      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          data: cachedData.resultados,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // 2. Busca na API do Bitrix24 através do Rate Limiter para segurança
    const baseUrl = `https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/crm.status.list.json`
    const rateLimiterUrl = `${supabaseUrl}/functions/v1/bitrix-rate-limiter`

    const rateLimiterRes = await fetch(rateLimiterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        endpoint: baseUrl,
        method: 'GET',
      }),
    })

    const rateLimiterData = await rateLimiterRes.json()

    if (!rateLimiterRes.ok || !rateLimiterData.success) {
      throw new Error(
        rateLimiterData.message || rateLimiterData.error || 'Erro ao buscar status do Bitrix24',
      )
    }

    const rawStatuses = rateLimiterData.data?.result || []

    // 3. Filtra e formata os dados conforme especificado
    const kanbans = rawStatuses
      .filter((s: any) => s.ENTITY_ID && s.ENTITY_ID.includes('DEAL_STAGE'))
      .map((s: any) => {
        let categoryId = '0' // Pipeline padrão (geralmente DEAL_STAGE sem número)
        if (s.ENTITY_ID !== 'DEAL_STAGE') {
          // Extrai o ID da categoria/kanban (ex: DEAL_STAGE_1 -> 1)
          categoryId = s.ENTITY_ID.replace('DEAL_STAGE_', '')
        }

        return {
          ID: s.ID,
          NAME: s.NAME,
          CATEGORY_ID: categoryId,
          STATUS_ID: s.STATUS_ID,
          SORT: s.SORT, // Útil para ordenação na interface
        }
      })
      // Ordena por Kanban e depois por ordem do estágio
      .sort((a: any, b: any) => {
        if (a.CATEGORY_ID !== b.CATEGORY_ID) {
          return parseInt(a.CATEGORY_ID) - parseInt(b.CATEGORY_ID)
        }
        return parseInt(a.SORT) - parseInt(b.SORT)
      })

    // 4. Salva no Cache para evitar repetidas chamadas nas próximas 24h
    const expira_em = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await supabaseAdmin.from('cache_pesquisas').upsert(
      {
        chave_cache: cacheKey,
        resultados: kanbans,
        total_registros: kanbans.length,
        expira_em: expira_em,
        parametros: { source: 'bitrix_api_crm_status_list' },
      },
      { onConflict: 'chave_cache' },
    )

    // 5. Retorna o JSON estruturado para o frontend
    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        data: kanbans,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Edge function errored:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno na sincronização com Bitrix24',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
