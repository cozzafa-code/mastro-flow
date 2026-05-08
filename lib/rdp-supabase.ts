// ════════════════════════════════════════════════════════════
// RDP FORNITORE · SUPABASE CRUD
// ════════════════════════════════════════════════════════════
// CRUD per rdp_fornitori (richieste prezzo a fornitori showroom).
// Workflow: invia → ricevi PDF → AI legge → calcola margine.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type RDPRow = {
  id: string;
  azienda_id: string;
  commessa_id: string;
  fornitore_nome: string;
  fornitore_p_iva: string | null;
  sistema_richiesto: string | null;
  num_vani: number | null;
  stato: "inviata" | "ricevuta" | "letta" | "salvata";
  inviata_at: string;
  ricevuta_at: string | null;
  pdf_url: string | null;
  pdf_nome: string | null;
  pdf_size_kb: number | null;
  voci_estratte: VoceEstratta[];
  costo_fornitore_eur: number | null;
  costo_posa_eur: number | null;
  costo_totale_eur: number | null;
  prezzo_vendita_eur: number | null;
  margine_eur: number | null;
  margine_pct: number | null;
  ai_lettura_at: string | null;
  ai_confidence: number | null;
  note: string | null;
};

export type VoceEstratta = {
  descrizione: string;
  quantita: number;
  unita?: string;
  prezzo_unitario?: number;
  prezzo_totale: number;
};

// ─── CREA RDP (al momento della richiesta) ─────────────────
export async function creaRDP(params: {
  azienda_id: string;
  commessa_id: string;
  fornitore_nome: string;
  fornitore_p_iva?: string;
  sistema_richiesto?: string;
  num_vani?: number;
}): Promise<RDPRow | null> {
  const { data, error } = await supabase
    .from("rdp_fornitori")
    .insert({
      azienda_id: params.azienda_id,
      commessa_id: params.commessa_id,
      fornitore_nome: params.fornitore_nome,
      fornitore_p_iva: params.fornitore_p_iva ?? null,
      sistema_richiesto: params.sistema_richiesto ?? null,
      num_vani: params.num_vani ?? null,
      stato: "inviata",
    })
    .select()
    .single();
  if (error) {
    console.error("[rdp] creaRDP error", error);
    return null;
  }
  return data as RDPRow;
}

// ─── LISTA RDP per commessa ────────────────────────────────
export async function listRDPByCommessa(commessa_id: string): Promise<RDPRow[]> {
  const { data, error } = await supabase
    .from("rdp_fornitori")
    .select("*")
    .eq("commessa_id", commessa_id)
    .order("inviata_at", { ascending: false });
  if (error) {
    console.error("[rdp] listRDPByCommessa error", error);
    return [];
  }
  return (data ?? []) as RDPRow[];
}

// ─── UPLOAD PDF risposta + cambio stato ────────────────────
export async function caricaPDFRisposta(rdp_id: string, file: File, prezzo_vendita_eur?: number): Promise<{ pdf_url: string | null; ok: boolean }> {
  const fileName = `${rdp_id}_${Date.now()}_${file.name}`;
  const { data: upData, error: upErr } = await supabase.storage
    .from("rdp-fornitori")
    .upload(fileName, file, { upsert: true });

  if (upErr) {
    console.error("[rdp] upload error", upErr);
    return { pdf_url: null, ok: false };
  }

  const { data: pubUrl } = supabase.storage.from("rdp-fornitori").getPublicUrl(upData.path);

  const { error: updErr } = await supabase
    .from("rdp_fornitori")
    .update({
      stato: "ricevuta",
      ricevuta_at: new Date().toISOString(),
      pdf_url: pubUrl.publicUrl,
      pdf_nome: file.name,
      pdf_size_kb: Math.round(file.size / 1024),
      ...(prezzo_vendita_eur ? { prezzo_vendita_eur } : {}),
    })
    .eq("id", rdp_id);

  if (updErr) {
    console.error("[rdp] update post-upload error", updErr);
    return { pdf_url: pubUrl.publicUrl, ok: false };
  }

  return { pdf_url: pubUrl.publicUrl, ok: true };
}

// ─── SALVA risultato lettura AI ────────────────────────────
export async function salvaRisultatoAI(rdp_id: string, params: {
  voci_estratte: VoceEstratta[];
  costo_fornitore_eur: number;
  costo_posa_eur: number;
  prezzo_vendita_eur: number;
  ai_confidence: number;
}): Promise<boolean> {
  const costo_totale = params.costo_fornitore_eur + params.costo_posa_eur;
  const margine_eur = params.prezzo_vendita_eur - costo_totale;
  const margine_pct = params.prezzo_vendita_eur > 0
    ? (margine_eur / params.prezzo_vendita_eur) * 100
    : 0;

  const { error } = await supabase
    .from("rdp_fornitori")
    .update({
      stato: "letta",
      voci_estratte: params.voci_estratte,
      costo_fornitore_eur: params.costo_fornitore_eur,
      costo_posa_eur: params.costo_posa_eur,
      costo_totale_eur: costo_totale,
      prezzo_vendita_eur: params.prezzo_vendita_eur,
      margine_eur,
      margine_pct,
      ai_lettura_at: new Date().toISOString(),
      ai_confidence: params.ai_confidence,
    })
    .eq("id", rdp_id);

  if (error) {
    console.error("[rdp] salvaRisultatoAI error", error);
    return false;
  }
  return true;
}

// ─── AGGIORNA stato manuale ────────────────────────────────
export async function setRDPStato(rdp_id: string, stato: "inviata" | "ricevuta" | "letta" | "salvata"): Promise<boolean> {
  const { error } = await supabase
    .from("rdp_fornitori")
    .update({ stato })
    .eq("id", rdp_id);
  if (error) {
    console.error("[rdp] setRDPStato error", error);
    return false;
  }
  return true;
}

// ─── CANCELLA RDP ──────────────────────────────────────────
export async function eliminaRDP(rdp_id: string): Promise<boolean> {
  const { error } = await supabase
    .from("rdp_fornitori")
    .delete()
    .eq("id", rdp_id);
  if (error) {
    console.error("[rdp] eliminaRDP error", error);
    return false;
  }
  return true;
}
