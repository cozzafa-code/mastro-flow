// hooks/useTeamMobile.ts
// FASE 1 — Lettura dati REALI da Supabase. Niente mock.
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Operator, Team, TeamProblem, TimelineEvent, OperatorStatus } from "@/lib/types/team";

const POLL_MS = 30_000;

// ===== Helpers =====
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
  const d = Math.floor(h / 24);
  return `${d}g fa`;
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

// Deriva lo stato visivo dell'operatore dai suoi montaggi di oggi
function deriveOperatorStatus(opId: string, montaggi: any[], anomalie: any[]): {
  status: OperatorStatus;
  current_job?: string;
  commessa_id?: string;
  commessa_code?: string;
  cliente?: string;
  position_label?: string;
  timer_label?: string;
  progress?: number;
  problem_title?: string;
  problem_reported_ago?: string;
} {
  // Anomalia aperta → priorità massima: problema
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

  // Cerca montaggio "live" (oggi, non completato) dove operatore è singolo o in squadra
  const oggiNonChiusi = montaggi.filter(m => {
    if (!isToday(m.data_montaggio)) return false;
    if (m.completato_at) return false;
    const inSingolo = m.operatore_id === opId;
    const inSquadra = Array.isArray(m.squadra) && m.squadra.includes(opId);
    return inSingolo || inSquadra;
  });

  // Priorità: in_corso > programmato
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

  // Niente di oggi → offline
  return { status: "offline" };
}

