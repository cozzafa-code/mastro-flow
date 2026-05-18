// ── TIPI RILIEVO ────────────────────────────────────────────────
export type TipoRilievo = 'semplice' | 'complesso'
export type TipoMisure = 'provvisorie' | 'verificate' | 'definitive' | 'da_rivedere' | 'personalizzato'
export type SubTab = 'misure' | 'dettagli' | 'riepilogo'

// ── SETTORI VANO (tutti e 8) ─────────────────────────────────────
export type Settore =
  | 'finestre'
  | 'porte'
  | 'portefinestre'
  | 'persiane'
  | 'zanzariere'
  | 'tapparelle'
  | 'tende'
  | 'controtelai'

export const SETTORI: { id: Settore; label: string; color: string; icon: string }[] = [
  { id: 'finestre', label: 'Finestre', color: 'teal', icon: 'window' },
  { id: 'porte', label: 'Porte', color: 'blue', icon: 'door' },
  { id: 'portefinestre', label: 'Porte-finestre', color: 'violet', icon: 'door-open' },
  { id: 'persiane', label: 'Persiane', color: 'ocra', icon: 'blinds' },
  { id: 'zanzariere', label: 'Zanzariere', color: 'success', icon: 'grid' },
  { id: 'tapparelle', label: 'Tapparelle', color: 'gray', icon: 'layers' },
  { id: 'tende', label: 'Tende', color: 'violet', icon: 'tent' },
  { id: 'controtelai', label: 'Controtelai', color: 'ocra', icon: 'frame' },
]

// ── STRUTTURA MISURE ─────────────────────────────────────────────
export interface MisureVano {
  larghezza_sx: string
  larghezza_cx: string
  larghezza_dx: string
  altezza_sx: string
  altezza_cx: string
  altezza_dx: string
  diagonale_1: string
  diagonale_2: string
  spalletta_sx: string
  spalletta_dx: string
  note: string
}

// ── VANO ─────────────────────────────────────────────────────────
export interface Vano {
  id: string
  rilievo_id: string
  nome: string
  settore: Settore
  numero: number
  piano: string
  zona: string
  tipo_misure: TipoMisure
  misure: MisureVano
  foto_ids: string[]
  stato: 'vuoto' | 'parziale' | 'completo'
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
  vani: Vano[]
  stato: 'bozza' | 'in_corso' | 'completato'
  created_at: string
  updated_at: string
}

// ── EMPTY MISURE ─────────────────────────────────────────────────
export function emptyMisure(): MisureVano {
  return {
    larghezza_sx: '', larghezza_cx: '', larghezza_dx: '',
    altezza_sx: '', altezza_cx: '', altezza_dx: '',
    diagonale_1: '', diagonale_2: '',
    spalletta_sx: '', spalletta_dx: '',
    note: '',
  }
}

// ── CONTROLLA SE MISURE COMPLETE ─────────────────────────────────
export function isMisureComplete(m: MisureVano): boolean {
  return !!(m.larghezza_cx && m.altezza_cx)
}

// ── TIPO MISURE LABEL ────────────────────────────────────────────
export const TIPO_MISURE_LABEL: Record<TipoMisure, string> = {
  provvisorie: 'Provvisorie',
  verificate: 'Verificate',
  definitive: 'Definitive',
  da_rivedere: 'Da rivedere',
  personalizzato: 'Personalizzato',
}

export const TIPO_MISURE_DESC: Record<TipoMisure, string> = {
  provvisorie: 'Prima visita, misure indicative',
  verificate: 'Controllate sul posto',
  definitive: 'Misure finali, preventivo sbloccato',
  da_rivedere: 'Discrepanze, ricontrollare',
  personalizzato: 'Tipo a scelta, descrivi nelle note',
}
