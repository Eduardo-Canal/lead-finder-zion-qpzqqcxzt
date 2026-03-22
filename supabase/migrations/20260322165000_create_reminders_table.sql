-- Criar o ENUM para os tipos de lembrete de forma idempotente
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_type_enum') THEN
        CREATE TYPE reminder_type_enum AS ENUM ('follow_up', 'proposal', 'closing');
    END IF;
END $$;

-- Criar a tabela reminders
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads_salvos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_type reminder_type_enum NOT NULL DEFAULT 'follow_up',
    days_interval INTEGER NOT NULL DEFAULT 7,
    last_reminded_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para performance em user_id, lead_id e is_active
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_lead_id ON public.reminders USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_reminders_is_active ON public.reminders USING btree (is_active);

-- Criar ou substituir a função de atualização do updated_at
CREATE OR REPLACE FUNCTION public.update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger de atualização do updated_at
DROP TRIGGER IF EXISTS update_reminders_updated_at_trigger ON public.reminders;
CREATE TRIGGER update_reminders_updated_at_trigger
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_reminders_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Criar políticas de RLS para que usuários gerenciem apenas seus próprios lembretes (Idempotente)
DROP POLICY IF EXISTS "Users can manage their own reminders" ON public.reminders;
CREATE POLICY "Users can manage their own reminders" ON public.reminders
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

