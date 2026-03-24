DO $$ 
BEGIN
    ALTER TABLE public.leads_bitrix_sync ADD COLUMN IF NOT EXISTS kanban_id TEXT;
    ALTER TABLE public.leads_bitrix_sync ADD COLUMN IF NOT EXISTS stage_id TEXT;
    ALTER TABLE public.leads_bitrix_sync ADD COLUMN IF NOT EXISTS error_message TEXT;
    ALTER TABLE public.leads_bitrix_sync ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.leads_bitrix_sync ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    CREATE INDEX IF NOT EXISTS idx_leads_bitrix_sync_lead_id ON public.leads_bitrix_sync(lead_id);
    CREATE INDEX IF NOT EXISTS idx_leads_bitrix_sync_deal_id ON public.leads_bitrix_sync(deal_id);
    CREATE INDEX IF NOT EXISTS idx_leads_bitrix_sync_user_id ON public.leads_bitrix_sync(user_id);
END $$;

UPDATE public.leads_bitrix_sync lbs
SET user_id = ls.user_id
FROM public.leads_salvos ls
WHERE lbs.lead_id = ls.id AND lbs.user_id IS NULL;

DROP POLICY IF EXISTS "Enable ALL for authenticated users on leads_bitrix_sync" ON public.leads_bitrix_sync;
DROP POLICY IF EXISTS "Users can manage their own sync records" ON public.leads_bitrix_sync;

CREATE POLICY "Users can manage their own sync records"
ON public.leads_bitrix_sync
FOR ALL TO authenticated USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.leads_salvos ls WHERE ls.id = lead_id AND ls.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles p JOIN public.perfis_acesso pa ON p.perfil_id = pa.id WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
  )
);
