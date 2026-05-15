import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface VanoFaseStorico {
  fase_id: string
  fase_nome: string
  fase_colore: string
  fase_ordine: number
  stato: 'in_coda' | 'in_corso' | 'completato' | 'bloccato' | 'saltato'
  operatore_id: string | null
  operatore_nome: string
  operatore_iniziali: string
  iniziato_at: string | null
  completato_at: string | null
  durata_secondi: number | null
  stima_minuti: number | null
  macchina: string | null
  problema_descrizione: string | null
  problema_aperto_at: string | null
  problema_risolto_at: string | null
  foto_urls: string[]
  vano_stato_id: string | null
}

export interface VanoEvento {
  evento_at: string
  tipo: 'avvio' | 'fine' | 'blocco'
  descrizione: string
  colore: string
}

export interface VanoFull {
  id: string
  numero: number | null
  nome: string | null
  tipo: string | null
  stanza: string | null
  pezzi: number
  sistema: string | null
  sottosistema: string | null
  vetro: string | null
  colore_int: string | null
  colore_est: string | null
  telaio: string | null
  uw: number | null
  ore_produzione: number | null
  note: string | null
  accessori: any
  misure_complete: any
  misure_json: any
  misure_larghezza: string | null
  misure_altezza: string | null
  commessa_id: string | null
  commessa_code: string | null
  cliente_nome: string | null
  foto_rilievo: string[]
  note_rilievo: string | null
}

export function useVanoDetail(vanoId: string | null, aziendaId: string | null) {
  const [vano, setVano] = useState<VanoFull | null>(null)
  const [storico, setStorico] = useState<VanoFaseStorico[]>([])
  const [eventi, setEventi] = useState<VanoEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!vanoId || !aziendaId) return
    setLoading(true)
    setError(null)
    try {
      const [vRes, sRes, eRes] = await Promise.all([
        supabase.rpc('vano_detail_full', { p_vano_id: vanoId, p_azienda_id: aziendaId }),
        supabase.rpc('vano_storico_fasi', { p_vano_id: vanoId, p_azienda_id: aziendaId }),
        supabase.rpc('vano_eventi_giornata', { p_vano_id: vanoId, p_azienda_id: aziendaId }),
      ])
      if (vRes.error) throw vRes.error
      if (sRes.error) throw sRes.error
      if (eRes.error) throw eRes.error
      setVano(vRes.data as any)
      setStorico((sRes.data || []).map((r: any) => ({ ...r, foto_urls: Array.isArray(r.foto_urls) ? r.foto_urls : [] })))
      setEventi(eRes.data || [])
    } catch (e: any) {
      setError(e.message || 'Errore caricamento vano')
    } finally {
      setLoading(false)
    }
  }, [vanoId, aziendaId])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!vanoId || !aziendaId) return
    const chName = 'vano_' + vanoId
    const filt = 'vano_id=eq.' + vanoId
    const ch = supabase.channel(chName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produzione_vano_stato', filter: filt }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [vanoId, aziendaId, fetchAll])

  return { vano, storico, eventi, loading, error, refetch: fetchAll }
}

export async function risolviProblemaVano(vanoStatoId: string): Promise<boolean> {
  const res = await supabase.from('produzione_vano_stato')
    .update({ stato: 'in_corso', problema_risolto_at: new Date().toISOString() })
    .eq('id', vanoStatoId)
  return !res.error
}

export async function mettiInPausaVano(vanoStatoId: string): Promise<boolean> {
  const res = await supabase.from('produzione_vano_stato')
    .update({ stato: 'in_coda' })
    .eq('id', vanoStatoId)
  return !res.error
}

export async function spostaOperatoreVano(vanoStatoId: string, nuovoOperatoreId: string): Promise<boolean> {
  const res = await supabase.from('produzione_vano_stato')
    .update({ operatore_id: nuovoOperatoreId })
    .eq('id', vanoStatoId)
  return !res.error
}

export async function fetchOperatoriDisponibili(aziendaId: string) {
  const res = await supabase.from('operatori')
    .select('id, nome, cognome, colore')
    .eq('azienda_id', aziendaId)
    .eq('attivo', true)
    .order('nome')
  return res.data || []
}
