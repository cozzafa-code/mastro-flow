// lib/types/agenda.ts
export type AgendaEventType =
  | "montaggio" | "sopralluogo" | "produzione" | "problema" | "task"
  | "preventivo" | "firma" | "acconto" | "saldo" | "pagata";

export type AgendaEventStatus = "conferma" | "in_corso" | "completato" | "bloccato" | "in_produzione" | "urgente";

export interface AgendaEvent {
  id: string;
  tipo: AgendaEventType;
  oraInizio: string;
  oraFine: string;
  data: string;
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
  giorniDaInvio?: number;
  giorniAllaScadenza?: number;
  importo?: number;
  isAllDay?: boolean;
}

export interface AgendaFilters {
  showMontaggi: boolean;
  showSopralluoghi: boolean;
  showProduzioni: boolean;
  showProblemi: boolean;
  showCompletate: boolean;
  showPreventivi: boolean;
  showFirme: boolean;
  showAcconti: boolean;
  showSaldi: boolean;
  showPagate: boolean;
  squadre: string[];
  persone: string[];
}

export type AgendaView = "giorno" | "settimana" | "mese" | "problemi";

// ─── PALETTE NAVY 50/20 (allineata al resto dell'app) ──────────────
// Ogni tipo ha: bg (sfondo card), bd (bordo sx 4px), tx (testo accent),
// chip (sfondo pill stato), chipTx (testo pill), dot (pallino mese)
// soft (background ridotto per griglia settimanale)
export const TIPO_COLORS: Record<AgendaEventType, { bg: string; bd: string; tx: string; chip: string; chipTx: string; dot: string; soft: string }> = {
  // Operativi
  montaggio:   { bg: "#DBE6F1", bd: "#1E3A5F", tx: "#1E3A5F", chip: "#C7D8EA", chipTx: "#1E3A5F", dot: "#1E3A5F", soft: "#EAF1F8" },
  sopralluogo: { bg: "#E0EAF6", bd: "#2D5A87", tx: "#1E3A5F", chip: "#CCDBE9", chipTx: "#1E3A5F", dot: "#2D5A87", soft: "#EEF3FA" },
  produzione:  { bg: "#FEF3C7", bd: "#92400E", tx: "#92400E", chip: "#FCE5A1", chipTx: "#92400E", dot: "#92400E", soft: "#FEF8DD" },
  problema:    { bg: "#FEE2E2", bd: "#991B1B", tx: "#991B1B", chip: "#FCC9C9", chipTx: "#991B1B", dot: "#991B1B", soft: "#FEEDED" },
  task:        { bg: "#F1F5F9", bd: "#475A75", tx: "#475A75", chip: "#E2E8F0", chipTx: "#475A75", dot: "#475A75", soft: "#F8FAFC" },
  // Documentali
  preventivo:  { bg: "#FEF3C7", bd: "#92400E", tx: "#92400E", chip: "#FCE5A1", chipTx: "#92400E", dot: "#92400E", soft: "#FEF8DD" },
  firma:       { bg: "#FEF3C7", bd: "#B45309", tx: "#92400E", chip: "#FCE5A1", chipTx: "#92400E", dot: "#B45309", soft: "#FEF8DD" },
  acconto:     { bg: "#DBE6F1", bd: "#1E3A5F", tx: "#1E3A5F", chip: "#C7D8EA", chipTx: "#1E3A5F", dot: "#1E3A5F", soft: "#EAF1F8" },
  saldo:       { bg: "#E0EAF6", bd: "#2D5A87", tx: "#1E3A5F", chip: "#CCDBE9", chipTx: "#1E3A5F", dot: "#2D5A87", soft: "#EEF3FA" },
  pagata:      { bg: "#ECFDF5", bd: "#065F46", tx: "#065F46", chip: "#D1FAE5", chipTx: "#065F46", dot: "#065F46", soft: "#F4FFF9" },
};

export const TIPO_LABEL: Record<AgendaEventType, string> = {
  montaggio: "MONTAGGIO",
  sopralluogo: "SOPRALLUOGO",
  produzione: "PRODUZIONE",
  problema: "PROBLEMA",
  task: "TASK",
  preventivo: "PREVENTIVO",
  firma: "DA FIRMARE",
  acconto: "ACCONTO",
  saldo: "SALDO",
  pagata: "PAGATA",
};

// ─── TOKEN GLOBALI navy 50/20 ──────────────────────────────────────
export const T = {
  acc:    "#1E3A5F",   // navy primario
  accDk:  "#0F1B2D",   // navy scuro
  bg:     "#94A3B8",   // grigio acciaio body
  card:   "#FFFFFF",
  bdr:    "#CBD5E1",
  text:   "#0A1628",
  sub:    "#475A75",
  // Header gradient: navy 50/20 (matches all other panels)
  headerGrad: "linear-gradient(160deg, #1E3A5F 0%, #0F1B2D 100%)",
};
