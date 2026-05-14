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
  cliente_nome: string | null
  indirizzo_cantiere: string | null
  data_consegna_prevista: string | null
  carico_id: string | null
  carico_stato: string | null
  carico_avviato_at: string | null
  carico_ore_pianificate: number | null
  carico_vani_completati: number
  carico_vani_bloccati: number
  carico_vani_totali: number | null
}

export function useCommessaProduzione(commessaId: string | null, aziendaId: string | null) {
  const [commessa, setCommessa] = useState<CommessaProdFull | null>(null)
  const [vani, setVani] = useState<VanoRiepilogo[]>([])
  const [operatori, setOperatori] = useState<OperatoreAttivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!commessaId || !aziendaId) return
    setLoading(true)
    setError(null)
    try {
      const { data: cData, error: cErr } = await supabase
        .from('commesse')
        .select('id, code, fase, cliente_nome, indirizzo_cantiere, data_consegna_prevista')
        .eq('id', commessaId)
        .eq('azienda_id', aziendaId)
        .maybeSingle()
      if (cErr) throw cErr
      if (!cData) throw new Error('Commessa non trovata')

      const { data: caricoData } = await supabase
        .from('produzione_carichi')
        .select('id, stato, avviato_at, ore_pianificate, vani_completati, vani_bloccati, vani_totali')
        .eq('commessa_id', commessaId)
        .eq('azienda_id', aziendaId)
        .order('created_at', { ascending: false })
        .maybeSingle()

      setCommessa({
        ...cData,
        carico_id: caricoData?.id ?? null,
        carico_stato: caricoData?.stato ?? null,
        carico_avviato_at: caricoData?.avviato_at ?? null,
        carico_ore_pianificate: caricoData?.ore_pianificate ?? null,
        carico_vani_completati: caricoData?.vani_completati ?? 0,
        carico_vani_bloccati: caricoData?.vani_bloccati ?? 0,
        carico_vani_totali: caricoData?.vani_totali ?? null,
      })

      const { data: vaniData, error: vErr } = await supabase
        .rpc('commessa_vani_riepilogo', { p_commessa_id: commessaId, p_azienda_id: aziendaId })
      if (vErr) throw vErr
      setVani(vaniData || [])

      const { data: opData, error: opErr } = await supabase
        .rpc('commessa_operatori_attivi', { p_commessa_id: commessaId, p_azienda_id: aziendaId })
      if (opErr) throw opErr
      setOperatori(opData || [])
    } catch (e: any) {
      setError(e.message || 'Errore caricamento commessa')
    } finally {
      setLoading(false)
    }
  }, [commessaId, aziendaId])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!commessaId || !aziendaId) return
    const ch = supabase
      .channel(`comm_prod_${commessaId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'produzione_vano_stato',
        filter: `commessa_id=eq.${commessaId}`
      }, fetchAll)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'produzione_carichi',
        filter: `commessa_id=eq.${commessaId}`
      }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [commessaId, aziendaId, fetchAll])

  return { commessa, vani, operatori, loading, error, refetch: fetchAll }
}
