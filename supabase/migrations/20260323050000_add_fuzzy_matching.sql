-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GiST index to speed up similarity searches on company_name
CREATE INDEX IF NOT EXISTS trgm_idx_bitrix_clients_company_name 
ON public.bitrix_clients_zion USING GIST (company_name gist_trgm_ops);

-- Create RPC function to find potential duplicates
DROP FUNCTION IF EXISTS public.find_potential_duplicates(numeric);
CREATE OR REPLACE FUNCTION public.find_potential_duplicates(min_score numeric DEFAULT 0.75)
RETURNS TABLE (
    empresa1_id integer,
    empresa2_id integer,
    similarity_score numeric,
    tipo_similaridade text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Configure the similarity threshold locally for this transaction
    -- This allows the '%' operator to utilize the GiST index efficiently
    PERFORM set_config('pg_trgm.similarity_threshold', min_score::text, true);
    
    RETURN QUERY
    SELECT 
        a.bitrix_id as empresa1_id,
        b.bitrix_id as empresa2_id,
        (similarity(a.company_name, b.company_name) * 100)::numeric as similarity_score,
        'Razão Social (Fuzzy)'::text as tipo_similaridade
    FROM public.bitrix_clients_zion a
    JOIN public.bitrix_clients_zion b 
      ON a.company_name % b.company_name
      AND a.bitrix_id < b.bitrix_id
    WHERE a.company_name IS NOT NULL AND b.company_name IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM public.company_duplicates cd 
        WHERE (cd.original_company_id = a.bitrix_id AND cd.duplicate_company_id = b.bitrix_id)
           OR (cd.original_company_id = b.bitrix_id AND cd.duplicate_company_id = a.bitrix_id)
    )
    ORDER BY similarity(a.company_name, b.company_name) DESC
    LIMIT 50;
END;
$$;
