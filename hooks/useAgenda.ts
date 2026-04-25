"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type EventoTipo = "sopralluogo" | "montaggio" | "produzione" | "ordine" | "problema";
export type EventoStato = "programmato" | "in_corso" | "completato" | "urgente" | "da_gestire";

export interface AgendaEvento {
  id: string;
  azienda_id: string;
  user_id: string;
  tipo: EventoTipo;
  cm_id: string | null;
  cliente: string | null;
  titolo: string;
  luogo: string | null;
  giorno: string;            // YYYY-MM-DD
  ora_inizio: string;        // HH:MM:SS
  ora_fine: string;
  operatore_id: string | null;
  operatore_nome: string | null;
  stato: EventoStato;
  note: string | null;
  importo_eur: number | null;
}

export interface KpiAlert {
  ritardi: number;
  urgenze: number;
  eur_a_rischio: number;
}

export interface KpiGiorno {
  sopralluoghi: number;
  montaggi: number;
  produzioni: number;
  ordini: number;
  problemi: number;
  ritardi: number;
  urgenze: number;
  fatturato_eur: number;
  totale: number;
}

interface UseAgendaResult {
  loading: boolean;
  eventi: AgendaEvento[];
  kpiAlert: KpiAlert;
  kpiOggi: KpiGiorno;
  setRange: (da: string, a: string) => void;
  rangeDa: string;
  rangeA: string;
  refetch: () => Promise<void>;
  spostaEvento: (eventoId: string, giorno: string, oraInizio?: string) => Promise<boolean>;
  cambiaStato: (eventoId: string, stato: EventoStato) => Promise<boolean>;
  creaEvento: (input: Partial<AgendaEvento>) => Promise<AgendaEvento | null>;
}

const ZERO_KPI: KpiAlert = { ritardi: 0, urgenze: 0, eur_a_rischio: 0 };
const ZERO_GIORNO: KpiGiorno = { sopralluoghi: 0, montaggi: 0, produzioni: 0, ordini: 0, problemi: 0, ritardi: 0, urgenze: 0, fatturato_eur: 0, totale: 0 };

