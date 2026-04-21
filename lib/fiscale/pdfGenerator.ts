// lib/fiscale/pdfGenerator.ts
// Genera PDF fiscali dal wizard: dichiarazione sostitutiva, scheda tecnica,
// istruzioni bonifico parlante, checklist commercialista.
// Output: salva su bucket 'fiscale-docs' + aggiorna fiscale_pratica.documenti_pdf[]

import jsPDF from 'jspdf';
import { createClient } from '@supabase/supabase-js';

const T = {
  dark: '#0D1F1F',
  teal: '#28A0A0',
  light: '#EEF8F8',
  border: '#C8E4E4',
  text: '#1F2937',
  muted: '#6B7280',
};

type Detrazione = '50' | '65' | '75';

export interface DatiFiscalePDF {
  azienda: {
    ragione_sociale: string;
    piva: string;
    cf?: string;
    indirizzo?: string;
    iban?: string;
    logo_url?: string;
  };
  cliente: {
    nome: string;
    cf: string;
    indirizzo_immobile: string;
    foglio?: string;
    particella?: string;
    subalterno?: string;
  };
  commessa: {
    id: string;
    numero: string;
    importo_totale: number;
    iva_aliquota: number;
    data_inizio?: string;
    data_fine?: string;
  };
  detrazione: Detrazione;
  praticaId: string;
}

function header(doc: jsPDF, titolo: string, azienda: DatiFiscalePDF['azienda']) {
  doc.setFillColor(T.dark);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(T.light);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(azienda.ragione_sociale, 15, 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`P.IVA ${azienda.piva}`, 15, 16);
  doc.setTextColor(T.text);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(titolo, 15, 34);
  doc.setDrawColor(T.teal);
  doc.setLineWidth(0.8);
  doc.line(15, 37, 195, 37);
}

