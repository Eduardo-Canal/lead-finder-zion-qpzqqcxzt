-- Add column for forcing password change on next login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS require_password_update BOOLEAN NOT NULL DEFAULT false;
