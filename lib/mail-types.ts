// ── TIPI BASE ────────────────────────────────────────────────────
export type EmailDirection = 'inbound' | 'outbound'
export type EmailCategory = 'cliente' | 'fornitore' | 'fattura' | 'lead' | 'urgente' | 'spam' | 'altro'
export type LeadStage = 'da_contattare' | 'in_attesa' | 'sopralluogo' | 'preventivo' | 'convertito' | 'perso'
export type AISuggestionType = 'crea_commessa' | 'aggiorna_pipeline' | 'schedula_followup' | 'allega_a_cm' | 'ignora'
export type AIProvider = 'fliwox_internal' | 'anthropic_byok' | 'openai_byok' | 'google_byok' | 'disabled'
export type EmailProviderType = 'imap_smtp' | 'postmark_dedicated'
export type MailVista = 'inbox' | 'lead_board'
export type MailFilter = 'tutte' | 'non_lette' | 'lead' | 'clienti' | 'fornitori' | 'fatture' | 'starred'

// ── ACCOUNT EMAIL ────────────────────────────────────────────────
export interface EmailAccount {
  id: string
  user_id: string
  provider_type: EmailProviderType
  display_name: string
  email_address: string
  is_default: boolean
  last_sync_at: string | null
  sync_status: 'idle' | 'syncing' | 'error'
  sync_error: string | null
}

// ── EMAIL ────────────────────────────────────────────────────────
export interface AIExtractedData {
  ral_codici?: string[]
  dimensioni?: string[]
  tipologie?: string[]
  importi?: number[]
  date?: string[]
}

export interface Email {
  id: string
  user_id: string
  account_id: string
  message_id: string
  thread_id: string | null
  in_reply_to: string | null
  direction: EmailDirection
  from_address: string
  from_name: string | null
  to_addresses: string[]
  cc_addresses: string[]
  bcc_addresses: string[]
  subject: string
  body_text: string
  body_html: string
  preview: string
  sent_at: string
  received_at: string | null
  is_read: boolean
  is_starred: boolean
  is_pinned: boolean
  is_archived: boolean
  is_trashed: boolean
  is_spam: boolean
  snoozed_until: string | null
  category: EmailCategory | null
  auto_categorized: boolean
  lead_stage: LeadStage | null
  lead_stage_updated_at: string | null
  commessa_id: string | null
  commessa_link_auto: boolean
  ai_summary: string | null
  ai_extracted_data: AIExtractedData
  ai_suggestion_type: AISuggestionType | null
  ai_suggestion_payload: Record<string, unknown>
  ai_suggestion_dismissed: boolean
  created_at: string
  updated_at: string
  // joins
  attachments?: EmailAttachment[]
  commessa?: { id: string; code: string; cliente: string } | null
}

// ── ALLEGATI ─────────────────────────────────────────────────────
export interface EmailAttachment {
  id: string
  email_id: string
  filename: string
  mime_type: string
  size_bytes: number
  storage_url: string | null
  saved_to_commessa_id: string | null
  saved_to_commessa_category: string | null
}

// ── TEMPLATE ─────────────────────────────────────────────────────
export interface EmailTemplate {
  id: string
  user_id: string
  name: string
  category: string
  subject_template: string
  body_template: string
  auto_attach_type: 'ultimo_preventivo' | 'ultimo_ddt' | 'ultima_fattura' | 'ultime_foto_vani' | null
  ordine: number
}

// ── AI SETTINGS ──────────────────────────────────────────────────
export interface AISettings {
  user_id: string
  ai_enabled: boolean
  ai_provider: AIProvider
  ai_smart_banner: boolean
  ai_auto_categorize: boolean
  ai_extract_technical_data: boolean
  ai_suggest_template: boolean
  ai_auto_link_commessa: boolean
}

