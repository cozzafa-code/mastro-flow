-- =====================================================================
-- MASTRO Suite - Box Doccia Catalogo Esteso
-- Migrazione: estensione modello dati per catalogo multi-fornitore
-- Da applicare su progetto fgefcigxlbrmbeqqzjmo
-- =====================================================================

-- 1) FORNITORI per azienda
CREATE TABLE IF NOT EXISTS boxdoccia_catalogo_fornitore (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id uuid REFERENCES aziende(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  sito_web text,
  contatto_email text,
  contatto_telefono text,
  logo_url text,
  note text,
  attivo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bd_fornitore_azienda ON boxdoccia_catalogo_fornitore(azienda_id);

-- 2) SERIE prodotto
CREATE TABLE IF NOT EXISTS boxdoccia_catalogo_serie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id uuid REFERENCES aziende(id) ON DELETE CASCADE NOT NULL,
  fornitore_id uuid REFERENCES boxdoccia_catalogo_fornitore(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descrizione text,
  spessore_cristallo_mm int[],
  tipo_chiusura text[],
  tipo_cerniera text,
  accessori_inclusi text[],
  realizzazione text CHECK (realizzazione IN ('STANDARD','SU_MISURA','SOLO_STANDARD','MISTO')),
  altezza_min_cm int DEFAULT 190,
  altezza_max_cm int DEFAULT 220,
  altezza_max_speciale_cm int,
  tempi_consegna_giorni int,
  immagine_url text,
  ordine int DEFAULT 0,
  attivo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bd_serie_azienda ON boxdoccia_catalogo_serie(azienda_id);
CREATE INDEX IF NOT EXISTS idx_bd_serie_fornitore ON boxdoccia_catalogo_serie(fornitore_id);

-- 3) MODELLI con configurazione installazione
CREATE TABLE IF NOT EXISTS boxdoccia_catalogo_modello (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id uuid REFERENCES aziende(id) ON DELETE CASCADE NOT NULL,
  serie_id uuid REFERENCES boxdoccia_catalogo_serie(id) ON DELETE CASCADE,
  codice_articolo text,
  nome text NOT NULL,
  configurazione text NOT NULL CHECK (configurazione IN (
    'NICCHIA','NICCHIA_PANNELLO','ANGOLO','ANGOLO_PANNELLO',
    'WALK_IN','TRE_LATI','DOPPIA_PORTA','TONDO','PARETE_VASCA','PANNELLO_FISSO',
    'SEMICIRCOLARE','SEMICIRCOLARE_ASIMMETRICO','PENTAGONALE','CABINA_ATTREZZATA',
    'GRANDI_LASTRE','SOPRAVASCA','PARETE_DIVISORIA_SOFFITTO'
  )),
  tipo_apertura text CHECK (tipo_apertura IN (
    'BATTENTE','SCORREVOLE','SOFFIETTO','PIEGHEVOLE','SALOON',
    'GIREVOLE_90','SCORREVOLE_INTERNO','PIVOT','BILICO','TRASLANTE','FISSO','MISTO'
  )),
  num_ante int,
  num_ante_fisse int,
  attrezzatura text[],
  w_min_cm int, w_max_cm int,
  d_min_cm int, d_max_cm int,
  h_min_cm int DEFAULT 190, h_max_cm int DEFAULT 220,
  su_misura boolean DEFAULT false,
  prezzo_acquisto numeric(10,2),
  prezzo_vendita numeric(10,2),
  margine_pct numeric(5,2),
  immagine_url text,
  scheda_tecnica_url text,
  note text,
  attivo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bd_modello_azienda ON boxdoccia_catalogo_modello(azienda_id);
CREATE INDEX IF NOT EXISTS idx_bd_modello_serie ON boxdoccia_catalogo_modello(serie_id);
CREATE INDEX IF NOT EXISTS idx_bd_modello_config ON boxdoccia_catalogo_modello(configurazione);

-- 4) FINITURE PROFILI
CREATE TABLE IF NOT EXISTS boxdoccia_catalogo_finitura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id uuid REFERENCES aziende(id) ON DELETE CASCADE NOT NULL,
  fornitore_id uuid REFERENCES boxdoccia_catalogo_fornitore(id) ON DELETE CASCADE,
  codice_articolo text,
  nome text NOT NULL,
  categoria text CHECK (categoria IN ('STANDARD','ANODIZZATO','LACCATO','ACCIAIO','VERNICIATO','PERSONALIZZATO')),
  ral text,
  hex_color text,
  immagine_url text,
  prezzo_supplemento numeric(10,2) DEFAULT 0,
  attivo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bd_finitura_azienda ON boxdoccia_catalogo_finitura(azienda_id);

-- 5) CRISTALLI
CREATE TABLE IF NOT EXISTS boxdoccia_catalogo_cristallo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id uuid REFERENCES aziende(id) ON DELETE CASCADE NOT NULL,
  fornitore_id uuid REFERENCES boxdoccia_catalogo_fornitore(id) ON DELETE CASCADE,
  codice_articolo text,
  nome text NOT NULL,
  tipologia text CHECK (tipologia IN ('BASE','SERIGRAFIA','DECORO_ARTISTICO','PERSONALIZZATO')),
  spessore_mm int NOT NULL,
  materiale text DEFAULT 'VETRO_TEMPERATO' CHECK (materiale IN (
    'VETRO_TEMPERATO','VETRO_STRATIFICATO','ACRILICO','POLICARBONATO'
  )),
  stratificato boolean DEFAULT false,
  trattamenti text[] DEFAULT ARRAY[]::text[],
  altezza_max_cm int,
  larghezza_max_cm int,
  immagine_url text,
  prezzo_mq numeric(10,2),
  attivo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bd_cristallo_azienda ON boxdoccia_catalogo_cristallo(azienda_id);

