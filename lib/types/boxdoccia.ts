// lib/types/boxdoccia.ts
// Tipi TypeScript per catalogo Box Doccia MASTRO

export type ConfigurazioneBox =
  | 'NICCHIA' | 'NICCHIA_PANNELLO' | 'ANGOLO' | 'ANGOLO_PANNELLO'
  | 'WALK_IN' | 'TRE_LATI' | 'DOPPIA_PORTA' | 'TONDO'
  | 'PARETE_VASCA' | 'PANNELLO_FISSO' | 'SEMICIRCOLARE'
  | 'SEMICIRCOLARE_ASIMMETRICO' | 'PENTAGONALE' | 'CABINA_ATTREZZATA'
  | 'GRANDI_LASTRE' | 'SOPRAVASCA' | 'PARETE_DIVISORIA_SOFFITTO';

export type TipoApertura =
  | 'BATTENTE' | 'SCORREVOLE' | 'SOFFIETTO' | 'PIEGHEVOLE' | 'SALOON'
  | 'GIREVOLE_90' | 'SCORREVOLE_INTERNO' | 'PIVOT' | 'BILICO'
  | 'TRASLANTE' | 'FISSO' | 'MISTO';

export type CategoriaFinitura =
  'STANDARD' | 'ANODIZZATO' | 'LACCATO' | 'ACCIAIO' | 'VERNICIATO' | 'PERSONALIZZATO';

export type TipologiaCristallo =
  'BASE' | 'SERIGRAFIA' | 'DECORO_ARTISTICO' | 'PERSONALIZZATO';

export type MaterialeCristallo =
  'VETRO_TEMPERATO' | 'VETRO_STRATIFICATO' | 'ACRILICO' | 'POLICARBONATO';

export type CategoriaComponente =
  | 'GUARNIZIONE_MAGNETICA' | 'GUARNIZIONE_VERTICALE' | 'GUARNIZIONE_ORIZZONTALE_INF'
  | 'GUARNIZIONE_PALLONCINO' | 'PROFILO_COMPENSATORE' | 'PROFILO_PARETE' | 'PROFILO_SOFFITTO'
  | 'CERNIERA' | 'CUSCINETTO' | 'ROTELLA' | 'MANIGLIA' | 'POMELLO' | 'MAGNETE'
  | 'TAPPO_COPRIPILETTA' | 'BRACCIO_SOSTEGNO' | 'KIT_FISSAGGIO' | 'ALTRO';

export interface Fornitore {
  id: string;
  azienda_id: string;
  nome: string;
  sito_web: string | null;
  contatto_email: string | null;
  contatto_telefono: string | null;
  logo_url: string | null;
  note: string | null;
  attivo: boolean;
  created_at: string;
}

export interface Serie {
  id: string;
  azienda_id: string;
  fornitore_id: string;
  nome: string;
  descrizione: string | null;
  spessore_cristallo_mm: number[] | null;
  tipo_chiusura: string[] | null;
  tipo_cerniera: string | null;
  accessori_inclusi: string[] | null;
  realizzazione: 'STANDARD' | 'SU_MISURA' | 'SOLO_STANDARD' | 'MISTO' | null;
  altezza_min_cm: number | null;
  altezza_max_cm: number | null;
  altezza_max_speciale_cm: number | null;
  tempi_consegna_giorni: number | null;
  immagine_url: string | null;
  ordine: number;
  attivo: boolean;
}

export interface Modello {
  id: string;
  azienda_id: string;
  serie_id: string;
  codice_articolo: string | null;
  nome: string;
  configurazione: ConfigurazioneBox;
  tipo_apertura: TipoApertura | null;
  num_ante: number | null;
  num_ante_fisse: number | null;
  attrezzatura: string[] | null;
  w_min_cm: number | null;
  w_max_cm: number | null;
  d_min_cm: number | null;
  d_max_cm: number | null;
  h_min_cm: number;
  h_max_cm: number;
  su_misura: boolean;
  prezzo_acquisto: number | null;
  prezzo_vendita: number | null;
  margine_pct: number | null;
  immagine_url: string | null;
  scheda_tecnica_url: string | null;
  note: string | null;
  attivo: boolean;
}

export interface Finitura {
  id: string;
  azienda_id: string;
  fornitore_id: string;
  codice_articolo: string | null;
  nome: string;
  categoria: CategoriaFinitura | null;
  ral: string | null;
  hex_color: string | null;
  immagine_url: string | null;
  prezzo_supplemento: number;
  attivo: boolean;
}

