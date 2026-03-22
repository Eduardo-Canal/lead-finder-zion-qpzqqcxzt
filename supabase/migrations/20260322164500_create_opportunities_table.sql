-- Criar o ENUM para os estágios da oportunidade de forma idempotente
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_stage') THEN
        CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'closing');
    END IF;
END $$;

-- Criar a tabela opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_salvos(id) ON DELETE CASCADE NOT NULL,
    stage opportunity_stage NOT NULL DEFAULT 'prospecting',
    value DECIMAL(15,2) DEFAULT 0.00,
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para performance em lead_id e stage
CREATE INDEX IF NOT EXISTS idx_opportunities_lead_id ON public.opportunities USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON public.opportunities USING btree (stage);

-- Criar ou substituir a função de atualização do updated_at
CREATE OR REPLACE FUNCTION public.update_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger de atualização do updated_at
DROP TRIGGER IF EXISTS update_opportunities_updated_at_trigger ON public.opportunities;
CREATE TRIGGER update_opportunities_updated_at_trigger
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_opportunities_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Criar políticas de RLS para usuários autenticados (Idempotente)
DROP POLICY IF EXISTS "Enable ALL for authenticated users on opportunities" ON public.opportunities;
CREATE POLICY "Enable ALL for authenticated users on opportunities" ON public.opportunities
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
