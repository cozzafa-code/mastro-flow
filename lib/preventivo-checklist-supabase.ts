// ════════════════════════════════════════════════════════════
// PREVENTIVO · CHECKLIST CONTESTUALI · SUPABASE CRUD
// ════════════════════════════════════════════════════════════
// CRUD per documenti_richiesti_bonus + documenti_inviati_cliente.
// Auto-seeding al cambio bonus/IVA.
// NON tocca: firma_tokens, preventivo_tokens, propaga_firma_a_commessa.

import { createClient } from "@supabase/supabase-js";
import {
  BONUS_DOC_IN, BONUS_DOC_OUT, IVA_DOC_IN, IVA_DOC_OUT,
  type BonusKey, type IVAKey,
} from "./preventivo-checklist-templates";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── TYPES ──────────────────────────────────────────────────
export type DocRichiestoRow = {
  id: string;
  azienda_id: string;
  commessa_id: string;
  tipo_contesto: "bonus" | "iva";
  contesto_valore: string;
  doc_codice: string;
  doc_nome: string;
  doc_descrizione: string | null;
  doc_obbligatorio: boolean;
  raccolto: boolean;
  raccolto_at: string | null;
  file_url: string | null;
  file_size_kb: number | null;
  note: string | null;
};

export type DocInviatoRow = {
  id: string;
  azienda_id: string;
  commessa_id: string;
  tipo_contesto: "bonus" | "iva" | "enea";
  contesto_valore: string;
  doc_codice: string;
  doc_nome: string;
  template_versione: string;
  pdf_url: string | null;
  inviato: boolean;
  inviato_at: string | null;
  inviato_canale: "whatsapp" | "email" | "manuale" | "download" | null;
  letto_dal_cliente: boolean;
  letto_at: string | null;
  firmato: boolean;
  firmato_at: string | null;
};

// ─── READ: documenti per commessa ───────────────────────────
export async function listDocRichiesti(commessa_id: string, tipo_contesto: "bonus" | "iva", contesto_valore: string): Promise<DocRichiestoRow[]> {
  const { data, error } = await supabase
    .from("documenti_richiesti_bonus")
    .select("*")
    .eq("commessa_id", commessa_id)
    .eq("tipo_contesto", tipo_contesto)
    .eq("contesto_valore", contesto_valore)
    .order("doc_obbligatorio", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[checklist] listDocRichiesti error", error);
    return [];
  }
  return (data ?? []) as DocRichiestoRow[];
}

export async function listDocInviati(commessa_id: string, tipo_contesto: "bonus" | "iva" | "enea", contesto_valore: string): Promise<DocInviatoRow[]> {
  const { data, error } = await supabase
    .from("documenti_inviati_cliente")
    .select("*")
    .eq("commessa_id", commessa_id)
    .eq("tipo_contesto", tipo_contesto)
    .eq("contesto_valore", contesto_valore)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[checklist] listDocInviati error", error);
    return [];
  }
  return (data ?? []) as DocInviatoRow[];
}

// ─── SEED auto al cambio bonus ──────────────────────────────
// Se la commessa ha bonus_casa e non esistono righe → le crea da template.
// Idempotente: UNIQUE constraint protegge da doppi insert.
export async function seedBonusChecklist(params: {
  azienda_id: string;
  commessa_id: string;
  bonus: BonusKey;
}): Promise<{ in_count: number; out_count: number }> {
  const docsIn = BONUS_DOC_IN[params.bonus] ?? [];
  const docsOut = BONUS_DOC_OUT[params.bonus] ?? [];

  if (docsIn.length > 0) {
    const rowsIn = docsIn.map(d => ({
      azienda_id: params.azienda_id,
      commessa_id: params.commessa_id,
      tipo_contesto: "bonus" as const,
      contesto_valore: params.bonus,
      doc_codice: d.codice,
      doc_nome: d.nome,
      doc_descrizione: d.descrizione ?? null,
      doc_obbligatorio: d.obbligatorio,
    }));
    const { error: errIn } = await supabase
      .from("documenti_richiesti_bonus")
      .upsert(rowsIn, { onConflict: "commessa_id,tipo_contesto,contesto_valore,doc_codice", ignoreDuplicates: true });
    if (errIn) console.error("[checklist] seedBonusChecklist IN error", errIn);
  }

  if (docsOut.length > 0) {
    const rowsOut = docsOut.map(d => ({
      azienda_id: params.azienda_id,
      commessa_id: params.commessa_id,
      tipo_contesto: "bonus" as const,
      contesto_valore: params.bonus,
      doc_codice: d.codice,
      doc_nome: d.nome,
      template_versione: d.template_versione,
    }));
    const { error: errOut } = await supabase
      .from("documenti_inviati_cliente")
      .upsert(rowsOut, { onConflict: "commessa_id,tipo_contesto,contesto_valore,doc_codice", ignoreDuplicates: true });
    if (errOut) console.error("[checklist] seedBonusChecklist OUT error", errOut);
  }

  return { in_count: docsIn.length, out_count: docsOut.length };
}

