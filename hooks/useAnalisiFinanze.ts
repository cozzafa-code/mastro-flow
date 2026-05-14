"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface AgingKPI {
  importo_corrente: number;
  importo_0_30: number;
  importo_31_60: number;
  importo_61_90: number;
  importo_over_90: number;
  importo_totale_aperto: number;
  n_critiche: number;
}

export interface AgingFattura {
  id: string;
  numero: string;
  cliente: string;
  data_emissione: string;
  data_scadenza: string;
  totale: number;
  pagato: number;
  residuo: number;
  stato: string;
  bucket_aging: string;
  giorni_ritardo: number;
}

export interface DsoCliente {
  cliente: string;
  cliente_piva: string | null;
  cliente_cf: string | null;
  n_fatture: number;
  fatturato_totale: number;
  dso_medio: number | null;
  dso_min: number | null;
  dso_max: number | null;
  n_aperte: number;
}

export interface TopMoroso {
  cliente: string;
  n_fatture_scadute: number;
  importo_dovuto: number;
  max_giorni_ritardo: number;
  avg_giorni_ritardo: number;
}

export interface PrevisionaleKPI {
  in_30gg: number;
  in_31_60gg: number;
  in_61_90gg: number;
  out_30gg: number;
  out_31_60gg: number;
  out_61_90gg: number;
}

export interface MargineCommessa {
  commessa_id: string;
  commessa_code: string;
  cliente_nome: string;
  ricavi_fatturati: number;
  ricavi_incassati: number;
  costo_materiali: number;
  margine_assoluto: number;
  margine_pct: number | null;
}

export function useAnalisiFinanze(aziendaId: string) {
  const [agingKpi, setAgingKpi] = useState<AgingKPI | null>(null);
  const [aging, setAging] = useState<AgingFattura[]>([]);
  const [dso, setDso] = useState<DsoCliente[]>([]);
  const [morosi, setMorosi] = useState<TopMoroso[]>([]);
  const [previsionale, setPrevisionale] = useState<PrevisionaleKPI | null>(null);
  const [margini, setMargini] = useState<MargineCommessa[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    try {
      const [agKpi, agList, dsoList, mor, prev, marg] = await Promise.all([
        supabase.from("v_fin_aging_kpi").select("*").eq("azienda_id", aziendaId).maybeSingle(),
        supabase.from("v_fin_aging_fatture").select("*").eq("azienda_id", aziendaId).order("giorni_ritardo", { ascending: false }),
        supabase.from("v_fin_dso_clienti").select("*").eq("azienda_id", aziendaId).order("fatturato_totale", { ascending: false }).limit(50),
        supabase.from("v_fin_top_morosi").select("*").eq("azienda_id", aziendaId).limit(10),
        supabase.from("v_fin_previsionale_90gg").select("*").eq("azienda_id", aziendaId).maybeSingle(),
        supabase.from("v_fin_margine_commessa").select("*").eq("azienda_id", aziendaId).order("ricavi_fatturati", { ascending: false }).limit(50),
      ]);
      setAgingKpi((agKpi.data as any) || null);
      setAging((agList.data || []) as any);
      setDso((dsoList.data || []) as any);
      setMorosi((mor.data || []) as any);
      setPrevisionale((prev.data as any) || null);
      setMargini((marg.data || []) as any);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  return { agingKpi, aging, dso, morosi, previsionale, margini, loading, reload: load };
}

export const BUCKET_AGING_LABEL: Record<string, string> = {
  corrente: "Non scaduto",
  "0_30": "0-30 gg",
  "31_60": "31-60 gg",
  "61_90": "61-90 gg",
  over_90: "Oltre 90 gg",
  no_scadenza: "Senza scadenza",
};

export const BUCKET_AGING_COLOR: Record<string, string> = {
  corrente: "#0F6E56",
  "0_30": "#E8B05C",
  "31_60": "#E8830C",
  "61_90": "#C73E1D",
  over_90: "#8B0000",
  no_scadenza: "#5C6B7A",
};
