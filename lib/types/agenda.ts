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

export const TIPO_COLORS: Record<AgendaEventType, { bg: string; bd: string; tx: string; chip: string; chipTx: string; dot: string }> = {
  montaggio:   { bg: "#E5F6EC", bd: "#5FBA7D", tx: "#2F8C56", chip: "#D4EFDD", chipTx: "#2F8C56", dot: "#5FBA7D" },
  sopralluogo: { bg: "#E6EEFB", bd: "#7AA0E0", tx: "#3F66B2", chip: "#D4E0F5", chipTx: "#3F66B2", dot: "#7AA0E0" },
  produzione:  { bg: "#FFF1DB", bd: "#F0A658", tx: "#B36B1F", chip: "#FCE4C2", chipTx: "#B36B1F", dot: "#F0A658" },
  problema:    { bg: "#FFE6E9", bd: "#F08599", tx: "#C0445D", chip: "#FCD2D9", chipTx: "#C0445D", dot: "#F08599" },
  task:        { bg: "#EFEAF7", bd: "#A78EC9", tx: "#6E54A0", chip: "#E0D6F0", chipTx: "#6E54A0", dot: "#A78EC9" },
  preventivo:  { bg: "#FFF8E1", bd: "#E5B23A", tx: "#9C7A1A", chip: "#FCEBB0", chipTx: "#9C7A1A", dot: "#E5B23A" },
  firma:       { bg: "#FCE6F2", bd: "#D459A2", tx: "#9C2E7A", chip: "#F7CCE2", chipTx: "#9C2E7A", dot: "#D459A2" },
  acconto:     { bg: "#E0F2EE", bd: "#28A0A0", tx: "#1A6B6B", chip: "#C8E5DF", chipTx: "#1A6B6B", dot: "#28A0A0" },
  saldo:       { bg: "#E5F0F9", bd: "#4A7AB0", tx: "#264F7E", chip: "#CCDEF0", chipTx: "#264F7E", dot: "#4A7AB0" },
  pagata:      { bg: "#EFEFEF", bd: "#A1A1AA", tx: "#52525B", chip: "#DEDEE2", chipTx: "#52525B", dot: "#A1A1AA" },
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

export const T = {
  acc: "#28A0A0",
  accDk: "#1A7A7A",
  bg: "#F5F8F8",
  card: "#FFFFFF",
  bdr: "#E4F2F2",
  text: "#0D1F1F",
  sub: "#71717A",
  headerGrad: "linear-gradient(160deg, #1F8B8B 0%, #176868 60%, #0F4040 100%)",
};
