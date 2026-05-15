import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface FaseConfig {
  id: string
  nome: string
  colore: string
  ordine: number
  attiva: boolean
  stima_minuti_default: number | null
  descrizione: string | null
  icona: string | null
}

export interface MacchinaConfig {
  id: string
  fase_id: string | null
  nome: string
  modello: string | null
  tipo: string | null
  capacita_orarie: number | null
  unita_capacita: string | null
  stato: 'attiva' | 'ferma' | 'manutenzione' | 'dismessa'
  attiva: boolean
  ordine: number
  note: string | null
}

export interface FaseConMacchine extends FaseConfig {
  macchine: MacchinaConfig[]
  stato_globale: 'attiva' | 'ferma' | 'manutenzione'
}

export function useConfigFasi(aziendaId: string | null) {
  const [fasi, setFasi] = useState<FaseConMacchine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!aziendaId) return
    setLoading(true)
    setError(null)
    try {
      const { data: fasiData, error: fErr } = await supabase
        .from('fasi_produzione')
        .select('id, nome, colore, ordine, attiva, stima_minuti_default, descrizione, icona')
        .eq('azienda_id', aziendaId)
        .order('ordine')
      if (fErr) throw fErr

      const { data: macData, error: mErr } = await supabase
        .from('produzione_macchine')
        .select('id, fase_id, nome, modello, tipo, capacita_orarie, unita_capacita, stato, attiva, ordine, note')
        .eq('azienda_id', aziendaId)
        .order('ordine')
      if (mErr) throw mErr

      const combined: FaseConMacchine[] = (fasiData || []).map(f => {
        const macs = (macData || []).filter(m => m.fase_id === f.id) as MacchinaConfig[]
        const anyAttiva = macs.some(m => m.stato === 'attiva')
        const anyFerma = macs.some(m => m.stato === 'ferma')
        let statoGlobale: 'attiva' | 'ferma' | 'manutenzione' = 'attiva'
        if (!anyAttiva && anyFerma) statoGlobale = 'ferma'
        else if (macs.some(m => m.stato === 'manutenzione')) statoGlobale = 'manutenzione'
        return { ...(f as FaseConfig), macchine: macs, stato_globale: statoGlobale }
      })

      setFasi(combined)
    } catch (e: any) {
      setError(e.message || 'Errore caricamento config')
    } finally {
      setLoading(false)
    }
  }, [aziendaId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const aggiornaOrdineFasi = async (faseIds: string[]) => {
    if (!aziendaId) return
    const updates = faseIds.map((id, idx) => 
      supabase.from('fasi_produzione').update({ ordine: idx + 1 }).eq('id', id).eq('azienda_id', aziendaId)
    )
    await Promise.all(updates)
    fetchAll()
  }

  const toggleFaseAttiva = async (faseId: string, attiva: boolean) => {
    if (!aziendaId) return
    await supabase.from('fasi_produzione').update({ attiva }).eq('id', faseId).eq('azienda_id', aziendaId)
    fetchAll()
  }

  const aggiungiFase = async (nome: string, colore: string = '#28A0A0') => {
    if (!aziendaId) return
    const ordineMax = Math.max(...fasi.map(f => f.ordine), 0) + 1
    await supabase.from('fasi_produzione').insert({
      azienda_id: aziendaId, nome, colore, ordine: ordineMax, attiva: true
    })
    fetchAll()
  }

  const eliminaFase = async (faseId: string) => {
    if (!aziendaId) return
    await supabase.from('fasi_produzione').delete().eq('id', faseId).eq('azienda_id', aziendaId)
    fetchAll()
  }

  const aggiungiMacchina = async (faseId: string, nome: string, modello?: string, capacita?: number) => {
    if (!aziendaId) return
    await supabase.from('produzione_macchine').insert({
      azienda_id: aziendaId, fase_id: faseId, nome, modello,
      capacita_orarie: capacita, stato: 'attiva', attiva: true
    })
    fetchAll()
  }

  const toggleStatoMacchina = async (macchinaId: string, stato: MacchinaConfig['stato']) => {
    await supabase.from('produzione_macchine').update({ stato }).eq('id', macchinaId)
    fetchAll()
  }

  const eliminaMacchina = async (macchinaId: string) => {
    await supabase.from('produzione_macchine').delete().eq('id', macchinaId)
    fetchAll()
  }

  return { 
    fasi, loading, error, refetch: fetchAll,
    aggiornaOrdineFasi, toggleFaseAttiva, aggiungiFase, eliminaFase,
    aggiungiMacchina, toggleStatoMacchina, eliminaMacchina
  }
}
