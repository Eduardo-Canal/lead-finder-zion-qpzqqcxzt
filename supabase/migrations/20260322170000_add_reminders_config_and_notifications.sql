-- Criar a tabela de configurações de lembretes por usuário
CREATE TABLE IF NOT EXISTS public.user_reminder_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    follow_up_days INTEGER NOT NULL DEFAULT 7,
    proposal_days INTEGER NOT NULL DEFAULT 3,
    closing_days INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar a tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications USING btree (read);

-- Habilitar RLS
ALTER TABLE public.user_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Users can manage their own reminder settings" ON public.user_reminder_settings;
CREATE POLICY "Users can manage their own reminder settings" ON public.user_reminder_settings
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Função RPC para buscar os lembretes que venceram, usada pela Edge Function de Cron
CREATE OR REPLACE FUNCTION public.get_due_reminders_with_leads()
RETURNS TABLE (
    reminder_id UUID,
    user_id UUID,
    lead_id UUID,
    reminder_type public.reminder_type_enum,
    days_interval INTEGER,
    razao_social TEXT,
    executivo_email TEXT,
    executivo_nome TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
