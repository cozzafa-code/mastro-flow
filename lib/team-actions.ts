// lib/team-actions.ts
// Mutations Supabase per il modulo TEAM. FASE 2 + 3 + 5A.
"use client";
import { supabase } from "@/lib/supabase";

async function getCtx() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { data: prof } = await supabase
    .from("profili").select("azienda_id").eq("id", user.id).maybeSingle();
  if (!prof?.azienda_id) throw new Error("no_azienda");
  return { user, azienda_id: prof.azienda_id as string };
}

async function logEvento(p: {
  azienda_id: string;
  operatore_id: string;
  evento: "avvio" | "pausa" | "riprende" | "stop" | "note";
  stato_da?: string | null;
  stato_a?: string | null;
  commessa_id?: string | null;
  montaggio_id?: string | null;
  motivo?: string | null;
  note?: string | null;
  user_id?: string;
}) {
  try {
    await supabase.from("operatore_eventi_stato").insert({
      azienda_id: p.azienda_id,
      operatore_id: p.operatore_id,
      evento: p.evento,
      stato_da: p.stato_da || null,
      stato_a: p.stato_a || null,
      commessa_id: p.commessa_id || null,
      montaggio_id: p.montaggio_id || null,
      motivo: p.motivo || null,
      note: p.note || null,
      creato_da: p.user_id || null,
    });
  } catch (e) {
    console.warn("[team-actions] audit log fallito:", e);
  }
}

// =================== TASK ===================
export interface NewTaskInput {
  operatore_id?: string; operatore_nome?: string;
  cm_id?: string; cliente?: string;
  titolo: string; note?: string;
  giorno?: string; ora_inizio?: string; ora_fine?: string;
  tipo?: string; luogo?: string;
}
export async function submitTask(input: NewTaskInput): Promise<{ id: string }> {
  const { user, azienda_id } = await getCtx();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("agenda_eventi")
    .insert({
      azienda_id, user_id: user.id,
      operatore_id: input.operatore_id || null,
      operatore_nome: input.operatore_nome || null,
      cm_id: input.cm_id || null,
      cliente: input.cliente || null,
      titolo: input.titolo,
      note: input.note || null,
      giorno: input.giorno || today,
      ora_inizio: input.ora_inizio || null,
      ora_fine: input.ora_fine || null,
      tipo: input.tipo || "task",
      stato: "programmato",
      luogo: input.luogo || null,
    })
    .select("id").single();
  if (error) throw error;
  return { id: data.id };
}

// =================== ANOMALIE ===================
export async function risolviAnomalia(anomaliaId: string, nota?: string): Promise<void> {
  const { user } = await getCtx();
  const { error } = await supabase
    .from("anomalie")
    .update({
      stato: "risolta",
      risolta_at: new Date().toISOString(),
      risolta_da: user.id,
      nota_risoluzione: nota || null,
    })
    .eq("id", anomaliaId);
  if (error) throw error;
}

export interface NewAnomaliaInput {
  operatore_id?: string; commessa_id?: string;
  titolo: string; descrizione?: string;
  severita?: "bassa" | "media" | "alta" | "critica";
  tipo?: string; origine?: string;
}
export async function creaAnomalia(input: NewAnomaliaInput): Promise<{ id: string }> {
  const { azienda_id } = await getCtx();
  const { data, error } = await supabase
    .from("anomalie")
    .insert({
      azienda_id,
      operatore_id: input.operatore_id || null,
      commessa_id: input.commessa_id || null,
      titolo: input.titolo,
      descrizione: input.descrizione || null,
      severita: input.severita || "media",
      tipo: input.tipo || "manuale",
      origine: input.origine || "team_app",
      stato: "aperta",
      rilevata_at: new Date().toISOString(),
    })
    .select("id").single();
  if (error) throw error;
  return { id: data.id };
}

