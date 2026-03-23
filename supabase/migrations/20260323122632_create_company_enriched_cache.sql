CREATE TABLE IF NOT EXISTS public.company_enriched_cache (
    cnpj text PRIMARY KEY,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + interval '24 hours') NOT NULL
);

ALTER TABLE public.company_enriched_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to select enriched cache" ON public.company_enriched_cache;
CREATE POLICY "Allow authenticated users to select enriched cache" ON public.company_enriched_cache
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert enriched cache" ON public.company_enriched_cache;
CREATE POLICY "Allow authenticated users to insert enriched cache" ON public.company_enriched_cache
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update enriched cache" ON public.company_enriched_cache;
CREATE POLICY "Allow authenticated users to update enriched cache" ON public.company_enriched_cache
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete enriched cache" ON public.company_enriched_cache;
CREATE POLICY "Allow authenticated users to delete enriched cache" ON public.company_enriched_cache
    FOR DELETE TO authenticated USING (true);