// ── LEAD STAGES CONFIG ───────────────────────────────────────────
export const LEAD_STAGES: { id: LeadStage; label: string; color: string; bg: string; dot: string }[] = [
  { id: 'da_contattare', label: 'Da contattare', color: 'var(--teal-deep)',   bg: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))',     dot: 'var(--teal)'   },
  { id: 'in_attesa',     label: 'In attesa',     color: 'var(--ocra-deep)',   bg: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))',      dot: 'var(--ocra)'   },
  { id: 'sopralluogo',   label: 'Sopralluogo',   color: 'var(--blue-deep)',   bg: 'linear-gradient(160deg, var(--blue-bg), #C5CCE5)',              dot: 'var(--blue)'   },
  { id: 'preventivo',    label: 'Preventivo',    color: 'var(--violet-deep)', bg: 'linear-gradient(160deg, var(--violet-bg), var(--violet-mid))',  dot: 'var(--violet)' },
  { id: 'convertito',    label: 'Vinto',         color: 'var(--success)',     bg: 'linear-gradient(160deg, var(--success-bg), var(--success-mid))', dot: 'var(--success)' },
  { id: 'perso',         label: 'Perso',         color: 'var(--red-deep)',    bg: 'linear-gradient(160deg, var(--red-bg), var(--red-mid))',         dot: 'var(--red)'   },
]

// ── CAT COLORS ───────────────────────────────────────────────────
export const CAT_COLOR: Record<EmailCategory, { bg: string; color: string; label: string }> = {
  cliente:   { bg: 'var(--teal-bg)',    color: 'var(--teal-deep)',   label: 'Cliente'   },
  fornitore: { bg: 'var(--blue-bg)',    color: 'var(--blue-deep)',   label: 'Fornitore' },
  fattura:   { bg: 'var(--ocra-bg)',    color: 'var(--ocra-deep)',   label: 'Fattura'   },
  lead:      { bg: 'var(--violet-bg)',  color: 'var(--violet-deep)', label: 'Lead'      },
  urgente:   { bg: 'var(--red-bg)',     color: 'var(--red-deep)',    label: 'Urgente'   },
  spam:      { bg: 'var(--surface-2)',  color: 'var(--ink-soft)',    label: 'Spam'      },
  altro:     { bg: 'var(--surface-2)',  color: 'var(--ink-dim)',     label: 'Altro'     },
}

// ── AVATAR COLORS ────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))',     color: 'var(--teal-deep)'   },
  { bg: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))',      color: 'var(--ocra-deep)'   },
  { bg: 'linear-gradient(160deg, var(--blue-bg), #C5CCE5)',              color: 'var(--blue-deep)'   },
  { bg: 'linear-gradient(160deg, var(--violet-bg), var(--violet-mid))',  color: 'var(--violet-deep)' },
  { bg: 'linear-gradient(160deg, var(--red-bg), var(--red-mid))',        color: 'var(--red-deep)'    },
  { bg: 'linear-gradient(160deg, var(--success-bg), var(--success-mid))', color: 'var(--success)'   },
]

export function getAvatarColor(email: string) {
  const idx = email.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export function getAvatarInitial(name: string | null, email: string): string {
  return (name || email).trim().slice(0, 1).toUpperCase()
}

export function formatEmailTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3600000
  if (diffH < 24) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  if (diffH < 48) return 'Ieri'
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

export function groupEmailsByDate(emails: Email[]): Record<string, Email[]> {
  const now = new Date()
  const groups: Record<string, Email[]> = {}
  for (const e of emails) {
    const d = new Date(e.received_at || e.sent_at)
    const diffH = (now.getTime() - d.getTime()) / 3600000
    let key = 'PIÙ VECCHIE'
    if (diffH < 24) key = 'OGGI'
    else if (diffH < 48) key = 'IERI'
    else if (diffH < 168) key = 'QUESTA SETTIMANA'
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

export const SECTION_ORDER = ['OGGI', 'IERI', 'QUESTA SETTIMANA', 'PIÙ VECCHIE']