COMMENT ON COLUMN boxdoccia_catalogo_cristallo.trattamenti IS
  'Valori suggeriti: anticalcare, antigoccia, easyclean, anti_impronta, brillbox, autopulente, antibatterico';

-- 6) M:N modello <-> finiture / cristalli
CREATE TABLE IF NOT EXISTS boxdoccia_catalogo_modello_finitura (
  modello_id uuid REFERENCES boxdoccia_catalogo_modello(id) ON DELETE CASCADE,
  finitura_id uuid REFERENCES boxdoccia_catalogo_finitura(id) ON DELETE CASCADE,
  PRIMARY KEY (modello_id, finitura_id)
);

CREATE TABLE IF NOT EXISTS boxdoccia_catalogo_modello_cristallo (
  modello_id uuid REFERENCES boxdoccia_catalogo_modello(id) ON DELETE CASCADE,
  cristallo_id uuid REFERENCES boxdoccia_catalogo_cristallo(id) ON DELETE CASCADE,
  PRIMARY KEY (modello_id, cristallo_id)
);

-- 7) COMPONENTISTICA / RICAMBI
CREATE TABLE IF NOT EXISTS boxdoccia_componente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  azienda_id uuid REFERENCES aziende(id) ON DELETE CASCADE NOT NULL,
  fornitore_id uuid REFERENCES boxdoccia_catalogo_fornitore(id),
  categoria text NOT NULL CHECK (categoria IN (
    'GUARNIZIONE_MAGNETICA','GUARNIZIONE_VERTICALE','GUARNIZIONE_ORIZZONTALE_INF',
    'GUARNIZIONE_PALLONCINO','PROFILO_COMPENSATORE','PROFILO_PARETE','PROFILO_SOFFITTO',
    'CERNIERA','CUSCINETTO','ROTELLA','MANIGLIA','POMELLO','MAGNETE',
    'TAPPO_COPRIPILETTA','BRACCIO_SOSTEGNO','KIT_FISSAGGIO','ALTRO'
  )),
  codice_articolo text,
  nome text NOT NULL,
  spessore_vetro_compatibile_mm int[],
  tipo_apertura_compatibile text[],
  materiale_compatibile text[],
  forma_vetro text CHECK (forma_vetro IN ('NORMALE','CURVO','MISTO')),
  angolo_gradi int,
  diametro_mm numeric(6,2),
  spessore_mm numeric(6,2),
  lunghezza_mm numeric(6,2),
  filettatura text,
  colore text,
  materiale_costruzione text,
  immagine_url text,
  scheda_tecnica_url text,
  prezzo_acquisto numeric(10,2),
  prezzo_vendita numeric(10,2),
  attivo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bd_componente_azienda ON boxdoccia_componente(azienda_id);
