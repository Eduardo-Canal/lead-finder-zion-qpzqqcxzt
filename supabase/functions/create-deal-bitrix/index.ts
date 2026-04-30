import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { getBitrixWebhookUrl } from '../_shared/get-bitrix-url.ts'

// Detecta celular pelo dígito após o DDD (padrão brasileiro)
// Ex: (27) 95244949 → digits=2795244949 → digits[2]='9' → celular
function isCelular(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) return digits[2] === '9'
  return digits[0] === '9'
}

function phoneType(phone: string): string {
  return isCelular(phone) ? 'MOBILE' : 'WORK'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const payload = await req.json().catch(() => ({}))
    const { lead_id, company_id, kanban_id, stage_id, lead_data, _simulate_test } = payload

    // Detectar se é Lead ou Deal baseado na configuração
    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'bitrix24_defaults')
      .maybeSingle()

    const entityType = (settingsData?.value as any)?.entity_type || 'DEAL'
    const isLeadEntity = entityType === 'LEAD'
    console.log('Entity type:', entityType, 'kanban_id:', kanban_id, 'stage_id:', stage_id)

    if (!kanban_id || !stage_id) {
      return new Response(JSON.stringify({ error: 'Kanban e Fase são obrigatórios.' }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    let leadData = lead_data || {}

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
        lead_id:
          lead_id &&
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            lead_id,
          )
            ? lead_id
            : null,
        company_id: company_id || 888888,
        deal_id: 999999,
        kanban_id: kanban_id,
        stage_id: stage_id,
        status: 'SUCESSO',
        user_id: leadData?.user_id || null,
      })

      return new Response(
        JSON.stringify({
          success: true,
          status: 'SUCESSO',
          deal_id: 999999,
          company_id: company_id || 888888,
          message:
            'Simulação de integração bem-sucedida. Autenticação validada e payload estruturado.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- MONTAR CONTEXTO COMPLETO PARA O BITRIX (DADOS DO LEAD + IA) ---
    const parseJsonSafe = (val: any) => {
      if (!val) return 'Não especificado'
      try {
        if (typeof val === 'string') {
          const parsed = JSON.parse(val)
          if (Array.isArray(parsed)) return parsed.join('\n- ')
          return val
        }
        if (Array.isArray(val)) return val.join('\n- ')
        return JSON.stringify(val)
      } catch {
        return String(val)
      }
    }

    // Montar socios do lead
    const sociosArray: any[] = []
    let sociosText = ''
    if (leadData.socios) {
      try {
        const socios = typeof leadData.socios === 'string' ? JSON.parse(leadData.socios) : leadData.socios
        if (Array.isArray(socios) && socios.length > 0) {
          socios.forEach((s: any) => sociosArray.push(s))
          sociosText = socios.map((s: any) => {
            const nome = s.nome || s.name || 'N/A'
            const qual = s.qualificacao || s.qual || ''
            const faixa = s.faixa_etaria || ''
            const entrada = s.data_entrada || ''
            return `${nome}${qual ? ' (' + qual + ')' : ''}${faixa ? ' — ' + faixa : ''}${entrada ? ' — Entrada: ' + entrada : ''}`
          }).join('\n- ')
        }
      } catch { /* ignore */ }
    }

    // Dados da pesquisa do lead (Casa dos Dados)
    const leadInfoContext = `
[b]DADOS DA PESQUISA (LEAD FINDER ZION)[/b]

[b]Razão Social:[/b] ${leadData.razao_social || 'N/A'}
[b]CNPJ:[/b] ${leadData.cnpj || 'N/A'}
[b]CNAE Principal:[/b] ${leadData.cnae_principal || leadData.cnae_fiscal_principal || 'N/A'}
[b]Porte:[/b] ${leadData.porte || 'N/A'}
[b]Situação:[/b] ${leadData.situacao || leadData.situacao_cadastral || 'N/A'}
[b]Capital Social:[/b] ${leadData.capital_social ? 'R$ ' + Number(leadData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}
[b]Data de Abertura:[/b] ${leadData.data_abertura || 'N/A'}
[b]Município/UF:[/b] ${leadData.municipio || ''} - ${leadData.uf || ''}
[b]E-mail:[/b] ${leadData.email || 'N/A'}
[b]Telefone:[/b] ${leadData.telefone || 'N/A'}
${sociosText ? `\n[b]Sócios:[/b]\n- ${sociosText}` : ''}
`.trim()

    // Abordagem IA
    let approachContext = ''
    if (
      lead_id &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(lead_id)
    ) {
      const { data: approach } = await supabaseAdmin
        .from('lead_abordagens_comerciais')
        .select('*')
        .eq('lead_id', lead_id)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (approach) {
        approachContext = `

[b]INTELIGÊNCIA COMERCIAL (IA)[/b]

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
`.trim()
      }
    }

    // Contexto completo = dados do lead + abordagem IA
    const fullContext = [leadInfoContext, approachContext].filter(Boolean).join('\n\n')

    const baseUrl = await getBitrixWebhookUrl(supabaseAdmin)
    const rateLimiterUrl = `${supabaseUrl}/functions/v1/bitrix-rate-limiter`

    // Implementa retry logic com até 3 tentativas em caso de falha (Resiliência)
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
            body: JSON.stringify({ endpoint: baseUrl + endpoint, method, headers: { 'Content-Type': 'application/json' }, body }),
          })
          const data = await res.json()
          if (!res.ok || !data.success) {
            const errMsg = data.message || data.error || 'Bitrix API error'
            // Lê o tempo exato do rate limiter e aguarda
            if (res.status === 429 || errMsg.includes('Rate limit')) {
              const match = errMsg.match(/em (\d+) segundos/)
              if (match && match[1]) {
                const waitSecs = parseInt(match[1], 10)
                if (waitSecs <= 60) {
                  delay = waitSecs * 1000
                }
              }
            }
            const err = new Error(errMsg) as any
            err.response = data
            throw err
          }
          return data.data
        } catch (error: any) {
          if (attempt > maxRetries) {
            await supabaseAdmin.from('bitrix_api_logs').insert({
              endpoint: baseUrl + endpoint,
              method,
              status_code: 500,
              error_message: error.message,
              request_body: body,
            })
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
        // Buscar por CNPJ formatado no campo correto (UF_CRM_6241B0B267ED3)
        const cnpjBusca = cleanCnpj.length === 14
          ? `${cleanCnpj.slice(0,2)}.${cleanCnpj.slice(2,5)}.${cleanCnpj.slice(5,8)}/${cleanCnpj.slice(8,12)}-${cleanCnpj.slice(12)}`
          : cleanCnpj
        const searchRes = await callBitrix(
          `crm.company.list.json?filter[UF_CRM_6241B0B267ED3]=${encodeURIComponent(cnpjBusca)}&select[]=ID`,
        )
        if (searchRes?.result && searchRes.result.length > 0) {
          finalCompanyId = parseInt(searchRes.result[0].ID)
        }
      }

      if (!finalCompanyId) {
        // Formatar CNPJ com mascara XX.XXX.XXX/XXXX-XX (formato usado pelo Bitrix)
        const formatCnpj = (cnpj: string) => {
          const c = cnpj.replace(/\D/g, '')
          if (c.length !== 14) return c
          return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}`
        }

        const cnpjFormatado = cleanCnpj ? formatCnpj(cleanCnpj) : ''

        // Montar todos os telefones (celular → MOBILE, fixo → WORK)
        const phonesForBitrix: any[] = []
        if (Array.isArray(leadData.telefones_detalhados) && leadData.telefones_detalhados.length > 0) {
          for (const t of leadData.telefones_detalhados) {
            phonesForBitrix.push({ VALUE: t.numero, VALUE_TYPE: phoneType(t.numero) })
          }
        } else if (leadData.telefone) {
          for (const num of leadData.telefone.split(' / ')) {
            const n = num.replace(' [cel]', '').trim()
            if (n) phonesForBitrix.push({ VALUE: n, VALUE_TYPE: phoneType(n) })
          }
        }

        // Montar todos os emails
        const emailsForBitrix: any[] = []
        if (Array.isArray(leadData.emails_detalhados) && leadData.emails_detalhados.length > 0) {
          for (const e of leadData.emails_detalhados) {
            emailsForBitrix.push({ VALUE: e.email, VALUE_TYPE: 'WORK' })
          }
        } else if (leadData.email) {
          for (const em of leadData.email.split(' / ')) {
            if (em.trim()) emailsForBitrix.push({ VALUE: em.trim(), VALUE_TYPE: 'WORK' })
          }
        }

        const companyFields: any = {
          TITLE: razaoSocial,
          ADDRESS_CITY: leadData.municipio || '',
          ADDRESS_PROVINCE: leadData.uf || '',
        }

        if (leadData.cep) companyFields.ADDRESS_POSTAL_CODE = leadData.cep

        // CNPJ
        if (cnpjFormatado) {
          companyFields.UF_CRM_6241B0B267ED3 = cnpjFormatado
          companyFields.UF_CRM_1742992784 = cnpjFormatado
        }

        if (phonesForBitrix.length > 0) companyFields.PHONE = phonesForBitrix
        if (emailsForBitrix.length > 0) companyFields.EMAIL = emailsForBitrix

        // CNAE
        const cnae = leadData.cnae_principal || leadData.cnae_fiscal_principal || ''
        if (cnae) companyFields.UF_CRM_1771423651 = cnae

        // Nome Fantasia
        if (leadData.nome_fantasia) companyFields.UF_CRM_1742990673 = leadData.nome_fantasia

        // Situação cadastral
        const situacao = leadData.situacao || leadData.situacao_cadastral || ''
        if (situacao) {
          companyFields.UF_CRM_1742990227 = situacao
          companyFields.UF_CRM_1742990271 = situacao
        }

        // Porte
        if (leadData.porte) companyFields.UF_CRM_1742990347 = leadData.porte

        // Capital Social
        if (leadData.capital_social) companyFields.REVENUE = leadData.capital_social

        // Data de Abertura
        if (leadData.data_abertura) companyFields.UF_CRM_1742990450 = leadData.data_abertura

        console.log('Creating company with fields:', JSON.stringify(companyFields).slice(0, 500))
        const createRes = await callBitrix(`crm.company.add.json`, 'POST', { fields: companyFields })
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

    // ── Criar contatos para os sócios (Pessoa Física) e vincular à empresa ──
    const contactIds: number[] = []
    if (finalCompanyId && sociosArray.length > 0) {
      for (const socio of sociosArray) {
        if (socio.tipo && socio.tipo !== 'Pessoa Física') continue
        const nomeCompleto: string = socio.nome || ''
        if (!nomeCompleto) continue

        const partes = nomeCompleto.trim().split(/\s+/)
        const firstName = partes[0] || nomeCompleto
        const lastName = partes.slice(1).join(' ') || ''

        const contactFields: any = {
          NAME: firstName,
          LAST_NAME: lastName,
          POST: socio.qualificacao || 'Sócio',
          COMPANY_ID: finalCompanyId,
          SOURCE_ID: 'B24_APPLICATION',
          OPENED: 'Y',
        }

        // Sócios não têm telefone/email individual da API — usa os da empresa como fallback
        if (leadData.telefones_detalhados?.[0]) {
          const t = leadData.telefones_detalhados[0]
          contactFields.PHONE = [{ VALUE: t.numero, VALUE_TYPE: phoneType(t.numero) }]
        } else if (leadData.telefone) {
          const n = leadData.telefone.split(' / ')[0].replace(' [cel]', '').trim()
          if (n) contactFields.PHONE = [{ VALUE: n, VALUE_TYPE: phoneType(n) }]
        }

        if (leadData.emails_detalhados?.[0]) {
          contactFields.EMAIL = [{ VALUE: leadData.emails_detalhados[0].email, VALUE_TYPE: 'WORK' }]
        } else if (leadData.email) {
          contactFields.EMAIL = [{ VALUE: leadData.email.split(' / ')[0].trim(), VALUE_TYPE: 'WORK' }]
        }

        // Campo customizado: faixa etária
        if (socio.faixa_etaria) contactFields.UF_CRM_CONTACT_FAIXA_ETARIA = socio.faixa_etaria

        try {
          const contactRes = await callBitrix('crm.contact.add.json', 'POST', { fields: contactFields })
          const contactId = contactRes?.result ? parseInt(contactRes.result) : null
          if (contactId) {
            contactIds.push(contactId)
            // Vincular contato à empresa
            await callBitrix('crm.company.contact.add.json', 'POST', {
              id: finalCompanyId,
              fields: { CONTACT_ID: contactId, IS_PRIMARY: contactIds.length === 1 ? 'Y' : 'N' },
            })
          }
        } catch (contactErr: any) {
          console.warn(`Falha ao criar contato para sócio ${nomeCompleto}:`, contactErr.message)
        }
      }
    }

    // Monta o TITLE padronizado: [RAZAO SOCIAL] Projeto MLW {ANO}
    const razaoSocial = leadData?.razao_social || 'Lead'
    const anoAtual = new Date().getFullYear()
    const tituloFormatado = `[${razaoSocial}] Projeto MLW ${anoAtual}`

    // Extrair CNPJ limpo
    const cleanCnpjLead = leadData?.cnpj ? String(leadData.cnpj).replace(/\D/g, '') : ''

    // Cria Lead ou Deal no Bitrix24 dependendo da configuração
    let bitrixEndpoint: string
    let entityBody: any

    if (isLeadEntity) {
      // Criar LEAD no Bitrix24
      bitrixEndpoint = 'crm.lead.add.json'
      const fields: any = {
        TITLE: tituloFormatado,
        STATUS_ID: stage_id,
        COMPANY_TITLE: razaoSocial,
        COMPANY_ID: finalCompanyId,
        OPENED: 'Y',
        SOURCE_ID: 'B24_APPLICATION',
        ADDRESS_CITY: leadData?.municipio || '',
        ADDRESS_PROVINCE: leadData?.uf || '',
        UTM_SOURCE: 'Lead Finder Zion',
      }

      // Contatos
      if (leadData?.email) {
        fields.EMAIL = [{ VALUE: leadData.email, VALUE_TYPE: 'WORK' }]
      }
      if (leadData?.telefone) {
        fields.PHONE = [{ VALUE: leadData.telefone, VALUE_TYPE: 'WORK' }]
      }

      // CNPJ (campo customizado texto)
      if (cleanCnpjLead) {
        fields.UF_CRM_LEAD_1644319583429 = cleanCnpjLead
      }

      // Abordagem da IA direto no campo COMMENTS do lead
      if (fullContext) {
        fields.COMMENTS = fullContext
      }

      entityBody = { fields }
    } else {
      // Criar DEAL no Bitrix24
      bitrixEndpoint = 'crm.deal.add.json'
      entityBody = {
        fields: {
          TITLE: tituloFormatado,
          CATEGORY_ID: kanban_id,
          STAGE_ID: stage_id,
          COMPANY_ID: finalCompanyId,
          OPENED: 'Y',
          COMMENTS: fullContext,
        },
      }
    }

    console.log('Creating entity via:', bitrixEndpoint, JSON.stringify(entityBody).slice(0, 500))

    let dealRes
    try {
      dealRes = await callBitrix(bitrixEndpoint, 'POST', entityBody)

      const returnedDealId = dealRes?.result ? parseInt(dealRes.result) : null

      // Vincular contatos dos sócios ao Deal/Lead
      if (returnedDealId && contactIds.length > 0) {
        const linkEndpoint = isLeadEntity ? 'crm.lead.contact.add.json' : 'crm.deal.contact.add.json'
        const entityKey = isLeadEntity ? 'id' : 'id'
        for (const contactId of contactIds) {
          try {
            await callBitrix(linkEndpoint, 'POST', {
              [entityKey]: returnedDealId,
              fields: { CONTACT_ID: contactId },
            })
          } catch (linkErr: any) {
            console.warn(`Falha ao vincular contato ${contactId} ao deal ${returnedDealId}:`, linkErr.message)
          }
        }
      }

      // Adicionar abordagem como COMENTÁRIO no Lead/Deal criado
      if (returnedDealId && fullContext) {
        try {
          // ENTITY_TYPE_ID: 1=Lead, 2=Deal, 3=Contact, 4=Company
          const entityTypeId = isLeadEntity ? 1 : 2
          await callBitrix('crm.timeline.comment.add.json', 'POST', {
            fields: {
              ENTITY_ID: returnedDealId,
              ENTITY_TYPE_ID: entityTypeId,
              COMMENT: fullContext,
            },
          })
          console.log('Comentário de abordagem adicionado com sucesso ao entity', entityTypeId, returnedDealId)
        } catch (commentErr: any) {
          console.warn('Falha ao adicionar comentário:', commentErr.message)
          // Fallback: tentar atualizar o campo COMMENTS diretamente
          try {
            const updateEndpoint = isLeadEntity ? 'crm.lead.update.json' : 'crm.deal.update.json'
            await callBitrix(updateEndpoint, 'POST', {
              id: returnedDealId,
              fields: { COMMENTS: fullContext },
            })
            console.log('Comentário adicionado via update do campo COMMENTS')
          } catch (updateErr: any) {
            console.warn('Fallback COMMENTS também falhou:', updateErr.message)
          }
        }
      }

      // Registra o deal_id retornado na tabela 'leads_bitrix_sync' para auditoria com response e timestamp
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
          kanban_id: kanban_id,
          stage_id: stage_id,
          status: 'SUCESSO',
          user_id: leadData?.user_id || null,
        })
      }

      // Retorna deal_id e status da operação
      return new Response(
        JSON.stringify({
          success: true,
          status: 'SUCESSO',
          deal_id: returnedDealId,
          company_id: finalCompanyId,
          approach_included: !!fullContext,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    } catch (dealError: any) {
      // Captura e auditoria correta em caso de falha no envio do Negócio, incluindo raw response error
      const errorLog = dealError.stack || dealError.message || String(dealError)

      if (
        lead_id &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          lead_id,
        )
      ) {
        await supabaseAdmin.from('leads_bitrix_sync').insert({
          lead_id: lead_id,
          company_id: finalCompanyId,
          kanban_id: kanban_id,
          stage_id: stage_id,
          status: 'ERRO',
          error_message: dealError.message,
          error_log: errorLog,
          user_id: leadData?.user_id || null,
        })
      }
      throw dealError
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, status: 'ERRO', error: error.message }), {
      status: 200,
      headers: corsHeaders,
    })
  }
})
