-- Migration 006: RLS fix - sostituisce policy {public} con {authenticated}
-- Eseguita manualmente il 03/04/2026 via Supabase SQL Editor
-- Riferimento: rls_fix_mastro_v5.sql

-- Helper function
CREATE OR REPLACE FUNCTION public.get_azienda_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT azienda_id::text FROM public.user_data WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Tabelle tenant: 18 tabelle con azienda_id → FOR ALL TO authenticated
-- Tabelle lookup: 28 tabelle senza azienda_id → FOR SELECT TO authenticated
-- Vedi rls_fix_mastro_v5.sql per il dettaglio completo
-- STATUS: APPLIED 03/04/2026
