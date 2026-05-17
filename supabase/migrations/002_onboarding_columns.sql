-- Migration 002: colonne onboarding
-- Stato: APPLICATO in produzione
-- Data: 2026-03-13
-- Ticket: #48

ALTER TABLE profili ADD COLUMN IF NOT EXISTS onboarding_completato boolean DEFAULT false;
ALTER TABLE profili ADD COLUMN IF NOT EXISTS telefono text;
ALTER TABLE aziende ADD COLUMN IF NOT EXISTS settori text[] DEFAULT '{}';
ALTER TABLE aziende ADD COLUMN IF NOT EXISTS citta text;
