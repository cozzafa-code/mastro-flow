// hooks/useHomeMobile.ts
// Home mobile fliwoX v2 - cablato su MastroContext.
// Legge da useMastro() se presente, fallback a mock altrimenti.

import { useMemo } from 'react'
import { useMastro } from '../components/MastroContext'

// ───────── tipi ─────────

export type StatoOperatore = 'attivo' | 'pausa' | 'problema' | 'viaggio'

export interface Operatore {
  id: string
  nome: string
  attivita: string
  stato: StatoOperatore
  tempo: string
  telefono?: string
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
  data: string
  ora: string
  titolo: string
  cliente: string
  indirizzo: string
}

export interface GiornoAgenda {
  data: string
  label_giorno: string
  numero: number
  oggi: boolean
  count: number
}

export type StatoOrdine = 'IN_LAVORAZIONE' | 'IN_ATTESA' | 'FERMO'

export interface OrdineProduzione {
  id: string
  codice: string
  descrizione: string
  stato: StatoOrdine
  percentuale?: number
}

export interface GiornoCarico {
  data: string
  label: string
  abbrev: string
  percentuale: number
  oggi: boolean
}

export interface SoldiVeloce {
  fatturato_oggi: number
  fatturato_ieri: number
  in_lavorazione: number
  in_lavorazione_var: number
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

// ───────── helpers ─────────

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const GIORNI = ['Domenica','Lunedi','Martedi','Mercoledi','Giovedi','Venerdi','Sabato']
const GIORNI_BREVI = ['dom','lun','mar','mer','gio','ven','sab']

function dataItaliana(d: Date): string {
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function inizialiDa(s: string): string {
  if (!s) return '?'
  const parts = s.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0] || '').join('').toUpperCase() || '?'
}

// fasi pipeline che indicano commessa critica
const FASI_FERMO = ['sopralluogo', 'preventivo', 'conferma_ordine', 'ordine_confermato']

// ───────── hook ─────────

