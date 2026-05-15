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

export interface CaricoArricchito {
  id: string
  commessa_id: string
  stato: StatoCarico
  priorita: number | null
  data_avvio: string
  data_fine_prevista: string
  avviato_at: string | null
  vani_totali: number | null
  vani_completati: number
  vani_bloccati: number
  ore_pianificate: number | null
  gate_materiali_ok: boolean
  commessa_code: string
  commessa_cliente: string | null
  commessa_consegna: string | null
  commessa_indirizzo: string | null
  commessa_fase: string | null
  sistemi_costruzione: string[]
  operatori_attivi_count: number
  squadre: string[]
  fase_corrente_nome: string | null
  fase_corrente_colore: string | null
  fase_corrente_ordine: number | null
  fase_ferma_per_blocco: boolean
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

export interface CommessaDisponibile {
  id: string
  code: string
  cliente: string | null
  indirizzo: string | null
  fase: string
  data_consegna: string | null
  n_vani: number
}

export function useProduzioneFlotta(aziendaId: string | null) {
  const [carichi, setCarichi] = useState<CaricoArricchito[]>([])
  const [fasi, setFasi] = useState<FaseProduzione[]>([])
  const [stazioni, setStazioni] = useState<StatoStazione[]>([])
  const [kpi, setKpi] = useState<KPIProduzione>({ attive: 0, in_coda: 0, in_ritardo: 0, bloccate: 0, pronte_consegna: 0 })
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

      const carichiRes = await supabase.rpc('carichi_flotta_arricchiti', { p_azienda_id: aziendaId })
      if (carichiRes.error) throw carichiRes.error
      const flat: CaricoArricchito[] = carichiRes.data || []
      setCarichi(flat)

      const oggi = new Date().toISOString().split('T')[0]
      setKpi({
        attive: flat.filter(c => c.stato === 'in_corso').length,
        in_coda: flat.filter(c => c.stato === 'pianificato').length,
        in_ritardo: flat.filter(c => c.data_fine_prevista < oggi && c.stato !== 'completato').length,
        bloccate: flat.filter(c => c.stato === 'bloccato' || c.vani_bloccati > 0 || c.fase_ferma_per_blocco).length,
        pronte_consegna: flat.filter(c => c.stato === 'completato').length,
      })

      const stazRes = await supabase.rpc('stato_stazioni_officina', { p_azienda_id: aziendaId })
      if (!stazRes.error && stazRes.data) setStazioni(stazRes.data)
    } catch (e: any) {
      setError(e.message || 'Errore caricamento produzione')
    } finally {
      setLoading(false)
    }
  }, [aziendaId])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!aziendaId) return
    const chName = 'prodflotta_' + aziendaId
    const filt = 'azienda_id=eq.' + aziendaId
    const ch = supabase
      .channel(chName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produzione_carichi', filter: filt }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produzione_vano_stato', filter: filt }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [aziendaId, fetchAll])

  return { carichi, fasi, kpi, stazioni, loading, error, refetch: fetchAll }
}

export async function fetchCommesseDisponibili(aziendaId: string): Promise<CommessaDisponibile[]> {
  const { data, error } = await supabase.rpc('commesse_disponibili_per_carico', { p_azienda_id: aziendaId })
  if (error) throw error
  return data || []
}

export async function creaCarico(aziendaId: string, commessaId: string): Promise<string> {
  const res = await supabase.rpc('avvia_produzione_commessa', {
    p_commessa_id: commessaId,
    p_azienda_id: aziendaId,
    p_forza: false
  })
  if (res.error) throw res.error
  if (res.data?.esito === 'gate_bloccato') {
    throw new Error('Gate materiali bloccato: ' + (res.data.msg || 'ordini bloccanti aperti'))
  }
  return res.data?.carico_id
}
