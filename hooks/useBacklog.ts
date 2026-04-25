"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type BacklogOrigine =
  | "manuale" | "mail" | "vocale" | "idea" | "roadmap" | "evento_workflow";

export interface BacklogItem {
  id: string;
  azienda_id: string;
  user_id: string;
  origine: BacklogOrigine;
  titolo: string;
  descrizione: string | null;
  categoria: string | null;
  cm_id: string | null;
  payload: Record<string, any>;
  visto: boolean;
  archiviato: boolean;
  energia_stimata?: number | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BacklogCounts {
  tutto: number;
  mail: number;
  vocali: number;
  idee: number;
  roadmap: number;
  evento: number;
  manuale: number;
  nuovi: number;
  pianifica: number;
}

interface UseBacklogResult {
  loading: boolean;
  items: BacklogItem[];
  counts: BacklogCounts;
  refetch: () => Promise<void>;
  marcaVisto: (id: string) => Promise<void>;
  pianifica: (id: string, giorno: string, ora?: string | null, durata?: number) => Promise<boolean>;
  pianificaQuick: (id: string, quando: "oggi" | "domani" | "settimana") => Promise<boolean>;
  setEnergia: (id: string, energia: number) => Promise<void>;
  setTags: (id: string, tags: string[]) => Promise<void>;
  promuoviATask: (id: string) => Promise<boolean>;
  archivia: (id: string) => Promise<void>;
  elimina: (id: string) => Promise<void>;
  aggiungi: (input: { titolo: string; descrizione?: string; origine?: BacklogOrigine; categoria?: string }) => Promise<BacklogItem | null>;
}

const ZERO_COUNTS: BacklogCounts = {
  tutto: 0, mail: 0, vocali: 0, idee: 0, roadmap: 0, evento: 0, manuale: 0, nuovi: 0, pianifica: 0,
};

export function useBacklog(): UseBacklogResult {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [counts, setCounts] = useState<BacklogCounts>(ZERO_COUNTS);

  const fetchAll = useCallback(async () => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) { setItems([]); setCounts(ZERO_COUNTS); setLoading(false); return; }

      const itemsReq = supabase.from("day_backlog").select("*")
        .eq("user_id", user.id).eq("archiviato", false)
        .order("created_at", { ascending: false }).limit(200);

      const countsReq = supabase.rpc("day_backlog_filter_counts", { p_user_id: user.id });

      const [iRes, cRes] = await Promise.all([itemsReq, countsReq]);
      if (iRes.error) console.error("[backlog items]", iRes.error);
      if (cRes.error) console.error("[backlog counts]", cRes.error);

      setItems((iRes.data ?? []) as BacklogItem[]);
      setCounts((cRes.data ?? ZERO_COUNTS) as BacklogCounts);
    } catch (e) {
      console.error("[useBacklog] fetch", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    let cancelled = false;
    let ch: any = null;
    (async () => {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user || cancelled) return;
      ch = supabase.channel("backlog-realtime")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "day_backlog", filter: `user_id=eq.${user.id}` },
          () => fetchAll())
        .subscribe();
    })();
    return () => { cancelled = true; if (ch) supabase.removeChannel(ch); };
  }, [fetchAll]);

  const marcaVisto = useCallback(async (id: string) => {
    try {
      await supabase.rpc("day_backlog_marca_visto", { p_id: id });
      fetchAll();
    } catch (e) { console.error("[marcaVisto]", e); }
  }, [fetchAll]);

  const pianifica = useCallback(async (id: string, giorno: string, ora?: string | null, durata: number = 30): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("day_backlog_pianifica", {
        p_backlog_id: id, p_giorno: giorno,
        p_ora_inizio: ora ?? null, p_durata_min: durata,
      });
      if (error) { console.error("[pianifica]", error); return false; }
      fetchAll();
      return (data as any)?.ok === true;
    } catch (e) { console.error("[pianifica] catch", e); return false; }
  }, [fetchAll]);

  const pianificaQuick = useCallback(async (id: string, quando: "oggi" | "domani" | "settimana"): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("day_backlog_pianifica_quick", {
        p_backlog_id: id, p_quando: quando,
      });
      if (error) { console.error("[pianificaQuick]", error); return false; }
      fetchAll();
      return (data as any)?.ok === true;
    } catch (e) { console.error("[pianificaQuick] catch", e); return false; }
  }, [fetchAll]);

  const setEnergia = useCallback(async (id: string, energia: number) => {
    const v = Math.max(1, Math.min(4, energia));
    await supabase.from("day_backlog").update({ energia_stimata: v }).eq("id", id);
    fetchAll();
  }, [fetchAll]);

  const setTags = useCallback(async (id: string, tags: string[]) => {
    const cleaned = tags.map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 8);
    await supabase.from("day_backlog").update({ tags: cleaned }).eq("id", id);
    fetchAll();
  }, [fetchAll]);

  const promuoviATask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("day_backlog_promuovi_a_task", { p_id: id });
      if (error) { console.error("[promuoviATask]", error); return false; }
      fetchAll();
      return (data as any)?.ok === true;
    } catch (e) { console.error("[promuoviATask] catch", e); return false; }
  }, [fetchAll]);

  const archivia = useCallback(async (id: string) => {
    await supabase.from("day_backlog").update({ archiviato: true }).eq("id", id);
    fetchAll();
  }, [fetchAll]);

  const elimina = useCallback(async (id: string) => {
    await supabase.from("day_backlog").delete().eq("id", id);
    fetchAll();
  }, [fetchAll]);

  const aggiungi = useCallback(async (input: {
    titolo: string; descrizione?: string; origine?: BacklogOrigine; categoria?: string;
  }): Promise<BacklogItem | null> => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) return null;
      const opRes = await supabase.from("operatori").select("azienda_id").eq("user_id", user.id).maybeSingle();
      const azienda_id = opRes.data?.azienda_id;
      if (!azienda_id) return null;
      const { data } = await supabase.from("day_backlog").insert({
        azienda_id, user_id: user.id,
        origine: input.origine ?? "manuale",
        titolo: input.titolo,
        descrizione: input.descrizione ?? null,
        categoria: input.categoria ?? "mastro",
      }).select("*").single();
      fetchAll();
      return data as BacklogItem;
    } catch (e) { console.error("[aggiungi]", e); return null; }
  }, [fetchAll]);

  return { loading, items, counts, refetch: fetchAll, marcaVisto, pianifica, pianificaQuick, setEnergia, setTags, promuoviATask, archivia, elimina, aggiungi };
}
