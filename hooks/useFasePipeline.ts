// hooks/useFasePipeline.ts - legge fase reale da DB con polling 30s + realtime
"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type FaseInfo = {
  fase: string;
  fase_label: string;
  fase_index: number;
  fase_pipeline_index: number;
  totale_finale: number | null;
  totale_preventivo: number | null;
  preventivo_inviato_at: string | null;
  firma_data: string | null;
  fattura_acconto_id: string | null;
  fattura_saldo_id: string | null;
  materiale_ordinato_at: string | null;
  produzione_completata_at: string | null;
  montaggio_completato_at: string | null;
};

const FASE_TO_INDEX: Record<string, { full: number; ui: number; label: string }> = {
  sopralluogo:      { full: 1, ui: 1, label: "Sopralluogo" },
  preventivo:       { full: 2, ui: 3, label: "Preventivo" },
  conferma_ordine:  { full: 3, ui: 4, label: "Conferma ordine" },
  confermata:       { full: 4, ui: 4, label: "Firmata" },
  acconto_pagato:   { full: 5, ui: 5, label: "Acconto pagato" },
  ordine:           { full: 6, ui: 5, label: "In ordine" },
  produzione:       { full: 7, ui: 6, label: "In produzione" },
  posa:             { full: 8, ui: 7, label: "In posa" },
  collaudo:         { full: 9, ui: 8, label: "Collaudata" },
  chiusura:         { full: 10, ui: 8, label: "Chiusa" },
  fatturata:        { full: 9, ui: 8, label: "Fatturata" },
  pagata:           { full: 10, ui: 8, label: "Pagata" },
};

export function useFasePipeline(commessa_id: string | null) {
  const [fase, setFase] = useState<FaseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!commessa_id) { setFase(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("commesse")
      .select("fase, totale_finale, totale_preventivo, preventivo_inviato_at, firma_data, fattura_acconto_id, fattura_saldo_id, materiale_ordinato_at, produzione_completata_at, montaggio_completato_at")
      .eq("id", commessa_id)
      .maybeSingle();

    if (data) {
      const f = data.fase ?? "sopralluogo";
      const map = FASE_TO_INDEX[f] ?? FASE_TO_INDEX.sopralluogo;
      setFase({
        fase: f,
        fase_label: map.label,
        fase_index: map.full,
        fase_pipeline_index: map.ui,
        totale_finale: data.totale_finale,
        totale_preventivo: data.totale_preventivo,
        preventivo_inviato_at: data.preventivo_inviato_at,
        firma_data: data.firma_data,
        fattura_acconto_id: data.fattura_acconto_id,
        fattura_saldo_id: data.fattura_saldo_id,
        materiale_ordinato_at: data.materiale_ordinato_at,
        produzione_completata_at: data.produzione_completata_at,
        montaggio_completato_at: data.montaggio_completato_at,
      });
    } else {
      setFase(null);
    }
    setLoading(false);
  }, [commessa_id]);

  useEffect(() => {
    reload();
    if (!commessa_id) return;
    const interval = setInterval(reload, 30000);
    const ch = supabase
      .channel(`commessa_${commessa_id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "commesse", filter: `id=eq.${commessa_id}` },
        () => reload()
      )
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, [commessa_id, reload]);

  return { fase, loading, reload };
}
