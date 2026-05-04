-- MASTRO Box Doccia - Catalogo piatti per azienda
-- Migrazione: 2026-05-04

CREATE TABLE IF NOT EXISTS boxdoccia_catalogo_piatti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id UUID NOT NULL REFERENCES aziende(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  mat TEXT NOT NULL,
  col TEXT NOT NULL DEFAULT 'bianco',
  prezzo_listino NUMERIC(10,2),
  sconto NUMERIC(5,2),
  certificato_url TEXT,
  scheda_tecnica_url TEXT,
  fornitore_email TEXT,
  fornitore_tel TEXT,
  note TEXT,
  attivo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boxdoccia_piatti_azienda ON boxdoccia_catalogo_piatti(azienda_id);
CREATE INDEX IF NOT EXISTS idx_boxdoccia_piatti_attivo ON boxdoccia_catalogo_piatti(azienda_id, attivo);
CREATE INDEX IF NOT EXISTS idx_boxdoccia_piatti_brand ON boxdoccia_catalogo_piatti(azienda_id, brand);

ALTER TABLE boxdoccia_catalogo_piatti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boxdoccia_piatti_select_own" ON boxdoccia_catalogo_piatti;
CREATE POLICY "boxdoccia_piatti_select_own" ON boxdoccia_catalogo_piatti
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "boxdoccia_piatti_insert_own" ON boxdoccia_catalogo_piatti;
CREATE POLICY "boxdoccia_piatti_insert_own" ON boxdoccia_catalogo_piatti
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "boxdoccia_piatti_update_own" ON boxdoccia_catalogo_piatti;
CREATE POLICY "boxdoccia_piatti_update_own" ON boxdoccia_catalogo_piatti
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "boxdoccia_piatti_delete_own" ON boxdoccia_catalogo_piatti;
CREATE POLICY "boxdoccia_piatti_delete_own" ON boxdoccia_catalogo_piatti
  FOR DELETE TO anon, authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_catalogo_piatti TO anon, authenticated;

-- Seed iniziale: 20 piatti commerciali per azienda Walter Cozza Serramenti
INSERT INTO boxdoccia_catalogo_piatti (azienda_id, brand, model, mat, col, prezzo_listino, attivo) VALUES
('ccca51c1-656b-4e7c-a501-55753e20da29', 'MASTRO', 'Standard effetto pietra', 'effpietra', 'bianco', 280, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Novellini', 'Olympic Plus - acrilico', 'acrilico', 'bianco', 145, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Novellini', 'Custom Touch - resina', 'resina', 'antracite', 260, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Ideal Standard', 'Ultraflat S - stone', 'stoneulti', 'grigio', 340, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Ideal Standard', 'Ultraflat New - acrilico', 'acrilico', 'bianco', 165, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Roca', 'Terran - mineral marmo', 'mineralm', 'antracite', 380, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Roca', 'Aquos - acrilico', 'acrilico', 'bianco', 155, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Kaldewei', 'SuperPlan Plus - acciaio smaltato', 'ceramica', 'bianco', 420, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Kaldewei', 'Xetis - acciaio smaltato', 'ceramica', 'bianco', 480, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Duka', 'Litho - effetto pietra', 'effpietra', 'sabbia', 295, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Pozzi-Ginori', 'Kuba - ceramica', 'ceramica', 'bianco', 180, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Flaminia', 'Quaranta - ceramica', 'ceramica', 'bianco', 220, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Globo', 'Strato - ceramica', 'ceramica', 'tortora', 195, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Cesana', 'Sonia 3 - acrilico', 'acrilico', 'bianco', 175, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Teuco', 'DecoStone - mineralmarmo', 'mineralm', 'creta', 360, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Samo', 'Elegance - resina', 'resina', 'antracite', 285, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Megius', 'Effetto Pietra - resina', 'resina', 'sabbia', 270, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Cazzaniga', 'Minimal - marmoresina', 'marmoresina', 'antracite', 320, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Hueppe', 'EasyStep - acrilico', 'acrilico', 'bianco', 195, true),
('ccca51c1-656b-4e7c-a501-55753e20da29', 'Profiltek', 'Marmo Stone - mineralmarmo', 'mineralm', 'grigio', 350, true)
ON CONFLICT DO NOTHING;