export async function seedIvaChecklist(params: {
  azienda_id: string;
  commessa_id: string;
  iva: IVAKey;
}): Promise<{ in_count: number; out_count: number }> {
  const docsIn = IVA_DOC_IN[params.iva] ?? [];
  const docsOut = IVA_DOC_OUT[params.iva] ?? [];

  if (docsIn.length > 0) {
    const rowsIn = docsIn.map(d => ({
      azienda_id: params.azienda_id,
      commessa_id: params.commessa_id,
      tipo_contesto: "iva" as const,
      contesto_valore: params.iva,
      doc_codice: d.codice,
      doc_nome: d.nome,
      doc_descrizione: d.descrizione ?? null,
      doc_obbligatorio: d.obbligatorio,
    }));
    const { error: errIn } = await supabase
      .from("documenti_richiesti_bonus")
      .upsert(rowsIn, { onConflict: "commessa_id,tipo_contesto,contesto_valore,doc_codice", ignoreDuplicates: true });
    if (errIn) console.error("[checklist] seedIvaChecklist IN error", errIn);
  }

  if (docsOut.length > 0) {
    const rowsOut = docsOut.map(d => ({
      azienda_id: params.azienda_id,
      commessa_id: params.commessa_id,
      tipo_contesto: "iva" as const,
      contesto_valore: params.iva,
      doc_codice: d.codice,
      doc_nome: d.nome,
      template_versione: d.template_versione,
    }));
    const { error: errOut } = await supabase
      .from("documenti_inviati_cliente")
      .upsert(rowsOut, { onConflict: "commessa_id,tipo_contesto,contesto_valore,doc_codice", ignoreDuplicates: true });
    if (errOut) console.error("[checklist] seedIvaChecklist OUT error", errOut);
  }

  return { in_count: docsIn.length, out_count: docsOut.length };
}

// ─── UPDATE singolo doc ────────────────────────────────────
export async function setDocRaccolto(id: string, raccolto: boolean, file_url?: string): Promise<boolean> {
  const update: any = { raccolto, raccolto_at: raccolto ? new Date().toISOString() : null };
  if (file_url) update.file_url = file_url;
  const { error } = await supabase
    .from("documenti_richiesti_bonus")
    .update(update)
    .eq("id", id);
  if (error) {
    console.error("[checklist] setDocRaccolto error", error);
    return false;
  }
  return true;
}

export async function setDocInviato(id: string, canale: "whatsapp" | "email" | "manuale" | "download"): Promise<boolean> {
  const { error } = await supabase
    .from("documenti_inviati_cliente")
    .update({
      inviato: true,
      inviato_at: new Date().toISOString(),
      inviato_canale: canale,
    })
    .eq("id", id);
  if (error) {
    console.error("[checklist] setDocInviato error", error);
    return false;
  }
  return true;
}

// ─── PROGRESS conteggi ─────────────────────────────────────
export async function getChecklistProgress(commessa_id: string, tipo_contesto: "bonus" | "iva", contesto_valore: string) {
  const [docsIn, docsOut] = await Promise.all([
    listDocRichiesti(commessa_id, tipo_contesto, contesto_valore),
    listDocInviati(commessa_id, tipo_contesto, contesto_valore),
  ]);
  return {
    in_total: docsIn.length,
    in_raccolti: docsIn.filter(d => d.raccolto).length,
    in_obbligatori_mancanti: docsIn.filter(d => d.doc_obbligatorio && !d.raccolto).length,
    out_total: docsOut.length,
    out_inviati: docsOut.filter(d => d.inviato).length,
  };
}
