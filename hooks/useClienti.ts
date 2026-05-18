'use client'
import { useState, useEffect, useCallback } from 'react'
import { fetchClienti } from '@/lib/clienti-queries'
import type { Cliente, ClienteStato } from '@/lib/clienti-types'

export type ClientiFiltro = 'tutti' | ClienteStato | 'vip'

export function useClienti() {
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<ClientiFiltro>('tutti')
  const [search, setSearch] = useState('')
  const [nuovoOpen, setNuovoOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchClienti({
        stato: filtro === 'tutti' || filtro === 'vip' ? undefined : filtro,
        vip: filtro === 'vip',
        q: search || undefined,
      })
      setClienti(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filtro, search])

  useEffect(() => { load() }, [load])

  const counts = {
    tutti: clienti.length,
    vip: clienti.filter(c => c.livello_vip > 0).length,
  }

  return { clienti, loading, filtro, setFiltro, search, setSearch, nuovoOpen, setNuovoOpen, reload: load, counts }
}
