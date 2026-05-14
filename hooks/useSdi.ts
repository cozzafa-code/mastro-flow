"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface SdiConfig {
  azienda_id: string;
  provider: "aruba" | "infocert" | "fatture_in_cloud" | "agenzia_entrate" | "none";
  ambiente: "test" | "produzione";
  username: string | null;
  codice_destinatario_default: string | null;
  conservazione_attiva: boolean;
  pec_aziendale: string | null;
  saldo_credito_invii: number | null;
  ultimo_check_at: string | null;
}

export interface SdiInvio {
  id: string;
  fattura_id: string | null;
  provider: string;
  direzione: "out" | "in";
  identificativo_sdi: string | null;
  stato: string;
  data_invio: string;
  data_consegna: string | null;
  data_notifica: string | null;
  motivo_scarto: string | null;
  xml_path: string | null;
  payload_provider: any;
}

export const STATI_SDI_LABEL: Record<string, string> = {
  in_invio: "In invio",
  consegnata: "Consegnata",
  scartata: "Scartata",
  non_consegnata: "Non consegnata",
  errore: "Errore",
  accettata: "Accettata PA",
  rifiutata: "Rifiutata PA",
  decorrenza_termini: "Decorrenza termini",
};

export const STATI_SDI_COLOR: Record<string, string> = {
  in_invio: "#E8B05C",
  consegnata: "#0F6E56",
  scartata: "#C73E1D",
  non_consegnata: "#E8830C",
  errore: "#C73E1D",
  accettata: "#0F6E56",
  rifiutata: "#C73E1D",
  decorrenza_termini: "#5C6B7A",
};

export function useSdi(aziendaId: string) {
  const [config, setConfig] = useState<SdiConfig | null>(null);
  const [invii, setInvii] = useState<SdiInvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    try {
      const [cfgRes, inviiRes] = await Promise.all([
        supabase.from("fin_sdi_config").select("*").eq("azienda_id", aziendaId).maybeSingle(),
        supabase.from("fin_sdi_invii").select("*").eq("azienda_id", aziendaId).order("data_invio", { ascending: false }).limit(100),
      ]);
      if (cfgRes.data) setConfig(cfgRes.data as any);
      setInvii((inviiRes.data || []) as any);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  async function aggiornaConfig(patch: Partial<SdiConfig>) {
    const { error } = await supabase.from("fin_sdi_config")
      .upsert({ azienda_id: aziendaId, ...patch }, { onConflict: "azienda_id" });
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  async function inviaFattura(fatturaId: string) {
    if (submitting) return { ok: false, error: "Invio già in corso" };
    setSubmitting(true);
    try {
      const res = await fetch("/api/sdi/invia-fattura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fattura_id: fatturaId, azienda_id: aziendaId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || `HTTP ${res.status}` };
      }
      await load();
      return { ok: true, ...data };
    } catch (e: any) {
      return { ok: false, error: e.message };
    } finally {
      setSubmitting(false);
    }
  }

  async function checkStato(invioId: string) {
    try {
      const res = await fetch("/api/sdi/check-stato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invio_id: invioId, azienda_id: aziendaId }),
      });
      const data = await res.json();
      if (data.ok) await load();
      return data;
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  async function scaricaXml(invioId: string): Promise<string | null> {
    const invio = invii.find((i) => i.id === invioId);
    if (!invio?.xml_path) return null;
    const { data } = await supabase.storage.from("sdi-xml").download(invio.xml_path);
    if (!data) return null;
    return await data.text();
  }

  // Statistiche
  const stats = {
    totali: invii.length,
    consegnate: invii.filter((i) => ["consegnata", "accettata"].includes(i.stato)).length,
    scartate: invii.filter((i) => ["scartata", "rifiutata", "errore"].includes(i.stato)).length,
    in_attesa: invii.filter((i) => ["in_invio"].includes(i.stato)).length,
  };

  return {
    config, invii, loading, submitting, stats,
    reload: load, aggiornaConfig, inviaFattura, checkStato, scaricaXml,
  };
}
