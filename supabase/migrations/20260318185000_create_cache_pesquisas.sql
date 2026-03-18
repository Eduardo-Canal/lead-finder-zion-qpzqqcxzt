CREATE TABLE IF NOT EXISTS public.cache_pesquisas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chave_cache text UNIQUE NOT NULL,
    resultados jsonb NOT NULL DEFAULT '[]'::jsonb,
    total_registros integer NOT NULL DEFAULT 0,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    expira_em timestamp with time zone DEFAULT (now() + interval '30 days') NOT NULL
);

ALTER TABLE public.cache_pesquisas ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform operations
CREATE POLICY "Allow authenticated users to select cache" ON public.cache_pesquisas
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert cache" ON public.cache_pesquisas
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cache" ON public.cache_pesquisas
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete cache" ON public.cache_pesquisas
    FOR DELETE TO authenticated USING (true);