export function useTeamMobile() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [problems, setProblems] = useState<TeamProblem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aziendaId, setAziendaId] = useState<string | null>(null);

  // Risolve azienda_id dell'utente loggato (via profili)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (alive) { setLoading(false); setError("not_authenticated"); } return; }
        const { data: prof } = await supabase
          .from("profili")
          .select("azienda_id")
          .eq("id", user.id)
          .maybeSingle();
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
    try {
      setError(null);
      // 1) Operatori attivi (escludi titolare per non comparire come "operatore lavoratore")
      const { data: opsRows, error: opsErr } = await supabase
        .from("operatori")
        .select("id, nome, cognome, ruolo, telefono, avatar_url, colore, attivo")
        .eq("azienda_id", aziendaId)
        .eq("attivo", true)
        .neq("ruolo", "titolare")
        .order("nome");
      if (opsErr) throw opsErr;

      // 2) Montaggi recenti (oggi + ieri per sicurezza)
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const { data: mRows, error: mErr } = await supabase
        .from("montaggi")
        .select(`id, commessa_id, operatore_id, data_montaggio, stato, avviato_at, completato_at,
                 motivo_pausa, timer_secondi, squadra, ore_preventivate, ora_inizio,
                 commesse:commessa_id (code, cliente, cognome, indirizzo)`)
        .eq("azienda_id", aziendaId)
        .gte("data_montaggio", yesterday.toISOString().slice(0, 10))
        .order("avviato_at", { ascending: false, nullsFirst: false });
      if (mErr) throw mErr;

      // Flatten join commesse
      const montaggi = (mRows || []).map((m: any) => ({
        ...m,
        commessa_code: m.commesse?.code || null,
        cliente: m.commesse?.cliente || null,
        cliente_cognome: m.commesse?.cognome || null,
        indirizzo: m.commesse?.indirizzo || null,
      }));

      // 3) Anomalie aperte (per derivare problemi)
      const { data: anomRows } = await supabase
        .from("anomalie")
        .select("id, operatore_id, commessa_id, titolo, descrizione, stato, severita, rilevata_at")
        .eq("azienda_id", aziendaId)
        .neq("stato", "risolta")
        .order("rilevata_at", { ascending: false });

      // 4) Squadre
      const { data: sqRows } = await supabase
        .from("squadre")
        .select("id, nome, descrizione")
        .eq("azienda_id", aziendaId);

      const { data: sqMembri } = await supabase
        .from("squadre_membri")
        .select("squadra_id, operatore_id");

      // ===== BUILD OPERATORS =====
      const ops: Operator[] = (opsRows || []).map((o: any) => {
        const fullName = [o.nome, o.cognome].filter(Boolean).join(" ");
        const derived = deriveOperatorStatus(o.id, montaggi, anomRows || []);
        return {
          id: o.id,
          name: fullName || "Operatore",
          avatar_url: o.avatar_url || undefined,
          status: derived.status,
          phone: o.telefono || undefined,
          ...derived,
        };
      });
      setOperators(ops);

      // ===== BUILD TEAMS =====
      const tms: Team[] = (sqRows || []).map((sq: any) => {
        const memberIds = (sqMembri || []).filter((sm: any) => sm.squadra_id === sq.id).map((sm: any) => sm.operatore_id);
        const memberOps = ops.filter(o => memberIds.includes(o.id));
        const active = memberOps.filter(o => o.status === "attivo" || o.status === "pausa" || o.status === "viaggio").length;
        const probl = memberOps.filter(o => o.status === "problema").length;
        const progValues = memberOps.map(o => o.progress || 0).filter(p => p > 0);
        const avgProg = progValues.length ? Math.round(progValues.reduce((a, b) => a + b, 0) / progValues.length) : 0;
        return {
          id: sq.id,
          name: sq.nome,
          members: memberOps.map(o => o.name),
          member_ids: memberIds,
          current_job: sq.descrizione || undefined,
          status_label: probl > 0 ? `${probl} problema` : `${active} attivi`,
          problem_count: probl,
          active_count: active,
          progress: avgProg,
        };
      });
      setTeams(tms);

      // ===== BUILD PROBLEMS =====
      const probs: TeamProblem[] = (anomRows || []).map((a: any) => {
        const linkedM = montaggi.find(m => m.commessa_id === a.commessa_id);
        const reporterOp = ops.find(o => o.id === a.operatore_id);
        const sev = (a.severita || "media").toLowerCase();
        const priority: TeamProblem["priority"] =
          sev === "alta" || sev === "critica" ? "Alta" :
          sev === "bassa" ? "Bassa" : "Media";
        return {
          id: a.id,
          title: a.titolo || a.descrizione || "Problema",
          commessa_id: a.commessa_id || undefined,
          commessa_label: linkedM?.commessa_code ? `${linkedM.commessa_code}${linkedM.cliente ? ` · ${linkedM.cliente}` : ""}` : undefined,
          ordine_label: undefined,
          reported_by: reporterOp?.name || "Operatore",
          reported_at: a.rilevata_at,
          reported_ago: tempoTrascorso(a.rilevata_at),
          priority,
          status: a.stato === "risolta" ? "risolto" : "aperto",
        };
      });
      setProblems(probs);
    } catch (e: any) {
      setError(e?.message || "fetch_error");
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  // Iniziale + polling
  useEffect(() => {
    if (!aziendaId) return;
    fetchAll();
    const t = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(t);
  }, [aziendaId, fetchAll]);

  const stats = useMemo(() => ({
    attivi:  operators.filter(o => o.status === "attivo").length,
    pausa:   operators.filter(o => o.status === "pausa").length,
    probl:   operators.filter(o => o.status === "problema").length,
    offline: operators.filter(o => o.status === "offline").length,
    total:   operators.length,
  }), [operators]);

  // Timeline derivata da montaggi recenti (solo eventi base, FASE 1)
  // FASE 4 sostituiremo con timeline reale da log/eventi.
  const getTimelineFor = useCallback((id: string): TimelineEvent[] => {
    // FASE 1: timeline placeholder (la logica eventi richiede tabella eventi che e' praticamente vuota)
    // Solo eventi derivabili da montaggi
    return [];
  }, []);

  return { operators, teams, problems, stats, getTimelineFor, loading, error, refetch: fetchAll };
}
