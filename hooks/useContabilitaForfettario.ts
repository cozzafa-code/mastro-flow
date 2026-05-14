"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface ForfettarioKPI {
  azienda_id: string;
  anno: number;
  regime: string;
  codice_ateco: string;
  coefficiente_redditivita: number;
  aliquota_sostitutiva: number;
  soglia_passaggio: number;
  ricavi_anno: number;
  reddito_imponibile: number;
  imposta_stimata: number;
  stato_soglia: "ok" | "attenzione" | "critico";
  pct_soglia: number;
}

export interface ScadenzaInps {
  id: string;
  anno: number;
  tipo_rata: string;
  data_scadenza: string;
  importo: number;
  importo_versato: number;
  stato: string;
  f24_id: string | null;
}

export interface ScadenzaIrpef {
  id: string;
  anno: number;
  tipo: "saldo" | "acconto_1" | "acconto_2";
  data_scadenza: string;
  imposta_lorda: number;
  aliquota_pct: number;
  reddito_imponibile: number;
  ricavi_anno: number;
  importo_versato: number;
  stato: string;
}

export interface RegimeFiscale {
  azienda_id: string;
  regime: string;
  codice_ateco: string;
  coefficiente_redditivita: number;
  aliquota_sostitutiva: number;
  start_up_5anni: boolean;
  soglia_passaggio: number;
  inps_minimale_annuo: number;
  inps_percentuale_ivs: number;
  riduzione_inps_35: boolean;
}

export function useContabilitaForfettario(aziendaId: string) {
  const [kpi, setKpi] = useState<ForfettarioKPI | null>(null);
  const [regime, setRegime] = useState<RegimeFiscale | null>(null);
  const [inps, setInps] = useState<ScadenzaInps[]>([]);
  const [irpef, setIrpef] = useState<ScadenzaIrpef[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    const annoCorr = new Date().getFullYear();
    try {
      const [kpiRes, regRes, inpsRes, irpefRes] = await Promise.all([
        supabase.from("v_fin_forfettario_kpi").select("*").eq("azienda_id", aziendaId).maybeSingle(),
        supabase.from("fin_regime_fiscale").select("*").eq("azienda_id", aziendaId).maybeSingle(),
        supabase.from("fin_inps_scadenze").select("*").eq("azienda_id", aziendaId).gte("anno", annoCorr - 1).order("data_scadenza"),
        supabase.from("fin_irpef_scadenze").select("*").eq("azienda_id", aziendaId).gte("anno", annoCorr - 1).order("data_scadenza"),
      ]);
      if (kpiRes.data) setKpi(kpiRes.data as any);
      if (regRes.data) setRegime(regRes.data as any);
      setInps((inpsRes.data || []) as any);
      setIrpef((irpefRes.data || []) as any);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  async function generaInpsAnno(anno: number) {
    const { data, error } = await supabase.rpc("genera_inps_artigiani_anno", { p_anno: anno });
    if (error) return { ok: false, error: error.message };
    await load();
    return (data || { ok: false }) as any;
  }

  async function generaIrpefAnno(anno: number) {
    const { data, error } = await supabase.rpc("genera_irpef_forfettario_anno", { p_anno: anno });
    if (error) return { ok: false, error: error.message };
    await load();
    return (data || { ok: false }) as any;
  }

  async function aggiornaRegime(patch: Partial<RegimeFiscale>) {
    const { error } = await supabase.from("fin_regime_fiscale")
      .upsert({ azienda_id: aziendaId, ...patch }, { onConflict: "azienda_id" });
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  async function marcaInpsVersata(id: string, importo: number) {
    const { error } = await supabase.from("fin_inps_scadenze")
      .update({ stato: "versato", importo_versato: importo }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  async function marcaIrpefVersata(id: string, importo: number) {
    const { error } = await supabase.from("fin_irpef_scadenze")
      .update({ stato: "versato", importo_versato: importo }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  return { kpi, regime, inps, irpef, loading, reload: load, generaInpsAnno, generaIrpefAnno, aggiornaRegime, marcaInpsVersata, marcaIrpefVersata };
}

export const TIPI_RATA_INPS_LABEL: Record<string, string> = {
  rata_1: "Rata 1 (16 feb)",
  rata_2: "Rata 2 (16 mag)",
  rata_3: "Rata 3 (16 ago)",
  rata_4: "Rata 4 (16 nov)",
  acconto_1: "Acconto 1",
  acconto_2: "Acconto 2",
  saldo: "Saldo",
  ivs_minimale: "IVS minimale",
};

export const TIPI_IRPEF_LABEL: Record<string, string> = {
  saldo: "Saldo",
  acconto_1: "Acconto 1 (40%)",
  acconto_2: "Acconto 2 (60%)",
};
