DO $$ 
BEGIN
    ALTER TABLE public.leads_bitrix_sync ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE public.leads_bitrix_sync ADD COLUMN IF NOT EXISTS response_data JSONB;
END $$;
