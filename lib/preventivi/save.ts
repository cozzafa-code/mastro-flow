// lib/preventivi/save.ts
// Layer di persistenza preventivo: upsert testata + vani + totali commessa.
// Idempotente: chiamabile a ogni autosave senza duplicare righe.
// Walter Cozza beta: 10 mag 2026.

import { supabase } from '@/lib/supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ───────────────────────────────────────────────────────────────
// AZIENDA ID — pattern resiliente identico a useMateriali
// ───────────────────────────────────────────────────────────────
async function getAziendaId(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const candidates = [
    sessionStorage.getItem('mastro:aziendaId'),
    localStorage.getItem('mastro:aziendaId'),
    sessionStorage.getItem('aziendaId'),
    localStorage.getItem('aziendaId'),
    sessionStorage.getItem('azienda_id'),
    localStorage.getItem('azienda_id'),
    sessionStorage.getItem('mastro_azienda_id'),
    localStorage.getItem('mastro_azienda_id'),
  ]
  for (const v of candidates) {
    if (v && UUID_RE.test(v)) {
      try { sessionStorage.setItem('mastro:aziendaId', v) } catch {}
      return v
    }
  }
  // Fallback estremo: primo operatore attivo
  try {
    const { data } = await supabase
      .from('operatori')
      .select('azienda_id')
      .eq('attivo', true)
      .limit(1)
      .maybeSingle()
    if (data?.azienda_id && UUID_RE.test(data.azienda_id)) {
      try { sessionStorage.setItem('mastro:aziendaId', data.azienda_id) } catch {}
      return data.azienda_id
    }
  } catch {}
  return null
}

// ───────────────────────────────────────────────────────────────
// TIPI INPUT (forma libera dal client, normalizzata internamente)
// ───────────────────────────────────────────────────────────────
export interface VanoInput {
  id?: string
  nome?: string
  tipo?: string
  pezzi?: number
  stanza?: string
  piano?: string
  misure?: any
  sistema?: string
  sottosistema?: string
  vetro?: string
  vetroConfig?: any
  coloreInt?: string
  coloreEst?: string
  bicolore?: boolean
  coloreAcc?: string
  telaio?: string
  controtelaioConfig?: any
  cassonettoConfig?: any
  persianaConfig?: any
  tapparellaConfig?: any
  zanzarieraConfig?: any
  accessori?: any
  accessoriCatalogo?: any
  prevPrezzoOverride?: number | null
  prevPosaPrezzo?: number
  prevSmontaggioPrezzo?: number
  vociLibere?: any
  note?: string
  ordine?: number
  prezzoCalcolato?: number
  totaleVano?: number
}

export interface SalvaPreventivoInput {
  commessaId: string
  vani: VanoInput[]
  totali: {
    netto: number
    iva: number
    lordo: number
    ivaPerc: number
    scontoPerc: number
  }
  rilievoOrigineId?: string | null
  note?: string | null
}

export interface SalvaPreventivoResult {
  ok: boolean
  preventivoId?: string
  error?: string
  warning?: string
}