// =================== AVVIA / PAUSA / RIPRENDI / STOP ===================
export async function avviaLavoro(p: { operatore_id: string; commessa_id: string }): Promise<{ montaggio_id: string }> {
  const { user, azienda_id } = await getCtx();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("montaggi")
    .select("id, stato, avviato_at, completato_at")
    .eq("azienda_id", azienda_id)
    .eq("operatore_id", p.operatore_id)
    .eq("commessa_id", p.commessa_id)
    .eq("data_montaggio", today)
    .is("completato_at", null)
    .maybeSingle();

  let montaggio_id: string;
  if (existing?.id) {
    const { error } = await supabase
      .from("montaggi")
      .update({
        stato: "in_corso",
        avviato_at: existing.avviato_at || new Date().toISOString(),
        motivo_pausa: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw error;
    montaggio_id = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from("montaggi")
      .insert({
        azienda_id, operatore_id: p.operatore_id, commessa_id: p.commessa_id,
        data_montaggio: today, stato: "in_corso",
        avviato_at: new Date().toISOString(),
        squadra: [p.operatore_id], timer_secondi: 0, pause_totali: 0,
      })
      .select("id").single();
    if (error) throw error;
    montaggio_id = created.id;
  }

  await logEvento({
    azienda_id, operatore_id: p.operatore_id,
    evento: "avvio", stato_a: "attivo",
    commessa_id: p.commessa_id, montaggio_id,
    user_id: user.id,
  });
  return { montaggio_id };
}

export async function pausaLavoro(p: { operatore_id: string; motivo?: string }): Promise<void> {
  const { user, azienda_id } = await getCtx();
  const today = new Date().toISOString().slice(0, 10);

  const { data: mont } = await supabase
    .from("montaggi")
    .select("id, commessa_id")
    .eq("azienda_id", azienda_id).eq("operatore_id", p.operatore_id)
    .eq("data_montaggio", today).eq("stato", "in_corso")
    .is("completato_at", null).maybeSingle();

  if (!mont?.id) throw new Error("Nessun lavoro in corso da mettere in pausa");

  const { error } = await supabase
    .from("montaggi")
    .update({ motivo_pausa: p.motivo || "manuale", updated_at: new Date().toISOString() })
    .eq("id", mont.id);
  if (error) throw error;

  await logEvento({
    azienda_id, operatore_id: p.operatore_id,
    evento: "pausa", stato_da: "attivo", stato_a: "pausa",
    commessa_id: mont.commessa_id, montaggio_id: mont.id,
    motivo: p.motivo, user_id: user.id,
  });
}

export async function riprendiLavoro(p: { operatore_id: string }): Promise<void> {
  const { user, azienda_id } = await getCtx();
  const today = new Date().toISOString().slice(0, 10);

  const { data: mont } = await supabase
    .from("montaggi")
    .select("id, commessa_id")
    .eq("azienda_id", azienda_id).eq("operatore_id", p.operatore_id)
    .eq("data_montaggio", today).eq("stato", "in_corso")
    .not("motivo_pausa", "is", null).is("completato_at", null).maybeSingle();

  if (!mont?.id) throw new Error("Nessuna pausa attiva da riprendere");

  const { error } = await supabase
    .from("montaggi")
    .update({ motivo_pausa: null, updated_at: new Date().toISOString() })
    .eq("id", mont.id);
  if (error) throw error;

  await logEvento({
    azienda_id, operatore_id: p.operatore_id,
    evento: "riprende", stato_da: "pausa", stato_a: "attivo",
    commessa_id: mont.commessa_id, montaggio_id: mont.id,
    user_id: user.id,
  });
}

export async function stopLavoro(p: { operatore_id: string }): Promise<void> {
  const { user, azienda_id } = await getCtx();
  const today = new Date().toISOString().slice(0, 10);

  const { data: mont } = await supabase
    .from("montaggi")
    .select("id, commessa_id, avviato_at")
    .eq("azienda_id", azienda_id).eq("operatore_id", p.operatore_id)
    .eq("data_montaggio", today).eq("stato", "in_corso")
    .is("completato_at", null).maybeSingle();

  if (!mont?.id) throw new Error("Nessun lavoro in corso da chiudere");

  const oraFine = new Date();
  const oraFineHHMM = oraFine.toTimeString().slice(0, 5);

  const { error } = await supabase
    .from("montaggi")
    .update({
      stato: "completato",
      completato_at: oraFine.toISOString(),
      ora_fine: oraFineHHMM,
      motivo_pausa: null,
      updated_at: oraFine.toISOString(),
    })
    .eq("id", mont.id);
  if (error) throw error;

  await logEvento({
    azienda_id, operatore_id: p.operatore_id,
    evento: "stop", stato_da: "attivo", stato_a: "offline",
    commessa_id: mont.commessa_id, montaggio_id: mont.id,
    user_id: user.id,
  });
}

// =================== COMMESSE PER AVVIO ===================
export interface CommessaPerAvvio {
  id: string; code: string | null; cliente: string | null;
  cognome: string | null; indirizzo: string | null; fase: string | null;
}
export async function listaCommesseAttive(): Promise<CommessaPerAvvio[]> {
  const { azienda_id } = await getCtx();
  const { data, error } = await supabase
    .from("commesse")
    .select("id, code, cliente, cognome, indirizzo, fase")
    .eq("azienda_id", azienda_id)
    .is("archived_at", null).is("deleted_at", null).eq("ferma", false)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as CommessaPerAvvio[];
}

// =================== FASE 5A: PIANIFICAZIONE ===================
export interface MontaggioPianificato {
  id: string;
  data_montaggio: string;     // YYYY-MM-DD
  operatore_id: string | null;
  squadra: string[];           // array di operatore_id
  commessa_id: string | null;
  commessa_code: string | null;
  cliente: string | null;
  cognome: string | null;
  indirizzo: string | null;
  stato: string | null;
  ora_inizio: string | null;   // HH:MM:SS
  avviato_at: string | null;
  completato_at: string | null;
  motivo_pausa: string | null;
}

// Lista montaggi in finestra temporale (default: prossimi 7 giorni)
export async function listaMontaggiFinestra(p: { da: string; a: string }): Promise<MontaggioPianificato[]> {
  const { azienda_id } = await getCtx();
  const { data, error } = await supabase
    .from("montaggi")
    .select(`id, data_montaggio, operatore_id, squadra, commessa_id, stato,
             ora_inizio, avviato_at, completato_at, motivo_pausa,
             commesse:commessa_id (code, cliente, cognome, indirizzo)`)
    .eq("azienda_id", azienda_id)
    .gte("data_montaggio", p.da)
    .lte("data_montaggio", p.a)
    .order("data_montaggio", { ascending: true });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id,
    data_montaggio: m.data_montaggio,
    operatore_id: m.operatore_id,
    squadra: Array.isArray(m.squadra) ? m.squadra : [],
    commessa_id: m.commessa_id,
    commessa_code: m.commesse?.code || null,
    cliente: m.commesse?.cliente || null,
    cognome: m.commesse?.cognome || null,
    indirizzo: m.commesse?.indirizzo || null,
    stato: m.stato,
    ora_inizio: m.ora_inizio,
    avviato_at: m.avviato_at,
    completato_at: m.completato_at,
    motivo_pausa: m.motivo_pausa,
  }));
}

