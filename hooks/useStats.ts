"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


export type StatsPeriodo = "oggi" | "settimana" | "mese" | "trimestre";

export interface StatsKPI {
  ore_deep: number;
  ore_deep_prec: number;
  ore_deep_delta: number;
  task_chiusi: number;
  task_chiusi_prec: number;
  task_chiusi_delta: number;
  cm_toccate: number;
  energia_totale_min: number;
  periodo: string;
  data_da: string;
  data_a: string;
}

export interface FasciaOraria {
  ora: number;
  minuti_deep: number;
  task_count: number;
}

export interface Ripartizione {
  categoria: string;
  minuti: number;
  task_count: number;
}

export interface TopCommessa {
  cm_id: string;
  code: string | null;
  cliente: string | null;
  cognome: string | null;
  minuti: number;
  eventi: number;
}

export interface Pattern {
  tipo: string;
  titolo: string;
  sottotitolo: string;
  icona: string;
}

interface UseStatsResult {
  loading: boolean;
  periodo: StatsPeriodo;
  setPeriodo: (p: StatsPeriodo) => void;
  kpi: StatsKPI | null;
  fasce: FasciaOraria[];
  ripartizione: Ripartizione[];
  topCommesse: TopCommessa[];
  pattern: Pattern[];
  refetch: () => Promise<void>;
}

export function useStats(initial: StatsPeriodo = "settimana"): UseStatsResult {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<StatsPeriodo>(initial);
  const [kpi, setKpi] = useState<StatsKPI | null>(null);
  const [fasce, setFasce] = useState<FasciaOraria[]>([]);
  const [ripartizione, setRipartizione] = useState<Ripartizione[]>([]);
  const [topCommesse, setTopCommesse] = useState<TopCommessa[]>([]);
  const [pattern, setPattern] = useState<Pattern[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) { setLoading(false); return; }

      const [kRes, fRes, rRes, tRes, pRes] = await Promise.all([
        supabase.rpc("day_stats_kpi",            { p_user_id: user.id, p_periodo: periodo }),
        supabase.rpc("day_stats_fasce_orarie",   { p_user_id: user.id, p_periodo: periodo }),
        supabase.rpc("day_stats_ripartizione",   { p_user_id: user.id, p_periodo: periodo }),
        supabase.rpc("day_stats_top_commesse",   { p_user_id: user.id, p_periodo: periodo, p_limit: 5 }),
        supabase.rpc("day_stats_pattern_detection", { p_user_id: user.id }),
      ]);

      if (kRes.error) console.error("[stats kpi]", kRes.error);
      if (fRes.error) console.error("[stats fasce]", fRes.error);
      if (rRes.error) console.error("[stats ripartizione]", rRes.error);
      if (tRes.error) console.error("[stats top]", tRes.error);
      if (pRes.error) console.error("[stats pattern]", pRes.error);

      setKpi(kRes.data as StatsKPI ?? null);
      setFasce((fRes.data ?? []) as FasciaOraria[]);
      setRipartizione((rRes.data ?? []) as Ripartizione[]);
      setTopCommesse((tRes.data ?? []) as TopCommessa[]);
      setPattern((pRes.data ?? []) as Pattern[]);
    } catch (e) {
      console.error("[useStats] fetch", e);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { loading, periodo, setPeriodo, kpi, fasce, ripartizione, topCommesse, pattern, refetch: fetchAll };
}
