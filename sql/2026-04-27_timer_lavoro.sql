-- ============================================================
-- MASTRO — TimerLavoro v1
-- Migration: 2026-04-27
-- Tabella ore_lavoro + RLS + indici + trigger
-- ============================================================

-- 1. Tabella principale -------------------------------------------------------
CREATE TABLE IF NOT EXISTS ore_lavoro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id UUID NOT NULL REFERENCES aziende(id) ON DELETE CASCADE,
  operatore_id UUID NOT NULL REFERENCES operatori(id) ON DELETE CASCADE,
  commessa_id UUID NOT NULL REFERENCES commesse(id) ON DELETE CASCADE,

  fase TEXT NOT NULL,                       -- 'saldatura','taglio','posa','rilievo','montaggio',...
  sottofase TEXT,                           -- opzionale, libero

  start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stop_at TIMESTAMPTZ,                      -- null = timer attivo
  pause_total_seconds INT NOT NULL DEFAULT 0,
  pause_started_at TIMESTAMPTZ,             -- non null = timer in pausa

  durata_minuti INT GENERATED ALWAYS AS (
    CASE
      WHEN stop_at IS NULL THEN NULL
      ELSE GREATEST(
        0,
        (EXTRACT(EPOCH FROM (stop_at - start_at))::int - pause_total_seconds) / 60
      )
    END
  ) STORED,

  note TEXT,
  approvata_da UUID REFERENCES operatori(id),
  approvata_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ore_lavoro IS 'Sessioni timer lavoro operatore su commessa+fase';
COMMENT ON COLUMN ore_lavoro.pause_started_at IS 'Se non NULL, timer è in pausa da quel momento';

-- 2. Indici -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ore_operatore ON ore_lavoro(operatore_id);
CREATE INDEX IF NOT EXISTS idx_ore_commessa ON ore_lavoro(commessa_id);
CREATE INDEX IF NOT EXISTS idx_ore_azienda ON ore_lavoro(azienda_id);
CREATE INDEX IF NOT EXISTS idx_ore_attivi ON ore_lavoro(operatore_id) WHERE stop_at IS NULL;

-- 3. Vincolo: massimo 1 timer attivo per operatore ---------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ore_attivo_per_operatore
  ON ore_lavoro(operatore_id)
  WHERE stop_at IS NULL;

-- 4. Trigger updated_at -------------------------------------------------------
CREATE OR REPLACE FUNCTION ore_lavoro_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ore_lavoro_updated_at ON ore_lavoro;
CREATE TRIGGER trg_ore_lavoro_updated_at
  BEFORE UPDATE ON ore_lavoro
  FOR EACH ROW EXECUTE FUNCTION ore_lavoro_set_updated_at();

-- 5. Realtime publication -----------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE ore_lavoro;

-- 6. RLS ----------------------------------------------------------------------
ALTER TABLE ore_lavoro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ore_lavoro_select_self" ON ore_lavoro;
DROP POLICY IF EXISTS "ore_lavoro_select_caposquadra" ON ore_lavoro;
DROP POLICY IF EXISTS "ore_lavoro_insert_self" ON ore_lavoro;
DROP POLICY IF EXISTS "ore_lavoro_update_self" ON ore_lavoro;
DROP POLICY IF EXISTS "ore_lavoro_update_approva" ON ore_lavoro;
DROP POLICY IF EXISTS "ore_lavoro_delete_self_attivi" ON ore_lavoro;

-- L'operatore vede le SUE ore
CREATE POLICY "ore_lavoro_select_self" ON ore_lavoro
  FOR SELECT TO anon, authenticated
  USING (
    operatore_id IN (
      SELECT id FROM operatori WHERE id = auth.uid() OR auth_user_id = auth.uid()
    )
  );

-- Caposquadra/titolare/resp_produzione vedono ore della stessa azienda
CREATE POLICY "ore_lavoro_select_caposquadra" ON ore_lavoro
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operatori o
      WHERE (o.id = auth.uid() OR o.auth_user_id = auth.uid())
        AND o.ruolo IN ('caposquadra','titolare','resp_produzione','admin')
        AND o.azienda_id = ore_lavoro.azienda_id
    )
  );

-- L'operatore inserisce solo ore proprie
CREATE POLICY "ore_lavoro_insert_self" ON ore_lavoro
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    operatore_id IN (
      SELECT id FROM operatori WHERE id = auth.uid() OR auth_user_id = auth.uid()
    )
  );

-- L'operatore aggiorna le SUE ore (stop, pause, note)
CREATE POLICY "ore_lavoro_update_self" ON ore_lavoro
  FOR UPDATE TO anon, authenticated
  USING (
    operatore_id IN (
      SELECT id FROM operatori WHERE id = auth.uid() OR auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    operatore_id IN (
      SELECT id FROM operatori WHERE id = auth.uid() OR auth_user_id = auth.uid()
    )
  );

-- Caposquadra/titolare possono approvare ore squadra
CREATE POLICY "ore_lavoro_update_approva" ON ore_lavoro
  FOR UPDATE TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operatori o
      WHERE (o.id = auth.uid() OR o.auth_user_id = auth.uid())
        AND o.ruolo IN ('caposquadra','titolare','resp_produzione','admin')
        AND o.azienda_id = ore_lavoro.azienda_id
    )
  );

-- Solo timer ATTIVI possono essere cancellati dall'operatore (ripensamento)
CREATE POLICY "ore_lavoro_delete_self_attivi" ON ore_lavoro
  FOR DELETE TO anon, authenticated
  USING (
    stop_at IS NULL
    AND operatore_id IN (
      SELECT id FROM operatori WHERE id = auth.uid() OR auth_user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON ore_lavoro TO anon, authenticated;
