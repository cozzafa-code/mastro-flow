// ════════════════════════════════════════════════════════════
// HOOK · usePipelineConfig · gestione pipeline custom azienda
// ════════════════════════════════════════════════════════════
"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type FaseConfig = {
  id: string;
  azienda_id: string;
  codice: string;
  nome: string;
  icona: string;
  colore: string;
  ordine: number;
  attiva: boolean;
  descrizione: string | null;
  sistema_erp: boolean;
  sistema_messaggi: boolean;
  sistema_montaggi: boolean;
  sistema_automazioni: boolean;
  email_oggetto: string | null;
  email_corpo: string | null;
  email_destinatario: string | null;
  email_invio_auto: boolean;
  checklist_items: Array<{ id: string; testo: string; obblig?: boolean }>;
  documenti_generati: string[];
  documenti_richiesti_cliente: string[];
  messaggi_template: Array<{ codice: string; oggetto?: string; corpo?: string; canale?: string }>;
  eventi_calendario: string[];
  azioni_interne: string[];
  gate_condizioni: Array<{ campo: string; op: string; valore?: any; messaggio?: string }>;
  gate_blocca_avanzamento: boolean;
};

export type AzioneCatalog = {
  codice: string;
  nome: string;
  categoria: "documento" | "messaggio" | "evento" | "interno";
  sottocategoria: string | null;
  icona: string;
  colore: string;
  descrizione: string | null;
  obbligatorio_per_legge: boolean;
  ordine: number;
};

export function usePipelineConfig(azienda_id: string) {
  const [fasi, setFasi] = useState<FaseConfig[]>([]);
  const [catalog, setCatalog] = useState<AzioneCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!azienda_id) return;
    setLoading(true);
    try {
      const [{ data: f }, { data: c }] = await Promise.all([
        supabase
          .from("pipeline_fasi")
          .select("*")
          .eq("azienda_id", azienda_id)
          .order("ordine"),
        supabase
          .from("mastro_azioni_catalog")
          .select("*")
          .order("ordine"),
      ]);
      setFasi((f as FaseConfig[]) ?? []);
      setCatalog((c as AzioneCatalog[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [azienda_id]);

  useEffect(() => { reload(); }, [reload]);

  const aggiornaFase = useCallback(async (fase_id: string, patch: Partial<FaseConfig>) => {
    setSaving(true);
    try {
      // ottimistic
      setFasi(prev => prev.map(f => f.id === fase_id ? { ...f, ...patch } : f));
      const { error } = await supabase.rpc("aggiorna_fase_config", {
        p_fase_id: fase_id,
        p_patch: patch,
      });
      if (error) console.error("aggiornaFase", error);
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleAttiva = useCallback(async (fase_id: string, attiva: boolean) => {
    setFasi(prev => prev.map(f => f.id === fase_id ? { ...f, attiva } : f));
    await supabase.rpc("toggle_fase_attiva", { p_fase_id: fase_id, p_attiva: attiva });
  }, []);

  const aggiungiFase = useCallback(async (codice: string, nome: string, icona = "circle", colore = "#94A3B8") => {
    const { data, error } = await supabase.rpc("aggiungi_fase", {
      p_azienda_id: azienda_id,
      p_codice: codice,
      p_nome: nome,
      p_icona: icona,
      p_colore: colore,
    });
    if (!error) await reload();
    return { data, error };
  }, [azienda_id, reload]);

  const eliminaFase = useCallback(async (fase_id: string) => {
    if (!confirm("Eliminare questa fase?")) return;
    setFasi(prev => prev.filter(f => f.id !== fase_id));
    await supabase.from("pipeline_fasi").delete().eq("id", fase_id);
  }, []);

  const resetDefault = useCallback(async () => {
    if (!confirm("Ripristinare le 10 fasi predefinite? Le tue personalizzazioni verranno perse.")) return;
    await supabase.rpc("reset_pipeline_default", { p_azienda_id: azienda_id });
    await reload();
  }, [azienda_id, reload]);

  const riordina = useCallback(async (idsInOrdine: string[]) => {
    const ordineArr = idsInOrdine.map((id, i) => ({ id, ordine: i + 1 }));
    setFasi(prev => {
      const map = new Map(prev.map(f => [f.id, f]));
      return idsInOrdine.map((id, i) => ({ ...(map.get(id)!), ordine: i + 1 }));
    });
    await supabase.rpc("riordina_fasi", { p_azienda_id: azienda_id, p_ordine: ordineArr });
  }, [azienda_id]);

  return {
    fasi, catalog, loading, saving,
    reload, aggiornaFase, toggleAttiva, aggiungiFase, eliminaFase, resetDefault, riordina,
  };
}
