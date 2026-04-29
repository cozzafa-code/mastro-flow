// hooks/useHomeMobile.ts
// Hook dati Home mobile fliwoX. Mock tipizzati pronti per cablaggio Supabase.

import { useMemo } from 'react'

// ───────── tipi ─────────

export type StatoOperatore = 'attivo' | 'pausa' | 'problema' | 'viaggio'

export interface Operatore {
  id: string
  nome: string
  attivita: string
  stato: StatoOperatore
  tempo: string
  telefono?: string
  posizione?: { lat: number; lng: number }
}

export interface AttivitaOggi {
  id: string
  ora: string
  titolo: string
  indirizzo: string
  azione_primaria: 'VAI' | 'CHIAMA'
  azione_secondaria: 'COMPLETA' | 'SPOSTA' | 'FATTO'
  telefono?: string
}

export type LivelloCommessa = 'ritardo' | 'problema' | 'fermo'

export interface CommessaCritica {
  id: string
  cliente: string
  titolo: string
  motivo: string
  livello: LivelloCommessa
  azione: 'RISOLVI' | 'GESTISCI' | 'SBLOCCA'
}

export interface Problema {
  id: string
  titolo: string
  contesto: string
  azione: 'RISOLVI' | 'ASSEGNA' | 'APRI'
}

export interface EventoAgenda {
  id: string
  data: string // 'YYYY-MM-DD'
  ora: string
  titolo: string
  cliente: string
  indirizzo: string
}

export interface GiornoAgenda {
  data: string         // 'YYYY-MM-DD'
  label_giorno: string // 'lun', 'mar'
  numero: number       // 28
  oggi: boolean
  count: number        // num eventi
}

export type StatoOrdine = 'IN_LAVORAZIONE' | 'IN_ATTESA' | 'FERMO'

export interface OrdineProduzione {
  id: string
  codice: string
  descrizione: string
  stato: StatoOrdine
  percentuale?: number // solo IN_LAVORAZIONE
}

export interface GiornoCarico {
  data: string         // 'YYYY-MM-DD'
  label: string        // 'lun 28'
  abbrev: string       // 'L'
  percentuale: number
  oggi: boolean
}

export interface SoldiVeloce {
  fatturato_oggi: number
  fatturato_ieri: number
  in_lavorazione: number
  in_lavorazione_var: number // delta percentuale vs settimana scorsa
  in_attesa: number
  clienti_non_paganti: number
}

export interface OperatoreFermo {
  id: string
  nome: string
  minuti_fermo: number
  motivo: string
  telefono?: string
}

export interface HomeData {
  user: { nome: string; iniziali: string; data: string }
  oggi: { lavori: number; task: number; problemi: number; attivita: AttivitaOggi[] }
  team: { attivi: number; problemi: number; operatori: Operatore[] }
  commesse: CommessaCritica[]
  problemi: Problema[]
  agenda: { giorni: GiornoAgenda[]; eventi: EventoAgenda[] }
  produzione: { in_corso: number; fermi: number; ordini: OrdineProduzione[] }
  carico: { settimana: GiornoCarico[] }
  soldi: SoldiVeloce
  operatore_fermo: OperatoreFermo | null
}

// ───────── hook ─────────

export function useHomeMobile(): { data: HomeData; loading: boolean } {
  const data = useMemo<HomeData>(() => MOCK_DATA, [])
  return { data, loading: false }
}

// ───────── mock ─────────

