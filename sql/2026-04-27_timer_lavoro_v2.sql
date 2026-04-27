-- ============================================================
-- TimerLavoro v2: motivi STOP + colonne ready per cascata squadra
-- Applicato 27 aprile 2026
-- ============================================================

ALTER TABLE ore_lavoro 
  ADD COLUMN IF NOT EXISTS motivo_stop TEXT,
  ADD COLUMN IF NOT EXISTS motivo_stop_dettaglio TEXT,
  ADD COLUMN IF NOT EXISTS parent_ora_id UUID REFERENCES ore_lavoro(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS auto_started_da UUID REFERENCES operatori(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ore_parent ON ore_lavoro(parent_ora_id) WHERE parent_ora_id IS NOT NULL;

ALTER TABLE ore_lavoro 
  DROP CONSTRAINT IF EXISTS chk_motivo_stop_categoria;
ALTER TABLE ore_lavoro 
  ADD CONSTRAINT chk_motivo_stop_categoria
  CHECK (motivo_stop IS NULL OR motivo_stop IN (
    'completato','pausa_pranzo','cambio_commessa','problema','fine_giornata','altro'
  ));

ALTER TABLE ore_lavoro 
  DROP CONSTRAINT IF EXISTS chk_problema_richiede_dettaglio;
ALTER TABLE ore_lavoro 
  ADD CONSTRAINT chk_problema_richiede_dettaglio
  CHECK (
    motivo_stop IS DISTINCT FROM 'problema' 
    OR (motivo_stop_dettaglio IS NOT NULL AND length(trim(motivo_stop_dettaglio)) > 0)
  );
