ALTER TABLE public.whatsapp_module_config
  ADD COLUMN IF NOT EXISTS chatbot_stop_keyword TEXT DEFAULT 'parar',
  ADD COLUMN IF NOT EXISTS chatbot_stop_minutes  INT  DEFAULT 60;
