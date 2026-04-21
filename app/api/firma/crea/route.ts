// app/api/firma/crea/route.ts
// POST { commessaId, tipoDocumento, livello, firmatario? }
// 1. Genera il PDF (conferma o scheda tecnica) server-side
// 2. Lo salva nel bucket 'documenti-firmati' (pre-firma)
// 3. Lo invia a Namirial → crea envelope
// 4. Crea riga firma_tokens con envelope_id + signer_url
// 5. Restituisce signer_url al caller (per invio WA/email)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import { randomUUID } from 'crypto';
import { pdfOrdineConferma, type OrdineDati } from '@/lib/pdf/ordineConfermaPDF';
import { pdfSchedaTecnica, type SchedaTecnicaDati, type SchedaVano } from '@/lib/pdf/schedaTecnicaPDF';
import { creaEnvelope, type LivelloFirma } from '@/lib/firma/namirial';

type TipoDocumento = 'conferma_ordine' | 'scheda_tecnica';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commessaId, tipoDocumento, livello, firmatarioOverride } = body as {
      commessaId: string;
      tipoDocumento: TipoDocumento;
      livello: LivelloFirma;
      firmatarioOverride?: { nome?: string; cognome?: string; email?: string; telefono?: string; codiceFiscale?: string };
    };

    if (!commessaId || !tipoDocumento || !livello) {
      return NextResponse.json({ error: 'commessaId, tipoDocumento, livello obbligatori' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // ───── Carica dati commessa ─────
    const { data: commessa, error: cErr } = await supabase
      .from('commesse')
      .select(`
        id, code, azienda_id, cliente, cognome, indirizzo, telefono, email,
        totale_preventivo, totale_finale, sconto_perc,
        tipologia_immobile, zona_clima,
        catasto_foglio, catasto_particella, catasto_subalterno, catasto_comune, catasto_categoria,
        contatto:contatto_id(nome, cognome, indirizzo, citta, cap, telefono, email, codice_fiscale)
      `)
      .eq('id', commessaId)
      .single();

    if (cErr || !commessa) {
      return NextResponse.json({ error: cErr?.message || 'commessa non trovata' }, { status: 404 });
    }

    const { data: azienda, error: aErr } = await supabase
      .from('aziende')
      .select('*')
      .eq('id', commessa.azienda_id)
      .single();

    if (aErr || !azienda) {
      return NextResponse.json({ error: 'azienda non trovata' }, { status: 404 });
    }

    if (!azienda.firma_provider || !azienda.firma_api_key) {
      return NextResponse.json({
        error: 'Credenziali firma non configurate. Vai in Impostazioni → Firma digitale.',
      }, { status: 400 });
    }

    // ───── Firmatario ─────
    const contatto = (commessa as any).contatto;
    const firmatario = {
      nome: firmatarioOverride?.nome || contatto?.nome || commessa.cliente || 'Cliente',
      cognome: firmatarioOverride?.cognome || contatto?.cognome || commessa.cognome || '',
      email: firmatarioOverride?.email || contatto?.email || commessa.email || '',
      telefono: firmatarioOverride?.telefono || contatto?.telefono || commessa.telefono || '',
      codiceFiscale: firmatarioOverride?.codiceFiscale || contatto?.codice_fiscale || '',
    };

    if (!firmatario.email) return NextResponse.json({ error: 'email cliente mancante' }, { status: 400 });
    if (livello === 'fea_otp' && !firmatario.telefono) {
      return NextResponse.json({ error: 'telefono obbligatorio per firma FEA OTP' }, { status: 400 });
    }
    if (livello === 'feq_spid' && !firmatario.codiceFiscale) {
      return NextResponse.json({ error: 'codice fiscale obbligatorio per firma FEQ SPID' }, { status: 400 });
    }

    // ───── Info azienda per header PDF ─────
    const aziendaInfo = {
      ragione: azienda.ragione || '',
      piva: azienda.piva || '',
      codice_fiscale: azienda.codice_fiscale,
      indirizzo: azienda.indirizzo,
      citta: azienda.citta,
      cap: azienda.cap,
      provincia: azienda.provincia,
      telefono: azienda.telefono,
      email: azienda.email,
      iban: azienda.iban,
      logo_url: azienda.logo_url,
      cciaa: azienda.cciaa,
    };

    // ───── Genera PDF ─────
    const doc = new jsPDF();
    let nomeDocumento = '';

    if (tipoDocumento === 'conferma_ordine') {
      const dati = await buildOrdineDati(supabase, commessa);
      pdfOrdineConferma(doc, aziendaInfo, dati);
      nomeDocumento = `conferma-ordine-${commessa.code}.pdf`;
    } else if (tipoDocumento === 'scheda_tecnica') {
      const dati = await buildSchedaTecnicaDati(supabase, commessa);
      await pdfSchedaTecnica(doc, aziendaInfo, dati);
      nomeDocumento = `scheda-tecnica-${commessa.code}.pdf`;
    } else {
      return NextResponse.json({ error: `tipoDocumento non valido: ${tipoDocumento}` }, { status: 400 });
    }

    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);
    const pdfBase64 = pdfBuffer.toString('base64');

    // ───── Upload pre-firma su storage ─────
    const token = randomUUID();
    const prePath = `${commessaId}/${token}/${nomeDocumento}`;
    await supabase.storage.from('documenti-firmati').upload(prePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    // ───── Crea envelope Namirial ─────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mastro-erp.vercel.app';
    const envelope = await creaEnvelope({
      config: {
        apiKey: azienda.firma_api_key,
        organizationKey: azienda.firma_account_id || undefined,
        webhookUrl: `${baseUrl}/api/firma/webhook`,
        returnUrl: `${baseUrl}/firma/completata?token=${token}`,
      },
      pdfBase64,
      nomeDocumento,
      firmatario,
      livello,
    });

    if (!envelope.ok || !envelope.envelopeId || !envelope.signerUrl) {
      return NextResponse.json({
        error: envelope.error || 'creazione envelope fallita',
        details: envelope.rawResponse,
      }, { status: 502 });
    }

    // ───── Crea riga firma_tokens ─────
    await supabase.from('firma_tokens').insert({
      token,
      cm_id: commessa.id,
      cm_code: commessa.code,
      cliente: firmatario.nome + ' ' + firmatario.cognome,
      azienda_id: commessa.azienda_id,
      tipo: tipoDocumento,
      stato: 'inviata',
      provider: azienda.firma_provider,
      livello_firma: livello,
      envelope_id: envelope.envelopeId,
      signer_url: envelope.signerUrl,
      pdf_non_firmato_path: prePath,
      destinatario_telefono: firmatario.telefono,
      destinatario_email: firmatario.email,
      commessa_id: commessa.id,
      provider_log: [{ ts: new Date().toISOString(), evento: 'envelope_creato', envelope_id: envelope.envelopeId }],
      creato_il: new Date().toISOString(),
      scade_il: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({
      ok: true,
      token,
      envelope_id: envelope.envelopeId,
      signer_url: envelope.signerUrl,
      nome_documento: nomeDocumento,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'errore interno' }, { status: 500 });
  }
}

// ───── Builder OrdineDati da commessa+vani ─────
async function buildOrdineDati(supabase: any, commessa: any): Promise<OrdineDati> {
  const { data: vani } = await supabase
    .from('vani')
    .select('id, nome, tipo, pezzi, sistema, sottosistema, vetro, colore_int, stanza, piano, misure_json')
    .eq('commessa_id', commessa.id)
    .order('ordine', { ascending: true });

  const voci = (vani || []).map((v: any, i: number) => {
    const m = v.misure_json || {};
    const dim = m.L && m.H ? `${m.L}×${m.H} mm` : '';
    const qta = v.pezzi || 1;
    const prezzoUnit = 0; // TODO: collegare a righe_preventivo se disponibile
    return {
      n: i + 1,
      descrizione: `${v.nome || 'Vano ' + (i + 1)}`,
      dettaglio: [v.tipo, dim, v.sistema, v.vetro, v.colore_int ? 'RAL ' + v.colore_int : null].filter(Boolean).join(' · '),
      categoria: [v.stanza, v.piano ? 'piano ' + v.piano : null].filter(Boolean).join(' · '),
      qta,
      prezzoUnit,
      totale: prezzoUnit * qta,
    };
  });

  const imponibile = Number(commessa.totale_preventivo || 0);
  const scontoPerc = Number(commessa.sconto_perc || 0);
  const scontoEuro = imponibile * scontoPerc / 100;
  const imponibileNetto = imponibile - scontoEuro;
  const ivaPerc = 22; // default
  const iva = imponibileNetto * ivaPerc / 100;

  const contatto = commessa.contatto;
  const indirizzo = contatto?.indirizzo || commessa.indirizzo || '';
  const cap = contatto?.cap || '';
  const citta = contatto?.citta || '';
  const indirizzoCompleto = [indirizzo, [cap, citta].filter(Boolean).join(' ')].filter(Boolean).join(' · ');

  const catastoRighe = [
    commessa.catasto_foglio ? `F. ${commessa.catasto_foglio}` : '',
    commessa.catasto_particella ? `Part. ${commessa.catasto_particella}` : '',
    commessa.catasto_subalterno ? `Sub. ${commessa.catasto_subalterno}` : '',
    commessa.catasto_categoria ? `Cat. ${commessa.catasto_categoria}` : '',
  ].filter(Boolean).join(' · ');

  return {
    numero: commessa.code || commessa.id,
    data: new Date().toISOString(),
    cliente: {
      nome: [contatto?.nome || commessa.cliente, contatto?.cognome || commessa.cognome].filter(Boolean).join(' '),
      codice_fiscale: contatto?.codice_fiscale,
      indirizzo: indirizzoCompleto,
      telefono: contatto?.telefono || commessa.telefono,
      email: contatto?.email || commessa.email,
    },
    immobile: {
      indirizzo: indirizzoCompleto || 'Indirizzo non specificato',
      catasto: catastoRighe || null,
    },
    voci,
    imponibile: imponibileNetto,
    scontoPerc,
    scontoEuro,
    ivaPerc,
    iva,
    totaleFinale: imponibileNetto + iva,
    tempiConsegnaGg: 45,
    garanziaAnni: 10,
  };
}

// ───── Builder SchedaTecnicaDati ─────
async function buildSchedaTecnicaDati(supabase: any, commessa: any): Promise<SchedaTecnicaDati> {
  const { data: vani } = await supabase
    .from('vani')
    .select(`
      id, nome, tipo, pezzi, stanza, piano, sistema, sottosistema, vetro,
      colore_int, colore_est, bicolore, accessori,
      peso_vetri, flag_critico, flag_condensa,
      uw, misure_json, cad_json, vetro_config
    `)
    .eq('commessa_id', commessa.id)
    .order('ordine', { ascending: true });

  // Per ogni vano prova a caricare prestazioni dal sistema
  const vaniCompleti: SchedaVano[] = [];
  for (const v of (vani || [])) {
    let prestazioni: any = {};
    let vetroDati: any = {};

    // Prestazioni sistema
    if (v.sistema) {
      const { data: sis } = await supabase
        .from('sistemi')
        .select('id')
        .eq('sistema', v.sistema)
        .eq('azienda_id', commessa.azienda_id)
        .maybeSingle();
      if (sis?.id) {
        const { data: pr } = await supabase
          .from('catalogo_prestazioni')
          .select('*')
          .eq('sistema_id', sis.id)
          .maybeSingle();
        prestazioni = pr || {};
      }
    }

    // Vetro
    if (v.vetro) {
      const { data: vt } = await supabase
        .from('catalogo_vetri')
        .select('ug, abbattimento_acustico, trasmittanza_solare, composizione')
        .eq('codice', v.vetro)
        .maybeSingle();
      vetroDati = vt || {};
    }

    vaniCompleti.push({
      ...v,
      uf: prestazioni.uf_profilo,
      ug: vetroDati.ug,
      rw: prestazioni.rw_max_db,
      g_tot: vetroDati.trasmittanza_solare,
      classe_aria: prestazioni.permeabilita_aria_classe,
      classe_acqua: prestazioni.tenuta_acqua_classe,
      classe_vento: prestazioni.resistenza_vento_classe,
      classe_antieffrazione: prestazioni.classe_antieffrazione,
      perc_riciclato: prestazioni.perc_riciclato,
      cam_compliant: prestazioni.cam_compliant,
      uni11673_1: prestazioni.uni11673_1,
      norma_ce: prestazioni.norma_ce,
      certificazioni: prestazioni.certificazioni,
    });
  }

  const contatto = commessa.contatto;

  return {
    numero: commessa.code || commessa.id,
    data: new Date().toISOString(),
    cliente: {
      nome: [contatto?.nome || commessa.cliente, contatto?.cognome || commessa.cognome].filter(Boolean).join(' '),
      codice_fiscale: contatto?.codice_fiscale,
    },
    immobile: {
      indirizzo: contatto?.indirizzo || commessa.indirizzo || '',
      comune: commessa.catasto_comune || contatto?.citta,
      foglio: commessa.catasto_foglio,
      particella: commessa.catasto_particella,
      subalterno: commessa.catasto_subalterno,
      categoria: commessa.catasto_categoria,
      zona_climatica: commessa.zona_clima,
    },
    vani: vaniCompleti,
    detrazione: null,
  };
}
