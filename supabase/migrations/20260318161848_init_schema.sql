-- Create tables
CREATE TABLE public.perfis_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    permissoes JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    perfil_id UUID REFERENCES public.perfis_acesso(id) ON DELETE SET NULL,
    ativo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.leads_salvos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social TEXT,
    cnpj TEXT,
    cnae_principal TEXT,
    municipio TEXT,
    uf TEXT,
    porte TEXT,
    situacao TEXT,
    capital_social NUMERIC,
    data_abertura DATE,
    email TEXT,
    telefone TEXT,
    socios JSONB DEFAULT '[]'::jsonb,
    salvo_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status_contato TEXT,
    ultima_data_contato TIMESTAMP,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.contatos_realizados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj TEXT NOT NULL,
    executivo_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    executivo_nome TEXT,
    data_contato TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.perfis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos_realizados ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable ALL for authenticated users" ON public.perfis_acesso FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL for authenticated users" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL for authenticated users" ON public.leads_salvos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable ALL for authenticated users" ON public.contatos_realizados FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Data
DO $$
DECLARE
    admin_auth_id UUID := gen_random_uuid();
    user_auth_id UUID := gen_random_uuid();
    perfil_admin_id UUID := gen_random_uuid();
    perfil_user_id UUID := gen_random_uuid();
    profile_admin_id UUID := gen_random_uuid();
    profile_user_id UUID := gen_random_uuid();
BEGIN
    -- Perfis de acesso
    INSERT INTO public.perfis_acesso (id, nome, permissoes) VALUES
    (perfil_admin_id, 'Administrador', '["Buscar Leads", "Salvar Leads", "Marcar Contato", "Editar Status de Contato", "Exportar Lista", "Acessar Admin"]'::jsonb),
    (perfil_user_id, 'Visualizador', '["Buscar Leads"]'::jsonb);

    -- Auth Users
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token)
    VALUES
    (admin_auth_id, '00000000-0000-0000-0000-000000000000', 'admin@zion.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Admin"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''),
    (user_auth_id, '00000000-0000-0000-0000-000000000000', 'user@zion.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "User"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');

    -- Profiles
    INSERT INTO public.profiles (id, user_id, nome, email, perfil_id, ativo) VALUES
    (profile_admin_id, admin_auth_id, 'Executivo Zion', 'admin@zion.com', perfil_admin_id, true),
    (profile_user_id, user_auth_id, 'Maria Santos', 'user@zion.com', perfil_user_id, true);

    -- Leads Salvos (Demonstração)
    INSERT INTO public.leads_salvos (id, razao_social, cnpj, cnae_principal, municipio, uf, porte, situacao, capital_social, data_abertura, salvo_por, status_contato, ultima_data_contato) VALUES
    (gen_random_uuid(), 'TechCorp Soluções em TI Ltda', '12.345.678/0001-90', '6201-5/01', 'São Paulo', 'SP', 'Demais', 'Ativa', 100000, '2020-01-01', profile_admin_id, 'Em Prospecção', NOW()),
    (gen_random_uuid(), 'AgroSul Implementos Agrícolas S.A.', '98.765.432/0001-10', '2831-3/00', 'Porto Alegre', 'RS', 'Demais', 'Ativa', 500000, '2015-05-10', profile_user_id, 'Convertido', NOW());

    -- Contatos Realizados
    INSERT INTO public.contatos_realizados (id, cnpj, executivo_id, executivo_nome, data_contato) VALUES
    (gen_random_uuid(), '12.345.678/0001-90', profile_admin_id, 'Executivo Zion', NOW()),
    (gen_random_uuid(), '98.765.432/0001-10', profile_user_id, 'Maria Santos', NOW());
END $$;
