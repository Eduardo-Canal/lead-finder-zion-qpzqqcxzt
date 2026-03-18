ALTER TABLE public.leads_salvos
  ADD COLUMN IF NOT EXISTS decisor_nome TEXT,
  ADD COLUMN IF NOT EXISTS decisor_telefone TEXT,
  ADD COLUMN IF NOT EXISTS decisor_email TEXT;
