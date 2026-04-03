-- Migration 007: RLS su tabelle senza row security
-- Eseguita manualmente il 03/04/2026 via Supabase SQL Editor

ALTER TABLE public.sistema_parametri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sistema_parametri FORCE ROW LEVEL SECURITY;
CREATE POLICY "lookup_select" ON public.sistema_parametri
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.winkhaus_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winkhaus_pool FORCE ROW LEVEL SECURITY;
CREATE POLICY "lookup_select" ON public.winkhaus_pool
  FOR SELECT TO authenticated USING (true);

-- STATUS: APPLIED 03/04/2026
