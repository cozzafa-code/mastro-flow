"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ============================================================
// TYPES
// ============================================================

export interface ArticoloMagazzino {
  id: string;
  codice: string;
  nome: string;
  descrizione: string | null;
  tipo: string | null;
  unita_misura: string | null;
  prezzo_acquisto: number | null;
  prezzo_vendita: number | null;
  scorta_attuale: number;
  scorta_minima: number;
  scorta_riservata: number;
  scorta_disponibile: number;
  stato_scorta: "ok" | "attenzione" | "sotto_minimo" | "esaurito";
  abc_class: "A" | "B" | "C" | null;
  picks_30gg: number;
  lead_time_giorni: number;
  qc_richiesto: boolean;
  in_qc_hold: boolean;
  fornitore_id: string | null;
  fornitore_nome: string | null;
  scaffale_id: string | null;
  scaffale_codice: string | null;
  scaffale_zona: string | null;
  ean: string | null;
  qr_code: string | null;
  foto_url: string | null;
  categoria_operativa: string | null;
  attivo: boolean;
}

export interface MagazzinoKPI {
  n_articoli: number;
  n_esauriti: number;
  n_sotto_minimo: number;
  n_attenzione: number;
  n_ok: number;
  n_class_a: number;
  n_class_b: number;
  n_class_c: number;
  n_qc_hold: number;
  valore_magazzino: number;
  valore_vendita_potenziale: number;
  valore_riservato: number;
}

export interface AbcRiepilogo {
  abc_class: "A" | "B" | "C";
  n_articoli: number;
  valore_classe: number;
  pct_valore: number;
}

export interface QcHold {
  id: string;
  articolo_id: string;
  articolo_nome: string;
  lotto: string | null;
  quantita: number;
  ddt_numero: string | null;
  fornitore_id: string | null;
  motivo: string | null;
  stato: string;
  ispezionato_at: string | null;
  created_at: string;
}

export interface ResoCliente {
  id: string;
  commessa_id: string | null;
  cliente_nome: string | null;
  articolo_id: string;
  articolo_nome: string | null;
  quantita: number;
  motivo: string | null;
  fonte: string;
  stato: string;
  ritiro_programmato_at: string | null;
  qc_at: string | null;
  nota_credito_importo: number | null;
  created_at: string;
}

export interface WavePick {
  id: string;
  data_wave: string;
  ora_inizio: string | null;
  operatore_nome: string | null;
  commesse_ids: string[];
  n_articoli: number;
  n_completati: number;
  tempo_stimato_min: number | null;
  perc_completamento: number;
  stato: string;
  inizio_at: string | null;
  fine_at: string | null;
}

export interface CrossDockMatch {
  id: string;
  articolo_id: string;
  articolo_nome: string | null;
  commessa_destinazione_id: string | null;
  commessa_code: string | null;
  commessa_cliente: string | null;
  furgone_nome: string | null;
  quantita: number;
  arrivo_previsto_at: string | null;
  stato: string;
  risparmio_min: number | null;
  risparmio_eur: number | null;
}

export interface DockSlot {
  id: string;
  data_slot: string;
  ora_inizio: string;
  ora_fine: string | null;
  tipo: string;
  fornitore_nome: string | null;
  cliente_nome: string | null;
  ddt_numero: string | null;
  ddt_descrizione: string | null;
  qc_richiesto: boolean;
  stato: string;
  asn_ricevuto: boolean;
  in_conflitto: boolean;
}

export interface CycleCountSched {
  id: string;
  zona: string | null;
  abc_class: "A" | "B" | "C" | null;
  cadenza_giorni: number;
  ultima_conta_at: string | null;
  prossima_conta_at: string | null;
  urgenza: "mai_eseguita" | "scaduta" | "oggi" | "futura";
  n_articoli_zona: number;
}

export interface GroupBuying {
  id: string;
  organizer_azienda_id: string;
  fornitore_nome: string | null;
  articolo_descrizione: string;
  prezzo_listino: number | null;
  prezzo_scontato: number | null;
  sconto_pct: number | null;
  qta_minima_totale: number;
  qta_attuale_totale: number;
  n_partecipanti: number;
  n_partecipanti_min: number;
  scadenza_at: string;
  stato: string;
  perc_completamento: number;
  urgenza_tempo: "scaduta" | "urgente" | "ok";
  partecipanti_iniziali: string[] | null;
}