// Pianifica un montaggio (INSERT in montaggi con data futura)
export async function pianificaMontaggio(p: {
  operatore_id: string;
  commessa_id: string;
  data_montaggio: string;     // YYYY-MM-DD
  ora_inizio?: string;         // HH:MM
  squadra?: string[];          // optional, default [operatore_id]
}): Promise<{ id: string }> {
  const { azienda_id } = await getCtx();
  const { data, error } = await supabase
    .from("montaggi")
    .insert({
      azienda_id,
      operatore_id: p.operatore_id,
      commessa_id: p.commessa_id,
      data_montaggio: p.data_montaggio,
      stato: "programmato",
      ora_inizio: p.ora_inizio || null,
      squadra: p.squadra && p.squadra.length > 0 ? p.squadra : [p.operatore_id],
      timer_secondi: 0,
      pause_totali: 0,
    })
    .select("id").single();
  if (error) throw error;
  return { id: data.id };
}

// Sposta un montaggio (drag&drop)
export async function spostaMontaggio(p: {
  montaggio_id: string;
  nuova_data: string;
  nuovo_operatore_id?: string;
}): Promise<void> {
  const update: any = {
    data_montaggio: p.nuova_data,
    updated_at: new Date().toISOString(),
  };
  if (p.nuovo_operatore_id) {
    update.operatore_id = p.nuovo_operatore_id;
    update.squadra = [p.nuovo_operatore_id];
  }
  const { error } = await supabase.from("montaggi").update(update).eq("id", p.montaggio_id);
  if (error) throw error;
}
