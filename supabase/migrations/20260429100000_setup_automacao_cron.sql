-- ============================================================
-- AGENDADOR AUTOMÁTICO DE CAMPANHAS (pg_cron + pg_net)
--
-- Como funciona:
--   1. Cada campanha em automacao_config tem um cron_expressao
--   2. Um trigger registra/cancela o job no pg_cron automaticamente
--      quando a campanha é criada, editada ou desativada
--   3. No horário configurado, pg_cron chama run_automacao_campaign()
--   4. Essa função lê a URL/chave de settings e dispara a edge function
--      via HTTP usando pg_net
-- ============================================================

DO $$
BEGIN
  -- Verificar se pg_cron está disponível
  IF NOT EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) THEN
    RAISE EXCEPTION 'Extensão pg_cron não está disponível. Verifique a instalação do PostgreSQL.';
  END IF;

  -- Verificar se pg_net está disponível
  IF NOT EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net'
  ) THEN
    RAISE EXCEPTION 'Extensão pg_net não está disponível. Verifique a instalação do PostgreSQL.';
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Configuração padrão do agendador ──────────────────────────────────────────
-- api_url : URL da edge function acessível a partir do container PostgreSQL
--           No Docker Desktop (Windows/Mac): http://host.docker.internal:54321/functions/v1/...
--           Em produção (Oracle Cloud):       https://seu-dominio.com/functions/v1/...
-- secret_key: deve ser igual ao AUTOMATION_SECRET_KEY da edge function
INSERT INTO public.settings (key, value)
SELECT
  'automation_scheduler_config',
  jsonb_build_object(
    'api_url',    'http://host.docker.internal:54321/functions/v1/run-automation-search',
    'secret_key', 'zion-automacao-local-2026'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.settings WHERE key = 'automation_scheduler_config'
);

-- ── Função principal: chamada pelo pg_cron ────────────────────────────────────
-- Lê a configuração de settings e dispara a edge function via HTTP.
CREATE OR REPLACE FUNCTION public.run_automacao_campaign(p_config_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg  JSONB;
  v_url  TEXT;
  v_key  TEXT;
BEGIN
  SELECT value INTO v_cfg
  FROM public.settings
  WHERE key = 'automation_scheduler_config';

  v_url := v_cfg->>'api_url';
  v_key := v_cfg->>'secret_key';

  IF v_url IS NULL OR v_url = '' THEN
    RAISE WARNING '[automacao] URL da API não configurada em automation_scheduler_config.';
    RETURN;
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    RAISE WARNING '[automacao] secret_key não configurada em automation_scheduler_config.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url,
    body    := jsonb_build_object('config_id', p_config_id::text),
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    )
  );
END;
$$;

-- ── Agendar uma campanha no pg_cron ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.schedule_automacao_campaign(p_config_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config    RECORD;
  v_job_name  TEXT;
  v_cron_expr TEXT;
BEGIN
  SELECT * INTO v_config
  FROM public.automacao_config
  WHERE id = p_config_id;

  IF NOT FOUND THEN RETURN; END IF;

  v_job_name  := 'automacao-' || p_config_id::text;
  v_cron_expr := COALESCE(v_config.cron_expressao, '0 2 * * *');

  -- Cancelar job existente com segurança (ignora erro se não existir)
  BEGIN
    PERFORM cron.unschedule(v_job_name);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Registrar apenas se campanha estiver ativa
  IF v_config.ativo THEN
    PERFORM cron.schedule(
      v_job_name,
      v_cron_expr,
      format(
        'SELECT public.run_automacao_campaign(%L::uuid);',
        p_config_id::text
      )
    );
  END IF;
END;
$$;

-- ── Cancelar o job de uma campanha ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unschedule_automacao_campaign(p_config_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_name TEXT;
BEGIN
  v_job_name := 'automacao-' || p_config_id::text;
  BEGIN
    PERFORM cron.unschedule(v_job_name);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;

-- ── Sincronizar TODOS os jobs com o banco ─────────────────────────────────────
-- Chamada quando a API URL muda, ou para recriar jobs após restart.
CREATE OR REPLACE FUNCTION public.sync_all_automacao_cron_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_count  INTEGER := 0;
BEGIN
  FOR v_config IN SELECT id FROM public.automacao_config LOOP
    PERFORM public.schedule_automacao_campaign(v_config.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ── Trigger: sincroniza automaticamente ao salvar uma campanha ────────────────
CREATE OR REPLACE FUNCTION public.automacao_config_cron_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.unschedule_automacao_campaign(OLD.id);
    RETURN OLD;
  END IF;

  -- INSERT ou UPDATE: agenda ou cancela conforme ativo
  PERFORM public.schedule_automacao_campaign(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS automacao_config_cron_sync ON public.automacao_config;
CREATE TRIGGER automacao_config_cron_sync
  AFTER INSERT OR UPDATE OF ativo, cron_expressao OR DELETE
  ON public.automacao_config
  FOR EACH ROW EXECUTE FUNCTION public.automacao_config_cron_trigger();

-- ── Sincronizar campanhas já existentes ───────────────────────────────────────
SELECT public.sync_all_automacao_cron_jobs();
