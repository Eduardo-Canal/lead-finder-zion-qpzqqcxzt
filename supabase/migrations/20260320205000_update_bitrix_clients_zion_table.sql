DO $$ 
BEGIN
    -- Create the table if it does not exist
    CREATE TABLE IF NOT EXISTS public.bitrix_clients_zion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bitrix_id INTEGER UNIQUE NOT NULL,
        company_name TEXT,
        cnpj TEXT,
        cnae_principal TEXT,
        email TEXT,
        phone TEXT,
        city TEXT,
        state TEXT,
        synced_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Ensure created_at is present (in case table was created from previous migration)
    ALTER TABLE public.bitrix_clients_zion ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

    -- Drop any dependent policies before altering column type
    DROP POLICY IF EXISTS "Allow authenticated users all on bitrix_clients_zion" ON public.bitrix_clients_zion;
    DROP POLICY IF EXISTS "Enable SELECT for authenticated users" ON public.bitrix_clients_zion;
    DROP POLICY IF EXISTS "Enable ALL for admins" ON public.bitrix_clients_zion;

    -- Alter column bitrix_id to integer safely
    ALTER TABLE public.bitrix_clients_zion ALTER COLUMN bitrix_id TYPE INTEGER USING bitrix_id::INTEGER;

    -- Enable RLS
    ALTER TABLE public.bitrix_clients_zion ENABLE ROW LEVEL SECURITY;

    -- Create read policy for all authenticated users
    CREATE POLICY "Enable SELECT for authenticated users" ON public.bitrix_clients_zion
        FOR SELECT TO authenticated USING (true);

    -- Create write policies exclusively for admins
    CREATE POLICY "Enable ALL for admins" ON public.bitrix_clients_zion
        FOR ALL TO authenticated 
        USING (EXISTS (
            SELECT 1 FROM profiles p 
            JOIN perfis_acesso pa ON p.perfil_id = pa.id 
            WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
        ))
        WITH CHECK (EXISTS (
            SELECT 1 FROM profiles p 
            JOIN perfis_acesso pa ON p.perfil_id = pa.id 
            WHERE p.user_id = auth.uid() AND pa.nome = 'Administrador'
        ));

    -- Create indices to improve performance
    CREATE INDEX IF NOT EXISTS idx_bitrix_clients_zion_bitrix_id ON public.bitrix_clients_zion (bitrix_id);
    CREATE INDEX IF NOT EXISTS idx_bitrix_clients_zion_cnae_principal ON public.bitrix_clients_zion (cnae_principal);

END $$;
