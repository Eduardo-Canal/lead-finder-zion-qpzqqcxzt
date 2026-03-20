DO $$ 
BEGIN
    -- Criação da tabela bitrix_clients_zion
    CREATE TABLE IF NOT EXISTS public.bitrix_clients_zion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bitrix_id TEXT UNIQUE NOT NULL,
        company_name TEXT,
        cnpj TEXT,
        cnae_principal TEXT,
        email TEXT,
        phone TEXT,
        city TEXT,
        state TEXT,
        synced_at TIMESTAMPTZ DEFAULT now()
    );

    -- Habilitar RLS
    ALTER TABLE public.bitrix_clients_zion ENABLE ROW LEVEL SECURITY;

    -- Criar política de acesso para usuários autenticados
    DROP POLICY IF EXISTS "Allow authenticated users all on bitrix_clients_zion" ON public.bitrix_clients_zion;
    CREATE POLICY "Allow authenticated users all on bitrix_clients_zion" ON public.bitrix_clients_zion
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
        
    -- Criar índice para buscas rápidas pelo id do bitrix
    CREATE INDEX IF NOT EXISTS idx_bitrix_clients_zion_bitrix_id ON public.bitrix_clients_zion (bitrix_id);

END $$;
