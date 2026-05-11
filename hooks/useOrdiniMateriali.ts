"use client";
// hooks/useOrdiniMateriali.ts
// Legge ordini_fornitore + commessa per MaterialiPanel
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface OrdineRow {
  id: string;
  numero: string;
  fornitore: string;
  commessa_id: string;
  commessa_code: string;
  commessa_cliente: string;
  stato: string;
  totale_euro: number;
  created_at: string;
  consegna_prevista: string | null;
  data_ricezione: string | null;
  righe: any[];
  n_righe: number;
  categoria_materiale: string | null;
  urgente: boolean;
  bozza: boolean;
}

export function useOrdiniMateriali(aziendaId: string | null) {
  const [ordini, setOrdini] = useState<OrdineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: ordiniData, error: e1 } = await supabase
        .from("ordini_fornitore")
        .select("id, numero, fornitore, commessa_id, stato, totale_euro, totale_stimato, created_at, consegna_prevista, data_ricezione, righe, categoria_materiale, urgente, bozza")
        .eq("azienda_id", aziendaId)
        .order("created_at", { ascending: false });
      if (e1) throw e1;

      const commessaIds = Array.from(new Set((ordiniData || []).map((o: any) => o.commessa_id).filter(Boolean)));
      const { data: commesseData } = commessaIds.length > 0
        ? await supabase.from("commesse").select("id, code, cliente, cognome").in("id", commessaIds)
        : { data: [] };

      const cmMap: Record<string, any> = {};
      (commesseData || []).forEach((c: any) => { cmMap[c.id] = c; });

      const rows: OrdineRow[] = (ordiniData || []).map((o: any) => {
        const cm = cmMap[o.commessa_id] || {};
        const tot = Number(o.totale_euro ?? o.totale_stimato ?? 0);
        return {
          id: o.id,
          numero: o.numero || "?",
          fornitore: o.fornitore || "?",
          commessa_id: o.commessa_id || "",
          commessa_code: cm.code || "?",
          commessa_cliente: `${cm.cliente || ""} ${cm.cognome || ""}`.trim() || "?",
          stato: o.stato || "bozza",
          totale_euro: tot,
          created_at: o.created_at,
          consegna_prevista: o.consegna_prevista,
          data_ricezione: o.data_ricezione,
          righe: Array.isArray(o.righe) ? o.righe : [],
          n_righe: Array.isArray(o.righe) ? o.righe.length : 0,
          categoria_materiale: o.categoria_materiale,
          urgente: !!o.urgente,
          bozza: !!o.bozza,
        };
      });

      setOrdini(rows);
      setError(null);
    } catch (e: any) {
      console.error("[useOrdiniMateriali]", e);
      setError(e?.message || "errore");
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { reload(); }, [reload]);

  return { ordini, loading, error, reload };
}
