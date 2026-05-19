// MASTRO ERP — Costanti e configurazione

/* == PIANI ABBONAMENTO == */
export const PLANS = {
  trial: { nome: "Trial Gratuito", prezzo: 0, maxCommesse: 999, maxVani: 999, maxUtenti: 1, maxCataloghi: 1, sync: true, pdf: true, admin: false, api: false, durata: 14, badge: "🎁", desc: "14 giorni con tutte le funzioni PRO" },
  free: { nome: "Free", prezzo: 0, maxCommesse: 5, maxVani: 15, maxUtenti: 1, maxCataloghi: 1, sync: false, pdf: false, admin: false, api: false, durata: null, badge: "🆓", desc: "Per provare MASTRO — 5 commesse, 1 utente" },
  pro: { nome: "Pro", prezzo: 49, maxCommesse: 9999, maxVani: 9999, maxUtenti: 2, maxCataloghi: 5, sync: true, pdf: true, admin: false, api: false, durata: null, badge: "⭐", desc: "Serramentista / Artigiano — commesse illimitate" },
  business: { nome: "Business", prezzo: 149, maxCommesse: 9999, maxVani: 9999, maxUtenti: 10, maxCataloghi: 99, sync: true, pdf: true, admin: true, api: true, durata: null, badge: "💎", desc: "Showroom / Multi-sede — team fino a 10 persone" },
};


/* == PIPELINE 7+1 FASI == */
export const PIPELINE_DEFAULT = [
  { id: "sopralluogo", nome: "Sopralluogo", ico: "🔍", color: "#007aff", attiva: true },
  { id: "preventivo", nome: "Preventivo", ico: "📋", color: "#ff9500", attiva: true },
  { id: "conferma", nome: "Conferma", ico: "✍️", color: "#af52de", attiva: true },
  { id: "misure", nome: "Misure", ico: "📐", color: "#5856d6", attiva: true },
  { id: "ordini", nome: "Ordini", ico: "📦", color: "#ff2d55", attiva: true },
  { id: "produzione", nome: "Produzione", ico: "🏭", color: "#ff9500", attiva: true },
  { id: "posa", nome: "Posa", ico: "🔧", color: "#34c759", attiva: true },
  { id: "chiusura", nome: "Chiusura", ico: "✅", color: "#30b0c7", attiva: true },
];


/* == MOTIVI BLOCCO SOPRALLUOGO == */
export const MOTIVI_BLOCCO = [
  "Cliente assente",
  "Vano inaccessibile",
  "Materiale da rimuovere",
  "Lavori in corso",
  "Arredo da spostare",
  "Altro"
];


/* == AZIONE SUGGERITA PER FASE == */
export const AFASE = {
  sopralluogo: { i: "📐", t: "Pianifica sopralluogo",  c: "#007aff" },
  preventivo:  { i: "📝", t: "Invia preventivo",        c: "#ff9500" },
  conferma:    { i: "✍️", t: "Fai firmare contratto",   c: "#af52de" },
  misure:      { i: "📏", t: "Esegui rilievo misure",   c: "#5856d6" },
  ordini:      { i: "🛒", t: "Conferma ordine",          c: "#ff2d55" },
  produzione:  { i: "🏭", t: "Monitora produzione",      c: "#ff9500" },
  posa:        { i: "🔧", t: "Schedula posa",            c: "#34c759" },
  chiusura:    { i: "✅", t: "Richiedi saldo finale",    c: "#30b0c7" },
};


export const AI_INBOX_INIT = [];

export const MSGS_INIT = [];

export const TEAM_INIT = [
  { id: 1, nome: "", ruolo: "Titolare", compiti: "Gestione commesse, preventivi, rapporti clienti", colore: "#007aff" },
];

export const CONTATTI_INIT = [];

export const COLORI_INIT = [
  { id: 1, nome: "Bianco", code: "RAL 9010", hex: "#f5f5f0", tipo: "RAL" },
  { id: 2, nome: "Grigio antracite", code: "RAL 7016", hex: "#383e42", tipo: "RAL" },
  { id: 3, nome: "Nero", code: "RAL 9005", hex: "#0e0e10", tipo: "RAL" },
  { id: 4, nome: "Marrone", code: "RAL 8014", hex: "#4a3728", tipo: "RAL" },
  { id: 5, nome: "Noce", code: "Noce", hex: "#6b4226", tipo: "Legno" },
  { id: 6, nome: "Rovere", code: "Rovere", hex: "#a0784a", tipo: "Legno" },
];

