CREATE TABLE IF NOT EXISTS public.cnae_market_data_potencial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnae TEXT NOT NULL UNIQUE,
    potencial_mercado INTEGER DEFAULT 0,
    clientes_zion INTEGER DEFAULT 0,
    taxa_penetracao NUMERIC DEFAULT 0,
    tendencia TEXT,
    data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cnae_market_data_potencial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_cnae_market_data_potencial" ON public.cnae_market_data_potencial;
CREATE POLICY "authenticated_select_cnae_market_data_potencial" ON public.cnae_market_data_potencial
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_all_cnae_market_data_potencial" ON public.cnae_market_data_potencial;
CREATE POLICY "admin_all_cnae_market_data_potencial" ON public.cnae_market_data_potencial
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN perfis_acesso pa ON p.perfil_id = pa.id
            WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
        )
    );

-- Create index
CREATE INDEX IF NOT EXISTS idx_cnae_market_data_potencial_cnae ON public.cnae_market_data_potencial USING btree (cnae);

-- Note: To enable cron job automatically, pg_net and pg_cron must be enabled on Supabase.
-- CREATE EXTENSION IF NOT EXISTS pg_net;
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- DO $$
-- BEGIN
--   PERFORM cron.schedule(
--     'sync-cnae-market-data-potencial-daily',
--     '0 2 * * *',
--     $$
--     SELECT net.http_post(
--         url:='https://' || current_setting('app.settings.supabase_project_ref', true) || '.supabase.co/functions/v1/sync-cnae-market-data-potencial',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb
--     );
--     $$
--   );
-- EXCEPTION WHEN OTHERS THEN
--   -- Ignore if cron is not available
-- END $$;
