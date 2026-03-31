import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json().catch(() => ({}))
    const { apiKey, cnae, porte, dores } = payload

    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'API Key não fornecida.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = `Atue como um especialista em vendas B2B altamente qualificado. Crie uma abordagem curta e persuasiva (estilo cold mail ou mensagem de LinkedIn) para iniciar uma conversa com uma empresa que possui o seguinte perfil:

- CNAE / Setor de Atuação: ${cnae || 'Não especificado'}
- Porte da Empresa: ${porte || 'Não especificado'}
- Principais dores/desafios enfrentados: ${dores || 'Não especificado'}

A abordagem deve:
1. Ser direta, profissional e não parecer automatizada.
2. Focar em como nossas soluções podem resolver as dores mencionadas.
3. Conter uma chamada para ação (CTA) clara e convidativa no final, sem ser agressiva.
4. Ser dividida em pequenos parágrafos para facilitar a leitura.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 350,
        temperature: 0.7,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const generatedText =
        data.choices && data.choices.length > 0
          ? data.choices[0].message.content
          : 'Nenhuma resposta gerada.'

      return new Response(JSON.stringify({ success: true, result: generatedText }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return new Response(
        JSON.stringify({
          success: false,
          error: errorData.error?.message || 'Erro ao comunicar com a API da OpenAI.',
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno no servidor.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
