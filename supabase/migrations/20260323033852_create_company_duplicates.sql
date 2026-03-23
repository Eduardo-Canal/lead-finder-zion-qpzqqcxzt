-- Create ENUMs for company_duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'duplicate_match_type') THEN
        CREATE TYPE public.duplicate_match_type AS ENUM ('cnpj_exact', 'razao_social_single', 'razao_social_multiple');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'duplicate_status') THEN
        CREATE TYPE public.duplicate_status AS ENUM ('pending_review', 'merged', 'ignored');
    END IF;
END $$;

-- Create company_duplicates table
CREATE TABLE IF NOT EXISTS public.company_duplicates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_company_id INTEGER NOT NULL REFERENCES public.bitrix_clients_zion(bitrix_id) ON DELETE CASCADE,
    duplicate_company_id INTEGER NOT NULL REFERENCES public.bitrix_clients_zion(bitrix_id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) CHECK (similarity_score >= 0 AND similarity_score <= 100),
    match_type public.duplicate_match_type NOT NULL,
    status public.duplicate_status NOT NULL DEFAULT 'pending_review',
    merged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    merged_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create company_merge_history table
CREATE TABLE IF NOT EXISTS public.company_merge_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_company_id INTEGER NOT NULL,
    merged_to_company_id INTEGER NOT NULL REFERENCES public.bitrix_clients_zion(bitrix_id) ON DELETE CASCADE,
    merged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    merged_at TIMESTAMPTZ,
    fields_updated JSONB,
    reason TEXT,
    reversible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_company_duplicates_status ON public.company_duplicates(status);
CREATE INDEX IF NOT EXISTS idx_company_duplicates_original ON public.company_duplicates(original_company_id);
CREATE INDEX IF NOT EXISTS idx_company_duplicates_duplicate ON public.company_duplicates(duplicate_company_id);

CREATE INDEX IF NOT EXISTS idx_company_merge_history_original ON public.company_merge_history(original_company_id);
CREATE INDEX IF NOT EXISTS idx_company_merge_history_merged_to ON public.company_merge_history(merged_to_company_id);

-- Enable RLS
ALTER TABLE public.company_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_merge_history ENABLE ROW LEVEL SECURITY;

-- Policies for company_duplicates
DROP POLICY IF EXISTS "Enable ALL for authenticated users on company_duplicates" ON public.company_duplicates;
CREATE POLICY "Enable ALL for authenticated users on company_duplicates" ON public.company_duplicates
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for company_merge_history
DROP POLICY IF EXISTS "Enable ALL for authenticated users on company_merge_history" ON public.company_merge_history;
CREATE POLICY "Enable ALL for authenticated users on company_merge_history" ON public.company_merge_history
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