const MOCK_DATA: HomeData = {
  user: { nome: 'FABIO', iniziali: 'FA', data: 'Martedi 28 Aprile' },

  oggi: {
    lavori: 3,
    task: 2,
    problemi: 1,
    attivita: [
      { id: 'a1', ora: '08:30', titolo: 'Montaggio infissi - Rossi', indirizzo: 'Via Roma 12, Milano', azione_primaria: 'VAI', azione_secondaria: 'COMPLETA' },
      { id: 'a2', ora: '10:30', titolo: 'Sopralluogo - Bianchi', indirizzo: 'Via Verdi 45, Milano', azione_primaria: 'VAI', azione_secondaria: 'SPOSTA' },
      { id: 'a3', ora: '14:00', titolo: 'Chiamare cliente Verdi', indirizzo: '+39 333 1234567', azione_primaria: 'CHIAMA', azione_secondaria: 'FATTO', telefono: '+393331234567' },
    ],
  },

  team: {
    attivi: 5,
    problemi: 1,
    operatori: [
      { id: 'o1', nome: 'Marco Rossi', attivita: 'Montaggio Rossi', stato: 'attivo', tempo: '2h 15m', telefono: '+393331111111' },
      { id: 'o2', nome: 'Luca Bianchi', attivita: 'Pausa', stato: 'pausa', tempo: '25m', telefono: '+393332222222' },
      { id: 'o3', nome: 'Gianni Verdi', attivita: 'Problema vetro', stato: 'problema', tempo: '10m', telefono: '+393333333333' },
      { id: 'o4', nome: 'Paolo Neri', attivita: 'In viaggio', stato: 'viaggio', tempo: '14:30', telefono: '+393334444444' },
    ],
  },

  commesse: [
    { id: 'c1', cliente: 'Rossi', titolo: 'Rossi - Montaggio infissi', motivo: 'RITARDO 2 giorni', livello: 'ritardo', azione: 'RISOLVI' },
    { id: 'c2', cliente: 'Verdi', titolo: 'Verdi - Sostituzione vetri', motivo: 'Vetro mancante', livello: 'problema', azione: 'GESTISCI' },
    { id: 'c3', cliente: 'Bianchi', titolo: 'Bianchi - Manutenzione', motivo: 'Fermo in attesa materiali', livello: 'fermo', azione: 'SBLOCCA' },
  ],

  problemi: [
    { id: 'p1', titolo: 'Vetro non arrivato', contesto: 'Commessa S-0001 - Verdi', azione: 'RISOLVI' },
    { id: 'p2', titolo: 'Ritardo fornitore', contesto: 'Ordine 9131G - Produzione', azione: 'ASSEGNA' },
    { id: 'p3', titolo: 'Muro fuori squadra', contesto: 'Commessa S-0003 - Rossi', azione: 'APRI' },
  ],

  agenda: {
    giorni: [
      { data: '2026-04-26', label_giorno: 'dom', numero: 26, oggi: false, count: 0 },
      { data: '2026-04-27', label_giorno: 'lun', numero: 27, oggi: false, count: 2 },
      { data: '2026-04-28', label_giorno: 'mar', numero: 28, oggi: true, count: 3 },
      { data: '2026-04-29', label_giorno: 'mer', numero: 29, oggi: false, count: 4 },
      { data: '2026-04-30', label_giorno: 'gio', numero: 30, oggi: false, count: 1 },
      { data: '2026-05-01', label_giorno: 'ven', numero: 1, oggi: false, count: 2 },
      { data: '2026-05-02', label_giorno: 'sab', numero: 2, oggi: false, count: 0 },
    ],
    eventi: [
      { id: 'e1', data: '2026-04-28', ora: '10:30', titolo: 'Sopralluogo', cliente: 'Cliente Verdi', indirizzo: 'Via Verdi 45, Milano' },
      { id: 'e2', data: '2026-04-28', ora: '14:00', titolo: 'Consegna materiali', cliente: 'Cantiere Rossi', indirizzo: 'Via Roma 12, Milano' },
      { id: 'e3', data: '2026-04-28', ora: '16:30', titolo: 'Riunione team', cliente: 'Ufficio', indirizzo: 'Sala riunioni' },
    ],
  },

  produzione: {
    in_corso: 3,
    fermi: 1,
    ordini: [
      { id: 'op1', codice: '9131G', descrizione: 'Serramenti alluminio', stato: 'FERMO' },
      { id: 'op2', codice: '9131H', descrizione: 'Vetri temperati', stato: 'IN_ATTESA' },
      { id: 'op3', codice: '9131I', descrizione: 'Serramenti alluminio', stato: 'IN_LAVORAZIONE', percentuale: 65 },
    ],
  },

  carico: {
    settimana: [
      { data: '2026-04-28', label: 'mar 28', abbrev: 'M', percentuale: 80, oggi: true },
      { data: '2026-04-29', label: 'mer 29', abbrev: 'M', percentuale: 120, oggi: false },
      { data: '2026-04-30', label: 'gio 30', abbrev: 'G', percentuale: 65, oggi: false },
      { data: '2026-05-01', label: 'ven 01', abbrev: 'V', percentuale: 95, oggi: false },
      { data: '2026-05-02', label: 'sab 02', abbrev: 'S', percentuale: 30, oggi: false },
      { data: '2026-05-03', label: 'dom 03', abbrev: 'D', percentuale: 0, oggi: false },
      { data: '2026-05-04', label: 'lun 04', abbrev: 'L', percentuale: 75, oggi: false },
    ],
  },

  soldi: {
    fatturato_oggi: 4250,
    fatturato_ieri: 3800,
    in_lavorazione: 14800,
    in_lavorazione_var: 8,
    in_attesa: 2100,
    clienti_non_paganti: 3,
  },

  operatore_fermo: {
    id: 'o2',
    nome: 'Luca Bianchi',
    minuti_fermo: 45,
    motivo: 'Non ha lavoro assegnato',
    telefono: '+393332222222',
  },
}
