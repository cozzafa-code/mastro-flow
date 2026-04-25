"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  DayTask, DayEvento, DayEventoInsert, DayProssimoStep,
  DayStripItem, DayStats, DayModuloOrigine, DayCategoria,
} from "@/lib/types/day";


const STRIP_WINDOW_HOURS = 2;
const STRIP_MAX_ITEMS = 4;
const EVENTI_LIMIT = 50;

function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function nowMinusHours(h: number): string { return new Date(Date.now() - h * 3600 * 1000).toISOString(); }

export interface DayTaskCreateInput {
  titolo: string;
  categoria: DayCategoria;
  ora_inizio?: string | null;
  durata_min?: number | null;
  cm_id?: string | null;
  descrizione?: string | null;
  evento_match?: string | null;  // se settato, crea 1 sub-task auto-spunta
}

export type DayCreateResult =
  | { ok: true; task: DayTask }
  | { ok: false; error: string };

interface UseDayResult {
  loading: boolean;
  error: string | null;
  tasks: DayTask[];
  eventi: DayEvento[];
  strip: DayStripItem[];
  prossimoStep: DayProssimoStep | null;
  stats: DayStats;
  refetch: () => Promise<void>;
  logEvento: (e: DayEventoInsert) => Promise<DayEvento | null>;
  createTask: (input: DayTaskCreateInput) => Promise<DayCreateResult>;
  taskAction: (taskId: string, action: "start" | "pause" | "resume" | "extend15" | "fatto") => Promise<boolean>;
  backlogNuovi: number;
  completaTask: (taskId: string) => Promise<void>;
  segnaInCorso: (taskId: string) => Promise<void>;
  skipProssimo: () => void;
}

