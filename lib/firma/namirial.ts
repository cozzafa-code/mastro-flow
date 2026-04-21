// lib/firma/namirial.ts
// Wrapper Namirial eSignAnyWhere API per firma FEA OTP SMS e FEQ SPID/CIE.
// Doc: https://confluence.namirial.com/eSignAnyWhere - usa API REST v6
//
// Tre operazioni principali:
// 1. uploadDocument(pdfBuffer) → documentId
// 2. createEnvelope({ documentId, firmatario, livello }) → envelopeId + signerUrl
// 3. getEnvelope(envelopeId) → stato + pdfFirmato (quando completato)
//
// Webhook: Namirial chiama nostro endpoint /api/firma/webhook quando stato cambia.

const NAMIRIAL_BASE = process.env.NAMIRIAL_API_BASE || 'https://demo.xyzmo.com/api/v6';

export interface NamirialConfig {
  apiKey: string;        // API-Key header
  organizationKey?: string; // Tenant
  webhookUrl: string;    // URL dove Namirial posterà eventi
  returnUrl: string;     // URL dove atterra il cliente dopo firma
}

export interface Firmatario {
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;     // obbligatorio per FEA OTP
  codiceFiscale?: string; // obbligatorio per FEQ SPID
}

export type LivelloFirma = 'fea_otp' | 'feq_spid';

export interface CreaEnvelopeOpts {
  config: NamirialConfig;
  pdfBase64: string;     // documento da firmare (base64)
  nomeDocumento: string; // "conferma-ordine-S-0013.pdf"
  firmatario: Firmatario;
  livello: LivelloFirma;
  posizioneFirma?: { page: number; x: number; y: number; w: number; h: number }; // default: ultima pagina
}

export interface EnvelopeCreatoResult {
  ok: boolean;
  envelopeId?: string;
  signerUrl?: string;
  error?: string;
  rawResponse?: any;
}

export async function creaEnvelope(opts: CreaEnvelopeOpts): Promise<EnvelopeCreatoResult> {
  const { config, pdfBase64, nomeDocumento, firmatario, livello, posizioneFirma } = opts;

  try {
    // Step 1: upload documento
    const uploadRes = await fetch(`${NAMIRIAL_BASE}/sspfile/uploadtemporary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': config.apiKey,
        ...(config.organizationKey ? { 'Organization': config.organizationKey } : {}),
      },
      body: JSON.stringify({
        FileName: nomeDocumento,
        Data: pdfBase64,
      }),
    });
    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok || !uploadJson.FileId) {
      return { ok: false, error: `upload: ${uploadJson?.error || uploadRes.statusText}`, rawResponse: uploadJson };
    }
    const fileId = uploadJson.FileId;

    // Step 2: crea envelope
    const pos = posizioneFirma || { page: 1, x: 100, y: 500, w: 200, h: 60 };

    const recipient: any = {
      Email: firmatario.email,
      FirstName: firmatario.nome,
      LastName: firmatario.cognome,
      LanguageCode: 'it',
      AuthenticationMethods: [],
      SigningMethods: [],
    };

    if (livello === 'fea_otp') {
      // FEA: OTP SMS
      if (!firmatario.telefono) {
        return { ok: false, error: 'telefono obbligatorio per FEA OTP SMS' };
      }
      recipient.AuthenticationMethods.push({
        Method: 'Sms',
        Parameter: firmatario.telefono,
      });
      recipient.SigningMethods.push({ Method: 'ClickToSign', Parameter: '' });
    } else if (livello === 'feq_spid') {
      // FEQ: SPID identification
      recipient.AuthenticationMethods.push({
        Method: 'Spid',
        Parameter: firmatario.codiceFiscale || '',
      });
      recipient.SigningMethods.push({
        Method: 'DisposableCertificate',
        Parameter: 'FEQ',
      });
    }

    const envelopePayload = {
      Envelope: {
        Documents: [{
          FileId: fileId,
          DocumentNumber: 1,
          IsPrimaryDocument: true,
          PdfForm: { Fields: [] },
          SoftDeleted: false,
          PageCount: 1,
        }],
        Recipients: [{
          ...recipient,
          Order: 1,
          OrderDependentUsage: false,
          SecurityMeasures: {
            AuthenticationMethods: recipient.AuthenticationMethods,
          },
          SigningInstructions: {
            SigningFields: [{
              Id: 'sig_cliente',
              DocRefNumber: 1,
              PageNumber: pos.page,
              Top: pos.y,
              Left: pos.x,
              Width: pos.w,
              Height: pos.h,
              SigningRequirement: 'Required',
            }],
            SigningMethods: recipient.SigningMethods,
          },
        }],
        Name: nomeDocumento,
        DaysUntilExpire: 30,
        CallbackUrlForCompletedWorkstep: config.webhookUrl,
        ReturnUrlAfterFinish: config.returnUrl,
        Steps: [{
          OrderIndex: 1,
          RecipientType: 'Signer',
        }],
      },
    };

    const envRes = await fetch(`${NAMIRIAL_BASE}/envelope/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': config.apiKey,
        ...(config.organizationKey ? { 'Organization': config.organizationKey } : {}),
      },
      body: JSON.stringify(envelopePayload),
    });
    const envJson = await envRes.json();
    if (!envRes.ok || !envJson.EnvelopeId) {
      return { ok: false, error: `createEnvelope: ${envJson?.error || envRes.statusText}`, rawResponse: envJson };
    }

    return {
      ok: true,
      envelopeId: envJson.EnvelopeId,
      signerUrl: envJson.RecipientSignerInvitationUrls?.[0]?.Url || envJson.SignerUrl,
      rawResponse: envJson,
    };

  } catch (e: any) {
    return { ok: false, error: e.message || 'errore chiamata Namirial' };
  }
}

