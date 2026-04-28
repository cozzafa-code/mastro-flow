// hooks/useAgendaMobile.ts
"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { AgendaEvent, AgendaFilters, AgendaEventType } from "../lib/types/agenda";

const TODAY = new Date().toISOString().split("T")[0];

const MOCK_EVENTS: AgendaEvent[] = [
  { id: "ev_mock_1", tipo: "montaggio",   oraInizio: "08:30", oraFine: "13:00", data: TODAY, titolo: "Montaggio infissi", commessaCode: "S-0003", cliente: "Rossi",   indirizzo: "Via Roma 12, Milano", squadra: "Squadra 2", persone: ["Marco","Luca"], descrizione: "Montaggio 5 infissi PVC + 2 scorrevoli", stato: "conferma" },
  { id: "ev_mock_2", tipo: "sopralluogo", oraInizio: "10:30", oraFine: "11:30", data: TODAY, titolo: "Sopralluogo",        cliente: "Bianchi Showroom", indirizzo: "Via Verdi 45, Monza" },
  { id: "ev_mock_3", tipo: "produzione",  oraInizio: "14:00", oraFine: "18:00", data: TODAY, titolo: "Produzione",         ordineCode: "9131G", descrizione: "6 pezzi · Finestre PVC", stato: "in_produzione" },
  { id: "ev_mock_4", tipo: "problema",    oraInizio: "16:30", oraFine: "17:00", data: TODAY, titolo: "Vetro non arrivato", commessaCode: "S-0001", cliente: "Verdi" },
  // mock documentali
  { id: "ev_mock_5", tipo: "preventivo",  oraInizio: "00:00", oraFine: "00:00", data: TODAY, titolo: "Preventivo in attesa risposta", commessaCode: "S-0005", cliente: "Esposito", giorniDaInvio: 4, importo: 7500, isAllDay: true },
  { id: "ev_mock_6", tipo: "firma",       oraInizio: "00:00", oraFine: "00:00", data: TODAY, titolo: "Conferma da firmare", commessaCode: "S-0004", cliente: "Marini", isAllDay: true, stato: "urgente" },
  { id: "ev_mock_7", tipo: "saldo",       oraInizio: "00:00", oraFine: "00:00", data: TODAY, titolo: "Saldo in scadenza", commessaCode: "S-0002", cliente: "Bianchi", giorniAllaScadenza: 7, importo: 3200, isAllDay: true },
];

const DEFAULT_FILTERS: AgendaFilters = {
  showMontaggi: true, showSopralluoghi: true, showProduzioni: true, showProblemi: true,
  showCompletate: false,
  showPreventivi: true, showFirme: true, showAcconti: true, showSaldi: true, showPagate: false,
  squadre: [], persone: [],
};

function diffDays(a: string, b: string): number {
  try {
    const d1 = new Date(a + (a.length === 10 ? "T00:00:00" : ""));
    const d2 = new Date(b + (b.length === 10 ? "T00:00:00" : ""));
    return Math.round((d2.getTime() - d1.getTime()) / 86400000);
  } catch { return 0; }
}

