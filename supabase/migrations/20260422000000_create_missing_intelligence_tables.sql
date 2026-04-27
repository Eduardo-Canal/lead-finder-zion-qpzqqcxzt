-- Tables created directly in Supabase cloud without migrations — recreated here for local dev

CREATE TABLE IF NOT EXISTS public.analise_cnae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnae TEXT NOT NULL UNIQUE,
    nome_cnae TEXT,
    total_clientes INTEGER DEFAULT 0,
    ticket_medio_cnae NUMERIC DEFAULT 0,
    taxa_sucesso NUMERIC DEFAULT 0,
    distribuicao_geografica JSONB DEFAULT '{}',
    fit_operacional_score NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analise_cnae ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_analise_cnae" ON public.analise_cnae;
CREATE POLICY "authenticated_all_analise_cnae" ON public.analise_cnae
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.clusters_estrategicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_name TEXT NOT NULL,
    cnae_list TEXT[] DEFAULT '{}',
    total_empresas INTEGER DEFAULT 0,
    oportunidade_score NUMERIC DEFAULT 0,
    prioridade TEXT DEFAULT 'Baixa',
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clusters_estrategicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_clusters_estrategicos" ON public.clusters_estrategicos;
CREATE POLICY "authenticated_all_clusters_estrategicos" ON public.clusters_estrategicos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.carteira_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj TEXT,
    razao_social TEXT,
    cnae TEXT,
    segmento TEXT,
    porte TEXT,
    uf TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.carteira_clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all_carteira_clientes" ON public.carteira_clientes;
CREATE POLICY "authenticated_all_carteira_clientes" ON public.carteira_clientes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
