-- Update empresas_rfb structure based on AC
ALTER TABLE public.empresas_rfb
  ADD COLUMN IF NOT EXISTS cnaes_secundarios JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS data_abertura DATE;

-- Safely apply RLS policies for UPSERT on empresas_rfb
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'empresas_rfb' AND policyname = 'Enable INSERT for authenticated users'
    ) THEN
        CREATE POLICY "Enable INSERT for authenticated users" ON public.empresas_rfb
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'empresas_rfb' AND policyname = 'Enable UPDATE for authenticated users'
    ) THEN
        CREATE POLICY "Enable UPDATE for authenticated users" ON public.empresas_rfb
            FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Create config table to track last update
CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
  id INT PRIMARY KEY DEFAULT 1,
  data_ultima_atualizacao_rfb TIMESTAMPTZ
);

ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable SELECT for authenticated users" ON public.configuracoes_sistema
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable UPDATE for authenticated users" ON public.configuracoes_sistema
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable INSERT for authenticated users" ON public.configuracoes_sistema
  FOR INSERT TO authenticated WITH CHECK (true);

INSERT INTO public.configuracoes_sistema (id, data_ultima_atualizacao_rfb) VALUES (1, NULL) ON CONFLICT DO NOTHING;
