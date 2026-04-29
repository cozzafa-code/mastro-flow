// hooks/useTeamMobile.ts
// FASE 5I - ottimizzato: single setState batch, skip polling, notify manual fetch
"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Operator, Team, TeamProblem, TimelineEvent, OperatorStatus } from "@/lib/types/team";
import { useTeamRealtime, notifyManualFetch } from "./useTeamRealtime";

const POLL_MS = 90_000;

function formatTimer(secs: number): string {
  if (!secs || secs < 0) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

function tempoTrascorso(fromIso: string | null): string {
  if (!fromIso) return "";
  const ms = Date.now() - new Date(fromIso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "ora";
  if (m < 60) return `${m}m fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function hhmmFromIso(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function deriveOperatorStatus(opId: string, montaggi: any[], anomalie: any[]): {
  status: OperatorStatus;
  current_job?: string; commessa_id?: string; commessa_code?: string; cliente?: string;
  position_label?: string; timer_label?: string; progress?: number;
  problem_title?: string; problem_reported_ago?: string;
} {
  const anomaly = anomalie.find(a => a.operatore_id === opId && a.stato !== "risolta");
  if (anomaly) {
    const linkedM = montaggi.find(m => m.commessa_id === anomaly.commessa_id);
    return {
      status: "problema",
      problem_title: anomaly.titolo || anomaly.descrizione || "Problema aperto",
      problem_reported_ago: tempoTrascorso(anomaly.rilevata_at),
      commessa_id: anomaly.commessa_id || undefined,
      commessa_code: linkedM?.commessa_code || undefined,
      cliente: linkedM?.cliente || undefined,
    };
  }

  const oggiNonChiusi = montaggi.filter(m => {
    if (!isToday(m.data_montaggio)) return false;
    if (m.completato_at) return false;
    const inSingolo = m.operatore_id === opId;
    const inSquadra = Array.isArray(m.squadra) && m.squadra.includes(opId);
    return inSingolo || inSquadra;
  });

  const inCorso = oggiNonChiusi.find(m => m.stato === "in_corso");
  if (inCorso) {
    const orePrev = Number(inCorso.ore_preventivate) || 0;
    const secs = Number(inCorso.timer_secondi) || 0;
    const progress = orePrev > 0 ? Math.min(100, Math.round((secs / (orePrev * 3600)) * 100)) : undefined;
    const isPausa = !!inCorso.motivo_pausa;
    return {
      status: isPausa ? "pausa" : "attivo",
      current_job: inCorso.commessa_code ? `Montaggio ${inCorso.commessa_code}` : "Montaggio",
      commessa_id: inCorso.commessa_id || undefined,
      commessa_code: inCorso.commessa_code || undefined,
      cliente: inCorso.cliente || inCorso.cliente_cognome || undefined,
      position_label: inCorso.indirizzo || undefined,
      timer_label: isPausa
        ? (inCorso.motivo_pausa ? `Pausa: ${inCorso.motivo_pausa}` : "In pausa")
        : (secs > 0 ? formatTimer(secs) : tempoTrascorso(inCorso.avviato_at)),
      progress,
    };
  }

  const programmato = oggiNonChiusi.find(m => m.stato === "programmato");
  if (programmato) {
    return {
      status: "viaggio",
      current_job: programmato.commessa_code ? `Programmato ${programmato.commessa_code}` : "Programmato oggi",
      commessa_id: programmato.commessa_id || undefined,
      commessa_code: programmato.commessa_code || undefined,
      cliente: programmato.cliente || programmato.cliente_cognome || undefined,
      position_label: programmato.indirizzo || undefined,
      timer_label: programmato.ora_inizio ? `Inizio ${programmato.ora_inizio.slice(0,5)}` : undefined,
    };
  }

  return { status: "offline" };
}

interface TeamData {
  operators: Operator[];
  teams: Team[];
  problems: TeamProblem[];
  eventiByOp: Record<string, TimelineEvent[]>;
}

const EMPTY_DATA: TeamData = { operators: [], teams: [], problems: [], eventiByOp: {} };

export function useTeamMobile() {
  // FASE 5I: single state object per evitare 4 setState consecutivi
  const [data, setData] = useState<TeamData>(EMPTY_DATA);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aziendaId, setAziendaId] = useState<string | null>(null);
  // Flag ref per skip polling se fetch in corso
  const fetchingRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (alive) { setLoading(false); setError("not_authenticated"); } return; }
        const { data: prof } = await supabase
          .from("profili").select("azienda_id").eq("id", user.id).maybeSingle();
        if (!alive) return;
        if (prof?.azienda_id) setAziendaId(prof.azienda_id);
        else setError("no_azienda");
      } catch (e: any) {
        if (alive) setError(e?.message || "auth_error");
      }
    })();
    return () => { alive = false; };
  }, []);

  const fetchAll = useCallback(async () => {
    if (!aziendaId) return;
    if (fetchingRef.current) return; // evita fetch sovrapposti
    fetchingRef.current = true;
    notifyManualFetch(); // segnala al realtime di entrare in cooldown
    try {
      setError(null);

      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      // Fetch parallelo (5 query in parallelo invece che sequenziali)
      const [opsRes, mRes, anomRes, sqRes, sqMembriRes, eventiRes] = await Promise.all([
        supabase.from("operatori")
          .select("id, nome, cognome, ruolo, telefono, avatar_url, colore, attivo")
          .eq("azienda_id", aziendaId).eq("attivo", true).neq("ruolo", "titolare")
          .order("nome"),
        supabase.from("montaggi")
          .select(`id, commessa_id, operatore_id, data_montaggio, stato, avviato_at, completato_at,
                   motivo_pausa, timer_secondi, squadra, ore_preventivate, ora_inizio,
                   commesse:commessa_id (code, cliente, cognome, indirizzo)`)
          .eq("azienda_id", aziendaId)
          .gte("data_montaggio", yesterday.toISOString().slice(0, 10))
          .order("avviato_at", { ascending: false, nullsFirst: false }),
        supabase.from("anomalie")
          .select("id, operatore_id, commessa_id, titolo, descrizione, stato, severita, rilevata_at")
          .eq("azienda_id", aziendaId).neq("stato", "risolta")
          .order("rilevata_at", { ascending: false }),
        supabase.from("squadre")
          .select("id, nome, descrizione, capo_squadra_id, zona, specializzazione, colore, attiva")
          .eq("azienda_id", aziendaId).order("nome"),
        supabase.from("squadre_membri")
          .select("squadra_id, team_id, ruolo_in_squadra")
          .is("data_uscita", null),
        supabase.from("operatore_eventi_stato")
          .select("id, operatore_id, evento, stato_da, stato_a, motivo, note, creato_at, commessa_id, montaggio_id")
          .eq("azienda_id", aziendaId)
          .gte("creato_at", todayStart.toISOString())
          .order("creato_at", { ascending: true }),
      ]);

      if (opsRes.error) throw opsRes.error;
      if (mRes.error) throw mRes.error;

      const opsRows = opsRes.data || [];
      const montaggi = (mRes.data || []).map((m: any) => ({
        ...m,
        commessa_code: m.commesse?.code || null,
        cliente: m.commesse?.cliente || null,
        cliente_cognome: m.commesse?.cognome || null,
        indirizzo: m.commesse?.indirizzo || null,
      }));
      const anomRows = anomRes.data || [];
      const sqRows = sqRes.data || [];
      const sqMembri = sqMembriRes.data || [];
      const eventiRows = eventiRes.data || [];

      // Build operators
      const ops: Operator[] = opsRows.map((o: any) => {
        const fullName = [o.nome, o.cognome].filter(Boolean).join(" ");
        const derived = deriveOperatorStatus(o.id, montaggi, anomRows);
        return {
          id: o.id, name: fullName || "Operatore",
          avatar_url: o.avatar_url || undefined,
          status: derived.status, phone: o.telefono || undefined,
          ...derived,
        };
      });

      // Build timeline
      const tl: Record<string, TimelineEvent[]> = {};
      eventiRows.forEach((e: any) => {
        const opId = e.operatore_id as string;
        if (!opId) return;
        const linkedM = montaggi.find(m => m.id === e.montaggio_id);
        const commessaCode = linkedM?.commessa_code || null;
        let type: TimelineEvent["type"] = "ripresa";
        let label = "";
        switch (e.evento) {
          case "avvio": type = "inizio_lavoro"; label = commessaCode ? `Avviato montaggio ${commessaCode}` : "Avviato lavoro"; break;
          case "pausa": type = "pausa"; label = e.motivo ? `Pausa: ${e.motivo}` : "Pausa"; break;
          case "riprende": type = "ripresa"; label = "Ripreso il lavoro"; break;
          case "stop": type = "ripresa"; label = commessaCode ? `Completato ${commessaCode}` : "Lavoro completato"; break;
          default: type = "ripresa"; label = e.note || e.evento;
        }
        const time = hhmmFromIso(e.creato_at);
        if (!tl[opId]) tl[opId] = [];
        tl[opId].push({ id: e.id, operator_id: opId, time, type, label, detail: e.note || undefined });
      });
      anomRows.forEach((a: any) => {
        if (!a.operatore_id || !isToday(a.rilevata_at)) return;
        const opId = a.operatore_id as string;
        if (!tl[opId]) tl[opId] = [];
        tl[opId].push({
          id: `anom-${a.id}`, operator_id: opId,
          time: hhmmFromIso(a.rilevata_at),
          type: "pausa",
          label: `Problema: ${a.titolo || a.descrizione || "segnalazione"}`,
        });
      });
      Object.keys(tl).forEach(k => { tl[k].sort((x, y) => x.time.localeCompare(y.time)); });

      // Build teams
      const tms: Team[] = sqRows.map((sq: any) => {
        const memberIds = sqMembri.filter((sm: any) => sm.squadra_id === sq.id).map((sm: any) => sm.team_id);
        const memberOps = ops.filter(o => memberIds.includes(o.id));
        const active = memberOps.filter(o => o.status === "attivo" || o.status === "pausa" || o.status === "viaggio").length;
        const probl = memberOps.filter(o => o.status === "problema").length;
        const progValues = memberOps.map(o => o.progress || 0).filter(p => p > 0);
        const avgProg = progValues.length ? Math.round(progValues.reduce((a, b) => a + b, 0) / progValues.length) : 0;
        return {
          id: sq.id, name: sq.nome,
          members: memberOps.map(o => o.name),
          member_ids: memberIds,
          current_job: sq.descrizione || sq.specializzazione || sq.zona || undefined,
          status_label: probl > 0 ? `${probl} problema` : `${active} attivi`,
          problem_count: probl, active_count: active, progress: avgProg,
        };
      });

      // Build problems
      const probs: TeamProblem[] = anomRows.map((a: any) => {
        const linkedM = montaggi.find(m => m.commessa_id === a.commessa_id);
        const reporterOp = ops.find(o => o.id === a.operatore_id);
        const sev = (a.severita || "media").toLowerCase();
        const priority: TeamProblem["priority"] =
          sev === "alta" || sev === "critica" ? "Alta" :
          sev === "bassa" ? "Bassa" : "Media";
        return {
          id: a.id, title: a.titolo || a.descrizione || "Problema",
          commessa_id: a.commessa_id || undefined,
          commessa_label: linkedM?.commessa_code ? `${linkedM.commessa_code}${linkedM.cliente ? ` · ${linkedM.cliente}` : ""}` : undefined,
          ordine_label: undefined,
          reported_by: reporterOp?.name || "Operatore",
          reported_at: a.rilevata_at,
          reported_ago: tempoTrascorso(a.rilevata_at),
          priority, status: a.stato === "risolta" ? "risolto" : "aperto",
        };
      });

      // SINGLE setState (vs 4 separati)
      setData({ operators: ops, teams: tms, problems: probs, eventiByOp: tl });
    } catch (e: any) {
      setError(e?.message || "fetch_error");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
      notifyManualFetch(); // re-update timestamp post-fetch per cooldown realtime
    }
  }, [aziendaId]);

  useEffect(() => {
    if (!aziendaId) return;
    fetchAll();
    const t = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(t);
  }, [aziendaId, fetchAll]);

  useTeamRealtime(aziendaId, fetchAll);

  // Memo per stats (era ricalcolato a ogni render del componente consumer)
  const stats = useMemo(() => ({
    attivi:  data.operators.filter(o => o.status === "attivo").length,
    pausa:   data.operators.filter(o => o.status === "pausa").length,
    probl:   data.operators.filter(o => o.status === "problema").length,
    offline: data.operators.filter(o => o.status === "offline").length,
    total:   data.operators.length,
  }), [data.operators]);

  // getTimelineFor stable
  const getTimelineFor = useCallback((id: string): TimelineEvent[] => {
    return data.eventiByOp[id] || [];
  }, [data.eventiByOp]);

  return {
    operators: data.operators,
    teams: data.teams,
    problems: data.problems,
    stats,
    getTimelineFor,
    loading, error,
    refetch: fetchAll,
  };
}
