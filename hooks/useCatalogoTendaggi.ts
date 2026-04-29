// hooks/useCatalogoTendaggi.ts
// v2: carica catalogo tendaggi + accessori + funzione calcolo prezzo.
// Recupera azienda_id automaticamente via getAziendaId.

import { useEffect, useState } from 'react'

export type CatalogoTendaItem = {
  id: string
  fornitore: string
  modello: string
  categoria: 'esterno' | 'interno'
  tipo_modello: string
  colore_default: string | null
  prezzo_base_eur: number | null
  unita_prezzo: 'mq' | 'pz' | null
  l_min_mm: number | null
  l_max_mm: number | null
  h_min_mm: number | null
  h_max_mm: number | null
  s_min_mm: number | null
  s_max_mm: number | null
  griglia_prezzi: any | null
  minimo_mq: number | null
  sconto_fornitore_pct: number | null
  ricarico_pct: number | null
}

export type AccessorioTenda = {
  id: string
  fornitore: string | null
  nome: string
  categoria: 'motore' | 'comando' | 'sensore' | 'tessuto' | 'illuminazione' | 'colore' | 'altro'
  unita: 'pz' | 'ml' | 'mq' | 'm'
  prezzo_unitario: number | null
  compatibile_tipi: string[]
}

// Mappa tipologia MASTRO → tipi modello catalogo compatibili
export const MAPPA_TIPO_MASTRO_A_CATALOGO: Record<string, string[]> = {
  TDBR:    ['cassonetto', 'semicassonetto', 'bracci', 'trapezio', 'doppiolivello'],
  TDCAD:   ['caduta'],
  TDCAP:   ['capottina', 'capottinapunta'],
  TDVER:   ['veranda', 'verandatenda'],
  TDRUL:   ['rullo'],
  TDPERG:  ['pergola', 'pergolatelo', 'pergolabox', 'tettopiramide'],
  TDZIP:   ['caduta', 'rullo'],
  TDVELA:  ['tettopiramide'],
  VENEZIA: ['veneziana', 'venezianavert', 'venezianalegno'],
}

export function useCatalogoTendaggi() {
  const [catalogo, setCatalogo] = useState<CatalogoTendaItem[]>([])
  const [accessori, setAccessori] = useState<AccessorioTenda[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        const { getAziendaId } = await import('@/lib/supabase-sync')
        const aziendaId = await getAziendaId()
        if (!aziendaId) { if (alive) { setLoading(false) }; return }
        const { supabase } = await import('@/lib/supabase')
        const [c, a] = await Promise.all([
          supabase.from('catalogo_tendaggi').select('*').eq('azienda_id', aziendaId).eq('attivo', true).order('ordine', { ascending: true }),
          supabase.from('accessori_tendaggi').select('*').eq('azienda_id', aziendaId).eq('attivo', true).order('ordine', { ascending: true }),
        ])
        if (!alive) return
        if (c.error) console.error('catalogo_tendaggi:', c.error)
        if (a.error) console.error('accessori_tendaggi:', a.error)
        setCatalogo((c.data || []) as CatalogoTendaItem[])
        setAccessori((a.data || []) as AccessorioTenda[])
      } catch (e) { console.error(e) }
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  return { catalogo, accessori, loading }
}

// Filtra modelli catalogo compatibili con tipologia MASTRO (es. TDPERG → solo pergole)
export function modelliPerTipoMastro(catalogo: CatalogoTendaItem[], tipoMastro: string): CatalogoTendaItem[] {
  const tipi = MAPPA_TIPO_MASTRO_A_CATALOGO[tipoMastro] || []
  if (!tipi.length) return []
  return catalogo.filter(m => tipi.includes(m.tipo_modello))
}

// Filtra accessori compatibili con un modello (per tipo_modello)
export function accessoriPerModello(accessori: AccessorioTenda[], tipoModello: string): AccessorioTenda[] {
  return accessori.filter(a => {
    if (!a.compatibile_tipi || a.compatibile_tipi.length === 0) return true // accessori generici (es. tasselli)
    return a.compatibile_tipi.includes(tipoModello)
  })
}

