-- Fix "value too long for type character varying(10)" by changing columns to TEXT
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analise_cnae') THEN
        ALTER TABLE public.analise_cnae ALTER COLUMN cnae TYPE TEXT;
        ALTER TABLE public.analise_cnae ALTER COLUMN nome_cnae TYPE TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'carteira_clientes') THEN
        ALTER TABLE public.carteira_clientes ALTER COLUMN cnae TYPE TEXT;
        ALTER TABLE public.carteira_clientes ALTER COLUMN segmento TYPE TEXT;
        ALTER TABLE public.carteira_clientes ALTER COLUMN porte TYPE TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clusters_estrategicos') THEN
        ALTER TABLE public.clusters_estrategicos ALTER COLUMN cluster_name TYPE TEXT;
        ALTER TABLE public.clusters_estrategicos ALTER COLUMN prioridade TYPE TEXT;
    END IF;
END $$;
