import {
  MastroTabletStore,
} from "./mastro-tablet-types";

// =========================================================
// DATASET MASTRO TABLET - 5 commesse coerenti
// Protagonista: Verdi Giuseppe (C-2026-051)
// =========================================================

export const STORE: MastroTabletStore = {
  clienti: [
    { id: "cli-verdi",    nome: "Verdi Giuseppe",     citta: "Cosenza",       indirizzo: "Via Roma 12",         tipo: "privato",  preset: "a", telefono: "+39 320 1234567", email: "g.verdi@email.it",         cf: "VRDGSP70A01D086X" },
    { id: "cli-bianchi",  nome: "Bianchi Maria",      citta: "Rende",         indirizzo: "Via XX Settembre 5",  tipo: "privato",  preset: "b", telefono: "+39 333 7654321", email: "m.bianchi@gmail.com",      cf: "BNCMRA75M41D086W" },
    { id: "cli-rossi",    nome: "Rossi & Co. SRL",    citta: "Castrolibero",  indirizzo: "Via dell'Industria 4", tipo: "azienda",  preset: "c", telefono: "+39 0984 555111", email: "info@rossi-srl.it",        piva: "IT 02345678901" },
    { id: "cli-esposito", nome: "Esposito Franco",    citta: "Mendicino",     indirizzo: "Via Garibaldi 45",    tipo: "privato",  preset: "d", telefono: "+39 347 2345678", email: "f.esposito@yahoo.it",      cf: "SPSFNC68B12D086P" },
    { id: "cli-marino",   nome: "Marino Edilizia SAS",citta: "Cosenza",       indirizzo: "Via Roma 88",         tipo: "azienda",  preset: "e", telefono: "+39 0984 333222", email: "amministrazione@marino.it",piva: "IT 03456789012" },
  ],

  operatori: [
    { id: "op-walter", nome: "Walter",  cognome: "Cozza",    ruolo: "titolare",     status: "online",    preset: "b", tel: "+39 320 1112233", email: "walter@mastrosuite.it",       oreSettimana: 38, oreMese: 156, efficienza: 95 },
    { id: "op-marco",  nome: "Marco",   cognome: "Esposito", ruolo: "posatore",     status: "trasferta", preset: "a", tel: "+39 333 4567890", email: "m.esposito@mastrosuite.it",   oreSettimana: 42, oreMese: 168, efficienza: 92 },
    { id: "op-luca",   nome: "Luca",    cognome: "Bianchi",  ruolo: "posatore",     status: "online",    preset: "e", tel: "+39 347 1234567", email: "l.bianchi@mastrosuite.it",    oreSettimana: 40, oreMese: 162, efficienza: 88 },
    { id: "op-anna",   nome: "Anna",    cognome: "Verdi",    ruolo: "segreteria",   status: "online",    preset: "c", tel: "+39 351 9876543", email: "a.verdi@mastrosuite.it",      oreSettimana: 36, oreMese: 144, efficienza: 96 },
    { id: "op-paolo",  nome: "Paolo",   cognome: "Rossi",    ruolo: "magazziniere", status: "offline",   preset: "d", tel: "+39 388 1234567", email: "p.rossi@mastrosuite.it",      oreSettimana: 38, oreMese: 152, efficienza: 90 },
  ],

  commesse: [
    {
      id: "com-051", numero: "C-2026-051", clienteId: "cli-verdi", apertaIl: "10 mar 2026",
      fase: "produzione", posatoreId: "op-walter", valore: 12450,
      note: "Sostituzione integrale infissi appartamento 3 piano. Ecobonus 65%.",
      vani: [
        { id: "v1", codice: "V01", ambiente: "Soggiorno",  larghezza_mm: 1800, altezza_mm: 2400, forma: "rettangolare", tipologia: "Porta-finestra 2 ante", pezzi: 1 },
        { id: "v2", codice: "V02", ambiente: "Cucina",     larghezza_mm: 1200, altezza_mm: 1400, forma: "rettangolare", tipologia: "Finestra 2 ante",        pezzi: 1 },
        { id: "v3", codice: "V03", ambiente: "Camera",     larghezza_mm: 1000, altezza_mm: 1400, forma: "rettangolare", tipologia: "Finestra 2 ante",        pezzi: 1 },
        { id: "v4", codice: "V04", ambiente: "Cameretta",  larghezza_mm: 1000, altezza_mm: 1400, forma: "rettangolare", tipologia: "Finestra 2 ante",        pezzi: 1 },
        { id: "v5", codice: "V05", ambiente: "Bagno",      larghezza_mm:  800, altezza_mm: 1000, forma: "rettangolare", tipologia: "Finestra 1 anta",         pezzi: 1 },
        { id: "v6", codice: "V06", ambiente: "Bagno 2",    larghezza_mm:  600, altezza_mm: 1000, forma: "rettangolare", tipologia: "Finestra 1 anta",         pezzi: 1 },
        { id: "v7", codice: "V07", ambiente: "Ingresso",   larghezza_mm: 1100, altezza_mm: 2200, forma: "arco",         tipologia: "Porta blindata",          pezzi: 1 },
        { id: "v8", codice: "V08", ambiente: "Balcone",    larghezza_mm: 2400, altezza_mm: 2400, forma: "rettangolare", tipologia: "Scorrevole 3 ante",       pezzi: 1 },
      ],
    },
    {
      id: "com-050", numero: "C-2026-050", clienteId: "cli-bianchi", apertaIl: "15 mar 2026",
      fase: "ordine_confermato", posatoreId: "op-marco", valore: 6820,
      vani: [
        { id: "v1", codice: "V01", ambiente: "Soggiorno", larghezza_mm: 1500, altezza_mm: 1400, forma: "rettangolare", tipologia: "Finestra 2 ante", pezzi: 1 },
        { id: "v2", codice: "V02", ambiente: "Cucina",    larghezza_mm: 1200, altezza_mm: 1400, forma: "rettangolare", tipologia: "Finestra 2 ante", pezzi: 1 },
        { id: "v3", codice: "V03", ambiente: "Camera",    larghezza_mm: 1000, altezza_mm: 1400, forma: "rettangolare", tipologia: "Finestra 1 anta", pezzi: 1 },
        { id: "v4", codice: "V04", ambiente: "Bagno",     larghezza_mm:  800, altezza_mm: 1000, forma: "rettangolare", tipologia: "Finestra 1 anta", pezzi: 1 },
      ],
    },
    {
      id: "com-049", numero: "C-2026-049", clienteId: "cli-rossi", apertaIl: "20 mar 2026",
      fase: "montaggio", posatoreId: "op-walter", valore: 18900,
      vani: [
        { id: "v1", codice: "V01", ambiente: "Uffici 1-6",  larghezza_mm: 1500, altezza_mm: 2200, forma: "rettangolare", tipologia: "Finestra fissa", pezzi: 6 },
        { id: "v2", codice: "V02", ambiente: "Sala riunioni",larghezza_mm: 3000, altezza_mm: 2400, forma: "rettangolare", tipologia: "Vetrata fissa",  pezzi: 1 },
        { id: "v3", codice: "V03", ambiente: "Reception",   larghezza_mm: 2500, altezza_mm: 2200, forma: "rettangolare", tipologia: "Porta automatica",pezzi: 1 },
      ],
    },
    {
      id: "com-048", numero: "C-2026-048", clienteId: "cli-esposito", apertaIl: "1 apr 2026",
      fase: "preventivo", posatoreId: "op-luca", valore: 4350,
      vani: [
        { id: "v1", codice: "V01", ambiente: "Soggiorno", larghezza_mm: 1400, altezza_mm: 1400, forma: "rettangolare", tipologia: "Finestra 2 ante", pezzi: 1 },
        { id: "v2", codice: "V02", ambiente: "Camera",    larghezza_mm: 1000, altezza_mm: 1400, forma: "rettangolare", tipologia: "Finestra 2 ante", pezzi: 1 },
        { id: "v3", codice: "V03", ambiente: "Bagno",     larghezza_mm:  800, altezza_mm: 1000, forma: "rettangolare", tipologia: "Finestra 1 anta", pezzi: 1 },
      ],
    },
    {
      id: "com-047", numero: "C-2026-047", clienteId: "cli-marino", apertaIl: "10 apr 2026",
      fase: "rilievo_confermato", posatoreId: "op-walter", valore: 9200,
      vani: [
        { id: "v1", codice: "V01", ambiente: "Capannone A", larghezza_mm: 2000, altezza_mm: 3000, forma: "rettangolare", tipologia: "Portone industriale", pezzi: 2 },
        { id: "v2", codice: "V02", ambiente: "Capannone B", larghezza_mm: 1500, altezza_mm: 2400, forma: "rettangolare", tipologia: "Finestra industriale",pezzi: 4 },
      ],
    },
  ],

  sopralluoghi: [
    { id: "sop-1", numero: "SP-2026-068", clienteId: "cli-verdi",    commessaId: "com-051", data: "10 mar 2026", giorno: "Mar 10", ora: "09:00", posatoreId: "op-marco",  stato: "completato", note: "Appartamento 3 piano. Citofonare \"Verdi\"." },
    { id: "sop-2", numero: "SP-2026-067", clienteId: "cli-bianchi",  commessaId: "com-050", data: "15 mar 2026", giorno: "Dom 15", ora: "15:00", posatoreId: "op-luca",   stato: "completato" },
    { id: "sop-3", numero: "SP-2026-070", clienteId: "cli-rossi",    commessaId: "com-049", data: "20 mar 2026", giorno: "Ven 20", ora: "10:00", posatoreId: "op-walter", stato: "completato" },
    { id: "sop-4", numero: "SP-2026-072", clienteId: "cli-esposito", commessaId: "com-048", data: "27 apr 2026", giorno: "Lun 27", ora: "14:00", posatoreId: "op-marco",  stato: "confermato", note: "Sopralluogo confermato dopo prima visita." },
    { id: "sop-5", numero: "SP-2026-071", clienteId: "cli-marino",   commessaId: "com-047", data: "28 apr 2026", giorno: "Mar 28", ora: "11:30", posatoreId: "op-walter", stato: "in_attesa" },
  ],

  preventivi: [
    { id: "prev-051", numero: "PV-2026-051", commessaId: "com-051", data: "12 mar 2026", iva: 10, importo: 12450, stato: "accettato", righe: [] },
    { id: "prev-050", numero: "PV-2026-050", commessaId: "com-050", data: "16 mar 2026", iva: 10, importo: 6820,  stato: "accettato", righe: [] },
    { id: "prev-049", numero: "PV-2026-049", commessaId: "com-049", data: "22 mar 2026", iva: 22, importo: 18900, stato: "accettato", righe: [] },
    { id: "prev-048", numero: "PV-2026-048", commessaId: "com-048", data: "21 apr 2026", iva: 10, importo: 4350,  stato: "inviato",   righe: [] },
  ],

  ordini: [
    { id: "ord-024", numero: "OF-2026-024", commessaIds: ["com-051"],            fornitoreId: "f-aluplast", fornitoreNome: "Aluplast Italia",   fornitoreColor: "blue",   categoria: "Profili PVC",       data: "21 apr 2026", consegnaPrevista: "5 mag 2026", giorniRitardo: 0,  pezzi: 13, importo: 4890, stato: "in_consegna" },
    { id: "ord-023", numero: "OF-2026-023", commessaIds: ["com-051"],            fornitoreId: "f-aluplast", fornitoreNome: "Aluplast Italia",   fornitoreColor: "blue",   categoria: "Profili PVC",       data: "20 apr 2026", consegnaPrevista: "2 mag 2026", giorniRitardo: 0,  pezzi: 24, importo: 8240, stato: "confermato"  },
    { id: "ord-022", numero: "OF-2026-022", commessaIds: ["com-050"],            fornitoreId: "f-schuco",   fornitoreNome: "Schuco Italia",     fornitoreColor: "amber",  categoria: "Profili Alluminio", data: "18 apr 2026", consegnaPrevista: "30 apr 2026",giorniRitardo: 0,  pezzi: 6,  importo: 2150, stato: "confermato"  },
    { id: "ord-021", numero: "OF-2026-021", commessaIds: ["com-049","com-050"], fornitoreId: "f-saintgobain",fornitoreNome: "Saint-Gobain Glass",fornitoreColor: "violet", categoria: "Vetri",              data: "15 apr 2026", consegnaPrevista: "28 apr 2026",giorniRitardo: 0,  pezzi: 32, importo: 5680, stato: "in_consegna" },
    { id: "ord-020", numero: "OF-2026-020", commessaIds: ["com-049","com-050"], fornitoreId: "f-maico",    fornitoreNome: "Maico Hardware",    fornitoreColor: "green",  categoria: "Ferramenta",        data: "12 apr 2026", consegnaPrevista: "22 apr 2026",giorniRitardo: 3,  pezzi: 48, importo: 1450, stato: "in_consegna" },
    { id: "ord-019", numero: "OF-2026-019", commessaIds: ["com-049"],            fornitoreId: "f-aluplast", fornitoreNome: "Aluplast Italia",   fornitoreColor: "blue",   categoria: "Profili PVC",       data: "10 apr 2026", consegnaPrevista: "20 apr 2026",giorniRitardo: 0,  pezzi: 18, importo: 6320, stato: "ricevuto"    },
  ],

  produzioni: [
    { id: "pr-051", commessaId: "com-051", sistemaProfilo: "Aluplast IDEAL 7000", vani: 8,  pezzi: 13, consegnaPrevista: "5 mag", giorniMancanti: 8,  avanzamentoPct: 65, stato: "in_lavorazione", posatoreAssegnato: "Walter Cozza",   posatoreAvatar: "b", priorita: "alta"  },
    { id: "pr-050", commessaId: "com-050", sistemaProfilo: "Twin CX450",          vani: 4,  pezzi: 6,  consegnaPrevista: "12 mag",giorniMancanti: 15, avanzamentoPct: 0,  stato: "da_iniziare",    posatoreAssegnato: "Marco Esposito", posatoreAvatar: "a", priorita: "media" },
    { id: "pr-049", commessaId: "com-049", sistemaProfilo: "Twin CX700",          vani: 12, pezzi: 18, consegnaPrevista: "30 apr",giorniMancanti: 3,  avanzamentoPct: 95, stato: "qa",             posatoreAssegnato: "Walter Cozza",   posatoreAvatar: "b", priorita: "alta"  },
    { id: "pr-048", commessaId: "com-048", sistemaProfilo: "Aluplast IDEAL 7000", vani: 3,  pezzi: 5,  consegnaPrevista: "8 mag", giorniMancanti: 11, avanzamentoPct: 0,  stato: "non_iniziata",   posatoreAssegnato: "Luca Bianchi",   posatoreAvatar: "e", priorita: "bassa" },
  ],

  montaggi: [
    { id: "m-049-1", numero: "C-2026-049", commessaId: "com-049", data: "27 apr 2026", giornoLabel: "Lun 27 apr", ora: "09:00", durataOre: 5, squadraIds: ["op-walter","op-marco"],            vani: 12, pezzi: 18, stato: "pianificato" },
    { id: "m-051-1", numero: "C-2026-051", commessaId: "com-051", data: "12 mag 2026", giornoLabel: "Mar 12 mag", ora: "08:30", durataOre: 8, squadraIds: ["op-walter","op-marco","op-luca"], vani: 8,  pezzi: 13, stato: "pianificato" },
  ],

  fatture: [
    { id: "fat-049", numero: "FE-2026-049", commessaId: "com-049", data: "20 apr 2026", importo: 9450,  stato: "emessa" },
    { id: "fat-051", numero: "FE-2026-051", commessaId: "com-051", data: "22 apr 2026", importo: 3735,  stato: "pagata" },
    { id: "fat-050", numero: "FE-2026-050", commessaId: "com-050", data: "21 apr 2026", importo: 3450,  stato: "emessa" },
    { id: "fat-048", numero: "FE-2026-048", commessaId: "com-048", data: "10 apr 2026", importo: 1240,  stato: "scaduta" },
  ],

  pagamenti: [
    { id: "pay-1", data: "Oggi 11:30",     fatturaId: "fat-051", cliente: "Verdi Giuseppe",  metodo: "Bonifico",      importo: 3735, tipo: "incasso" },
    { id: "pay-2", data: "Oggi 09:15",     ordineId:  "ord-022", cliente: "Schuco Italia",   metodo: "Bonifico USC",  importo: 2150, tipo: "uscita"  },
    { id: "pay-3", data: "Ieri 16:42",     fatturaId: "fat-049", cliente: "Rossi & Co.",     metodo: "Bonifico",      importo: 9450, tipo: "incasso" },
    { id: "pay-4", data: "Ieri 10:20",     ordineId:  "ord-021", cliente: "Saint-Gobain",    metodo: "Bonifico USC",  importo: 5680, tipo: "uscita"  },
    { id: "pay-5", data: "23 apr",         fatturaId: "fat-050", cliente: "Bianchi Maria",   metodo: "POS",           importo: 1500, tipo: "incasso" },
  ],

  pratiche: [
    { id: "fis-051", numero: "PR-2026-024", commessaId: "com-051", tipo: "ecobonus_65",   importoLordo: 12450, importoDetraibile: 8093, iva: 10, zonaClimatica: "C", cam: true,  enea: "da_inviare",     stato: "in_lavorazione", norma: "DL 34/2020 art.119-ter" },
    { id: "fis-050", numero: "PR-2026-023", commessaId: "com-050", tipo: "ecobonus_50",   importoLordo: 6820,  importoDetraibile: 3410, iva: 10, zonaClimatica: "C", cam: true,  enea: "inviata",        stato: "completata",     norma: "L.296/2006 c.345"        },
    { id: "fis-049", numero: "PR-2026-022", commessaId: "com-049", tipo: "bonus_casa_50", importoLordo: 18900, importoDetraibile: 9450, iva: 22, zonaClimatica: "C", cam: false, enea: "non_richiesta",  stato: "aperta",         norma: "DPR 917/86 art.16-bis"  },
    { id: "fis-048", numero: "PR-2026-021", commessaId: "com-048", tipo: "iva_10",        importoLordo: 4350,  importoDetraibile: 0,    iva: 10, zonaClimatica: "B", cam: true,  enea: "non_richiesta",  stato: "aperta",         norma: "DPR 633/72 tab.A III"   },
  ],

  articoli: [
    { id: "ar-1",  codice: "AL-7000-01", nome: "Profilo telaio fisso",     descrizione: "Aluplast IDEAL 7000 - bianco",   categoria: "profili",     scorta: 142, scortaMin: 50,  unita: "m",      prezzoMedio: 18.40, ubicazione: "A-12" },
    { id: "ar-2",  codice: "AL-7000-02", nome: "Profilo anta",              descrizione: "Aluplast IDEAL 7000 - bianco",   categoria: "profili",     scorta: 28,  scortaMin: 40,  unita: "m",      prezzoMedio: 22.80, ubicazione: "A-13" },
    { id: "ar-3",  codice: "AL-7000-03", nome: "Profilo montante centrale",  descrizione: "Aluplast IDEAL 7000",            categoria: "profili",     scorta: 0,   scortaMin: 20,  unita: "m",      prezzoMedio: 19.20, ubicazione: "A-14" },
    { id: "ar-4",  codice: "VT-44.2-LE", nome: "Vetrocamera 44.2 Low-E",     descrizione: "Saint-Gobain Climaplus",         categoria: "vetri",       scorta: 18,  scortaMin: 10,  unita: "mq",     prezzoMedio: 64.50, ubicazione: "B-03" },
    { id: "ar-5",  codice: "MA-DK-WH",   nome: "Maniglia DK bianca",        descrizione: "Maico Mover - bianco RAL 9016",  categoria: "ferramenta",  scorta: 86,  scortaMin: 30,  unita: "pz",     prezzoMedio: 12.80, ubicazione: "C-08" },
    { id: "ar-6",  codice: "GU-EPDM-12", nome: "Guarnizione EPDM nera",      descrizione: "Sezione 12mm - bobina 100m",     categoria: "guarnizioni", scorta: 8,   scortaMin: 5,   unita: "rotolo", prezzoMedio: 42.00, ubicazione: "D-02" },
  ],

  movimenti: [
    { id: "mv1", tipo: "scarico", articoloId: "ar-2", articoloNome: "Profilo anta IDEAL 7000",  qta: 24,  unita: "m",  data: "Oggi 11:30",    riferimento: "C-2026-051" },
    { id: "mv2", tipo: "carico",  articoloId: "ar-5", articoloNome: "Maniglia DK bianca",        qta: 50,  unita: "pz", data: "Oggi 09:15",    riferimento: "OF-2026-024" },
    { id: "mv3", tipo: "scarico", articoloId: "ar-4", articoloNome: "Vetrocamera 44.2 Low-E",    qta: 4.8, unita: "mq", data: "Ieri 16:42",    riferimento: "C-2026-050" },
    { id: "mv4", tipo: "scarico", articoloId: "ar-2", articoloNome: "Profilo anta IDEAL 7000",  qta: 18,  unita: "m",  data: "Ieri 14:20",    riferimento: "C-2026-049" },
    { id: "mv5", tipo: "carico",  articoloId: "ar-1", articoloNome: "Profilo telaio IDEAL 7000",qta: 80,  unita: "m",  data: "23 apr 10:00",  riferimento: "OF-2026-023" },
  ],

  timeline: [
    { id: "t1", commessaId: "com-051", data: "10 mar 2026", fase: "rilievo",            testo: "Sopralluogo iniziale - 8 vani rilevati",        autoreId: "op-marco"  },
    { id: "t2", commessaId: "com-051", data: "12 mar 2026", fase: "rilievo_confermato", testo: "Rilievo confermato dal cliente",                 autoreId: "op-walter" },
    { id: "t3", commessaId: "com-051", data: "12 mar 2026", fase: "preventivo",         testo: "Preventivo PV-2026-051 inviato",                 autoreId: "op-anna"   },
    { id: "t4", commessaId: "com-051", data: "18 mar 2026", fase: "conferma_ordine",    testo: "Cliente ha controfirmato il preventivo",          autoreId: "op-walter" },
    { id: "t5", commessaId: "com-051", data: "20 apr 2026", fase: "ordine_confermato",  testo: "Ordine fornitori OF-024 e OF-023 emessi",        autoreId: "op-anna"   },
    { id: "t6", commessaId: "com-051", data: "22 apr 2026", fase: "produzione",         testo: "Inizio produzione - 65% completato",             autoreId: "op-walter" },
  ],
};
