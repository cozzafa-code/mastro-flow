// ═══════════════════════════════════════════════════════════
// MASTRO ERP — Montaggi Editor v2 types
// ═══════════════════════════════════════════════════════════

export type TipoIntervento = "cantiere" | "intervento" | "sopralluogo";

export type StatoMontaggio =
  | "da_pianificare"
  | "programmato"
  | "in_corso"
  | "completato"
  | "annullato";

export interface MontaggioRow {
  id?: string;
  azienda_id?: string;
  tipo_intervento?: TipoIntervento | null;
  commessa_id?: string | null;
  contatto_id?: string | null;
  titolo?: string | null;
  indirizzo_override?: string | null;
  telefono_override?: string | null;
  data_montaggio?: string | null; // YYYY-MM-DD
  ora_inizio?: string | null;     // HH:mm
  ora_fine?: string | null;
  giorni_pianificati?: number | null;
  ore_preventivate?: number | null;
  durata_minuti?: number | null;
  squadra?: string[] | null;
  stato?: StatoMontaggio | null;
  note_misuratore?: string | null;
  urgente?: boolean | null;
  // Campi calcolati lato client (join commessa/contatto):
  commessa_code?: string | null;
  commessa_cliente?: string | null;
  commessa_cognome?: string | null;
  commessa_indirizzo?: string | null;
  commessa_totale?: number | null;
  commessa_vani_count?: number | null;
  contatto_nome?: string | null;
  contatto_cognome?: string | null;
  contatto_telefono?: string | null;
  contatto_citta?: string | null;
}

export interface CommessaLite {
  id: string;
  code?: string | null;
  cliente?: string | null;
  cognome?: string | null;
  indirizzo?: string | null;
  citta?: string | null;
  telefono?: string | null;
  totale_finale?: number | null;
  totale_preventivo?: number | null;
  vani_count?: number | null;
  fase?: string | null;
}

export interface ContattoLite {
  id: string;
  nome?: string | null;
  cognome?: string | null;
  telefono?: string | null;
  email?: string | null;
  citta?: string | null;
  indirizzo?: string | null;
  tipo?: string | null;
}

export interface SquadraPreset {
  key: string;       // sq1 / sq2 / sq3
  nome?: string;     // Marco / Luca / Andrea
}

export const SQUADRE_PRESET: SquadraPreset[] = [
  { key: "sq1", nome: "Marco" },
  { key: "sq2", nome: "Luca" },
  { key: "sq3", nome: "Andrea" },
];

export const PRESET_MINUTI = [15, 30, 45, 60, 90, 120];

// === Form state interno editor ===
export interface EditorState {
  tipo: TipoIntervento;
  commessaId: string | null;
  contattoId: string | null;
  titolo: string;
  indirizzoOverride: string;
  telefonoOverride: string;
  dataInizio: string | null;       // YYYY-MM-DD
  oraInizio: string;                // HH:mm
  giorni: number;
  oreGiorno: number;                // solo cantiere
  durataMinuti: number;             // solo intervento
  squadra: string[];
  stato: StatoMontaggio;
  note: string;
}

// === Carico squadra aggregato per data ===
// chiave: "sq1:2026-05-19" -> ore totali
export type CaricoMap = Map<string, number>;

export function caricoKey(squadra: string, dataIso: string): string {
  return `${squadra}:${dataIso}`;
}

// === Color palette inline (fliwoX) ===
export const C = {
  bgApp: "#8B9BB0",
  navy: "#1A2A47",
  navy2: "#243558",
  navyText: "#1A2A47",
  navyDim: "#5A6478",
  navyFaint: "#8B95A8",
  white: "#FFFFFF",
  whiteOff: "#F5F7FA",
  border: "rgba(26, 42, 71, 0.10)",
  borderStrong: "rgba(26, 42, 71, 0.18)",
  amber: "#E8B05C",
  amberDark: "#8C5E1A",
  amberSoft: "#FBF0DC",
  green: "#1F5A3F",
  greenBright: "#2B7A52",
  greenSoft: "#D8EBDF",
  red: "#C44545",
  redSoft: "#F5DADA",
  shadowMd: "0 4px 16px rgba(26, 42, 71, 0.12)",
  shadowLg: "0 8px 28px rgba(26, 42, 71, 0.20)",
};

// === helpers data ===
export function fmtIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
export function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
export function isWeekend(d: Date): boolean {
  const w = d.getDay();
  return w === 0 || w === 6;
}
export function fmtDataBreve(iso: string): string {
  const d = parseIso(iso);
  const mesi = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  return `${d.getDate()} ${mesi[d.getMonth()]}`;
}

export const MESI_FULL = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
