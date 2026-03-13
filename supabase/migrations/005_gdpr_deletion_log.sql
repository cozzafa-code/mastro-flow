-- Migration 005: tabella gdpr_deletion_log + colonna deleted_at profili
-- Stato: DA APPLICARE in produzione se non giÃ  presente
-- Data: 2026-03-13
-- Ticket: #66

CREATE TABLE IF NOT EXISTS gdpr_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  azienda_id uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_delete_at timestamptz NOT NULL,
  deleted_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profili ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- RLS gdpr_deletion_log
ALTER TABLE gdpr_deletion_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gdpr_own" ON gdpr_deletion_log
  USING (user_id = auth.uid());
