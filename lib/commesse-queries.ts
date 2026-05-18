import type { Commessa, FilterType, SortType } from '@/lib/commesse-types'

export async function fetchCommesse(
  filter: FilterType,
  sort: SortType,
  search: string
): Promise<Commessa[]> {
  const res = await fetch('/api/commesse')
  const json = await res.json()
  if (!res.ok) return []
  let data: Commessa[] = json.commesse || []

  // Filtri client-side
  if (filter !== 'all') {
    const faseMap: Record<string, string> = {
      appuntamenti: 'APP', misure: 'MIS', preventivi: 'PRV',
      conferme: 'CNF', acconti: 'ACC', ordini: 'ORD',
      materiali: 'MAT', montaggi: 'MON',
    }
    if (filter === 'da_fatturare') {
      data = data.filter(c => c.is_da_fatturare)
    } else if (faseMap[filter]) {
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

  // Sort client-side
  data.sort((a, b) => {
    switch (sort) {
      case 'updated_desc': return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      case 'created_desc': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case 'created_asc': return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      case 'value_desc': return (b.valore_eur || 0) - (a.valore_eur || 0)
      case 'value_asc': return (a.valore_eur || 0) - (b.valore_eur || 0)
      case 'name_asc': return a.cliente_nome?.localeCompare(b.cliente_nome || '') || 0
      case 'name_desc': return b.cliente_nome?.localeCompare(a.cliente_nome || '') || 0
      default: return 0
    }
  })

  return data
}

export async function countCommessePerFiltro(): Promise<Record<string, number>> {
  const res = await fetch('/api/commesse')
  const json = await res.json()
  if (!res.ok) return {}
  const data: Commessa[] = json.commesse || []

  const counts: Record<string, number> = { all: data.length }
  for (const c of data) {
    const fase = c.fase?.toLowerCase()
    if (fase) counts[fase] = (counts[fase] || 0) + 1
    if (c.is_da_fatturare) counts['da_fatturare'] = (counts['da_fatturare'] || 0) + 1
  }
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
