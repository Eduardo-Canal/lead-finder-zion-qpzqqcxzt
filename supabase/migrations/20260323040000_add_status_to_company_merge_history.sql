-- Add new columns to company_merge_history for enhanced audit and revert capability
ALTER TABLE public.company_merge_history 
ADD COLUMN IF NOT EXISTS original_company_name TEXT,
ADD COLUMN IF NOT EXISTS merged_to_company_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'merged',
ADD COLUMN IF NOT EXISTS reverted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reverted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
