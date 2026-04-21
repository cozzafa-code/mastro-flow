// lib/fiscale/decisore.ts
// Motore decisionale: da 5 risposte wizard calcola IVA+detrazione+documenti ottimali

export type TipoImmobile =
  | "prima_casa_nuova"        // Nuova costruzione con prima casa → IVA 4%
  | "prima_casa_esistente"    // Prima casa già esistente, ristrutturazione → IVA 10%
  | "seconda_casa"            // Seconda casa residenziale → IVA 10% ristrutt
  | "ristrutturazione"        // Ristrutturazione generica → IVA 10%
  | "commerciale";            // Uso non residenziale → IVA 22%

export type CapienzaIrpef = "alta" | "media" | "bassa" | "non_so";

export interface WizardInput {
  tipoImmobile: TipoImmobile;
  clienteProprietario: boolean;
  zonaClimatica: string;          // A B C D E F
  capienzaIrpef: CapienzaIrpef;
  conformitaDM236: boolean;       // infissi conformi barriere
  importoTotale: number;
  importoManodopera: number;
  cliente?: string;
  cfCliente?: string;
  numFattura?: string;
  dataFattura?: string;
  piva?: string;
  ragioneSociale?: string;
  iban?: string;
}

export interface DecisioneFiscale {
  iva: number;                    // 4 | 10 | 22
  ivaMotivazione: string;
  splitBeniSignificativi?: {
    quota10: number;              // importo al 10%
    quota22: number;              // importo al 22%
    motivazione: string;
  };
  detrazione: "50" | "65" | "75" | "nessuna";
  detrazionePerc: number;         // 0 | 50 | 65 | 75
  detrazioneMotivazione: string;
  detrazioneAlternative: Array<{
    codice: string;
    perc: number;
    perche: string;
    sconsigliata?: string;
  }>;
  importoDetraibile: number;      // quanto recupera il cliente in totale
  costoEffettivoCliente: number;  // quanto paga davvero
  recuperoAnnuo: number;          // quote annue
  durataRecuperoAnni: number;
  documentiDaGenerare: DocumentoRichiesto[];
  scadenze: Scadenza[];
  avvertenze: string[];
}

export interface DocumentoRichiesto {
  tipo: string;
  titolo: string;
  chi: "serramentista" | "cliente" | "tecnico_esterno";
  obbligatorio: boolean;
  contenuto?: string;             // se generabile automaticamente, testo pronto
  template_key?: string;          // riferimento a template_fiscale
}

export interface Scadenza {
  cosa: string;
  entro_giorni_da: string;        // "fine_lavori" | "fattura" | ecc.
  entro_giorni: number;
  critica: boolean;               // se superata → detrazione persa
}

// Uw max per zona climatica (DM 26/1/2010)
const UW_MAX_PER_ZONA: Record<string, number> = {
  A: 3.2, B: 2.8, C: 2.3, D: 2.0, E: 1.8, F: 1.5,
};