function footer(doc: jsPDF, pagina: number) {
  doc.setTextColor(T.muted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Documento generato da MASTRO Suite — ${new Date().toLocaleDateString('it-IT')}`, 15, 287);
  doc.text(`Pag. ${pagina}`, 195, 287, { align: 'right' });
}

// ────────────────────────────────────────────────────────────
// 1. Dichiarazione sostitutiva detrazione
// ────────────────────────────────────────────────────────────
export function pdfDichiarazione(d: DatiFiscalePDF): Blob {
  const doc = new jsPDF();
  header(doc, `Dichiarazione sostitutiva — Detrazione ${d.detrazione}%`, d.azienda);

  doc.setTextColor(T.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  let y = 50;
  doc.text(`Il/La sottoscritto/a ${d.cliente.nome}`, 15, y); y += 6;
  doc.text(`C.F. ${d.cliente.cf}`, 15, y); y += 6;
  doc.text(`residente/proprietario dell'immobile sito in:`, 15, y); y += 6;
  doc.text(d.cliente.indirizzo_immobile, 15, y); y += 6;
  if (d.cliente.foglio) {
    doc.text(`Dati catastali — Foglio: ${d.cliente.foglio}  Particella: ${d.cliente.particella || '-'}  Sub: ${d.cliente.subalterno || '-'}`, 15, y);
    y += 8;
  } else y += 2;

  doc.setFont('helvetica', 'bold');
  doc.text('DICHIARA', 105, y, { align: 'center' }); y += 10;
  doc.setFont('helvetica', 'normal');

  const testo = d.detrazione === '50'
    ? `che l'intervento oggetto del presente documento (sostituzione serramenti, commessa n. ${d.commessa.numero}) rientra tra gli interventi di recupero del patrimonio edilizio di cui all'art. 16-bis TUIR, e di voler beneficiare della detrazione IRPEF del 50%.`
    : d.detrazione === '65'
    ? `che l'intervento oggetto del presente documento (sostituzione serramenti con miglioramento delle prestazioni energetiche, commessa n. ${d.commessa.numero}) rientra tra gli interventi di riqualificazione energetica di cui all'art. 14 DL 63/2013, e di voler beneficiare della detrazione IRPEF/IRES del 65% (Ecobonus). Dichiara inoltre di aver provveduto (o di provvedere entro 90 giorni dal fine lavori) alla comunicazione ENEA obbligatoria.`
    : `che l'intervento oggetto del presente documento (sostituzione serramenti su parti comuni condominiali con miglioramento delle prestazioni energetiche, commessa n. ${d.commessa.numero}) rientra tra gli interventi condominiali di riqualificazione energetica, e di voler beneficiare della detrazione IRPEF del 75% (Ecobonus condominiale). Dichiara inoltre l'obbligo di comunicazione ENEA entro 90 giorni dal fine lavori.`;

  const lines = doc.splitTextToSize(testo, 180);
  doc.text(lines, 15, y);
  y += lines.length * 5 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text(`Importo lavori: € ${d.commessa.importo_totale.toFixed(2)}  —  IVA ${d.commessa.iva_aliquota}%`, 15, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.text('Data: _______________________', 15, y);
  doc.text('Firma: _______________________________', 110, y);

  footer(doc, 1);
  return doc.output('blob');
}

// ────────────────────────────────────────────────────────────
// 2. Scheda tecnica detrazione (riassunto normativo per cliente)
// ────────────────────────────────────────────────────────────
export function pdfSchedaTecnica(d: DatiFiscalePDF): Blob {
  const doc = new jsPDF();
  header(doc, `Scheda tecnica — Detrazione ${d.detrazione}%`, d.azienda);

  doc.setTextColor(T.text);
  doc.setFontSize(10);
  let y = 50;

  const blocchi: [string, string[]][] = d.detrazione === '50' ? [
    ['Tipo detrazione', ['Recupero edilizio (Bonus Ristrutturazioni)', 'Art. 16-bis TUIR']],
    ['Aliquota', ['50% su spese documentate']],
    ['Massimale', ['€ 96.000 per unità immobiliare']],
    ['Rate', ['10 rate annuali di pari importo']],
    ['Pagamento', ['OBBLIGATORIO bonifico parlante (causale specifica)']],
    ['Documenti richiesti', ['Fattura con descrizione lavori', 'Bonifico parlante', 'Abilitazioni edilizie (se necessarie)']],
    ['ENEA', ['NON obbligatorio per sostituzione serramenti in Bonus 50%']],
  ] : d.detrazione === '65' ? [
    ['Tipo detrazione', ['Ecobonus — Riqualificazione energetica', 'Art. 14 DL 63/2013']],
    ['Aliquota', ['65% su spese documentate']],
    ['Massimale', ['€ 60.000 per unità immobiliare (serramenti)']],
    ['Rate', ['10 rate annuali di pari importo']],
    ['Pagamento', ['OBBLIGATORIO bonifico parlante']],
    ['Documenti richiesti', ['Fattura', 'Bonifico parlante', 'Asseverazione tecnica (se richiesta)', 'Scheda descrittiva intervento']],
    ['ENEA', ['OBBLIGATORIA entro 90 giorni dal fine lavori', 'Pena decadenza detrazione']],
  ] : [
    ['Tipo detrazione', ['Ecobonus condominiale', 'Art. 14 DL 63/2013']],
    ['Aliquota', ['75% su parti comuni condominiali']],
    ['Massimale', ['€ 40.000 × numero unità immobiliari']],
    ['Rate', ['10 rate annuali di pari importo']],
    ['Pagamento', ['OBBLIGATORIO bonifico parlante (condominio)']],
    ['Documenti richiesti', ['Fattura intestata al condominio', 'Delibera assembleare', 'Bonifico parlante', 'Asseverazione tecnica', 'APE ante/post operam']],
    ['ENEA', ['OBBLIGATORIA entro 90 giorni dal fine lavori']],
  ];

  for (const [etichetta, righe] of blocchi) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(T.teal);
    doc.text(etichetta, 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(T.text);
    for (const riga of righe) {
      const wrapped = doc.splitTextToSize(`• ${riga}`, 175);
      doc.text(wrapped, 20, y);
      y += wrapped.length * 5;
    }
    y += 4;
    if (y > 260) { footer(doc, 1); doc.addPage(); y = 20; }
  }

  footer(doc, 1);
  return doc.output('blob');
}

// ────────────────────────────────────────────────────────────
// 3. Istruzioni bonifico parlante
// ────────────────────────────────────────────────────────────
export function pdfBonificoParlante(d: DatiFiscalePDF): Blob {
  const doc = new jsPDF();
  header(doc, 'Istruzioni bonifico parlante', d.azienda);

  doc.setTextColor(T.text);
  doc.setFontSize(10);
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANTE: la detrazione richiede bonifico parlante con causale specifica.', 15, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Non è valido un bonifico ordinario. La banca applica una ritenuta d\'acconto dell\'8%.', 15, y);
  y += 12;

  // Box beneficiario
  doc.setFillColor(T.light);
  doc.rect(15, y, 180, 32, 'F');
  doc.setDrawColor(T.border);
  doc.rect(15, y, 180, 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(T.teal);
  doc.text('BENEFICIARIO', 20, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(T.text);
  doc.text(d.azienda.ragione_sociale, 20, y + 13);
  doc.text(`P.IVA ${d.azienda.piva}${d.azienda.cf ? `  —  C.F. ${d.azienda.cf}` : ''}`, 20, y + 19);
  if (d.azienda.iban) doc.text(`IBAN ${d.azienda.iban}`, 20, y + 25);
  y += 40;

  // Causale
  const causale = d.detrazione === '50'
    ? `Bonifico per interventi di recupero del patrimonio edilizio ex art. 16-bis TUIR — C.F. ${d.cliente.cf} — P.IVA ${d.azienda.piva} — Commessa ${d.commessa.numero}`
    : `Bonifico per riqualificazione energetica ex art. 14 DL 63/2013 — C.F. ${d.cliente.cf} — P.IVA ${d.azienda.piva} — Commessa ${d.commessa.numero}`;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(T.teal);
  doc.text('CAUSALE DA INSERIRE (copiare integralmente)', 15, y);
  y += 6;
  doc.setFont('courier', 'normal');
  doc.setTextColor(T.text);
  doc.setFillColor(T.light);
  const causaleLines = doc.splitTextToSize(causale, 175);
  doc.rect(15, y - 4, 180, causaleLines.length * 5 + 6, 'F');
  doc.text(causaleLines, 18, y);
  y += causaleLines.length * 5 + 12;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(T.text);
  doc.text(`Importo: € ${d.commessa.importo_totale.toFixed(2)}`, 15, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Conservare copia del bonifico firmato per 10 anni (durata della detrazione).', 15, y);

  footer(doc, 1);
  return doc.output('blob');
}

// ────────────────────────────────────────────────────────────
// 4. Checklist commercialista
// ────────────────────────────────────────────────────────────
export function pdfChecklistCommercialista(d: DatiFiscalePDF): Blob {
  const doc = new jsPDF();
  header(doc, 'Checklist documenti per commercialista', d.azienda);

  doc.setTextColor(T.text);
  doc.setFontSize(10);
  let y = 50;

  doc.text(`Cliente: ${d.cliente.nome}  —  C.F. ${d.cliente.cf}`, 15, y); y += 6;
  doc.text(`Commessa: ${d.commessa.numero}  —  Detrazione: ${d.detrazione}%`, 15, y); y += 10;

  const items = [
    'Fattura elettronica (copia PDF + XML)',
    'Bonifico parlante firmato e timbrato',
    'Dichiarazione sostitutiva cliente (firmata)',
    'Scheda tecnica intervento',
    ...(d.detrazione !== '50' ? [
      'Ricevuta trasmissione ENEA (entro 90gg fine lavori)',
      'Asseverazione tecnica (se importo > soglia)',
    ] : []),
    ...(d.detrazione === '75' ? [
      'Delibera assembleare condominiale',
      'APE ante operam',
      'APE post operam',
    ] : []),
    'Certificazione CE serramenti installati',
    'Scheda prodotto (trasmittanza Uw)',
  ];

  doc.setFont('helvetica', 'normal');
  for (const item of items) {
    doc.rect(15, y - 3.5, 4, 4);
    doc.text(item, 22, y);
    y += 7;
  }

  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(T.muted);
  doc.text('Conservare la documentazione per almeno 10 anni (durata rateizzazione detrazione).', 15, y);

  footer(doc, 1);
  return doc.output('blob');
}

// ────────────────────────────────────────────────────────────
// Orchestratore: genera tutti i PDF + carica su storage + aggiorna DB
// ────────────────────────────────────────────────────────────
export async function generaEcaricaPDFFiscali(
  d: DatiFiscalePDF,
  supabaseUrl: string,
  supabaseKey: string,
): Promise<{ ok: boolean; urls: string[]; error?: string }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const base = `${d.praticaId}/${Date.now()}`;

    const docs: { nome: string; blob: Blob }[] = [
      { nome: 'dichiarazione-sostitutiva.pdf', blob: pdfDichiarazione(d) },
      { nome: 'scheda-tecnica.pdf', blob: pdfSchedaTecnica(d) },
      { nome: 'istruzioni-bonifico.pdf', blob: pdfBonificoParlante(d) },
      { nome: 'checklist-commercialista.pdf', blob: pdfChecklistCommercialista(d) },
    ];

    const urls: string[] = [];
    for (const doc of docs) {
      const path = `${base}/${doc.nome}`;
      const { error } = await supabase.storage
        .from('fiscale-docs')
        .upload(path, doc.blob, { contentType: 'application/pdf', upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('fiscale-docs').getPublicUrl(path);
      urls.push(publicUrl);
    }

    const documenti_pdf = urls.map((url, i) => ({
      nome: docs[i].nome,
      url,
      generato_il: new Date().toISOString(),
    }));

    const { error: updErr } = await supabase
      .from('fiscale_pratica')
      .update({ documenti_pdf })
      .eq('id', d.praticaId);

    if (updErr) throw updErr;

    return { ok: true, urls };
  } catch (e: any) {
    return { ok: false, urls: [], error: e.message || String(e) };
  }
}
