-- Migration 009: CAM compliance fields
-- DM 24/11/2025 in vigore 1 Feb 2026

-- Campi CAM su catalogo_sistemi (profili)
ALTER TABLE public.catalogo_sistemi
  ADD COLUMN IF NOT EXISTS perc_riciclato      numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uni11673_1           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cam_compliant        boolean DEFAULT false;

-- Campi CAM su cantieri (per commessa)
ALTER TABLE public.cantieri
  ADD COLUMN IF NOT EXISTS cam_tipo_lavoro      text,
  -- nuova_costruzione | ristrutturazione | manutenzione
  ADD COLUMN IF NOT EXISTS cam_verifica_ok      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cam_note             text;

-- STATUS: APPLIED 03/04/2026
