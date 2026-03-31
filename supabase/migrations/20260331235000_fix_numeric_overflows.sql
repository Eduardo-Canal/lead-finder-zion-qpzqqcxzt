-- Fix numeric field overflow by removing precision/scale limits on calculated numeric columns
ALTER TABLE public.clusters_estrategicos ALTER COLUMN oportunidade_score TYPE NUMERIC;

-- Also update analise_cnae to prevent similar issues with its score columns
ALTER TABLE public.analise_cnae ALTER COLUMN fit_operacional_score TYPE NUMERIC;
ALTER TABLE public.analise_cnae ALTER COLUMN ticket_medio_cnae TYPE NUMERIC;
ALTER TABLE public.analise_cnae ALTER COLUMN taxa_sucesso TYPE NUMERIC;
