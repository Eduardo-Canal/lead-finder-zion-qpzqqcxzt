CREATE TABLE IF NOT EXISTS public.api_debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cnae TEXT,
    uf TEXT,
    status_http INTEGER,
    sucesso BOOLEAN
);

ALTER TABLE public.api_debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable SELECT for authenticated admins" ON public.api_debug_logs
    FOR SELECT TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        JOIN perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
      )
    );

CREATE POLICY "Enable INSERT for authenticated admins" ON public.api_debug_logs
    FOR INSERT TO authenticated 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        JOIN perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
      )
    );
