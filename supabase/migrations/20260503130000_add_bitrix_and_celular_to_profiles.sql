-- Informações de integração por colaborador
-- Centralizadas no cadastro do usuário para auto-preenchimento nas instâncias WhatsApp
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bitrix_user_id TEXT,
  ADD COLUMN IF NOT EXISTS celular_corporativo TEXT;
