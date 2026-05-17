import { createClient } from '@/lib/supabase/client'
import type { Evento, PrioritaTitolare, Notifica, SearchResult, SlotLibero } from '@/lib/types'

// ── EVENTI ──────────────────────────────────────────────────────

export async function getEventiPerData(data: string): Promise<Evento[]> {
  const sb = createClient()
  const { data: rows, error } = await sb
    .from('eventi')
    .select(`
      *,
      cliente:clienti(nome, telefono),
      commessa:commesse(ref, vani_count, materiale)
    `)
    .eq('data', data)
    .order('ora_inizio', { ascending: true })

  if (error) { console.error('getEventiPerData', error); return [] }
  return rows as Evento[]
}

export async function getEventiSettimana(
  dal: string,
  al: string
): Promise<Record<string, Evento[]>> {
  const sb = createClient()
  const { data: rows, error } = await sb
    .from('eventi')
    .select('id, data, ora_inizio, durata_min, tipo, titolo, stato')
    .gte('data', dal)
    .lte('data', al)
    .order('ora_inizio', { ascending: true })

  if (error) { console.error('getEventiSettimana', error); return {} }

  const map: Record<string, Evento[]> = {}
  for (const e of rows as Evento[]) {
    if (!map[e.data]) map[e.data] = []
    map[e.data].push(e)
  }
  return map
}

export async function getEventiProssimi30Giorni(): Promise<Evento[]> {
  const sb = createClient()
  const oggi = new Date().toISOString().split('T')[0]
  const fine = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const { data: rows, error } = await sb
    .from('eventi')
    .select(`*, cliente:clienti(nome), commessa:commesse(ref)`)
    .gte('data', oggi)
    .lte('data', fine)
    .order('data', { ascending: true })
    .order('ora_inizio', { ascending: true })

  if (error) { console.error('getEventiProssimi30Giorni', error); return [] }
  return rows as Evento[]
}

export async function spostaEvento(
  eventoId: string,
  nuovaData: string,
  nuovaOra: string
): Promise<void> {
  const sb = createClient()
  const { error } = await sb
    .from('eventi')
    .update({ data: nuovaData, ora_inizio: nuovaOra, stato: 'spostato' })
    .eq('id', eventoId)

  if (error) throw error
}

// ── SLOT LIBERI ─────────────────────────────────────────────────

export async function getSlotLiberi(
  dal: string,
  al: string,
  durataMin: number
): Promise<SlotLibero[]> {
  const sb = createClient()
  const { data: occupati } = await sb
    .from('eventi')
    .select('data, ora_inizio, durata_min')
    .gte('data', dal)
    .lte('data', al)

  // Genera slot 8:00-18:00 ogni 30 min, filtra quelli occupati
  const slots: SlotLibero[] = []
  const cursor = new Date(dal)
  const fine = new Date(al)

  while (cursor <= fine) {
    const dataStr = cursor.toISOString().split('T')[0]
    const dow = cursor.getDay()
    if (dow !== 0) { // no domenica
      for (let h = 8; h < 18; h++) {
        for (const m of [0, 30]) {
          const oraStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
          const oraMin = h * 60 + m
          const conflitto = (occupati || []).some(e => {
            if (e.data !== dataStr) return false
            const [eh, em] = e.ora_inizio.split(':').map(Number)
            const eStart = eh * 60 + em
            const eEnd = eStart + e.durata_min
            return oraMin < eEnd && oraMin + durataMin > eStart
          })
          if (!conflitto) {
            slots.push({ data: dataStr, ora: oraStr, operatori_disponibili: [] })
          }
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return slots.slice(0, 20) // max 20 slot
}

// ── PRIORITA ────────────────────────────────────────────────────

export async function getPrioritaAttiva(): Promise<PrioritaTitolare | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('priorita_titolare')
    .select('*')
    .eq('stato', 'attiva')
    .order('scadenza', { ascending: true })
    .limit(1)
    .single()

  if (error) return null
  return data as PrioritaTitolare
}

// ── NOTIFICHE ───────────────────────────────────────────────────

export async function getNotifiche(): Promise<Notifica[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('notifiche')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return []
  return data as Notifica[]
}

export async function segnaNotificaLetta(id: string): Promise<void> {
  const sb = createClient()
  await sb.from('notifiche').update({ letta: true }).eq('id', id)
}

export async function segnaNotificaInApp(
  userId: string,
  titolo: string,
  body: string,
  link?: string
): Promise<void> {
  const sb = createClient()
  await sb.from('notifiche').insert({
    user_id: userId,
    tipo: 'evento',
    titolo,
    body,
    letta: false,
    link,
  })
}

// ── SEARCH ──────────────────────────────────────────────────────

export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return []
  const sb = createClient()
  const q = `%${query}%`

  const [eventi, commesse, clienti] = await Promise.all([
    sb.from('eventi').select('id, titolo, data, tipo').ilike('titolo', q).limit(5),
    sb.from('commesse').select('id, ref, titolo').ilike('ref', q).limit(5),
    sb.from('clienti').select('id, nome, citta').ilike('nome', q).limit(5),
  ])

  const results: SearchResult[] = []

  for (const e of eventi.data || []) {
    results.push({
      type: 'evento',
      id: e.id,
      label: e.titolo,
      sublabel: e.data,
      link: `/agenda?data=${e.data}`,
    })
  }
  for (const c of commesse.data || []) {
    results.push({
      type: 'commessa',
      id: c.id,
      label: c.ref,
      sublabel: c.titolo,
      link: `/commesse/${c.id}`,
    })
  }
  for (const cl of clienti.data || []) {
    results.push({
      type: 'cliente',
      id: cl.id,
      label: cl.nome,
      sublabel: cl.citta,
      link: `/clienti/${cl.id}`,
    })
  }

  return results
}