CREATE INDEX IF NOT EXISTS idx_bd_componente_categoria ON boxdoccia_componente(categoria);

CREATE TABLE IF NOT EXISTS boxdoccia_modello_componente (
  modello_id uuid REFERENCES boxdoccia_catalogo_modello(id) ON DELETE CASCADE,
  componente_id uuid REFERENCES boxdoccia_componente(id) ON DELETE CASCADE,
  quantita int DEFAULT 1,
  obbligatorio boolean DEFAULT false,
  incluso_serie boolean DEFAULT false,
  PRIMARY KEY (modello_id, componente_id)
);

-- 8) Estensione VANI per config + misure box doccia
ALTER TABLE vani
  ADD COLUMN IF NOT EXISTS boxdoccia_config jsonb,
  ADD COLUMN IF NOT EXISTS boxdoccia_misure jsonb;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE boxdoccia_catalogo_fornitore ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxdoccia_catalogo_serie ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxdoccia_catalogo_modello ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxdoccia_catalogo_finitura ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxdoccia_catalogo_cristallo ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxdoccia_componente ENABLE ROW LEVEL SECURITY;

-- Drop policy esistenti se ri-eseguito
DROP POLICY IF EXISTS "azienda_isolata" ON boxdoccia_catalogo_fornitore;
DROP POLICY IF EXISTS "azienda_isolata" ON boxdoccia_catalogo_serie;
DROP POLICY IF EXISTS "azienda_isolata" ON boxdoccia_catalogo_modello;
DROP POLICY IF EXISTS "azienda_isolata" ON boxdoccia_catalogo_finitura;
DROP POLICY IF EXISTS "azienda_isolata" ON boxdoccia_catalogo_cristallo;
DROP POLICY IF EXISTS "azienda_isolata" ON boxdoccia_componente;

-- Policy unificate: ogni azienda vede solo i propri dati
CREATE POLICY "azienda_isolata" ON boxdoccia_catalogo_fornitore
  FOR ALL TO authenticated, anon
  USING (azienda_id IN (SELECT azienda_id FROM operatori WHERE user_id = auth.uid()));

CREATE POLICY "azienda_isolata" ON boxdoccia_catalogo_serie
  FOR ALL TO authenticated, anon
  USING (azienda_id IN (SELECT azienda_id FROM operatori WHERE user_id = auth.uid()));

CREATE POLICY "azienda_isolata" ON boxdoccia_catalogo_modello
  FOR ALL TO authenticated, anon
  USING (azienda_id IN (SELECT azienda_id FROM operatori WHERE user_id = auth.uid()));

CREATE POLICY "azienda_isolata" ON boxdoccia_catalogo_finitura
  FOR ALL TO authenticated, anon
  USING (azienda_id IN (SELECT azienda_id FROM operatori WHERE user_id = auth.uid()));

CREATE POLICY "azienda_isolata" ON boxdoccia_catalogo_cristallo
  FOR ALL TO authenticated, anon
  USING (azienda_id IN (SELECT azienda_id FROM operatori WHERE user_id = auth.uid()));

CREATE POLICY "azienda_isolata" ON boxdoccia_componente
  FOR ALL TO authenticated, anon
  USING (azienda_id IN (SELECT azienda_id FROM operatori WHERE user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_catalogo_fornitore TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_catalogo_serie TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_catalogo_modello TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_catalogo_finitura TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_catalogo_cristallo TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_componente TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_catalogo_modello_finitura TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_catalogo_modello_cristallo TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boxdoccia_modello_componente TO anon, authenticated;
