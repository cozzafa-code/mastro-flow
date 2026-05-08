// @ts-nocheck
//
// MASTRO Suite · TIMELINE LOGGER
// Helper centralizzato per loggare eventi nella timeline_universale
// Uso: import { logEvento } from "@/lib/timeline-logger";
//      await logEvento({ tipo: "appuntamento_creato", titolo: "...", ... });
//
import { supabase } from "@/lib/supabase";

// ═══ TIPI EVENTO MASTRO ═══
export const TIPI_EVENTO = {
  // Commessa
  COMMESSA_CREATA: "commessa_creata",
  COMMESSA_FASE_CAMBIATA: "commessa_fase_cambiata",
  COMMESSA_CHIUSA: "commessa_chiusa",

  // Vani / Misure
  VANO_CREATO: "vano_creato",
  VANO_MODIFICATO: "vano_modificato",
  VANO_COMPLETATO: "vano_completato",
  MISURA_AGGIUNTA: "misura_aggiunta",

  // Diario / Note
  DIARIO_CANTIERE: "diario_cantiere",
  NOTA_AGGIUNTA: "nota_aggiunta",

  // Allegati
  FOTO: "foto",
  DOCUMENTO: "documento",
  AUDIO_REGISTRATO: "audio_registrato",

  // Comunicazioni
  CHIAMATA: "chiamata",
  EMAIL_INVIATA: "email_inviata",
  EMAIL_RICEVUTA: "email_ricevuta",
  WHATSAPP_INVIATO: "whatsapp_inviato",
  SMS_INVIATO: "sms_inviato",

  // Preventivi
  PREVENTIVO_CREATO: "preventivo_creato",
  PREVENTIVO_INVIATO: "preventivo_inviato",
  PREVENTIVO_APERTO_CLIENTE: "preventivo_aperto_cliente",
  PREVENTIVO_FIRMATO: "preventivo_firmato",
  PREVENTIVO_RIFIUTATO: "preventivo_rifiutato",
  PREVENTIVO_MODIFICATO: "preventivo_modificato",

  // Firme
  FIRMA: "firma",
  FIRMA_RICHIESTA: "firma_richiesta",

  // Ordini fornitore
  ORDINE_EMESSO: "ordine_emesso",
  ORDINE_MODIFICATO: "ordine_modificato",
  ORDINE_ANNULLATO: "ordine_annullato",
  CONSEGNA: "consegna",
  RITARDO_CONSEGNA: "ritardo_consegna",
  CONTESTAZIONE: "contestazione",
  DDT_RICEVUTO: "ddt_ricevuto",

  // Pagamenti
  PAGAMENTO_RICEVUTO: "pagamento_ricevuto",
  PAGAMENTO_EMESSO: "pagamento_emesso",
  FATTURA_EMESSA: "fattura_emessa",
  FATTURA_PAGATA: "fattura_pagata",
  FATTURA_SCADUTA: "fattura_scaduta",
  SOLLECITO: "sollecito",

  // Agenda / Eventi
  APPUNTAMENTO_CREATO: "appuntamento_creato",
  APPUNTAMENTO_MODIFICATO: "appuntamento_modificato",
  APPUNTAMENTO_CANCELLATO: "appuntamento_cancellato",
  APPUNTAMENTO_COMPLETATO: "appuntamento_completato",

  // Montaggi
  MONTAGGIO_PROGRAMMATO: "montaggio_programmato",
  MONTAGGIO_INIZIATO: "montaggio_iniziato",
  MONTAGGIO_COMPLETATO: "montaggio_completato",

  // Squadra / Operatori
  TASK_ASSEGNATO: "task_assegnato",
  TASK_COMPLETATO: "task_completato",
  PRESENZA: "presenza",
  ASSENZA: "assenza",
  ORE_LAVORO: "ore_lavoro",

  // Cliente
  CLIENTE_CREATO: "cliente_creato",
  CLIENTE_MODIFICATO: "cliente_modificato",
  RECENSIONE: "recensione",

  // Fornitore
  FORNITORE_CREATO: "fornitore_creato",
  LISTINO_AGGIORNATO: "listino_aggiornato",

  // Sistema / IA
  AI_AZIONE: "ai_azione",
  AI_SUGGERIMENTO: "ai_suggerimento",
  CORREZIONE: "correzione", // per "annullare" eventi precedenti

  // Generico
  ALTRO: "altro",
} as const;

// ═══ INTERFACCIA PRINCIPALE ═══
export interface LogEventoParams {
  // Contesto: quale entità (richiesto)
  modulo: "commessa" | "cliente" | "fornitore" | "squadra" | "operatore" | "fattura" | "ordine" | "vano" | "preventivo" | "montaggio" | "altro";
  entitaId: string;
  aziendaId: string;

  // Evento (richiesto)
  tipo: string;
  titolo: string;