export interface LaborOperatore {
  operatore_id: string | null;
  operatore_nome: string | null;
  picks_sett: number;
  errori_sett: number;
  scan_rate_avg: number | null;
  eff_avg: number | null;
  ore_sett: number | null;
  picks_per_ora: number | null;
}

export interface SlottingSugg {
  id: string;
  articolo_id: string;
  scaffale_da_id: string | null;
  scaffale_a_id: string | null;
  motivazione: string | null;
  risparmio_picks_sett: number | null;
  risparmio_min_sett: number | null;
  applicato: boolean;
}

// ============================================================
// COSTANTI UI
// ============================================================

export const STATO_SCORTA_COLOR: Record<string, string> = {
  ok: "#0F6E56",
  attenzione: "#E8B05C",
  sotto_minimo: "#E8830C",
  esaurito: "#C73E1D",
};

export const STATO_SCORTA_LABEL: Record<string, string> = {
  ok: "OK",
  attenzione: "Attenzione",
  sotto_minimo: "Sotto minimo",
  esaurito: "Esaurito",
};

export const ABC_COLOR: Record<string, string> = {
  A: "#C73E1D",
  B: "#E8B05C",
  C: "#5C6B7A",
};

// ============================================================
// HOOK PRINCIPALE
// ============================================================

