import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface GateStats {
  totali: number
  inviati: number
  confermati: number
  arrivati: number
  in_viaggio: number
  con_errori: number
  bloccanti_aperti: number
  importo_totale: number
  data_inizio_ordini: string | null
  data_ultimo_arrivo: string | null
}

export interface OrdineFornitoreRow {
  id: string
  numero: string
  fornitore: string
  categoria_materiale: string | null
  totale_euro: number | null
  stato: string
  arrivato_at: string | null
  verificato_at: string | null
  ddt_numero: string | null
  ddt_data: string | null
  consegna_prevista: string | null
  bloccante: boolean
  urgente: boolean
  errore_descrizione: string | null
  scostamento_costo: number | null
  righe_verificate: any
  n_righe: number
  n_righe_verificate: number
  ricezione_note: string | null
}

export interface TimelineEvento {
  evento_at: string
  tipo: 'commessa' | 'ordine' | 'arrivo'
  titolo: string
  descrizione: string
  colore: 'green' | 'red' | 'amber'
}

export interface AvvioResult {
  esito: 'successo' | 'gate_bloccato' | 'errore'
  carico_id?: string
  msg?: string
  bloccanti?: number
  vani_totali?: number
  ore_pianificate?: number
  giorni_pianificati?: number
}

export function useGateMateriali(commessaId: string | null, aziendaId: string | null) {
  const [stats, setStats] = useState<GateStats | null>(null)
  const [ordini, setOrdini] = useState<OrdineFornitoreRow[]>([])
  const [timeline, setTimeline] = useState<TimelineEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!commessaId || !aziendaId) return
    setLoading(true)
    setError(null)
    try {
      const [statsRes, ordiniRes, timelineRes] = await Promise.all([
        supabase.rpc('gate_materiali_commessa', { p_commessa_id: commessaId, p_azienda_id: aziendaId }),
        supabase.rpc('ordini_fornitore_commessa', { p_commessa_id: commessaId, p_azienda_id: aziendaId }),
        supabase.rpc('timeline_gate_materiali', { p_commessa_id: commessaId, p_azienda_id: aziendaId })
      ])
      if (statsRes.error) throw statsRes.error
      if (ordiniRes.error) throw ordiniRes.error
      if (timelineRes.error) throw timelineRes.error

      setStats(statsRes.data?.[0] || null)
      setOrdini(ordiniRes.data || [])
      setTimeline(timelineRes.data || [])
    } catch (e: any) {
      setError(e.message || 'Errore caricamento gate materiali')
    } finally {
      setLoading(false)
    }
  }, [commessaId, aziendaId])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!commessaId || !aziendaId) return
    const ch = supabase
      .channel(`gate_${commessaId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'ordini_fornitore',
        filter: `commessa_id=eq.${commessaId}`
      }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [commessaId, aziendaId, fetchAll])

  const avviaProduzione = async (forza: boolean = false): Promise<AvvioResult> => {
    if (!commessaId || !aziendaId) return { esito: 'errore', msg: 'Parametri mancanti' }
    const { data, error: err } = await supabase.rpc('avvia_produzione_commessa', {
      p_commessa_id: commessaId,
      p_azienda_id: aziendaId,
      p_forza: forza
    })
    if (err) return { esito: 'errore', msg: err.message }
    return data as AvvioResult
  }

  return { stats, ordini, timeline, loading, error, refetch: fetchAll, avviaProduzione }
}
