// hooks/useCatalogoTendaggi.ts
// Hook caricamento catalogo aziendale tendaggi.
// Recupera azienda_id automaticamente via getAziendaId (localStorage/operatore/profili).

import { useEffect, useState } from 'react'

export type CatalogoTendaItem = {
  id: string
  fornitore: string
  modello: string
  categoria: 'esterno' | 'interno'
  tipo_modello: string
  colore_default: string | null
  prezzo_base_eur: number | null
  unita_prezzo: 'mq' | 'pz' | null
}

export function useCatalogoTendaggi() {
  const [items, setItems] = useState<CatalogoTendaItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        const { getAziendaId } = await import('@/lib/supabase-sync')
        const aziendaId = await getAziendaId()
        if (!aziendaId) {
          if (alive) { setItems([]); setLoading(false) }
          return
        }
        const { supabase } = await import('@/lib/supabase')
        const { data, error } = await supabase
          .from('catalogo_tendaggi')
          .select('id,fornitore,modello,categoria,tipo_modello,colore_default,prezzo_base_eur,unita_prezzo')
          .eq('azienda_id', aziendaId)
          .eq('attivo', true)
          .order('ordine', { ascending: true })
          .order('fornitore', { ascending: true })
        if (!alive) return
        if (error) { console.error('useCatalogoTendaggi:', error); setItems([]) }
        else setItems((data || []) as CatalogoTendaItem[])
      } catch (e) {
        if (alive) setItems([])
      }
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  return { items, loading }
}
