// lib/preventivi/snapshot.ts
// Logica versioning preventivi: snapshot da rilievo, duplica per nuova versione, calcolo diff.
// NON modifica calcoli importi esistenti — solo gestione versioni e tracking modifiche.

import { createClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface PreventivoVersione {
  id: string
  commessa_id: string
  azienda_id: string
  numero: number
  versione: number
  padre_id: string | null
  stato: string
  data_emissione: string | null
  data_scadenza: string | null
  totale_netto: number | null
  totale_iva: number | null
  totale_lordo: number | null
  rilievo_origine_id: string | null
  snapshot_at: string | null
  pdf_url: string | null
  note: string | null
  created_at: string
}

export interface PreventivoVanoSnapshot {
  id: string
  preventivo_id: string
  vano_id_originale: string | null
  rilievo_id_originale: string | null
  ordine: number | null
  nome: string | null
  tipo: string | null
  pezzi: number | null
  stanza: string | null
  piano: string | null
  misure_complete: any
  vetro: string | null
  vetro_config: any
  colore_int: string | null
  colore_est: string | null
  bicolore: boolean | null
  accessori: any
  prezzo_unitario_calcolato: number | null
  prezzo_unitario_override: number | null
  posa_prezzo: number | null
  voci_libere: any
  note: string | null
}

export interface PreventivoModifica {
  id?: string
  preventivo_id: string
  azienda_id: string
  vano_id_originale: string | null
  vano_nome: string | null
  campo: string
  valore_prima: any
  valore_dopo: any
  tipo: 'add' | 'del' | 'mod'
  delta_prezzo: number | null
  motivo_cliente: string | null
  autore_nome: string | null
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════

function getSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// ═══════════════════════════════════════════════════════════════
// CARICA tutte le versioni di un preventivo
// ═══════════════════════════════════════════════════════════════

export async function caricaVersioni(commessaId: string, numero: number) {
  const sb = getSb()
  const { data, error } = await sb
    .from('preventivi')
    .select('*')
    .eq('commessa_id', commessaId)
    .eq('numero', numero)
    .order('versione', { ascending: false })
  if (error) throw error
  return (data || []) as PreventivoVersione[]
}

// Ultima versione (corrente)
export async function ultimaVersione(commessaId: string, numero: number) {
  const versioni = await caricaVersioni(commessaId, numero)
  return versioni[0] || null
}

// ═══════════════════════════════════════════════════════════════
// CARICA snapshot vani di una versione
// ═══════════════════════════════════════════════════════════════

export async function caricaSnapshot(preventivoId: string) {
  const sb = getSb()
  const { data, error } = await sb
    .from('preventivo_vani_snapshot')
    .select('*')
    .eq('preventivo_id', preventivoId)
    .order('ordine', { ascending: true })
  if (error) throw error
  return (data || []) as PreventivoVanoSnapshot[]
}

// ═══════════════════════════════════════════════════════════════
// CARICA modifiche di una versione (diff)
// ═══════════════════════════════════════════════════════════════

export async function caricaModifiche(preventivoId: string) {
  const sb = getSb()
  const { data, error } = await sb
    .from('preventivo_modifiche')
    .select('*')
    .eq('preventivo_id', preventivoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []) as PreventivoModifica[]
}

// ═══════════════════════════════════════════════════════════════
// DUPLICA: crea nuova versione (Vn+1) come copia di Vn
// ═══════════════════════════════════════════════════════════════

export async function duplicaPerNuovaVersione(
  preventivoSorgenteId: string,
  motivoCliente: string | null = null,
  autoreNome: string | null = null,
): Promise<PreventivoVersione> {
  const sb = getSb()

  // 1) Carico preventivo sorgente
  const { data: sorgente, error: errS } = await sb
    .from('preventivi')
    .select('*')
    .eq('id', preventivoSorgenteId)
    .single()
  if (errS) throw errS

  // 2) Trovo prossima versione per (commessa_id, numero)
  const { data: maxRow, error: errM } = await sb
    .from('preventivi')
    .select('versione')
    .eq('commessa_id', sorgente.commessa_id)
    .eq('numero', sorgente.numero)
    .order('versione', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (errM) throw errM
  const prossimaVer = (maxRow?.versione || 1) + 1

  // 3) Carico snapshot vani sorgente
  const snapshotSorgente = await caricaSnapshot(preventivoSorgenteId)

  // 4) Inserisco nuova versione preventivo
  const nuovoId = crypto.randomUUID()
  const { data: nuovo, error: errN } = await sb
    .from('preventivi')
    .insert({
      id: nuovoId,
      commessa_id: sorgente.commessa_id,
      azienda_id: sorgente.azienda_id,
      numero: sorgente.numero,
      versione: prossimaVer,
      padre_id: preventivoSorgenteId,
      stato: 'bozza',
      data_emissione: new Date().toISOString().slice(0, 10),
      data_scadenza: sorgente.data_scadenza,
      note: motivoCliente ? `Modifiche cliente: ${motivoCliente}` : sorgente.note,
      sconto_globale: sorgente.sconto_globale,
      iva_percentuale: sorgente.iva_percentuale,
      totale_netto: sorgente.totale_netto,
      totale_iva: sorgente.totale_iva,
      totale_lordo: sorgente.totale_lordo,
      margine_stimato: sorgente.margine_stimato,
      rilievo_origine_id: sorgente.rilievo_origine_id,
      snapshot_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (errN) throw errN

  // 5) Copio snapshot vani (deep copy) sotto nuovo preventivo_id
  if (snapshotSorgente.length > 0) {
    const copie = snapshotSorgente.map((v) => {
      const { id, preventivo_id, created_at, updated_at, ...resto } = v as any
      return {
        ...resto,
        id: crypto.randomUUID(),
        preventivo_id: nuovoId,
      }
    })
    const { error: errCopy } = await sb.from('preventivo_vani_snapshot').insert(copie)
    if (errCopy) throw errCopy
  }

  // 6) Log timeline universale (best-effort)
  try {
    await sb.from('timeline_universale').insert({
      modulo: 'commessa',
      entita_id: sorgente.commessa_id,
      azienda_id: sorgente.azienda_id,
      tipo: 'preventivo_v_creato',
      titolo: `Preventivo V${prossimaVer} creato (da V${sorgente.versione})`,
      descrizione: motivoCliente
        ? `Cliente ha richiesto modifiche: ${motivoCliente}`
        : `Nuova versione del preventivo PV-${String(sorgente.numero).padStart(3, '0')}`,
      autore_nome: autoreNome || 'Sistema',
      metadata: {
        preventivo_id: nuovoId,
        preventivo_padre_id: preventivoSorgenteId,
        versione: prossimaVer,
        versione_padre: sorgente.versione,
        numero: sorgente.numero,
      },
    })
  } catch (e) {
    console.warn('[snapshot] timeline log failed', e)
  }

  return nuovo as PreventivoVersione
}

// ═══════════════════════════════════════════════════════════════
// REGISTRA MODIFICA: traccia un cambiamento sul preventivo
// ═══════════════════════════════════════════════════════════════

export async function registraModifica(m: Omit<PreventivoModifica, 'id'>) {
  const sb = getSb()
  const { data, error } = await sb
    .from('preventivo_modifiche')
    .insert(m)
    .select()
    .single()
  if (error) throw error
  return data as PreventivoModifica
}

// ═══════════════════════════════════════════════════════════════
// CALCOLA DIFF tra due versioni (per UI confronto)
// ═══════════════════════════════════════════════════════════════

export interface DiffVano {
  vano_id_originale: string | null
  nome: string
  stato: 'invariato' | 'modificato' | 'aggiunto' | 'rimosso'
  prezzo_v1: number
  prezzo_v2: number
  delta: number
  modifiche: { campo: string; prima: any; dopo: any }[]
}

const CAMPI_CONFRONTO = [
  'tipo', 'pezzi', 'sistema', 'sottosistema',
  'vetro', 'colore_int', 'colore_est', 'bicolore', 'colore_acc',
  'telaio', 'rifilato', 'cassonetto', 'cassonetto_tipo',
  'prezzo_unitario_calcolato', 'prezzo_unitario_override',
  'posa_prezzo', 'note',
]

function vanoChiave(v: PreventivoVanoSnapshot): string {
  return v.vano_id_originale || `${v.ordine || 0}_${v.nome || ''}`
}

function prezzoVano(v: PreventivoVanoSnapshot): number {
  const p = Number(v.prezzo_unitario_override ?? v.prezzo_unitario_calcolato ?? 0)
  const pezzi = Number(v.pezzi ?? 1)
  const posa = Number(v.posa_prezzo ?? 0)
  return p * pezzi + posa
}

export function calcolaDiff(
  snapshotPrima: PreventivoVanoSnapshot[],
  snapshotDopo: PreventivoVanoSnapshot[],
): DiffVano[] {
  const result: DiffVano[] = []
  const mapPrima = new Map<string, PreventivoVanoSnapshot>()
  const mapDopo = new Map<string, PreventivoVanoSnapshot>()
  snapshotPrima.forEach((v) => mapPrima.set(vanoChiave(v), v))
  snapshotDopo.forEach((v) => mapDopo.set(vanoChiave(v), v))

  // Vani in entrambi → invariato o modificato
  for (const [k, v1] of mapPrima.entries()) {
    const v2 = mapDopo.get(k)
    if (!v2) {
      // Rimosso
      result.push({
        vano_id_originale: v1.vano_id_originale,
        nome: v1.nome || v1.tipo || '—',
        stato: 'rimosso',
        prezzo_v1: prezzoVano(v1),
        prezzo_v2: 0,
        delta: -prezzoVano(v1),
        modifiche: [],
      })
    } else {
      const modifiche: { campo: string; prima: any; dopo: any }[] = []
      for (const c of CAMPI_CONFRONTO) {
        const a = (v1 as any)[c]
        const b = (v2 as any)[c]
        if (JSON.stringify(a) !== JSON.stringify(b)) {
          modifiche.push({ campo: c, prima: a, dopo: b })
        }
      }
      const p1 = prezzoVano(v1)
      const p2 = prezzoVano(v2)
      result.push({
        vano_id_originale: v1.vano_id_originale,
        nome: v2.nome || v2.tipo || '—',
        stato: modifiche.length > 0 ? 'modificato' : 'invariato',
        prezzo_v1: p1,
        prezzo_v2: p2,
        delta: p2 - p1,
        modifiche,
      })
    }
  }

  // Vani solo in dopo → aggiunto
  for (const [k, v2] of mapDopo.entries()) {
    if (!mapPrima.has(k)) {
      result.push({
        vano_id_originale: v2.vano_id_originale,
        nome: v2.nome || v2.tipo || '—',
        stato: 'aggiunto',
        prezzo_v1: 0,
        prezzo_v2: prezzoVano(v2),
        delta: prezzoVano(v2),
        modifiche: [],
      })
    }
  }

  return result.sort((a, b) => {
    const order = { rimosso: 0, modificato: 1, aggiunto: 2, invariato: 3 }
    return order[a.stato] - order[b.stato]
  })
}

// ═══════════════════════════════════════════════════════════════
// HELPER: label tipo modifica
// ═══════════════════════════════════════════════════════════════

export function labelModifica(m: PreventivoModifica): string {
  switch (m.tipo) {
    case 'add': return 'Aggiunto'
    case 'del': return 'Rimosso'
    case 'mod': return 'Modificato'
    default: return ''
  }
}

export function colorTipo(tipo: 'add' | 'del' | 'mod'): { bg: string; fg: string } {
  switch (tipo) {
    case 'add': return { bg: '#D1FAE5', fg: '#065F46' }
    case 'del': return { bg: '#FEE2E2', fg: '#991B1B' }
    case 'mod': return { bg: '#FEF3C7', fg: '#92400E' }
    default:    return { bg: '#F1F5F9', fg: '#475569' }
  }
}
