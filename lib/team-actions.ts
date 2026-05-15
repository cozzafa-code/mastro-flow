// lib/team-actions.ts
// Mutations Supabase per il modulo TEAM. FASE 2 + 3 + 5A + 5B.
"use client";
import { supabase } from "@/lib/supabase";

async function getCtx() {
  // [galassia] Prova prima da localStorage (funziona senza auth Supabase)
  const azFromStorage = typeof window !== 'undefined'
    ? (sessionStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro_azienda_id'))
    : null;
  if (azFromStorage) return { user: null as any, azienda_id: azFromStorage };
  // Fallback: auth Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { data: prof } = await supabase
    .from("profili").select("azienda_id").eq("id", user.id).maybeSingle();
  if (!prof?.azienda_id) throw new Error("no_azienda");
  return { user, azienda_id: prof.azienda_id as string };
}

async function logEvento(p: {
  azienda_id: string; operatore_id: string;
  evento: "avvio" | "pausa" | "riprende" | "stop" | "note";
  stato_da?: string | null; stato_a?: string | null;
  commessa_id?: string | null; montaggio_id?: string | null;
  motivo?: string | null; note?: string | null; user_id?: string;
}) {
  try {
    await supabase.from("operatore_eventi_stato").insert({
      azienda_id: p.azienda_id,
      operatore_id: p.operatore_id,
      evento: p.evento,
      stato_da: p.stato_da || null, stato_a: p.stato_a || null,
      commessa_id: p.commessa_id || null,
      montaggio_id: p.montaggio_id || null,
      motivo: p.motivo || null, note: p.note || null,
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
  // ora_inizio e ora_fine sono NOT NULL in DB: applico default sensati
  const ora_inizio = input.ora_inizio || "09:00";
  // ora_fine: se non specificata, default = ora_inizio + 1h
  const oraFineDefault = (() => {
    const [h, m] = ora_inizio.split(":").map(Number);
    const next = new Date(); next.setHours(h + 1, m || 0, 0, 0);
    return `${next.getHours().toString().padStart(2,"0")}:${next.getMinutes().toString().padStart(2,"0")}`;
  })();
  const { data, error } = await supabase
    .from("agenda_eventi")
    .insert({
      azienda_id, user_id: user.id,
      operatore_id: input.operatore_id || null,
      operatore_nome: input.operatore_nome || null,
      cm_id: input.cm_id || null, cliente: input.cliente || null,
      titolo: input.titolo, note: input.note || null,
      giorno: input.giorno || today,
      ora_inizio,
      ora_fine: input.ora_fine || oraFineDefault,
      tipo: input.tipo || "task",
      stato: "programmato", luogo: input.luogo || null,
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
      risolta_da: user.id, nota_risoluzione: nota || null,
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
      titolo: input.titolo, descrizione: input.descrizione || null,
      severita: input.severita || "media",
      tipo: input.tipo || "manuale",
      origine: input.origine || "team_app",
      stato: "aperta", rilevata_at: new Date().toISOString(),
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
    .is("completato_at", null).maybeSingle();

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
  await logEvento({ azienda_id, operatore_id: p.operatore_id, evento: "avvio", stato_a: "attivo", commessa_id: p.commessa_id, montaggio_id, user_id: user.id });
  return { montaggio_id };
}

export async function pausaLavoro(p: { operatore_id: string; motivo?: string }): Promise<void> {
  const { user, azienda_id } = await getCtx();
  const today = new Date().toISOString().slice(0, 10);
  const { data: mont } = await supabase
    .from("montaggi").select("id, commessa_id")
    .eq("azienda_id", azienda_id).eq("operatore_id", p.operatore_id)
    .eq("data_montaggio", today).eq("stato", "in_corso")
    .is("completato_at", null).maybeSingle();
  if (!mont?.id) throw new Error("Nessun lavoro in corso da mettere in pausa");
  const { error } = await supabase
    .from("montaggi")
    .update({ motivo_pausa: p.motivo || "manuale", updated_at: new Date().toISOString() })
    .eq("id", mont.id);
  if (error) throw error;
  await logEvento({ azienda_id, operatore_id: p.operatore_id, evento: "pausa", stato_da: "attivo", stato_a: "pausa", commessa_id: mont.commessa_id, montaggio_id: mont.id, motivo: p.motivo, user_id: user.id });
}

export async function riprendiLavoro(p: { operatore_id: string }): Promise<void> {
  const { user, azienda_id } = await getCtx();
  const today = new Date().toISOString().slice(0, 10);
  const { data: mont } = await supabase
    .from("montaggi").select("id, commessa_id")
    .eq("azienda_id", azienda_id).eq("operatore_id", p.operatore_id)
    .eq("data_montaggio", today).eq("stato", "in_corso")
    .not("motivo_pausa", "is", null).is("completato_at", null).maybeSingle();
  if (!mont?.id) throw new Error("Nessuna pausa attiva da riprendere");
  const { error } = await supabase
    .from("montaggi")
    .update({ motivo_pausa: null, updated_at: new Date().toISOString() })
    .eq("id", mont.id);
  if (error) throw error;
  await logEvento({ azienda_id, operatore_id: p.operatore_id, evento: "riprende", stato_da: "pausa", stato_a: "attivo", commessa_id: mont.commessa_id, montaggio_id: mont.id, user_id: user.id });
}

export async function stopLavoro(p: { operatore_id: string }): Promise<void> {
  const { user, azienda_id } = await getCtx();
  const today = new Date().toISOString().slice(0, 10);
  const { data: mont } = await supabase
    .from("montaggi").select("id, commessa_id, avviato_at")
    .eq("azienda_id", azienda_id).eq("operatore_id", p.operatore_id)
    .eq("data_montaggio", today).eq("stato", "in_corso")
    .is("completato_at", null).maybeSingle();
  if (!mont?.id) throw new Error("Nessun lavoro in corso da chiudere");
  const oraFine = new Date();
  const { error } = await supabase
    .from("montaggi")
    .update({
      stato: "completato",
      completato_at: oraFine.toISOString(),
      ora_fine: oraFine.toTimeString().slice(0, 5),
      motivo_pausa: null, updated_at: oraFine.toISOString(),
    })
    .eq("id", mont.id);
  if (error) throw error;
  await logEvento({ azienda_id, operatore_id: p.operatore_id, evento: "stop", stato_da: "attivo", stato_a: "offline", commessa_id: mont.commessa_id, montaggio_id: mont.id, user_id: user.id });
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

// =================== PIANIFICAZIONE ===================
export interface MontaggioPianificato {
  id: string; data_montaggio: string;
  operatore_id: string | null; squadra: string[];
  commessa_id: string | null; commessa_code: string | null;
  cliente: string | null; cognome: string | null; indirizzo: string | null;
  stato: string | null; ora_inizio: string | null;
  avviato_at: string | null; completato_at: string | null;
  motivo_pausa: string | null;
}

export async function listaMontaggiFinestra(p: { da: string; a: string }): Promise<MontaggioPianificato[]> {
  const { azienda_id } = await getCtx();
  const { data, error } = await supabase
    .from("montaggi")
    .select(`id, data_montaggio, operatore_id, squadra, commessa_id, stato,
             ora_inizio, avviato_at, completato_at, motivo_pausa,
             commesse:commessa_id (code, cliente, cognome, indirizzo)`)
    .eq("azienda_id", azienda_id)
    .gte("data_montaggio", p.da).lte("data_montaggio", p.a)
    .order("data_montaggio", { ascending: true });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id, data_montaggio: m.data_montaggio,
    operatore_id: m.operatore_id,
    squadra: Array.isArray(m.squadra) ? m.squadra : [],
    commessa_id: m.commessa_id,
    commessa_code: m.commesse?.code || null,
    cliente: m.commesse?.cliente || null,
    cognome: m.commesse?.cognome || null,
    indirizzo: m.commesse?.indirizzo || null,
    stato: m.stato, ora_inizio: m.ora_inizio,
    avviato_at: m.avviato_at, completato_at: m.completato_at,
    motivo_pausa: m.motivo_pausa,
  }));
}

export async function pianificaMontaggio(p: {
  operatore_id: string; commessa_id: string;
  data_montaggio: string; ora_inizio?: string; squadra?: string[];
}): Promise<{ id: string }> {
  const { azienda_id } = await getCtx();
  const { data, error } = await supabase
    .from("montaggi")
    .insert({
      azienda_id, operatore_id: p.operatore_id, commessa_id: p.commessa_id,
      data_montaggio: p.data_montaggio, stato: "programmato",
      ora_inizio: p.ora_inizio || null,
      squadra: p.squadra && p.squadra.length > 0 ? p.squadra : [p.operatore_id],
      timer_secondi: 0, pause_totali: 0,
    })
    .select("id").single();
  if (error) throw error;
  return { id: data.id };
}

export async function spostaMontaggio(p: {
  montaggio_id: string; nuova_data: string; nuovo_operatore_id?: string;
}): Promise<void> {
  const update: any = { data_montaggio: p.nuova_data, updated_at: new Date().toISOString() };
  if (p.nuovo_operatore_id) {
    update.operatore_id = p.nuovo_operatore_id;
    update.squadra = [p.nuovo_operatore_id];
  }
  const { error } = await supabase.from("montaggi").update(update).eq("id", p.montaggio_id);
  if (error) throw error;
}

// =================== FASE 5B: SQUADRE ===================
export interface SquadraInput {
  nome: string;
  descrizione?: string;
  capo_squadra_id?: string | null;
  zona?: string;
  specializzazione?: string;
  colore?: string;
  attiva?: boolean;
}

export async function creaSquadra(input: SquadraInput, membri: string[] = []): Promise<{ id: string }> {
  const { azienda_id } = await getCtx();
  const { data: created, error } = await supabase
    .from("squadre")
    .insert({
      azienda_id,
      nome: input.nome,
      descrizione: input.descrizione || null,
      capo_squadra_id: input.capo_squadra_id || null,
      zona: input.zona || null,
      specializzazione: input.specializzazione || null,
      colore: input.colore || "#28A0A0",
      attiva: input.attiva ?? true,
    })
    .select("id").single();
  if (error) throw error;

  if (membri.length > 0) {
    const rows = membri.map(opId => ({
      azienda_id,
      squadra_id: created.id,
      team_id: opId,           // FK -> operatori.id (rinominato in fase5b)
      ruolo_in_squadra: opId === input.capo_squadra_id ? "capo" : "membro",
      data_ingresso: new Date().toISOString().slice(0, 10),
    }));
    const { error: errM } = await supabase.from("squadre_membri").insert(rows);
    if (errM) throw errM;
  }
  return { id: created.id };
}

export async function aggiornaSquadra(id: string, input: SquadraInput): Promise<void> {
  const { error } = await supabase
    .from("squadre")
    .update({
      nome: input.nome,
      descrizione: input.descrizione || null,
      capo_squadra_id: input.capo_squadra_id || null,
      zona: input.zona || null,
      specializzazione: input.specializzazione || null,
      colore: input.colore || null,
      attiva: input.attiva ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function eliminaSquadra(id: string): Promise<void> {
  // squadre_membri viene cancellato in cascata via FK
  const { error } = await supabase.from("squadre").delete().eq("id", id);
  if (error) throw error;
}

export async function aggiungiMembroSquadra(squadraId: string, operatoreId: string, ruolo?: string): Promise<void> {
  const { azienda_id } = await getCtx();
  const { error } = await supabase
    .from("squadre_membri")
    .insert({
      azienda_id,
      squadra_id: squadraId,
      team_id: operatoreId,
      ruolo_in_squadra: ruolo || "membro",
      data_ingresso: new Date().toISOString().slice(0, 10),
    });
  if (error) throw error;
}

export async function rimuoviMembroSquadra(squadraId: string, operatoreId: string): Promise<void> {
  // Soft remove: setta data_uscita
  const { error } = await supabase
    .from("squadre_membri")
    .update({ data_uscita: new Date().toISOString().slice(0, 10) })
    .eq("squadra_id", squadraId)
    .eq("team_id", operatoreId)
    .is("data_uscita", null);
  if (error) throw error;
}

// Sostituisce TUTTI i membri di una squadra
export async function setMembriSquadra(squadraId: string, operatorIds: string[], capoId?: string | null): Promise<void> {
  const { azienda_id } = await getCtx();
  // 1. Soft-remove tutti i membri attivi correnti
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("squadre_membri")
    .update({ data_uscita: today })
    .eq("squadra_id", squadraId)
    .is("data_uscita", null);
  // 2. Insert nuovi
  if (operatorIds.length > 0) {
    const rows = operatorIds.map(opId => ({
      azienda_id, squadra_id: squadraId, team_id: opId,
      ruolo_in_squadra: opId === capoId ? "capo" : "membro",
      data_ingresso: today,
    }));
    const { error } = await supabase.from("squadre_membri").insert(rows);
    if (error) throw error;
  }
}

export interface SquadraDettaglio {
  id: string; nome: string;
  descrizione: string | null;
  capo_squadra_id: string | null;
  zona: string | null;
  specializzazione: string | null;
  colore: string | null;
  attiva: boolean | null;
  membri_ids: string[];
}

export async function getSquadra(id: string): Promise<SquadraDettaglio | null> {
  const { data: sq, error } = await supabase
    .from("squadre")
    .select("id, nome, descrizione, capo_squadra_id, zona, specializzazione, colore, attiva")
    .eq("id", id).maybeSingle();
  if (error) throw error;
  if (!sq) return null;
  const { data: membri } = await supabase
    .from("squadre_membri")
    .select("team_id")
    .eq("squadra_id", id)
    .is("data_uscita", null);
  return { ...sq, membri_ids: (membri || []).map((m: any) => m.team_id) } as SquadraDettaglio;
}


// =================== FASE 5C: GPS / MAPPA ===================
export interface GPSSnapshot {
  operatore_id: string;
  lat: number;
  lng: number;
  accuracy_metri: number | null;
  velocita_kmh: number | null;
  batteria_percent: number | null;
  stato_dedotto: string | null;
  pingato_at: string;
}

// Ritorna l'ULTIMO snapshot GPS per ogni operatore dell'azienda (entro 24h)
export async function getUltimePosizioniGPS(): Promise<Record<string, GPSSnapshot>> {
  const { azienda_id } = await getCtx();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("gps_snapshots")
    .select("operatore_id, lat, lng, accuracy_metri, velocita_kmh, batteria_percent, stato_dedotto, pingato_at")
    .eq("azienda_id", azienda_id)
    .gte("pingato_at", since)
    .order("pingato_at", { ascending: false });
  if (error) throw error;
  const out: Record<string, GPSSnapshot> = {};
  (data || []).forEach((row: any) => {
    if (!out[row.operatore_id]) {
      out[row.operatore_id] = row as GPSSnapshot;
    }
  });
  return out;
}


// =================== FASE 5F: AVATAR OPERATORE ===================
export async function uploadOperatorAvatar(operatoreId: string, file: File): Promise<{ avatar_url: string }> {
  const { azienda_id } = await getCtx();

  if (file.size > 5 * 1024 * 1024) throw new Error("Immagine troppo grande (max 5 MB)");
  if (!file.type.startsWith("image/")) throw new Error("Devi caricare un'immagine");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "webp", "heic"].includes(ext) ? ext : "jpg";
  const path = `${azienda_id}/${operatoreId}/${Date.now()}.${safeExt}`;

  const { error: upErr } = await supabase.storage
    .from("operatori-avatar")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
  if (upErr) throw upErr;

  const { data: urlData } = supabase.storage
    .from("operatori-avatar")
    .getPublicUrl(path);
  const avatar_url = urlData.publicUrl;

  const { error: updErr } = await supabase
    .from("operatori")
    .update({ avatar_url })
    .eq("id", operatoreId)
    .eq("azienda_id", azienda_id);
  if (updErr) throw updErr;

  return { avatar_url };
}
