'use client'
import { useState, useEffect, useCallback } from 'react'
import { fetchCliente, fetchDiary, updateCliente, archiviaCliente } from '@/lib/clienti-queries'
import type { Cliente, ClienteIndirizzo, DiaryEntry } from '@/lib/clienti-types'

export type DettaglioTab = 'info' | 'diario' | 'commesse' | 'comunicazioni'

export function useClienteDettaglio(id: string) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [indirizzi, setIndirizzi] = useState<ClienteIndirizzo[]>([])
  const [commesse, setCommesse] = useState<any[]>([])
  const [diary, setDiary] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<DettaglioTab>('info')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [det, diaryData] = await Promise.all([
        fetchCliente(id),
        fetchDiary(id),
      ])
      setCliente(det.cliente)
      setIndirizzi(det.indirizzi || [])
      setCommesse(det.commesse || [])
      setDiary(diaryData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const reloadDiary = useCallback(async () => {
    const d = await fetchDiary(id)
    setDiary(d)
  }, [id])

  return { cliente, indirizzi, commesse, diary, loading, tab, setTab, reload: load, reloadDiary }
}
