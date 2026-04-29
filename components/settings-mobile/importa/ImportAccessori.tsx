// components/settings-mobile/importa/ImportAccessori.tsx
// Import prezzi accessori/ferramenta su ferramenta_articoli.
// Match per (fornitore, codice).

'use client'

import React from 'react'
import ImportPanel from './ImportPanel'
import { supabase } from '@/lib/supabase'
import type { SheetColumn } from '@/lib/excel-helpers'

interface Props { azienda_id: string }

interface RigaImportAccessorio {
  fornitore: string
  codice: string
  prezzo_listino: number
  sconto_perc: number
  prezzo_netto: number
  peso_max_kg: number
}

const COLS: SheetColumn[] = [
  { key: 'fornitore',      header: 'Fornitore',      required: true, width: 14, example: 'MACO' },
  { key: 'codice',         header: 'Codice',         required: true, width: 14, example: '209377' },
  { key: 'prezzo_listino', header: 'Prezzo listino', width: 14, example: 12.50 },
  { key: 'sconto_perc',    header: 'Sconto %',       width: 10, example: 35 },
  { key: 'prezzo_netto',   header: 'Prezzo netto',   width: 14, example: 8.13 },
  { key: 'peso_max_kg',    header: 'Peso max kg',    width: 12, example: 130 },
]

export default function ImportAccessori({ azienda_id }: Props) {
  async function commit(rows: RigaImportAccessorio[]) {
    const errors: string[] = []
    let ok = 0
    let ko = 0

    for (const r of rows) {
      if (!r.fornitore || !r.codice) {
        ko++
        errors.push(`Riga senza fornitore o codice`)
        continue
      }

      const listino = r.prezzo_listino != null ? Number(r.prezzo_listino) : null
      const sconto  = r.sconto_perc    != null ? Number(r.sconto_perc)    : null
      let netto     = r.prezzo_netto   != null ? Number(r.prezzo_netto)   : null
      if (netto == null && listino != null && sconto != null) {
        netto = Math.round(listino * (1 - sconto / 100) * 100) / 100
      }

      const patch: any = {}
      if (listino != null) patch.prezzo_listino = listino
      if (netto != null) patch.prezzo_netto = netto
      if (sconto != null) patch.sconto_perc = sconto
      if (r.peso_max_kg != null) patch.peso_max_kg = Number(r.peso_max_kg)

      if (Object.keys(patch).length === 0) {
        ko++
        errors.push(`${r.fornitore} ${r.codice}: nessun dato da aggiornare`)
        continue
      }

      const { data, error } = await supabase
        .from('ferramenta_articoli')
        .update(patch)
        .eq('fornitore', r.fornitore)
        .eq('codice', String(r.codice))
        .select('id')

      if (error) {
        ko++
        errors.push(`${r.fornitore} ${r.codice}: ${error.message}`)
      } else if (!data || data.length === 0) {
        ko++
        errors.push(`${r.fornitore} ${r.codice}: articolo non trovato`)
      } else {
        ok++
      }
    }

    return { ok, ko, errors }
  }

  return (
    <ImportPanel
      templateName="prezzi_accessori.xlsx"
      sheetName="Prezzi accessori"
      columns={COLS}
      helpText="Aggiorna i prezzi degli articoli ferramenta esistenti (cerniere, cremonesi, maniglie...). Match per Fornitore + Codice esatto. Se compili listino + sconto, il netto si calcola automaticamente. Per inserire articoli nuovi, usa Settings → Ferramenta WIN → Articoli."
      onCommit={commit}
    />
  )
}
