// ── TIPI RILIEVO ────────────────────────────────────────────────
export type TipoRilievo = 'semplice' | 'complesso'
export type TipoMisure = 'provvisorie' | 'verificate' | 'definitive' | 'da_rivedere' | 'personalizzato'
export type SubTab = 'misure' | 'dettagli' | 'riepilogo'

// ── SETTORI ──────────────────────────────────────────────────────
export type Settore = 'finestre' | 'porte' | 'portefinestre' | 'persiane' | 'zanzariere' | 'tapparelle' | 'tende' | 'controtelai'

export const SETTORI: { id: Settore; label: string; color: string }[] = [
  { id: 'finestre', label: 'Finestre', color: 'teal' },
  { id: 'porte', label: 'Porte', color: 'blue' },
  { id: 'portefinestre', label: 'Porte-finestre', color: 'violet' },
  { id: 'persiane', label: 'Persiane', color: 'ocra' },
  { id: 'zanzariere', label: 'Zanzariere', color: 'success' },
  { id: 'tapparelle', label: 'Tapparelle', color: 'gray' },
  { id: 'tende', label: 'Tende', color: 'violet' },
  { id: 'controtelai', label: 'Controtelai', color: 'ocra' },
]

// ── MISURE (nomi compatibili con mastro-erp) ─────────────────────
export interface MisureVano {
  lCentro: string   // larghezza centro (master)
  lAlto: string     // larghezza alto
  lBasso: string    // larghezza basso
  hCentro: string   // altezza centro (master)
  hSx: string       // altezza sinistra
  hDx: string       // altezza destra
  diag1: string     // diagonale 1
  diag2: string     // diagonale 2
  spallSx: string   // spalletta sx
  spallDx: string   // spalletta dx
  note: string
}

// ── ACCESSORI VANO ───────────────────────────────────────────────
export interface AccessoriVano {
  tapparella: { attivo: boolean; tipo?: string; colore?: string }
  persiana: { attivo: boolean; tipo?: string; colore?: string }
  zanzariera: { attivo: boolean; tipo?: string }
}

// ── VANO (compatibile con mastro-erp) ────────────────────────────
export interface Vano {
  id: string
  rilievo_id: string
  nome: string
  settore: Settore
  numero: number
  // Dati tecnici (accordions)
  tipo: string          // tipologia rapida (es: FX, PT, etc.)
  stanza: string
  piano: string
  sistema: string       // es: "Aliplast Genesis 75"
  coloreInt: string
  coloreEst: string
  bicolore: boolean
  coloreAcc: string
  vetro: string
  telaio: string
  telaioAlaZ: string
  rifilato: boolean
  rifilSx: string; rifilDx: string; rifilSopra: string; rifilSotto: string
  coprifilo: string
  lamiera: string
  difficoltaSalita: string
  mezzoSalita: string
  controtelaio: string
  ferro: string
  pezzi: number
  accessori: AccessoriVano
  // Misure
  misure: MisureVano
  foto_ids: string[]
  stato: 'vuoto' | 'parziale' | 'completo'
  tipo_misure: TipoMisure
  note: string
  created_at: string
  updated_at: string
}

// ── RILIEVO ──────────────────────────────────────────────────────
export interface Rilievo {
  id: string
  commessa_id: string
  commessa_codice: string
  commessa_cliente: string
  tipo: TipoRilievo
  tipo_misure: TipoMisure
  rilevatore: string
  note: string
  stato: 'bozza' | 'in_corso' | 'completato'
  created_at: string
  updated_at: string
}

// ── TIPOLOGIE RAPIDE (da mastro-erp) ─────────────────────────────
export const TIPOLOGIE_RAPIDE = [
  { code: '', label: '— seleziona —' },
  { code: 'FX', label: 'Finestra 2 ante' },
  { code: 'F1', label: 'Finestra 1 anta' },
  { code: 'FA', label: 'Finestra anta-ribalta' },
  { code: 'PF', label: 'Portafinestra 2 ante' },
  { code: 'PF1', label: 'Portafinestra 1 anta' },
  { code: 'PT', label: 'Porta' },
  { code: 'PE', label: 'Porta entrata' },
  { code: 'FO', label: 'Fisso' },
  { code: 'ARC', label: 'Arco' },
  { code: 'SKY', label: 'Velux / Cielo' },
]

export const DIFFICOLTA_SALITA = ['', 'Facile', 'Media', 'Difficile']
export const MEZZI_SALITA = ['', 'Ascensore standard', 'Montacarichi', 'Scala interna', 'Cestello esterno', 'Autoscala', 'A mano']
export const VETRI = ['', 'Std 4/16/4', 'Basso emiss. 4/16/4', 'Triplo 4/12/4/12/4', 'Stratificato 33.1/16/4', 'Opaco', 'Temperato']
export const TELAI = ['', 'Nessuno', 'Ala Z', 'Ala L', 'Taglio termico', 'Legno']
export const CONTROTELAI_TIPI = ['', 'Nessuno', 'Ghisa', 'Acciaio', 'Legno', 'PVC']

// ── HELPERS ──────────────────────────────────────────────────────
export function emptyMisure(): MisureVano {
  return { lCentro: '', lAlto: '', lBasso: '', hCentro: '', hSx: '', hDx: '', diag1: '', diag2: '', spallSx: '', spallDx: '', note: '' }
}

export function emptyAccessori(): AccessoriVano {
  return { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } }
}

export function isMisureComplete(m: MisureVano): boolean {
  return !!(m.lCentro && m.hCentro)
}

export function isMisureParziale(m: MisureVano): boolean {
  return Object.values(m).some(v => v && v !== '') && !isMisureComplete(m)
}

export const TIPO_MISURE_LABEL: Record<TipoMisure, string> = {
  provvisorie: 'Provvisorie', verificate: 'Verificate', definitive: 'Definitive',
  da_rivedere: 'Da rivedere', personalizzato: 'Personalizzato',
}

export const TIPO_MISURE_DESC: Record<TipoMisure, string> = {
  provvisorie: 'Prima visita, misure indicative',
  verificate: 'Controllate sul posto',
  definitive: 'Misure finali, preventivo sbloccato',
  da_rivedere: 'Discrepanze, ricontrollare',
  personalizzato: 'Tipo a scelta, descrivi nelle note',
}