export function useHomeMobile(): { data: HomeData; loading: boolean } {
  const ctx: any = (() => { try { return useMastro() } catch { return {} } })()

  const data = useMemo<HomeData>(() => {
    const today = new Date()
    const userNome = (ctx?.user?.nome || ctx?.aziendaInfo?.titolare || 'TITOLARE').toString().toUpperCase()
    const userIniziali = inizialiDa(userNome)

    const cantieri: any[] = ctx?.cantieri || []
    const fattureDB: any[] = ctx?.fattureDB || []
    const ordiniFornDB: any[] = ctx?.ordiniFornDB || []
    const team: any[] = ctx?.team || []
    const tasks: any[] = ctx?.tasks || []
    const problemiCtx: any[] = ctx?.problemi || []
    const montaggiDB: any[] = ctx?.montaggiDB || []
    const giorniFermaCM = ctx?.giorniFermaCM || (() => 0)
    const sogliaDays = ctx?.sogliaDays || 7

    // ── COMMESSE CRITICHE: ferma da troppo tempo o pagata in attesa
    const commesseCritiche: CommessaCritica[] = cantieri
      .filter((c: any) => {
        const giorniFerma = giorniFermaCM(c)
        return giorniFerma >= sogliaDays && c.fase !== 'chiusura' && c.fase !== 'pagata'
      })
      .slice(0, 3)
      .map((c: any) => {
        const giorni = giorniFermaCM(c)
        const livello: LivelloCommessa =
          giorni >= sogliaDays * 2 ? 'ritardo' :
          c.fase === 'ordine_confermato' ? 'fermo' : 'problema'
        const azione: 'RISOLVI' | 'GESTISCI' | 'SBLOCCA' =
          livello === 'ritardo' ? 'RISOLVI' :
          livello === 'fermo' ? 'SBLOCCA' : 'GESTISCI'
        const cliente = `${c.cliente || ''}${c.cognome ? ' ' + c.cognome : ''}`.trim() || 'Cliente'
        return {
          id: c.id || `c${Math.random()}`,
          cliente,
          titolo: cliente,
          motivo: `Ferma da ${giorni} giorni`,
          livello,
          azione,
        }
      })

    // ── CASSA: aggrego da fatture e cantieri
    let fatturatoOggi = 0
    let inLavorazione = 0
    let inAttesa = 0
    let clientiNonPaganti = 0
    const todayStr = ymd(today)

    fattureDB.forEach((f: any) => {
      const tot = Number(f.totale || f.importo || f.amount || 0)
      const stato = (f.stato || '').toLowerCase()
      const dataF = f.data || f.dataEmissione || f.data_emissione
      if (stato === 'pagata' || stato === 'incassata') {
        if (dataF && String(dataF).startsWith(todayStr)) fatturatoOggi += tot
      } else if (stato === 'da_pagare' || stato === 'attesa' || stato === 'in_attesa' || stato === 'scaduta') {
        inAttesa += tot
        clientiNonPaganti += 1
      }
    })

    cantieri.forEach((c: any) => {
      const tot = Number(c.totale || c.importo || 0)
      if (c.fase && c.fase !== 'chiusura' && c.fase !== 'pagata') inLavorazione += tot
    })

    // ── PROBLEMI: dal ctx.problemi
    const problemi: Problema[] = problemiCtx.slice(0, 3).map((p: any) => ({
      id: p.id || `p${Math.random()}`,
      titolo: p.titolo || p.descrizione || 'Problema',
      contesto: p.contesto || p.commessa || p.cliente || '',
      azione: 'RISOLVI' as const,
    }))

    // ── OGGI OPERATIVO: top 3 task/montaggi di oggi
    const attivitaOggi: AttivitaOggi[] = []
    montaggiDB
      .filter((m: any) => m.data && String(m.data).startsWith(todayStr))
      .slice(0, 3)
      .forEach((m: any) => {
        attivitaOggi.push({
          id: m.id || `m${Math.random()}`,
          ora: (m.ora || '08:00').slice(0, 5),
          titolo: m.titolo || `Montaggio ${m.cliente || ''}`.trim(),
          indirizzo: m.indirizzo || m.luogo || '',
          azione_primaria: 'VAI',
          azione_secondaria: 'COMPLETA',
        })
      })

    // ── TEAM LIVE: usa team del ctx, mappa stati
    const operatori: Operatore[] = team.slice(0, 4).map((t: any) => ({
      id: t.id || `o${Math.random()}`,
      nome: t.nome || 'Operatore',
      attivita: t.attivita || t.stato || 'Operativo',
      stato: (t.stato as StatoOperatore) || 'attivo',
      tempo: t.tempo || '',
      telefono: t.telefono,
    }))

    const teamAttivi = operatori.filter(o => o.stato === 'attivo' || o.stato === 'viaggio').length
    const teamProblemi = operatori.filter(o => o.stato === 'problema').length

    // ── AGENDA: 7 giorni
    const giorniAgenda: GiornoAgenda[] = []
    for (let i = -1; i <= 5; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dStr = ymd(d)
      const eventiCount = montaggiDB.filter((m: any) => m.data && String(m.data).startsWith(dStr)).length
      giorniAgenda.push({
        data: dStr,
        label_giorno: GIORNI_BREVI[d.getDay()],
        numero: d.getDate(),
        oggi: i === 0,
        count: eventiCount,
      })
    }

    const eventi: EventoAgenda[] = montaggiDB
      .filter((m: any) => m.data && String(m.data).startsWith(todayStr))
      .slice(0, 5)
      .map((m: any) => ({
        id: m.id || `e${Math.random()}`,
        data: todayStr,
        ora: (m.ora || '08:00').slice(0, 5),
        titolo: m.titolo || `Montaggio ${m.cliente || ''}`.trim(),
        cliente: m.cliente || '',
        indirizzo: m.indirizzo || m.luogo || '',
      }))

    // ── PRODUZIONE: ordini fornitori
    const ordini: OrdineProduzione[] = ordiniFornDB.slice(0, 3).map((o: any) => {
      const stato: StatoOrdine =
        o.stato === 'arrivato' || o.stato === 'consegnato' ? 'IN_LAVORAZIONE' :
        o.stato === 'fermo' || o.stato === 'ritardo' ? 'FERMO' :
        'IN_ATTESA'
      return {
        id: o.id || `op${Math.random()}`,
        codice: o.codice || o.numero || 'ORD',
        descrizione: o.descrizione || o.fornitore || '',
        stato,
        percentuale: stato === 'IN_LAVORAZIONE' ? (o.percentuale || 50) : undefined,
      }
    })

    const produzione = {
      in_corso: ordini.filter(o => o.stato === 'IN_LAVORAZIONE').length,
      fermi: ordini.filter(o => o.stato === 'FERMO').length,
      ordini,
    }

    // ── CARICO LAVORO: 7 giorni
    const settimana: GiornoCarico[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dStr = ymd(d)
      const eventiGiorno = montaggiDB.filter((m: any) => m.data && String(m.data).startsWith(dStr)).length
      const taskGiorno = tasks.filter((t: any) => t.data && String(t.data).startsWith(dStr)).length
      const totale = eventiGiorno + taskGiorno
      const cap = 5
      const perc = Math.min(Math.round(totale / cap * 100), 150)
      settimana.push({
        data: dStr,
        label: `${GIORNI_BREVI[d.getDay()]} ${d.getDate()}`,
        abbrev: GIORNI_BREVI[d.getDay()].charAt(0).toUpperCase(),
        percentuale: perc,
        oggi: i === 0,
      })
    }

    // ── OPERATORE FERMO: pausa > 30min
    const opFermo = operatori.find(o => o.stato === 'pausa')
    const operatoreFermo: OperatoreFermo | null = opFermo ? {
      id: opFermo.id,
      nome: opFermo.nome,
      minuti_fermo: 30,
      motivo: opFermo.attivita || 'In pausa',
      telefono: opFermo.telefono,
    } : null

    return {
      user: {
        nome: userNome,
        iniziali: userIniziali,
        data: dataItaliana(today),
      },
      oggi: {
        lavori: cantieri.filter((c: any) => c.fase && FASI_FERMO.includes(c.fase)).length,
        task: tasks.filter((t: any) => t.data && String(t.data).startsWith(todayStr)).length,
        problemi: problemiCtx.length,
        attivita: attivitaOggi,
      },
      team: { attivi: teamAttivi, problemi: teamProblemi, operatori },
      commesse: commesseCritiche,
      problemi,
      agenda: { giorni: giorniAgenda, eventi },
      produzione,
      carico: { settimana },
      soldi: {
        fatturato_oggi: fatturatoOggi,
        fatturato_ieri: 0,
        in_lavorazione: inLavorazione,
        in_lavorazione_var: 0,
        in_attesa: inAttesa,
        clienti_non_paganti: clientiNonPaganti,
      },
      operatore_fermo: operatoreFermo,
    }
  }, [ctx])

  return { data, loading: false }
}
