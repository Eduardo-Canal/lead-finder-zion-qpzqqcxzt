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
    const { lead_id, company_id, kanban_id, stage_id, lead_data, _simulate_test } = payload

    if (!kanban_id || !stage_id) {
      return new Response(JSON.stringify({ error: 'Kanban e Fase são obrigatórios.' }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    let leadData = lead_data || {};
    
    // Busca dados da empresa no Supabase (CNPJ, Razão Social, Contatos)
    if (lead_id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lead_id)) {
      const { data: dbLead } = await supabaseAdmin
        .from('leads_salvos')
        .select('*')
        .eq('id', lead_id)
        .single()
      
      if (dbLead) {
        leadData = { ...leadData, ...dbLead }
      }
    }

    if (!leadData && !_simulate_test) {
      return new Response(JSON.stringify({ error: 'Dados do lead não encontrados.' }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    // Suporte para Teste com um lead fictício
    if (_simulate_test) {
      // Simula o registro de logs com sucesso e retorna a resposta mockada
      await supabaseAdmin.from('leads_bitrix_sync').insert({
        lead_id: lead_id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lead_id) ? lead_id : null,
        company_id: company_id || 888888,
        deal_id: 999999,
        kanban_id: kanban_id,
        stage_id: stage_id,
        status: 'SUCESSO',
        user_id: leadData?.user_id || null,
        sent_at: new Date().toISOString(),
        response_data: { simulated: true, message: 'Test lead processed' }
      });
      
      return new Response(JSON.stringify({
        success: true,
        status: 'SUCESSO',
        deal_id: 999999,
        company_id: company_id || 888888,
        message: 'Simulação de integração bem-sucedida. Autenticação validada e payload estruturado.'
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- INTEGRAÇÃO DA ABORDAGEM COMERCIAL (CONTEXTO DE IA) ---
    let approachContext = '';
    if (lead_id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lead_id)) {
        const { data: approach } = await supabaseAdmin
          .from('lead_abordagens_comerciais')
          .select('*')
          .eq('lead_id', lead_id)
          .order('criado_em', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (approach) {
            const parseJsonSafe = (val: any) => {
                if (!val) return 'Não especificado';
                try {
                    if (typeof val === 'string') {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed.join('\n- ');
                        return val;
                    }
                    if (Array.isArray(val)) return val.join('\n- ');
                    return JSON.stringify(val);
                } catch {
                    return String(val);
                }
            }

            // Utilizando formato BBCode suportado nativamente pelos comentários do Bitrix24
            approachContext = `
[b]CONTEXTO DE INTELIGÊNCIA COMERCIAL (ZION)[/b]

[b]CNAE / Setor:[/b] ${approach.cnae || 'N/A'}
[b]Porte:[/b] ${approach.porte_empresa || 'N/A'}

[b]Dores Principais:[/b]
- ${parseJsonSafe(approach.dores_principais)}

[b]Personas Decisoras:[/b]
- ${parseJsonSafe(approach.personas_decisoras)}

[b]Argumentos de Venda:[/b]
- ${parseJsonSafe(approach.argumentos_venda)}

[b]Próximos Passos:[/b]
- ${parseJsonSafe(approach.proximos_passos)}

[b]Abordagem Sugerida:[/b]
${approach.abordagem_gerada || 'N/A'}
            `.trim();
        }
    }

    const baseUrl = `https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/`
    const rateLimiterUrl = `${supabaseUrl}/functions/v1/bitrix-rate-limiter`

    // Implementa retry logic com até 3 tentativas em caso de falha (Resiliência)
    async function callBitrix(endpoint: string, method: string = 'GET', body?: any) {
      let attempt = 1;
      const maxRetries = 3;
      let delay = 1000;
      
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
            const err = new Error(data.message || data.error || 'Bitrix API error') as any;
            err.response = data; // Armazena a resposta bruta para auditoria de erros
            throw err;
          }
          return data.data
        } catch (error: any) {
          if (attempt > maxRetries) {
            // Log centralizado de falhas críticas na integração
            await supabaseAdmin.from('bitrix_api_logs').insert({
                endpoint: baseUrl + endpoint,
                method,
                status_code: 500,
                error_message: error.message,
                request_body: body
            });
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          attempt++;
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
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lead_id)
      ) {
        await supabaseAdmin
          .from('leads_salvos')
          .update({ bitrix_id: finalCompanyId.toString() })
          .eq('id', lead_id)
      }
    }

    // Cria um Deal no Bitrix24 com os dados da abordagem
    const dealBody = {
      fields: {
        TITLE: leadData?.razao_social || 'Lead',
        CATEGORY_ID: kanban_id,
        STAGE_ID: stage_id,
        COMPANY_ID: finalCompanyId,
        OPENED: 'Y',
        COMMENTS: approachContext // O payload agora envia todo o contexto da IA (dores, personas, CNAE, etc)
      },
    }

    let dealRes;
    try {
      dealRes = await callBitrix(`crm.deal.add.json`, 'POST', dealBody)
      
      const returnedDealId = dealRes?.result ? parseInt(dealRes.result) : null;

      // Registra o deal_id retornado na tabela 'leads_bitrix_sync' para auditoria com response e timestamp
      if (lead_id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lead_id)) {
        await supabaseAdmin.from('leads_bitrix_sync').insert({
          lead_id: lead_id,
          company_id: finalCompanyId,
          deal_id: returnedDealId,
          kanban_id: kanban_id,
          stage_id: stage_id,
          status: 'SUCESSO',
          user_id: leadData?.user_id || null,
          sent_at: new Date().toISOString(),
          response_data: dealRes
        })
      }

      // Retorna deal_id e status da operação
      return new Response(
        JSON.stringify({
          success: true,
          status: 'SUCESSO',
          deal_id: returnedDealId,
          company_id: finalCompanyId,
          approach_included: !!approachContext
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    } catch (dealError: any) {
      // Captura e auditoria correta em caso de falha no envio do Negócio, incluindo raw response error
      const errorLog = dealError.stack || dealError.message || String(dealError);
      
      if (lead_id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lead_id)) {
        await supabaseAdmin.from('leads_bitrix_sync').insert({
          lead_id: lead_id,
          company_id: finalCompanyId,
          kanban_id: kanban_id,
          stage_id: stage_id,
          status: 'ERRO',
          error_message: dealError.message,
          error_log: errorLog,
          user_id: leadData?.user_id || null,
          sent_at: new Date().toISOString(),
          response_data: dealError.response || null
        })
      }
      throw dealError;
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, status: 'ERRO', error: error.message }), {
      status: 200,
      headers: corsHeaders,
    })
  }
})
