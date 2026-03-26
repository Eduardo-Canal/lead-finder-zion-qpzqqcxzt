-- Fix "Function Search Path Mutable" security warnings
-- Setting explicitly the search_path to 'public' for SECURITY DEFINER functions to prevent search path injection attacks

ALTER FUNCTION public.update_opportunities_updated_at() SET search_path = public;

ALTER FUNCTION public.update_reminders_updated_at() SET search_path = public;

ALTER FUNCTION public.get_due_reminders_with_leads() SET search_path = public;

ALTER FUNCTION public.get_due_followups() SET search_path = public;

ALTER FUNCTION public.find_potential_duplicates(numeric) SET search_path = public;

ALTER FUNCTION public.limpar_cache_pesquisas(text) SET search_path = public;
