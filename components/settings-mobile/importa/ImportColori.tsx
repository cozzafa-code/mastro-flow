// components/settings-mobile/importa/ImportColori.tsx
// Import prezzi colori: tabella di maggiorazione % per colore.
// Aggiunge campi maggiorazione su colori_catalogo (creando se manca).

'use client'

import React from 'react'
import ImportPanel from './ImportPanel'
import { supabase } from '@/lib/supabase'
import type { SheetColumn } from '@/lib/excel-helpers'

interface Props { azienda_id: string }

interface RigaImportColore {
  codice_ral: string
  nome: string
  maggiorazione_perc: number
}

const COLS: SheetColumn[] = [
  { key: 'codice_ral',         header: 'Codice RAL',           width: 14, example: 'RAL 9016' },
  { key: 'nome',               header: 'Nome colore',          required: true, width: 24, example: 'Bianco traffico' },
  { key: 'maggiorazione_perc', header: 'Maggiorazione %',      width: 14, example: 0 },
]

export default function ImportColori({ azienda_id }: Props) {
  async function commit(rows: RigaImportColore[]) {
    const errors: string[] = []
    let ok = 0
    let ko = 0

    // Carico tutto il catalogo colori
    const { data: cat } = await supabase
      .from('colori_catalogo')
      .select('id, nome, codice_ral')

    const byNome = new Map<string, number>()
    const byRal  = new Map<string, number>()
    for (const c of (cat ?? [])) {
      if (c.nome) byNome.set(String(c.nome).toLowerCase().trim(), c.id)
      if (c.codice_ral) byRal.set(String(c.codice_ral).toLowerCase().trim(), c.id)
    }

    for (const r of rows) {
      const ral = (r.codice_ral ?? '').toString().toLowerCase().trim()
      const nome = (r.nome ?? '').toString().toLowerCase().trim()

      const colore_id = byRal.get(ral) ?? byNome.get(nome)
      if (!colore_id) {
        ko++
        errors.push(`Colore "${r.nome}" (RAL ${r.codice_ral || '—'}) non trovato in catalogo`)
        continue
      }

      const maggiorazione = r.maggiorazione_perc != null ? Number(r.maggiorazione_perc) : 0

      const { error } = await supabase
        .from('colori_catalogo')
        .update({ maggiorazione_perc: maggiorazione })
        .eq('id', colore_id)

      if (error) {
        ko++
        errors.push(`${r.nome}: ${error.message}`)
      } else {
        ok++
      }
    }

    return { ok, ko, errors }
  }

  return (
    <ImportPanel
      templateName="prezzi_colori.xlsx"
      sheetName="Maggiorazioni colore"
      columns={COLS}
      helpText="Aggiorna le maggiorazioni % per colore. Il match avviene per RAL (se presente) o per nome esatto. Per inserire un colore nuovo, usa Sistemi → Colori → Aggiungi (interfaccia visuale)."
      onCommit={commit}
    />
  )
}