// ───────────────────────────────────────────────────────────────
// SALVA PREVENTIVO — idempotente
// 1) trova/crea preventivo bozza per commessa
// 2) sostituisce vani snapshot (delete+insert)
// 3) aggiorna totali su preventivi e commesse
// ───────────────────────────────────────────────────────────────
export async function salvaPreventivo(
  input: SalvaPreventivoInput,
): Promise<SalvaPreventivoResult> {
  const { commessaId, vani, totali } = input
  if (!commessaId || !UUID_RE.test(commessaId)) {
    return { ok: false, error: 'commessaId invalido' }
  }

  const aziendaId = await getAziendaId()
  if (!aziendaId) {
    return { ok: false, error: 'aziendaId non risolto' }
  }

  // 1) trova bozza esistente
  const { data: existing, error: errFind } = await supabase
    .from('preventivi')
    .select('id, numero, versione')
    .eq('commessa_id', commessaId)
    .eq('stato', 'bozza')
    .order('versione', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (errFind) {
    return { ok: false, error: `find: ${errFind.message}` }
  }

  let preventivoId: string
  if (existing?.id) {
    preventivoId = existing.id
    // update testata
    const { error: errU } = await supabase
      .from('preventivi')
      .update({
        totale_netto: totali.netto,
        totale_iva: totali.iva,
        totale_lordo: totali.lordo,
        iva_percentuale: totali.ivaPerc,
        sconto_globale: totali.scontoPerc,
        rilievo_origine_id: input.rilievoOrigineId ?? undefined,
        note: input.note ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', preventivoId)
    if (errU) return { ok: false, error: `update prev: ${errU.message}` }
  } else {
    // 2) crea nuovo: numero = max+1 per commessa, versione=1
    const { data: maxRow } = await supabase
      .from('preventivi')
      .select('numero')
      .eq('commessa_id', commessaId)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle()
    const numero = (maxRow?.numero || 0) + 1

    preventivoId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const { error: errI } = await supabase.from('preventivi').insert({
      id: preventivoId,
      commessa_id: commessaId,
      azienda_id: aziendaId,
      numero,
      versione: 1,
      stato: 'bozza',
      data_emissione: new Date().toISOString().slice(0, 10),
      totale_netto: totali.netto,
      totale_iva: totali.iva,
      totale_lordo: totali.lordo,
      iva_percentuale: totali.ivaPerc,
      sconto_globale: totali.scontoPerc,
      rilievo_origine_id: input.rilievoOrigineId ?? null,
      note: input.note ?? null,
      snapshot_at: new Date().toISOString(),
    })
    if (errI) return { ok: false, error: `insert prev: ${errI.message}` }
  }

  // 3) sostituisci vani snapshot (idempotente)
  const { error: errDel } = await supabase
    .from('preventivo_vani_snapshot')
    .delete()
    .eq('preventivo_id', preventivoId)
  if (errDel) {
    // non bloccante: log + continua
    console.warn('[salvaPreventivo] delete vani:', errDel.message)
  }

  if (vani.length > 0) {
    const rows = vani.map((v, i) => ({
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
      preventivo_id: preventivoId,
      vano_id_originale: v.id ?? null,
      ordine: v.ordine ?? i,
      nome: v.nome ?? null,
      tipo: v.tipo ?? null,
      pezzi: v.pezzi ?? 1,
      stanza: v.stanza ?? null,
      piano: v.piano ?? null,
      misure_complete: v.misure ?? null,
      sistema: v.sistema ?? null,
      sottosistema: v.sottosistema ?? null,
      vetro: v.vetro ?? null,
      vetro_config: v.vetroConfig ?? null,
      colore_int: v.coloreInt ?? null,
      colore_est: v.coloreEst ?? null,
      bicolore: !!v.bicolore,
      colore_acc: v.coloreAcc ?? null,
      telaio: v.telaio ?? null,
      controtelaio_config: v.controtelaioConfig ?? null,
      cassonetto_config: v.cassonettoConfig ?? null,
      persiana_config: v.persianaConfig ?? null,
      tapparella_config: v.tapparellaConfig ?? null,
      zanzariera_config: v.zanzarieraConfig ?? null,
      accessori: v.accessori ?? null,
      accessori_calcolati: v.accessoriCatalogo ?? null,
      prezzo_unitario_calcolato: v.prezzoCalcolato ?? null,
      prezzo_unitario_override: v.prevPrezzoOverride ?? null,
      posa_prezzo: v.prevPosaPrezzo ?? 0,
      smontaggio_prezzo: v.prevSmontaggioPrezzo ?? 0,
      voci_libere: v.vociLibere ?? null,
      note: v.note ?? null,
      totale_vano: v.totaleVano ?? null,
    }))
    const { error: errIns } = await supabase
      .from('preventivo_vani_snapshot')
      .insert(rows)
    if (errIns) {
      return { ok: false, preventivoId, error: `insert vani: ${errIns.message}` }
    }
  }

  // 4) aggiorna totali commessa (totale_preventivo + totale_finale)
  const { error: errC } = await supabase
    .from('commesse')
    .update({
      totale_preventivo: totali.lordo,
      totale_finale: totali.lordo,
    })
    .eq('id', commessaId)
  if (errC) {
    return { ok: true, preventivoId, warning: `update commessa: ${errC.message}` }
  }

  return { ok: true, preventivoId }
}

// ───────────────────────────────────────────────────────────────
// CARICA preventivo bozza esistente per commessa (per riapertura)
// ───────────────────────────────────────────────────────────────
export async function caricaPreventivoBozza(commessaId: string) {
  if (!commessaId || !UUID_RE.test(commessaId)) return null
  const { data: prev } = await supabase
    .from('preventivi')
    .select('*')
    .eq('commessa_id', commessaId)
    .eq('stato', 'bozza')
    .order('versione', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!prev?.id) return null
  const { data: vani } = await supabase
    .from('preventivo_vani_snapshot')
    .select('*')
    .eq('preventivo_id', prev.id)
    .order('ordine', { ascending: true })
  return { preventivo: prev, vani: vani || [] }
}
