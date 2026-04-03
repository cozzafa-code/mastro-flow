-- Migration 008-010: agent_actions + iSaaS + lead_esterni
-- Applicata su Supabase il 03/04/2026

-- 008: agent_actions
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  azienda_id    uuid NOT NULL,
  commessa_id   uuid,
  tipo          text NOT NULL,
  payload       jsonb DEFAULT '{}',
  stato         text NOT NULL DEFAULT 'pending',
  creato_il     timestamptz DEFAULT now(),
  eseguito_il   timestamptz,
  confermato_da uuid,
  note          text
);
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_agent_actions" ON public.agent_actions;
CREATE POLICY "tenant_agent_actions" ON public.agent_actions
  FOR ALL TO authenticated
  USING (azienda_id::text = public.get_azienda_id())
  WITH CHECK (azienda_id::text = public.get_azienda_id());
CREATE INDEX IF NOT EXISTS idx_agent_actions_azienda ON public.agent_actions (azienda_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_stato ON public.agent_actions (stato) WHERE stato = 'pending';

-- 009: campi iSaaS su cantieri
ALTER TABLE public.cantieri
  ADD COLUMN IF NOT EXISTS fonte_lead            text,
  ADD COLUMN IF NOT EXISTS zona_clima            text,
  ADD COLUMN IF NOT EXISTS tipologia_immobile    text,
  ADD COLUMN IF NOT EXISTS richiesta_at          timestamptz,
  ADD COLUMN IF NOT EXISTS preventivo_inviato_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_lead               boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_source_id        uuid;

-- 010: lead_esterni
CREATE TABLE IF NOT EXISTS public.lead_esterni (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  azienda_id       uuid NOT NULL,
  nome             text,
  cognome          text,
  telefono         text,
  email            text,
  indirizzo        text,
  comune           text,
  provincia        text,
  fonte            text NOT NULL DEFAULT 'manuale',
  fonte_ref        text,
  richiesta        text,
  stato            text NOT NULL DEFAULT 'nuovo',
  convertito_cm_id uuid,
  creato_il        timestamptz DEFAULT now(),
  aggiornato_il    timestamptz DEFAULT now(),
  note             text
);
ALTER TABLE public.lead_esterni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_esterni FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_lead_esterni" ON public.lead_esterni;
CREATE POLICY "tenant_lead_esterni" ON public.lead_esterni
  FOR ALL TO authenticated
  USING (azienda_id::text = public.get_azienda_id())
  WITH CHECK (azienda_id::text = public.get_azienda_id());
CREATE INDEX IF NOT EXISTS idx_lead_esterni_azienda ON public.lead_esterni (azienda_id);
CREATE INDEX IF NOT EXISTS idx_lead_esterni_stato ON public.lead_esterni (stato);

-- STATUS: APPLIED 03/04/2026
