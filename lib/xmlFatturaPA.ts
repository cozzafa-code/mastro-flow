/**
 * Generatore XML FatturaPA 1.2.2 conforme SDI
 * Spec ufficiale: https://www.fatturapa.gov.it/it/norme-e-regole/documentazione-fatturapa/formato-fatturapa/
 */

export interface AziendaCedente {
  ragione_sociale?: string;
  nome?: string;
  cognome?: string;
  piva: string;
  cf?: string;
  regime_fiscale: string; // RF01 ordinario · RF19 forfettario
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  nazione: string;
  telefono?: string;
  email?: string;
}

export interface ClienteCessionario {
  ragione_sociale?: string;
  nome?: string;
  cognome?: string;
  piva?: string;
  cf?: string;
  indirizzo: string;
  cap?: string;
  comune?: string;
  provincia?: string;
  nazione?: string;
  codice_destinatario: string; // 0000000 default
  pec?: string;
}

export interface RigaFattura {
  numero: number;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
  prezzo_totale: number;
  aliquota_iva: number;
  natura?: string; // N1..N7 per esenti/non imp.
  unita_misura?: string;
  riferimento_normativo?: string;
  ritenuta?: boolean;
}

export interface DatiFattura {
  tipo_documento: string; // TD01..TD28
  numero: string;
  data: string; // YYYY-MM-DD
  divisa: string; // EUR
  causale?: string;
  imponibile_totale: number;
  imposta_totale: number;
  importo_totale: number;
  bollo?: number;
  riepilogo_iva: { aliquota: number; imponibile: number; imposta: number; natura?: string; riferimento_normativo?: string }[];
}

export interface DatiPagamento {
  modalita: string; // MP01..MP23
  iban?: string;
  data_scadenza?: string;
  importo: number;
  beneficiario?: string;
}

function escXml(s: string): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function n2(v: number): string {
  return v.toFixed(2);
}

function fmtDate(d: string): string {
  // input YYYY-MM-DD → output YYYY-MM-DD
  return d.split("T")[0];
}

