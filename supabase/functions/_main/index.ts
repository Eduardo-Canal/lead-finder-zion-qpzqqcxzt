/**
 * Edge Runtime Main Service Router
 * Roteia /functions/v1/{function-name} para o handler correto
 * Usado pelo Supabase self-hosted (docker-compose)
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

serve(async (req: Request) => {
  const url = new URL(req.url)
  // Extrai o nome da função do path: /functions/v1/{name}/...
  const match = url.pathname.match(/^\/([^/]+)(?:\/(.*))?$/)
  if (!match) {
    return new Response('Not found', { status: 404 })
  }

  const functionName = match[1]
  const remainingPath = match[2] || ''

  try {
    // Importa dinamicamente o handler da função
    const mod = await import(`../${functionName}/index.ts`)
    if (typeof mod.default === 'function') {
      // Reconstrói a request com o path relativo
      const newUrl = new URL(`/${remainingPath}`, req.url)
      const newReq = new Request(newUrl.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.body,
      })
      return await mod.default(newReq)
    }
    return new Response(`Function '${functionName}' has no default export`, { status: 500 })
  } catch (err) {
    console.error(`Error in function '${functionName}':`, err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
