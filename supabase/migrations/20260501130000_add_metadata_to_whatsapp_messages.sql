-- Adiciona coluna metadata para vincular mensagens a entidades Bitrix
-- (ex: foto de crachá → lead_id, lead_dados extraídos pelo OCR)
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS metadata JSONB;
