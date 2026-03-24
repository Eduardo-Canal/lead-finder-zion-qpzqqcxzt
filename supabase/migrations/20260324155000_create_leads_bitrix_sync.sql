CREATE TABLE IF NOT EXISTS public.leads_bitrix_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_salvos(id) ON DELETE SET NULL,
    company_id INTEGER,
    deal_id INTEGER,
    status TEXT NOT NULL,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads_bitrix_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable ALL for authenticated users on leads_bitrix_sync" ON public.leads_bitrix_sync;
CREATE POLICY "Enable ALL for authenticated users on leads_bitrix_sync" 
ON public.leads_bitrix_sync 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
