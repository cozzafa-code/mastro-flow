// ═══════════════════════════════════════════════════════════
// MASTRO ERP — Montaggi Editor v2 helpers
// ═══════════════════════════════════════════════════════════
import { supabase } from "@/lib/supabase";
import type {
  MontaggioRow,
  EditorState,
  TipoIntervento,
  StatoMontaggio,
  CommessaLite,
  CaricoMap,
} from "./montaggi-editor-types";
import { caricoKey, fmtIso, parseIso, addDays } from "./montaggi-editor-types";

// === STATE INIT da row ===
export function buildEditorState(m: MontaggioRow | null): EditorState {
  return {
    tipo: (m?.tipo_intervento as TipoIntervento) || "cantiere",
    commessaId: m?.commessa_id || null,
    contattoId: m?.contatto_id || null,
    titolo: m?.titolo || "",
    indirizzoOverride: m?.indirizzo_override || "",
    telefonoOverride: m?.telefono_override || "",
    dataInizio: m?.data_montaggio || null,
    oraInizio: m?.ora_inizio || "09:00",
    giorni: Number(m?.giorni_pianificati || 1),
    oreGiorno: Number(m?.ore_preventivate || 8) / Math.max(1, Number(m?.giorni_pianificati || 1)),
    durataMinuti: Number(m?.durata_minuti || 30),
    squadra: (m?.squadra as string[]) || [],
    stato: (m?.stato as StatoMontaggio) || "da_pianificare",
    note: m?.note_misuratore || "",
  };
}

// === PAYLOAD per Supabase ===
export function buildPayload(s: EditorState, aziendaId: string): Partial<MontaggioRow> & { azienda_id: string } {
  const base: Partial<MontaggioRow> & { azienda_id: string } = {
    azienda_id: aziendaId,
    tipo_intervento: s.tipo,
    data_montaggio: s.dataInizio,
    ora_inizio: s.oraInizio || null,
    squadra: s.squadra,
    stato: deriveStato(s),
    note_misuratore: s.note || null,
    commessa_id: s.commessaId || null,
    contatto_id: s.contattoId || null,
    titolo: s.titolo?.trim() || null,
    indirizzo_override: s.indirizzoOverride?.trim() || null,
    telefono_override: s.telefonoOverride?.trim() || null,
  };
  if (s.tipo === "cantiere") {
    base.giorni_pianificati = s.giorni;
    base.ore_preventivate = s.oreGiorno;
    base.durata_minuti = Math.round(s.giorni * s.oreGiorno * 60);
  } else if (s.tipo === "intervento") {
    base.giorni_pianificati = 1;
    base.durata_minuti = s.durataMinuti;
    base.ore_preventivate = Math.round((s.durataMinuti / 60) * 100) / 100;
  } else {
    // sopralluogo: fissa 1h
    base.giorni_pianificati = 1;
    base.durata_minuti = 60;
    base.ore_preventivate = 1;
  }
  return base;
}

// stato derivato: se non c'è data o squadra → da_pianificare, altrimenti mantieni
function deriveStato(s: EditorState): StatoMontaggio {
  if (!s.dataInizio) return "da_pianificare";
  if (s.tipo === "cantiere" && (!s.squadra || s.squadra.length === 0)) return "da_pianificare";
  return s.stato === "da_pianificare" ? "programmato" : s.stato;
}

// === VALIDAZIONE ===
export function validate(s: EditorState): string | null {
  // Tutti i tipi richiedono almeno UN identificativo (commessa OPPURE contatto OPPURE titolo OPPURE indirizzo)
  const haIdentificativo = !!(
    s.commessaId ||
    s.contattoId ||
    s.titolo?.trim() ||
    s.indirizzoOverride?.trim()
  );
  if (!haIdentificativo) {
    if (s.tipo === "cantiere") return "Scegli commessa, cliente o aggiungi un titolo";
    if (s.tipo === "intervento") return "Scegli cliente, commessa o inserisci un titolo";
    return "Inserisci cliente, commessa o indirizzo";
  }
  if (s.tipo === "cantiere") {
    if (s.giorni < 1) return "Giorni: minimo 1";
    if (s.oreGiorno < 1) return "Ore al giorno: minimo 1";
  } else if (s.tipo === "intervento") {
    if (s.durataMinuti < 5) return "Durata: minimo 5 minuti";
  }
  return null;
}

// === SAVE / INSERT ===
export async function saveMontaggio(
  id: string | null,
  s: EditorState,
  aziendaId: string
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const err = validate(s);
  if (err) return { ok: false, error: err };
  const payload = buildPayload(s, aziendaId);
  try {
    if (id) {
      const { error } = await supabase.from("montaggi").update(payload).eq("id", id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, id };
    } else {
      const { data, error } = await supabase.from("montaggi").insert(payload).select("id").single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, id: data?.id };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

// === DELETE ===
export async function deleteMontaggio(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("montaggi").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

// === Costruisce mappa carico squadra:data → ore totali ===
export function buildCaricoMap(montaggi: any[]): CaricoMap {
  const map: CaricoMap = new Map();
  for (const m of montaggi || []) {
    if (!m?.data_montaggio || !m?.squadra) continue;
    const dataInizio = parseIso(m.data_montaggio);
    const giorni = Math.max(1, Math.floor(Number(m.giorni_pianificati || 1)));
    const oreGiorno = m.tipo_intervento === "intervento"
      ? (Number(m.durata_minuti || 0) / 60)
      : Number(m.ore_preventivate || 0) / Math.max(1, giorni);
    const sqArr: string[] = Array.isArray(m.squadra) ? m.squadra : [];
    for (let i = 0; i < giorni; i++) {
      const d = addDays(dataInizio, i);
      const iso = fmtIso(d);
      for (const sq of sqArr) {
        const k = caricoKey(sq, iso);
        map.set(k, (map.get(k) || 0) + oreGiorno);
      }
    }
  }
  return map;
}

// === Commesse selezionabili (fase >= acconto_pagato e non chiuse) ===
const FASI_OK = new Set([
  "acconto_pagato", "ordine", "produzione", "montaggio", "fatturata",
]);
export function commesseValide(commesse: any[]): CommessaLite[] {
  return (commesse || [])
    .filter((c) => c && c.id && FASI_OK.has(String(c.fase || "").toLowerCase()))
    .map((c) => ({
      id: c.id,
      code: c.code,
      cliente: c.cliente,
      cognome: c.cognome,
      indirizzo: c.indirizzo,
      citta: c.citta,
      telefono: c.telefono,
      totale_finale: c.totale_finale,
      totale_preventivo: c.totale_preventivo,
      vani_count: c.vani_count,
      fase: c.fase,
    }));
}

// === Carica contatti (rubrica) ===
export async function fetchContatti(aziendaId: string): Promise<any[]> {
  if (!aziendaId) return [];
  try {
    const { data, error } = await supabase
      .from("contatti")
      .select("id, nome, cognome, telefono, email, citta, indirizzo, tipo")
      .eq("azienda_id", aziendaId)
      .in("tipo", ["cliente", "lead", "potenziale"])
      .order("cognome", { ascending: true });
    if (error) {
      // fallback: prova senza filtro tipo
      const { data: d2 } = await supabase
        .from("contatti")
        .select("id, nome, cognome, telefono, email, citta, indirizzo, tipo")
        .eq("azienda_id", aziendaId)
        .order("cognome", { ascending: true });
      return d2 || [];
    }
    return data || [];
  } catch {
    return [];
  }
}
