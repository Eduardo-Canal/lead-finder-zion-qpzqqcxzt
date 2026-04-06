CREATE TABLE IF NOT EXISTS public.cnae_market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnae_code TEXT NOT NULL UNIQUE,
    cnae_description TEXT,
    total_clientes INTEGER DEFAULT 0,
    a_plus INTEGER DEFAULT 0,
    a INTEGER DEFAULT 0,
    b INTEGER DEFAULT 0,
    c INTEGER DEFAULT 0,
    nao_classificado INTEGER DEFAULT 0,
    potencial_mercado INTEGER DEFAULT 0,
    taxa_penetracao NUMERIC DEFAULT 0,
    tendencia TEXT,
    data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cnae_market_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_cnae_market_data" ON public.cnae_market_data;
CREATE POLICY "authenticated_select_cnae_market_data" ON public.cnae_market_data
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_all_cnae_market_data" ON public.cnae_market_data;
CREATE POLICY "admin_all_cnae_market_data" ON public.cnae_market_data
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN perfis_acesso pa ON p.perfil_id = pa.id
            WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
        )
    );

-- To enable the cron job automatically via pg_cron (if available on the Supabase project)
-- Ensure pg_net and pg_cron are enabled.
-- CREATE EXTENSION IF NOT EXISTS pg_net;
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'sync-cnae-market-data-daily',
--   '0 3 * * *', -- Runs every day at 3 AM
--   $$
--   SELECT net.http_post(
--       url:='https://' || current_setting('app.settings.supabase_project_ref', true) || '.supabase.co/functions/v1/sync-cnae-market-data',
--       headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb
--   );
--   $$
-- );
