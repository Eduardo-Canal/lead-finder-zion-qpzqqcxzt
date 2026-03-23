-- Add user_id column to leads_salvos table to fix the missing column error
ALTER TABLE public.leads_salvos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create an index to improve query performance since we filter by user_id
CREATE INDEX IF NOT EXISTS idx_leads_salvos_user_id ON public.leads_salvos USING btree (user_id);

-- Backfill the user_id column based on the existing salvo_por reference to profiles
UPDATE public.leads_salvos ls
SET user_id = p.user_id
FROM public.profiles p
WHERE ls.salvo_por = p.id AND ls.user_id IS NULL;
