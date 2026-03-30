import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Bypass RLS para varredura completa da base na Edge Function
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 1. Busque todos os clientes da tabela carteira_clientes
    const { data: carteira, error: cartError } = await supabaseAdmin
      .from('carteira_clientes')
      .select('*')
      
    if (cartError) throw cartError

    if (!carteira || carteira.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhum dado na carteira de clientes para analisar.',
        analise_cnae: [],
        clusters: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Otimização: buscar UFs dos leads correspondentes
    const empresaIds = carteira.map(c => c.empresa_id).filter(Boolean)
    let leadsMap: Record<string, any> = {}
    
    if (empresaIds.length > 0) {
        const { data: leads } = await supabaseAdmin
          .from('leads_salvos')
          .select('id, uf, municipio')
          .in('id', empresaIds)
          
        if (leads) {
            leadsMap = leads.reduce((acc: any, l: any) => ({ ...acc, [l.id]: l }), {})
        }
    }

    // 2. Calcule ticket médio por CNAE, taxa de sucesso, distribuição geográfica
    const cnaeStats: Record<string, any> = {}
    const segmentStats: Record<string, any> = {}

    for (const cliente of carteira) {
        const cnae = cliente.cnae
        if (!cnae) continue

        if (!cnaeStats[cnae]) {
            cnaeStats[cnae] = {
                cnae,
                total_clientes: 0,
                clientes_ativos: 0,
                soma_ticket: 0,
                geo: {} as Record<string, number>,
                segmento: cliente.segmento || 'Não classificado'
            }
        }

        cnaeStats[cnae].total_clientes++
        
        if (cliente.status_cliente === 'Ativo') {
            cnaeStats[cnae].clientes_ativos++
        }
        
        if (cliente.ticket_medio) {
            cnaeStats[cnae].soma_ticket += Number(cliente.ticket_medio)
        }

        const uf = leadsMap[cliente.empresa_id]?.uf || 'ND'
        cnaeStats[cnae].geo[uf] = (cnaeStats[cnae].geo[uf] || 0) + 1

        // Agrupamento por segmento para criação dos Clusters Estratégicos
        const seg = cliente.segmento || 'Não classificado'
        if (!segmentStats[seg]) {
            segmentStats[seg] = { cnaes: new Set<string>(), total: 0, score: 0 }
        }
        
        segmentStats[seg].cnaes.add(cnae)
        segmentStats[seg].total++
        if (cliente.ticket_medio) {
            segmentStats[seg].score += Number(cliente.ticket_medio)
        }
    }

    const analiseUpserts = []
    
    for (const cnae in cnaeStats) {
        const stat = cnaeStats[cnae]
        const ticket_medio_cnae = stat.total_clientes > 0 ? stat.soma_ticket / stat.total_clientes : 0
        const taxa_sucesso = stat.total_clientes > 0 ? (stat.clientes_ativos / stat.total_clientes) * 100 : 0
        
        // Fórmula de Fit Operacional = (Taxa de Sucesso ponderada) + (Ticket Médio Normalizado)
        const fit_operacional_score = (taxa_sucesso * 0.6) + (Math.min(ticket_medio_cnae / 500, 100) * 0.4)

        analiseUpserts.push({
            cnae,
            nome_cnae: `Setor: ${stat.segmento}`,
            total_clientes: stat.total_clientes,
            ticket_medio_cnae,
            taxa_sucesso,
            distribuicao_geografica: stat.geo,
            fit_operacional_score: Number(fit_operacional_score.toFixed(2)),
            updated_at: new Date().toISOString()
        })
    }

    // 4. Atualize a tabela analise_cnae com os cálculos
    if (analiseUpserts.length > 0) {
        const { error: upsertError } = await supabaseAdmin
          .from('analise_cnae')
          .upsert(analiseUpserts, { onConflict: 'cnae' })
          
        if (upsertError) throw new Error(`Erro ao atualizar analise_cnae: ${upsertError.message}`)
    }

    // 3. Identifique clusters estratégicos (CNAEs com alto potencial)
    const clustersUpserts = []
    
    for (const seg in segmentStats) {
        const mediaSegmento = segmentStats[seg].total > 0 ? segmentStats[seg].score / segmentStats[seg].total : 0
        
        clustersUpserts.push({
            cluster_name: `Cluster ${seg}`,
            cnae_list: Array.from(segmentStats[seg].cnaes),
            total_empresas: segmentStats[seg].total,
            oportunidade_score: Number(mediaSegmento.toFixed(2)),
            prioridade: mediaSegmento > 5000 ? 'Alta' : (mediaSegmento > 2000 ? 'Média' : 'Baixa'),
            updated_at: new Date().toISOString()
        })
    }

    // Limpa clusters antigos e insere os novos recalculos
    await supabaseAdmin.from('clusters_estrategicos').delete().not('id', 'is', null)
    
    if (clustersUpserts.length > 0) {
        const { error: clusterError } = await supabaseAdmin
          .from('clusters_estrategicos')
          .insert(clustersUpserts)
          
        if (clusterError) throw new Error(`Erro ao atualizar clusters_estrategicos: ${clusterError.message}`)
    }

    // 5. Retorne os dados em JSON para o frontend consumir
    return new Response(JSON.stringify({
        success: true,
        analise_cnae: analiseUpserts,
        clusters: clustersUpserts
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
    })
  }
})