export function useMagazzinoTop(aziendaId: string) {
  const [articoli, setArticoli] = useState<ArticoloMagazzino[]>([]);
  const [kpi, setKpi] = useState<MagazzinoKPI | null>(null);
  const [abcRiepilogo, setAbcRiepilogo] = useState<AbcRiepilogo[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [qcHolds, setQcHolds] = useState<QcHold[]>([]);
  const [resi, setResi] = useState<ResoCliente[]>([]);
  const [waves, setWaves] = useState<WavePick[]>([]);
  const [crossDock, setCrossDock] = useState<CrossDockMatch[]>([]);
  const [dockSlots, setDockSlots] = useState<DockSlot[]>([]);
  const [cycleScheds, setCycleScheds] = useState<CycleCountSched[]>([]);
  const [groupBuying, setGroupBuying] = useState<GroupBuying[]>([]);
  const [labor, setLabor] = useState<LaborOperatore[]>([]);
  const [slotting, setSlotting] = useState<SlottingSugg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    try {
      const [
        aRes, kRes, abcRes, accRes, qcRes, retRes,
        wRes, xdRes, dsRes, ccRes, gbRes, labRes, slRes,
      ] = await Promise.all([
        supabase.from("v_magazzino_articoli_full").select("*").eq("azienda_id", aziendaId).order("nome"),
        supabase.from("v_magazzino_kpi").select("*").eq("azienda_id", aziendaId).maybeSingle(),
        supabase.from("v_magazzino_abc_summary").select("*").eq("azienda_id", aziendaId),
        supabase.from("v_magazzino_accuracy").select("*").eq("azienda_id", aziendaId).maybeSingle(),
        supabase.from("qc_holds").select("*").eq("azienda_id", aziendaId).neq("stato", "approvato").order("created_at", { ascending: false }),
        supabase.from("v_resi_attivi").select("*").eq("azienda_id", aziendaId).order("created_at", { ascending: false }).limit(20),
        supabase.from("v_wave_pick_oggi").select("*").eq("azienda_id", aziendaId),
        supabase.from("v_cross_dock_attivi").select("*").eq("azienda_id", aziendaId),
        supabase.from("v_dock_slots_giorno").select("*").eq("azienda_id", aziendaId).gte("data_slot", new Date().toISOString().split("T")[0]).order("data_slot").order("ora_inizio"),
        supabase.from("v_cycle_count_attive").select("*").eq("azienda_id", aziendaId),
        supabase.from("v_group_buying_aperte").select("*"),
        supabase.from("v_labor_settimana").select("*").eq("azienda_id", aziendaId),
        supabase.from("slotting_suggerimenti").select("*").eq("azienda_id", aziendaId).eq("applicato", false),
      ]);
      setArticoli((aRes.data || []) as any);
      setKpi((kRes.data as any) || null);
      setAbcRiepilogo((abcRes.data || []) as any);
      setAccuracy((accRes.data as any)?.accuracy_pct || null);
      setQcHolds((qcRes.data || []) as any);
      setResi((retRes.data || []) as any);
      setWaves((wRes.data || []) as any);
      setCrossDock((xdRes.data || []) as any);
      setDockSlots((dsRes.data || []) as any);
      setCycleScheds((ccRes.data || []) as any);
      setGroupBuying((gbRes.data || []) as any);
      setLabor((labRes.data || []) as any);
      setSlotting((slRes.data || []) as any);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  // Realtime su tabelle chiave
  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`magazzino-top-${aziendaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "articoli_magazzino", filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "movimenti_magazzino", filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "qc_holds", filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "resi_cliente", filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "wave_pick", filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  // ============================================================
  // AZIONI
  // ============================================================

  async function carico(articoloId: string, quantita: number, prezzoUnit?: number, ddtNumero?: string, ddtFotoUrl?: string, note?: string) {
    const { data, error } = await supabase.rpc("magazzino_carico", {
      p_articolo_id: articoloId, p_quantita: quantita,
      p_prezzo_unitario: prezzoUnit || null,
      p_ddt_numero: ddtNumero || null,
      p_ddt_foto_url: ddtFotoUrl || null,
      p_note: note || null,
    });
    if (error) return { ok: false, error: error.message };
    return (data || { ok: false }) as any;
  }

  async function scaricoCommessa(articoloId: string, commessaId: string, quantita: number, note?: string) {
    const { data, error } = await supabase.rpc("magazzino_scarico_commessa", {
      p_articolo_id: articoloId, p_commessa_id: commessaId,
      p_quantita: quantita, p_note: note || null,
    });
    if (error) return { ok: false, error: error.message };
    return (data || { ok: false }) as any;
  }

  async function rettifica(articoloId: string, scortaReale: number, note?: string) {
    const { data, error } = await supabase.rpc("magazzino_rettifica", {
      p_articolo_id: articoloId, p_scorta_reale: scortaReale,
      p_note: note || "Rettifica inventario",
    });
    if (error) return { ok: false, error: error.message };
    return (data || { ok: false }) as any;
  }

  async function ricalcolaAbc() {
    const { data, error } = await supabase.rpc("magazzino_ricalcola_abc", { p_azienda_id: aziendaId });
    if (error) return { ok: false, error: error.message };
    await load();
    return data as any;
  }

  async function qcDecidi(qcId: string, decisione: "approvato" | "respinto" | "reso_fornitore" | "richiamato", note?: string) {
    const { data, error } = await supabase.rpc("qc_decidi", { p_qc_id: qcId, p_decisione: decisione, p_note: note || null });
    if (error) return { ok: false, error: error.message };
    await load();
    return data as any;
  }

  async function resoCrea(commessaId: string, articoloId: string, quantita: number, motivo: string, fonte: string = "whatsapp") {
    const { data, error } = await supabase.rpc("reso_crea", {
      p_commessa_id: commessaId, p_articolo_id: articoloId,
      p_quantita: quantita, p_motivo: motivo, p_fonte: fonte,
    });
    if (error) return { ok: false, error: error.message };
    await load();
    return data as any;
  }

  async function creaWaveAi(commesseIds: string[], operatoreNome?: string) {
    const { data, error } = await supabase.rpc("crea_wave_pick_ai", {
      p_commesse_ids: commesseIds, p_operatore_nome: operatoreNome || null,
    });
    if (error) return { ok: false, error: error.message };
    await load();
    return data as any;
  }

  async function gbAderisci(campagnaId: string, quantita: number) {
    const { data, error } = await supabase.rpc("gb_aderisci", { p_campagna_id: campagnaId, p_quantita: quantita });
    if (error) return { ok: false, error: error.message };
    await load();
    return data as any;
  }

  async function slottingApplica(suggId: string) {
    const { data, error } = await supabase.rpc("slotting_applica", { p_id: suggId });
    if (error) return { ok: false, error: error.message };
    await load();
    return data as any;
  }

  async function creaDockSlot(args: { data_slot: string; ora_inizio: string; tipo: string; fornitore_nome?: string; ddt_descrizione?: string }) {
    const { data, error } = await supabase.from("dock_slots").insert({
      azienda_id: aziendaId, ...args, stato: "prenotato",
    }).select("id").single();
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true, id: data.id };
  }

  return {
    // Dati
    articoli, kpi, abcRiepilogo, accuracy,
    qcHolds, resi, waves, crossDock, dockSlots, cycleScheds, groupBuying, labor, slotting,
    loading, reload: load,
    // Azioni
    carico, scaricoCommessa, rettifica, ricalcolaAbc,
    qcDecidi, resoCrea, creaWaveAi, gbAderisci, slottingApplica, creaDockSlot,
  };
}
