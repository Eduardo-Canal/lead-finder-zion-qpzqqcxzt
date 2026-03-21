import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  // CORS pré-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    // Filtros e colunas selecionadas, incluindo o Segmento (UF_CRM_F56E1FF4)
    const selectFields = [
      'ID',
      'TITLE',
      'UF_CRM_1742992784',
      'UF_CRM_1771423651',
      'UF_CRM_F56E1FF4',
      'EMAIL',
      'PHONE',
      'ADDRESS_CITY',
      'ADDRESS_PROVINCE',
    ]
    const selectQuery = selectFields.map((f) => `select[]=${f}`).join('&')
    const baseUrl = `https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/crm.company.list.json?filter[UF_CRM_1B70E8F8]=675&${selectQuery}`

    const rateLimiterUrl = `${supabaseUrl}/functions/v1/bitrix-rate-limiter`

    let allCompanies: any[] = []
    let nextStart = 0
    let hasMore = true

    // 1. Loop de paginação para garantir que todos os clientes Zion sejam extraídos
    while (hasMore) {
      const endpoint = nextStart > 0 ? `${baseUrl}&start=${nextStart}` : baseUrl

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

      // Verificar se houve erro ou rate limit atingido
      if (!rateLimiterRes.ok || !rateLimiterData.success) {
        if (allCompanies.length > 0) {
          // Se já extraímos dados antes do rate limit agir, vamos salvar o que conseguimos
          console.warn(
            'Rate limit ou erro atingido durante a paginação. Interrompendo e salvando parciais.',
          )
          break
        }
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

      if (Array.isArray(companies)) {
        allCompanies = allCompanies.concat(companies)
      }

      if (bitrixData?.next) {
        nextStart = bitrixData.next
      } else {
        hasMore = false
      }
    }

    const getPrimaryValue = (field: any) => {
      if (Array.isArray(field) && field.length > 0) {
        return field[0].VALUE || ''
      }
      if (typeof field === 'string') return field
      return ''
    }

    // 2. Extrair dados, garantindo que registros sem CNAE sejam mantidos
    const extractedClients = allCompanies
      .map((c: any) => {
        return {
          ID: parseInt(c.ID, 10) || 0,
          TITLE: c.TITLE || '',
          UF_CRM_1742992784: c.UF_CRM_1742992784 || '',
          UF_CRM_1771423651: c.UF_CRM_1771423651 || '', // CNAE
          UF_CRM_F56E1FF4: c.UF_CRM_F56E1FF4 || '', // Segmento
          EMAIL: getPrimaryValue(c.EMAIL),
          TELEFONE: getPrimaryValue(c.PHONE || c.TELEFONE),
          ADDRESS_CITY: c.ADDRESS_CITY || '',
          ADDRESS_PROVINCE: c.ADDRESS_PROVINCE || '',
        }
      })
      .filter((c: any) => c.ID > 0)

    // 3. Montar a carga para upsert com o novo campo "segmento"
    const dbClients = extractedClients.map((c: any) => ({
      bitrix_id: c.ID,
      company_name: c.TITLE,
      cnpj: c.UF_CRM_1742992784,
      cnae_principal: c.UF_CRM_1771423651,
      segmento: c.UF_CRM_F56E1FF4,
      email: c.EMAIL,
      phone: c.TELEFONE,
      city: c.ADDRESS_CITY,
      state: c.ADDRESS_PROVINCE,
      synced_at: new Date().toISOString(),
    }))

    // 4. Salvar (Upsert) os dados extraídos no banco de dados local em lotes de 500
    if (dbClients.length > 0) {
      const chunkSize = 500
      for (let i = 0; i < dbClients.length; i += chunkSize) {
        const chunk = dbClients.slice(i, i + chunkSize)

        const { error: upsertError } = await supabaseAdmin
          .from('bitrix_clients_zion')
          .upsert(chunk, { onConflict: 'bitrix_id' })

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
    }

    // 5. Retornar JSON com o sucesso, a contagem dinâmica e a lista dos clientes processados
    return new Response(
      JSON.stringify({
        success: true,
        total_clients: extractedClients.length,
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
