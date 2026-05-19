// ═══════════════════════════════════════════
// MASTRO ERP — TypeScript Types
// ═══════════════════════════════════════════

export interface Theme {
  name: string; emoji: string;
  bg: string; bg2: string; card: string; card2: string;
  bdr: string; bdrL: string; text: string; sub: string; sub2: string;
  acc: string; accD: string; accLt: string; accBg: string;
  grn: string; grnLt: string;
  red: string; redLt: string;
  orange: string; orangeLt: string;
  blue: string; blueLt: string;
  purple: string; purpleLt: string;
  cyan: string; cyanLt: string;
  cardSh: string; cardShH: string;
  r: number; r2: number;
}

export interface Misure {
  lAlto: number; lCentro: number; lBasso: number;
  hSx: number; hCentro: number; hDx: number;
  d1: number; d2: number;
}

export interface Accessori {
  tapparella: { attivo: boolean; l?: number; h?: number };
  persiana: { attivo: boolean; l?: number; h?: number };
  zanzariera: { attivo: boolean; l?: number; h?: number };
}

export interface Vano {
  id: number;
  nome: string;
  tipo: string;
  stanza: string;
  piano: string;
  sistema: string;
  pezzi: number;
  coloreInt: string;
  coloreEst: string;
  bicolore: boolean;
  coloreAcc: string;
  vetro: string;
  telaio: string;
  coprifilo: string;
  lamiera: string;
  misure: Misure;
  foto: Record<string, any>;
  note: string;
  cassonetto: boolean;
  accessori: Accessori;
}

export interface Rilievo {
  id: number;
  n: number;
  data: string;
  ora: string;
  rilevatore: string;
  tipo: string;
  motivoModifica: string;
  note: string;
  stato: string;
  vani: Vano[];
}

export interface Allegato {
  id: number;
  tipo: string;
  nome: string;
  data: string;
  dataUrl?: string;
}

export interface LogEntry {
  chi: string;
  cosa: string;
  quando: string;
  color: string;
}

export interface Cantiere {
  id: number;
  code: string;
  cliente: string;
  cognome?: string;
  indirizzo: string;
  telefono: string;
  email: string;
  fase: string;
  sistema: string;
  tipo: string;
  difficoltaSalita: string;
  mezzoSalita: string;
  foroScale: string;
  pianoEdificio: string;
  note: string;
  prezzoMq?: number;
  firmaCliente?: boolean;
  dataFirma?: string;
  firmaDocumento?: Allegato;
  rilievi: Rilievo[];
  allegati: Allegato[];
  creato: string;
  aggiornato: string;
  cf: string;
  piva: string;
  sdi: string;
  pec: string;
  ivaPerc?: number;
  log: LogEntry[];
  // Checklist chiusura
  ck_vano_ok?: boolean;
  ck_pulizia_ok?: boolean;
  ck_cliente_ok?: boolean;
  ck_foto_ok?: boolean;
  ck_acconto_inc?: boolean;
  // Voci libere
  vociLibere?: VoceLibera[];
}

export interface VoceLibera {
  id: string;
  desc: string;
  importo: number;
  qta: number;
}

export interface Fattura {
  id: string;
  numero: number;
  anno: number;
  data: string;
  dataISO: string;
  tipo: "acconto" | "saldo" | "unica";
  cmId: number;
  cmCode: string;
  cliente: string;
  cognome: string;
  indirizzo: string;
  cf: string;
  piva: string;
  sdi: string;
  pec: string;
  importo: number;
  imponibile: number;
  iva: number;
  ivaAmt: number;
  pagata: boolean;
  dataPagamento: string | null;
  metodoPagamento: string;
  scadenza: string;
  note: string;
}

export interface OrdineRiga {
  id: string;
  desc: string;
  misure: string;
  qta: number;
  prezzoUnit: number;
  totale: number;
  note: string;
}

export interface Conferma {
  ricevuta: boolean;
  dataRicezione: string;
  verificata: boolean;
  differenze: string;
  firmata: boolean;
  dataFirma: string;
  reinviata: boolean;
  dataReinvio: string;
  nomeFile?: string;
  fileUrl?: string;
  datiEstratti?: Record<string, any>;
}

export interface OrdineFornitore {
  id: string;
  cmId: number;
  cmCode: string;
  cliente: string;
  numero: number;
  anno: number;
  dataOrdine: string;
  fornitore: {
    nome: string;
    email: string;
    tel: string;
    piva: string;
    referente: string;
  };
  righe: OrdineRiga[];
  totale: number;
  iva: number;
  totaleIva: number;
  sconto: number;
  stato: string;
  conferma: Conferma;
  consegna: {
    prevista: string;
    settimane: number;
    effettiva: string;
  };
  pagamento: {
    termini: string;
    stato: string;
  };
}

export interface Montaggio {
  id: string;
  cmId: number;
  cmCode: string;
  cliente: string;
  vani: number;
  data: string;
  orario: string;
  durata: string;
  giorni: number;
  squadraId: string;
  stato: string;
  note: string;
  indirizzo?: string;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: string;
  meta: string;
  cmCode: string;
}

export interface Squadra {
  id: string;
  nome: string;
  membri?: string[];
}

export interface Evento {
  id: string;
  date: string;
  time: string;
  text: string;
  tipo: string;
  persona: string;
  cm: string;
  addr: string;
  done: boolean;
}

export interface Colore {
  id: number;
  nome: string;
  code: string;
  hex: string;
  tipo: string;
}

export interface Sistema {
  id: number;
  nome: string;
  marca: string;
  camere: number;
  uf: number;
  tipo: string;
  attivo: boolean;
  sottosistemi?: Sottosistema[];
}

export interface Sottosistema {
  id: string;
  nome: string;
  desc: string;
}

export interface Vetro {
  id: number;
  nome: string;
  ug: number;
  tipo: string;
}

export interface PipelineFase {
  id: string;
  nome: string;
  ico: string;
  color: string;
  attiva: boolean;
}

export interface InboxResult {
  stato: string;
  file: string;
  tipo: string;
  fileUrl?: string;
  dati?: Record<string, any>;
  docTipo?: string;
  confidence?: number;
  matchedOrdine?: OrdineFornitore;
  matchedCommessa?: Cantiere;
  tuttiOrdini?: OrdineFornitore[];
  commesseAttive?: Cantiere[];
}
