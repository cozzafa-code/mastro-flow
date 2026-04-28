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
  commessaCode?: string;
  cliente?: string;
  ordineCode?: string;
  indirizzo?: string;
  squadra?: string;
  persone?: string[];
  descrizione?: string;
  stato?: AgendaEventStatus;
  note?: string;
  cmId?: string;
  taskId?: string;
}

export interface AgendaFilters {
  showMontaggi: boolean;
  showSopralluoghi: boolean;
  showProduzioni: boolean;
  showProblemi: boolean;
  showCompletate: boolean;
  squadre: string[];
  persone: string[];
}

export type AgendaView = "giorno" | "settimana" | "mese" | "problemi";

// Colori PASTELLO ESATTI dal mockup:
// - bg = sfondo card pastello molto chiaro
// - bd = bordo sinistro
// - tx = testo titolo tipo (es. "MONTAGGIO")
// - chip = pill tag come "IN PRODUZIONE", "Risolvi"
// - chipTx = testo del chip
export const TIPO_COLORS: Record<AgendaEventType, { bg: string; bd: string; tx: string; chip: string; chipTx: string; dot: string }> = {
  montaggio:   { bg: "#E5F6EC", bd: "#5FBA7D", tx: "#2F8C56", chip: "#D4EFDD", chipTx: "#2F8C56", dot: "#5FBA7D" },
  sopralluogo: { bg: "#E6EEFB", bd: "#7AA0E0", tx: "#3F66B2", chip: "#D4E0F5", chipTx: "#3F66B2", dot: "#7AA0E0" },
  produzione:  { bg: "#FFF1DB", bd: "#F0A658", tx: "#B36B1F", chip: "#FCE4C2", chipTx: "#B36B1F", dot: "#F0A658" },
  problema:    { bg: "#FFE6E9", bd: "#F08599", tx: "#C0445D", chip: "#FCD2D9", chipTx: "#C0445D", dot: "#F08599" },
  task:        { bg: "#EFEAF7", bd: "#A78EC9", tx: "#6E54A0", chip: "#E0D6F0", chipTx: "#6E54A0", dot: "#A78EC9" },
};

export const TIPO_LABEL: Record<AgendaEventType, string> = {
  montaggio: "MONTAGGIO",
  sopralluogo: "SOPRALLUOGO",
  produzione: "PRODUZIONE",
  problema: "PROBLEMA",
  task: "TASK",
};

// Theme fliwoX
export const T = {
  acc: "#28A0A0",
  accDk: "#1A7A7A",
  bg: "#F5F8F8",
  card: "#FFFFFF",
  bdr: "#E4F2F2",
  text: "#0D1F1F",
  sub: "#71717A",
  // Gradient header agenda — tono medio non troppo scuro come da mockup
  headerGrad: "linear-gradient(160deg, #1F8B8B 0%, #176868 60%, #0F4040 100%)",
};
