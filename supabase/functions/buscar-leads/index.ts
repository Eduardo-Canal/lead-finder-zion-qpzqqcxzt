import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    const { cnaes, uf, municipio, porte, situacao_cadastral, capital_social_minimo } =
      await req.json()

    let query = supabaseClient.from('empresas_rfb').select('*').limit(100)

    if (cnaes && Array.isArray(cnaes) && cnaes.length > 0) {
      query = query.in('cnae_fiscal_principal', cnaes)
    }
    if (uf) {
      query = query.eq('uf', uf)
    }
    if (municipio) {
      query = query.ilike('municipio', `%${municipio}%`)
    }
    if (porte) {
      query = query.eq('porte', porte)
    }
    if (situacao_cadastral) {
      query = query.eq('situacao_cadastral', situacao_cadastral)
    }
    if (capital_social_minimo !== undefined && capital_social_minimo !== null) {
      query = query.gte('capital_social', Number(capital_social_minimo))
    }

    const { data, error } = await query

    if (error) throw error

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
