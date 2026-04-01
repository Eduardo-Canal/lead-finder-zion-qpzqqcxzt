import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: clientes, error: errClientes } = await supabase
      .from('clientes')
      .select('id, nome, cnae, curva_abc, uf, segmento, porte')

    if (errClientes) throw errClientes

    const { data: summaries, error: errSummaries } = await supabase
      .from('cnae_summary')
      .select('cnae, descricao, percentual')

    if (errSummaries) throw errSummaries

    const cnaeCount: Record<string, number> = {}
    const groupedClientes: Record<string, any[]> = {}
    
    clientes?.forEach(c => {
      const cnae = c.cnae || 'N/A'
      cnaeCount[cnae] = (cnaeCount[cnae] || 0) + 1
      if (!groupedClientes[cnae]) groupedClientes[cnae] = []
      groupedClientes[cnae].push(c)
    })

    const result = Object.entries(cnaeCount).map(([cnae, count]) => {
      const summary = summaries?.find(s => s.cnae === cnae)
      return {
        cnae,
        count,
        descricao: summary?.descricao || 'Descrição não informada',
        percentual: summary?.percentual || 0,
        clientes: groupedClientes[cnae] || []
      }
    })

    result.sort((a, b) => b.count - a.count)

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
