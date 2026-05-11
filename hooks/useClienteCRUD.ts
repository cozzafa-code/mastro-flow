"use client";
// hooks/useClienteCRUD.ts - CRUD completo cliente + entità collegate

import { supabase } from "@/lib/supabase";

// ============== CLIENTI ==============
export interface ClienteInput {
  azienda_id: string;
  nome: string;
  cognome?: string;
  tipo?: string;
  telefono?: string | null;
  email?: string | null;
  indirizzo?: string | null;
  citta?: string | null;
  cap?: string | null;
  provincia?: string | null;
  codice_fiscale?: string | null;
  stato_cliente?: 'attivo' | 'storico' | 'dormiente' | 'prospect' | 'perso';
  livello_priorita?: 'premium' | 'alto' | 'medio' | 'basso';
  tipologia_relazione?: string[];
  tag_emozionali?: string[];
  preferenze_contatto?: any;
  professione?: string | null;
  settore_lavorativo?: string | null;
  circolo_sociale?: string | null;
  data_nascita?: string | null;
  prossima_azione?: string | null;
  prossima_azione_data?: string | null;
  foto_url?: string | null;
  referral_from_id?: string | null;
}

export async function creaCliente(input: ClienteInput) {
  const payload: any = { ...input };
  payload.tipo = payload.tipo || 'cliente';
  payload.stato_cliente = payload.stato_cliente || 'prospect';
  payload.livello_priorita = payload.livello_priorita || 'medio';
  payload.tipologia_relazione = payload.tipologia_relazione || [];
  payload.tag_emozionali = payload.tag_emozionali || [];
  payload.preferenze_contatto = payload.preferenze_contatto || {};
  payload.affidabilita_pct = 100;
  
  return await supabase.from('contatti').insert(payload).select().single();
}

export async function aggiornaCliente(id: string, patch: Partial<ClienteInput>) {
  return await supabase.from('contatti').update(patch).eq('id', id).select().single();
}

export async function eliminaCliente(id: string) {
  // Verifica se cliente ha commesse attive
  const { data: cm } = await supabase.from('commesse')
    .select('id, code, fase')
    .eq('cliente_contatto_id', id)
    .not('fase', 'in', '(completato,annullato)');
  
  if (cm && cm.length > 0) {
    return { 
      error: { message: `Cliente ha ${cm.length} commesse attive. Completale o annullale prima.` },
      commesseAttive: cm 
    };
  }
  
  return await supabase.from('contatti').delete().eq('id', id);
}

// ============== IMMOBILI ==============
export interface ImmobileInput {
  azienda_id: string;
  cliente_id: string;
  nome: string;
  tipo?: string;
  indirizzo?: string | null;
  citta?: string | null;
  cap?: string | null;
  provincia?: string | null;
  mq_totali?: number | null;
  num_piani?: number;
  num_vani_totali?: number;
  anno_costruzione?: number | null;
  note?: string | null;
  primario?: boolean;
  foto_url?: string | null;
  planimetria_url?: string | null;
}

export async function creaImmobile(input: ImmobileInput) {
  return await supabase.from('clienti_immobili').insert(input).select().single();
}

export async function aggiornaImmobile(id: string, patch: Partial<ImmobileInput>) {
  return await supabase.from('clienti_immobili').update(patch).eq('id', id).select().single();
}

export async function eliminaImmobile(id: string) {
  return await supabase.from('clienti_immobili').delete().eq('id', id);
}

// ============== INFISSI INSTALLATI ==============
export interface InfissoInput {
  azienda_id: string;
  cliente_id: string;
  immobile_id?: string | null;
  commessa_id?: string | null;
  nome_vano?: string | null;
  stanza?: string | null;
  piano?: string | null;
  tipo?: string | null;
  sistema?: string | null;
  sottosistema?: string | null;
  pezzi?: number;
  larghezza_mm?: number | null;
  altezza_mm?: number | null;
  marca_profilo?: string | null;
  serie_profilo?: string | null;
  colore_int?: string | null;
  colore_est?: string | null;
  ral_int?: string | null;
  ral_est?: string | null;
  vetro_tipo?: string | null;
  vetro_uw?: number | null;
  vetro_ug?: number | null;
  ferramenta_marca?: string | null;
  ferramenta_modello?: string | null;
  motore_marca?: string | null;
  motore_modello?: string | null;
  cassonetto?: boolean;
  persiana?: boolean;
  zanzariera?: boolean;
  data_installazione: string;
  garanzia_fino?: string | null;
  note?: string | null;
}

export async function creaInfisso(input: InfissoInput) {
  return await supabase.from('infissi_installati').insert(input).select().single();
}

