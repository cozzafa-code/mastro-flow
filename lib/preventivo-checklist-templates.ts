// ════════════════════════════════════════════════════════════
// PREVENTIVO · CHECKLIST CONTESTUALI TEMPLATES
// ════════════════════════════════════════════════════════════
// Definizioni statiche di documenti IN/OUT per ogni bonus e IVA.
// File puro: nessuna dipendenza, nessun side-effect, nessun DB.
// Usato da: usePreventivoChecklist hook, BonusChecklistInline, IVAChecklistInline.
// NON tocca firma_tokens, preventivo_tokens, FirmaPanel.

export type DocTemplate = {
  codice: string;
  nome: string;
  descrizione?: string;
  obbligatorio: boolean;
};

export type DocOutTemplate = DocTemplate & {
  template_versione: string;
  warning?: string; // es. "ENEA obbligatoria 90gg"
};

// ─── BONUS ─── DOC IN (cliente → te) ──────────────────────────
export const BONUS_DOC_IN: Record<string, DocTemplate[]> = {
  bonus_casa: [
    { codice: "cf_cliente", nome: "Codice fiscale cliente", descrizione: "Tessera o documento identità", obbligatorio: true },
    { codice: "dati_catastali", nome: "Dati catastali", descrizione: "Foglio · particella · subalterno", obbligatorio: true },
    { codice: "visura_immobile", nome: "Visura immobile", descrizione: "Atto proprietà o contratto comodato", obbligatorio: true },
    { codice: "foto_pre", nome: "Foto PRIMA dei lavori", descrizione: "Stato vecchi infissi", obbligatorio: false },
    { codice: "foto_post", nome: "Foto DOPO i lavori", descrizione: "Installazione completata", obbligatorio: false },
  ],
  ecobonus: [
    { codice: "cf_cliente", nome: "Codice fiscale cliente", descrizione: "Tessera o documento identità", obbligatorio: true },
    { codice: "dati_catastali", nome: "Dati catastali", descrizione: "Foglio · particella · subalterno", obbligatorio: true },
    { codice: "ape_ante", nome: "APE ante operam", descrizione: "Attestato prestazione energetica pre-lavori", obbligatorio: true },
    { codice: "ape_post", nome: "APE post operam", descrizione: "Attestato prestazione energetica post-lavori", obbligatorio: true },
    { codice: "asseverazione_tecnico", nome: "Asseverazione tecnico", descrizione: "Firmata da ingegnere abilitato", obbligatorio: true },
    { codice: "foto_pre_post", nome: "Foto pre/post", descrizione: "Stato infissi prima e dopo", obbligatorio: false },
  ],
  barriere: [
    { codice: "cf_cliente", nome: "Codice fiscale cliente", descrizione: "Tessera o documento identità", obbligatorio: true },
    { codice: "dati_catastali", nome: "Dati catastali", descrizione: "Foglio · particella · subalterno", obbligatorio: true },
    { codice: "delibera_condominio", nome: "Delibera assemblea condominiale", descrizione: "Solo condomini · approvazione lavori", obbligatorio: true },
    { codice: "relazione_tecnica_asseverata", nome: "Relazione tecnica asseverata", descrizione: "DM 236/89 · firma tecnico abilitato", obbligatorio: true },
    { codice: "cf_amministratore", nome: "CF amministratore condominio", descrizione: "Codice fiscale rappresentante", obbligatorio: true },
  ],
  nessuna: [],
};

// ─── BONUS ─── DOC OUT (te → cliente, prestampati) ────────────
export const BONUS_DOC_OUT: Record<string, DocOutTemplate[]> = {
  bonus_casa: [
    { codice: "informativa_privacy_gdpr", nome: "Informativa privacy GDPR", descrizione: "Da firmare · template aggiornato 2026", obbligatorio: true, template_versione: "v2026.1" },
    { codice: "condizioni_generali", nome: "Condizioni generali contratto", descrizione: "Termini · garanzia · foro competente", obbligatorio: true, template_versione: "v2026.1" },
    { codice: "istruzioni_bonifico", nome: "Istruzioni bonifico parlante", descrizione: "Causale art. 16-bis pre-compilata", obbligatorio: true, template_versione: "v2026.1" },
  ],
  ecobonus: [
    { codice: "informativa_privacy_gdpr", nome: "Informativa privacy GDPR", descrizione: "Da firmare", obbligatorio: true, template_versione: "v2026.1" },
    { codice: "comunicazione_enea", nome: "Comunicazione ENEA", descrizione: "Cliente carica su bonusfiscali.enea.it · SPID/CIE", obbligatorio: true, template_versione: "v2026.1", warning: "Obbligatoria entro 90 giorni dalla fine lavori" },
    { codice: "scheda_tecnica_uw", nome: "Scheda tecnica Uw infissi", descrizione: "Profilo · vetro · marcatura CE", obbligatorio: true, template_versione: "v2026.1" },
    { codice: "istruzioni_bonifico_eco", nome: "Istruzioni bonifico parlante", descrizione: "Causale L. 296/2006 c.344-347", obbligatorio: true, template_versione: "v2026.1" },
  ],
  barriere: [
    { codice: "informativa_privacy_gdpr", nome: "Informativa privacy GDPR", descrizione: "Da firmare", obbligatorio: true, template_versione: "v2026.1" },
    { codice: "condizioni_generali", nome: "Condizioni generali contratto", descrizione: "Termini · garanzia · foro competente", obbligatorio: true, template_versione: "v2026.1" },
    { codice: "istruzioni_bonifico_barr", nome: "Istruzioni bonifico parlante", descrizione: "Causale art. 119-ter DL 34/2020", obbligatorio: true, template_versione: "v2026.1" },
    { codice: "scheda_conformita_dm236", nome: "Scheda conformità DM 236/89", descrizione: "Eliminazione barriere architettoniche", obbligatorio: true, template_versione: "v2026.1" },
  ],
  nessuna: [
    { codice: "informativa_privacy_gdpr", nome: "Informativa privacy GDPR", descrizione: "Da firmare", obbligatorio: true, template_versione: "v2026.1" },
    { codice: "condizioni_generali", nome: "Condizioni generali contratto", descrizione: "Termini · garanzia · foro competente", obbligatorio: true, template_versione: "v2026.1" },
  ],
};

