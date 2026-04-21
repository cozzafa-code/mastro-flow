// lib/firma/messaggi.ts
// Composizione messaggi da inviare al cliente con link firma.

export type TipoDocumentoFirma = "conferma_ordine" | "scheda_tecnica";
export type LivelloFirmaType = "fea_otp" | "feq_spid";

export function comporreMessaggioFirma(
  nome: string,
  tipo: TipoDocumentoFirma,
  livello: LivelloFirmaType,
  url: string
): string {
  const docLabel = tipo === "conferma_ordine" ? "conferma d'ordine" : "scheda tecnica";
  const firmaLabel = livello === "fea_otp"
    ? "Per firmare riceverai un codice via SMS."
    : "Per firmare ti servirà lo SPID o la CIE.";
  return `Ciao ${nome},\n\nti invio la ${docLabel} da firmare digitalmente.\n\n${firmaLabel}\n\nFirma qui:\n${url}\n\nGrazie!`;
}
