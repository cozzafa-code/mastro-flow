"use client";
import React from "react";

const TEAL = "#28A0A0";
const DARK = "#0D1F1F";
const AMBER = "#F5A030";
const RED = "#DC4444";

type Cat = "LAVORO" | "SOLDI" | "TEAM" | "AGENDA" | "COMUNICAZIONE" | "PRODUZIONE" | "KPI";

export interface WidgetMeta {
  id: string;
  label: string;
  category: Cat;
  description: string;
  iconPath: React.ReactNode;
}

const P = {
  check: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>,
  team: <><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="17" cy="7" r="3"/></>,
  alert: <><path d="M12 2L1 21h22L12 2z"/><line x1="12" y1="9" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17.01"/></>,
  wallet: <><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  msg: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  folder: <><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></>,
};

export const WIDGET_CATALOG: WidgetMeta[] = [
  { id: "oggi_devi_fare", label: "Oggi devi fare", category: "LAVORO", description: "Task urgenti del giorno", iconPath: P.check },
  { id: "lavori_in_corso", label: "Lavori in corso", category: "LAVORO", description: "Commesse attive", iconPath: P.folder },
  { id: "preventivi_scadenza", label: "Preventivi in scadenza", category: "LAVORO", description: "Offerte che stanno per scadere", iconPath: P.clock },
  { id: "preventivi_da_inviare", label: "Preventivi da inviare", category: "LAVORO", description: "Bozze ancora non spedite", iconPath: P.folder },
  { id: "rilievi_da_confermare", label: "Rilievi da confermare", category: "LAVORO", description: "Sopralluoghi in attesa conferma", iconPath: P.check },
  { id: "commesse_ritardo", label: "Commesse in ritardo", category: "LAVORO", description: "Lavori oltre la scadenza", iconPath: P.alert },
  { id: "prossime_consegne", label: "Prossime consegne", category: "LAVORO", description: "Consegne materiali previste", iconPath: P.calendar },
  { id: "pipeline_commesse", label: "Pipeline commesse", category: "LAVORO", description: "Distribuzione per fase", iconPath: P.folder },
  { id: "ordini_attesa", label: "Ordini in attesa", category: "LAVORO", description: "Ordini fornitori non confermati", iconPath: P.folder },
  { id: "ordini_settimana", label: "Consegne settimana", category: "LAVORO", description: "Materiali in arrivo 7gg", iconPath: P.calendar },
  { id: "fatture_incassare", label: "Fatture da incassare", category: "SOLDI", description: "Totale non ancora pagato", iconPath: P.wallet },
  { id: "fatture_scadute", label: "Fatture scadute", category: "SOLDI", description: "Insoluti attivi", iconPath: P.alert },
  { id: "spese_mese", label: "Spese del mese", category: "SOLDI", description: "Uscite mese corrente", iconPath: P.wallet },
  { id: "fatturato_mese", label: "Fatturato del mese", category: "SOLDI", description: "Ricavi mese corrente", iconPath: P.wallet },
  { id: "pagamenti_arrivo", label: "Pagamenti in arrivo", category: "SOLDI", description: "Incassi previsti 7gg", iconPath: P.wallet },
  { id: "margine_medio", label: "Margine medio", category: "SOLDI", description: "Marginalita media commesse", iconPath: P.wallet },
  { id: "clienti_insolventi", label: "Clienti insolventi", category: "SOLDI", description: "Chi non paga oltre scadenza", iconPath: P.alert },
  { id: "iva_versare", label: "IVA da versare", category: "SOLDI", description: "Prossima scadenza fiscale", iconPath: P.wallet },
  { id: "top_clienti", label: "Top 5 clienti", category: "SOLDI", description: "Classifica fatturato", iconPath: P.team },
  { id: "squadra", label: "Squadra", category: "TEAM", description: "Operatori in cantiere ora", iconPath: P.team },
  { id: "chi_libero", label: "Chi e libero oggi", category: "TEAM", description: "Operatori senza assegnazioni", iconPath: P.team },
  { id: "montaggi_settimana", label: "Montaggi settimana", category: "TEAM", description: "Programmazione 7gg", iconPath: P.calendar },
  { id: "task_team", label: "Task del team", category: "TEAM", description: "Compiti assegnati aperti", iconPath: P.check },
  { id: "presenze_mese", label: "Presenze del mese", category: "TEAM", description: "Ore lavorate team", iconPath: P.clock },
  { id: "squadra_top", label: "Squadra piu produttiva", category: "TEAM", description: "Ranking montaggi completati", iconPath: P.team },
  { id: "eventi_oggi", label: "Eventi di oggi", category: "AGENDA", description: "Agenda del giorno", iconPath: P.calendar },
  { id: "agenda_ios_s", label: "Agenda · Compatto", category: "AGENDA", description: "Prossimo appuntamento, vista S", iconPath: P.calendar },
  { id: "agenda_ios_m", label: "Agenda · Standard", category: "AGENDA", description: "Prossimo + azioni rapide, vista M", iconPath: P.calendar },
  { id: "agenda_ios_l", label: "Agenda · Esteso", category: "AGENDA", description: "Giornata completa con timeline scrollabile, vista L", iconPath: P.calendar },
  { id: "prossimi_7gg", label: "Prossimi 7 giorni", category: "AGENDA", description: "Vista settimanale", iconPath: P.calendar },
  { id: "scadenze_importanti", label: "Scadenze importanti", category: "AGENDA", description: "Deadline critiche", iconPath: P.alert },
  { id: "appuntamenti_clienti", label: "Appuntamenti clienti", category: "AGENDA", description: "Meeting programmati", iconPath: P.team },
  { id: "sopralluoghi", label: "Sopralluoghi programmati", category: "AGENDA", description: "Rilievi da fare", iconPath: P.calendar },
  { id: "messaggi_non_letti", label: "Messaggi non letti", category: "COMUNICAZIONE", description: "Chat con non letti", iconPath: P.msg },
  { id: "note_recenti", label: "Note recenti", category: "COMUNICAZIONE", description: "Ultime annotazioni", iconPath: P.msg },
  { id: "produzione", label: "Produzione", category: "PRODUZIONE", description: "Avvisi e problemi attivi", iconPath: P.alert },
  { id: "recensioni", label: "Recensioni clienti", category: "COMUNICAZIONE", description: "Feedback ricevuti", iconPath: P.msg },
  { id: "contatti_recenti", label: "Ultimi contatti", category: "COMUNICAZIONE", description: "Clienti aggiunti di recente", iconPath: P.team },
  { id: "stato_produzione", label: "Stato produzione", category: "PRODUZIONE", description: "Avanzamento ordini fornitore", iconPath: P.folder },
  { id: "materiali_arrivo", label: "Materiali in arrivo", category: "PRODUZIONE", description: "Forniture attese", iconPath: P.folder },
  { id: "scorte_basse", label: "Scorte basse", category: "PRODUZIONE", description: "Articoli sotto soglia", iconPath: P.alert },
  { id: "commesse_bloccate", label: "Commesse bloccate", category: "PRODUZIONE", description: "Lavori fermi per materiale", iconPath: P.alert },
  { id: "conversione_preventivi", label: "Conversione preventivi", category: "KPI", description: "Percentuale offerte convertite", iconPath: P.wallet },
  { id: "tempo_medio_chiusura", label: "Tempo medio chiusura", category: "KPI", description: "Giorni da rilievo a collaudo", iconPath: P.clock },
  { id: "clienti_nuovi", label: "Clienti nuovi del mese", category: "KPI", description: "Acquisizioni mese corrente", iconPath: P.team },
  { id: "confronto_mese", label: "Confronto mese", category: "KPI", description: "Mese corrente vs precedente", iconPath: P.wallet },
];

export const WIDGET_BY_ID: Record<string, WidgetMeta> =
  WIDGET_CATALOG.reduce((acc, w) => ({ ...acc, [w.id]: w }), {});

export const CATEGORIES: Cat[] = ["LAVORO", "SOLDI", "TEAM", "AGENDA", "COMUNICAZIONE", "PRODUZIONE", "KPI"];

export const CATEGORY_COLORS: Record<Cat, string> = {
  LAVORO: TEAL, SOLDI: AMBER, TEAM: "#8BC443",
  AGENDA: "#7B61FF", COMUNICAZIONE: "#5AAEE0",
  PRODUZIONE: RED, KPI: DARK,
};
