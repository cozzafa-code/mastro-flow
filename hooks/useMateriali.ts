"use client"
// hooks/useMateriali.ts
// Carica ordini fornitore + magazzino + movimenti per azienda corrente
import { useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getAziendaId(): string | null {
  if (typeof window === "undefined") return null
  const c = [
    sessionStorage.getItem("mastro:aziendaId"),
    localStorage.getItem("mastro:aziendaId"),
    sessionStorage.getItem("aziendaId"),
    localStorage.getItem("aziendaId"),
  ]
  for (const v of c) if (v && UUID_RE.test(v)) return v
  return null
}

export function useMateriali() {
  const [ordini, setOrdini] = useState<any[]>([])
  const [magazzino, setMagazzino] = useState<any[]>([])
  const [movimenti, setMovimenti] = useState<any[]>([])
  const [fornitori, setFornitori] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const azId = getAziendaId()
    if (!azId) { setError("aziendaId non trovato"); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const [oR, mR, movR, fR] = await Promise.all([
        supabase.from("ordini_fornitore").select("*").eq("azienda_id", azId).order("created_at", { ascending: false }),
        supabase.from("magazzino_articoli").select("*").eq("azienda_id", azId).eq("attivo", true).order("nome"),
        supabase.from("magazzino_movimenti").select("*").eq("azienda_id", azId).order("created_at", { ascending: false }).limit(20),
        supabase.from("fornitori_listino_categorie").select("*").eq("azienda_id", azId).order("ordine"),
      ])
      setOrdini(oR.data || [])
      setMagazzino(mR.data || [])
      setMovimenti(movR.data || [])
      setFornitori(fR.data || [])
    } catch (e: any) {
      setError(e?.message || "Errore caricamento")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  // Statistiche derivate
  const stats = {
    totali: ordini.length,
    daInviare: ordini.filter(o => o.stato === "bozza" || (!o.data_invio && o.stato !== "annullato")).length,
    inviati: ordini.filter(o => o.data_invio && !o.data_ricezione && o.stato !== "annullato").length,
    inTransito: ordini.filter(o => o.stato === "in_transito" || o.stato === "spedito").length,
    arrivati: ordini.filter(o => o.stato === "arrivato" || o.stato === "completato").length,
    inRitardo: ordini.filter(o => {
      if (o.stato === "completato" || o.stato === "annullato") return false
      const cp = o.consegna_prevista ? new Date(o.consegna_prevista).getTime() : 0
      return cp && cp < Date.now()
    }).length,
    sottoScorta: magazzino.filter(a => Number(a.qta_disponibile || 0) < Number(a.qta_minima || 0)).length,
    valoreMagazzino: magazzino.reduce((s, a) => s + (Number(a.qta_disponibile || 0) * Number(a.prezzo_medio || 0)), 0),
    spesaMese: ordini.filter(o => {
      const d = o.data_invio ? new Date(o.data_invio) : null
      if (!d) return false
      const oggi = new Date()
      return d.getFullYear() === oggi.getFullYear() && d.getMonth() === oggi.getMonth()
    }).reduce((s, o) => s + Number(o.totale_euro || o.totale_stimato || 0), 0),
  }

  return { ordini, magazzino, movimenti, fornitori, stats, loading, error, reload }
}