export interface EnvelopeStato {
  ok: boolean;
  envelopeId: string;
  stato: 'draft' | 'in_progress' | 'completed' | 'expired' | 'rejected' | 'error' | string;
  pdfFirmatoBase64?: string;
  nomePdf?: string;
  raw?: any;
  error?: string;
}

export async function getEnvelope(config: NamirialConfig, envelopeId: string): Promise<EnvelopeStato> {
  try {
    const res = await fetch(`${NAMIRIAL_BASE}/envelope/${envelopeId}`, {
      method: 'GET',
      headers: {
        'API-Key': config.apiKey,
        ...(config.organizationKey ? { 'Organization': config.organizationKey } : {}),
      },
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, envelopeId, stato: 'error', error: json?.error || res.statusText, raw: json };
    }

    const stato = (json.Status || json.EnvelopeStatus || '').toLowerCase();
    let pdfFirmato: string | undefined;
    let nomePdf: string | undefined;

    // Se completato, scarica il PDF firmato
    if (stato === 'completed' || stato === 'completed_or_finished') {
      const dlRes = await fetch(`${NAMIRIAL_BASE}/envelope/${envelopeId}/download/finished`, {
        method: 'GET',
        headers: {
          'API-Key': config.apiKey,
          ...(config.organizationKey ? { 'Organization': config.organizationKey } : {}),
        },
      });
      if (dlRes.ok) {
        const dlJson = await dlRes.json();
        pdfFirmato = dlJson?.Documents?.[0]?.Data || dlJson?.FileData;
        nomePdf = dlJson?.Documents?.[0]?.FileName || `firmato-${envelopeId}.pdf`;
      }
    }

    return {
      ok: true,
      envelopeId,
      stato,
      pdfFirmatoBase64: pdfFirmato,
      nomePdf,
      raw: json,
    };
  } catch (e: any) {
    return { ok: false, envelopeId, stato: 'error', error: e.message || String(e) };
  }
}
