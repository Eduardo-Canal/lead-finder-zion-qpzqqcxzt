import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  // CORS pré-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Permitir GET (chamado pelo frontend) ou POST (chamado pelo supabase.functions.invoke sem method explícito)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Apenas requisições GET ou POST são permitidas.',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Aplicando os DOIS filtros solicitados:
    // 1) filter[UF_CRM_1B70E8F8]=675 (Apenas clientes Zion)
    // 2) select[]=... (Filtro de colunas para forçar o Bitrix a retornar os Custom Fields corretamente)
    const selectFields = [
      'ID',
      'TITLE',
      'UF_CRM_1742992784',
      'UF_CRM_1771423651',
      'EMAIL',
      'PHONE',
      'ADDRESS_CITY',
      'ADDRESS_PROVINCE',
    ]
    const selectQuery = selectFields.map((f) => `select[]=${f}`).join('&')
    const endpoint = `https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/crm.company.list.json?filter[UF_CRM_1B70E8F8]=675&${selectQuery}`

    const rateLimiterUrl = `${supabaseUrl}/functions/v1/bitrix-rate-limiter`

    // 1. Chamar o rate limiter existente para fazer a requisição de forma segura
    const rateLimiterRes = await fetch(rateLimiterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        endpoint,
        method: 'GET',
      }),
    })

    const rateLimiterData = await rateLimiterRes.json()

    // 2. Verificar se o rate limit foi atingido ou se houve erro na requisição
    if (!rateLimiterRes.ok || !rateLimiterData.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            rateLimiterData.message ||
            rateLimiterData.error ||
            'Erro ao comunicar com a API do Bitrix via Rate Limiter',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const bitrixData = rateLimiterData.data
    const companies = bitrixData?.result || []

    if (!Array.isArray(companies)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Formato de resposta inesperado do Bitrix',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Helper para extrair o valor principal de campos de contato do Bitrix
    const getPrimaryValue = (field: any) => {
      if (Array.isArray(field) && field.length > 0) {
        return field[0].VALUE || ''
      }
      if (typeof field === 'string') return field
      return ''
    }

    // 3. Mapear e extrair os dados solicitados, garantindo que o CNAE seja lido corretamente
    const extractedClients = companies
      .map((c: any) => {
        return {
          ID: parseInt(c.ID, 10) || 0,
          TITLE: c.TITLE || '',
          UF_CRM_1742992784: c.UF_CRM_1742992784 || '',
          UF_CRM_1771423651: c.UF_CRM_1771423651 || '',
          EMAIL: getPrimaryValue(c.EMAIL),
          TELEFONE: getPrimaryValue(c.PHONE || c.TELEFONE),
          ADDRESS_CITY: c.ADDRESS_CITY || '',
          ADDRESS_PROVINCE: c.ADDRESS_PROVINCE || '',
        }
      })
      .filter((c: any) => c.ID > 0)

    // 4. Salvar (Upsert) os dados extraídos no banco de dados local
    const dbClients = extractedClients.map((c: any) => ({
      bitrix_id: c.ID,
      company_name: c.TITLE,
      cnpj: c.UF_CRM_1742992784,
      cnae_principal: c.UF_CRM_1771423651,
      email: c.EMAIL,
      phone: c.TELEFONE,
      city: c.ADDRESS_CITY,
      state: c.ADDRESS_PROVINCE,
      synced_at: new Date().toISOString(),
    }))

    if (dbClients.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('bitrix_clients_zion')
        .upsert(dbClients, { onConflict: 'bitrix_id' })

      if (upsertError) {
        console.error('Erro ao salvar no banco:', upsertError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Erro ao salvar clientes no banco de dados local: ' + upsertError.message,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    // 5. Retornar JSON com o sucesso e a lista dos clientes processados
    return new Response(
      JSON.stringify({
        success: true,
        clients: extractedClients,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno na Edge Function',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
