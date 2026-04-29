// components/settings-mobile/importa/ImportProfili.tsx
// Import prezzi profili: aggiorna azienda_sistemi_attivi.prezzo_kg_listino/netto/sconto.
// Match per nome sistema (case-insensitive).

'use client'

import React from 'react'
import ImportPanel from './ImportPanel'
import { supabase } from '@/lib/supabase'
import type { SheetColumn } from '@/lib/excel-helpers'

interface Props { azienda_id: string }

interface RigaImportProfilo {
  marca: string
  sistema: string
  prezzo_listino: number
  sconto_perc: number
  prezzo_netto: number
}

const COLS: SheetColumn[] = [
  { key: 'marca',          header: 'Marca',          required: true,  width: 18, example: 'Aluplast' },
  { key: 'sistema',        header: 'Sistema',        required: true,  width: 22, example: 'IDEAL 4000' },
  { key: 'prezzo_listino', header: 'Prezzo €/kg listino', width: 16, example: 5.20 },
  { key: 'sconto_perc',    header: 'Sconto %',       width: 10, example: 30 },
  { key: 'prezzo_netto',   header: 'Prezzo €/kg netto', width: 16, example: 3.64 },
]

export default function ImportProfili({ azienda_id }: Props) {
  async function commit(rows: RigaImportProfilo[]) {
    const errors: string[] = []
    let ok = 0
    let ko = 0

    // Carico mappa sistemi: nome+marca -> id
    const { data: sis } = await supabase
      .from('sistemi_profilo')
      .select('id, marca, sistema')

    const mapByKey = new Map<string, string>()
    for (const s of (sis ?? [])) {
      const k = `${(s.marca ?? '').toLowerCase().trim()}|${(s.sistema ?? '').toLowerCase().trim()}`
      mapByKey.set(k, s.id)
    }

    // Carico attivazioni esistenti per non duplicare
    const { data: att } = await supabase
      .from('azienda_sistemi_attivi')
      .select('id, sistema_id')
      .eq('azienda_id', azienda_id)
    const attMap = new Map<string, string>()
    for (const a of (att ?? [])) attMap.set(a.sistema_id, a.id)

    for (const r of rows) {
      const k = `${(r.marca ?? '').toLowerCase().trim()}|${(r.sistema ?? '').toLowerCase().trim()}`
      const sistema_id = mapByKey.get(k)
      if (!sistema_id) {
        ko++
        errors.push(`Sistema "${r.marca} ${r.sistema}" non trovato`)
        continue
      }

      const listino = r.prezzo_listino != null ? Number(r.prezzo_listino) : null
      const sconto  = r.sconto_perc    != null ? Number(r.sconto_perc)    : null
      let netto     = r.prezzo_netto   != null ? Number(r.prezzo_netto)   : null
      if (netto == null && listino != null && sconto != null) {
        netto = listino * (1 - sconto / 100)
      }

      const payload = {
        prezzo_kg_listino: listino,
        prezzo_kg_netto: netto,
        sconto_perc: sconto,
        attivo: true,
      }

      const existing = attMap.get(sistema_id)
      const op = existing
        ? supabase.from('azienda_sistemi_attivi').update(payload).eq('id', existing)
        : supabase.from('azienda_sistemi_attivi').insert({ azienda_id, sistema_id, ...payload })
      const { error } = await op

      if (error) {
        ko++
        errors.push(`${r.marca} ${r.sistema}: ${error.message}`)
      } else {
        ok++
      }
    }

    return { ok, ko, errors }
  }

  return (
    <ImportPanel
      templateName="prezzi_profili.xlsx"
      sheetName="Prezzi profili"
      columns={COLS}
      helpText="Aggiorna i prezzi €/kg dei sistemi profilo (Aluplast, Twin Systems...). Compila Marca + Sistema esattamente come appaiono in Settings → Sistemi profilo. Se compili listino + sconto, il netto si calcola automaticamente."
      onCommit={commit}
    />
  )
}
