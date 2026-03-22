-- Criar ou substituir a função RPC que identifica quais leads precisam de follow-up baseado nas configurações do usuário
CREATE OR REPLACE FUNCTION public.get_due_followups()
RETURNS TABLE (
    lead_id UUID,
    user_id UUID,
    razao_social TEXT,
    executivo_email TEXT,
    executivo_nome TEXT,
    opp_stage TEXT,
    dias_sem_contato INTEGER,
    reminder_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
            -- Calcula a diferença de dias desde o último contato ou criação
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
            -- Define o tipo de lembrete esperado com base no estágio do lead no funil
            CASE 
                WHEN d.opp_stage = 'proposal' THEN 'proposal'
                WHEN d.opp_stage = 'closing' THEN 'closing'
                ELSE 'follow_up'
            END as expected_reminder_type,
            -- Define a meta de dias com base nas configurações e estágio
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
    -- Fazemos um LEFT JOIN na tabela reminders para verificar quando foi enviada a última notificação
    LEFT JOIN public.reminders r ON r.lead_id = d.lead_id AND r.reminder_type::text = d.expected_reminder_type
    -- Filtramos os leads onde os dias sem contato são maiores ou iguais à meta
    WHERE d.dias_sem_contato >= d.target_days
    -- E que não foram notificados nas últimas 24 horas (para evitar spam)
    AND (r.last_reminded_at IS NULL OR EXTRACT(DAY FROM (NOW() - r.last_reminded_at)) >= 1);
END;
$$;
