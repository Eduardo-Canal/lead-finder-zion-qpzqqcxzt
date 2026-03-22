CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cnae TEXT,
    porte TEXT,
    estado TEXT,
    cidade TEXT,
    total_results INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for Select
DROP POLICY IF EXISTS "Users can view their own search history" ON public.search_history;
CREATE POLICY "Users can view their own search history"
    ON public.search_history
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Add RLS policies for Insert
DROP POLICY IF EXISTS "Users can insert their own search history" ON public.search_history;
CREATE POLICY "Users can insert their own search history"
    ON public.search_history
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Add RLS policies for Update
DROP POLICY IF EXISTS "Users can update their own search history" ON public.search_history;
CREATE POLICY "Users can update their own search history"
    ON public.search_history
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Add RLS policies for Delete
DROP POLICY IF EXISTS "Users can delete their own search history" ON public.search_history;
CREATE POLICY "Users can delete their own search history"
    ON public.search_history
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