// ─── IVA ─── DOC IN ──────────────────────────────────────────
export const IVA_DOC_IN: Record<string, DocTemplate[]> = {
  iva_4: [
    { codice: "dichiarazione_prima_casa", nome: "Dichiarazione prima casa", descrizione: "Firmata · attesta residenza entro 18 mesi", obbligatorio: true },
  ],
  iva_10: [
    { codice: "dichiarazione_ristrutturazione", nome: "Dichiarazione lavori ristrutturazione", descrizione: "Cliente firma · art. 31 lett. b/c L.457/78", obbligatorio: true },
  ],
  iva_22: [],
};

// ─── IVA ─── DOC OUT ─────────────────────────────────────────
export const IVA_DOC_OUT: Record<string, DocOutTemplate[]> = {
  iva_4: [
    { codice: "modello_dich_prima_casa", nome: "Modello dichiarazione prima casa", descrizione: "PDF prestampato · cliente firma e restituisce", obbligatorio: true, template_versione: "v2026.1" },
  ],
  iva_10: [
    { codice: "modello_dich_ristrutturazione", nome: "Modello dichiarazione ristrutturazione", descrizione: "PDF prestampato · cliente firma e restituisce", obbligatorio: true, template_versione: "v2026.1" },
  ],
  iva_22: [],
};

// ─── METADATA bonus per UI ───────────────────────────────────
export const BONUS_META = {
  bonus_casa: { label: "Bonus Casa", percentuale: "50%", normativa: "art. 16-bis DPR 917/86", short: "Ristrutturazione · 10 anni · no limiti Uw" },
  ecobonus: { label: "Ecobonus", percentuale: "50%", normativa: "L. 296/2006 c.344-347", short: "ENEA 90gg · Uw conforme · max € 60.000" },
  barriere: { label: "Barriere arch.", percentuale: "75%", normativa: "art. 119-ter DL 34/2020", short: "Solo condomini 2026 · relazione asseverata" },
  nessuna: { label: "Nessuna detrazione", percentuale: "0%", normativa: "", short: "Bonifico ordinario · nessuna pratica" },
} as const;

export const IVA_META = {
  iva_4: { label: "IVA 4%", short: "Prima casa", normativa: "Tab. A parte II punto 21 DPR 633/72" },
  iva_10: { label: "IVA 10%", short: "Ristrutturaz.", normativa: "DPR 633/72 Tab. A III" },
  iva_22: { label: "IVA 22%", short: "Ordinaria", normativa: "DPR 633/72 art. 16" },
} as const;

// ─── HELPERS ────────────────────────────────────────────────
export type BonusKey = keyof typeof BONUS_META;
export type IVAKey = keyof typeof IVA_META;

export function getBonusDocsIn(bonus: BonusKey): DocTemplate[] {
  return BONUS_DOC_IN[bonus] ?? [];
}
export function getBonusDocsOut(bonus: BonusKey): DocOutTemplate[] {
  return BONUS_DOC_OUT[bonus] ?? [];
}
export function getIvaDocsIn(iva: IVAKey): DocTemplate[] {
  return IVA_DOC_IN[iva] ?? [];
}
export function getIvaDocsOut(iva: IVAKey): DocOutTemplate[] {
  return IVA_DOC_OUT[iva] ?? [];
}

// ─── CONTEGGI ───────────────────────────────────────────────
export function getBonusDocsCount(bonus: BonusKey) {
  return {
    in: getBonusDocsIn(bonus).length,
    out: getBonusDocsOut(bonus).length,
    obbligatori: [...getBonusDocsIn(bonus), ...getBonusDocsOut(bonus)].filter(d => d.obbligatorio).length,
  };
}

export function getIvaDocsCount(iva: IVAKey) {
  return {
    in: getIvaDocsIn(iva).length,
    out: getIvaDocsOut(iva).length,
    obbligatori: [...getIvaDocsIn(iva), ...getIvaDocsOut(iva)].filter(d => d.obbligatorio).length,
  };
}
