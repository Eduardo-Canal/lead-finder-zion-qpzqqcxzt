DO $$ 
BEGIN
    -- Adicionar a coluna segmento caso ela não exista
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS segmento TEXT;
END $$;