export const SISTEMI_INIT = [
  { id: 1, marca: "Aluplast", sistema: "Ideal 4000", euroMq: 180, prezzoMq: 180, sovRAL: 12, sovLegno: 22, minimiMq: { "1anta": 1.5, "2ante": 2.0, "3ante": 2.8, "scorrevole": 3.5, "fisso": 1.0 }, colori: ["RAL 9010", "RAL 7016", "RAL 9005", "Noce"], sottosistemi: ["Classicline", "Roundline"], griglia: [
    { l: 600, h: 600, prezzo: 120 }, { l: 600, h: 800, prezzo: 145 }, { l: 600, h: 1000, prezzo: 170 }, { l: 600, h: 1200, prezzo: 195 },
    { l: 800, h: 800, prezzo: 175 }, { l: 800, h: 1000, prezzo: 205 }, { l: 800, h: 1200, prezzo: 240 }, { l: 800, h: 1400, prezzo: 270 },
    { l: 1000, h: 1000, prezzo: 250 }, { l: 1000, h: 1200, prezzo: 290 }, { l: 1000, h: 1400, prezzo: 330 }, { l: 1000, h: 1600, prezzo: 370 },
    { l: 1200, h: 1200, prezzo: 340 }, { l: 1200, h: 1400, prezzo: 385 }, { l: 1200, h: 1600, prezzo: 430 }, { l: 1200, h: 1800, prezzo: 480 },
    { l: 1400, h: 1400, prezzo: 430 }, { l: 1400, h: 1600, prezzo: 485 }, { l: 1400, h: 2200, prezzo: 580 },
  ] },
  { id: 2, marca: "Schüco", sistema: "CT70", euroMq: 280, prezzoMq: 280, sovRAL: 15, sovLegno: 25, minimiMq: { "1anta": 1.5, "2ante": 2.0, "scorrevole": 3.5 }, colori: ["RAL 9010", "RAL 7016", "RAL 9005"], sottosistemi: ["Classic", "Rondo"], griglia: [
    { l: 600, h: 800, prezzo: 195 }, { l: 600, h: 1200, prezzo: 260 },
    { l: 800, h: 1000, prezzo: 275 }, { l: 800, h: 1400, prezzo: 365 },
    { l: 1000, h: 1200, prezzo: 380 }, { l: 1000, h: 1400, prezzo: 440 },
    { l: 1200, h: 1400, prezzo: 520 }, { l: 1200, h: 1600, prezzo: 580 },
    { l: 1400, h: 2200, prezzo: 780 },
  ] },
  { id: 3, marca: "Rehau", sistema: "S80", euroMq: 220, prezzoMq: 220, sovRAL: 12, sovLegno: 20, minimiMq: { "1anta": 1.5, "2ante": 2.0 }, colori: ["RAL 9010", "RAL 7016", "Noce"], sottosistemi: ["Geneo", "Synego"], griglia: [] },
  { id: 4, marca: "Finstral", sistema: "FIN-Project", euroMq: 350, prezzoMq: 350, sovRAL: 18, sovLegno: 30, minimiMq: { "1anta": 1.5, "2ante": 2.2, "scorrevole": 4.0 }, colori: ["RAL 9010", "RAL 7016", "RAL 9005", "Rovere"], sottosistemi: ["Nova-line", "Step-line"], griglia: [] },
];

export const VETRI_INIT = [
  { id: 1, nome: "Doppio basso emissivo", code: "4/16/4 BE", ug: 1.1, prezzoMq: 45 },
  { id: 2, nome: "Triplo basso emissivo", code: "4/12/4/12/4 BE", ug: 0.6, prezzoMq: 75 },
  { id: 3, nome: "Doppio sicurezza", code: "33.1/16/4 BE", ug: 1.1, prezzoMq: 65 },
  { id: 4, nome: "Triplo sicurezza", code: "33.1/12/4/12/4 BE", ug: 0.6, prezzoMq: 90 },
  { id: 5, nome: "Satinato", code: "4/16/4 SAT", ug: 1.1, prezzoMq: 55 },
  { id: 6, nome: "Fonoisolante", code: "44.2/20/6 BE", ug: 1.0, prezzoMq: 110 },
];

