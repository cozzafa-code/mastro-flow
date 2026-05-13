import type { Database } from "@/lib/database.types";

export type OrdineFornitoreRow = Database["public"]["Tables"]["ordini_fornitore"]["Row"];
export type FornitoreRow = Database["public"]["Tables"]["fornitori"]["Row"];

export type OrdineStato =
  | "bozza"
  | "da_ordinare"
  | "approvazione"
  | "inviato"
  | "confermato"
  | "in_transito"
  | "arrivato"
  | "arrivato_parziale"
  | "verificato"
  | "in_produzione"
  | "errore"
  | "annullato";

export type TipoOrdine = "commessa" | "scorta";

export type CategoriaMateriale =
  | "VETRI"
  | "BARRE_ALLUMINIO"
  | "BARRE_PVC"
  | "FERRAMENTA"
  | "MINUTERIE"
  | "LAMIERE"
  | "ACCESSORI"
  | "ALTRO";

export type MotivoAnomalia = "mancano" | "danneggiati" | "sbagliati" | "altro";
export type BackorderAction = "attendi" | "chiudi" | "nuovo_ordine";
export type RigaVerificaStato = "ok" | "parziale" | "problema";

export interface RigaOrdine {
  id: string;
  codice?: string;
  descrizione: string;
  qta_richiesta: number;
  prezzo_unitario: number;
  totale_riga: number;
  unita?: string;
  vano_id?: string;
  categoria?: string;
}

export interface ArrivoStorico {
  data: string;
  qta: number;
  ddt_numero?: string | null;
  operatore_id?: string | null;
  note?: string | null;
}

export interface RigaVerificata {
  id: string;
  qta_richiesta: number;
  qta_arrivata: number;
  qta_pendente: number;
  costo_reale: number;
  arrivato_ok: boolean;
  stato: RigaVerificaStato;
  motivo: MotivoAnomalia | null;
  backorder: BackorderAction;
  arrivi: ArrivoStorico[];
  note: string | null;
}

export interface OrdineConCommessa extends OrdineFornitoreRow {
  commessa_code?: string | null;
  commessa_cliente?: string | null;
  commessa_cognome?: string | null;
}

export interface OrdineKpi {
  da_ordinare: number;
  in_arrivo: number;
  arrivati: number;
  totale_aperti_euro: number;
}

export const STATO_LABEL: Record<OrdineStato, string> = {
  bozza: "Bozza",
  da_ordinare: "Da ordinare",
  approvazione: "In approvazione",
  inviato: "Inviato",
  confermato: "Confermato",
  in_transito: "In viaggio",
  arrivato: "Arrivato",
  arrivato_parziale: "Parziale",
  verificato: "Verificato",
  in_produzione: "In produzione",
  errore: "Errore",
  annullato: "Annullato",
};

export const STATO_BLOCCANTI: OrdineStato[] = ["errore", "da_ordinare"];
export const STATO_IN_ATTESA: OrdineStato[] = ["inviato", "in_transito", "confermato", "approvazione"];
export const STATO_ARRIVATI: OrdineStato[] = ["arrivato", "arrivato_parziale", "verificato"];

export const CATEGORIA_COLOR: Record<string, { bg: string; fg: string }> = {
  VETRI: { bg: "#DCEAF5", fg: "#3B6E96" },
  BARRE_ALLUMINIO: { bg: "#FBF0DC", fg: "#8C5E1A" },
  BARRE_PVC: { bg: "#FBF0DC", fg: "#8C5E1A" },
  FERRAMENTA: { bg: "#E8DCE4", fg: "#6B3E55" },
  MINUTERIE: { bg: "#D8EBDF", fg: "#1F5A3F" },
  LAMIERE: { bg: "#E5E5E5", fg: "#444444" },
  ACCESSORI: { bg: "#F5DADA", fg: "#C44545" },
  ALTRO: { bg: "#F5F7FA", fg: "#5A6478" },
};
