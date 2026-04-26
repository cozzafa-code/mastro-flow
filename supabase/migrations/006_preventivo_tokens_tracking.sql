-- ═══════════════════════════════════════════════════════════════
-- MASTRO · Migration: tracciabilità preventivo_tokens
-- Aggiunge IP + user-agent + timestamp legali su risposta cliente
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE preventivo_tokens
  ADD COLUMN IF NOT EXISTS visualizzato_ip TEXT,
  ADD COLUMN IF NOT EXISTS visualizzato_ua TEXT,
  ADD COLUMN IF NOT EXISTS risposta_ip TEXT,
  ADD COLUMN IF NOT EXISTS risposta_ua TEXT,
  ADD COLUMN IF NOT EXISTS letture_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notify_titolare_inviata BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_preventivo_tokens_azienda_risposta
  ON preventivo_tokens(azienda_id, risposta_at DESC)
  WHERE risposta IS NOT NULL;

-- Commenti documentativi
COMMENT ON COLUMN preventivo_tokens.visualizzato_ip IS 'IP cliente alla prima visualizzazione del preventivo (tracciabilità GDPR-safe, hash possibile)';
COMMENT ON COLUMN preventivo_tokens.visualizzato_ua IS 'User-Agent browser cliente alla prima visualizzazione';
COMMENT ON COLUMN preventivo_tokens.risposta_ip IS 'IP cliente al momento della risposta (prova legale)';
COMMENT ON COLUMN preventivo_tokens.risposta_ua IS 'User-Agent browser cliente al momento della risposta';
COMMENT ON COLUMN preventivo_tokens.letture_count IS 'Numero totale letture del preventivo (cliente che riapre link)';
COMMENT ON COLUMN preventivo_tokens.notify_titolare_inviata IS 'Flag: notifica al titolare già inviata (evita spam)';