export function generaXmlFatturaPA(
  progressivoInvio: string,
  cedente: AziendaCedente,
  cessionario: ClienteCessionario,
  fattura: DatiFattura,
  righe: RigaFattura[],
  pagamento?: DatiPagamento
): string {
  const formatoTrasmissione = cessionario.piva ? "FPR12" : "FPR12";
  const codiceDestinatario = (cessionario.codice_destinatario || "0000000").substring(0, 7);
  const idFiscaleIvaCedente = `IT${cedente.piva}`;
  const idFiscaleIvaCessionario = cessionario.piva ? `IT${cessionario.piva}` : null;

  const annoCorrente = new Date().getFullYear();
  const xmlIdNomePrefix = `IT${cedente.piva}_${progressivoInvio}`;

  // Anagrafica cedente
  let anagraficaCedente = "";
  if (cedente.ragione_sociale) {
    anagraficaCedente = `<Denominazione>${escXml(cedente.ragione_sociale)}</Denominazione>`;
  } else if (cedente.nome && cedente.cognome) {
    anagraficaCedente = `<Nome>${escXml(cedente.nome)}</Nome><Cognome>${escXml(cedente.cognome)}</Cognome>`;
  }

  // Anagrafica cessionario
  let anagraficaCessionario = "";
  if (cessionario.ragione_sociale) {
    anagraficaCessionario = `<Denominazione>${escXml(cessionario.ragione_sociale)}</Denominazione>`;
  } else if (cessionario.nome && cessionario.cognome) {
    anagraficaCessionario = `<Nome>${escXml(cessionario.nome)}</Nome><Cognome>${escXml(cessionario.cognome)}</Cognome>`;
  } else if (cessionario.ragione_sociale === undefined && cessionario.nome) {
    anagraficaCessionario = `<Nome>${escXml(cessionario.nome)}</Nome>`;
  }

  // ID Fiscale Cessionario (CF o PIVA)
  let idCessionario = "";
  if (idFiscaleIvaCessionario) {
    idCessionario = `<IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${escXml(cessionario.piva!)}</IdCodice></IdFiscaleIVA>`;
  }
  let cfCessionario = "";
  if (cessionario.cf) {
    cfCessionario = `<CodiceFiscale>${escXml(cessionario.cf)}</CodiceFiscale>`;
  }

  // Righe dettaglio
  const dettaglioLinee = righe.map((r) => `
      <DettaglioLinee>
        <NumeroLinea>${r.numero}</NumeroLinea>
        <Descrizione>${escXml(r.descrizione || "Voce")}</Descrizione>
        <Quantita>${r.quantita.toFixed(2)}</Quantita>
        ${r.unita_misura ? `<UnitaMisura>${escXml(r.unita_misura)}</UnitaMisura>` : ""}
        <PrezzoUnitario>${n2(r.prezzo_unitario)}</PrezzoUnitario>
        <PrezzoTotale>${n2(r.prezzo_totale)}</PrezzoTotale>
        <AliquotaIVA>${n2(r.aliquota_iva)}</AliquotaIVA>
        ${r.natura ? `<Natura>${r.natura}</Natura>` : ""}
        ${r.riferimento_normativo ? `<RiferimentoNormativo>${escXml(r.riferimento_normativo)}</RiferimentoNormativo>` : ""}
      </DettaglioLinee>`).join("");

  // Riepilogo per aliquota
  const datiRiepilogo = fattura.riepilogo_iva.map((r) => `
      <DatiRiepilogo>
        <AliquotaIVA>${n2(r.aliquota)}</AliquotaIVA>
        ${r.natura ? `<Natura>${r.natura}</Natura>` : ""}
        <ImponibileImporto>${n2(r.imponibile)}</ImponibileImporto>
        <Imposta>${n2(r.imposta)}</Imposta>
        ${r.aliquota === 0 ? `<RiferimentoNormativo>${escXml(r.riferimento_normativo || "Operazione esente IVA")}</RiferimentoNormativo>` : ""}
      </DatiRiepilogo>`).join("");

  // Sezione bollo
  const datiBollo = fattura.bollo && fattura.bollo > 0 ? `
      <DatiBollo>
        <BolloVirtuale>SI</BolloVirtuale>
        <ImportoBollo>${n2(fattura.bollo)}</ImportoBollo>
      </DatiBollo>` : "";

  // Causale forfettario
  const causaleSection = fattura.causale ? `
      <Causale>${escXml(fattura.causale)}</Causale>` : "";

  // Pagamento
  const datiPagamento = pagamento ? `
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>${pagamento.modalita}</ModalitaPagamento>
        ${pagamento.data_scadenza ? `<DataScadenzaPagamento>${fmtDate(pagamento.data_scadenza)}</DataScadenzaPagamento>` : ""}
        <ImportoPagamento>${n2(pagamento.importo)}</ImportoPagamento>
        ${pagamento.iban ? `<IBAN>${escXml(pagamento.iban)}</IBAN>` : ""}
      </DettaglioPagamento>
    </DatiPagamento>` : "";

  // XML completo
  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="${formatoTrasmissione}" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>${escXml(cedente.piva)}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${escXml(progressivoInvio)}</ProgressivoInvio>
      <FormatoTrasmissione>${formatoTrasmissione}</FormatoTrasmissione>
      <CodiceDestinatario>${codiceDestinatario}</CodiceDestinatario>
      ${cessionario.pec ? `<PECDestinatario>${escXml(cessionario.pec)}</PECDestinatario>` : ""}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${escXml(cedente.piva)}</IdCodice>
        </IdFiscaleIVA>
        ${cedente.cf ? `<CodiceFiscale>${escXml(cedente.cf)}</CodiceFiscale>` : ""}
        <Anagrafica>${anagraficaCedente}</Anagrafica>
        <RegimeFiscale>${cedente.regime_fiscale}</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escXml(cedente.indirizzo)}</Indirizzo>
        <CAP>${escXml(cedente.cap)}</CAP>
        <Comune>${escXml(cedente.comune)}</Comune>
        ${cedente.provincia ? `<Provincia>${escXml(cedente.provincia)}</Provincia>` : ""}
        <Nazione>${escXml(cedente.nazione || "IT")}</Nazione>
      </Sede>
      ${cedente.telefono || cedente.email ? `<Contatti>
        ${cedente.telefono ? `<Telefono>${escXml(cedente.telefono)}</Telefono>` : ""}
        ${cedente.email ? `<Email>${escXml(cedente.email)}</Email>` : ""}
      </Contatti>` : ""}
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${idCessionario}
        ${cfCessionario}
        <Anagrafica>${anagraficaCessionario}</Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escXml(cessionario.indirizzo)}</Indirizzo>
        ${cessionario.cap ? `<CAP>${escXml(cessionario.cap)}</CAP>` : ""}
        ${cessionario.comune ? `<Comune>${escXml(cessionario.comune)}</Comune>` : ""}
        ${cessionario.provincia ? `<Provincia>${escXml(cessionario.provincia)}</Provincia>` : ""}
        <Nazione>${escXml(cessionario.nazione || "IT")}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${fattura.tipo_documento}</TipoDocumento>
        <Divisa>${fattura.divisa || "EUR"}</Divisa>
        <Data>${fmtDate(fattura.data)}</Data>
        <Numero>${escXml(fattura.numero)}</Numero>
        ${datiBollo}
        <ImportoTotaleDocumento>${n2(fattura.importo_totale)}</ImportoTotaleDocumento>
        ${causaleSection}
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>${dettaglioLinee}${datiRiepilogo}
    </DatiBeniServizi>
    ${datiPagamento}
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}

// Codici regime fiscale comuni
export const REGIMI_FISCALI = {
  ORDINARIO: "RF01",
  CONTRIBUENTI_MINIMI: "RF02",
  FORFETTARIO: "RF19",
} as const;

// Modalità pagamento SDI
export const MODALITA_PAGAMENTO = {
  CONTANTI: "MP01",
  ASSEGNO: "MP02",
  BONIFICO: "MP05",
  RID: "MP07",
  CARTA: "MP08",
  POS: "MP08",
} as const;

// Codici TD
export const TIPI_DOCUMENTO = {
  FATTURA: "TD01",
  ACCONTO: "TD02",
  PARCELLA: "TD06",
  SEMPLIFICATA: "TD07",
} as const;
