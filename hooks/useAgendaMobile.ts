// hooks/useAgendaMobile.ts
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { AgendaEvent, AgendaFilters, AgendaEventType } from "../lib/types/agenda";

const MOCK_EVENTS: AgendaEvent[] = [
  {
    id: "ev_mock_1",
    tipo: "montaggio",
    oraInizio: "08:30",
    oraFine: "13:00",
    data: new Date().toISOString().split("T")[0],
    titolo: "Montaggio infissi",
    commessaCode: "S-0003",
    cliente: "Rossi",
    indirizzo: "Via Roma 12, Milano",
    squadra: "Squadra 2",
    persone: ["Marco", "Luca"],
    descrizione: "Montaggio 5 infissi PVC + 2 scorrevoli",
    stato: "conferma",
  },
  {
    id: "ev_mock_2",
    tipo: "sopralluogo",
    oraInizio: "10:30",
    oraFine: "11:30",
    data: new Date().toISOString().split("T")[0],
    titolo: "Sopralluogo",
    cliente: "Bianchi Showroom",
    indirizzo: "Via Verdi 45, Monza",
  },
  {
    id: "ev_mock_3",
    tipo: "produzione",
    oraInizio: "14:00",
    oraFine: "18:00",
    data: new Date().toISOString().split("T")[0],
    titolo: "Produzione",
    ordineCode: "9131G",
    descrizione: "6 pezzi · Finestre PVC",
    stato: "in_produzione",
  },
  {
    id: "ev_mock_4",
    tipo: "problema",
    oraInizio: "16:30",
    oraFine: "17:00",
    data: new Date().toISOString().split("T")[0],
    titolo: "Vetro non arrivato",
    commessaCode: "S-0001",
    cliente: "Verdi",
  },
];

const DEFAULT_FILTERS: AgendaFilters = {
  showMontaggi: true,
  showSopralluoghi: true,
  showProduzioni: true,
  showProblemi: true,
  showCompletate: false,
  squadre: [],
  persone: [],
};

export function useAgendaMobile() {
  const [events, setEvents] = useState<AgendaEvent[]>(MOCK_EVENTS);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [filters, setFilters] = useState<AgendaFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"giorno" | "settimana" | "mese" | "problemi">("giorno");

  // Tenta caricamento da Supabase, fallback a mock
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // @ts-ignore - supabase client globale (lib/supabase)
        const mod = await import("../lib/supabase").catch(() => null);
        const supabase = mod?.supabase;
        if (!supabase) return;
        // Esempio: leggo da una vista "agenda_eventi" se esiste, altrimenti niente
        const { data, error } = await supabase
          .from("agenda_eventi")
          .select("*")
          .order("data", { ascending: true })
          .limit(200);
        if (!alive) return;
        if (!error && Array.isArray(data) && data.length > 0) {
          // Mappa campi DB -> AgendaEvent (best effort)
          const mapped: AgendaEvent[] = data.map((r: any) => ({
            id: r.id,
            tipo: (r.tipo as AgendaEventType) || "task",
            oraInizio: r.ora_inizio || "09:00",
            oraFine: r.ora_fine || "10:00",
            data: r.data,
            titolo: r.titolo || "",
            commessaCode: r.commessa_code,
            cliente: r.cliente,
            ordineCode: r.ordine_code,
            indirizzo: r.indirizzo,
            squadra: r.squadra,
            persone: r.persone || [],
            descrizione: r.descrizione,
            stato: r.stato,
            cmId: r.cm_id,
            taskId: r.task_id,
          }));
          setEvents(mapped);
        }
      } catch {
        // fallback silente: rimaniamo su MOCK
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const eventsOfDay = useMemo(() => {
    return events
      .filter((e) => e.data === selectedDate)
      .filter((e) => {
        if (e.tipo === "montaggio" && !filters.showMontaggi) return false;
        if (e.tipo === "sopralluogo" && !filters.showSopralluoghi) return false;
        if (e.tipo === "produzione" && !filters.showProduzioni) return false;
        if (e.tipo === "problema" && !filters.showProblemi) return false;
        if (!filters.showCompletate && e.stato === "completato") return false;
        if (filters.squadre.length > 0 && (!e.squadra || !filters.squadre.includes(e.squadra))) return false;
        if (filters.persone.length > 0 && (!e.persone || !e.persone.some((p) => filters.persone.includes(p)))) return false;
        return true;
      })
      .sort((a, b) => a.oraInizio.localeCompare(b.oraInizio));
  }, [events, selectedDate, filters]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {};
    for (const e of events) {
      if (!map[e.data]) map[e.data] = [];
      map[e.data].push(e);
    }
    return map;
  }, [events]);

  const addEvent = useCallback((e: AgendaEvent) => {
    setEvents((prev) => [...prev, e]);
  }, []);

  const updateEvent = useCallback((id: string, patch: Partial<AgendaEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const completeEvent = useCallback((id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, stato: "completato" } : e)));
  }, []);

  return {
    events,
    eventsOfDay,
    eventsByDate,
    loading,
    selectedDate,
    setSelectedDate,
    filters,
    setFilters,
    view,
    setView,
    addEvent,
    updateEvent,
    completeEvent,
  };
}
