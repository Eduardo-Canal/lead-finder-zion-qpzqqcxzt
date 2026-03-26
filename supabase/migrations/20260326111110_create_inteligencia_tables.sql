DO $$
BEGIN

    -- 1. Create table carteira_clientes
    CREATE TABLE IF NOT EXISTS public.carteira_clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id TEXT,
        cnae TEXT,
        segmento TEXT,
        porte TEXT,
        ticket_medio NUMERIC,
        data_contratacao DATE,
        status_cliente TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Create table analise_cnae
    CREATE TABLE IF NOT EXISTS public.analise_cnae (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cnae TEXT,
        nome_cnae TEXT,
        total_clientes INTEGER DEFAULT 0,
        ticket_medio_cnae NUMERIC DEFAULT 0,
        taxa_sucesso NUMERIC DEFAULT 0,
        distribuicao_geografica JSONB DEFAULT '{}'::jsonb,
        fit_operacional_score INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. Create table clusters_estrategicos
    CREATE TABLE IF NOT EXISTS public.clusters_estrategicos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cluster_name TEXT,
        cnae_list JSONB DEFAULT '[]'::jsonb,
        total_empresas INTEGER DEFAULT 0,
        oportunidade_score INTEGER DEFAULT 0,
        prioridade TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_carteira_clientes_cnae ON public.carteira_clientes(cnae);
    CREATE INDEX IF NOT EXISTS idx_carteira_clientes_segmento ON public.carteira_clientes(segmento);
    CREATE INDEX IF NOT EXISTS idx_analise_cnae_cnae ON public.analise_cnae(cnae);

    -- Enable RLS
    ALTER TABLE public.carteira_clientes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.analise_cnae ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.clusters_estrategicos ENABLE ROW LEVEL SECURITY;

    -- Policies for carteira_clientes
    DROP POLICY IF EXISTS "Enable ALL for authenticated users on carteira_clientes" ON public.carteira_clientes;
    CREATE POLICY "Enable ALL for authenticated users on carteira_clientes"
    ON public.carteira_clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- Policies for analise_cnae
    DROP POLICY IF EXISTS "Enable ALL for authenticated users on analise_cnae" ON public.analise_cnae;
    CREATE POLICY "Enable ALL for authenticated users on analise_cnae"
    ON public.analise_cnae FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- Policies for clusters_estrategicos
    DROP POLICY IF EXISTS "Enable ALL for authenticated users on clusters_estrategicos" ON public.clusters_estrategicos;
    CREATE POLICY "Enable ALL for authenticated users on clusters_estrategicos"
    ON public.clusters_estrategicos FOR ALL TO authenticated USING (true) WITH CHECK (true);

END $$;
