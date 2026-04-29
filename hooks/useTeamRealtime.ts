// hooks/useTeamRealtime.ts
// FASE 5I - debounce 1500ms + cooldown post-mutation per evitare double refetch
"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const DEBOUNCE_MS = 1500;
// Window dopo un fetch in cui i realtime events vengono ignorati (evita doppio refetch
// quando una mutation triggera sia refetch manuale che event realtime)
const COOLDOWN_AFTER_FETCH_MS = 2000;

let lastManualFetchAt = 0;

// Chiamata da useTeamMobile dopo ogni fetch/mutation per resettare il cooldown
export function notifyManualFetch() {
  lastManualFetchAt = Date.now();
}

export function useTeamRealtime(aziendaId: string | null, onChange: () => void) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!aziendaId) return;

    const trigger = () => {
      // Skip se manual fetch recente (entro 2s)
      if (Date.now() - lastManualFetchAt < COOLDOWN_AFTER_FETCH_MS) {
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try { onChangeRef.current(); } catch {}
      }, DEBOUNCE_MS);
    };

    const filter = `azienda_id=eq.${aziendaId}`;
    const channel = supabase
      .channel(`team-live-${aziendaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "montaggi", filter }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "anomalie", filter }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "operatore_eventi_stato", filter }, trigger)
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [aziendaId]);
}
