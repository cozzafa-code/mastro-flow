// ============================================================
// MASTRO — FirmaLegale types
// ============================================================

export type TipoFirma =
  | 'preventivo'
  | 'rilievo'
  | 'collaudo'
  | 'ddt'
  | 'pos'
  | 'intervento'
  | 'privacy'
  | 'altro';

export const TIPO_FIRMA_LABEL: Record<TipoFirma, string> = {
  preventivo: 'Conferma preventivo',
  rilievo: 'Verbale rilievo misure',
  collaudo: 'Accettazione fine posa',
  ddt: 'Ricezione materiale',
  pos: 'Piano sicurezza cantiere',
  intervento: 'Verbale intervento',
  privacy: 'Accettazione privacy',
  altro: 'Altro',
};

// Testo banner legale per ogni tipo
export const TIPO_FIRMA_BANNER: Record<TipoFirma, string> = {
  preventivo: "Firmando accetti il preventivo e autorizzi l'esecuzione dei lavori descritti. La firma digitale ha valore legale.",
  rilievo: 'Firmando confermi che le misure rilevate corrispondono a quelle effettivamente verificate sul posto. La firma digitale ha valore legale.',
  collaudo: 'Firmando dichiari di aver preso in consegna i lavori eseguiti e di averne verificato la conformità. La firma digitale ha valore legale.',
  ddt: 'Firmando confermi la ricezione del materiale descritto in cantiere. La firma digitale ha valore legale.',
  pos: 'Firmando dichiari di aver preso visione del Piano Operativo di Sicurezza e di rispettarne le prescrizioni. La firma digitale ha valore legale.',
  intervento: "Firmando confermi l'avvenuta esecuzione dell'intervento descritto. La firma digitale ha valore legale.",
  privacy: "Firmando accetti l'informativa privacy ai sensi del Regolamento UE 2016/679 (GDPR). La firma digitale ha valore legale.",
  altro: 'Firmando accetti il documento descritto. La firma digitale ha valore legale.',
};

export type LivelloFirma = 'FES' | 'FEA' | 'FEQ';
export type StatoFirma = 'pending' | 'firmato' | 'scaduto' | 'annullato';

export interface FirmaToken {
  id: string;
  token: string;
  cm_id: string;
  cm_code: string | null;
  cliente: string | null;
  azienda_id: string | null;
  tipo: TipoFirma | null;
  stato: StatoFirma | null;
  snapshot: Record<string, any> | null;
  firma_data_url: string | null;
  firma_ip: string | null;
  firma_user_agent: string | null;
  firmato_il: string | null;
  creato_il: string | null;
  scade_il: string | null;
  livello_firma: LivelloFirma | null;
  pdf_firmato_url: string | null;
  destinatario_email: string | null;
  destinatario_telefono: string | null;
  commessa_id: string | null;
}

// Dati che la pagina pubblica riceve da /api/firma?action=leggi
export interface FirmaTokenPublic {
  cmCode: string;
  cliente: string;
  importo: number;
  descrizione?: string;
  tipo?: TipoFirma;
}