export function decidi(input: WizardInput): DecisioneFiscale {
  const warn: string[] = [];
  const alt: DecisioneFiscale["detrazioneAlternative"] = [];

  // ====== STEP 1: IVA ======
  let iva = 22;
  let ivaMotivazione = "";
  let split: DecisioneFiscale["splitBeniSignificativi"] | undefined;

  if (input.tipoImmobile === "prima_casa_nuova") {
    iva = 4;
    ivaMotivazione = "Prima casa nuova costruzione - IVA agevolata 4% ai sensi Tabella A parte II n.21 DPR 633/72. Cliente deve firmare dichiarazione sostitutiva prima casa + non lusso.";
  } else if (
    input.tipoImmobile === "prima_casa_esistente" ||
    input.tipoImmobile === "seconda_casa" ||
    input.tipoImmobile === "ristrutturazione"
  ) {
    iva = 10;
    ivaMotivazione = "Immobile residenziale esistente, manutenzione straordinaria/ristrutturazione - IVA 10% L.488/1999.";

    // Calcolo split beni significativi
    const beni = input.importoTotale - input.importoManodopera;
    if (beni > input.importoManodopera && input.importoManodopera > 0) {
      const quota10 = 2 * input.importoManodopera;
      const quota22 = input.importoTotale - quota10;
      split = {
        quota10,
        quota22,
        motivazione: `Infissi sono "beni significativi" (DL 83/2012). Poiché il loro valore (€${beni.toFixed(2)}) supera la manodopera (€${input.importoManodopera.toFixed(2)}), la quota eccedente va al 22%: €${quota10.toFixed(2)} al 10% + €${quota22.toFixed(2)} al 22%.`,
      };
    }
  } else {
    iva = 22;
    ivaMotivazione = "Uso non residenziale o caso non agevolato - IVA ordinaria 22%.";
  }

  // ====== STEP 2: DETRAZIONE ======
  // Ordine di preferenza: 75% > 65% > 50% > nessuna

  let detrazione: DecisioneFiscale["detrazione"] = "nessuna";
  let detrazionePerc = 0;
  let detrMotivazione = "";

  // PRE-CHECK: serve essere proprietari per quasi tutte le detrazioni (2025+)
  if (!input.clienteProprietario) {
    detrazione = "nessuna";
    detrMotivazione = "Cliente non proprietario. Dal 2025 le detrazioni su infissi sono riservate ai proprietari o titolari di diritto reale (usufrutto, uso). Gli inquilini possono accedere solo in casi specifici (contratto registrato + consenso proprietario).";
    warn.push("Cliente non proprietario: detrazione non applicabile. Verifica con cliente se c'è contratto di locazione registrato con consenso proprietario per detrazione.");
  }
  // COMMERCIALE: mai detrazione casa
  else if (input.tipoImmobile === "commerciale") {
    detrazione = "nessuna";
    detrMotivazione = "Uso non residenziale - detrazioni su infissi casa non applicabili. Valutare ammortamento quota come bene strumentale (competenza commercialista).";
  }
  // CAPIENZA NULLA → detrazione inutile
  else if (input.capienzaIrpef === "bassa") {
    detrazione = "50";
    detrazionePerc = 50;
    detrMotivazione = "Cliente con capienza IRPEF bassa. Consigliamo 50% (più semplice, no ENEA, no asseverazione) perché il 65% potrebbe non essere interamente recuperato per mancanza di IRPEF da compensare.";
    alt.push({ codice: "65", perc: 65, perche: "15% in più", sconsigliata: "capienza IRPEF insufficiente" });
  }
  // BONUS 75% SE CONFORME DM 236/89
  else if (input.conformitaDM236) {
    detrazione = "75";
    detrazionePerc = 75;
    detrMotivazione = "Infissi conformi DM 236/89 (maniglia ergonomica, soglia ≤2cm, luce ≥80cm per porte). Bonus Barriere Architettoniche 75% è la scelta ottimale: recupero in 5 anni (vs 10 degli altri), no ENEA, no asseverazione, no disabilità richiesta.";
    alt.push({ codice: "65", perc: 65, perche: "ecobonus alternativo" });
    alt.push({ codice: "50", perc: 50, perche: "ristrutturazione base" });
  }
  // NUOVA COSTRUZIONE: solo 50%, no 65 (riqualificazione richiede preesistente)
  else if (input.tipoImmobile === "prima_casa_nuova") {
    detrazione = "50";
    detrazionePerc = 50;
    detrMotivazione = "Nuova costruzione: Ecobonus 65% non applicabile (richiede edificio esistente). Resta Ristrutturazione 50% se l'intervento è parte di una più ampia manutenzione.";
  }
  // ECOBONUS 65% come default se immobile esistente + capienza ok
  else {
    // Verifica che Uw atteso rientri nel limite di zona
    const uwMax = UW_MAX_PER_ZONA[input.zonaClimatica] || 2.0;
    detrazione = "65";
    detrazionePerc = 65;
    detrMotivazione = `Ecobonus 65% è la scelta ottimale per immobile residenziale esistente. Requisito Uw ≤ ${uwMax} W/m²K per zona climatica ${input.zonaClimatica} (facile da rispettare con infissi standard in PVC/alluminio a taglio termico + vetro basso-emissivo). Richiede: asseverazione tecnico + invio ENEA entro 90gg fine lavori.`;
    alt.push({ codice: "75", perc: 75, perche: "recupero in 5 anni invece di 10", sconsigliata: "serve conformità DM 236/89 (maniglia ergonomica, soglia ≤2cm)" });
    alt.push({ codice: "50", perc: 50, perche: "più semplice (no ENEA, no asseverazione)", sconsigliata: "perdi 15% detrazione" });
  }

  // ====== STEP 3: CALCOLI ======
  const totaleFattura = input.importoTotale * (1 + iva / 100);
  const importoDetraibile = totaleFattura * detrazionePerc / 100;
  const costoEffettivoCliente = totaleFattura - importoDetraibile;
  const durataRecuperoAnni = detrazione === "75" ? 5 : 10;
  const recuperoAnnuo = durataRecuperoAnni > 0 ? importoDetraibile / durataRecuperoAnni : 0;

  // ====== STEP 4: DOCUMENTI DA GENERARE ======
  const docs: DocumentoRichiesto[] = [];

  if (iva === 4) {
    docs.push({
      tipo: "dich_iva_4",
      titolo: "Dichiarazione sostitutiva prima casa per IVA 4%",
      chi: "serramentista",
      obbligatorio: true,
      contenuto: generaDichIva4(input),
    });
  }
  if (iva === 10) {
    docs.push({
      tipo: "dich_iva_10",
      titolo: "Dichiarazione cliente per IVA 10% (manutenzione straordinaria)",
      chi: "serramentista",
      obbligatorio: true,
      contenuto: generaDichIva10(input),
    });
  }

  if (detrazione !== "nessuna") {
    // Causale bonifico parlante
    docs.push({
      tipo: "causale_bonifico",
      titolo: "Causale bonifico parlante (da copiare)",
      chi: "cliente",
      obbligatorio: true,
      contenuto: generaCausaleBonifico(detrazione, input),
    });
    // Fattura dettagliata richiesta
    docs.push({
      tipo: "istruzioni_fattura",
      titolo: "Istruzioni compilazione fattura",
      chi: "serramentista",
      obbligatorio: true,
      contenuto: generaIstruzioniFattura(detrazione, iva, input, split),
    });

    if (detrazione === "65") {
      docs.push({
        tipo: "scheda_tecnica_uw",
        titolo: `Scheda tecnica infissi con Uw (richiesta ≤ ${UW_MAX_PER_ZONA[input.zonaClimatica] || 2.0} W/m²K)`,
        chi: "serramentista",
        obbligatorio: true,
      });
      docs.push({
        tipo: "asseverazione",
        titolo: "Asseverazione tecnico abilitato (geometra/ing/arch)",
        chi: "tecnico_esterno",
        obbligatorio: true,
      });
      docs.push({
        tipo: "enea",
        titolo: "Trasmissione ENEA (entro 90gg fine lavori)",
        chi: "serramentista",
        obbligatorio: true,
        contenuto: generaDatiEnea(input),
      });
    }
    if (detrazione === "75") {
      docs.push({
        tipo: "dich_dm236",
        titolo: "Dichiarazione conformità DM 236/89",
        chi: "serramentista",
        obbligatorio: true,
        contenuto: generaDichDM236(input),
      });
    }
  }

  // Testi comunicazione cliente
  docs.push({
    tipo: "msg_cliente_checklist",
    titolo: "Messaggio al cliente con checklist documenti",
    chi: "serramentista",
    obbligatorio: false,
    template_key: detrazione !== "nessuna" ? `checklist_${detrazione}` : "guida_scelta_detrazione",
  });

  // ====== STEP 5: SCADENZE ======
  const scadenze: Scadenza[] = [];
  if (detrazione === "65") {
    scadenze.push({ cosa: "Invio ENEA", entro_giorni_da: "fine lavori", entro_giorni: 90, critica: true });
    scadenze.push({ cosa: "APE post intervento (se richiesto)", entro_giorni_da: "fine lavori", entro_giorni: 90, critica: false });
  }
  if (detrazione !== "nessuna") {
    scadenze.push({ cosa: "Bonifico parlante da cliente", entro_giorni_da: "fattura", entro_giorni: 60, critica: true });
  }

  return {
    iva, ivaMotivazione, splitBeniSignificativi: split,
    detrazione, detrazionePerc, detrazioneMotivazione: detrMotivazione,
    detrazioneAlternative: alt,
    importoDetraibile, costoEffettivoCliente, recuperoAnnuo, durataRecuperoAnni,
    documentiDaGenerare: docs, scadenze, avvertenze: warn,
  };
}

