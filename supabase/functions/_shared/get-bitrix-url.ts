/**
 * Busca a URL do webhook Bitrix24 da tabela settings.
 * Fallback para URL hardcoded caso nao esteja configurada no banco.
 */
const FALLBACK_URL = 'https://zionlogtec.bitrix24.com.br/rest/5/eiyn7hzhaeu2lcm0/'

export async function getBitrixWebhookUrl(supabaseAdmin: any): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'bitrix24_webhook_url')
      .maybeSingle()

    if (data?.value) {
      let url = typeof data.value === 'string' ? data.value : String(data.value)
      // Remover aspas extras se vier como JSON string
      url = url.replace(/^"+|"+$/g, '')
      if (!url.endsWith('/')) url += '/'
      return url
    }
  } catch (err) {
    console.warn('Erro ao buscar webhook URL do banco, usando fallback:', err)
  }

  return FALLBACK_URL
}
