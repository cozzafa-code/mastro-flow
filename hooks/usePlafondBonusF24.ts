"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface PlafondBonus {
  id: string;
  cliente_cf: string;
  cliente_nome: string;
  tipo_bonus: string;
  anno_inizio: number;
  immobile_indirizzo: string | null;
  importo_massimo: number;
  importo_usato: number;
  importo_residuo: number;
  fatture_collegate: any[];
  pratica_enea: string | null;
  scadenza_pratica: string | null;
  stato: string;
}

export interface F24 {
  id: string;
  numero_progressivo: string;
  data_scadenza: string;
  data_versamento: string | null;
  tipo: string;
  periodo_riferimento: string | null;
  codice_tributo: string;
  importo: number;
  credito_compensato: number;
  importo_netto: number;
  stato: string;
  pdf_url: string | null;
  liquidazione_iva_id: string | null;
  note: string | null;
}

export const TIPI_BONUS_LABEL: Record<string, string> = {
  ecobonus_50: "Ecobonus 50%",
  ecobonus_65: "Ecobonus 65%",
  ecobonus_70: "Ecobonus 70%",
  bonus_casa_50: "Bonus Casa 50%",
  sismabonus: "Sismabonus",
  superbonus_70: "Superbonus 70%",
};

const TETTI_BONUS: Record<string, number> = {
  ecobonus_50: 60000,
  ecobonus_65: 60000,
  ecobonus_70: 60000,
  bonus_casa_50: 96000,
  sismabonus: 96000,
  superbonus_70: 60000,
};

export function usePlafondBonus(aziendaId: string) {
  const [plafond, setPlafond] = useState<PlafondBonus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("fin_plafond_bonus")
      .select("*")
      .eq("azienda_id", aziendaId)
      .order("created_at", { ascending: false });
    setPlafond((data || []) as any);
    setLoading(false);
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  async function crea(args: {
    cliente_cf: string;
    cliente_nome: string;
    tipo_bonus: string;
    anno_inizio: number;
    importo_massimo?: number;
    immobile_indirizzo?: string;
    pratica_enea?: string;
  }) {
    const tetto = args.importo_massimo || TETTI_BONUS[args.tipo_bonus] || 0;
    const { data, error } = await supabase.from("fin_plafond_bonus").insert({
      azienda_id: aziendaId,
      cliente_cf: args.cliente_cf.toUpperCase().trim(),
      cliente_nome: args.cliente_nome.trim(),
      tipo_bonus: args.tipo_bonus,
      anno_inizio: args.anno_inizio,
      importo_massimo: tetto,
      immobile_indirizzo: args.immobile_indirizzo,
      pratica_enea: args.pratica_enea,
    }).select("id").single();
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true, id: data?.id };
  }

  async function aggiornaDaFattura(fatturaId: string) {
    const { data, error } = await supabase.rpc("aggiorna_plafond_da_fattura", { p_fattura_id: fatturaId });
    if (error) return { ok: false, error: error.message };
    await load();
    return (data || { ok: false }) as any;
  }

  async function elimina(id: string) {
    const { error } = await supabase.from("fin_plafond_bonus").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  return { plafond, loading, reload: load, crea, aggiornaDaFattura, elimina };
}

export function useF24(aziendaId: string) {
  const [f24, setF24] = useState<F24[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("fin_f24")
      .select("*")
      .eq("azienda_id", aziendaId)
      .order("data_scadenza", { ascending: false })
      .limit(100);
    setF24((data || []) as any);
    setLoading(false);
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  async function generaDaIva(liquidazioneId: string) {
    const { data, error } = await supabase.rpc("genera_f24_da_iva", { p_liquidazione_id: liquidazioneId });
    if (error) return { ok: false, error: error.message };
    await load();
    return (data || { ok: false }) as any;
  }

  async function marcaVersato(id: string, dataVersamento: string) {
    const { error } = await supabase.from("fin_f24")
      .update({ stato: "versato", data_versamento: dataVersamento }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  async function annulla(id: string) {
    const { error } = await supabase.from("fin_f24")
      .update({ stato: "annullato" }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  return { f24, loading, reload: load, generaDaIva, marcaVersato, annulla };
}
