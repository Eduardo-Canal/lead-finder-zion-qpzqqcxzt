-- Set search_path for security definer functions to fix warnings in Security Advisor
CREATE OR REPLACE FUNCTION public.find_potential_duplicates(min_score numeric DEFAULT 0.75)
 RETURNS TABLE(empresa1_id integer, empresa2_id integer, similarity_score numeric, tipo_similaridade text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
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
$function$;

CREATE OR REPLACE FUNCTION public.get_due_followups()
 RETURNS TABLE(lead_id uuid, user_id uuid, razao_social text, executivo_email text, executivo_nome text, opp_stage text, dias_sem_contato integer, reminder_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    WITH lead_data AS (
        SELECT 
            l.id as lead_id,
            l.razao_social,
            l.ultima_data_contato,
            l.created_at,
            l.salvo_por,
            o.stage as opp_stage,
            p.user_id,
            p.email as executivo_email,
            p.nome as executivo_nome,
            COALESCE(urs.follow_up_days, 7) as follow_up_days,
            COALESCE(urs.proposal_days, 3) as proposal_days,
            COALESCE(urs.closing_days, 1) as closing_days,
            EXTRACT(DAY FROM (NOW() - COALESCE(l.ultima_data_contato, l.created_at)))::INTEGER as dias_sem_contato
        FROM public.leads_salvos l
        JOIN public.profiles p ON l.salvo_por = p.id
        LEFT JOIN public.opportunities o ON o.lead_id = l.id
        LEFT JOIN public.user_reminder_settings urs ON urs.user_id = p.user_id
        WHERE l.status_contato NOT IN ('Convertido', 'Sem Interesse')
    ),
    due_leads AS (
        SELECT 
            d.*,
            CASE 
                WHEN d.opp_stage = 'proposal' THEN 'proposal'
                WHEN d.opp_stage = 'closing' THEN 'closing'
                ELSE 'follow_up'
            END as expected_reminder_type,
            CASE 
                WHEN d.opp_stage = 'proposal' THEN d.proposal_days
                WHEN d.opp_stage = 'closing' THEN d.closing_days
                ELSE d.follow_up_days
            END as target_days
        FROM lead_data d
    )
    SELECT 
        d.lead_id,
        d.user_id,
        d.razao_social,
        d.executivo_email,
        d.executivo_nome,
        d.opp_stage,
        d.dias_sem_contato,
        d.expected_reminder_type
    FROM due_leads d
    LEFT JOIN public.reminders r ON r.lead_id = d.lead_id AND r.reminder_type::text = d.expected_reminder_type
    WHERE d.dias_sem_contato >= d.target_days
    AND (r.last_reminded_at IS NULL OR EXTRACT(DAY FROM (NOW() - r.last_reminded_at)) >= 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_due_reminders_with_leads()
 RETURNS TABLE(reminder_id uuid, user_id uuid, lead_id uuid, reminder_type reminder_type_enum, days_interval integer, razao_social text, executivo_email text, executivo_nome text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        r.id as reminder_id,
        r.user_id,
        r.lead_id,
        r.reminder_type,
        r.days_interval,
        l.razao_social,
        p.email as executivo_email,
        p.nome as executivo_nome
    FROM public.reminders r
    JOIN public.leads_salvos l ON r.lead_id = l.id
    JOIN public.profiles p ON r.user_id = p.user_id
    WHERE r.is_active = true
    AND NOW() >= COALESCE(r.last_reminded_at, r.created_at) + (r.days_interval * interval '1 day');
END;
$function$;

CREATE OR REPLACE FUNCTION public.limpar_cache_pesquisas(p_cnae text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_count int;
    v_cnae_clean text;
BEGIN
    IF p_cnae IS NULL OR trim(p_cnae) = '' THEN
        DELETE FROM public.cache_pesquisas WHERE id IS NOT NULL;
        GET DIAGNOSTICS v_count = ROW_COUNT;
    ELSE
        v_cnae_clean := regexp_replace(p_cnae, '\D', '', 'g');
        
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

CREATE OR REPLACE FUNCTION public.update_opportunities_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_reminders_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Update RLS Policies based on profiles/perfis_acesso

DO $$
BEGIN

-- 1. carteira_clientes: apenas ADMIN e COMERCIAL veem
DROP POLICY IF EXISTS "Usuários logados podem ver carteira_clientes" ON public.carteira_clientes;
DROP POLICY IF EXISTS "Usuários logados podem inserir em carteira_clientes" ON public.carteira_clientes;
DROP POLICY IF EXISTS "admin_comercial_carteira_clientes" ON public.carteira_clientes;

CREATE POLICY "admin_comercial_carteira_clientes" ON public.carteira_clientes
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
);

-- 2. leads_salvos: apenas ADMIN, COMERCIAL e o criador veem
DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.leads_salvos;
DROP POLICY IF EXISTS "admin_comercial_criador_leads_salvos" ON public.leads_salvos;

CREATE POLICY "admin_comercial_criador_leads_salvos" ON public.leads_salvos
FOR ALL TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.id = leads_salvos.salvo_por
    ) OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
)
WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.id = leads_salvos.salvo_por
    ) OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
);

-- 3. analise_cnae: ADMIN, COMERCIAL e FINDER/VISUALIZADOR veem
DROP POLICY IF EXISTS "Usuários logados podem ver analise_cnae" ON public.analise_cnae;
DROP POLICY IF EXISTS "todos_podem_ver_analise_cnae" ON public.analise_cnae;
DROP POLICY IF EXISTS "admin_comercial_modifica_analise_cnae" ON public.analise_cnae;
DROP POLICY IF EXISTS "admin_comercial_modifica_analise_cnae_update" ON public.analise_cnae;
DROP POLICY IF EXISTS "admin_comercial_modifica_analise_cnae_delete" ON public.analise_cnae;

CREATE POLICY "todos_podem_ver_analise_cnae" ON public.analise_cnae
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL', 'FINDER', 'VISUALIZADOR')
    )
);

CREATE POLICY "admin_comercial_modifica_analise_cnae" ON public.analise_cnae
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
);

CREATE POLICY "admin_comercial_modifica_analise_cnae_update" ON public.analise_cnae
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
);

CREATE POLICY "admin_comercial_modifica_analise_cnae_delete" ON public.analise_cnae
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
);

-- 4. leads_bitrix_sync: apenas ADMIN e COMERCIAL veem
DROP POLICY IF EXISTS "Users can manage their own sync records" ON public.leads_bitrix_sync;
DROP POLICY IF EXISTS "Enable ALL for authenticated users on leads_bitrix_sync" ON public.leads_bitrix_sync;
DROP POLICY IF EXISTS "admin_comercial_leads_bitrix_sync" ON public.leads_bitrix_sync;

CREATE POLICY "admin_comercial_leads_bitrix_sync" ON public.leads_bitrix_sync
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.perfis_acesso pa ON p.perfil_id = pa.id
        WHERE p.user_id = auth.uid() AND upper(pa.nome) IN ('ADMINISTRADOR', 'ADMIN', 'COMERCIAL')
    )
);

END $$;
