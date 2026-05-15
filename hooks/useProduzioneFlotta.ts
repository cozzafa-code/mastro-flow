import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type StatoCarico = 'pianificato' | 'in_corso' | 'in_pausa' | 'completato' | 'bloccato' | 'annullato'

export interface FaseProduzione {
  id: string
  nome: string
  colore: string
  ordine: number
  attiva: boolean
}

export interface CaricoConCommessa {
  id: string
  azienda_id: string
  commessa_id: string
  data_avvio: string
  data_fine_prevista: string
  vani_totali: number | null
  vani_completati: number
  vani_bloccati: number
  stato: StatoCarico
  priorita: number | null
  giorni_pianificati: number | null
  ore_pianificate: number | null
  tempo_stima_origine: string | null
  avviato_at: string | null
  completato_at: string | null
  gate_materiali_ok: boolean
  operatore_avvio_id: string | null
  note: string | null
  created_at: string
  commessa_code: string
  commessa_cliente: string
  commessa_consegna: string | null
  commessa_indirizzo: string | null
}

export interface StatoStazione {
  fase_id: string
  fase_nome: string
  fase_colore: string
  fase_ordine: number
  vani_in_corso: number
  vani_in_coda: number
  vani_bloccati: number
  vani_completati: number
}

export interface KPIProduzione {
  attive: number
  in_coda: number
  in_ritardo: number
  bloccate: number
  pronte_consegna: number
}

export function useProduzioneFlotta(aziendaId: string | null) {
  const [carichi, setCarichi] = useState<CaricoConCommessa[]>([])
  const [fasi, setFasi] = useState<FaseProduzione[]>([])
  const [kpi, setKpi] = useState<KPIProduzione>({ attive: 0, in_coda: 0, in_ritardo: 0, bloccate: 0, pronte_consegna: 0 })
  const [stazioni, setStazioni] = useState<StatoStazione[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!aziendaId) return
    setLoading(true)
    setError(null)
    try {
      const fasiRes = await supabase
        .from('fasi_produzione')
        .select('id, nome, colore, ordine, attiva')
        .eq('azienda_id', aziendaId)
        .eq('attiva', true)
        .order('ordine')
      if (fasiRes.error) throw fasiRes.error
      setFasi(fasiRes.data || [])

      const carichiRes = await supabase
        .from('produzione_carichi')
        .select('*, commesse!inner ( code, cliente, cognome, data_richiesta, indirizzo )')
        .eq('azienda_id', aziendaId)
        .neq('stato', 'completato')
        .order('priorita', { ascending: false, nullsFirst: false })
        .order('data_fine_prevista', { ascending: true })
      if (carichiRes.error) throw carichiRes.error

      const flat: CaricoConCommessa[] = (carichiRes.data || []).map((c: any) => ({
        ...c,
        commessa_code: c.commesse?.code || '',
        commessa_cliente: ((c.commesse?.cliente || '') + ' ' + (c.commesse?.cognome || '')).trim(),
        commessa_consegna: c.commesse?.data_richiesta || null,
        commessa_indirizzo: c.commesse?.indirizzo || null,
      }))
      setCarichi(flat)

      const oggi = new Date().toISOString().split('T')[0]
      setKpi({
        attive: flat.filter(c => c.stato === 'in_corso').length,
        in_coda: flat.filter(c => c.stato === 'pianificato').length,
        in_ritardo: flat.filter(c => c.data_fine_prevista < oggi && c.stato !== 'completato').length,
        bloccate: flat.filter(c => c.stato === 'bloccato' || c.vani_bloccati > 0).length,
        pronte_consegna: flat.filter(c => c.stato === 'completato').length,
      })

      const stazioniRes = await supabase.rpc('stato_stazioni_officina', { p_azienda_id: aziendaId })
      if (!stazioniRes.error && stazioniRes.data) setStazioni(stazioniRes.data)
    } catch (e: any) {
      setError(e.message || 'Errore caricamento produzione')
    } finally {
      setLoading(false)
    }
  }, [aziendaId])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!aziendaId) return
    const channelName = 'prodflotta_' + aziendaId
    const filterCarichi = 'azienda_id=eq.' + aziendaId
    const ch = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produzione_carichi', filter: filterCarichi }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produzione_vano_stato', filter: filterCarichi }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [aziendaId, fetchAll])

  return { carichi, fasi, kpi, stazioni, loading, error, refetch: fetchAll }
}
