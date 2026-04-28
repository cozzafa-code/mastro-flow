// lib/types/agenda.ts
export type AgendaEventType = "montaggio" | "sopralluogo" | "produzione" | "problema" | "task";

export type AgendaEventStatus = "conferma" | "in_corso" | "completato" | "bloccato" | "in_produzione";

export interface AgendaEvent {
  id: string;
  tipo: AgendaEventType;
  oraInizio: string; // "HH:MM"
  oraFine: string;   // "HH:MM"
  data: string;      // "YYYY-MM-DD"
  titolo: string;
  // riferimenti opzionali
  commessaCode?: string;
  cliente?: string;
  ordineCode?: string;
  indirizzo?: string;
  squadra?: string;
  persone?: string[];
  descrizione?: string;
  stato?: AgendaEventStatus;
  note?: string;
  // collegamenti
  cmId?: string;
  taskId?: string;
}

export interface AgendaFilters {
  showMontaggi: boolean;
  showSopralluoghi: boolean;
  showProduzioni: boolean;
  showProblemi: boolean;
  showCompletate: boolean;
  squadre: string[]; // [] = tutte
  persone: string[]; // [] = tutte
}

export type AgendaView = "giorno" | "settimana" | "mese" | "problemi";

export const TIPO_COLORS: Record<AgendaEventType, { bg: string; bd: string; tx: string; soft: string }> = {
  montaggio:   { bg: "#DCF5E7", bd: "#15803D", tx: "#15803D", soft: "#EAFAF1" },
  sopralluogo: { bg: "#DBEAFE", bd: "#2563EB", tx: "#1D4ED8", soft: "#EEF4FE" },
  produzione:  { bg: "#FEF0DB", bd: "#D97706", tx: "#B45309", soft: "#FFF8EC" },
  problema:    { bg: "#FFE4E6", bd: "#E11D48", tx: "#BE123C", soft: "#FFF1F2" },
  task:        { bg: "#EDE9FE", bd: "#7C3AED", tx: "#6D28D9", soft: "#F5F3FF" },
};

export const TIPO_LABEL: Record<AgendaEventType, string> = {
  montaggio: "MONTAGGIO",
  sopralluogo: "SOPRALLUOGO",
  produzione: "PRODUZIONE",
  problema: "PROBLEMA",
  task: "TASK",
};
