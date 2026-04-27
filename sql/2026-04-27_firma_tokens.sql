-- ============================================================
-- FirmaLegale: vincoli sui tipi + indici per riuso multi-modulo
-- Applicato 27 aprile 2026
-- ============================================================

ALTER TABLE firma_tokens 
  DROP CONSTRAINT IF EXISTS chk_firma_tipo;
ALTER TABLE firma_tokens 
  ADD CONSTRAINT chk_firma_tipo
  CHECK (tipo IS NULL OR tipo IN (
    'preventivo','rilievo','collaudo','ddt','pos','intervento','privacy','altro'
  ));

ALTER TABLE firma_tokens 
  DROP CONSTRAINT IF EXISTS chk_firma_livello;
ALTER TABLE firma_tokens 
  ADD CONSTRAINT chk_firma_livello
  CHECK (livello_firma IS NULL OR livello_firma IN ('FES','FEA','FEQ'));

ALTER TABLE firma_tokens 
  DROP CONSTRAINT IF EXISTS chk_firma_stato;
ALTER TABLE firma_tokens 
  ADD CONSTRAINT chk_firma_stato
  CHECK (stato IS NULL OR stato IN ('pending','firmato','scaduto','annullato'));

CREATE INDEX IF NOT EXISTS idx_firma_tokens_commessa ON firma_tokens(commessa_id) WHERE commessa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_firma_tokens_azienda_tipo ON firma_tokens(azienda_id, tipo);
CREATE INDEX IF NOT EXISTS idx_firma_tokens_stato ON firma_tokens(stato);
