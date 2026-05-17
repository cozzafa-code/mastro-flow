-- Migration 004: colonne PIN per tabella team
-- Stato: APPLICATO in produzione
-- Data: 2026-03-13
-- Ticket: #53

ALTER TABLE team ADD COLUMN IF NOT EXISTS pin_hash text;
ALTER TABLE team ADD COLUMN IF NOT EXISTS pin_attempts integer DEFAULT 0;
ALTER TABLE team ADD COLUMN IF NOT EXISTS pin_locked_at timestamptz;
ALTER TABLE team ADD COLUMN IF NOT EXISTS pin_set_at timestamptz;
