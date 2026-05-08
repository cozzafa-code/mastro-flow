// ════════════════════════════════════════════════════════════
// HOOK · usePreventivoState
// Carica/salva stato V10 su commesse.* + timeline_universale
// ════════════════════════════════════════════════════════════
"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import type { BonusKey, IVAKey } from "@/lib/preventivo-checklist-templates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type PreventivoStateV10 = {
  bonus_scelto: BonusKey | null;
  iva_scelta: IVAKey | null;
  destinazione_immobile: "prima" | "seconda" | null;
  zona_climatica: "AB" | "C" | "D" | "E" | "F" | null;
  pagamento_rate: string | null;
  pagamento_metodo: string | null;
  tempi_consegna: string | null;
  garanzia: string | null;
  preventivo_inviato_at: string | null;
  preventivo_inviato_canale: string | null;
  uw_conforme: boolean | null;
  is_showroom: boolean;
};

const DEFAULT_STATE: PreventivoStateV10 = {
  bonus_scelto: "bonus_casa",
  iva_scelta: "iva_10",
  destinazione_immobile: "prima",
  zona_climatica: "E",
  pagamento_rate: null,
  pagamento_metodo: null,
  tempi_consegna: null,
  garanzia: null,
  preventivo_inviato_at: null,
  preventivo_inviato_canale: null,
  uw_conforme: null,
  is_showroom: false,
};

type Args = {
  commessa_id: string;
  azienda_id: string;
};

export function usePreventivoState({ commessa_id, azienda_id }: Args) {
  const [state, setState] = useState<PreventivoStateV10>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // ─── LOAD ────────────────────────────────────────────────
  useEffect(() => {
    if (!commessa_id) { setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        // commessa
        const { data: c, error: e1 } = await supabase
          .from("commesse")
          .select("bonus_scelto, iva_scelta, destinazione_immobile, zona_climatica, pagamento_rate, pagamento_metodo, tempi_consegna, garanzia, preventivo_inviato_at, preventivo_inviato_canale, uw_conforme")
          .eq("id", commessa_id)
          .maybeSingle();
        if (e1) console.warn("[usePreventivoState] load commessa", e1);

        // azienda is_showroom
        const { data: az, error: e2 } = await supabase
          .from("aziende")
          .select("is_showroom, modalita_lavoro")
          .eq("id", azienda_id)
          .maybeSingle();
        if (e2) console.warn("[usePreventivoState] load azienda", e2);

        if (!alive) return;

        setState({
          bonus_scelto: (c?.bonus_scelto as BonusKey) ?? "bonus_casa",
          iva_scelta: (c?.iva_scelta as IVAKey) ?? "iva_10",
          destinazione_immobile: (c?.destinazione_immobile as any) ?? "prima",
          zona_climatica: (c?.zona_climatica as any) ?? "E",
          pagamento_rate: c?.pagamento_rate ?? null,
          pagamento_metodo: c?.pagamento_metodo ?? null,
          tempi_consegna: c?.tempi_consegna ?? null,
          garanzia: c?.garanzia ?? null,
          preventivo_inviato_at: c?.preventivo_inviato_at ?? null,
          preventivo_inviato_canale: c?.preventivo_inviato_canale ?? null,
          uw_conforme: c?.uw_conforme ?? null,
          is_showroom: !!(az?.is_showroom || az?.modalita_lavoro === "showroom"),
        });
      } catch (e: any) {
        console.error("[usePreventivoState] load error", e);
        if (alive) setLastError(e?.message ?? "load error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [commessa_id, azienda_id]);

  // ─── PATCH (debounced via flag) ──────────────────────────
  const patch = useCallback(async (patch: Partial<PreventivoStateV10>) => {
    // ottimistic UI
    setState(prev => ({ ...prev, ...patch }));
    setSaving(true);
    try {
      // separa campi commessa da is_showroom (azienda)
      const { is_showroom, ...commessaFields } = patch;
      
      if (Object.keys(commessaFields).length > 0) {
        const { error } = await supabase
          .from("commesse")
          .update(commessaFields)
          .eq("id", commessa_id);
        if (error) {
          console.error("[usePreventivoState] patch error", error);
          setLastError(error.message);
        }
      }
    } catch (e: any) {
      console.error("[usePreventivoState] patch exception", e);
      setLastError(e?.message ?? "patch error");
    } finally {
      setSaving(false);
    }
  }, [commessa_id]);

  // ─── LOG TIMELINE ────────────────────────────────────────
  const logEvento = useCallback(async (
    tipo: string,
    titolo: string,
    descrizione?: string,
    metadata?: Record<string, any>,
  ) => {
    try {
      await supabase.rpc("log_preventivo_v10", {
        p_commessa_id: commessa_id,
        p_azienda_id: azienda_id,
        p_tipo: tipo,
        p_titolo: titolo,
        p_descrizione: descrizione ?? null,
        p_metadata: metadata ?? {},
        p_autore_nome: null,
      });
    } catch (e) {
      // log silenzioso
      console.warn("[usePreventivoState] log failed", e);
    }
  }, [commessa_id, azienda_id]);

  // ─── INVIA PREVENTIVO ────────────────────────────────────
  const markInviato = useCallback(async (canale: "whatsapp" | "email" | "sms" | "altro") => {
    const now = new Date().toISOString();
    await patch({
      preventivo_inviato_at: now,
      preventivo_inviato_canale: canale,
    });
    await logEvento(
      "preventivo_inviato",
      `Preventivo inviato via ${canale}`,
      `Cliente contattato per accettazione preventivo`,
      { canale, inviato_at: now }
    );
  }, [patch, logEvento]);

  return {
    state,
    loading,
    saving,
    lastError,
    patch,
    logEvento,
    markInviato,
  };
}
