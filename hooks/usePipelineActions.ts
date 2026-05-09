// ════════════════════════════════════════════════════════════
// HOOK · usePipelineActions
// Esegue azioni configurate nella fase corrente di una commessa
// ════════════════════════════════════════════════════════════
"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type AzioneEseguibile = {
  codice: string;
  nome: string;
  categoria: "documento" | "messaggio" | "evento" | "interno";
  sottocategoria: string | null;
  icona: string;
  colore: string;
  descrizione: string | null;
  obbligatorio_per_legge: boolean;
};

export type EsecuzioneResult = {
  esito: "successo" | "errore" | "skip";
  msg?: string;
  fattura_id?: string;
  evento_id?: number;
  template?: string;
  tipo?: string;
  errore?: string;
};

export type LogEsecuzione = {
  fase_codice: string;
  azione_codice: string;
  azione_nome: string;
  esito: string;
  eseguita_at: string;
  dettaglio: any;
};

export function usePipelineActions(commessa_id: string | null, azienda_id: string) {
  const [fase, setFase] = useState<any>(null);
  const [azioni, setAzioni] = useState<AzioneEseguibile[]>([]);
  const [log, setLog] = useState<LogEsecuzione[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!commessa_id || !azienda_id) return;
    setLoading(true);
    try {
      // Carica commessa
      const { data: cm } = await supabase
        .from("commesse")
        .select("fase, fase_corrente, ops_fase_corrente")
        .eq("id", commessa_id)
        .single();

      if (!cm) { setLoading(false); return; }

      const faseCodice = (cm.fase_corrente ?? cm.fase ?? cm.ops_fase_corrente ?? "sopralluogo") as string;

      // Carica config fase
      const { data: f } = await supabase
        .from("pipeline_fasi")
        .select("*")
        .eq("azienda_id", azienda_id)
        .eq("codice", faseCodice)
        .maybeSingle();

      setFase(f);

      // Carica azioni dal catalog
      if (f) {
        const codici: string[] = [
          ...(f.azioni_interne ?? []),
          ...(f.documenti_generati ?? []),
          ...(f.eventi_calendario ?? []),
          ...((f.messaggi_template ?? []).map((m: any) => m.codice).filter(Boolean)),
        ];

        if (codici.length > 0) {
          const { data: cat } = await supabase
            .from("mastro_azioni_catalog")
            .select("*")
            .in("codice", codici);
          setAzioni((cat as AzioneEseguibile[]) ?? []);
        } else {
          setAzioni([]);
        }
      }

      // Carica log
      const { data: lg } = await supabase.rpc("get_log_azioni_commessa", { p_commessa_id: commessa_id });
      setLog((lg as LogEsecuzione[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [commessa_id, azienda_id]);

  useEffect(() => { reload(); }, [reload]);

  const esegui = useCallback(async (codice: string): Promise<EsecuzioneResult | null> => {
    if (!commessa_id || !fase) return null;
    setExecuting(codice);
    try {
      const { data, error } = await supabase.rpc("esegui_azione_singola", {
        p_commessa_id: commessa_id,
        p_fase_codice: fase.codice,
        p_azione_codice: codice,
      });
      if (error) {
        return { esito: "errore", errore: error.message };
      }
      await reload();
      return data as EsecuzioneResult;
    } finally {
      setExecuting(null);
    }
  }, [commessa_id, fase, reload]);

  const eseguiTutte = useCallback(async (): Promise<{ azioni_eseguite: number; risultati: any[] } | null> => {
    if (!commessa_id || !fase) return null;
    setExecuting("__all__");
    try {
      const { data, error } = await supabase.rpc("esegui_azioni_fase", {
        p_commessa_id: commessa_id,
        p_fase_codice: fase.codice,
      });
      if (error) return null;
      await reload();
      return data as any;
    } finally {
      setExecuting(null);
    }
  }, [commessa_id, fase, reload]);

  return { fase, azioni, log, loading, executing, esegui, eseguiTutte, reload };
}
