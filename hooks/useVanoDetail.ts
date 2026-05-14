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
  iniziato_at: string | null
  completato_at: string | null
  durata_secondi: number | null
  macchina: string | null
  problema_descrizione: string | null
  problema_aperto_at: string | null
  problema_risolto_at: string | null
  foto_urls: string[]
}

export interface VanoEvento {
  evento_at: string
  tipo: 'avvio' | 'completamento' | 'problema'
  fase_nome: string
  fase_colore: string
  operatore_nome: string
  descrizione: string
  macchina: string | null
}

export interface VanoFull {
  id: string
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
  prezzo_unitario_calcolato: number | null
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
      const { data: vanoData, error: vErr } = await supabase
        .from('preventivo_vani_snapshot')
        .select('id, nome, tipo, stanza, pezzi, sistema, sottosistema, vetro, colore_int, colore_est, telaio, uw, ore_produzione, note, accessori, misure_complete, prezzo_unitario_calcolato')
        .eq('id', vanoId)
        .single()
      if (vErr) throw vErr
      setVano(vanoData as any)

      const { data: storicoData, error: sErr } = await supabase
        .rpc('vano_storico_fasi', { p_vano_id: vanoId, p_azienda_id: aziendaId })
      if (sErr) throw sErr
      setStorico((storicoData || []).map((r: any) => ({
        ...r,
        foto_urls: Array.isArray(r.foto_urls) ? r.foto_urls : []
      })))

      const { data: eventiData, error: eErr } = await supabase
        .rpc('vano_eventi_giornata', { p_vano_id: vanoId, p_azienda_id: aziendaId })
      if (eErr) throw eErr
      setEventi(eventiData || [])
    } catch (e: any) {
      setError(e.message || 'Errore caricamento vano')
    } finally {
      setLoading(false)
    }
  }, [vanoId, aziendaId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!vanoId || !aziendaId) return
    const ch = supabase
      .channel(`vano_${vanoId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'produzione_vano_stato', 
        filter: `vano_id=eq.${vanoId}` 
      }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [vanoId, aziendaId, fetchAll])

  return { vano, storico, eventi, loading, error, refetch: fetchAll }
}

export function useVanoActions(aziendaId: string | null) {
  const risolviProblema = async (vanoStatoId: string, note?: string) => {
    return await supabase
      .from('produzione_vano_stato')
      .update({ 
        stato: 'in_corso', 
        problema_risolto_at: new Date().toISOString(),
        note: note || null
      })
      .eq('id', vanoStatoId)
  }

  const spostaOperatore = async (vanoStatoId: string, nuovoOperatoreId: string) => {
    return await supabase
      .from('produzione_vano_stato')
      .update({ operatore_id: nuovoOperatoreId })
      .eq('id', vanoStatoId)
  }

  const mettiInPausa = async (vanoStatoId: string) => {
    return await supabase
      .from('produzione_vano_stato')
      .update({ stato: 'in_coda' })
      .eq('id', vanoStatoId)
  }

  return { risolviProblema, spostaOperatore, mettiInPausa }
}