export async function aggiornaInfisso(id: string, patch: Partial<InfissoInput>) {
  return await supabase.from('infissi_installati').update(patch).eq('id', id).select().single();
}

export async function eliminaInfisso(id: string) {
  return await supabase.from('infissi_installati').delete().eq('id', id);
}

// ============== MODIFICHE INFISSI ==============
export async function aggiungiModificaInfisso(payload: {
  azienda_id: string;
  infisso_id: string;
  tipo_modifica: 'sostituzione' | 'riparazione' | 'manutenzione' | 'regolazione';
  descrizione: string;
  costo?: number;
  data_modifica?: string;
  autore?: string;
}) {
  const ins = await supabase.from('infissi_modifiche').insert(payload).select().single();
  // Auto-update infisso modificato=true
  if (!ins.error) {
    await supabase.from('infissi_installati').update({
      modificato: true,
      ultima_modifica_at: new Date().toISOString(),
      ultima_modifica_descr: payload.descrizione.substring(0, 200),
    }).eq('id', payload.infisso_id);
  }
  return ins;
}

// ============== DECISORI (in JSONB contatti) ==============
export async function aggiungiDecisore(clienteId: string, decisore: { nome: string; ruolo: string; peso_decisionale: string; note?: string }) {
  const { data: cli } = await supabase.from('contatti').select('decisori').eq('id', clienteId).single();
  const decisori = Array.isArray(cli?.decisori) ? cli.decisori : [];
  decisori.push(decisore);
  return await supabase.from('contatti').update({ decisori }).eq('id', clienteId);
}

export async function rimuoviDecisore(clienteId: string, idx: number) {
  const { data: cli } = await supabase.from('contatti').select('decisori').eq('id', clienteId).single();
  const decisori = Array.isArray(cli?.decisori) ? cli.decisori : [];
  decisori.splice(idx, 1);
  return await supabase.from('contatti').update({ decisori }).eq('id', clienteId);
}

// ============== DOCUMENTI ==============
export async function aggiungiDocumento(payload: {
  azienda_id: string;
  cliente_id: string;
  commessa_id?: string | null;
  tipo: string;
  nome_file: string;
  url: string;
  firmato?: boolean;
  firmato_da?: string;
  data_documento?: string;
  note?: string;
}) {
  const p: any = { ...payload };
  if (p.firmato) p.firmato_at = new Date().toISOString();
  return await supabase.from('cliente_documenti').insert(p).select().single();
}

export async function eliminaDocumento(id: string) {
  return await supabase.from('cliente_documenti').delete().eq('id', id);
}

// ============== COMUNICAZIONI ==============
export async function aggiungiComunicazione(payload: {
  azienda_id: string;
  cliente_id: string;
  commessa_id?: string | null;
  canale: string;
  direzione: 'in' | 'out' | 'interno';
  contenuto: string;
  oggetto?: string;
  durata_secondi?: number;
  foto_url?: string;
  data_comunicazione?: string;
  autore?: string;
  rispondere?: boolean;
}) {
  return await supabase.from('cliente_comunicazioni').insert(payload).select().single();
}

// ============== EVENTI (note diario) ==============
export async function eliminaEvento(id: string) {
  return await supabase.from('cliente_eventi').delete().eq('id', id);
}

export async function aggiornaEvento(id: string, patch: { titolo?: string; descrizione?: string; pinnato?: boolean }) {
  return await supabase.from('cliente_eventi').update(patch).eq('id', id);
}

// ============== PROSSIMA AZIONE ==============
export async function aggiornaProssimaAzione(clienteId: string, azione: string | null, data?: string | null) {
  return await supabase.from('contatti').update({
    prossima_azione: azione,
    prossima_azione_data: data,
  }).eq('id', clienteId);
}

export async function segnaProssimaAzioneFatta(clienteId: string) {
  // Sposta in eventi e azzera prossima_azione
  const { data: cli } = await supabase.from('contatti').select('azienda_id, prossima_azione').eq('id', clienteId).single();
  if (cli?.prossima_azione) {
    await supabase.from('cliente_eventi').insert({
      azienda_id: cli.azienda_id,
      cliente_id: clienteId,
      categoria: 'nota',
      tipo: 'azione_completata',
      titolo: `Azione completata: ${cli.prossima_azione}`,
      icona: '',
      colore: '#10B981',
      severity: 'success',
      automatico: true,
      source: 'sistema',
    });
  }
  return await supabase.from('contatti').update({
    prossima_azione: null,
    prossima_azione_data: null,
  }).eq('id', clienteId);
}
