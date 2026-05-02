-- ============================================================
-- MÓDULO OUTBOUND WHATSAPP — integração com automacao_config
-- Adiciona configuração de disparo WhatsApp por campanha e
-- rastreamento de status do contato em leads_automacao_pendentes.
-- ============================================================

-- ── 1. Colunas WhatsApp em automacao_config ──────────────────
ALTER TABLE public.automacao_config
  ADD COLUMN IF NOT EXISTS whatsapp_ativo       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_template    TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_delay_min   INT NOT NULL DEFAULT 45,   -- segundos
  ADD COLUMN IF NOT EXISTS whatsapp_delay_max   INT NOT NULL DEFAULT 90,   -- segundos
  ADD COLUMN IF NOT EXISTS whatsapp_limite_diario INT NOT NULL DEFAULT 50; -- contatos únicos/dia

COMMENT ON COLUMN public.automacao_config.whatsapp_ativo
  IS 'Habilita disparo automático de WhatsApp para leads desta campanha';
COMMENT ON COLUMN public.automacao_config.whatsapp_template
  IS 'Template da mensagem. Variáveis: {{nome}}, {{empresa}}, {{cnpj}}, {{municipio}}, {{uf}}, {{porte}}, {{abordagem}}';
COMMENT ON COLUMN public.automacao_config.whatsapp_delay_min
  IS 'Segundos mínimos de espera entre envios consecutivos (anti-ban)';
COMMENT ON COLUMN public.automacao_config.whatsapp_delay_max
  IS 'Segundos máximos de espera entre envios consecutivos (anti-ban)';
COMMENT ON COLUMN public.automacao_config.whatsapp_limite_diario
  IS 'Máximo de contatos únicos por dia por campanha (anti-ban)';

-- ── 2. Colunas de rastreamento em leads_automacao_pendentes ──
ALTER TABLE public.leads_automacao_pendentes
  ADD COLUMN IF NOT EXISTS whatsapp_status TEXT
    CHECK (whatsapp_status IN ('na_fila', 'enviado', 'respondido', 'agendado', 'erro')),
  ADD COLUMN IF NOT EXISTS whatsapp_phone  TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_enviado_em TIMESTAMPTZ;

COMMENT ON COLUMN public.leads_automacao_pendentes.whatsapp_status
  IS 'NULL = não enfileirado; na_fila = aguardando; enviado = enviado; respondido = lead respondeu; agendado = agendamento confirmado; erro = falha';
COMMENT ON COLUMN public.leads_automacao_pendentes.whatsapp_phone
  IS 'Telefone usado para o disparo WhatsApp (limpo, apenas dígitos)';

CREATE INDEX IF NOT EXISTS idx_leads_automacao_whatsapp_status
  ON public.leads_automacao_pendentes (whatsapp_status)
  WHERE whatsapp_status IS NOT NULL;

-- ── 3. Configuração do scheduler WhatsApp no settings ────────
INSERT INTO public.settings (key, value)
SELECT
  'whatsapp_scheduler_config',
  jsonb_build_object(
    'queue_api_url',     'http://host.docker.internal:54321/functions/v1/whatsapp-queue-leads',
    'scheduler_api_url', 'http://host.docker.internal:54321/functions/v1/whatsapp-send-scheduler',
    'secret_key',        'zion-whatsapp-local-2026'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.settings WHERE key = 'whatsapp_scheduler_config'
);

-- ── 4. Função: enfileirar leads pendentes de WhatsApp ────────
CREATE OR REPLACE FUNCTION public.run_whatsapp_queue_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg JSONB;
  v_url TEXT;
  v_key TEXT;
BEGIN
  SELECT value INTO v_cfg FROM public.settings WHERE key = 'whatsapp_scheduler_config';
  v_url := v_cfg->>'queue_api_url';
  v_key := v_cfg->>'secret_key';

  IF v_url IS NULL OR v_url = '' THEN
    RAISE WARNING '[whatsapp-queue] URL não configurada em whatsapp_scheduler_config.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url,
    body    := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_key, '')
    )
  );
END;
$$;

-- ── 5. Função: processar fila e enviar mensagens ─────────────
CREATE OR REPLACE FUNCTION public.run_whatsapp_send_scheduler()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg JSONB;
  v_url TEXT;
  v_key TEXT;
BEGIN
  SELECT value INTO v_cfg FROM public.settings WHERE key = 'whatsapp_scheduler_config';
  v_url := v_cfg->>'scheduler_api_url';
  v_key := v_cfg->>'secret_key';

  IF v_url IS NULL OR v_url = '' THEN
    RAISE WARNING '[whatsapp-scheduler] URL não configurada em whatsapp_scheduler_config.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url,
    body    := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_key, '')
    )
  );
END;
$$;

-- ── 6. pg_cron: enfileirar a cada hora (2 am – 8 pm) ─────────
--    A edge function faz a checagem real do horário comercial.
--    Rodamos de hora em hora para pegar novos leads sem atrasar.
SELECT cron.schedule(
  'whatsapp-queue-leads-hourly',
  '0 * * * *',
  'SELECT public.run_whatsapp_queue_leads();'
);

-- ── 7. pg_cron: processar fila a cada 5 minutos ──────────────
SELECT cron.schedule(
  'whatsapp-send-scheduler-5min',
  '*/5 * * * *',
  'SELECT public.run_whatsapp_send_scheduler();'
);