export interface Cristallo {
  id: string;
  azienda_id: string;
  fornitore_id: string;
  codice_articolo: string | null;
  nome: string;
  tipologia: TipologiaCristallo;
  spessore_mm: number;
  materiale: MaterialeCristallo;
  stratificato: boolean;
  trattamenti: string[];
  altezza_max_cm: number | null;
  larghezza_max_cm: number | null;
  immagine_url: string | null;
  prezzo_mq: number | null;
  attivo: boolean;
}

export interface Componente {
  id: string;
  azienda_id: string;
  fornitore_id: string | null;
  categoria: CategoriaComponente;
  codice_articolo: string | null;
  nome: string;
  spessore_vetro_compatibile_mm: number[] | null;
  tipo_apertura_compatibile: string[] | null;
  materiale_compatibile: string[] | null;
  forma_vetro: 'NORMALE' | 'CURVO' | 'MISTO' | null;
  angolo_gradi: number | null;
  diametro_mm: number | null;
  spessore_mm: number | null;
  lunghezza_mm: number | null;
  filettatura: string | null;
  colore: string | null;
  materiale_costruzione: string | null;
  immagine_url: string | null;
  scheda_tecnica_url: string | null;
  prezzo_acquisto: number | null;
  prezzo_vendita: number | null;
  attivo: boolean;
}

export const CONFIGURAZIONI_LABEL: Record<ConfigurazioneBox, string> = {
  NICCHIA: 'Nicchia',
  NICCHIA_PANNELLO: 'Nicchia + pannello',
  ANGOLO: 'Angolo',
  ANGOLO_PANNELLO: 'Angolo + pannello',
  WALK_IN: 'Walk-in',
  TRE_LATI: 'Tre lati',
  DOPPIA_PORTA: 'Doppia porta',
  TONDO: 'Tondo',
  PARETE_VASCA: 'Parete vasca',
  PANNELLO_FISSO: 'Pannello fisso',
  SEMICIRCOLARE: 'Semicircolare',
  SEMICIRCOLARE_ASIMMETRICO: 'Semicirc. asimmetrico',
  PENTAGONALE: 'Pentagonale',
  CABINA_ATTREZZATA: 'Cabina attrezzata',
  GRANDI_LASTRE: 'Grandi lastre',
  SOPRAVASCA: 'Sopravasca',
  PARETE_DIVISORIA_SOFFITTO: 'Divisoria soffitto',
};

export const APERTURE_LABEL: Record<TipoApertura, string> = {
  BATTENTE: 'Battente',
  SCORREVOLE: 'Scorrevole',
  SOFFIETTO: 'Soffietto',
  PIEGHEVOLE: 'Pieghevole',
  SALOON: 'Saloon',
  GIREVOLE_90: 'Girevole 90°',
  SCORREVOLE_INTERNO: 'Scorrevole interno',
  PIVOT: 'Pivot',
  BILICO: 'Bilico',
  TRASLANTE: 'Traslante',
  FISSO: 'Fisso',
  MISTO: 'Misto',
};

export const CATEGORIE_COMPONENTE_LABEL: Record<CategoriaComponente, string> = {
  GUARNIZIONE_MAGNETICA: 'Guarnizione magnetica',
  GUARNIZIONE_VERTICALE: 'Guarnizione verticale',
  GUARNIZIONE_ORIZZONTALE_INF: 'Gocciolatoio inferiore',
  GUARNIZIONE_PALLONCINO: 'Guarnizione palloncino',
  PROFILO_COMPENSATORE: 'Profilo compensatore',
  PROFILO_PARETE: 'Profilo parete',
  PROFILO_SOFFITTO: 'Profilo soffitto',
  CERNIERA: 'Cerniera',
  CUSCINETTO: 'Cuscinetto',
  ROTELLA: 'Rotella',
  MANIGLIA: 'Maniglia',
  POMELLO: 'Pomello',
  MAGNETE: 'Magnete',
  TAPPO_COPRIPILETTA: 'Tappo / copripiletta',
  BRACCIO_SOSTEGNO: 'Braccio di sostegno',
  KIT_FISSAGGIO: 'Kit fissaggio',
  ALTRO: 'Altro',
};
