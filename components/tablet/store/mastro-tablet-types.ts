// =========================================================
// MASTRO TABLET - TIPI DOMINIO
// =========================================================

export type FaseCommessa =
  | "rilievo"
  | "rilievo_confermato"
  | "preventivo"
  | "conferma_ordine"
  | "ordine_confermato"
  | "produzione"
  | "montaggio"
  | "fattura"
  | "pagata";

export type StatoSopralluogo = "in_attesa" | "confermato" | "completato";
export type StatoPreventivo  = "bozza" | "inviato" | "accettato" | "rifiutato";
export type StatoOrdineFornitore = "bozza" | "inviato" | "confermato" | "in_consegna" | "ricevuto";
export type StatoProduzione = "non_iniziata" | "da_iniziare" | "in_lavorazione" | "qa" | "pronto" | "consegnata";
export type StatoMontaggio  = "pianificato" | "in_corso" | "completato" | "rinviato";
export type StatoFattura    = "bozza" | "emessa" | "pagata" | "scaduta";
export type StatoPraticaFiscale = "aperta" | "in_lavorazione" | "completata" | "richiede_doc";
export type TipoBonus       = "ecobonus_65" | "ecobonus_50" | "bonus_casa_50" | "iva_10" | "iva_4";
export type EsitoEnea       = "inviata" | "da_inviare" | "non_richiesta";
export type StatoPagamento  = "pagata" | "in_attesa" | "scaduta";
export type RuoloOperatore  = "titolare" | "posatore" | "magazziniere" | "segreteria" | "agente" | "produzione";
export type StatusOperatore = "online" | "trasferta" | "ferie" | "offline";
export type AvatarPreset    = "a" | "b" | "c" | "d" | "e";
export type TintName        = "teal" | "green" | "blue" | "amber" | "violet" | "red" | "pink" | "slate" | "orange";

// ---------- ENTITA ----------

export interface Cliente {
  id: string;
  nome: string;
  citta: string;
  indirizzo: string;
  tipo: "privato" | "azienda" | "showroom";
  preset: AvatarPreset;
  telefono: string;
  email: string;
  cf?: string;
  piva?: string;
}

export interface Vano {
  id: string;
  codice: string;
  ambiente: string;
  larghezza_mm: number;
  altezza_mm: number;
  forma: "rettangolare" | "arco" | "trapezio";
  tipologia: string;
  pezzi: number;
}

export interface Sopralluogo {
  id: string;
  numero: string;
  commessaId?: string;
  clienteId: string;
  data: string;
  giorno: string;
  ora: string;
  posatoreId: string;
  stato: StatoSopralluogo;
  note?: string;
}

export interface RigaPreventivo {
  vanoId?: string;
  descrizione: string;
  quantita: number;
  prezzoUnit: number;
}

export interface Preventivo {
  id: string;
  numero: string;
  commessaId: string;
  data: string;
  righe: RigaPreventivo[];
  importo: number;
  iva: 4 | 10 | 22;
  stato: StatoPreventivo;
}

export interface OrdineFornitore {
  id: string;
  numero: string;
  commessaIds: string[];
  fornitoreId: string;
  fornitoreNome: string;
  fornitoreColor: TintName;
  categoria: string;
  data: string;
  consegnaPrevista: string;
  giorniRitardo: number;
  pezzi: number;
  importo: number;
  stato: StatoOrdineFornitore;
}

export interface Produzione {
  id: string;
  commessaId: string;
  sistemaProfilo: string;
  vani: number;
  pezzi: number;
  consegnaPrevista: string;
  giorniMancanti: number;
  avanzamentoPct: number;
  stato: StatoProduzione;
  posatoreAssegnato: string;
  posatoreAvatar: AvatarPreset;
  priorita: "alta" | "media" | "bassa";
}

export interface Montaggio {
  id: string;
  numero: string;
  commessaId: string;
  data: string;
  giornoLabel: string;
  ora: string;
  durataOre: number;
  squadraIds: string[];
  vani: number;
  pezzi: number;
  stato: StatoMontaggio;
}

export interface Fattura {
  id: string;
  numero: string;
  commessaId: string;
  data: string;
  importo: number;
  stato: StatoFattura;
}

export interface PraticaFiscale {
  id: string;
  numero: string;
  commessaId: string;
  tipo: TipoBonus;
  importoLordo: number;
  importoDetraibile: number;
  iva: 4 | 10 | 22;
  zonaClimatica: string;
  cam: boolean;
  enea: EsitoEnea;
  stato: StatoPraticaFiscale;
  norma: string;
}

export interface Pagamento {
  id: string;
  data: string;
  fatturaId?: string;
  ordineId?: string;
  cliente: string;
  metodo: string;
  importo: number;
  tipo: "incasso" | "uscita";
}

export interface MovimentoMagazzino {
  id: string;
  tipo: "carico" | "scarico";
  articoloId: string;
  articoloNome: string;
  qta: number;
  unita: string;
  data: string;
  riferimento: string;
}

export interface Articolo {
  id: string;
  codice: string;
  nome: string;
  descrizione: string;
  categoria: "profili" | "vetri" | "ferramenta" | "guarnizioni" | "accessori";
  scorta: number;
  scortaMin: number;
  unita: string;
  prezzoMedio: number;
  ubicazione: string;
}

export interface Operatore {
  id: string;
  nome: string;
  cognome: string;
  ruolo: RuoloOperatore;
  status: StatusOperatore;
  preset: AvatarPreset;
  tel: string;
  email: string;
  oreSettimana: number;
  oreMese: number;
  efficienza: number;
}

export interface AttivitaTimeline {
  id: string;
  commessaId: string;
  data: string;
  fase: FaseCommessa;
  testo: string;
  autoreId: string;
}

export interface Commessa {
  id: string;
  numero: string;
  clienteId: string;
  apertaIl: string;
  fase: FaseCommessa;
  vani: Vano[];
  posatoreId: string;
  valore: number;
  note?: string;
}

// ---------- ROOT STORE ----------

export interface MastroTabletStore {
  clienti: Cliente[];
  commesse: Commessa[];
  sopralluoghi: Sopralluogo[];
  preventivi: Preventivo[];
  ordini: OrdineFornitore[];
  produzioni: Produzione[];
  montaggi: Montaggio[];
  fatture: Fattura[];
  pagamenti: Pagamento[];
  pratiche: PraticaFiscale[];
  articoli: Articolo[];
  movimenti: MovimentoMagazzino[];
  operatori: Operatore[];
  timeline: AttivitaTimeline[];
}
