// lib/fiscale/pdfGenerator.ts
// Genera PDF fiscali: dichiarazione sostitutiva, scheda tecnica, bonifico parlante, checklist.
// Salva su bucket 'fiscale-docs' + aggiorna fiscale_pratica.documenti_pdf[]

import jsPDF from 'jspdf';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
    ragione: string;
    piva: string;
    codice_fiscale?: string | null;
    indirizzo?: string | null;
    iban?: string | null;
  };
  cliente: {
    nome: string;
    codice_fiscale: string;
    indirizzo_immobile: string;
  };
  commessa: {
    id: string;
    code: string;
    importo_totale: number;
    iva_aliquota: number;
    data_fine_lavori?: string | null;
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
  doc.text(azienda.ragione, 15, 10);
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
  doc.text(`Generato da MASTRO Suite — ${new Date().toLocaleDateString('it-IT')}`, 15, 287);
  doc.text(`Pag. ${pagina}`, 195, 287, { align: 'right' });
}

export function pdfDichiarazione(d: DatiFiscalePDF): Blob {
  const doc = new jsPDF();
  header(doc, `Dichiarazione sostitutiva — Detrazione ${d.detrazione}%`, d.azienda);
  doc.setTextColor(T.text);
  doc.setFontSize(10);

  let y = 50;
  doc.text(`Il/La sottoscritto/a ${d.cliente.nome}`, 15, y); y += 6;
  doc.text(`C.F. ${d.cliente.codice_fiscale}`, 15, y); y += 6;
  doc.text(`residente/proprietario dell'immobile sito in:`, 15, y); y += 6;
  const indLines = doc.splitTextToSize(d.cliente.indirizzo_immobile, 180);
  doc.text(indLines, 15, y); y += indLines.length * 5 + 6;

  doc.setFont('helvetica', 'bold');
  doc.text('DICHIARA', 105, y, { align: 'center' }); y += 10;
  doc.setFont('helvetica', 'normal');

  const testo = d.detrazione === '50'
    ? `che l'intervento (sostituzione serramenti, commessa n. ${d.commessa.code}) rientra tra gli interventi di recupero del patrimonio edilizio di cui all'art. 16-bis TUIR, e di voler beneficiare della detrazione IRPEF del 50%.`
    : d.detrazione === '65'
    ? `che l'intervento (sostituzione serramenti con miglioramento prestazioni energetiche, commessa n. ${d.commessa.code}) rientra tra gli interventi di riqualificazione energetica di cui all'art. 14 DL 63/2013, e di voler beneficiare della detrazione del 65% (Ecobonus). Si dichiara l'obbligo di comunicazione ENEA entro 90 giorni dal fine lavori.`
    : `che l'intervento (sostituzione serramenti su parti comuni condominiali, commessa n. ${d.commessa.code}) rientra tra gli interventi condominiali di riqualificazione energetica, e di voler beneficiare della detrazione del 75%. Si dichiara l'obbligo di comunicazione ENEA entro 90 giorni dal fine lavori.`;

  const lines = doc.splitTextToSize(testo, 180);
  doc.text(lines, 15, y);
  y += lines.length * 5 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text(`Importo lavori: € ${Number(d.commessa.importo_totale || 0).toFixed(2)}  —  IVA ${d.commessa.iva_aliquota}%`, 15, y);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.text('Data: _______________________', 15, y);
  doc.text('Firma: _______________________________', 110, y);
  footer(doc, 1);
  return doc.output('blob');
}

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
    ['Pagamento', ['OBBLIGATORIO bonifico parlante']],
    ['Documenti', ['Fattura', 'Bonifico parlante', 'Abilitazioni edilizie se necessarie']],
    ['ENEA', ['NON obbligatoria per Bonus 50% serramenti']],
  ] : d.detrazione === '65' ? [
    ['Tipo detrazione', ['Ecobonus — Riqualificazione energetica', 'Art. 14 DL 63/2013']],
    ['Aliquota', ['65% su spese documentate']],
    ['Massimale', ['€ 60.000 per unità immobiliare']],
    ['Rate', ['10 rate annuali di pari importo']],
    ['Pagamento', ['OBBLIGATORIO bonifico parlante']],
    ['Documenti', ['Fattura', 'Bonifico parlante', 'Asseverazione tecnica se richiesta', 'Scheda descrittiva']],
    ['ENEA', ['OBBLIGATORIA entro 90 giorni dal fine lavori', 'Pena decadenza detrazione']],
  ] : [
    ['Tipo detrazione', ['Ecobonus condominiale', 'Art. 14 DL 63/2013']],
    ['Aliquota', ['75% su parti comuni condominiali']],
    ['Massimale', ['€ 40.000 × numero unità immobiliari']],
    ['Rate', ['10 rate annuali di pari importo']],
    ['Pagamento', ['OBBLIGATORIO bonifico parlante del condominio']],
    ['Documenti', ['Fattura intestata al condominio', 'Delibera assembleare', 'Asseverazione tecnica', 'APE ante/post operam']],
    ['ENEA', ['OBBLIGATORIA entro 90 giorni dal fine lavori']],
  ];

  for (const [et, righe] of blocchi) {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(T.teal);
    doc.text(et, 15, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(T.text);
    for (const r of righe) {
      const w = doc.splitTextToSize(`• ${r}`, 175);
      doc.text(w, 20, y); y += w.length * 5;
    }
    y += 4;
    if (y > 260) { footer(doc, 1); doc.addPage(); y = 20; }
  }
  footer(doc, 1);
  return doc.output('blob');
}

