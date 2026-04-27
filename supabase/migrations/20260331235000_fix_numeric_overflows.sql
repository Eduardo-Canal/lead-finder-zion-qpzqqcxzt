-- Fix numeric field overflow by removing precision/scale limits on calculated numeric columns
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clusters_estrategicos') THEN
        ALTER TABLE public.clusters_estrategicos ALTER COLUMN oportunidade_score TYPE NUMERIC;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analise_cnae') THEN
        ALTER TABLE public.analise_cnae ALTER COLUMN fit_operacional_score TYPE NUMERIC;
        ALTER TABLE public.analise_cnae ALTER COLUMN ticket_medio_cnae TYPE NUMERIC;
        ALTER TABLE public.analise_cnae ALTER COLUMN taxa_sucesso TYPE NUMERIC;
    END IF;
END $$;
