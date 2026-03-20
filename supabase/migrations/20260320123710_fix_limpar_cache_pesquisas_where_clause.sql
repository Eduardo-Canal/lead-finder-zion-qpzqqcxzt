-- Substitui a função existente para adicionar a cláusula WHERE na exclusão global,
-- contornando restrições de segurança que impedem DELETE sem WHERE (ex: erro 21000).
CREATE OR REPLACE FUNCTION public.limpar_cache_pesquisas(p_cnae text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_count int;
    v_cnae_clean text;
BEGIN
    IF p_cnae IS NULL OR trim(p_cnae) = '' THEN
        -- Adicionado WHERE id IS NOT NULL para evitar o erro "DELETE requires a WHERE clause"
        DELETE FROM public.cache_pesquisas WHERE id IS NOT NULL;
        GET DIAGNOSTICS v_count = ROW_COUNT;
    ELSE
        -- Clean up formatting from the input CNAE
        v_cnae_clean := regexp_replace(p_cnae, '\D', '', 'g');
        
        -- Delete cache entries where:
        -- 1. The input CNAE is present in the 'parametros->cnaes' JSON array (new way)
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
$function$;