export function pdfBonificoParlante(d: DatiFiscalePDF): Blob {
  const doc = new jsPDF();
  header(doc, 'Istruzioni bonifico parlante', d.azienda);
  doc.setTextColor(T.text);
  doc.setFontSize(10);
  let y = 50;

  doc.setFont('helvetica', 'bold');
  doc.text('La detrazione richiede bonifico parlante con causale specifica.', 15, y); y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Non è valido un bonifico ordinario. La banca applica ritenuta d\'acconto 8%.', 15, y); y += 12;

  doc.setFillColor(T.light);
  doc.rect(15, y, 180, 32, 'F');
  doc.setDrawColor(T.border); doc.rect(15, y, 180, 32);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(T.teal);
  doc.text('BENEFICIARIO', 20, y + 6);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(T.text);
  doc.text(d.azienda.ragione, 20, y + 13);
  doc.text(`P.IVA ${d.azienda.piva}${d.azienda.codice_fiscale ? `  —  C.F. ${d.azienda.codice_fiscale}` : ''}`, 20, y + 19);
  if (d.azienda.iban) doc.text(`IBAN ${d.azienda.iban}`, 20, y + 25);
  y += 40;

  const causale = d.detrazione === '50'
    ? `Bonifico per interventi di recupero patrimonio edilizio ex art. 16-bis TUIR — C.F. ${d.cliente.codice_fiscale} — P.IVA ${d.azienda.piva} — Commessa ${d.commessa.code}`
    : `Bonifico per riqualificazione energetica ex art. 14 DL 63/2013 — C.F. ${d.cliente.codice_fiscale} — P.IVA ${d.azienda.piva} — Commessa ${d.commessa.code}`;

  doc.setFont('helvetica', 'bold'); doc.setTextColor(T.teal);
  doc.text('CAUSALE DA INSERIRE (copiare integralmente)', 15, y); y += 6;
  doc.setFont('courier', 'normal'); doc.setTextColor(T.text);
  doc.setFillColor(T.light);
  const cLines = doc.splitTextToSize(causale, 175);
  doc.rect(15, y - 4, 180, cLines.length * 5 + 6, 'F');
  doc.text(cLines, 18, y);
  y += cLines.length * 5 + 12;

  doc.setFont('helvetica', 'bold'); doc.setTextColor(T.text);
  doc.text(`Importo: € ${Number(d.commessa.importo_totale || 0).toFixed(2)}`, 15, y); y += 10;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Conservare copia firmata del bonifico per 10 anni.', 15, y);
  footer(doc, 1);
  return doc.output('blob');
}

