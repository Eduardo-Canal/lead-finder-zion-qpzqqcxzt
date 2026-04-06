DO $DO$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'cnae_market_data_potencial' 
      AND column_name = 'cnae'
  ) THEN
    ALTER TABLE public.cnae_market_data_potencial RENAME COLUMN cnae TO cnae_code;
  END IF;
END $DO$;

ALTER TABLE public.cnae_market_data_potencial 
  ADD COLUMN IF NOT EXISTS cnae_description TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DROP INDEX IF EXISTS idx_cnae_market_data_potencial_cnae;
CREATE INDEX IF NOT EXISTS idx_cnae_market_data_potencial_cnae_code ON public.cnae_market_data_potencial USING btree (cnae_code);

DROP POLICY IF EXISTS "authenticated_select_cnae_market_data_potencial" ON public.cnae_market_data_potencial;
CREATE POLICY "authenticated_select_cnae_market_data_potencial" ON public.cnae_market_data_potencial
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_all_cnae_market_data_potencial" ON public.cnae_market_data_potencial;
CREATE POLICY "admin_all_cnae_market_data_potencial" ON public.cnae_market_data_potencial
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN perfis_acesso pa ON p.perfil_id = pa.id
            WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
        )
    );
