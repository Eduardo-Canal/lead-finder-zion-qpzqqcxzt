import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

Deno.serve(async () => {
  return new Response(JSON.stringify({ error: 'Not implemented' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 404,
  })
})
