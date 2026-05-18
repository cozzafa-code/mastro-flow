import type { Commessa, FilterType, SortType } from '@/lib/commesse-types'

// Mappa dati reali DB → tipo Commessa usato nell'UI
function mapCommessa(row: any): Commessa {
  return {
    id: row.id,
    codice: row.code,
    cliente_nome: [row.cliente, row.cognome].filter(Boolean).join(' '),
    indirizzo: row.indirizzo || '',
    fase: row.fase || 'APP',
    giorni_in_fase: row.giorni_in_fase || 0,
    valore_eur: row.totale_finale || row.totale_preventivo || null,
    is_da_fatturare: false,
    note: row.note || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function fetchCommesse(
  filter: FilterType,
  sort: SortType,
  search: string
): Promise<Commessa[]> {
  const res = await fetch('/api/commesse')
  const json = await res.json()
  if (!res.ok) return []
  let data: Commessa[] = (json.commesse || []).map(mapCommessa)

  if (filter !== 'all') {
    const faseMap: Record<string, string> = {
      appuntamenti: 'APP', misure: 'MIS', preventivi: 'PRV',
      conferme: 'CNF', acconti: 'ACC', ordini: 'ORD',
      materiali: 'MAT', montaggi: 'MON',
    }
    if (faseMap[filter]) {
      data = data.filter(c => c.fase === faseMap[filter])
    }
  }

  if (search.length >= 2) {
    const q = search.toLowerCase()
    data = data.filter(c =>
      c.cliente_nome?.toLowerCase().includes(q) ||
      c.codice?.toLowerCase().includes(q) ||
      c.indirizzo?.toLowerCase().includes(q)
    )
  }

  data.sort((a, b) => {
    switch (sort) {
      case 'updated_desc': return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      case 'created_desc': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case 'created_asc':  return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      case 'value_desc':   return (b.valore_eur || 0) - (a.valore_eur || 0)
      case 'value_asc':    return (a.valore_eur || 0) - (b.valore_eur || 0)
      case 'name_asc':     return (a.cliente_nome || '').localeCompare(b.cliente_nome || '')
      case 'name_desc':    return (b.cliente_nome || '').localeCompare(a.cliente_nome || '')
      default: return 0
    }
  })

  return data
}

export async function countCommessePerFiltro(): Promise<Record<string, number>> {
  const res = await fetch('/api/commesse')
  const json = await res.json()
  if (!res.ok) return {}
  const data = (json.commesse || []).map(mapCommessa) as Commessa[]

  const counts: Record<string, number> = { all: data.length }
  for (const c of data) {
    const fase = c.fase?.toLowerCase()
    if (fase) counts[fase] = (counts[fase] || 0) + 1
  }
  counts['appuntamenti'] = counts['app'] || 0
  counts['misure']       = counts['mis'] || 0
  counts['preventivi']   = counts['prv'] || 0
  counts['conferme']     = counts['cnf'] || 0
  counts['acconti']      = counts['acc'] || 0
  counts['ordini']       = counts['ord'] || 0
  counts['materiali']    = counts['mat'] || 0
  counts['montaggi']     = counts['mon'] || 0
  return counts
}
