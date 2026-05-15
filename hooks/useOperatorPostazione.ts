import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface OperatoreSession {
  operatore_id: string
  nome: string
  cognome: string
  colore: string | null
  postazione?: string
}

export interface CodaLavoro {
  tipo: 'odl' | 'odl_libero' | 'lavorazione' | 'riparazione'
  id: string
  titolo: string
  sottotitolo: string | null
  fase_nome: string | null
  fase_colore: string | null
  macchina: string | null
  stato: string
  stima_minuti: number | null
  iniziato_at: string | null
  vano_stato_id: string | null
  vano_id: string | null
  commessa_id: string | null
}

const STORAGE_KEY = 'mastro_op_session'

export function getStoredSession(): OperatoreSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearStoredSession() {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
}

export async function loginOperatore(aziendaId: string, pin: string, postazione?: string): Promise<OperatoreSession | null> {
  const res = await supabase.rpc('operatore_login', { p_azienda_id: aziendaId, p_pin: pin, p_postazione: postazione || null })
  if (res.error || !res.data || res.data.esito !== 'successo') return null
  const sess: OperatoreSession = { 
    operatore_id: res.data.operatore_id,
    nome: res.data.nome,
    cognome: res.data.cognome || '',
    colore: res.data.colore,
    postazione
  }
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(sess))
  return sess
}

export async function logoutOperatore(operatoreId: string) {
  await supabase.rpc('operatore_logout', { p_operatore_id: operatoreId })
  clearStoredSession()
}

export function useOperatorCoda(operatoreId: string | null, aziendaId: string | null) {
  const [coda, setCoda] = useState<CodaLavoro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!operatoreId || !aziendaId) return
    setLoading(true)
    try {
      const res = await supabase.rpc('operatore_coda', { p_operatore_id: operatoreId, p_azienda_id: aziendaId })
      if (res.error) throw res.error
      setCoda(res.data || [])
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [operatoreId, aziendaId])

  useEffect(() => { refetch() }, [refetch])

  useEffect(() => {
    if (!operatoreId || !aziendaId) return
    const ch = supabase.channel('opcoda_' + operatoreId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produzione_vano_stato', filter: 'operatore_id=eq.' + operatoreId }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lavorazioni_interne', filter: 'operatore_id=eq.' + operatoreId }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riparazioni_esterne', filter: 'operatore_id=eq.' + operatoreId }, refetch)
      .subscribe()
    // refresh ogni 30s
    const tick = setInterval(refetch, 30000)
    return () => { supabase.removeChannel(ch); clearInterval(tick) }
  }, [operatoreId, aziendaId, refetch])

  return { coda, loading, error, refetch }
}

// Azioni postazione
export async function iniziaOdL(p: { vanoId: string; faseId: string; caricoId: string; operatoreId: string; macchina: string; aziendaId: string; commessaId: string }) {
  const res = await supabase.rpc('avvia_fase_vano', {
    p_vano_id: p.vanoId, p_fase_id: p.faseId, p_carico_id: p.caricoId,
    p_operatore_id: p.operatoreId, p_macchina: p.macchina,
    p_azienda_id: p.aziendaId, p_commessa_id: p.commessaId
  })
  if (res.error) throw res.error
  return res.data
}

export async function iniziaLavorazioneInt(id: string, operatoreId: string) {
  const res = await supabase.rpc('avvia_lavorazione_interna', { p_id: id, p_operatore_id: operatoreId })
  if (res.error) throw res.error
  return res.data
}

export async function iniziaRiparazione(id: string, operatoreId: string) {
  const res = await supabase.rpc('avvia_riparazione', { p_id: id, p_operatore_id: operatoreId })
  if (res.error) throw res.error
  return res.data
}

export async function completaLavorazioneInt(id: string, note?: string) {
  const res = await supabase.rpc('completa_lavorazione_interna', { p_id: id, p_note: note || null })
  if (res.error) throw res.error
  return res.data
}

export async function completaRiparazioneFn(id: string, note?: string) {
  const res = await supabase.rpc('completa_riparazione', { p_id: id, p_note: note || null })
  if (res.error) throw res.error
  return res.data
}
