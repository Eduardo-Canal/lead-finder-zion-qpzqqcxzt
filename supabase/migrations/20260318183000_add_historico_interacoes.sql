ALTER TABLE public.leads_salvos
  ADD COLUMN IF NOT EXISTS historico_interacoes JSONB DEFAULT '[]'::jsonb;
