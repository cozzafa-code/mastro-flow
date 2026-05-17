'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Evento, PrioritaTitolare, Notifica, HomeState } from '@/lib/types'
import {
  getEventiPerData,
  getEventiSettimana,
  getPrioritaAttiva,
  getNotifiche,
  spostaEvento,
  segnaNotificaInApp,
} from '@/lib/supabase/queries'

function toISO(date: Date) {
  return date.toISOString().split('T')[0]
}

function getSettimana(date: Date): { dal: string; al: string } {
  const d = new Date(date)
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1 // lun=0
  d.setDate(d.getDate() - dow)
  const dal = toISO(d)
  d.setDate(d.getDate() + 6)
  const al = toISO(d)
  return { dal, al }
}

export function useHome() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<HomeState['viewMode']>('week')
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [spostaTarget, setSpostaTarget] = useState<Evento | null>(null)
  const [notifichePanelOpen, setNotifichePanelOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const [eventiOggi, setEventiOggi] = useState<Evento[]>([])
  const [eventiSettimana, setEventiSettimana] = useState<Record<string, Evento[]>>({})
  const [priorita, setPriorita] = useState<PrioritaTitolare | null>(null)
  const [notifiche, setNotifiche] = useState<Notifica[]>([])
  const [loading, setLoading] = useState(true)

  // Carica dati giorno selezionato
  const caricaGiorno = useCallback(async (date: Date) => {
    const iso = toISO(date)
    const eventi = await getEventiPerData(iso)
    setEventiOggi(eventi)
  }, [])

  // Carica settimana
  const caricaSettimana = useCallback(async (date: Date) => {
    const { dal, al } = getSettimana(date)
    const map = await getEventiSettimana(dal, al)
    // Assicura che tutti i 7 giorni esistano nella mappa
    const cursor = new Date(dal)
    const fullMap = { ...map }
    for (let i = 0; i < 7; i++) {
      const k = toISO(cursor)
      if (!fullMap[k]) fullMap[k] = []
      cursor.setDate(cursor.getDate() + 1)
    }
    setEventiSettimana(fullMap)
  }, [])

  // Init
  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([
        caricaGiorno(selectedDate),
        caricaSettimana(selectedDate),
        getPrioritaAttiva().then(setPriorita),
        getNotifiche().then(setNotifiche),
      ])
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateChange = useCallback(async (date: Date) => {
    setSelectedDate(date)
    setExpandedEventId(null)
    await Promise.all([caricaGiorno(date), caricaSettimana(date)])
  }, [caricaGiorno, caricaSettimana])

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedEventId(prev => prev === id ? null : id)
  }, [])

  const handleSposta = useCallback((evento: Evento) => {
    setSpostaTarget(evento)
  }, [])

  const handleConfermaSposta = useCallback(async (
    eventoId: string,
    nuovaData: string,
    nuovaOra: string
  ) => {
    await spostaEvento(eventoId, nuovaData, nuovaOra)
    // Notifica in-app
    if (spostaTarget?.cliente?.nome) {
      await segnaNotificaInApp(
        spostaTarget.user_id,
        'Appuntamento spostato',
        `L'appuntamento con ${spostaTarget.cliente.nome} è stato spostato al ${nuovaData} alle ${nuovaOra}`,
        `/agenda?data=${nuovaData}`
      )
    }
    setSpostaTarget(null)
    await Promise.all([caricaGiorno(selectedDate), caricaSettimana(selectedDate)])
  }, [spostaTarget, selectedDate, caricaGiorno, caricaSettimana])

  // Prossimo evento = il più vicino a now() tra quelli del giorno
  const prossimoEvento = eventiOggi.find(e => {
    if (toISO(selectedDate) !== toISO(new Date())) return e === eventiOggi[0]
    const [h, m] = e.ora_inizio.split(':').map(Number)
    const now = new Date()
    return h * 60 + m >= now.getHours() * 60 + now.getMinutes()
  }) ?? eventiOggi[0] ?? null

  const notificheNonLette = notifiche.filter(n => !n.letta).length

  return {
    // stato
    selectedDate,
    viewMode,
    expandedEventId,
    spostaTarget,
    notifichePanelOpen,
    searchOpen,
    // dati
    eventiOggi,
    eventiSettimana,
    priorita,
    notifiche,
    notificheNonLette,
    prossimoEvento,
    loading,
    // handlers
    setViewMode,
    setNotifichePanelOpen,
    setSearchOpen,
    setSpostaTarget,
    handleDateChange,
    handleToggleExpand,
    handleSposta,
    handleConfermaSposta,
  }
}
