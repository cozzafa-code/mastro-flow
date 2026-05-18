// ═══════════════════════════════════════════════════
// fliwoX — Tipi modulo Clienti 360°
// ═══════════════════════════════════════════════════

export type ClienteStato = 'attivo' | 'lead' | 'pausa' | 'perso'
export type ClienteTipo = 'privato' | 'azienda'
export type CanalePref = 'whatsapp' | 'call' | 'sms' | 'email'
export type DiarySource = 'manual' | 'auto_birthday' | 'auto_maintenance' | 'auto_anniversary' | 'auto_followup' | 'auto_winback'
export type DiaryActionType = 'schedula_auguri' | 'crea_impegno' | 'manda_whatsapp' | 'manda_email' | 'chiedi_recensione' | 'crea_promo' | 'ignored'
export type ComunicazioneCanale = 'mail' | 'whatsapp' | 'sms' | 'call'

export interface Cliente {
  id: string
  org_id: string
  codice: string
  tipo: ClienteTipo
  nome: string
  codice_fiscale?: string
  partita_iva?: string
  data_nascita?: string
  data_costituzione?: string
  email_principale?: string
  telefono_principale?: string
  whatsapp_numero?: string
  foto_url?: string
  citta_principale?: string
  provincia_principale?: string
  stato: ClienteStato
  livello_vip: number
  rating_clienti?: number
  tags: string[]
  origine?: string
  referral_da_cliente_id?: string
  canale_preferito: CanalePref
  orario_preferito_da?: string
  orario_preferito_a?: string
  cliente_dal?: string
  num_commesse: number
  fatturato_totale: number
  ultima_attivita_at?: string
  nota_breve?: string
  archived: boolean
  created_at: string
  updated_at: string
}

export interface ClienteIndirizzo {
  id: string
  cliente_id: string
  tipo: 'principale' | 'installazione' | 'spedizione' | 'fatturazione' | 'altro'
  etichetta?: string
  via: string
  numero_civico?: string
  cap?: string
  citta: string
  provincia?: string
  paese: string
  is_default: boolean
  note?: string
  created_at: string
}

export interface DiaryEntry {
  id: string
  org_id: string
  cliente_id: string
  source: DiarySource
  categoria?: string
  testo: string
  importanza: 1 | 2 | 3
  related_commessa_id?: string
  action_required: boolean
  action_taken: boolean
  action_type?: DiaryActionType
  action_taken_at?: string
  agenda_impegno_id?: string
  show_in_calendar: boolean
  due_at?: string
  expires_at?: string
  dismissed: boolean
  created_at: string
  updated_at: string
}

export interface ReminderSettings {
  id: string
  org_id: string
  master_enabled: boolean
  show_in_agenda: boolean
  birthday_enabled: boolean
  birthday_days_before: number
  birthday_canale_suggerito: string
  maintenance_enabled: boolean
  maintenance_years: number
  anniversary_enabled: boolean
  anniversary_months_after: number
  followup_enabled: boolean
  followup_days: number
  winback_enabled: boolean
  winback_months: number
  quiet_hours_start: string
  quiet_hours_end: string
}

export interface Comunicazione {
  id: string
  cliente_id: string
  canale: ComunicazioneCanale
  direzione: 'in' | 'out'
  oggetto?: string
  contenuto?: string
  durata_secondi?: number
  comunicazione_at: string
  created_at: string
}

// Colori per stato cliente
export const STATO_COLOR: Record<ClienteStato, { bg: string; text: string; label: string }> = {
  attivo:  { bg: 'var(--teal-bg)',    text: 'var(--teal-deep)',  label: 'Attivo' },
  lead:    { bg: 'var(--ocra-bg)',    text: 'var(--ocra-deep)',  label: 'Lead' },
  pausa:   { bg: 'var(--surface-3)',  text: 'var(--ink-dim)',    label: 'Pausa' },
  perso:   { bg: 'var(--red-bg)',     text: 'var(--red-deep)',   label: 'Perso' },
}

// Colori per source diary
export const DIARY_SOURCE_META: Record<DiarySource, { label: string; color: string; icon: string }> = {
  manual:            { label: 'Nota',         color: 'var(--teal)',   icon: 'note' },
  auto_birthday:     { label: 'Compleanno',   color: 'var(--pink)',   icon: 'birthday' },
  auto_maintenance:  { label: 'Manutenzione', color: 'var(--teal)',   icon: 'tool' },
  auto_anniversary:  { label: 'Anniversario', color: 'var(--success)', icon: 'star' },
  auto_followup:     { label: 'Follow-up',    color: 'var(--red)',    icon: 'alert' },
  auto_winback:      { label: 'Win-back',     color: 'var(--ocra)',   icon: 'handshake' },
}

// Iniziali + colore avatar da nome
export function getInitials(nome: string): string {
  const words = nome.trim().split(' ')
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return nome.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  { bg: 'var(--teal-bg)', text: 'var(--teal-deep)' },
  { bg: 'var(--ocra-bg)', text: 'var(--ocra-deep)' },
  { bg: 'var(--blue-bg)', text: 'var(--blue-deep)' },
  { bg: 'var(--red-bg)', text: 'var(--red-deep)' },
  { bg: 'var(--success-bg)', text: 'var(--success)' },
]

export function getAvatarColor(nome: string) {
  const idx = nome.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}