  // Dettagli (opzionali)
  descrizione?: string;
  autore_nome?: string;
  autore_ruolo?: string;
  autore_id?: string;
  stato?: "completato" | "in_corso" | "urgente" | "warning" | "info";
  documenti?: Array<{ nome: string; url?: string; size?: string; descrizione?: string }>;
  metadata?: any;
  riferimenti?: any;
  quando?: Date | string;

  // Cross-reference automatici (opzionali)
  commessa_id?: string;
  cliente_id?: string;
  fornitore_id?: string;
  fattura_id?: string;
  ordine_id?: string;
  vano_id?: string;
  squadra_id?: string;
  operatore_id?: string;
  preventivo_id?: string;
  montaggio_id?: string;
}

// ═══ FUNZIONE PRINCIPALE ═══
export async function logEvento(params: LogEventoParams): Promise<{ ok: boolean; id?: string; error?: any }> {
  if (!params.entitaId || !params.aziendaId) {
    console.warn("[timeline-logger] entitaId o aziendaId mancanti, evento non loggato");
    return { ok: false, error: "missing_required_fields" };
  }

  // Costruisco i riferimenti cross-modulo
  const riferimenti: any = { ...(params.riferimenti || {}) };
  if (params.commessa_id) riferimenti.commessa_id = params.commessa_id;
  if (params.cliente_id) riferimenti.cliente_id = params.cliente_id;
  if (params.fornitore_id) riferimenti.fornitore_id = params.fornitore_id;
  if (params.fattura_id) riferimenti.fattura_id = params.fattura_id;
  if (params.ordine_id) riferimenti.ordine_id = params.ordine_id;
  if (params.vano_id) riferimenti.vano_id = params.vano_id;
  if (params.squadra_id) riferimenti.squadra_id = params.squadra_id;
  if (params.operatore_id) riferimenti.operatore_id = params.operatore_id;
  if (params.preventivo_id) riferimenti.preventivo_id = params.preventivo_id;
  if (params.montaggio_id) riferimenti.montaggio_id = params.montaggio_id;

  // Quando: se non specificato, ora attuale
  let quandoIso: string;
  if (params.quando) {
    quandoIso = typeof params.quando === "string" ? params.quando : params.quando.toISOString();
  } else {
    quandoIso = new Date().toISOString();
  }

  try {
    const { data, error } = await supabase
      .from("timeline_universale")
      .insert({
        modulo: params.modulo,
        entita_id: params.entitaId,
        azienda_id: params.aziendaId,
        tipo: params.tipo,
        titolo: params.titolo,
        descrizione: params.descrizione || null,
        autore_nome: params.autore_nome || null,
        autore_ruolo: params.autore_ruolo || null,
        autore_id: params.autore_id || null,
        stato: params.stato || null,
        documenti: params.documenti || [],
        metadata: params.metadata || {},
        riferimenti,
        quando: quandoIso,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[timeline-logger] errore insert:", error);
      return { ok: false, error };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[timeline-logger] eccezione:", err);
    return { ok: false, error: err };
  }
}

// ═══ HELPER PER EVENTI COMUNI ═══

/**
 * Logga un appuntamento in agenda
 */
export async function logAppuntamento(params: {
  evento: any;       // record da agenda_eventi
  aziendaId: string;
  autore_nome: string;
  autore_ruolo?: string;
  azione: "creato" | "modificato" | "cancellato" | "completato";
}) {
  const tipoMap: any = {
    creato: TIPI_EVENTO.APPUNTAMENTO_CREATO,
    modificato: TIPI_EVENTO.APPUNTAMENTO_MODIFICATO,
    cancellato: TIPI_EVENTO.APPUNTAMENTO_CANCELLATO,
    completato: TIPI_EVENTO.APPUNTAMENTO_COMPLETATO,
  };

  const ev = params.evento;
  const titolo = `${params.azione === "creato" ? "📅" : params.azione === "completato" ? "✅" : params.azione === "cancellato" ? "❌" : "✏️"} Appuntamento ${params.azione}: ${ev.titolo || "evento"}`;

  return logEvento({
    modulo: "commessa",
    entitaId: ev.commessa_id || ev.cliente_id || ev.id,
    aziendaId: params.aziendaId,
    tipo: tipoMap[params.azione],
    titolo,
    descrizione: `${ev.data_inizio || ev.data} ${ev.ora_inizio || ev.ora || ""} · ${ev.luogo || ""}`,
    autore_nome: params.autore_nome,
    autore_ruolo: params.autore_ruolo || "titolare",
    stato: params.azione === "completato" ? "completato" : params.azione === "cancellato" ? "warning" : "info",
    metadata: {
      data: ev.data_inizio || ev.data,
      ora: ev.ora_inizio || ev.ora,
      luogo: ev.luogo,
      tipo_evento: ev.tipo,
    },
    commessa_id: ev.commessa_id,
    cliente_id: ev.cliente_id,
  });
}

/**
 * Logga una nota nel diario cantiere
 */
export async function logDiarioCantiere(params: {
  commessaId: string;
  aziendaId: string;
  autore_nome: string;
  autore_ruolo?: string;
  testo: string;
  tag?: string;
  foto?: Array<{ nome: string; url: string }>;
  cliente_id?: string;
}) {
  return logEvento({
    modulo: "commessa",
    entitaId: params.commessaId,
    aziendaId: params.aziendaId,
    tipo: TIPI_EVENTO.DIARIO_CANTIERE,
    titolo: `📓 ${params.tag ? `[${params.tag}] ` : ""}Nota cantiere`,
    descrizione: params.testo,
    autore_nome: params.autore_nome,
    autore_ruolo: params.autore_ruolo || "titolare",
    stato: "info",
    documenti: params.foto || [],
    metadata: { tag: params.tag },
    commessa_id: params.commessaId,
    cliente_id: params.cliente_id,
  });
}

/**
 * Logga un cambio fase commessa
 */
export async function logCambioFase(params: {
  commessaId: string;
  aziendaId: string;
  autore_nome: string;
  faseDa: string;
  faseA: string;
  cliente_id?: string;
}) {
  return logEvento({
    modulo: "commessa",
    entitaId: params.commessaId,
    aziendaId: params.aziendaId,
    tipo: TIPI_EVENTO.COMMESSA_FASE_CAMBIATA,
    titolo: `🔄 Fase: ${params.faseDa} → ${params.faseA}`,
    descrizione: `Commessa avanzata da "${params.faseDa}" a "${params.faseA}"`,
    autore_nome: params.autore_nome,
    autore_ruolo: "titolare",
    stato: "info",
    metadata: { fase_da: params.faseDa, fase_a: params.faseA },
    commessa_id: params.commessaId,
    cliente_id: params.cliente_id,
  });
}

/**
 * Logga un preventivo (qualsiasi azione)
 */
export async function logPreventivo(params: {
  preventivoId: string;
  commessaId: string;
  aziendaId: string;
  autore_nome: string;
  azione: "creato" | "inviato" | "aperto" | "firmato" | "rifiutato" | "modificato";
  importo?: number;
  destinatario?: { nome?: string; email?: string; telefono?: string };
  documenti?: Array<{ nome: string; url: string; size?: string }>;
  cliente_id?: string;
}) {
  const tipoMap: any = {
    creato: TIPI_EVENTO.PREVENTIVO_CREATO,
    inviato: TIPI_EVENTO.PREVENTIVO_INVIATO,
    aperto: TIPI_EVENTO.PREVENTIVO_APERTO_CLIENTE,
    firmato: TIPI_EVENTO.PREVENTIVO_FIRMATO,
    rifiutato: TIPI_EVENTO.PREVENTIVO_RIFIUTATO,
    modificato: TIPI_EVENTO.PREVENTIVO_MODIFICATO,
  };

  const emojiMap: any = {
    creato: "📋",
    inviato: "📧",
    aperto: "👁",
    firmato: "✍️",
    rifiutato: "❌",
    modificato: "✏️",
  };

  const statoMap: any = {
    creato: "info",
    inviato: "info",
    aperto: "in_corso",
    firmato: "completato",
    rifiutato: "urgente",
    modificato: "warning",
  };

  return logEvento({
    modulo: "commessa",
    entitaId: params.commessaId,
    aziendaId: params.aziendaId,
    tipo: tipoMap[params.azione],
    titolo: `${emojiMap[params.azione]} Preventivo ${params.azione}`,
    descrizione: params.importo ? `Importo: € ${params.importo.toFixed(2)}` : undefined,
    autore_nome: params.autore_nome,
    autore_ruolo: params.azione === "firmato" || params.azione === "aperto" || params.azione === "rifiutato" ? "cliente" : "titolare",
    stato: statoMap[params.azione],
    documenti: params.documenti || [],
    metadata: {
      importo: params.importo,
      destinatario: params.destinatario,
    },
    commessa_id: params.commessaId,
    cliente_id: params.cliente_id,
    preventivo_id: params.preventivoId,
  });
}

/**
 * Logga una correzione (annullamento logico di evento precedente)
 * NB: l'evento originale NON viene cancellato (timeline immutabile)
 */
export async function logCorrezione(params: {
  modulo: any;
  entitaId: string;
  aziendaId: string;
  autore_nome: string;
  evento_da_annullare_id: string;
  motivo: string;
}) {
  return logEvento({
    modulo: params.modulo,
    entitaId: params.entitaId,
    aziendaId: params.aziendaId,
    tipo: TIPI_EVENTO.CORREZIONE,
    titolo: `⚠️ Correzione`,
    descrizione: params.motivo,
    autore_nome: params.autore_nome,
    autore_ruolo: "titolare",
    stato: "warning",
    metadata: {
      annulla_evento_id: params.evento_da_annullare_id,
      motivo: params.motivo,
    },
  });
}
