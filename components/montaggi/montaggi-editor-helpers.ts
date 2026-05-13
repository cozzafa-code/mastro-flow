// components/montaggi/montaggi-editor-helpers.ts
// Helper per salvataggio/cancellazione montaggi su Supabase

import { supabase } from "@/lib/supabase";
import { MontaggioRow, MontaggioStato } from "./montaggi-types";

export interface MontaggioFormData {
  id?: string;
  commessa_id: string;
  data_montaggio: string | null;
  ora_inizio: string | null;
  ora_fine: string | null;
  ore_preventivate: number | null;
  squadra: string[];
  stato: MontaggioStato;
  note: string | null;
}

/**
 * Converte una row in form data (per editing).
 */
export function rowToForm(m: MontaggioRow): MontaggioFormData {
  return {
    id: m.id,
    commessa_id: m.commessa_id,
    data_montaggio: m.data_montaggio,
    ora_inizio: m.ora_inizio ? m.ora_inizio.substring(0, 5) : null,
    ora_fine: m.ora_fine ? m.ora_fine.substring(0, 5) : null,
    ore_preventivate: m.ore_preventivate,
    squadra: Array.isArray(m.squadra) ? m.squadra : [],
    stato: m.stato,
    note: m.note,
  };
}

/**
 * Form vuoto per "Nuovo montaggio".
 */
export function emptyForm(): MontaggioFormData {
  return {
    commessa_id: "",
    data_montaggio: null,
    ora_inizio: "08:00",
    ora_fine: "17:00",
    ore_preventivate: 8,
    squadra: [],
    stato: "da_pianificare",
    note: null,
  };
}

/**
 * Validazione form. Ritorna stringa errore o null se valido.
 */
export function validateForm(f: MontaggioFormData): string | null {
  if (!f.commessa_id) return "Commessa obbligatoria";
  // Se ha data, deve avere stato compatibile
  if (f.data_montaggio && f.stato === "da_pianificare") {
    // Auto-fix lato salvataggio
  }
  if (f.ora_inizio && f.ora_fine && f.ora_inizio >= f.ora_fine) {
    return "Ora fine deve essere dopo ora inizio";
  }
  if (f.ore_preventivate !== null && f.ore_preventivate < 0) {
    return "Ore preventivate negative non valide";
  }
  return null;
}

/**
 * Auto-correzione stato in base ai campi compilati.
 */
export function autoFixStato(f: MontaggioFormData): MontaggioStato {
  if (!f.data_montaggio || f.squadra.length === 0) {
    return "da_pianificare";
  }
  // Se stato attuale è "programmato/in_corso/completato/annullato", lascia
  if (
    f.stato === "in_corso" ||
    f.stato === "completato" ||
    f.stato === "annullato"
  ) {
    return f.stato;
  }
  return "programmato";
}

/**
 * Salva (insert o update) montaggio.
 * Ritorna { ok: true, id } o { ok: false, error }.
 */
export async function saveMontaggio(
  f: MontaggioFormData,
  aziendaId: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const err = validateForm(f);
  if (err) return { ok: false, error: err };

  const stato = autoFixStato(f);
  const payload: any = {
    commessa_id: f.commessa_id,
    data_montaggio: f.data_montaggio,
    ora_inizio: f.ora_inizio || null,
    ora_fine: f.ora_fine || null,
    ore_preventivate: f.ore_preventivate,
    squadra: f.squadra,
    stato,
    note: f.note,
    azienda_id: aziendaId,
  };

  try {
    if (f.id) {
      const { error } = await supabase
        .from("montaggi")
        .update(payload)
        .eq("id", f.id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, id: f.id };
    }
    const { data, error } = await supabase
      .from("montaggi")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e: any) {
    return { ok: false, error: e.message || "Errore sconosciuto" };
  }
}

/**
 * Elimina montaggio.
 */
export async function deleteMontaggio(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("montaggi").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || "Errore sconosciuto" };
  }
}

/**
 * Lista squadre standard. In futuro: da DB tabella squadre.
 */
export const SQUADRE_DEFAULT = ["sq1", "sq2", "sq3"];

/**
 * Filtra commesse compatibili per nuovo montaggio.
 * Solo commesse in fase: acconto_pagato, ordine, produzione, montaggio, fatturata.
 */
export function commesseValide(commesse: any[]): any[] {
  const fasiOk = new Set([
    "acconto_pagato",
    "ordine",
    "produzione",
    "montaggio",
    "fatturata",
  ]);
  return (commesse || []).filter((c) => fasiOk.has(c.fase));
}
