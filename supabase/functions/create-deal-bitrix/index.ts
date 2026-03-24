import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const payload = await req.json().catch(() => ({}))
    const { lead_id, company_id, kanban_id, stage_id, lead_data } = payload

    if (!kanban_id || !stage_id) {
      return new Response(JSON.stringify({ error: 'Kanban e Fase são obrigatórios.' }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    const baseUrl = `https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/`
    const rateLimiterUrl = `${supabaseUrl}/functions/v1/bitrix-rate-limiter`

    async function callBitrix(endpoint: string, method: string = 'GET', body?: any) {
      const res = await fetch(rateLimiterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ endpoint: baseUrl + endpoint, method, body }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Bitrix API error')
      }
      return data.data
    }

    let finalCompanyId = company_id

    if (!finalCompanyId && lead_data) {
      const cleanCnpj = lead_data.cnpj ? lead_data.cnpj.replace(/\D/g, '') : ''
      const razaoSocial = lead_data.razao_social || 'Empresa Sem Nome'

      if (cleanCnpj) {
        const searchRes = await callBitrix(
          `crm.company.list.json?filter[UF_CRM_1742992784]=${cleanCnpj}&select[]=ID`,
        )
        if (searchRes?.result && searchRes.result.length > 0) {
          finalCompanyId = parseInt(searchRes.result[0].ID)
        }
      }

      if (!finalCompanyId) {
        const createBody = {
          fields: {
            TITLE: razaoSocial,
            UF_CRM_1742992784: cleanCnpj,
            EMAIL: lead_data.email ? [{ VALUE: lead_data.email, VALUE_TYPE: 'WORK' }] : [],
            PHONE: lead_data.telefone ? [{ VALUE: lead_data.telefone, VALUE_TYPE: 'WORK' }] : [],
            ADDRESS_CITY: lead_data.municipio || '',
            ADDRESS_PROVINCE: lead_data.uf || '',
          },
        }
        const createRes = await callBitrix(`crm.company.add.json`, 'POST', createBody)
        finalCompanyId = parseInt(createRes?.result)
      }

      // Save the mapped bitrix_id back to leads_salvos if it is a valid UUID
      if (
        finalCompanyId &&
        lead_id &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          lead_id,
        )
      ) {
        await supabaseAdmin
          .from('leads_salvos')
          .update({ bitrix_id: finalCompanyId.toString() })
          .eq('id', lead_id)
      }
    }

    const dealBody = {
      fields: {
        TITLE: `Oportunidade - ${lead_data?.razao_social || 'Lead'}`,
        CATEGORY_ID: kanban_id,
        STAGE_ID: stage_id,
        COMPANY_ID: finalCompanyId,
        OPENED: 'Y',
      },
    }

    const dealRes = await callBitrix(`crm.deal.add.json`, 'POST', dealBody)

    return new Response(
      JSON.stringify({
        success: true,
        deal_id: dealRes?.result,
        company_id: finalCompanyId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: corsHeaders,
    })
  }
})