export const TIPOLOGIE_RAPIDE = [
  // Finestre
  { code: "F1A",    label: "Finestra 1 anta",           icon: "🪟", cat: "Finestre", settore: "serramenti" },
  { code: "F2A",    label: "Finestra 2 ante",            icon: "🪟", cat: "Finestre", settore: "serramenti" },
  { code: "F3A",    label: "Finestra 3 ante",            icon: "🪟", cat: "Finestre", settore: "serramenti" },
  { code: "F4A",    label: "Finestra 4 ante",            icon: "🪟", cat: "Finestre", settore: "serramenti" },
  { code: "F2AFISDX", label: "Finestra 2A + Fisso DX",  icon: "🪟", cat: "Finestre", settore: "serramenti" },
  { code: "F2AFISSX", label: "Finestra 2A + Fisso SX",  icon: "🪟", cat: "Finestre", settore: "serramenti" },
  { code: "FISDX",  label: "Fisso DX",                  icon: "▮",  cat: "Finestre", settore: "serramenti" },
  { code: "FISSX",  label: "Fisso SX",                  icon: "▮",  cat: "Finestre", settore: "serramenti" },
  { code: "VAS",    label: "Vasistas",                  icon: "⬇",  cat: "Finestre", settore: "serramenti" },
  { code: "RIBALTA",label: "Ribalta",                   icon: "⬆",  cat: "Finestre", settore: "serramenti" },
  // Balconi / Portafinestre
  { code: "PF1A",   label: "Balcone 1 anta",            icon: "🚪", cat: "Balconi", settore: "serramenti" },
  { code: "PF2A",   label: "Balcone 2 ante",            icon: "🚪", cat: "Balconi", settore: "serramenti" },
  { code: "PF3A",   label: "Balcone 3 ante",            icon: "🚪", cat: "Balconi", settore: "serramenti" },
  { code: "PF4A",   label: "Balcone 4 ante",            icon: "🚪", cat: "Balconi", settore: "serramenti" },
  { code: "PF2AFISDX", label: "Balcone 2A + Fisso DX", icon: "🚪", cat: "Balconi", settore: "serramenti" },
  { code: "PF2AFISSX", label: "Balcone 2A + Fisso SX", icon: "🚪", cat: "Balconi", settore: "serramenti" },
  // Scorrevoli / Alzanti
  { code: "SC2A",   label: "Scorrevole 2 ante",         icon: "↔️", cat: "Scorrevoli", settore: "serramenti" },
  { code: "SC4A",   label: "Scorrevole 4 ante",         icon: "↔️", cat: "Scorrevoli", settore: "serramenti" },
  { code: "SCRDX",  label: "Scorrevole DX",             icon: "▶",  cat: "Scorrevoli", settore: "serramenti" },
  { code: "SCRSX",  label: "Scorrevole SX",             icon: "◀",  cat: "Scorrevoli", settore: "serramenti" },
  { code: "ALZDX",  label: "Alzante DX",                icon: "⬆",  cat: "Scorrevoli", settore: "serramenti" },
  { code: "ALZSX",  label: "Alzante SX",                icon: "⬆",  cat: "Scorrevoli", settore: "serramenti" },
  // Persiane / Oscuramenti
  { code: "PERS1A", label: "Persiana 1 anta",           icon: "🌂", cat: "Persiane", settore: "persiane" },
  { code: "PERS2A", label: "Persiana 2 ante",           icon: "🌂", cat: "Persiane", settore: "persiane" },
  { code: "PERS3A", label: "Persiana 3 ante",           icon: "🌂", cat: "Persiane", settore: "persiane" },
  { code: "PERSOR", label: "Persiana orientabile",      icon: "🔄", cat: "Persiane", settore: "persiane" },
  { code: "SCURO1", label: "Scuro 1 anta",              icon: "🚪", cat: "Persiane", settore: "persiane" },
  { code: "SCURO2", label: "Scuro 2 ante",              icon: "🚪", cat: "Persiane", settore: "persiane" },
  // Tapparelle / Avvolgibili
  { code: "TAPP",   label: "Tapparella",                icon: "⬇",  cat: "Tapparelle", settore: "tapparelle" },
  { code: "TAPPAL", label: "Tapparella alluminio",      icon: "⬇",  cat: "Tapparelle", settore: "tapparelle" },
  { code: "TAPPPVC",label: "Tapparella PVC",            icon: "⬇",  cat: "Tapparelle", settore: "tapparelle" },
  { code: "TAPPBL", label: "Tapparella blindata",       icon: "🛡", cat: "Tapparelle", settore: "tapparelle" },
  { code: "TAPPMOT",label: "Tapparella motorizzata",    icon: "⚡", cat: "Tapparelle", settore: "tapparelle" },
  { code: "ORIENTA",label: "Avvolgibile orientabile",   icon: "🔄", cat: "Tapparelle", settore: "tapparelle" },
  { code: "CASS",   label: "Cassonetto",                icon: "🧊", cat: "Tapparelle", settore: "tapparelle" },
  // Zanzariere
  { code: "ZANZLAT",label: "Zanzariera laterale",       icon: "🕸", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZVER",label: "Zanzariera verticale",      icon: "🕸", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZPLI",label: "Zanzariera plissé",         icon: "🕸", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZBAT",label: "Zanzariera battente",       icon: "🕸", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZFIX",label: "Zanzariera fissa",          icon: "🕸", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZMAG",label: "Zanzariera magnetica",      icon: "🧲", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZ2A", label: "Zanzariera 2 ante plissé",  icon: "🕸", cat: "Zanzariere", settore: "zanzariere" },
  // Tende da sole
  { code: "TDBR",   label: "Tenda a bracci",            icon: "☀️", cat: "Tende da sole", settore: "tende" },
  { code: "TDCAD",  label: "Tenda a caduta",            icon: "☀️", cat: "Tende da sole", settore: "tende" },
  { code: "TDCAP",  label: "Cappottina",                icon: "☀️", cat: "Tende da sole", settore: "tende" },
  { code: "TDVER",  label: "Tenda verticale",           icon: "☀️", cat: "Tende da sole", settore: "tende" },
  { code: "TDRUL",  label: "Tenda a rullo",             icon: "☀️", cat: "Tende da sole", settore: "tende" },
  { code: "TDPERG", label: "Pergola bioclimatica",      icon: "🏗", cat: "Tende da sole", settore: "tende" },
  { code: "TDZIP",  label: "Tenda ZIP / Screen",        icon: "☀️", cat: "Tende da sole", settore: "tende" },
  { code: "TDVELA", label: "Vela ombreggiante",         icon: "⛵", cat: "Tende da sole", settore: "tende" },
  { code: "VENEZIA",label: "Veneziana",                 icon: "▤",  cat: "Tende da sole", settore: "tende" },
  // Box doccia
  { code: "BXNIC",  label: "Box doccia nicchia",        icon: "🚿", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXANG",  label: "Box doccia angolare",       icon: "🚿", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXWALK", label: "Walk-in",                   icon: "🚿", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXVAS",  label: "Parete vasca",              icon: "🛁", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXSEM",  label: "Box semicircolare",         icon: "🚿", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXPENT", label: "Box pentagonale",           icon: "🚿", cat: "Box doccia", settore: "boxdoccia" },
  { code: "PIATTO", label: "Piatto doccia",             icon: "⬜", cat: "Box doccia", settore: "boxdoccia" },
  // Porte
  { code: "PTINT1", label: "Porta interna battente",    icon: "🚪", cat: "Porte", settore: "porte" },
  { code: "PTINT2", label: "Porta interna 2 ante",      icon: "🚪", cat: "Porte", settore: "porte" },
  { code: "PTSCO",  label: "Porta scorrevole",          icon: "↔️", cat: "Porte", settore: "porte" },
  { code: "PTSCC",  label: "Porta scorrevole a scomparsa", icon: "↔️", cat: "Porte", settore: "porte" },
  { code: "PTFIL",  label: "Porta filomuro",            icon: "▯",  cat: "Porte", settore: "porte" },
  { code: "PTSOF",  label: "Porta a soffietto",         icon: "🪗", cat: "Porte", settore: "porte" },
  { code: "BLI",    label: "Porta blindata",            icon: "🛡", cat: "Porte", settore: "porte" },
  { code: "PTSEZ",  label: "Portone sezionale",         icon: "🏠", cat: "Porte", settore: "porte" },
  // Altro
  { code: "SOPR",   label: "Sopraluce",                 icon: "△",  cat: "Altro", settore: "serramenti" },
  { code: "MONO",   label: "Monoblocco",                icon: "⬜",  cat: "Altro", settore: "serramenti" },
  { code: "GRATA",  label: "Grata di sicurezza",        icon: "🔒", cat: "Altro", settore: "serramenti" },
  { code: "CANC",   label: "Cancello",                  icon: "🚧", cat: "Altro", settore: "serramenti" },
  { code: "VERANDA",label: "Veranda / Vetrata",         icon: "🏠", cat: "Altro", settore: "serramenti" },
];

// === SETTORI / CATEGORIE ATTIVABILI ===
export const SETTORI = [
  { id: "serramenti", label: "Finestre e Serramenti", icon: "🪟", desc: "Finestre, balconi, scorrevoli, alzanti, fissi" },
  { id: "porte", label: "Porte", icon: "🚪", desc: "Porte interne, blindate, scorrevoli, sezionali" },
  { id: "persiane", label: "Persiane e Scuri", icon: "🌂", desc: "Persiane in alluminio, legno, PVC, scuri" },
  { id: "tapparelle", label: "Tapparelle e Avvolgibili", icon: "⬇", desc: "Tapparelle, cassonetti, motorizzazioni" },
  { id: "zanzariere", label: "Zanzariere", icon: "🕸", desc: "Laterali, verticali, plissé, battenti, magnetiche" },
  { id: "tende", label: "Tende da Sole", icon: "☀️", desc: "Bracci, caduta, cappottine, pergole, ZIP, veneziane" },
  { id: "boxdoccia", label: "Box Doccia", icon: "🚿", desc: "Nicchia, angolari, walk-in, pareti vasca" },
];

export const SETTORI_DEFAULT = ["serramenti", "persiane", "tapparelle", "zanzariere"]; // serramentista classico

export const COPRIFILI_INIT = [
  { id: 1, nome: "Coprifilo piatto 40mm", cod: "CP40", prezzoMl: 4.5 },
  { id: 2, nome: "Coprifilo piatto 50mm", cod: "CP50", prezzoMl: 5.5 },
  { id: 3, nome: "Coprifilo piatto 70mm", cod: "CP70", prezzoMl: 7.0 },
  { id: 4, nome: "Coprifilo angolare 40mm", cod: "CA40", prezzoMl: 5.0 },
  { id: 5, nome: "Coprifilo a Z 50mm", cod: "CZ50", prezzoMl: 6.0 },
];

export const LAMIERE_INIT = [
  { id: 1, nome: "Lamiera davanzale 200mm", cod: "LD200", prezzoMl: 8.0 },
  { id: 2, nome: "Lamiera davanzale 250mm", cod: "LD250", prezzoMl: 9.5 },
  { id: 3, nome: "Lamiera davanzale 300mm", cod: "LD300", prezzoMl: 11.0 },
  { id: 4, nome: "Scossalina 150mm", cod: "SC150", prezzoMl: 7.0 },
  { id: 5, nome: "Scossalina 200mm", cod: "SC200", prezzoMl: 8.5 },
];


/* == MISURE PUNTI == */
export const PUNTI_MISURE = [
  { key: "lAlto", label: "L alto", x: 95, y: 8, color: "acc" },
  { key: "lCentro", label: "L centro", x: 95, y: 125, color: "acc" },
  { key: "lBasso", label: "L basso", x: 95, y: 242, color: "acc" },
  { key: "hSx", label: "H sx", x: 8, y: 125, color: "blue", rot: true },
  { key: "hCentro", label: "H centro", x: 95, y: 170, color: "blue" },
  { key: "hDx", label: "H dx", x: 182, y: 125, color: "blue", rot: true },
  { key: "d1", label: "D1 ↗", x: 50, y: 55, color: "purple" },
  { key: "d2", label: "D2 ↘", x: 140, y: 55, color: "purple" },
];

/* ====================================== */
/* ==          MAIN COMPONENT          == */
/* ====================================== */


// === TIPI EVENTO (module-level) ===
export const TIPI_EVENTO = [
  { id: "sopralluogo", l: "📐 Sopralluogo", c: "#007aff" },
  { id: "misure", l: "📏 Misure", c: "#5856d6" },
  { id: "preventivo", l: "📋 Preventivo", c: "#af52de" },
  { id: "posa", l: "🔧 Posa", c: "#34c759" },
  { id: "consegna", l: "📦 Consegna", c: "#ff9500" },
  { id: "riparazione", l: "🛠 Riparazione", c: "#FF3B30" },
  { id: "collaudo", l: "✔️ Collaudo", c: "#30b0c7" },
  { id: "telefonata", l: "📞 Telefonata", c: "#007aff" },
  { id: "riunione", l: "🤝 Riunione", c: "#8E8E93" },
  { id: "manutenzione", l: "🔩 Manutenzione", c: "#FF6B00" },
  { id: "altro", l: "📅 Altro", c: "#D08008" },
];
export const tipoEvColor = (tipo) => {
  const t = TIPI_EVENTO.find(x => x.id === tipo);
  return t ? t.c : "#D08008";
};


// Font families
export const FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;600&display=swap";
export const FF = "'Plus Jakarta Sans',sans-serif";
export const FM = "'JetBrains Mono',monospace";
