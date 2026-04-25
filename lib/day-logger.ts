"use client";

/**
 * MASTRO Day · Event Logger
 * ============================
 * Helper centrale per registrare eventi nel Day, dai 4 moduli operativi:
 *   - Misure (MisurePanel)        → tipo "misure_salvate"
 *   - Preventivo (PreventivoModal) → tipo "prev_generato"
 *   - Mail (MessaggiPanel)         → tipo "mail_inviata"
 *   - Foto (FotoVanoUploader)      → tipo "foto_caricate"
 *
 * Side-effect: scrive in `day_eventi`. Il DaySheet (via realtime) reagisce
 * automaticamente:
 *   - banner verde di rientro
 *   - strip "aperti adesso"
 *   - card "Continua qui" (RPC day_prossimo_step)
 *   - timeline · sub-task auto-spuntati (evento_match)
 *
 * Best-effort: non blocca mai l'UI se il log fallisce.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type DayEventoTipo =
  | "misure_salvate"
  | "prev_generato"
  | "mail_inviata"
  | "foto_caricate"
  | "task_completato"
  | "risposta_cliente"
  | "focus_completato";

export type DayModuloOrigine =
  | "misure"
  | "preventivo"
  | "mail"
  | "foto"
  | "ops"
  | "fiscale"
  | "contabilita";

export interface LogDayEventoInput {
  tipo: DayEventoTipo;
  modulo_origine: DayModuloOrigine;
  titolo_breve: string;          // es. "Rilievo Famiglia Rossi · 4 vani"
  contesto?: string | null;      // es. "vano 4/4 · OK" — mostrato sotto al titolo nello strip
  cm_id?: string | null;
  task_id?: string | null;
  durata_sec?: number | null;
  direzione?: "uscita" | "entrata"; // default "uscita" (azione utente)
  payload?: Record<string, any>;
}

/**
 * Logga un evento Day. Best-effort, non blocca l'UI.
 * Ritorna l'evento creato, oppure null se errore.
 */
export async function logDayEvento(input: LogDayEventoInput): Promise<{ id: string } | null> {
  try {
    const userRes = await supabase.auth.getUser();
    const user = userRes.data.user;
    if (!user) {
      console.warn("[logDayEvento] no auth user, skip");
      return null;
    }

    // azienda_id da operatori
    const opRes = await supabase
      .from("operatori")
      .select("azienda_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const azienda_id = opRes.data?.azienda_id;
    if (!azienda_id) {
      console.warn("[logDayEvento] no operatore record for user", user.id);
      return null;
    }

    const row = {
      azienda_id,
      user_id: user.id,
      tipo: input.tipo,
      modulo_origine: input.modulo_origine,
      direzione: input.direzione ?? "uscita",
      cm_id: input.cm_id ?? null,
      task_id: input.task_id ?? null,
      payload: input.payload ?? {},
      durata_sec: input.durata_sec ?? null,
      titolo_breve: input.titolo_breve,
      contesto: input.contesto ?? null,
    };

    const { data, error } = await supabase
      .from("day_eventi")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("[logDayEvento] insert error", error);
      return null;
    }

    return data as { id: string };
  } catch (e) {
    console.error("[logDayEvento] catch", e);
    return null;
  }
}

/**
 * Wrapper rapidi per i 4 moduli operativi.
 * Sono solo zucchero: invece di passare `tipo + modulo_origine`, chiami il wrapper.
 */
export const Day = {
  misureSalvate: (input: { cm_id: string; vani_count: number; durata_sec?: number }) =>
    logDayEvento({
      tipo: "misure_salvate",
      modulo_origine: "misure",
      titolo_breve: `Misure salvate · ${input.vani_count} van${input.vani_count === 1 ? "o" : "i"}`,
      contesto: `${input.vani_count} van${input.vani_count === 1 ? "o" : "i"} · OK`,
      cm_id: input.cm_id,
      durata_sec: input.durata_sec,
    }),

  prevGenerato: (input: { cm_id: string; pdf_url?: string; importo?: number; durata_sec?: number }) =>
    logDayEvento({
      tipo: "prev_generato",
      modulo_origine: "preventivo",
      titolo_breve: `Preventivo generato${input.importo ? ` · €${input.importo.toFixed(0)}` : ""}`,
      contesto: input.pdf_url ? "PDF pronto · manda al cliente" : "PDF pronto",
      cm_id: input.cm_id,
      durata_sec: input.durata_sec,
      payload: input.pdf_url ? { pdf_url: input.pdf_url, importo: input.importo } : { importo: input.importo },
    }),

  mailInviata: (input: { cm_id?: string; destinatario: string; oggetto?: string; durata_sec?: number }) =>
    logDayEvento({
      tipo: "mail_inviata",
      modulo_origine: "mail",
      titolo_breve: `Mail a ${input.destinatario}`,
      contesto: input.oggetto || "inviata",
      cm_id: input.cm_id ?? null,
      durata_sec: input.durata_sec,
    }),

  fotoCaricate: (input: { cm_id?: string; vano_id: string; count?: number }) =>
    logDayEvento({
      tipo: "foto_caricate",
      modulo_origine: "foto",
      titolo_breve: `${input.count ?? 1} foto caricate`,
      contesto: `vano ${input.vano_id.slice(-4)}`,
      cm_id: input.cm_id ?? null,
      payload: { vano_id: input.vano_id, count: input.count ?? 1 },
    }),
};
