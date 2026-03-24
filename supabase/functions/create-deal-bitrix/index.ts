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

    let leadData = lead_data

    // Busca dados da empresa no Supabase (CNPJ, Razão Social, Contatos)
    if (
      lead_id &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lead_id)
    ) {
      const { data: dbLead } = await supabaseAdmin
        .from('leads_salvos')
        .select('*')
        .eq('id', lead_id)
        .single()

      if (dbLead) {
        leadData = dbLead
      }
    }

    if (!leadData) {
      return new Response(JSON.stringify({ error: 'Dados do lead não encontrados.' }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    const baseUrl = `https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/`
    const rateLimiterUrl = `${supabaseUrl}/functions/v1/bitrix-rate-limiter`

    // Implementa retry logic com até 3 tentativas em caso de falha
    async function callBitrix(endpoint: string, method: string = 'GET', body?: any) {
      let attempt = 1
      const maxRetries = 3
      let delay = 1000

      while (attempt <= maxRetries + 1) {
        try {
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
        } catch (error: any) {
          if (attempt > maxRetries) {
            throw error
          }
          await new Promise((resolve) => setTimeout(resolve, delay))
          delay *= 2
          attempt++
        }
      }
    }

    let finalCompanyId = company_id

    if (!finalCompanyId) {
      const cleanCnpj = leadData.cnpj ? leadData.cnpj.replace(/\D/g, '') : ''
      const razaoSocial = leadData.razao_social || 'Empresa Sem Nome'

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
            EMAIL: leadData.email ? [{ VALUE: leadData.email, VALUE_TYPE: 'WORK' }] : [],
            PHONE: leadData.telefone ? [{ VALUE: leadData.telefone, VALUE_TYPE: 'WORK' }] : [],
            ADDRESS_CITY: leadData.municipio || '',
            ADDRESS_PROVINCE: leadData.uf || '',
          },
        }
        const createRes = await callBitrix(`crm.company.add.json`, 'POST', createBody)
        finalCompanyId = parseInt(createRes?.result)
      }

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

    // Cria um Deal no Bitrix24 com nome = Razão Social, empresa_id = company_id, stage_id = stage_id pré-configurado
    const dealBody = {
      fields: {
        TITLE: leadData?.razao_social || 'Lead',
        CATEGORY_ID: kanban_id,
        STAGE_ID: stage_id,
        COMPANY_ID: finalCompanyId,
        OPENED: 'Y',
      },
    }

    let dealRes
    try {
      dealRes = await callBitrix(`crm.deal.add.json`, 'POST', dealBody)

      const returnedDealId = dealRes?.result ? parseInt(dealRes.result) : null

      // Registra o deal_id retornado na tabela 'leads_bitrix_sync' para auditoria
      if (
        lead_id &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          lead_id,
        )
      ) {
        await supabaseAdmin.from('leads_bitrix_sync').insert({
          lead_id: lead_id,
          company_id: finalCompanyId,
          deal_id: returnedDealId,
          status: 'success',
        })
      }

      // Retorna deal_id e status da operação em JSON
      return new Response(
        JSON.stringify({
          success: true,
          status: 'success',
          deal_id: dealRes?.result,
          company_id: finalCompanyId,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    } catch (dealError: any) {
      if (
        lead_id &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          lead_id,
        )
      ) {
        await supabaseAdmin.from('leads_bitrix_sync').insert({
          lead_id: lead_id,
          company_id: finalCompanyId,
          status: 'error',
          error_log: dealError.message,
        })
      }
      throw dealError
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, status: 'error', error: error.message }), {
      status: 200,
      headers: corsHeaders,
    })
  }
})
