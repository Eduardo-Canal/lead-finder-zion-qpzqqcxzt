ALTER TABLE public.api_debug_logs 
ADD COLUMN municipio TEXT,
ADD COLUMN limite INTEGER,
ADD COLUMN tempo_resposta_ms INTEGER,
ADD COLUMN total_resultados INTEGER,
ADD COLUMN resposta_json JSONB;