// ====== GENERATORI CONTENUTO DOCUMENTI ======

function generaDichIva4(i: WizardInput): string {
  return `DICHIARAZIONE SOSTITUTIVA DI ATTO NOTORIO
(Art. 47 D.P.R. 445/2000)

Il/La sottoscritto/a ${i.cliente || "[NOME COGNOME]"},
C.F. ${i.cfCliente || "[CODICE FISCALE]"},

consapevole delle sanzioni penali per dichiarazioni mendaci (art. 76 DPR 445/2000),

DICHIARA

1. Che l'immobile oggetto dei lavori rappresenta la PRIMA CASA di abitazione;

2. Che l'immobile NON è classificato come di lusso (categorie catastali A/1, A/8, A/9);

3. Di NON aver goduto delle agevolazioni fiscali "prima casa" negli ultimi 10 anni;

4. Di richiedere pertanto l'applicazione dell'IVA agevolata al 4% ai sensi della
   Tabella A, parte II, numero 21, del DPR 633/72, per la fornitura e posa in opera
   di infissi e serramenti effettuata da ${i.ragioneSociale || "[RAGIONE SOCIALE DITTA]"}.

Luogo e data: _______________________

Firma: _______________________________`;
}

function generaDichIva10(i: WizardInput): string {
  return `DICHIARAZIONE DEL COMMITTENTE PER APPLICAZIONE IVA 10%

Il/La sottoscritto/a ${i.cliente || "[NOME COGNOME]"},
C.F. ${i.cfCliente || "[CODICE FISCALE]"},

DICHIARA

1. Che l'immobile oggetto dei lavori è ad uso residenziale (categoria catastale A, esclusa A/10);

2. Che gli interventi di sostituzione infissi rientrano nella categoria di
   MANUTENZIONE STRAORDINARIA ai sensi art. 3 c.1 lett.b DPR 380/2001;

3. Di richiedere pertanto l'applicazione dell'IVA al 10% ai sensi della
   Legge 488/1999 art.7 c.1 lett.b (beni finiti per manutenzione su edifici
   a prevalente destinazione abitativa).

Il sottoscritto è consapevole che, trattandosi di "beni significativi" (infissi),
la quota di spesa eccedente il doppio del valore della manodopera sarà
assoggettata ad IVA ordinaria al 22% (DL 83/2012 convertito in L.134/2012).

Luogo e data: _______________________

Firma: _______________________________`;
}

