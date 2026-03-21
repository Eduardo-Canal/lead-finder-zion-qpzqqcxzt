DO $$ 
BEGIN
    -- Adicionar a coluna curva_abc caso ela não exista
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS curva_abc TEXT;
END $$;