export function pdfChecklistCommercialista(d: DatiFiscalePDF): Blob {
  const doc = new jsPDF();
  header(doc, 'Checklist documenti per commercialista', d.azienda);
  doc.setTextColor(T.text);
  doc.setFontSize(10);
  let y = 50;

  doc.text(`Cliente: ${d.cliente.nome}  —  C.F. ${d.cliente.codice_fiscale}`, 15, y); y += 6;
  doc.text(`Commessa: ${d.commessa.code}  —  Detrazione: ${d.detrazione}%`, 15, y); y += 10;

  const items = [
    'Fattura elettronica (copia PDF + XML)',
    'Bonifico parlante firmato',
    'Dichiarazione sostitutiva cliente firmata',
    'Scheda tecnica intervento',
    ...(d.detrazione !== '50' ? [
      'Ricevuta trasmissione ENEA (entro 90gg)',
      'Asseverazione tecnica (se richiesta)',
    ] : []),
    ...(d.detrazione === '75' ? [
      'Delibera assembleare condominiale',
      'APE ante operam',
      'APE post operam',
    ] : []),
    'Certificazione CE serramenti',
    'Scheda prodotto (trasmittanza Uw)',
  ];

  doc.setFont('helvetica', 'normal');
  for (const item of items) {
    doc.rect(15, y - 3.5, 4, 4);
    doc.text(item, 22, y);
    y += 7;
  }

  y += 8;
  doc.setFontSize(9); doc.setTextColor(T.muted);
  doc.text('Conservare per almeno 10 anni (durata rateizzazione).', 15, y);
  footer(doc, 1);
  return doc.output('blob');
}

export async function generaEcaricaPDFFiscali(
  d: DatiFiscalePDF,
  supabase: SupabaseClient,
): Promise<{ ok: boolean; urls: string[]; error?: string }> {
  try {
    const base = `${d.praticaId}/${Date.now()}`;
    const docs: { nome: string; blob: Blob }[] = [
      { nome: 'dichiarazione-sostitutiva.pdf', blob: pdfDichiarazione(d) },
      { nome: 'scheda-tecnica.pdf', blob: pdfSchedaTecnica(d) },
      { nome: 'istruzioni-bonifico.pdf', blob: pdfBonificoParlante(d) },
      { nome: 'checklist-commercialista.pdf', blob: pdfChecklistCommercialista(d) },
    ];

    // Bucket fiscale-docs è PRIVATO → salviamo il path, non l'URL pubblico.
    // Il download side userà createSignedUrl(path, 3600) al momento.
    const paths: string[] = [];
    const urls: string[] = [];
    for (const doc of docs) {
      const path = `${base}/${doc.nome}`;
      const { error } = await supabase.storage
        .from('fiscale-docs')
        .upload(path, doc.blob, { contentType: 'application/pdf', upsert: true });
      if (error) throw error;
      paths.push(path);
      // Signed URL con validità 7 giorni per la prima visualizzazione
      const { data: signed } = await supabase.storage
        .from('fiscale-docs')
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      urls.push(signed?.signedUrl || '');
    }

    const documenti_pdf = paths.map((path, i) => ({
      nome: docs[i].nome,
      path,
      signed_url: urls[i],
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

export async function generaPDFFiscaliFromClient(
  d: DatiFiscalePDF,
  supabaseUrl: string,
  supabaseAnonKey: string,
) {
  const sb = createClient(supabaseUrl, supabaseAnonKey);
  return generaEcaricaPDFFiscali(d, sb);
}
