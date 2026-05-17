import { createClient } from '@/lib/supabase/client'
import type { Commessa, FilterType, SortType } from '@/lib/commesse-types'

export async function fetchCommesse(
  filter: FilterType,
  sort: SortType,
  search: string
): Promise<Commessa[]> {
  const sb = createClient()
  let q = sb.from('commesse').select('*')

  // Filtri per fase
  switch (filter) {
    case 'appuntamenti': q = q.eq('fase', 'APP'); break
    case 'misure': q = q.eq('fase', 'MIS'); break
    case 'preventivi': q = q.eq('fase', 'PRV'); break
    case 'conferme': q = q.eq('fase', 'CNF'); break
    case 'acconti': q = q.eq('fase', 'ACC'); break
    case 'ordini': q = q.eq('fase', 'ORD'); break
    case 'materiali': q = q.eq('fase', 'MAT'); break
    case 'montaggi': q = q.eq('fase', 'MON'); break
    case 'da_fatturare': q = q.eq('is_da_fatturare', true); break
  }

  // Ricerca
  if (search.length >= 2) {
    q = q.or(`cliente_nome.ilike.%${search}%,codice.ilike.%${search}%,indirizzo.ilike.%${search}%`)
  }

  // Sort
  switch (sort) {
    case 'updated_desc': q = q.order('updated_at', { ascending: false }); break
    case 'created_desc': q = q.order('created_at', { ascending: false }); break
    case 'created_asc': q = q.order('created_at', { ascending: true }); break
    case 'value_desc': q = q.order('valore_eur', { ascending: false }); break
    case 'value_asc': q = q.order('valore_eur', { ascending: true }); break
    case 'name_asc': q = q.order('cliente_nome', { ascending: true }); break
    case 'name_desc': q = q.order('cliente_nome', { ascending: false }); break
    case 'phase': q = q.order('fase').order('updated_at', { ascending: false }); break
    default: q = q.order('updated_at', { ascending: false })
  }

  const { data, error } = await q.limit(100)
  if (error) { console.error('fetchCommesse', error); return [] }
  return data as Commessa[]
}

export async function countCommessePerFiltro(): Promise<Record<string, number>> {
  const sb = createClient()
  const { data } = await sb.from('commesse').select('fase, sotto_stato')
  if (!data) return {}

  const counts: Record<string, number> = { all: data.length }
  for (const r of data) {
    const key = r.fase?.toLowerCase()
    if (key) counts[key] = (counts[key] || 0) + 1
    if (r.fase === 'END' && r.sotto_stato === 'da_fatturare') {
      counts['da_fatturare'] = (counts['da_fatturare'] || 0) + 1
    }
  }
  // Mappa fasi → chiavi filtro
  counts['appuntamenti'] = counts['app'] || 0
  counts['misure'] = counts['mis'] || 0
  counts['preventivi'] = counts['prv'] || 0
  counts['conferme'] = counts['cnf'] || 0
  counts['acconti'] = counts['acc'] || 0
  counts['ordini'] = counts['ord'] || 0
  counts['materiali'] = counts['mat'] || 0
  counts['montaggi'] = counts['mon'] || 0

  return counts
}
