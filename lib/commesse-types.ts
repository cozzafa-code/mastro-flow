// ── TIPI ────────────────────────────────────────────────────────

export type Fase = 'APP' | 'MIS' | 'PRV' | 'CNF' | 'ACC' | 'ORD' | 'MAT' | 'MON' | 'END'
export type Layout = 'card' | 'lista' | 'griglia'
export type FilterType = 'all' | 'appuntamenti' | 'misure' | 'preventivi' | 'conferme' | 'acconti' | 'ordini' | 'materiali' | 'montaggi' | 'da_fatturare'
export type SortType = 'updated_desc' | 'created_desc' | 'created_asc' | 'value_desc' | 'value_asc' | 'name_asc' | 'name_desc' | 'phase'
export type FlagType = 'red' | 'ocra' | 'success' | null

export interface Commessa {
  id: string
  user_id: string
  codice: string
  cliente_id?: string
  cliente_nome: string
  indirizzo?: string
  citta?: string
  valore_eur?: number
  fase: Fase
  sotto_stato?: string
  giorni_in_fase: number
  giorni_da_invio?: number
  giorni_ritardo_fornitore?: number
  created_at: string
  updated_at: string
  is_da_fatturare?: boolean
}

// ── LABEL FASI ──────────────────────────────────────────────────
export const FASE_LABEL: Record<Fase, string> = {
  APP: 'APP', MIS: 'MIS', PRV: 'PRV', CNF: 'CNF', ACC: 'ACC',
  ORD: 'ORD', MAT: 'MAT', MON: 'MON', END: 'END',
}

export const FASI: Fase[] = ['APP','MIS','PRV','CNF','ACC','ORD','MAT','MON','END']

// ── FILTRI ──────────────────────────────────────────────────────
export const FILTER_LABEL: Record<FilterType, string> = {
  all: 'Tutte',
  appuntamenti: 'Appuntamenti',
  misure: 'Misure',
  preventivi: 'Preventivi',
  conferme: 'Conferme',
  acconti: 'Acconti',
  ordini: 'Ordini',
  materiali: 'Materiali',
  montaggi: 'Montaggi',
  da_fatturare: 'Da fatturare',
}

export const SORT_LABEL: Record<SortType, string> = {
  updated_desc: 'Ultimo aggiornamento',
  created_desc: 'Creazione (recente)',
  created_asc: 'Creazione (vecchia)',
  value_desc: 'Valore € (↓)',
  value_asc: 'Valore € (↑)',
  name_asc: 'Cliente A→Z',
  name_desc: 'Cliente Z→A',
  phase: 'Per fase',
}

// ── LOGICA FLAG ──────────────────────────────────────────────────
export function getFlag(c: Commessa): FlagType {
  if (c.giorni_in_fase > 14 && ['PRV','CNF','ACC'].includes(c.fase)) return 'red'
  if (c.fase === 'MAT' && (c.giorni_ritardo_fornitore ?? 0) > 7) return 'red'
  if (c.fase === 'END' && c.sotto_stato === 'cantiere_da_completare') return 'red'
  if (c.fase === 'END' && c.sotto_stato === 'da_fatturare') return 'success'
  if (c.fase === 'MAT' && c.sotto_stato === 'arrivato_completo') return 'success'
  if (c.fase === 'PRV' && (c.giorni_da_invio ?? 0) > 7) return 'ocra'
  if (c.fase === 'CNF' && c.sotto_stato === 'da_inviare') return 'ocra'
  if (c.fase === 'ACC' && c.sotto_stato === 'fattura_inviata_non_pagata') return 'ocra'
  return null
}

// ── COLORE AVATAR ────────────────────────────────────────────────
export function getAvatarColor(fase: Fase): string {
  if (['APP','MIS'].includes(fase)) return 'linear-gradient(160deg, var(--teal), var(--teal-deep))'
  if (['PRV','CNF'].includes(fase)) return 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))'
  if (['ACC','ORD'].includes(fase)) return 'linear-gradient(160deg, var(--blue), var(--blue-deep))'
  if (fase === 'MAT') return 'linear-gradient(160deg, #5B4FE8, #3D32B0)'
  if (fase === 'MON') return 'linear-gradient(160deg, var(--ink-2), var(--ink))'
  if (fase === 'END') return 'linear-gradient(160deg, var(--success), #1F5A3D)'
  return 'linear-gradient(160deg, var(--teal), var(--teal-deep))'
}

// ── INIZIALI CLIENTE ─────────────────────────────────────────────
export function getInitials(nome: string): string {
  return nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

// ── FORMATO VALORE ───────────────────────────────────────────────
export function formatValore(v?: number): string {
  if (!v) return '—'
  if (v >= 1000) return `${(v/1000).toFixed(1)}k€`
  return `${v}€`
}