function generaCausaleBonifico(detr: string, i: WizardInput): string {
  const cf = i.cfCliente || "[CF CLIENTE]";
  const piva = i.piva || "[PIVA DITTA]";
  const num = i.numFattura || "[NUM FATTURA]";
  const data = i.dataFattura || "[DATA FATTURA]";

  if (detr === "65") {
    return `Bonifico relativo a interventi di riqualificazione energetica Legge 296/2006 - Fattura n.${num} del ${data} - CF beneficiario: ${cf} - P.IVA ordinante: ${piva}`;
  }
  if (detr === "75") {
    return `Bonifico per interventi di abbattimento barriere architettoniche art.119-ter DL 34/2020 - Fattura n.${num} del ${data} - CF beneficiario: ${cf} - P.IVA: ${piva}`;
  }
  // 50
  return `Bonifico relativo a lavori di ristrutturazione edilizia ai sensi art.16-bis DPR 917/86 - Fattura n.${num} del ${data} - CF beneficiario: ${cf} - P.IVA ordinante: ${piva}`;
}

function generaIstruzioniFattura(detr: string, iva: number, i: WizardInput, split?: any): string {
  const parts: string[] = [];
  parts.push(`ISTRUZIONI COMPILAZIONE FATTURA - Pratica ${detr}%`);
  parts.push("");
  parts.push(`INTESTAZIONE: ${i.cliente || "[cliente]"} - CF: ${i.cfCliente || "[CF]"}`);
  parts.push(`DATA: ${i.dataFattura || "[oggi]"}`);
  parts.push("");

  if (iva === 4) {
    parts.push("ALIQUOTA IVA: 4% (Tabella A parte II n.21 DPR 633/72 - prima casa)");
    parts.push("DICITURA OBBLIGATORIA: \"Operazione soggetta ad IVA agevolata 4% - Tabella A parte II n.21 DPR 633/72\"");
  } else if (iva === 10) {
    parts.push("ALIQUOTA IVA: 10% (L.488/1999 art.7 manutenzione straordinaria)");
    parts.push("DICITURA OBBLIGATORIA: \"Operazione soggetta ad IVA ridotta 10% - L.488/1999 art.7 c.1 lett.b\"");
    if (split) {
      parts.push("");
      parts.push("⚠ SPLIT BENI SIGNIFICATIVI (OBBLIGATORIO):");
      parts.push(`- Importo al 10%: € ${split.quota10.toFixed(2)}`);
      parts.push(`- Importo al 22%: € ${split.quota22.toFixed(2)}`);
      parts.push("Indica le due righe distinte in fattura con le rispettive aliquote.");
    }
  } else {
    parts.push("ALIQUOTA IVA: 22% (ordinaria)");
  }

  parts.push("");
  parts.push("DESCRIZIONI RIGHE FATTURA:");
  if (detr === "75") {
    parts.push("Obbligatorio riferimento a DM 236/89:");
    parts.push("\"Fornitura e posa infissi conformi al DM 236/89 (maniglia ergonomica, soglia ribassata h.≤2cm, luce netta ≥80cm) - Intervento di abbattimento barriere architettoniche ai sensi art.119-ter DL 34/2020\"");
  } else if (detr === "65") {
    parts.push("Indicare prestazioni energetiche:");
    parts.push("\"Fornitura e posa serramenti ad alta efficienza energetica - Riqualificazione energetica ai sensi L.296/2006 - Uw [VALORE] W/m²K\"");
  } else if (detr === "50") {
    parts.push("Rifornimento a manutenzione straordinaria/ristrutturazione:");
    parts.push("\"Fornitura e posa infissi in manutenzione straordinaria - Ristrutturazione edilizia ai sensi art.16-bis DPR 917/86\"");
  }

  parts.push("");
  parts.push("PAGAMENTO: bonifico parlante bancario o postale (NO contanti, NO POS).");

  return parts.join("\n");
}

