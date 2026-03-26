-- Create carteira_clientes table
CREATE TABLE IF NOT EXISTS public.carteira_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID, -- Note: Foreign key to 'companies' omitted as the table doesn't exist in the current schema
    cnae VARCHAR(255),
    segmento VARCHAR(255),
    porte VARCHAR(255),
    ticket_medio NUMERIC(15,2),
    data_contratacao DATE,
    status_cliente VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_carteira_clientes_cnae ON public.carteira_clientes(cnae);
CREATE INDEX IF NOT EXISTS idx_carteira_clientes_segmento ON public.carteira_clientes(segmento);
CREATE INDEX IF NOT EXISTS idx_carteira_clientes_user_id ON public.carteira_clientes(user_id);

-- Enable RLS
ALTER TABLE public.carteira_clientes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
DROP POLICY IF EXISTS "Users can manage their own carteira_clientes" ON public.carteira_clientes;

CREATE POLICY "Users can manage their own carteira_clientes"
    ON public.carteira_clientes
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_carteira_clientes_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_carteira_clientes_updated_at_trigger ON public.carteira_clientes;
CREATE TRIGGER update_carteira_clientes_updated_at_trigger
    BEFORE UPDATE ON public.carteira_clientes
    FOR EACH ROW EXECUTE FUNCTION public.update_carteira_clientes_updated_at();
