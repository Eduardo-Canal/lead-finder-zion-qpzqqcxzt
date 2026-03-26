CREATE TABLE IF NOT EXISTS public.analise_cnae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnae VARCHAR UNIQUE NOT NULL,
    nome_cnae VARCHAR,
    total_clientes INTEGER DEFAULT 0,
    ticket_medio_cnae NUMERIC,
    taxa_sucesso NUMERIC,
    distribuicao_geografica JSONB DEFAULT '{}'::jsonb,
    fit_operacional_score NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on cnae
CREATE INDEX IF NOT EXISTS idx_analise_cnae_cnae ON public.analise_cnae USING btree (cnae);

-- Enable RLS
ALTER TABLE public.analise_cnae ENABLE ROW LEVEL SECURITY;

-- Add Policies (only authenticated users can see and modify)
DROP POLICY IF EXISTS "Enable ALL for authenticated users on analise_cnae" ON public.analise_cnae;
CREATE POLICY "Enable ALL for authenticated users on analise_cnae" 
    ON public.analise_cnae 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
