import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface VanoRiepilogo {
  vano_id: string
  vano_numero: number | null
  vano_nome: string | null
  vano_stanza: string | null
  vano_tipo: string | null
  vano_misure: string | null
  stato_globale: 'completato' | 'in_corso' | 'bloccato' | 'parziale' | 'in_coda'
  fase_corrente_id: string | null
  fase_corrente_nome: string | null
  fase_corrente_colore: string | null
  fase_corrente_ordine: number | null
  operatore_id: string | null
  operatore_nome: string | null
  bloccato: boolean
  fasi_completate: number
  fasi_totali: number
}

export interface OperatoreAttivo {
  operatore_id: string
  operatore_nome: string
  operatore_cognome: string | null
  avatar_url: string | null
  colore: string | null
  vano_corrente_id: string | null
  vano_corrente_stanza: string | null
  fase_corrente: string | null
  iniziato_at: string | null
  stato_attivita: 'in_corso' | 'bloccato'
}

export interface CommessaProdFull {
  id: string
  code: string
  fase: string
  cliente: string | null
  cognome: string | null
  indirizzo: string | null
  data_richiesta: string | null
  carico_id: string | null
  carico_stato: string | null
  carico_avviato_at: string | null
  carico_ore_pianificate: number | null
  carico_vani_completati: number
  carico_vani_bloccati: number
  carico_vani_totali: number | null
}

export interface StazioneCommessa {
  fase_id: string
  fase_nome: string
  fase_colore: string
  fase_ordine: number
  vani_completati: number
  vani_in_corso: number
  vani_bloccati: number
  vani_totali: number
}

export interface EventoTimeline {
  evento_at: string
  tipo: 'avvio' | 'fine' | 'blocco'
  descrizione: string
  colore: string
}

export function useCommessaProduzione(commessaId: string | null, aziendaId: string | null) {
  const [commessa, setCommessa] = useState<CommessaProdFull | null>(null)
  const [vani, setVani] = useState<VanoRiepilogo[]>([])
  const [operatori, setOperatori] = useState<OperatoreAttivo[]>([])
  const [stazioni, setStazioni] = useState<StazioneCommessa[]>([])
  const [timeline, setTimeline] = useState<EventoTimeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!commessaId || !aziendaId) return
    setLoading(true)
    setError(null)
    try {
      const cRes = await supabase.from('commesse')
        .select('id, code, fase, cliente, cognome, indirizzo, data_richiesta')
        .eq('id', commessaId).eq('azienda_id', aziendaId).maybeSingle()
      if (cRes.error) throw cRes.error
      if (!cRes.data) throw new Error('Commessa non trovata')

      const carRes = await supabase.from('produzione_carichi')
        .select('id, stato, avviato_at, ore_pianificate, vani_completati, vani_bloccati, vani_totali')
        .eq('commessa_id', commessaId).eq('azienda_id', aziendaId)
        .order('created_at', { ascending: false }).maybeSingle()

      setCommessa({
        ...cRes.data,
        carico_id: carRes.data?.id ?? null,
        carico_stato: carRes.data?.stato ?? null,
        carico_avviato_at: carRes.data?.avviato_at ?? null,
        carico_ore_pianificate: carRes.data?.ore_pianificate ?? null,
        carico_vani_completati: carRes.data?.vani_completati ?? 0,
        carico_vani_bloccati: carRes.data?.vani_bloccati ?? 0,
        carico_vani_totali: carRes.data?.vani_totali ?? null,
      })

      const [vRes, oRes, sRes, tRes] = await Promise.all([
        supabase.rpc('commessa_vani_riepilogo', { p_commessa_id: commessaId, p_azienda_id: aziendaId }),
        supabase.rpc('commessa_operatori_attivi', { p_commessa_id: commessaId, p_azienda_id: aziendaId }),
        supabase.rpc('carico_stazioni_commessa', { p_commessa_id: commessaId, p_azienda_id: aziendaId }),
        supabase.rpc('timeline_commessa_produzione', { p_commessa_id: commessaId, p_azienda_id: aziendaId }),
      ])
      if (vRes.error) throw vRes.error
      if (oRes.error) throw oRes.error
      if (sRes.error) throw sRes.error
      if (tRes.error) throw tRes.error
      setVani(vRes.data || [])
      setOperatori(oRes.data || [])
      setStazioni(sRes.data || [])
      setTimeline(tRes.data || [])
    } catch (e: any) {
      setError(e.message || 'Errore caricamento commessa')
    } finally {
      setLoading(false)
    }
  }, [commessaId, aziendaId])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!commessaId || !aziendaId) return
    const chName = 'comm_prod_' + commessaId
    const filt = 'commessa_id=eq.' + commessaId
    const ch = supabase.channel(chName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produzione_vano_stato', filter: filt }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produzione_carichi', filter: filt }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [commessaId, aziendaId, fetchAll])

  return { commessa, vani, operatori, stazioni, timeline, loading, error, refetch: fetchAll }
}

export async function chiudiCaricoFn(caricoId: string, aziendaId: string): Promise<boolean> {
  const res = await supabase.from('produzione_carichi')
    .update({ stato: 'completato', completato_at: new Date().toISOString() })
    .eq('id', caricoId).eq('azienda_id', aziendaId)
  return !res.error
}
