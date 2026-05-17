// ── EVENTO ──────────────────────────────────────────────────────
export type EventoTipo = 'sopralluogo' | 'cantiere' | 'firma' | 'task'
export type EventoStato = 'programmato' | 'completato' | 'annullato' | 'spostato'

export interface Evento {
  id: string
  user_id: string
  data: string          // ISO date YYYY-MM-DD
  ora_inizio: string    // HH:MM
  durata_min: number
  tipo: EventoTipo
  titolo: string
  indirizzo?: string
  citta?: string
  cliente_id?: string
  commessa_id?: string
  commessa_ref?: string // es: S-0062
  note?: string
  stato: EventoStato
  created_at: string
  // join opzionali
  cliente?: { nome: string; telefono?: string }
  commessa?: { ref: string; vani_count?: number; materiale?: string }
}

// ── PRIORITA ────────────────────────────────────────────────────
export type PrioritaLivello = 'alta' | 'media' | 'bassa'

export interface PrioritaTitolare {
  id: string
  user_id: string
  titolo: string
  descrizione?: string
  commessa_ref?: string
  livello: PrioritaLivello
  scadenza?: string
  stato: 'attiva' | 'risolta'
  created_at: string
}

// ── COMMESSA ────────────────────────────────────────────────────
export interface Commessa {
  id: string
  ref: string           // es: S-0062
  cliente_id: string
  titolo?: string
  stato: string
  created_at: string
  cliente?: { nome: string; email?: string; telefono?: string }
}

// ── CLIENTE ─────────────────────────────────────────────────────
export interface Cliente {
  id: string
  nome: string
  email?: string
  telefono?: string
  indirizzo?: string
  citta?: string
}

// ── NOTIFICA ────────────────────────────────────────────────────
export type NotificaTipo = 'evento' | 'commessa' | 'sistema' | 'priorita'

export interface Notifica {
  id: string
  user_id: string
  tipo: NotificaTipo
  titolo: string
  body?: string
  letta: boolean
  link?: string
  created_at: string
}

// ── SEARCH RESULT ───────────────────────────────────────────────
export interface SearchResult {
  type: 'evento' | 'commessa' | 'cliente'
  id: string
  label: string
  sublabel?: string
  link: string
}

// ── SLOT LIBERO (modal sposta) ──────────────────────────────────
export interface SlotLibero {
  data: string          // YYYY-MM-DD
  ora: string           // HH:MM
  operatori_disponibili: string[]
}

// ── PROPS COMPONENTI ────────────────────────────────────────────
export interface EventRowProps {
  evento: Evento
  isExpanded: boolean
  isNext: boolean
  onToggle: (id: string) => void
  onSposta: (evento: Evento) => void
}

export interface CalendarHeroProps {
  selectedDate: Date
  viewMode: 'day' | 'week' | 'month'
  eventiPerData: Record<string, Evento[]>
  onDateChange: (date: Date) => void
  onViewModeChange: (mode: 'day' | 'week' | 'month') => void
}

export interface SpostaEventoModalProps {
  evento: Evento | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (eventoId: string, nuovaData: string, nuoraOra: string) => Promise<void>
}

// ── STATO HOOKS ─────────────────────────────────────────────────
export interface HomeState {
  selectedDate: Date
  viewMode: 'day' | 'week' | 'month'
  expandedEventId: string | null
  spostaEventoTarget: Evento | null
  notifichePanelOpen: boolean
  searchOpen: boolean
}
