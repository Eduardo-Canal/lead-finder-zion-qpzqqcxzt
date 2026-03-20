CREATE TABLE IF NOT EXISTS public.bitrix_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    request_body JSONB
);

ALTER TABLE public.bitrix_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable SELECT for authenticated admins on bitrix_api_logs" ON public.bitrix_api_logs
    FOR SELECT TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        JOIN perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
      )
    );

CREATE POLICY "Enable DELETE for authenticated admins on bitrix_api_logs" ON public.bitrix_api_logs
    FOR DELETE TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        JOIN perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
      )
    );

CREATE TABLE IF NOT EXISTS public.bitrix_rate_limit_config (
    id INTEGER PRIMARY KEY,
    max_requests INTEGER NOT NULL DEFAULT 2,
    time_window_minutes NUMERIC NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bitrix_rate_limit_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable SELECT for authenticated admins on bitrix_rate_limit_config" ON public.bitrix_rate_limit_config
    FOR SELECT TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        JOIN perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
      )
    );

CREATE POLICY "Enable UPDATE for authenticated admins on bitrix_rate_limit_config" ON public.bitrix_rate_limit_config
    FOR UPDATE TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        JOIN perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        JOIN perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
      )
    );

-- Configuração inicial padrão (2 requisições por 1 minuto)
INSERT INTO public.bitrix_rate_limit_config (id, max_requests, time_window_minutes) 
VALUES (1, 2, 1) 
ON CONFLICT (id) DO NOTHING;
