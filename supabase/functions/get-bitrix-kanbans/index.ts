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
    const baseUrlDeals = `https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/crm.status.list.json`
    const baseUrlLeads = `https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/crm.status.list.json?filter[ENTITY_ID]=STATUS`

    const rateLimiterUrl = `${supabaseUrl}/functions/v1/bitrix-rate-limiter`

    // Buscar status de deals
    const rateLimiterResDeals = await fetch(rateLimiterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        endpoint: baseUrlDeals,
      }),
    })

    const rateLimiterDataDeals = await rateLimiterResDeals.json()

    if (!rateLimiterResDeals.ok || !rateLimiterDataDeals.success) {
      throw new Error(
        rateLimiterDataDeals.message || rateLimiterDataDeals.error || 'Erro ao buscar status de deals do Bitrix24',
      )
    }

    // Buscar status de leads
    const rateLimiterResLeads = await fetch(rateLimiterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        endpoint: baseUrlLeads,
      }),
    })

    const rateLimiterDataLeads = await rateLimiterResLeads.json()

    if (!rateLimiterResLeads.ok || !rateLimiterDataLeads.success) {
      throw new Error(
        rateLimiterDataLeads.message || rateLimiterDataLeads.error || 'Erro ao buscar status de leads do Bitrix24',
      )
    }

    const rawStatusesDeals = rateLimiterDataDeals.data?.result || []
    const rawStatusesLeads = rateLimiterDataLeads.data?.result || []
        method: 'GET',
      }),
    })

    const rateLimiterData = await rateLimiterRes.json()

    if (!rateLimiterRes.ok || !rateLimiterData.success) {
      throw new Error(
        rateLimiterData.message || rateLimiterData.error || 'Erro ao buscar status do Bitrix24',
      )
    }

    const rawStatusesDeals = rateLimiterDataDeals.data?.result || []
    const rawStatusesLeads = rateLimiterDataLeads.data?.result || []

    // 3. Filtra e formata os dados conforme especificado
    const processStatuses = (statuses: any[], entityType: string) => {
      return statuses
        .filter((s: any) => s.ENTITY_ID && (
          (entityType === 'DEAL' && s.ENTITY_ID.includes('DEAL_STAGE')) ||
          (entityType === 'LEAD' && s.ENTITY_ID === 'STATUS')
        ))
        .map((s: any) => {
          let categoryId = '0' // Pipeline padrão
          if (entityType === 'DEAL' && s.ENTITY_ID !== 'DEAL_STAGE') {
            categoryId = s.ENTITY_ID.replace('DEAL_STAGE_', '')
          } else if (entityType === 'LEAD') {
            categoryId = 'LEAD' // Identificador especial para leads
          }

          return {
            ID: s.ID,
            NAME: s.NAME,
            CATEGORY_ID: categoryId,
            STATUS_ID: s.STATUS_ID,
            SORT: s.SORT,
            ENTITY_TYPE: entityType, // DEAL ou LEAD
          }
        })
    }

    const kanbansDeals = processStatuses(rawStatusesDeals, 'DEAL')
    const kanbansLeads = processStatuses(rawStatusesLeads, 'LEAD')
    const kanbans = [...kanbansDeals, ...kanbansLeads]

    // Ordena por tipo de entidade, depois por Kanban e ordem do estágio
    .sort((a: any, b: any) => {
      // Primeiro leads, depois deals
      if (a.ENTITY_TYPE !== b.ENTITY_TYPE) {
        return a.ENTITY_TYPE === 'LEAD' ? -1 : 1
      }
      // Depois por categoria
      if (a.CATEGORY_ID !== b.CATEGORY_ID) {
        if (a.CATEGORY_ID === 'LEAD') return -1
        if (b.CATEGORY_ID === 'LEAD') return 1
        return parseInt(a.CATEGORY_ID) - parseInt(b.CATEGORY_ID)
      }
      // Por último por ordem do estágio
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
