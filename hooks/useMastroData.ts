// MASTRO ERP - useMastroData
// Hook globale con state condiviso + Supabase Realtime su tutte le tabelle chiave.
// Esposto via Context: ogni componente legge gli stessi dati, sempre aggiornati live.
"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type MastroDataState = {
  commesse: any[];
  montaggi: any[];
  ordini: any[];
  fatture: any[];
  eventi: any[];
  operatori: any[];
  squadre: any[];
  magazzino: any[];
  produzioneCarichi: any[];
  tasks: any[];
  loading: boolean;
  aziendaId: string | null;
};

export type MastroDataActions = {
  refetchAll: () => Promise<void>;
  refetchTable: (table: string) => Promise<void>;
};

const initialState: MastroDataState = {
  commesse: [],
  montaggi: [],
  ordini: [],
  fatture: [],
  eventi: [],
  operatori: [],
  squadre: [],
  magazzino: [],
  produzioneCarichi: [],
  tasks: [],
  loading: true,
  aziendaId: null,
};

const MastroDataContext = createContext<{ state: MastroDataState; actions: MastroDataActions } | null>(null);

const TABLES_SUBSCRIBE = [
  { tab: "commesse", key: "commesse" },
  { tab: "montaggi", key: "montaggi" },
  { tab: "ordini_fornitore", key: "ordini" },
  { tab: "fatture", key: "fatture" },
  { tab: "events", key: "eventi" },
  { tab: "operatori", key: "operatori" },
  { tab: "squadre", key: "squadre" },
  { tab: "articoli_magazzino", key: "magazzino" },
  { tab: "produzione_carichi", key: "produzioneCarichi" },
  { tab: "tasks", key: "tasks" },
];

function resolveAziendaId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("mastro:aziendaId")
    || localStorage.getItem("mastro:aziendaId")
    || localStorage.getItem("mastro_azienda_id")
    || "ccca51c1-656b-4e7c-a501-55753e20da29";
}

export function MastroDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MastroDataState>(initialState);

  const refetchTable = useCallback(async (table: string) => {
    const tableInfo = TABLES_SUBSCRIBE.find(t => t.tab === table);
    if (!tableInfo) return;
    const aziendaId = resolveAziendaId();
    if (!aziendaId) return;
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase.from(table).select("*").eq("azienda_id", aziendaId);
      if (error) { console.error("[useMastroData] refetch " + table, error); return; }
      setState((prev: MastroDataState) => ({ ...prev, [tableInfo.key]: data || [] }));
    } catch (e) {
      console.error("[useMastroData] refetch " + table, e);
    }
  }, []);

  const refetchAll = useCallback(async () => {
    const aziendaId = resolveAziendaId();
    if (!aziendaId) { setState((prev: MastroDataState) => ({ ...prev, loading: false })); return; }
    setState((prev: MastroDataState) => ({ ...prev, loading: true, aziendaId }));
    try {
      const { supabase } = await import("@/lib/supabase");
      const results = await Promise.all(
        TABLES_SUBSCRIBE.map(t =>
          supabase.from(t.tab).select("*").eq("azienda_id", aziendaId).then(
            (r: any) => ({ key: t.key, data: r.data || [] })
          ).catch(() => ({ key: t.key, data: [] }))
        )
      );
      const next: any = { loading: false, aziendaId };
      results.forEach((r: any) => { next[r.key] = r.data; });
      setState((prev: MastroDataState) => ({ ...prev, ...next }));
      console.log("[useMastroData] dati caricati");
    } catch (e) {
      console.error("[useMastroData] refetchAll", e);
      setState((prev: MastroDataState) => ({ ...prev, loading: false }));
    }
  }, []);

  // Initial load
  useEffect(() => { refetchAll(); }, [refetchAll]);

  // Realtime subscriptions
  useEffect(() => {
    if (!state.aziendaId) return;
    let channels: any[] = [];
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        TABLES_SUBSCRIBE.forEach(({ tab, key }) => {
          const ch = supabase
            .channel("mastro-data-" + tab)
            .on("postgres_changes", { event: "*", schema: "public", table: tab }, (payload: any) => {
              const r: any = payload.new || payload.old;
              if (!r || (r.azienda_id && r.azienda_id !== state.aziendaId)) return;
              console.log("[useMastroData rt] " + tab + " " + payload.eventType, r?.id || r?.code);
              setState((prev: MastroDataState) => {
                const lista = (prev as any)[key] || [];
                if (payload.eventType === "DELETE") {
                  return { ...prev, [key]: lista.filter((x: any) => x.id !== r.id) };
                }
                if (payload.eventType === "INSERT") {
                  if (lista.find((x: any) => x.id === r.id)) return prev;
                  return { ...prev, [key]: [...lista, r] };
                }
                // UPDATE
                return { ...prev, [key]: lista.map((x: any) => x.id === r.id ? { ...x, ...r } : x) };
              });
            })
            .subscribe();
          channels.push(ch);
        });
      } catch (e) {
        console.error("[useMastroData] realtime setup", e);
      }
    })();
    return () => {
      (async () => {
        try {
          const { supabase } = await import("@/lib/supabase");
          channels.forEach(ch => { try { supabase.removeChannel(ch); } catch {} });
        } catch {}
      })();
    };
  }, [state.aziendaId]);

  return (
    <MastroDataContext.Provider value={{ state, actions: { refetchAll, refetchTable } }}>
      {children}
    </MastroDataContext.Provider>
  );
}

export function useMastroData() {
  const ctx = useContext(MastroDataContext);
  if (!ctx) {
    return { state: initialState, actions: { refetchAll: async () => {}, refetchTable: async () => {} } };
  }
  return ctx;
}
