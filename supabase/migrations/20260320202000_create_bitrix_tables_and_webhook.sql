DO $$ 
BEGIN
    -- 1) bitrix_api_logs
    CREATE TABLE IF NOT EXISTS public.bitrix_api_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMPTZ DEFAULT now(),
        endpoint TEXT,
        method TEXT,
        status_code INTEGER,
        response_time_ms INTEGER,
        error_message TEXT,
        request_body JSONB,
        response_body JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE public.bitrix_api_logs ADD COLUMN IF NOT EXISTS response_body JSONB;
    ALTER TABLE public.bitrix_api_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

    -- Drop old policies
    DROP POLICY IF EXISTS "Enable SELECT for authenticated admins on bitrix_api_logs" ON public.bitrix_api_logs;
    DROP POLICY IF EXISTS "Enable DELETE for authenticated admins on bitrix_api_logs" ON public.bitrix_api_logs;

    -- 2) bitrix_rate_limit_config
    DROP TABLE IF EXISTS public.bitrix_rate_limit_config CASCADE;

    CREATE TABLE public.bitrix_rate_limit_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        max_requests INTEGER DEFAULT 2,
        time_window_minutes INTEGER DEFAULT 1,
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    INSERT INTO public.bitrix_rate_limit_config (id, max_requests, time_window_minutes) 
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 2, 1) 
    ON CONFLICT (id) DO NOTHING;

    -- 3) bitrix_webhook_events
    CREATE TABLE IF NOT EXISTS public.bitrix_webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT,
        payload JSONB,
        processed BOOLEAN DEFAULT false,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_bitrix_api_logs_timestamp ON public.bitrix_api_logs (timestamp);
    CREATE INDEX IF NOT EXISTS idx_bitrix_api_logs_endpoint ON public.bitrix_api_logs (endpoint);
    CREATE INDEX IF NOT EXISTS idx_bitrix_webhook_events_event_type ON public.bitrix_webhook_events (event_type);

    -- RLS setup
    ALTER TABLE public.bitrix_api_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.bitrix_rate_limit_config ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.bitrix_webhook_events ENABLE ROW LEVEL SECURITY;

    -- bitrix_api_logs policies
    DROP POLICY IF EXISTS "Allow authenticated users all on bitrix_api_logs" ON public.bitrix_api_logs;
    CREATE POLICY "Allow authenticated users all on bitrix_api_logs" ON public.bitrix_api_logs
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- bitrix_rate_limit_config policies
    DROP POLICY IF EXISTS "Allow authenticated users all on bitrix_rate_limit_config" ON public.bitrix_rate_limit_config;
    CREATE POLICY "Allow authenticated users all on bitrix_rate_limit_config" ON public.bitrix_rate_limit_config
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- bitrix_webhook_events policies
    DROP POLICY IF EXISTS "Allow authenticated users all on bitrix_webhook_events" ON public.bitrix_webhook_events;
    CREATE POLICY "Allow authenticated users all on bitrix_webhook_events" ON public.bitrix_webhook_events
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

END $$;
