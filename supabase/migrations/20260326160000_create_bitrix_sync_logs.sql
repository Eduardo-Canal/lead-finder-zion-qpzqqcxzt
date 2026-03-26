CREATE TABLE IF NOT EXISTS public.bitrix_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_salvos(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL,
    response_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bitrix_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable ALL for authenticated users on bitrix_sync_logs" ON public.bitrix_sync_logs;
CREATE POLICY "Enable ALL for authenticated users on bitrix_sync_logs" 
ON public.bitrix_sync_logs 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