// Calcola prezzo tenda dato: modello, misure mm, ID accessori scelti, lookup accessori
export function calcolaPrezzoTenda(
  modello: CatalogoTendaItem | null | undefined,
  larghezzaMm: number,
  altezzaMm: number,
  sporgenzaMm: number,
  accessoriScelti: Array<{ id: string; quantita?: number }>,
  accessoriDB: AccessorioTenda[],
): { totale: number; dettaglio: Array<{ voce: string; importo: number }> } {
  const dettaglio: Array<{ voce: string; importo: number }> = []
  if (!modello) return { totale: 0, dettaglio }

  // Calcolo base sul modello
  const lM = (larghezzaMm || 0) / 1000
  const hM = (altezzaMm || 0) / 1000
  const sM = (sporgenzaMm || 0) / 1000
  let prezzoBase = 0
  let unita = modello.unita_prezzo || 'mq'

  if (modello.griglia_prezzi && Array.isArray(modello.griglia_prezzi) && modello.griglia_prezzi.length > 0) {
    // Griglia LxH (oppure LxS per pergole)
    const griglia = modello.griglia_prezzi as Array<{ l: number; h: number; prezzo: number }>
    const exact = griglia.find(g => g.l >= larghezzaMm && g.h >= (sM > 0 ? sporgenzaMm : altezzaMm))
    prezzoBase = exact ? exact.prezzo : (griglia[griglia.length - 1]?.prezzo || 0)
  } else if (unita === 'pz') {
    prezzoBase = modello.prezzo_base_eur || 0
  } else {
    // Default €/mq. Per pergole/bracci uso L × S, per tende a caduta L × H
    const tipo = modello.tipo_modello
    const isPergolaOrBracci = ['pergola', 'pergolatelo', 'pergolabox', 'tettopiramide', 'bracci', 'cassonetto', 'semicassonetto', 'trapezio', 'doppiolivello'].includes(tipo)
    let mq = isPergolaOrBracci && sM > 0 ? lM * sM : lM * hM
    if (modello.minimo_mq && mq > 0 && mq < modello.minimo_mq) mq = modello.minimo_mq
    prezzoBase = mq * (modello.prezzo_base_eur || 0)
  }

  if (prezzoBase > 0) {
    dettaglio.push({ voce: `${modello.fornitore} ${modello.modello}`, importo: round2(prezzoBase) })
  }

  // Sconto fornitore (riduce costo nascostamente, NON in dettaglio cliente di solito,
  // ma teniamo opzione di applicarlo: se >0 ridimensiona il base)
  let totale = prezzoBase
  if (modello.sconto_fornitore_pct && modello.sconto_fornitore_pct > 0) {
    totale = totale * (1 - modello.sconto_fornitore_pct / 100)
  }

  // Accessori
  for (const sel of accessoriScelti) {
    const acc = accessoriDB.find(a => a.id === sel.id)
    if (!acc) continue
    const qta = sel.quantita || 1
    let importo = (acc.prezzo_unitario || 0) * qta
    // Per accessori al ml/m: usa misura coerente (LED al m → larghezza in m)
    if (acc.unita === 'ml' || acc.unita === 'm') {
      importo = (acc.prezzo_unitario || 0) * (lM > 0 ? lM : 1) * qta
    }
    if (acc.unita === 'mq') {
      const mq = lM * (sM > 0 ? sM : hM)
      importo = (acc.prezzo_unitario || 0) * (mq > 0 ? mq : 1) * qta
    }
    if (importo > 0) {
      dettaglio.push({ voce: `+ ${acc.nome}`, importo: round2(importo) })
      totale += importo
    }
  }

  // Ricarico azienda
  if (modello.ricarico_pct && modello.ricarico_pct > 0) {
    const ric = totale * (modello.ricarico_pct / 100)
    dettaglio.push({ voce: `Ricarico ${modello.ricarico_pct}%`, importo: round2(ric) })
    totale += ric
  }

  return { totale: round2(totale), dettaglio }
}

function round2(n: number) { return Math.round(n * 100) / 100 }
