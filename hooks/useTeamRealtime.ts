// hooks/useTeamRealtime.ts
// FASE 4 - subscribe Supabase Realtime su montaggi / anomalie / operatore_eventi_stato.
// Chiama onChange() debounced quando arrivano eventi che riguardano l'azienda.
"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const DEBOUNCE_MS = 400;

export function useTeamRealtime(aziendaId: string | null, onChange: () => void) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!aziendaId) return;

    const trigger = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try { onChangeRef.current(); } catch {}
      }, DEBOUNCE_MS);
    };

    // Filtro server-side per azienda_id (non riceviamo cambi di altre aziende)
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