function commesseToEvents(cantieri: any[]): AgendaEvent[] {
  if (!Array.isArray(cantieri)) return [];
  const out: AgendaEvent[] = [];
  for (const c of cantieri) {
    const cliente = ((c.cliente || "") + (c.cognome ? " " + c.cognome : "")).trim();
    const code = c.code || c.codice || "";
    const indirizzo = c.indirizzo || "";
    const cmId = c.id;
    const fase = c.fase;

    // ===== EVENTI OPERATIVI =====
    const rilievi = Array.isArray(c.rilievi) ? c.rilievi : [];
    for (const r of rilievi) {
      if (!r?.data) continue;
      const ora = (r.ora && /\d{2}:\d{2}/.test(r.ora)) ? r.ora : "09:00";
      const [hh, mm] = ora.split(":").map(Number);
      const oraFine = `${String(Math.min(23, hh + 1)).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      out.push({
        id: `cm-${cmId}-r-${r.id || r.numero}`,
        tipo: "sopralluogo", oraInizio: ora, oraFine, data: r.data,
        titolo: "Sopralluogo", commessaCode: code, cliente, indirizzo, cmId,
        persone: r.rilevatore ? [r.rilevatore] : [],
      });
    }

    const montaggi = Array.isArray(c.montaggi) ? c.montaggi : (Array.isArray(c.assegnazioni) ? c.assegnazioni : []);
    for (const m of montaggi) {
      if (!m?.data) continue;
      const ora = (m.oraInizio && /\d{2}:\d{2}/.test(m.oraInizio)) ? m.oraInizio : "08:30";
      const oraFine = (m.oraFine && /\d{2}:\d{2}/.test(m.oraFine)) ? m.oraFine : "13:00";
      out.push({
        id: `cm-${cmId}-m-${m.id || ora}`,
        tipo: "montaggio", oraInizio: ora, oraFine, data: m.data,
        titolo: m.titolo || "Montaggio", commessaCode: code, cliente, indirizzo, cmId,
        squadra: m.squadra || "", persone: Array.isArray(m.persone) ? m.persone : [],
        stato: m.stato === "completato" ? "completato" : (m.stato === "in_corso" ? "in_corso" : "conferma"),
      });
    }

    if (fase === "ordini" || fase === "produzione") {
      out.push({
        id: `cm-${cmId}-prod`,
        tipo: "produzione", oraInizio: "09:00", oraFine: "17:00", data: TODAY,
        titolo: "Produzione", commessaCode: code, cliente, ordineCode: code,
        descrizione: rilievi[0]?.vani?.length ? `${rilievi[0].vani.length} pezzi` : "",
        cmId, stato: "in_produzione",
      });
    }

    // ===== EVENTI DOCUMENTALI =====
    // Preventivo inviato in attesa risposta
    const preventivoInviatoAt = c.preventivoInviatoAt || c.preventivo_inviato_at || c.dataPreventivoInvio;
    const haRisposta = !!c.risposta_cliente || !!c.tipoRisposta || !!c.firmaCliente || !!c.firma_cliente || !!c.firma_data;
    if (preventivoInviatoAt && !haRisposta && (fase === "preventivo" || !fase)) {
      const dataPrev = String(preventivoInviatoAt).split("T")[0];
      const giorni = Math.max(0, diffDays(dataPrev, TODAY));
      out.push({
        id: `cm-${cmId}-prev`,
        tipo: "preventivo", oraInizio: "00:00", oraFine: "00:00", data: TODAY,
        titolo: "Preventivo in attesa risposta", commessaCode: code, cliente, cmId,
        giorniDaInvio: giorni, isAllDay: true,
        stato: giorni >= 7 ? "urgente" : undefined,
      });
    }

    // Da firmare: cliente accettato + fase=conferma + non firmato
    const accettato = c.tipoRisposta === "accettato" || c.risposta_cliente === "accettato";
    const firmato = !!c.firmaCliente || !!c.firma_cliente || !!c.firma_data || !!c.firmaData;
    if (accettato && fase === "conferma" && !firmato) {
      out.push({
        id: `cm-${cmId}-firma`,
        tipo: "firma", oraInizio: "00:00", oraFine: "00:00", data: TODAY,
        titolo: "Conferma da firmare", commessaCode: code, cliente, cmId,
        isAllDay: true, stato: "urgente",
      });
    }

    // Acconto da fatturare: firmato ma nessuna fattura acconto/unica
    const fatture = Array.isArray(c.fattureDB) ? c.fattureDB : (Array.isArray(c.fatture) ? c.fatture : []);
    const haAccontoFatturato = fatture.some((f: any) => f.cmId === cmId && (f.tipo === "acconto" || f.tipo === "unica"));
    if (firmato && !haAccontoFatturato && (fase === "conferma" || fase === "ordini")) {
      out.push({
        id: `cm-${cmId}-acconto`,
        tipo: "acconto", oraInizio: "00:00", oraFine: "00:00", data: TODAY,
        titolo: "Acconto da fatturare", commessaCode: code, cliente, cmId,
        isAllDay: true,
      });
    }

    // Saldo in scadenza: fattura saldo emessa ma non pagata
    for (const f of fatture) {
      if (f.cmId !== cmId) continue;
      if ((f.tipo !== "saldo" && f.tipo !== "unica") || f.pagata) continue;
      const scadenza = f.scadenza || f.data_scadenza;
      if (!scadenza) continue;
      const giorni = diffDays(TODAY, String(scadenza).split("T")[0]);
      if (giorni > 30) continue; // mostra solo se entro 30gg
      out.push({
        id: `cm-${cmId}-saldo-${f.id || f.numero}`,
        tipo: "saldo", oraInizio: "00:00", oraFine: "00:00", data: TODAY,
        titolo: giorni < 0 ? "Saldo SCADUTO" : "Saldo in scadenza",
        commessaCode: code, cliente, cmId,
        giorniAllaScadenza: giorni, importo: f.importo || f.totale,
        isAllDay: true, stato: giorni < 0 ? "urgente" : undefined,
      });
    }

    // Pagata: opzionale, mostro solo se filtro attivo
    if (fase === "pagata" || fase === "chiusura") {
      out.push({
        id: `cm-${cmId}-pagata`,
        tipo: "pagata", oraInizio: "00:00", oraFine: "00:00", data: TODAY,
        titolo: "Commessa pagata", commessaCode: code, cliente, cmId,
        isAllDay: true,
      });
    }
  }
  return out;
}

export function useAgendaMobile(externalCantieri?: any[]) {
  const [internalEvents, setInternalEvents] = useState<AgendaEvent[]>(MOCK_EVENTS);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [filters, setFilters] = useState<AgendaFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"giorno" | "settimana" | "mese" | "problemi">("giorno");
  const [extraEvents, setExtraEvents] = useState<AgendaEvent[]>([]);

  const events = useMemo<AgendaEvent[]>(() => {
    if (Array.isArray(externalCantieri) && externalCantieri.length > 0) {
      return [...commesseToEvents(externalCantieri), ...extraEvents];
    }
    return [...internalEvents, ...extraEvents];
  }, [externalCantieri, extraEvents, internalEvents]);

  useEffect(() => {
    if (Array.isArray(externalCantieri) && externalCantieri.length > 0) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // @ts-ignore
        const mod = await import("../lib/supabase").catch(() => null);
        const supabase = mod?.supabase;
        if (!supabase) return;
        const { data, error } = await supabase
          .from("agenda_eventi").select("*").order("data", { ascending: true }).limit(200);
        if (!alive || error || !Array.isArray(data) || data.length === 0) return;
        setInternalEvents(data.map((r: any) => ({
          id: r.id, tipo: (r.tipo as AgendaEventType) || "task",
          oraInizio: r.ora_inizio || "09:00", oraFine: r.ora_fine || "10:00",
          data: r.data, titolo: r.titolo || "",
          commessaCode: r.commessa_code, cliente: r.cliente,
          ordineCode: r.ordine_code, indirizzo: r.indirizzo,
          squadra: r.squadra, persone: r.persone || [],
          descrizione: r.descrizione, stato: r.stato,
          cmId: r.cm_id, taskId: r.task_id,
        })));
      } catch { /* fallback */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [externalCantieri]);

  const passesFilter = useCallback((e: AgendaEvent): boolean => {
    if (e.tipo === "montaggio" && !filters.showMontaggi) return false;
    if (e.tipo === "sopralluogo" && !filters.showSopralluoghi) return false;
    if (e.tipo === "produzione" && !filters.showProduzioni) return false;
    if (e.tipo === "problema" && !filters.showProblemi) return false;
    if (e.tipo === "preventivo" && !filters.showPreventivi) return false;
    if (e.tipo === "firma" && !filters.showFirme) return false;
    if (e.tipo === "acconto" && !filters.showAcconti) return false;
    if (e.tipo === "saldo" && !filters.showSaldi) return false;
    if (e.tipo === "pagata" && !filters.showPagate) return false;
    if (!filters.showCompletate && e.stato === "completato") return false;
    if (filters.squadre.length > 0 && (!e.squadra || !filters.squadre.includes(e.squadra))) return false;
    if (filters.persone.length > 0 && (!e.persone || !e.persone.some((p) => filters.persone.includes(p)))) return false;
    return true;
  }, [filters]);

  const eventsOfDay = useMemo(() => events
    .filter((e) => e.data === selectedDate)
    .filter(passesFilter)
    // ordino: documentali (allDay) prima, poi per ora
    .sort((a, b) => {
      const aAllDay = a.isAllDay ? 0 : 1;
      const bAllDay = b.isAllDay ? 0 : 1;
      if (aAllDay !== bAllDay) return aAllDay - bAllDay;
      return a.oraInizio.localeCompare(b.oraInizio);
    }),
    [events, selectedDate, passesFilter]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {};
    for (const e of events) {
      if (!map[e.data]) map[e.data] = [];
      map[e.data].push(e);
    }
    return map;
  }, [events]);

  const addEvent = useCallback((e: AgendaEvent) => setExtraEvents((p) => [...p, e]), []);
  const updateEvent = useCallback((id: string, patch: Partial<AgendaEvent>) =>
    setExtraEvents((p) => p.map((e) => e.id === id ? { ...e, ...patch } : e)), []);
  const completeEvent = useCallback((id: string) => {
    setExtraEvents((p) => p.map((e) => e.id === id ? { ...e, stato: "completato" } : e));
    setInternalEvents((p) => p.map((e) => e.id === id ? { ...e, stato: "completato" } : e));
  }, []);

  return {
    events, eventsOfDay, eventsByDate, loading,
    selectedDate, setSelectedDate, filters, setFilters,
    view, setView, addEvent, updateEvent, completeEvent,
  };
}
