// components/montaggi/montaggi-types.ts
// Tipi e costanti condivise per il modulo MONTAGGI MASTRO

export type MontaggioStato =
  | "da_pianificare"
  | "programmato"
  | "in_corso"
  | "completato"
  | "annullato";

export interface MontaggioRow {
  id: string;
  azienda_id: string;
  commessa_id: string;
  data_montaggio: string | null; // YYYY-MM-DD
  ora_inizio: string | null;     // HH:MM:SS
  ora_fine: string | null;       // HH:MM:SS
  ore_preventivate: number | null;
  squadra: string[] | null;
  stato: MontaggioStato;
  note: string | null;
  // arricchiti dal join lato hook
  commessa_code?: string;
  commessa_cliente?: string;
  commessa_cognome?: string;
  commessa_indirizzo?: string;
  commessa_citta?: string;
  commessa_telefono?: string;
  commessa_vani_count?: number;
  commessa_totale?: number;
}

export type MontaggiView = "lista" | "calendario" | "gantt";
export type MontaggiSubTab = "prossimi" | "per_data" | "per_squadra";
export type MontaggiFilter =
  | "tutti"
  | "da_fare"
  | "in_opera"
  | "da_pianificare"
  | "fatti"
  | string; // squadra id

// PALETTE FLIWOX UFFICIALE (LIGHT MODE)
export const C = {
  bgApp: "#8B9BB0",
  bgApp2: "#7A8BA8",
  navy: "#1A2A47",
  navy2: "#243558",
  navy3: "#2D4068",
  navyText: "#1A2A47",
  navyDim: "#5A6478",
  navyFaint: "#8B95A8",
  white: "#FFFFFF",
  whiteOff: "#F5F7FA",
  white2: "#ECF0F5",
  border: "rgba(26, 42, 71, 0.08)",
  borderStrong: "rgba(26, 42, 71, 0.16)",
  amber: "#E8B05C",
  amberDark: "#8C5E1A",
  amberDeep: "#6B4612",
  amberSoft: "#FBF0DC",
  amberBright: "#F5C77B",
  green: "#1F5A3F",
  greenDeep: "#134029",
  greenSoft: "#D8EBDF",
  greenBright: "#2B7A52",
  red: "#C44545",
  redDeep: "#8B2828",
  redSoft: "#F5DADA",
  redBright: "#E06363",
  shadowXs: "0 1px 2px rgba(26, 42, 71, 0.06)",
  shadowSm: "0 2px 8px rgba(26, 42, 71, 0.08)",
  shadowMd: "0 4px 16px rgba(26, 42, 71, 0.12)",
  shadowLg: "0 8px 28px rgba(26, 42, 71, 0.20)",
} as const;

// Helper formattazione date IT
export const DOW_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
export const DOW_FULL = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
];
export const MONTH_FULL = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

export function formatHour(s: string | null): string {
  if (!s) return "--:--";
  return s.substring(0, 5);
}

export function parseDateISO(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function daysBetween(a: Date, b: Date): number {
  const ms = 1000 * 60 * 60 * 24;
  const aD = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bD = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bD.getTime() - aD.getTime()) / ms);
}

export function bdgColors(stato: MontaggioStato): { bg: string; fg: string; bar: string } {
  switch (stato) {
    case "programmato":
      return { bg: C.amberSoft, fg: C.amberDark, bar: C.amber };
    case "in_corso":
      return { bg: C.greenSoft, fg: C.green, bar: C.greenBright };
    case "completato":
      return { bg: "rgba(26, 42, 71, 0.08)", fg: C.navyDim, bar: C.navyFaint };
    case "da_pianificare":
      return { bg: C.redSoft, fg: C.red, bar: C.red };
    case "annullato":
      return { bg: C.redSoft, fg: C.red, bar: C.red };
    default:
      return { bg: C.amberSoft, fg: C.amberDark, bar: C.amber };
  }
}

export function statoLabel(stato: MontaggioStato): string {
  const map: Record<MontaggioStato, string> = {
    da_pianificare: "Da pianif.",
    programmato: "Programmato",
    in_corso: "In opera",
    completato: "Fatto",
    annullato: "Annullato",
  };
  return map[stato] || stato;
}
