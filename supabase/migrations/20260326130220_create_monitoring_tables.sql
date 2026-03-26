-- Adapting existing audit_logs table to include requested columns
ALTER TABLE public.audit_logs 
    ADD COLUMN IF NOT EXISTS acao VARCHAR,
    ADD COLUMN IF NOT EXISTS tabela_acessada VARCHAR,
    ADD COLUMN IF NOT EXISTS dados_acessados JSONB,
    ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS status VARCHAR;

-- Adding timestamp index for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- (2) Creating user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR,
    ip_address VARCHAR,
    device_info JSONB,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    logout_time TIMESTAMPTZ,
    duracao_sessao INTEGER
);

-- Indices for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON public.user_sessions(login_time);

-- RLS user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_sessions;
CREATE POLICY "Enable insert for authenticated users" ON public.user_sessions
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Enable select for own sessions or admins" ON public.user_sessions;
CREATE POLICY "Enable select for own sessions or admins" ON public.user_sessions
    FOR SELECT TO authenticated 
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
            WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
        )
    );

DROP POLICY IF EXISTS "Enable update for own sessions" ON public.user_sessions;
CREATE POLICY "Enable update for own sessions" ON public.user_sessions
    FOR UPDATE TO authenticated 
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- (3) Creating suspicious_activity table
CREATE TABLE IF NOT EXISTS public.suspicious_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_atividade VARCHAR,
    descricao TEXT,
    severidade VARCHAR,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    resolvido BOOLEAN DEFAULT FALSE
);

-- Indices for suspicious_activity
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_user_id ON public.suspicious_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_timestamp ON public.suspicious_activity(timestamp);

-- RLS suspicious_activity
ALTER TABLE public.suspicious_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.suspicious_activity;
CREATE POLICY "Enable insert for authenticated users" ON public.suspicious_activity
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Enable select for admins" ON public.suspicious_activity;
CREATE POLICY "Enable select for admins" ON public.suspicious_activity
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
            WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
        )
    );

DROP POLICY IF EXISTS "Enable update for admins" ON public.suspicious_activity;
CREATE POLICY "Enable update for admins" ON public.suspicious_activity
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
            WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
        )
    );
