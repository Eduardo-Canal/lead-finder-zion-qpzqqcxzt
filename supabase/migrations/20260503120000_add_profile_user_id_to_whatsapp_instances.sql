-- Vincula cada instância de executivo a um usuário do sistema
-- Usado pelo Co-Piloto para mostrar apenas as conversas do próprio executivo
ALTER TABLE public.whatsapp_instances
  ADD COLUMN IF NOT EXISTS profile_user_id UUID;
