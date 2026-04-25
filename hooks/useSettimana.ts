"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export interface SettimanaGiorno {
  giorno: string;             // YYYY-MM-DD
  totale: number;
  durata_min_totale: number;
  energia_totale: number;
  task_count_deep: number;
  task_count_pausa: number;
}

export interface SettimanaTask {
  id: string;
  titolo: string;
  categoria: string | null;
  giorno: string;
  durata_min: number | null;
  ora_inizio: string | null;
  stato: string;
  energia: number | null;
}

interface UseSettimanaResult {
  loading: boolean;
  lunediISO: string;
  giorni: SettimanaGiorno[];
  tasksByGiorno: Record<string, SettimanaTask[]>;
  nonAssegnati: SettimanaTask[];   // task con giorno = null oppure < oggi non completati
  weekShift: (delta: number) => void;
  reset: () => void;
  spostaTask: (taskId: string, nuovoGiorno: string | null) => Promise<boolean>;
  refetch: () => Promise<void>;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 dom, 1 lun, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function fmtISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useSettimana(): UseSettimanaResult {
  const [loading, setLoading] = useState(true);
  const [lunedi, setLunedi] = useState<Date>(() => getMonday(new Date()));
  const [giorni, setGiorni] = useState<SettimanaGiorno[]>([]);
  const [tasksByGiorno, setTasksByGiorno] = useState<Record<string, SettimanaTask[]>>({});
  const [nonAssegnati, setNonAssegnati] = useState<SettimanaTask[]>([]);

  const lunediISO = useMemo(() => fmtISO(lunedi), [lunedi]);
  const domenicaISO = useMemo(() => {
    const d = new Date(lunedi);
    d.setDate(d.getDate() + 6);
    return fmtISO(d);
  }, [lunedi]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) { setGiorni([]); setTasksByGiorno({}); setNonAssegnati([]); setLoading(false); return; }

      // 1. densità giorni (RPC)
      const giorniReq = supabase.rpc("day_tasks_settimana", {
        p_user_id: user.id, p_lunedi: lunediISO,
      });

      // 2. tutti i task della settimana
      const tasksWeekReq = supabase.from("day_tasks")
        .select("id, titolo, categoria, giorno, durata_min, ora_inizio, stato, energia")
        .eq("user_id", user.id)
        .gte("giorno", lunediISO).lte("giorno", domenicaISO)
        .neq("stato", "eliminato")
        .order("ora_inizio", { ascending: true, nullsFirst: false });

      // 3. task non assegnati: stato=pianificato e giorno < oggi (rimaste indietro)
      const oggi = fmtISO(new Date());
      const nonAssReq = supabase.from("day_tasks")
        .select("id, titolo, categoria, giorno, durata_min, ora_inizio, stato, energia")
        .eq("user_id", user.id)
        .lt("giorno", oggi)
        .eq("stato", "pianificato")
        .order("giorno", { ascending: false })
        .limit(30);

      const [gRes, tRes, nRes] = await Promise.all([giorniReq, tasksWeekReq, nonAssReq]);
      if (gRes.error) console.error("[settimana giorni]", gRes.error);
      if (tRes.error) console.error("[settimana tasks]", tRes.error);
      if (nRes.error) console.error("[settimana nonAss]", nRes.error);

      setGiorni((gRes.data ?? []) as SettimanaGiorno[]);

      const grouped: Record<string, SettimanaTask[]> = {};
      ((tRes.data ?? []) as SettimanaTask[]).forEach((t) => {
        if (!grouped[t.giorno]) grouped[t.giorno] = [];
        grouped[t.giorno].push(t);
      });
      setTasksByGiorno(grouped);

      setNonAssegnati((nRes.data ?? []) as SettimanaTask[]);
    } catch (e) {
      console.error("[useSettimana] fetch", e);
    } finally {
      setLoading(false);
    }
  }, [lunediISO, domenicaISO]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // realtime su day_tasks
  useEffect(() => {
    let cancelled = false;
    let ch: any = null;
    (async () => {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user || cancelled) return;
      ch = supabase.channel("settimana-realtime")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "day_tasks", filter: `user_id=eq.${user.id}` },
          () => fetchAll())
        .subscribe();
    })();
    return () => { cancelled = true; if (ch) supabase.removeChannel(ch); };
  }, [fetchAll]);

  const weekShift = useCallback((delta: number) => {
    setLunedi((cur) => {
      const d = new Date(cur);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  }, []);

  const reset = useCallback(() => {
    setLunedi(getMonday(new Date()));
  }, []);

  const spostaTask = useCallback(async (taskId: string, nuovoGiorno: string | null): Promise<boolean> => {
    if (!nuovoGiorno) {
      // sposta in "non assegnati" = oggi (semplificazione)
      nuovoGiorno = fmtISO(new Date());
    }
    const { data, error } = await supabase.rpc("day_task_sposta_giorno", {
      p_task_id: taskId, p_nuovo_giorno: nuovoGiorno,
    });
    if (error) { console.error("[spostaTask]", error); return false; }
    fetchAll();
    return (data as any)?.ok === true;
  }, [fetchAll]);

  return {
    loading, lunediISO, giorni, tasksByGiorno, nonAssegnati,
    weekShift, reset, spostaTask, refetch: fetchAll,
  };
}
