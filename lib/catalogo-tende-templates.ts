// lib/catalogo-tende-templates.ts
// Template demo importabili dei fornitori italiani principali.
// Prezzi indicativi mercato 2026, da rivedere con i listini reali del rivenditore.
// Quando si aggiorna un fornitore, bumpare la versione per permettere re-import.

export type ModelloTemplate = {
  modello: string;
  categoria: 'esterno' | 'interno';
  tipo_modello: string;
  colore_default: string;
  prezzo_base_eur: number;
  unita_prezzo: 'mq' | 'pz';
  l_min_mm: number;
  l_max_mm: number;
  h_min_mm: number;
  h_max_mm: number;
  s_min_mm?: number;
  s_max_mm?: number;
  minimo_mq?: number;
  note?: string;
  ordine?: number;
};

export type AccessorioTemplate = {
  nome: string;
  categoria: 'motore' | 'comando' | 'sensore' | 'tessuto' | 'illuminazione' | 'colore' | 'altro';
  unita: 'pz' | 'ml' | 'mq' | 'm';
  prezzo_unitario: number;
  compatibile_tipi: string[];
  note?: string;
  ordine?: number;
};

export type ColoreTemplate = {
  codice: string;
  nome: string;
  hex?: string;
  tipo: 'standard' | 'speciale' | 'metallizzato' | 'strutturato' | 'tessuto';
  sovrapprezzo_pct?: number;
  sovrapprezzo_eur?: number;
  ordine?: number;
};

export type FornitoreTemplate = {
  fornitore: string;
  descrizione: string;
  versione: string;
  modelli: ModelloTemplate[];
  accessori: AccessorioTemplate[];
  colori: ColoreTemplate[];
};

