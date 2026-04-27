DO $$
BEGIN

    -- =========================================================
    -- contaazul_cache: adicionar colunas de detalhe e auditoria
    -- =========================================================
    ALTER TABLE public.contaazul_cache
        ADD COLUMN IF NOT EXISTS contratos       JSONB,
        ADD COLUMN IF NOT EXISTS sincronizado_por      UUID,
        ADD COLUMN IF NOT EXISTS sincronizado_por_nome TEXT;

    -- =========================================================
    -- contaazul_sync_historico: histórico completo de cada sync
    -- =========================================================
    CREATE TABLE IF NOT EXISTS public.contaazul_sync_historico (
        id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        cnpj                  TEXT        NOT NULL,
        nome_cliente          TEXT,
        mrr                   NUMERIC     NOT NULL DEFAULT 0,
        contratos             JSONB,
        sincronizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
        sincronizado_por      UUID,
        sincronizado_por_nome TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_contaazul_sync_hist_cnpj
        ON public.contaazul_sync_historico (cnpj);
    CREATE INDEX IF NOT EXISTS idx_contaazul_sync_hist_em
        ON public.contaazul_sync_historico (sincronizado_em DESC);

    ALTER TABLE public.contaazul_sync_historico ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users all on contaazul_sync_historico"
        ON public.contaazul_sync_historico;
    CREATE POLICY "Allow authenticated users all on contaazul_sync_historico"
        ON public.contaazul_sync_historico
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- =========================================================
    -- oracle_cache: último registro por CNPJ (upsert)
    -- =========================================================
    CREATE TABLE IF NOT EXISTS public.oracle_cache (
        id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        cnpj                  TEXT        UNIQUE NOT NULL,
        nome_cliente          TEXT,
        mrr                   NUMERIC     NOT NULL DEFAULT 0,
        contratos             JSONB,
        atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
        sincronizado_por      UUID,
        sincronizado_por_nome TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_oracle_cache_cnpj
        ON public.oracle_cache (cnpj);

    ALTER TABLE public.oracle_cache ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users all on oracle_cache"
        ON public.oracle_cache;
    CREATE POLICY "Allow authenticated users all on oracle_cache"
        ON public.oracle_cache
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- =========================================================
    -- oracle_sync_historico: histórico completo de cada sync Oracle
    -- =========================================================
    CREATE TABLE IF NOT EXISTS public.oracle_sync_historico (
        id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        cnpj                  TEXT        NOT NULL,
        nome_cliente          TEXT,
        mrr                   NUMERIC     NOT NULL DEFAULT 0,
        contratos             JSONB,
        sincronizado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
        sincronizado_por      UUID,
        sincronizado_por_nome TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_oracle_sync_hist_cnpj
        ON public.oracle_sync_historico (cnpj);
    CREATE INDEX IF NOT EXISTS idx_oracle_sync_hist_em
        ON public.oracle_sync_historico (sincronizado_em DESC);

    ALTER TABLE public.oracle_sync_historico ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users all on oracle_sync_historico"
        ON public.oracle_sync_historico;
    CREATE POLICY "Allow authenticated users all on oracle_sync_historico"
        ON public.oracle_sync_historico
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

END $$;