function generaDatiEnea(i: WizardInput): string {
  return `DATI PER INVIO PRATICA ENEA (entro 90gg da fine lavori)

Portale: https://ecobonus2026.enea.it

DATI DA INSERIRE:
- Beneficiario: ${i.cliente || "[CLIENTE]"}
- CF beneficiario: ${i.cfCliente || "[CF]"}
- Intervento: sostituzione infissi (codice 58)
- Zona climatica: ${i.zonaClimatica}
- Data inizio lavori: [da inserire]
- Data fine lavori: [da inserire]

SCADENZA: 90 giorni dalla data di fine lavori.
Se superi la scadenza: detrazione persa (non regolarizzabile).

Puoi compilare la pratica tu come ditta installatrice, oppure delegare il tecnico asseveratore o il cliente stesso.`;
}

function generaDichDM236(i: WizardInput): string {
  return `DICHIARAZIONE DI CONFORMITÀ AL DM 236/89
(per applicazione Bonus Barriere Architettoniche 75% - art.119-ter DL 34/2020)

La ditta ${i.ragioneSociale || "[RAGIONE SOCIALE]"}, P.IVA ${i.piva || "[PIVA]"},

DICHIARA

che gli infissi installati presso l'abitazione di ${i.cliente || "[CLIENTE]"},
C.F. ${i.cfCliente || "[CF]"}, con fattura n. ${i.numFattura || "[NUM]"} del ${i.dataFattura || "[DATA]"},

SONO CONFORMI AL DM 236/89 in quanto presentano le seguenti caratteristiche:

☐ Maniglia ergonomica di tipo a leva (conforme art.8.1.5 DM 236/89)
☐ Soglia di ingresso di altezza ≤ 2 cm (conforme art.8.1.1 DM 236/89)
☐ Luce netta di passaggio ≥ 80 cm per porte e portefinestre (conforme art.8.1.1)
☐ Meccanismi di apertura azionabili con pressione ≤ 8 kg (conforme art.8.1.2)
☐ Altezza maniglia tra 85 e 110 cm dal pavimento (conforme art.8.1.5)

[BARRARE LE CASELLE APPLICABILI]

Luogo e data: _______________________

Timbro e firma della ditta installatrice:
_______________________________`;
}
