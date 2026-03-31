-- Fix "value too long for type character varying(10)" by changing columns to TEXT
ALTER TABLE public.analise_cnae ALTER COLUMN cnae TYPE TEXT;
ALTER TABLE public.analise_cnae ALTER COLUMN nome_cnae TYPE TEXT;

-- Also update carteira_clientes to prevent similar issues
ALTER TABLE public.carteira_clientes ALTER COLUMN cnae TYPE TEXT;
ALTER TABLE public.carteira_clientes ALTER COLUMN segmento TYPE TEXT;
ALTER TABLE public.carteira_clientes ALTER COLUMN porte TYPE TEXT;

-- Also update clusters_estrategicos to prevent similar issues
ALTER TABLE public.clusters_estrategicos ALTER COLUMN cluster_name TYPE TEXT;
ALTER TABLE public.clusters_estrategicos ALTER COLUMN prioridade TYPE TEXT;
