DO $$
BEGIN
    -- Configuração de faixas ABC (também armazena credenciais de integrações via type+config)
    CREATE TABLE IF NOT EXISTS public.abc_curve_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mode TEXT NOT NULL DEFAULT 'fixo',
        a_plus_min NUMERIC NOT NULL DEFAULT 4000,
        a_min NUMERIC NOT NULL DEFAULT 2500,
        b_min NUMERIC NOT NULL DEFAULT 1000,
        c_min NUMERIC NOT NULL DEFAULT 0,
        type TEXT,
        config JSONB,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS abc_curve_config_type_key ON public.abc_curve_config (type) WHERE type IS NOT NULL;

    ALTER TABLE public.abc_curve_config ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users all on abc_curve_config" ON public.abc_curve_config;
    CREATE POLICY "Allow authenticated users all on abc_curve_config" ON public.abc_curve_config
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    INSERT INTO public.abc_curve_config (mode, a_plus_min, a_min, b_min, c_min)
    SELECT 'fixo', 4000, 2500, 1000, 0
    WHERE NOT EXISTS (SELECT 1 FROM public.abc_curve_config);

    -- Configuração de custos Oracle
    CREATE TABLE IF NOT EXISTS public.oracle_cost_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        porte TEXT NOT NULL UNIQUE,
        custo_mensal NUMERIC NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.oracle_cost_config ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users all on oracle_cost_config" ON public.oracle_cost_config;
    CREATE POLICY "Allow authenticated users all on oracle_cost_config" ON public.oracle_cost_config
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    INSERT INTO public.oracle_cost_config (porte, custo_mensal)
    SELECT 'pequeno', 100
    WHERE NOT EXISTS (SELECT 1 FROM public.oracle_cost_config WHERE porte = 'pequeno');

    INSERT INTO public.oracle_cost_config (porte, custo_mensal)
    SELECT 'medio', 300
    WHERE NOT EXISTS (SELECT 1 FROM public.oracle_cost_config WHERE porte = 'medio');

    INSERT INTO public.oracle_cost_config (porte, custo_mensal)
    SELECT 'grande', 800
    WHERE NOT EXISTS (SELECT 1 FROM public.oracle_cost_config WHERE porte = 'grande');

    -- Cache Conta Azul
    CREATE TABLE IF NOT EXISTS public.contaazul_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cnpj TEXT UNIQUE NOT NULL,
        mrr NUMERIC NOT NULL DEFAULT 0,
        nome_cliente TEXT,
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.contaazul_cache ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users all on contaazul_cache" ON public.contaazul_cache;
    CREATE POLICY "Allow authenticated users all on contaazul_cache" ON public.contaazul_cache
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    CREATE INDEX IF NOT EXISTS idx_contaazul_cache_cnpj ON public.contaazul_cache (cnpj);

    -- Tokens Conta Azul
    CREATE TABLE IF NOT EXISTS public.tokens_contaazul (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.tokens_contaazul ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users all on tokens_contaazul" ON public.tokens_contaazul;
    CREATE POLICY "Allow authenticated users all on tokens_contaazul" ON public.tokens_contaazul
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- Histórico de Curva ABC
    CREATE TABLE IF NOT EXISTS public.abc_historico (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_cnpj TEXT NOT NULL,
        curva_anterior TEXT,
        curva_nova TEXT,
        mudanca TEXT,
        data TIMESTAMPTZ NOT NULL DEFAULT now(),
        confirmador_id UUID,
        confirmador_nome TEXT
    );

    ALTER TABLE public.abc_historico ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users all on abc_historico" ON public.abc_historico;
    CREATE POLICY "Allow authenticated users all on abc_historico" ON public.abc_historico
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- Expansão da tabela Bitrix
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS porte TEXT;
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS mrr NUMERIC;
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS custo_infra NUMERIC;
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS margem_liquida NUMERIC;
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS curva_abc_calculada TEXT;
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS curva_abc_anterior TEXT;
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS ultima_atualizacao_abc TIMESTAMPTZ;

END $$;
