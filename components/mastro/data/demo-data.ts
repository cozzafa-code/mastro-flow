// MASTRO ERP — Dati Demo
// Questo file contiene tutti i dati iniziali per la demo

/* == DATI DEMO == */
// ═══ DEMO DATA — 4 clienti reali a stadi diversi del flusso ═══
export const CANTIERI_INIT = [
  // CM-001: SOPRALLUOGO — appena creato, nessun rilievo → Centro Comando mostra Passo 1
  {
    id: 1001, code: "S-0001", cliente: "Giuseppe", cognome: "Verdi", indirizzo: "Via Garibaldi 12, Rende (CS)",
    telefono: "347 555 1234", email: "giuseppe.verdi@email.it", fase: "sopralluogo",
    sistema: "Aluplast Ideal 4000", tipo: "nuova", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "2°",
    note: "Appartamento secondo piano, 5 finestre da sostituire. Cliente vuole preventivo entro venerdì.",
    rilievi: [], allegati: [],
    creato: "25 feb", aggiornato: "25 feb",
    cf: "VRDGPP80A01D086Z", piva: "", sdi: "", pec: "",
    log: [{ chi: "Fabio", cosa: "creato la commessa", quando: "2 giorni fa", color: "#86868b" }],
  },
  // CM-002: MISURE — ha rilievo + vani CON misure e sistema → Centro Comando mostra Passo 2 (prezzi calcolati) o Passo 3 (firma)
  {
    id: 1002, code: "S-0002", cliente: "Anna", cognome: "Bianchi", indirizzo: "Corso Mazzini 88, Cosenza (CS)",
    telefono: "339 888 5678", email: "anna.bianchi@gmail.com", fase: "preventivo",
    sistema: "Aluplast Ideal 4000", tipo: "nuova", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "1°",
    note: "Ristrutturazione completa. IVA agevolata 10%. Vuole colore RAL 7016 esterno, bianco interno.",
    prezzoMq: 180,
    rilievi: [{
      id: 2001, n: 1, data: "2026-02-20", ora: "09:30", rilevatore: "Fabio", tipo: "rilievo",
      motivoModifica: "", note: "Tutti i vani accessibili. Muri in buono stato.", stato: "completato",
      vani: [
        {
          id: 3001, nome: "Finestra 2A Soggiorno", tipo: "F2A", stanza: "Soggiorno", piano: "1°",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1210, lCentro: 1200, lBasso: 1195, hSx: 1410, hCentro: 1400, hDx: 1405, d1: 1852, d2: 1849 },
          foto: {}, note: "Esposta a sud", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: true, l: 1200, h: 1400 } },
        },
        {
          id: 3002, nome: "Portafinestra Camera", tipo: "PF2A", stanza: "Camera", piano: "1°",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1405, lCentro: 1400, lBasso: 1398, hSx: 2210, hCentro: 2200, hDx: 2205, d1: 2610, d2: 2607 },
          foto: {}, note: "Accesso balcone", cassonetto: false,
          accessori: { tapparella: { attivo: true, l: 1400, h: 2200 }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        {
          id: 3003, nome: "Vasistas Bagno", tipo: "VAS", stanza: "Bagno", piano: "1°",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 605, lCentro: 600, lBasso: 598, hSx: 605, hCentro: 600, hDx: 602, d1: 850, d2: 848 },
          foto: {}, note: "Vetro opaco", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        {
          id: 3004, nome: "Scorrevole Salone", tipo: "SC2A", stanza: "Salone", piano: "1°",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1810, lCentro: 1800, lBasso: 1795, hSx: 2210, hCentro: 2200, hDx: 2205, d1: 2843, d2: 2840 },
          foto: {}, note: "Accesso terrazzo grande", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: true, l: 1800, h: 2200 } },
        },
      ],
    }],
    allegati: [],
    creato: "20 feb", aggiornato: "22 feb",
    cf: "BNCNNA85C41D086Y", piva: "", sdi: "0000000", pec: "anna.bianchi@pec.it",
    ivaPerc: 10,
    log: [
      { chi: "Fabio", cosa: "completato rilievo misure — 4 vani", quando: "5 giorni fa", color: "#5856d6" },
      { chi: "Fabio", cosa: "creato la commessa", quando: "7 giorni fa", color: "#86868b" },
    ],
  },
  // CM-003: ORDINI — firmato + fatturato, deve ordinare al fornitore → Centro Comando mostra Passo 5
  {
    id: 1003, code: "S-0003", cliente: "Mario", cognome: "Rossi", indirizzo: "Via Roma 42, Cosenza (CS)",
    telefono: "338 123 4567", email: "mario.rossi@libero.it", fase: "ordini",
    sistema: "Aluplast Ideal 4000", tipo: "nuova", difficoltaSalita: "Media", mezzoSalita: "Scale interne", foroScale: "", pianoEdificio: "3°",
    note: "8 finestre totali. Ristrutturazione integrale. Bonus 50% confermato.",
    prezzoMq: 180,
    firmaCliente: true, dataFirma: "2026-02-15",
    firmaDocumento: { id: 9901, tipo: "firma", nome: "Preventivo_S-0003_firmato.pdf", data: "15/02/2026" },
    allegati: [
      { id: 9901, tipo: "firma", nome: "Preventivo_S-0003_firmato.pdf", data: "15/02/2026" },
      { id: 9902, tipo: "fattura", nome: "Fattura_001_2026_acconto.pdf", data: "15/02/2026" },
    ],
    rilievi: [{
      id: 2002, n: 1, data: "2026-02-10", ora: "10:00", rilevatore: "Fabio", tipo: "rilievo",
      motivoModifica: "", note: "Rilievo completo. Muri regolari.", stato: "completato",
      vani: [
        {
          id: 3010, nome: "Finestra 2A Soggiorno", tipo: "F2A", stanza: "Soggiorno", piano: "3°",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 9010", bicolore: false,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1205, lCentro: 1200, lBasso: 1198, hSx: 1410, hCentro: 1400, hDx: 1405, d1: 1852, d2: 1849 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        {
          id: 3011, nome: "Finestra 2A Camera 1", tipo: "F2A", stanza: "Camera", piano: "3°",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 9010", bicolore: false,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1005, lCentro: 1000, lBasso: 998, hSx: 1210, hCentro: 1200, hDx: 1205, d1: 1564, d2: 1561 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        {
          id: 3012, nome: "Portafinestra Salone", tipo: "PF2A", stanza: "Salone", piano: "3°",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 9010", bicolore: false,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1405, lCentro: 1400, lBasso: 1398, hSx: 2210, hCentro: 2200, hDx: 2205, d1: 2610, d2: 2607 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: true, l: 1400, h: 2200 }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        {
          id: 3013, nome: "Vasistas Bagno", tipo: "VAS", stanza: "Bagno", piano: "3°",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 9010", bicolore: false,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 605, lCentro: 600, lBasso: 600, hSx: 605, hCentro: 600, hDx: 600, d1: 849, d2: 849 },
          foto: {}, note: "Vetro opaco", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
      ],
    }],
    allegati: [],
    creato: "10 feb", aggiornato: "15 feb",
    cf: "RSSMRA75D15D086X", piva: "", sdi: "", pec: "",
    ivaPerc: 10,
    log: [
      { chi: "Fabio", cosa: "fattura acconto emessa", quando: "12 giorni fa", color: "#5856d6" },
      { chi: "Fabio", cosa: "cliente ha firmato", quando: "12 giorni fa", color: "#34c759" },
      { chi: "Fabio", cosa: "preventivo inviato", quando: "14 giorni fa", color: "#ff9500" },
      { chi: "Fabio", cosa: "completato rilievo — 4 vani", quando: "17 giorni fa", color: "#5856d6" },
      { chi: "Fabio", cosa: "creato la commessa", quando: "17 giorni fa", color: "#86868b" },
    ],
  },
  // CM-004: PRODUZIONE — tutto fatto fino a conferma AI, deve pianificare montaggio → Centro Comando Passo 7
  {
    id: 1004, code: "S-0004", cliente: "Laura", cognome: "Esposito", indirizzo: "Viale Trieste 5, Rende (CS)",
    telefono: "340 999 8765", email: "laura.esposito@outlook.it", fase: "produzione",
    sistema: "Aluplast Ideal 4000", tipo: "nuova", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "PT",
    note: "Piano terra villa. 6 finestre + 1 portafinestra. Colore noce esterno.",
    prezzoMq: 180,
    firmaCliente: true, dataFirma: "2026-01-20",
    firmaDocumento: { id: 9903, tipo: "firma", nome: "Preventivo_S-0004_firmato.pdf", data: "20/01/2026" },
    rilievi: [{
      id: 2003, n: 1, data: "2026-01-15", ora: "14:00", rilevatore: "Fabio", tipo: "rilievo",
      motivoModifica: "", note: "", stato: "completato",
      vani: [
        {
          id: 3020, nome: "Finestra 2A Cucina", tipo: "F2A", stanza: "Cucina", piano: "PT",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "Noce", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1205, lCentro: 1200, lBasso: 1198, hSx: 1410, hCentro: 1400, hDx: 1405, d1: 1852, d2: 1849 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        {
          id: 3021, nome: "Portafinestra Soggiorno", tipo: "PF2A", stanza: "Soggiorno", piano: "PT",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "Noce", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1405, lCentro: 1400, lBasso: 1398, hSx: 2210, hCentro: 2200, hDx: 2205, d1: 2610, d2: 2607 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: true, l: 1400, h: 2200 }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        {
          id: 3022, nome: "Finestra 1A Camera", tipo: "F1A", stanza: "Camera", piano: "PT",
          sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "Noce", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 805, lCentro: 800, lBasso: 798, hSx: 1210, hCentro: 1200, hDx: 1205, d1: 1443, d2: 1441 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
      ],
    }],
    allegati: [],
    creato: "15 gen", aggiornato: "10 feb",
    cf: "SPSLRA82E45D086W", piva: "", sdi: "", pec: "",
    ivaPerc: 10,
    log: [
      { chi: "Fabio", cosa: "conferma fornitore approvata — AI ha estratto dati", quando: "17 giorni fa", color: "#af52de" },
      { chi: "Fabio", cosa: "ordine inviato a Aluplast", quando: "25 giorni fa", color: "#ff2d55" },
      { chi: "Fabio", cosa: "fattura acconto emessa", quando: "35 giorni fa", color: "#5856d6" },
      { chi: "Fabio", cosa: "cliente ha firmato", quando: "38 giorni fa", color: "#34c759" },
      { chi: "Fabio", cosa: "creato la commessa", quando: "43 giorni fa", color: "#86868b" },
    ],
  },
  // CM-005: COMPLETATO — ciclo intero chiuso, montaggio fatto, saldo incassato
  {
    id: 1005, code: "S-0005", cliente: "Salvatore", cognome: "De Luca", indirizzo: "Corso Italia 22, Cosenza (CS)",
    telefono: "329 456 7890", email: "s.deluca@gmail.com", fase: "chiusura",
    sistema: "Schüco CT70", tipo: "ristrutturazione", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "1°",
    note: "Lavoro completato. Cliente soddisfatto, ha chiesto biglietto per passaparola.",
    prezzoMq: 280,
    firmaCliente: true, dataFirma: "2025-12-10",
    firmaDocumento: { id: 9910, tipo: "firma", nome: "Preventivo_S-0005_firmato.pdf", data: "10/12/2025" },
    allegati: [
      { id: 9910, tipo: "firma", nome: "Preventivo_S-0005_firmato.pdf", data: "10/12/2025" },
      { id: 9911, tipo: "fattura", nome: "Fattura_003_2025_acconto.pdf", data: "12/12/2025" },
      { id: 9912, tipo: "ordine", nome: "Ordine_Schuco_S-0005.pdf", data: "13/12/2025" },
      { id: 9913, tipo: "conferma", nome: "Conferma_Schuco_12345.pdf", data: "16/12/2025" },
      { id: 9914, tipo: "fattura", nome: "Fattura_005_2026_saldo.pdf", data: "20/02/2026" },
      { id: 9915, tipo: "verbale", nome: "Verbale_consegna_S-0005.pdf", data: "18/02/2026" },
    ],
    rilievi: [{
      id: 2005, n: 1, data: "2025-12-05", ora: "09:00", rilevatore: "Fabio", tipo: "rilievo",
      motivoModifica: "", note: "Appartamento ristrutturato, muri perfetti.", stato: "completato",
      vani: [
        { id: 3050, nome: "Finestra 2A Soggiorno", tipo: "F2A", stanza: "Soggiorno", piano: "1°",
          sistema: "Schüco CT70", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1410, lCentro: 1400, lBasso: 1398, hSx: 1610, hCentro: 1600, hDx: 1605, d1: 2125, d2: 2122 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: true, l: 1400, h: 1600 } },
        },
        { id: 3051, nome: "Portafinestra Terrazzo", tipo: "PF2A", stanza: "Terrazzo", piano: "1°",
          sistema: "Schüco CT70", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1605, lCentro: 1600, lBasso: 1598, hSx: 2410, hCentro: 2400, hDx: 2405, d1: 2884, d2: 2881 },
          foto: {}, note: "Uscita terrazzo principale", cassonetto: false,
          accessori: { tapparella: { attivo: true, l: 1600, h: 2400 }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        { id: 3052, nome: "Finestra 1A Bagno", tipo: "VAS", stanza: "Bagno", piano: "1°",
          sistema: "Schüco CT70", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 605, lCentro: 600, lBasso: 598, hSx: 805, hCentro: 800, hDx: 802, d1: 1000, d2: 998 },
          foto: {}, note: "Vetro opaco satinato", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
      ],
    }],
    creato: "5 dic", aggiornato: "20 feb",
    cf: "DLCSVT70M15D086V", piva: "", sdi: "", pec: "",
    ivaPerc: 10,
    ck_vano_ok: true, ck_pulizia_ok: true, ck_cliente_ok: true, ck_foto_ok: true,
    log: [
      { chi: "Fabio", cosa: "saldo incassato — commessa chiusa ✅", quando: "7 giorni fa", color: "#34c759" },
      { chi: "Fabio", cosa: "montaggio completato — 2 giorni", quando: "9 giorni fa", color: "#5856d6" },
      { chi: "Fabio", cosa: "materiale consegnato dal fornitore", quando: "20 giorni fa", color: "#af52de" },
      { chi: "Fabio", cosa: "ordine confermato da Schüco", quando: "60 giorni fa", color: "#af52de" },
      { chi: "Fabio", cosa: "ordine inviato a Schüco", quando: "65 giorni fa", color: "#ff2d55" },
      { chi: "Fabio", cosa: "fattura acconto emessa", quando: "75 giorni fa", color: "#5856d6" },
      { chi: "Fabio", cosa: "cliente ha firmato", quando: "78 giorni fa", color: "#34c759" },
      { chi: "Fabio", cosa: "creato la commessa", quando: "84 giorni fa", color: "#86868b" },
    ],
  },
  // CM-006: FATTURA — firmato ieri, deve fare fattura acconto
  {
    id: 1006, code: "S-0006", cliente: "Chiara", cognome: "Moretti", indirizzo: "Via Popilia 156, Cosenza (CS)",
    telefono: "333 222 1111", email: "chiara.moretti@live.it", fase: "conferma",
    sistema: "Rehau S80", tipo: "nuova", difficoltaSalita: "Facile", mezzoSalita: "", foroScale: "", pianoEdificio: "2°",
    note: "Nuova costruzione, 7 finestre + 2 portefinestre. Consegna entro aprile.",
    prezzoMq: 220,
    firmaCliente: true, dataFirma: "2026-02-26",
    firmaDocumento: { id: 9920, tipo: "firma", nome: "Preventivo_S-0006_firmato.pdf", data: "26/02/2026" },
    allegati: [
      { id: 9920, tipo: "firma", nome: "Preventivo_S-0006_firmato.pdf", data: "26/02/2026" },
      { id: 9921, tipo: "fattura", nome: "Fattura_004_2026_acconto.pdf", data: "26/02/2026" },
    ],
    rilievi: [{
      id: 2006, n: 1, data: "2026-02-22", ora: "11:00", rilevatore: "Fabio", tipo: "rilievo",
      motivoModifica: "", note: "Nuova costruzione, fori regolarissimi.", stato: "completato",
      vani: [
        { id: 3060, nome: "Finestra 2A Soggiorno", tipo: "F2A", stanza: "Soggiorno", piano: "2°",
          sistema: "Rehau S80", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 9010", bicolore: false,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1205, lCentro: 1200, lBasso: 1200, hSx: 1405, hCentro: 1400, hDx: 1400, d1: 1844, d2: 1844 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: true, l: 1200, h: 1400 }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        { id: 3061, nome: "Finestra 2A Camera 1", tipo: "F2A", stanza: "Camera 1", piano: "2°",
          sistema: "Rehau S80", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 9010", bicolore: false,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1005, lCentro: 1000, lBasso: 1000, hSx: 1205, hCentro: 1200, hDx: 1200, d1: 1563, d2: 1563 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: true, l: 1000, h: 1200 }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        { id: 3062, nome: "Portafinestra Balcone", tipo: "PF2A", stanza: "Salone", piano: "2°",
          sistema: "Rehau S80", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 9010", bicolore: false,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1405, lCentro: 1400, lBasso: 1400, hSx: 2305, hCentro: 2300, hDx: 2300, d1: 2694, d2: 2694 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: true, l: 1400, h: 2300 }, persiana: { attivo: false }, zanzariera: { attivo: true, l: 1400, h: 2300 } },
        },
        { id: 3063, nome: "Vasistas Bagno", tipo: "VAS", stanza: "Bagno", piano: "2°",
          sistema: "Rehau S80", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 9010", bicolore: false,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 605, lCentro: 600, lBasso: 600, hSx: 605, hCentro: 600, hDx: 600, d1: 849, d2: 849 },
          foto: {}, note: "Vetro opaco", cassonetto: false,
          accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
        { id: 3064, nome: "Finestra 2A Camera 2", tipo: "F2A", stanza: "Camera 2", piano: "2°",
          sistema: "Rehau S80", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 9010", bicolore: false,
          coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
          misure: { lAlto: 1005, lCentro: 1000, lBasso: 1000, hSx: 1205, hCentro: 1200, hDx: 1200, d1: 1563, d2: 1563 },
          foto: {}, note: "", cassonetto: false,
          accessori: { tapparella: { attivo: true, l: 1000, h: 1200 }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        },
      ],
    }],
    creato: "22 feb", aggiornato: "26 feb",
    cf: "MRTCHR90B50D086U", piva: "", sdi: "0000000", pec: "chiara.moretti@pec.it",
    ivaPerc: 22,
    log: [
      { chi: "Fabio", cosa: "fattura acconto 50% emessa", quando: "1 giorno fa", color: "#5856d6" },
      { chi: "Fabio", cosa: "cliente ha firmato il preventivo", quando: "1 giorno fa", color: "#34c759" },
      { chi: "Fabio", cosa: "preventivo inviato via WhatsApp", quando: "3 giorni fa", color: "#ff9500" },
      { chi: "Fabio", cosa: "completato rilievo — 5 vani", quando: "5 giorni fa", color: "#5856d6" },
      { chi: "Fabio", cosa: "creato la commessa", quando: "5 giorni fa", color: "#86868b" },
    ],
  },
];

// Demo fatture

export const FATTURE_INIT = [
  {
    id: "fat_demo1", numero: 1, anno: 2026, data: "15/02/2026", dataISO: "2026-02-15", tipo: "acconto",
    cmId: 1003, cmCode: "S-0003", cliente: "Mario", cognome: "Rossi",
    indirizzo: "Via Roma 42, Cosenza", cf: "RSSMRA75D15D086X", piva: "", sdi: "", pec: "",
    importo: 593, imponibile: 539, iva: 10, ivaAmt: 54, pagata: true, dataPagamento: "2026-02-18",
    metodoPagamento: "Bonifico", scadenza: "2026-03-17", note: "Acconto 50% su ordine",
  },
  {
    id: "fat_demo2", numero: 2, anno: 2026, data: "20/01/2026", dataISO: "2026-01-20", tipo: "acconto",
    cmId: 1004, cmCode: "S-0004", cliente: "Laura", cognome: "Esposito",
    indirizzo: "Viale Trieste 5, Rende", cf: "SPSLRA82E45D086W", piva: "", sdi: "", pec: "",
    importo: 474, imponibile: 431, iva: 10, ivaAmt: 43, pagata: true, dataPagamento: "2026-01-25",
    metodoPagamento: "Bonifico", scadenza: "2026-02-19", note: "Acconto 50% su ordine",
  },
  // CM-005 De Luca — acconto + saldo (tutto pagato)
  {
    id: "fat_demo3", numero: 3, anno: 2025, data: "12/12/2025", dataISO: "2025-12-12", tipo: "acconto",
    cmId: 1005, cmCode: "S-0005", cliente: "Salvatore", cognome: "De Luca",
    indirizzo: "Corso Italia 22, Cosenza", cf: "DLCSVT70M15D086V", piva: "", sdi: "", pec: "",
    importo: 693, imponibile: 630, iva: 10, ivaAmt: 63, pagata: true, dataPagamento: "2025-12-15",
    metodoPagamento: "Bonifico", scadenza: "2026-01-11", note: "Acconto 50%",
  },
  {
    id: "fat_demo4", numero: 5, anno: 2026, data: "20/02/2026", dataISO: "2026-02-20", tipo: "saldo",
    cmId: 1005, cmCode: "S-0005", cliente: "Salvatore", cognome: "De Luca",
    indirizzo: "Corso Italia 22, Cosenza", cf: "DLCSVT70M15D086V", piva: "", sdi: "", pec: "",
    importo: 693, imponibile: 630, iva: 10, ivaAmt: 63, pagata: true, dataPagamento: "2026-02-22",
    metodoPagamento: "Bonifico", scadenza: "2026-03-22", note: "Saldo finale",
  },
  // CM-006 Moretti — acconto emesso ieri
  {
    id: "fat_demo5", numero: 4, anno: 2026, data: "26/02/2026", dataISO: "2026-02-26", tipo: "acconto",
    cmId: 1006, cmCode: "S-0006", cliente: "Chiara", cognome: "Moretti",
    indirizzo: "Via Popilia 156, Cosenza", cf: "MRTCHR90B50D086U", piva: "", sdi: "0000000", pec: "chiara.moretti@pec.it",
    importo: 805, imponibile: 660, iva: 22, ivaAmt: 145, pagata: false, dataPagamento: "",
    metodoPagamento: "", scadenza: "2026-03-28", note: "Acconto 50% — in attesa bonifico",
  },
];

// Demo ordini fornitore

export const ORDINI_INIT = [
  // Ordine CM-003 — INVIATO, in attesa conferma → appare nell'inbox
  {
    id: "ord_demo_rossi", cmId: 1003, cmCode: "S-0003", cliente: "Mario Rossi",
    numero: 2, anno: 2026, dataOrdine: "2026-02-18",
    fornitore: { nome: "Aluplast Italia", email: "ordini@aluplast.it", tel: "0444 123456", piva: "IT01234560789", referente: "Marco Ferro" },
    righe: [
      { id: "r_r1", desc: "Finestra 2A — Soggiorno", misure: "1200×1400", qta: 1, prezzoUnit: 195, totale: 195, note: "" },
      { id: "r_r2", desc: "Finestra 2A — Camera 1", misure: "1000×1200", qta: 1, prezzoUnit: 170, totale: 170, note: "" },
      { id: "r_r3", desc: "Portafinestra 2A — Salone", misure: "1400×2200", qta: 1, prezzoUnit: 310, totale: 310, note: "+tapparella" },
      { id: "r_r4", desc: "Vasistas — Bagno", misure: "600×600", qta: 1, prezzoUnit: 120, totale: 120, note: "Vetro opaco" },
    ],
    totale: 795, iva: 22, totaleIva: 970, sconto: 0,
    stato: "inviato",
    conferma: { ricevuta: false, dataRicezione: "", verificata: false, differenze: "", firmata: false, dataFirma: "", reinviata: false, dataReinvio: "" },
    consegna: { prevista: "", settimane: 0, effettiva: "" },
    pagamento: { termini: "", stato: "da_pagare" },
  },
  // Ordine CM-004 — CONFERMATO con dati AI estratti
  {
    id: "ord_demo1", cmId: 1004, cmCode: "S-0004", cliente: "Laura Esposito",
    numero: 1, anno: 2026, dataOrdine: "2026-01-25",
    fornitore: { nome: "Aluplast Italia", email: "ordini@aluplast.it", tel: "0444 123456", piva: "IT01234560789", referente: "Marco Ferro" },
    righe: [
      { id: "r_d1", desc: "Finestra 2A — Cucina", misure: "1200×1400", qta: 1, prezzoUnit: 210, totale: 210, note: "Noce est." },
      { id: "r_d2", desc: "Portafinestra 2A — Soggiorno", misure: "1400×2200", qta: 1, prezzoUnit: 320, totale: 320, note: "Noce est. + tapparella" },
      { id: "r_d3", desc: "Finestra 1A — Camera", misure: "800×1200", qta: 1, prezzoUnit: 140, totale: 140, note: "Noce est." },
    ],
    totale: 670, iva: 22, totaleIva: 817, sconto: 0,
    stato: "confermato",
    conferma: {
      ricevuta: true, dataRicezione: "2026-02-01", verificata: true, differenze: "",
      firmata: true, dataFirma: "2026-02-01", reinviata: false, dataReinvio: "",
      nomeFile: "conferma_aluplast_S0004.pdf",
      datiEstratti: { totale: 817, settimane: 6, dataConsegna: "2026-03-15", pagamento: "30gg_fm", fornitoreNome: "Aluplast Italia" },
    },
    consegna: { prevista: "2026-03-15", settimane: 6, effettiva: "" },
    pagamento: { termini: "30gg_fm", stato: "da_pagare" },
  },
  // Ordine CM-005 De Luca — COMPLETATO e consegnato
  {
    id: "ord_demo_deluca", cmId: 1005, cmCode: "S-0005", cliente: "Salvatore De Luca",
    numero: 3, anno: 2025, dataOrdine: "2025-12-13",
    fornitore: { nome: "Schüco Italia", email: "ordini@schuco.it", tel: "02 98765432", piva: "IT09876540321", referente: "Sara Belli" },
    righe: [
      { id: "r_dl1", desc: "Finestra 2A — Soggiorno", misure: "1400×1600", qta: 1, prezzoUnit: 420, totale: 420, note: "RAL 7016 est." },
      { id: "r_dl2", desc: "Portafinestra 2A — Terrazzo", misure: "1600×2400", qta: 1, prezzoUnit: 580, totale: 580, note: "RAL 7016 est. + tapparella" },
      { id: "r_dl3", desc: "Vasistas — Bagno", misure: "600×800", qta: 1, prezzoUnit: 180, totale: 180, note: "Vetro satinato" },
    ],
    totale: 1180, iva: 10, totaleIva: 1298, sconto: 0,
    stato: "consegnato",
    conferma: {
      ricevuta: true, dataRicezione: "2025-12-16", verificata: true, differenze: "",
      firmata: true, dataFirma: "2025-12-16", reinviata: false, dataReinvio: "",
      nomeFile: "conferma_schuco_S0005.pdf",
      datiEstratti: { totale: 1298, settimane: 7, dataConsegna: "2026-02-10", pagamento: "30gg_fm", fornitoreNome: "Schüco Italia" },
    },
    consegna: { prevista: "2026-02-10", settimane: 7, effettiva: "2026-02-08" },
    pagamento: { termini: "30gg_fm", stato: "pagato" },
  },
];

// Demo montaggi

export const MONTAGGI_INIT = [
  {
    id: "m_demo1", cmId: 1004, cmCode: "S-0004", cliente: "Laura Esposito",
    vani: 3, data: "2026-03-16", orario: "08:00", durata: "2g", giorni: 2,
    squadraId: "sq1", stato: "programmato", note: "PT villa — accesso dal giardino. Materiale arriva il 15.",
  },
  // Demo montaggi per riempire il calendario
  {
    id: "m_demo2", cmId: 9901, cmCode: "S-0010", cliente: "Francesco Greco",
    vani: 6, data: "2026-03-03", orario: "07:30", durata: "3g", giorni: 3,
    squadraId: "sq1", stato: "programmato", note: "3° piano, 6 finestre + 2 portefinestre. Usa argano.",
  },
  {
    id: "m_demo3", cmId: 9902, cmCode: "S-0011", cliente: "Lucia Ferraro",
    vani: 2, data: "2026-03-06", orario: "08:00", durata: "0.5g", giorni: 0.5,
    squadraId: "sq2", stato: "programmato", note: "Solo 2 vasistas bagno. Mezza giornata.",
  },
  {
    id: "m_demo4", cmId: 9903, cmCode: "S-0012", cliente: "Roberto Mancini",
    vani: 8, data: "2026-03-10", orario: "07:00", durata: "4g", giorni: 4,
    squadraId: "sq1", stato: "programmato", note: "Villa 2 piani, 8 infissi + 2 portoni. Squadra rinforzata.",
  },
  {
    id: "m_demo5", cmId: 1003, cmCode: "S-0003", cliente: "Mario Rossi",
    vani: 4, data: "2026-03-20", orario: "08:00", durata: "2g", giorni: 2,
    squadraId: "sq1", stato: "programmato", note: "3° piano, accesso scale. Serve argano.",
  },
  // CM-005 De Luca — COMPLETATO
  {
    id: "m_demo6", cmId: 1005, cmCode: "S-0005", cliente: "Salvatore De Luca",
    vani: 3, data: "2026-02-17", orario: "08:00", durata: "2g", giorni: 2,
    squadraId: "sq1", stato: "completato", note: "Completato senza problemi. Cliente soddisfatto.",
  },
];


export const TASKS_INIT = [
  { id: "t1", text: "Inviare preventivo Bianchi", done: false, priority: "alta", meta: "S-0002 · Scade venerdì", cmCode: "S-0002" },
  { id: "t2", text: "Controllare misure Verdi prima del sopralluogo", done: false, priority: "media", meta: "S-0001 · Sopralluogo giovedì", cmCode: "S-0001" },
  { id: "t3", text: "Chiamare Aluplast per conferma ordine Rossi", done: false, priority: "alta", meta: "S-0003 · Ordine inviato 18/02", cmCode: "S-0003" },
  { id: "t4", text: "Verificare data consegna Esposito", done: true, priority: "media", meta: "S-0004 · Consegna 15 marzo", cmCode: "S-0004" },
];


// === AI INBOX — email in arrivo con classificazione AI ===
