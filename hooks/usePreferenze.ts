"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface PreferenzeUI {
  ordini_card_style?: "A" | "B" | "C";
  ordini_raggruppa?: "stato" | "fornitore" | "commessa" | "data";
  [key: string]: any;
}

const LS_KEY = "mastro_preferenze_cache";

/**
 * Hook per gestire preferenze UI dell'operatore.
 * Lettura: prima da cache localStorage (istant), poi sync da DB in background.
 * Scrittura: localStorage immediato + UPDATE DB best-effort.
 */
export function usePreferenze() {
  const [preferenze, setPreferenze] = useState<PreferenzeUI>(() => {
    if (typeof window === "undefined") return {};
    try {
      const cached = localStorage.getItem(LS_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [loaded, setLoaded] = useState(false);

  // Sync iniziale da DB
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user?.id) {
        setLoaded(true);
        return;
      }
      const { data, error } = await supabase
        .from("operatori")
        .select("preferenze")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (error) {
        console.warn("[usePreferenze] fetch error", error);
        setLoaded(true);
        return;
      }
      const db = (data?.preferenze || {}) as PreferenzeUI;
      // Merge: DB wins su conflitti, cache come fallback per chiavi non in DB
      setPreferenze((prev) => {
        const merged = { ...prev, ...db };
        try { localStorage.setItem(LS_KEY, JSON.stringify(merged)); } catch { }
        return merged;
      });
      setLoaded(true);
    })();
  }, []);

  const setPreferenza = useCallback(async (key: string, value: any) => {
    setPreferenze((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { }
      return next;
    });

    // Write-through al DB best-effort
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user?.id) return;
      // Leggo prima preferenze attuali per merge
      const { data: cur } = await supabase
        .from("operatori")
        .select("preferenze")
        .eq("user_id", u.user.id)
        .maybeSingle();
      const merged = { ...((cur?.preferenze as any) || {}), [key]: value };
      await supabase
        .from("operatori")
        .update({ preferenze: merged })
        .eq("user_id", u.user.id);
    } catch (e) {
      console.warn("[usePreferenze] write error", e);
    }
  }, []);

  return { preferenze, setPreferenza, loaded };
}