export function useDay(): UseDayResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<DayTask[]>([]);
  const [eventi, setEventi] = useState<DayEvento[]>([]);
  const [prossimoStep, setProssimoStep] = useState<DayProssimoStep | null>(null);
  const [skipUntilEventId, setSkipUntilEventId] = useState<string | null>(null);
  const [deepMinutiOggi, setDeepMinutiOggi] = useState<number>(0);
  const [backlogNuovi, setBacklogNuovi] = useState<number>(0);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) { setTasks([]); setEventi([]); setProssimoStep(null); setLoading(false); return; }

      const giorno = todayISO();
      const sinceISO = nowMinusHours(STRIP_WINDOW_HOURS);

      const tasksReq = supabase.from("day_tasks").select("*")
        .eq("user_id", user.id).eq("giorno", giorno)
        .order("ora_inizio", { ascending: true, nullsFirst: false })
        .order("ordine", { ascending: true });

      const eventiReq = supabase.from("day_eventi").select("*")
        .eq("user_id", user.id).gte("created_at", sinceISO)
        .order("created_at", { ascending: false }).limit(EVENTI_LIMIT);

      const prossimoReq = supabase.rpc("day_prossimo_step", { p_user_id: user.id });
      const deepReq = supabase.rpc("day_deep_minuti_oggi", { p_user_id: user.id });
      const backlogReq = supabase.rpc("day_backlog_count_nuovi", { p_user_id: user.id });

      const [tRes, eRes, pRes, dRes, bRes] = await Promise.all([tasksReq, eventiReq, prossimoReq, deepReq, backlogReq]);
      if (tRes.error) throw tRes.error;
      if (eRes.error) throw eRes.error;
      if (pRes.error) throw pRes.error;

      setTasks((tRes.data ?? []) as DayTask[]);
      setEventi((eRes.data ?? []) as DayEvento[]);
      setProssimoStep((pRes.data ?? null) as DayProssimoStep | null);
      setDeepMinutiOggi(typeof dRes.data === "number" ? dRes.data : 0);
      setBacklogNuovi(typeof bRes.data === "number" ? bRes.data : 0);
    } catch (e: any) {
      console.error("[useDay] fetch error", e);
      setError(e?.message ?? "Errore caricamento Day");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    let channelRef: any = null;
    (async () => {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user || cancelled) return;
      channelRef = supabase.channel("day-realtime")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "day_eventi", filter: `user_id=eq.${user.id}` },
          () => fetchAll())
        .on("postgres_changes",
          { event: "*", schema: "public", table: "day_tasks", filter: `user_id=eq.${user.id}` },
          () => fetchAll())
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, [fetchAll]);

  const getAziendaId = useCallback(async (userId: string): Promise<string | null> => {
    const opRes = await supabase.from("operatori").select("azienda_id")
      .eq("user_id", userId).maybeSingle();
    return opRes.data?.azienda_id ?? null;
  }, []);

  const logEvento = useCallback(async (input: DayEventoInsert): Promise<DayEvento | null> => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) return null;
      const azienda_id = await getAziendaId(user.id);
      if (!azienda_id) { console.warn("[logEvento] no operatore"); return null; }
      const row = {
        azienda_id, user_id: user.id,
        tipo: input.tipo, modulo_origine: input.modulo_origine,
        direzione: input.direzione ?? "uscita",
        cm_id: input.cm_id ?? null, task_id: input.task_id ?? null,
        payload: input.payload ?? {}, durata_sec: input.durata_sec ?? null,
        titolo_breve: input.titolo_breve, contesto: input.contesto ?? null,
      };
      const { data, error: insErr } = await supabase.from("day_eventi")
        .insert(row).select("*").single();
      if (insErr) { console.error("[logEvento] insert", insErr); return null; }
      return data as DayEvento;
    } catch (e) { console.error("[logEvento] catch", e); return null; }
  }, [getAziendaId]);

  // === createTask con error handling pulito ===
  const createTask = useCallback(async (input: DayTaskCreateInput): Promise<DayCreateResult> => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) {
        return { ok: false, error: "Non sei loggato. Riapri MASTRO." };
      }
      const azienda_id = await getAziendaId(user.id);
      if (!azienda_id) {
        return { ok: false, error: "Operatore non collegato a nessuna azienda." };
      }

      const oraFine = (() => {
        if (!input.ora_inizio || !input.durata_min) return null;
        const [h, m] = input.ora_inizio.split(":").map((n) => parseInt(n, 10));
        const totalMin = h * 60 + m + input.durata_min;
        const fh = Math.floor((totalMin / 60) % 24);
        const fm = totalMin % 60;
        return `${String(fh).padStart(2, "0")}:${String(fm).padStart(2, "0")}:00`;
      })();

      // se l'utente ha indicato un evento_match, seedo 1 sub-task auto-spunta
      const sottoTaskSeed = input.evento_match
        ? [{
            id: `auto_${Date.now()}`,
            testo: `Auto-spunta su: ${input.evento_match}`,
            done: false,
            evento_match: input.evento_match,
          }]
        : [];

      const row = {
        azienda_id,
        user_id: user.id,
        titolo: input.titolo,
        descrizione: input.descrizione ?? null,
        categoria: input.categoria,
        giorno: todayISO(),
        ora_inizio: input.ora_inizio ? `${input.ora_inizio}:00` : null,
        ora_fine: oraFine,
        durata_min: input.durata_min ?? null,
        energia: 2,
        stato: "pianificato" as const,
        cm_id: input.cm_id ?? null,
        sotto_task: sottoTaskSeed,
        ordine: 0,
      };
      const { data, error: insErr } = await supabase.from("day_tasks")
        .insert(row).select("*").single();
      if (insErr) {
        console.error("[createTask] insert error", insErr);
        return { ok: false, error: insErr.message ?? "Errore inserimento task" };
      }
      // refetch immediato (il realtime potrebbe tardare)
      fetchAll();
      return { ok: true, task: data as DayTask };
    } catch (e: any) {
      console.error("[createTask] catch", e);
      return { ok: false, error: e?.message ?? "Errore imprevisto" };
    }
  }, [getAziendaId, fetchAll]);

  const taskAction = useCallback(async (
    taskId: string,
    action: "start" | "pause" | "resume" | "extend15" | "fatto"
  ): Promise<boolean> => {
    try {
      const { data, error: rpcErr } = await supabase.rpc("day_task_action", {
        p_task_id: taskId,
        p_action: action,
      });
      if (rpcErr) {
        console.error("[taskAction]", rpcErr);
        return false;
      }
      const ok = (data as any)?.ok === true;
      if (ok) {
        // refetch immediato
        await fetchAll();
        // log evento se completato
        if (action === "fatto") {
          await logEvento({
            tipo: "task_completato",
            modulo_origine: "ops",
            titolo_breve: "Task completato",
          });
        }
      }
      return ok;
    } catch (e) {
      console.error("[taskAction] catch", e);
      return false;
    }
  }, [fetchAll, logEvento]);

  const completaTask = useCallback(async (taskId: string) => {
    const { error: e } = await supabase.from("day_tasks")
      .update({ stato: "fatto", completato_at: new Date().toISOString() })
      .eq("id", taskId);
    if (e) console.error("[completaTask]", e);
    else await logEvento({ tipo: "task_completato", modulo_origine: "ops", titolo_breve: "Task completato" });
  }, [logEvento]);

  const segnaInCorso = useCallback(async (taskId: string) => {
    const { error: e } = await supabase.from("day_tasks")
      .update({ stato: "in_corso" }).eq("id", taskId);
    if (e) console.error("[segnaInCorso]", e);
  }, []);

  const skipProssimo = useCallback(() => {
    if (eventi[0]) setSkipUntilEventId(eventi[0].id);
  }, [eventi]);

  const strip: DayStripItem[] = useMemo(() => {
    const seen = new Set<DayModuloOrigine>();
    const items: DayStripItem[] = [];
    for (const ev of eventi) {
      if (seen.has(ev.modulo_origine)) continue;
      seen.add(ev.modulo_origine);
      items.push({
        modulo_origine: ev.modulo_origine,
        ultimo_evento_id: ev.id,
        ultimo_evento_tipo: ev.tipo,
        titolo_breve: ev.titolo_breve,
        contesto: ev.contesto,
        cm_id: ev.cm_id,
        ultimo_at: ev.created_at,
        attivo: items.length === 0,
      });
      if (items.length >= STRIP_MAX_ITEMS) break;
    }
    return items;
  }, [eventi]);

  const stats: DayStats = useMemo(() => {
    const totali = tasks.length;
    const fatti = tasks.filter((t) => t.stato === "fatto").length;
    // ore_deep · somma task deep/mastro pianificati + minuti focus_completato veri da DB (D65)
    const oreDeepPianificate = tasks
      .filter((t) => t.categoria === "deep" || t.categoria === "mastro")
      .reduce((s, t) => s + (t.durata_min ?? 0), 0) / 60;
    const oreDeepFocus = deepMinutiOggi / 60;
    const oreDeep = Math.max(oreDeepPianificate, oreDeepFocus);
    const cmIds = new Set<string>();
    eventi.forEach((e) => e.cm_id && cmIds.add(e.cm_id));
    return {
      task_totali: totali, task_fatti: fatti,
      ore_deep: Math.round(oreDeep * 10) / 10,
      cm_toccate: cmIds.size,
    };
  }, [tasks, eventi, deepMinutiOggi]);

  const prossimoFiltrato = useMemo(() => {
    if (!prossimoStep) return null;
    if (!skipUntilEventId) return prossimoStep;
    if (prossimoStep.evento_origine && prossimoStep.evento_origine !== skipUntilEventId) {
      return prossimoStep;
    }
    return null;
  }, [prossimoStep, skipUntilEventId]);

  return {
    loading, error, tasks, eventi, strip,
    prossimoStep: prossimoFiltrato, stats,
    refetch: fetchAll, logEvento, createTask, taskAction, completaTask, segnaInCorso, skipProssimo,
    backlogNuovi,
  };
}
