-- Add parametros column to cache_pesquisas to easily filter by CNAE
ALTER TABLE public.cache_pesquisas ADD COLUMN IF NOT EXISTS parametros jsonb DEFAULT '{}'::jsonb;

-- Create an RPC to clear cache globally or by CNAE
CREATE OR REPLACE FUNCTION public.limpar_cache_pesquisas(p_cnae text DEFAULT NULL)
RETURNS int AS $$
DECLARE
    v_count int;
    v_cnae_clean text;
BEGIN
    IF p_cnae IS NULL OR trim(p_cnae) = '' THEN
        DELETE FROM public.cache_pesquisas;
        GET DIAGNOSTICS v_count = ROW_COUNT;
    ELSE
        -- Clean up formatting from the input CNAE
        v_cnae_clean := regexp_replace(p_cnae, '\D', '', 'g');
        
        -- Delete cache entries where:
        -- 1. The input CNAE is present in the `parametros->cnaes` JSON array (new way)
        -- 2. OR the results text contains the cleaned CNAE (fallback for older cache entries)
        -- 3. OR the results text contains the formatted input CNAE (fallback for older cache entries)
        DELETE FROM public.cache_pesquisas
        WHERE 
            (parametros->'cnaes')::jsonb ? v_cnae_clean
            OR resultados::text LIKE '%' || v_cnae_clean || '%'
            OR resultados::text LIKE '%' || p_cnae || '%';
            
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