function isoDate(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function useAgenda(initialDa?: string, initialA?: string): UseAgendaResult {
  const oggi = useMemo(() => isoDate(new Date()), []);
  const [rangeDa, setRangeDa] = useState(initialDa ?? oggi);
  const [rangeA, setRangeA] = useState(() => {
    if (initialA) return initialA;
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return isoDate(d);
  });

  const [loading, setLoading] = useState(true);
  const [eventi, setEventi] = useState<AgendaEvento[]>([]);
  const [kpiAlert, setKpiAlert] = useState<KpiAlert>(ZERO_KPI);
  const [kpiOggi, setKpiOggi] = useState<KpiGiorno>(ZERO_GIORNO);

  const fetchAll = useCallback(async () => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) { setEventi([]); setLoading(false); return; }

      const opRes = await supabase.from("operatori").select("azienda_id").eq("user_id", user.id).maybeSingle();
      const azienda_id = opRes.data?.azienda_id;
      if (!azienda_id) { setEventi([]); setLoading(false); return; }

      const evReq = supabase.from("agenda_eventi").select("*")
        .eq("azienda_id", azienda_id)
        .gte("giorno", rangeDa).lte("giorno", rangeA)
        .order("giorno", { ascending: true })
        .order("ora_inizio", { ascending: true });

      const alertReq = supabase.rpc("agenda_kpi_alert", { p_azienda_id: azienda_id });
      const oggiReq = supabase.rpc("agenda_kpi_giorno", { p_azienda_id: azienda_id, p_giorno: oggi });

      const [eRes, aRes, oRes] = await Promise.all([evReq, alertReq, oggiReq]);
      if (eRes.error) console.error("[agenda eventi]", eRes.error);
      if (aRes.error) console.error("[agenda alert]", aRes.error);
      if (oRes.error) console.error("[agenda oggi]", oRes.error);

      setEventi((eRes.data ?? []) as AgendaEvento[]);
      setKpiAlert((aRes.data ?? ZERO_KPI) as KpiAlert);
      setKpiOggi((oRes.data ?? ZERO_GIORNO) as KpiGiorno);
    } catch (e) {
      console.error("[useAgenda]", e);
    } finally {
      setLoading(false);
    }
  }, [rangeDa, rangeA, oggi]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime
  useEffect(() => {
    let cancelled = false;
    let ch: any = null;
    (async () => {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user || cancelled) return;
      const opRes = await supabase.from("operatori").select("azienda_id").eq("user_id", user.id).maybeSingle();
      const azienda_id = opRes.data?.azienda_id;
      if (!azienda_id) return;
      ch = supabase.channel("agenda-realtime")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "agenda_eventi", filter: `azienda_id=eq.${azienda_id}` },
          () => fetchAll())
        .subscribe();
    })();
    return () => { cancelled = true; if (ch) supabase.removeChannel(ch); };
  }, [fetchAll]);

  const setRange = useCallback((da: string, a: string) => {
    setRangeDa(da); setRangeA(a);
  }, []);

  const spostaEvento = useCallback(async (eventoId: string, giorno: string, oraInizio?: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("agenda_sposta_evento", {
      p_evento_id: eventoId, p_giorno: giorno, p_ora_inizio: oraInizio ?? null,
    });
    if (error) { console.error("[spostaEvento]", error); return false; }
    fetchAll();
    return (data as any)?.ok === true;
  }, [fetchAll]);

  const cambiaStato = useCallback(async (eventoId: string, stato: EventoStato): Promise<boolean> => {
    const { data, error } = await supabase.rpc("agenda_cambia_stato", {
      p_evento_id: eventoId, p_stato: stato,
    });
    if (error) { console.error("[cambiaStato]", error); return false; }
    fetchAll();
    return (data as any)?.ok === true;
  }, [fetchAll]);

  const creaEvento = useCallback(async (input: Partial<AgendaEvento>): Promise<AgendaEvento | null> => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) return null;
      const opRes = await supabase.from("operatori").select("azienda_id").eq("user_id", user.id).maybeSingle();
      const azienda_id = opRes.data?.azienda_id;
      if (!azienda_id) return null;
      const { data, error } = await supabase.from("agenda_eventi").insert({
        azienda_id, user_id: user.id,
        tipo: input.tipo ?? "sopralluogo",
        titolo: input.titolo ?? "Nuovo evento",
        cliente: input.cliente ?? null,
        luogo: input.luogo ?? null,
        giorno: input.giorno ?? isoDate(new Date()),
        ora_inizio: input.ora_inizio ?? "09:00",
        ora_fine: input.ora_fine ?? "10:00",
        operatore_nome: input.operatore_nome ?? null,
        stato: input.stato ?? "programmato",
        importo_eur: input.importo_eur ?? null,
        cm_id: input.cm_id ?? null,
        note: input.note ?? null,
      }).select("*").single();
      if (error) { console.error("[creaEvento]", error); return null; }
      fetchAll();
      return data as AgendaEvento;
    } catch (e) { console.error("[creaEvento] catch", e); return null; }
  }, [fetchAll]);

  return { loading, eventi, kpiAlert, kpiOggi, setRange, rangeDa, rangeA, refetch: fetchAll, spostaEvento, cambiaStato, creaEvento };
}

export const TIPO_COLORE: Record<EventoTipo, { bg: string; fg: string; gradient: string }> = {
  sopralluogo: { bg: "rgba(127,119,221,0.15)", fg: "#7F77DD", gradient: "linear-gradient(145deg, #B5B0EE, #7F77DD)" },
  montaggio:   { bg: "rgba(29,158,117,0.15)",  fg: "#1D9E75", gradient: "linear-gradient(145deg, #5DCAA5, #1D9E75)" },
  produzione:  { bg: "rgba(55,138,221,0.15)",  fg: "#378ADD", gradient: "linear-gradient(145deg, #85B7EB, #378ADD)" },
  ordine:      { bg: "rgba(239,159,39,0.15)",  fg: "#EF9F27", gradient: "linear-gradient(145deg, #FAC775, #EF9F27)" },
  problema:    { bg: "rgba(220,68,68,0.15)",   fg: "#DC4444", gradient: "linear-gradient(145deg, #FF6464, #DC4444)" },
};

export const STATO_LABEL: Record<EventoStato, string> = {
  programmato: "PROGRAMMATO",
  in_corso: "IN CORSO",
  completato: "COMPLETATO",
  urgente: "URGENTE",
  da_gestire: "DA GESTIRE",
};

export const STATO_BADGE: Record<EventoStato, { bg: string; fg: string }> = {
  programmato: { bg: "rgba(40,160,160,0.15)", fg: "#1E8080" },
  in_corso:    { bg: "linear-gradient(145deg, #28A0A0, #1E8080)", fg: "#fff" },
  completato:  { bg: "rgba(29,158,117,0.15)", fg: "#04342C" },
  urgente:     { bg: "linear-gradient(145deg, #FF6464, #DC4444)", fg: "#fff" },
  da_gestire:  { bg: "rgba(220,68,68,0.18)", fg: "#7F1D1D" },
};
