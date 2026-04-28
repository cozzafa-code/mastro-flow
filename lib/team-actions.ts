// lib/team-actions.ts
// Mutations Supabase per il modulo TEAM. Usate da TeamMobile + sheets.
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

// =================== TASK / EVENTO AGENDA ===================
// Usato da: bottone "Task" su card operatore + FAB "Nuovo task"
// Scrive su agenda_eventi.
export interface NewTaskInput {
  operatore_id?: string;
  operatore_nome?: string;
  cm_id?: string;
  cliente?: string;
  titolo: string;
  note?: string;
  giorno?: string;          // "YYYY-MM-DD" (default oggi)
  ora_inizio?: string;      // "HH:MM" (default null)
  ora_fine?: string;
  tipo?: string;            // default "task"
  luogo?: string;
}
export async function submitTask(input: NewTaskInput): Promise<{ id: string }> {
  const { user, azienda_id } = await getCtx();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("agenda_eventi")
    .insert({
      azienda_id,
      user_id: user.id,
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
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

// =================== RISOLVI ANOMALIA ===================
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

// =================== CREA ANOMALIA / PROBLEMA ===================
export interface NewAnomaliaInput {
  operatore_id?: string;
  commessa_id?: string;
  titolo: string;
  descrizione?: string;
  severita?: "bassa" | "media" | "alta" | "critica";
  tipo?: string;
  origine?: string;
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
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}