export const TEMPLATE_FORNITORI: Record<string, FornitoreTemplate> = {
  pratic: {
    fornitore: 'Pratic',
    descrizione: 'Pratic F.lli Orioli — Sistemi outdoor di alta gamma. Pergole bioclimatiche e tende su misura, Made in Italy.',
    versione: '2026.04',
    modelli: [
      { modello: 'Med Twist', categoria: 'esterno', tipo_modello: 'pergola', colore_default: 'RAL 7016 Antracite', prezzo_base_eur: 480, unita_prezzo: 'mq',
        l_min_mm: 1500, l_max_mm: 7000, h_min_mm: 2200, h_max_mm: 3500, s_min_mm: 2500, s_max_mm: 4500, minimo_mq: 6,
        note: 'Pergola bioclimatica con lame orientabili 0-135°, motorizzata. Top di gamma.', ordine: 1 },
      { modello: 'Med Open', categoria: 'esterno', tipo_modello: 'pergola', colore_default: 'RAL 9016 Bianco traffico', prezzo_base_eur: 520, unita_prezzo: 'mq',
        l_min_mm: 2000, l_max_mm: 6500, h_min_mm: 2200, h_max_mm: 3500, s_min_mm: 3000, s_max_mm: 4500, minimo_mq: 8,
        note: 'Pergola bioclimatica con lame impacchettabili. Apertura totale al cielo.', ordine: 2 },
      { modello: 'Vela Plus', categoria: 'esterno', tipo_modello: 'pergolatelo', colore_default: 'RAL 9016 Bianco traffico', prezzo_base_eur: 380, unita_prezzo: 'mq',
        l_min_mm: 2000, l_max_mm: 8000, h_min_mm: 2200, h_max_mm: 3500, s_min_mm: 3000, s_max_mm: 6000,
        note: 'Pergola con telo PVC tensionato impermeabile, scorrevole.', ordine: 3 },
      { modello: 'Tecnic Drop', categoria: 'esterno', tipo_modello: 'caduta', colore_default: 'RAL 9016 Bianco traffico', prezzo_base_eur: 195, unita_prezzo: 'mq',
        l_min_mm: 800, l_max_mm: 5000, h_min_mm: 1000, h_max_mm: 4000,
        note: 'Tenda a caduta verticale con guide laterali. Ideale per logge e portici.', ordine: 4 },
      { modello: 'Slim Star', categoria: 'esterno', tipo_modello: 'semicassonetto', colore_default: 'RAL 7016 Antracite', prezzo_base_eur: 240, unita_prezzo: 'mq',
        l_min_mm: 1500, l_max_mm: 6000, h_min_mm: 2000, h_max_mm: 3500, s_min_mm: 1500, s_max_mm: 4000,
        note: 'Tenda a bracci con semi-cassonetto compatto. Profondita ridotta 18 cm.', ordine: 5 },
      { modello: 'Tenda Box Star', categoria: 'esterno', tipo_modello: 'cassonetto', colore_default: 'RAL 7016 Antracite', prezzo_base_eur: 295, unita_prezzo: 'mq',
        l_min_mm: 1500, l_max_mm: 6500, h_min_mm: 2000, h_max_mm: 3500, s_min_mm: 1800, s_max_mm: 4000, minimo_mq: 4,
        note: 'Cassonetto integrale chiuso, design lineare. Premium.', ordine: 6 },
    ],
    accessori: [
      { nome: 'Comando manuale aspa', categoria: 'comando', unita: 'pz', prezzo_unitario: 25, compatibile_tipi: ['cassonetto','semicassonetto','caduta','bracci'], ordine: 1 },
      { nome: 'LED integrati strip', categoria: 'illuminazione', unita: 'm', prezzo_unitario: 45, compatibile_tipi: ['pergola','pergolatelo','pergolabox'], ordine: 2 },
      { nome: 'Cassetta colore RAL standard', categoria: 'colore', unita: 'pz', prezzo_unitario: 0, compatibile_tipi: ['cassonetto','semicassonetto','pergola','pergolatelo'], ordine: 3 },
      { nome: 'Cassetta colore RAL speciale', categoria: 'colore', unita: 'pz', prezzo_unitario: 280, compatibile_tipi: ['cassonetto','semicassonetto','pergola','pergolatelo'], ordine: 4 },
    ],
    colori: [
      { codice: 'RAL9016', nome: 'Bianco traffico', hex: '#F1F0EA', tipo: 'standard', ordine: 1 },
      { codice: 'RAL9010', nome: 'Bianco puro', hex: '#FFFFFF', tipo: 'standard', ordine: 2 },
      { codice: 'RAL7016', nome: 'Antracite', hex: '#293133', tipo: 'standard', ordine: 3 },
      { codice: 'RAL7035', nome: 'Grigio luce', hex: '#D7D7D7', tipo: 'standard', ordine: 4 },
      { codice: 'RAL8019', nome: 'Marrone grigiastro', hex: '#403A3A', tipo: 'standard', ordine: 5 },
      { codice: 'RAL6005', nome: 'Verde muschio', hex: '#2F4538', tipo: 'standard', ordine: 6 },
      { codice: 'BRONZ', nome: 'Bronzo strutturato', tipo: 'metallizzato', sovrapprezzo_pct: 8, ordine: 7 },
      { codice: 'CORTEN', nome: 'Effetto corten', tipo: 'speciale', sovrapprezzo_pct: 12, ordine: 8 },
    ],
  },

  gibus: {
    fornitore: 'Gibus',
    descrizione: 'Gibus — Pergole bioclimatiche, tende e vele tecniche premium. Atelier dei colori personalizzati.',
    versione: '2026.04',
    modelli: [
      { modello: 'Med Varia', categoria: 'esterno', tipo_modello: 'pergola', colore_default: 'Bronzo metallizzato', prezzo_base_eur: 520, unita_prezzo: 'mq',
        l_min_mm: 1500, l_max_mm: 7000, h_min_mm: 2200, h_max_mm: 3500, s_min_mm: 2500, s_max_mm: 4500, minimo_mq: 6,
        note: 'Pergola bioclimatica con lame Twin (rotazione+traslazione). Brevettata.', ordine: 1 },
      { modello: 'Med Twin', categoria: 'esterno', tipo_modello: 'pergola', colore_default: 'RAL 7016 Antracite', prezzo_base_eur: 495, unita_prezzo: 'mq',
        l_min_mm: 2000, l_max_mm: 6000, h_min_mm: 2200, h_max_mm: 3500, s_min_mm: 2500, s_max_mm: 4000, minimo_mq: 6,
        note: 'Pergola bioclimatica versione standard.', ordine: 2 },
      { modello: 'Twin Sail', categoria: 'esterno', tipo_modello: 'tettopiramide', colore_default: 'Bianco perla', prezzo_base_eur: 420, unita_prezzo: 'mq',
        l_min_mm: 2000, l_max_mm: 6000, h_min_mm: 2200, h_max_mm: 3000, s_min_mm: 2000, s_max_mm: 6000,
        note: 'Vela tensionata a 4 punti. Versione fissa o richiudibile.', ordine: 3 },
      { modello: 'Ametista', categoria: 'esterno', tipo_modello: 'cassonetto', colore_default: 'RAL 7016 Antracite', prezzo_base_eur: 285, unita_prezzo: 'mq',
        l_min_mm: 1500, l_max_mm: 6000, h_min_mm: 2000, h_max_mm: 3500, s_min_mm: 1800, s_max_mm: 4000, minimo_mq: 4,
        note: 'Cassonetto totalmente chiuso, design lineare. Comando motorizzato.', ordine: 4 },
      { modello: 'Topiko', categoria: 'esterno', tipo_modello: 'semicassonetto', colore_default: 'RAL 9010 Bianco', prezzo_base_eur: 245, unita_prezzo: 'mq',
        l_min_mm: 1500, l_max_mm: 5500, h_min_mm: 2000, h_max_mm: 3500, s_min_mm: 1500, s_max_mm: 3500,
        note: 'Tenda a bracci con semi-cassonetto.', ordine: 5 },
    ],
    accessori: [
      { nome: 'Telo Sauleda Sunsilk', categoria: 'tessuto', unita: 'mq', prezzo_unitario: 38, compatibile_tipi: ['cassonetto','semicassonetto','caduta','bracci','rullo'], ordine: 1 },
      { nome: 'Telo Tempotest acrilico', categoria: 'tessuto', unita: 'mq', prezzo_unitario: 45, compatibile_tipi: ['cassonetto','semicassonetto','caduta','bracci'], ordine: 2 },
      { nome: 'Comando motore + radio Atlantis', categoria: 'comando', unita: 'pz', prezzo_unitario: 65, compatibile_tipi: ['cassonetto','semicassonetto','caduta','rullo'], ordine: 3 },
    ],
    colori: [
      { codice: 'RAL9010', nome: 'Bianco puro', hex: '#FFFFFF', tipo: 'standard', ordine: 1 },
      { codice: 'RAL7016', nome: 'Antracite', hex: '#293133', tipo: 'standard', ordine: 2 },
      { codice: 'BR-MET', nome: 'Bronzo metallizzato', tipo: 'metallizzato', sovrapprezzo_pct: 5, ordine: 3 },
      { codice: 'BIA-PERLA', nome: 'Bianco perla', hex: '#F0E9DA', tipo: 'metallizzato', sovrapprezzo_pct: 5, ordine: 4 },
      { codice: 'TORTORA', nome: 'Tortora', hex: '#928374', tipo: 'standard', ordine: 5 },
      { codice: 'NERO-OPACO', nome: 'Nero opaco', hex: '#1A1A1A', tipo: 'speciale', sovrapprezzo_pct: 8, ordine: 6 },
    ],
  },

  ke: {
    fornitore: 'KE Outdoor Design',
    descrizione: 'KE — Specialista tende da sole tecniche e pergole, distribuzione capillare in Italia.',
    versione: '2026.04',
    modelli: [
      { modello: 'Kaptura R', categoria: 'esterno', tipo_modello: 'cassonetto', colore_default: 'RAL 9010 Bianco', prezzo_base_eur: 220, unita_prezzo: 'mq',
        l_min_mm: 1500, l_max_mm: 6500, h_min_mm: 2000, h_max_mm: 3500, s_min_mm: 1500, s_max_mm: 3500, minimo_mq: 4,
        note: 'Cassonetto pieno con bracci a snodo invisibili. Modello entry-level.', ordine: 1 },
      { modello: 'Kaptura SQ', categoria: 'esterno', tipo_modello: 'cassonetto', colore_default: 'RAL 7016 Antracite', prezzo_base_eur: 265, unita_prezzo: 'mq',
        l_min_mm: 1500, l_max_mm: 7000, h_min_mm: 2000, h_max_mm: 3500, s_min_mm: 1800, s_max_mm: 4000, minimo_mq: 5,
        note: 'Cassonetto squadrato design contemporaneo.', ordine: 2 },
      { modello: 'Tendabox', categoria: 'esterno', tipo_modello: 'doppiolivello', colore_default: 'RAL 7016 Antracite', prezzo_base_eur: 310, unita_prezzo: 'mq',
        l_min_mm: 2000, l_max_mm: 6000, h_min_mm: 2200, h_max_mm: 3500, s_min_mm: 2500, s_max_mm: 4000, minimo_mq: 6,
        note: 'Cassonetto con mantovana frontale motorizzata + telo a caduta.', ordine: 3 },
      { modello: 'Kover', categoria: 'esterno', tipo_modello: 'pergolatelo', colore_default: 'RAL 9016 Bianco traffico', prezzo_base_eur: 395, unita_prezzo: 'mq',
        l_min_mm: 2000, l_max_mm: 7500, h_min_mm: 2200, h_max_mm: 3500, s_min_mm: 3000, s_max_mm: 6000, minimo_mq: 8,
        note: 'Pergola con telo scorrevole impermeabile.', ordine: 4 },
    ],
    accessori: [
      { nome: 'Sensore vento meccanico', categoria: 'sensore', unita: 'pz', prezzo_unitario: 85, compatibile_tipi: ['cassonetto','semicassonetto','bracci','caduta'], ordine: 1 },
      { nome: 'Volant frontale', categoria: 'altro', unita: 'pz', prezzo_unitario: 95, compatibile_tipi: ['cassonetto','semicassonetto','bracci'], ordine: 2 },
    ],
    colori: [
      { codice: 'RAL9010', nome: 'Bianco puro', hex: '#FFFFFF', tipo: 'standard', ordine: 1 },
      { codice: 'RAL9016', nome: 'Bianco traffico', hex: '#F1F0EA', tipo: 'standard', ordine: 2 },
      { codice: 'RAL7016', nome: 'Antracite', hex: '#293133', tipo: 'standard', ordine: 3 },
      { codice: 'RAL8019', nome: 'Marrone grigiastro', hex: '#403A3A', tipo: 'standard', ordine: 4 },
      { codice: 'RAL1015', nome: 'Avorio', hex: '#E6D2B5', tipo: 'standard', ordine: 5 },
    ],
  },

  mottura: {
    fornitore: 'Mottura',
    descrizione: 'Mottura — Sistemi tende da interno tecniche, leader italiano oscuranti motorizzati.',
    versione: '2026.04',
    modelli: [
      { modello: 'Free Roll Up 64', categoria: 'interno', tipo_modello: 'rullo', colore_default: 'Tessuto Sunworker SilverScreen 8783', prezzo_base_eur: 145, unita_prezzo: 'mq',
        l_min_mm: 600, l_max_mm: 3500, h_min_mm: 800, h_max_mm: 3500,
        note: 'Tenda a rullo motorizzata con tubo Ø 64 mm. Tessuti tecnici filtranti/oscuranti.', ordine: 1 },
      { modello: 'Free Roll Up 45', categoria: 'interno', tipo_modello: 'rullo', colore_default: 'Tessuto bianco standard', prezzo_base_eur: 95, unita_prezzo: 'mq',
        l_min_mm: 400, l_max_mm: 2500, h_min_mm: 500, h_max_mm: 3000,
        note: 'Tenda a rullo manuale a catenella, formato compatto.', ordine: 2 },
      { modello: 'Veneziana 25', categoria: 'interno', tipo_modello: 'veneziana', colore_default: 'Alluminio bianco satinato', prezzo_base_eur: 95, unita_prezzo: 'mq',
        l_min_mm: 400, l_max_mm: 2500, h_min_mm: 500, h_max_mm: 3000,
        note: 'Veneziana lame in alluminio 25 mm, comando a cordone.', ordine: 3 },
      { modello: 'Veneziana 50 Legno', categoria: 'interno', tipo_modello: 'venezianalegno', colore_default: 'Bambu naturale', prezzo_base_eur: 165, unita_prezzo: 'mq',
        l_min_mm: 600, l_max_mm: 2200, h_min_mm: 800, h_max_mm: 2800,
        note: 'Veneziana stecche in legno 50 mm, effetto naturale.', ordine: 4 },
      { modello: 'Plissé Day&Night', categoria: 'interno', tipo_modello: 'doppiostrato', colore_default: 'Tessuto duo beige/bianco', prezzo_base_eur: 165, unita_prezzo: 'mq',
        l_min_mm: 600, l_max_mm: 3000, h_min_mm: 800, h_max_mm: 2800,
        note: 'Plissé giorno/notte con doppio tessuto.', ordine: 5 },
      { modello: 'Pacchetto Soft', categoria: 'interno', tipo_modello: 'pacchetto', colore_default: 'Tessuto lino naturale', prezzo_base_eur: 125, unita_prezzo: 'mq',
        l_min_mm: 600, l_max_mm: 3000, h_min_mm: 800, h_max_mm: 3000,
        note: 'Tenda a pacchetto con falde regolabili.', ordine: 6 },
    ],
    accessori: [
      { nome: 'Motore tubolare 35mm', categoria: 'motore', unita: 'pz', prezzo_unitario: 75, compatibile_tipi: ['rullo'], ordine: 1 },
      { nome: 'Telecomando 1 canale', categoria: 'comando', unita: 'pz', prezzo_unitario: 32, compatibile_tipi: ['rullo','veneziana','venezianavert'], ordine: 2 },
      { nome: 'Telecomando 5 canali', categoria: 'comando', unita: 'pz', prezzo_unitario: 58, compatibile_tipi: ['rullo','veneziana','venezianavert'], ordine: 3 },
    ],
    colori: [
      { codice: 'BIANCO-T', nome: 'Bianco tessuto standard', tipo: 'tessuto', ordine: 1 },
      { codice: 'BEIGE-T', nome: 'Beige tessuto', tipo: 'tessuto', ordine: 2 },
      { codice: 'ANTRA-T', nome: 'Antracite tessuto', tipo: 'tessuto', sovrapprezzo_pct: 4, ordine: 3 },
      { codice: 'NAT-LINO', nome: 'Lino naturale', tipo: 'tessuto', ordine: 4 },
      { codice: 'OSCURO-T', nome: 'Oscurante blackout', tipo: 'tessuto', sovrapprezzo_pct: 8, ordine: 5 },
    ],
  },
};
