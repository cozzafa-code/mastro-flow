// lib/pdf/ordineConfermaPDF.ts
// PDF Conferma d'Ordine — layout fliwoX pulito.
// Include: header aziendale, box cliente + ordine, tabella voci, totali, condizioni, slot firma.

import jsPDF from 'jspdf';
import {
  PDF_T, PDF_PAGE, pdfHeader, pdfFooter, pdfSectionTitle,
  pdfInfoBox, pdfTable, pdfTotaleFinale, pdfSeparator,
  pdfCheckPageBreak, fmtEuro, fmtData, type AziendaInfo,
} from './pdfHelpers';

export interface OrdineDati {
  numero: string;
  data: string;
  cliente: {
    nome: string;
    codice_fiscale?: string | null;
    indirizzo?: string | null;
    telefono?: string | null;
    email?: string | null;
  };
  immobile?: {
    indirizzo: string;
    catasto?: string | null; // es. "Foglio 12 · Part. 345 · Sub 2"
  };
  detrazione?: string | null; // es. "50%", "65%", "75%"
  voci: {
    n: number;
    descrizione: string; // es. "Vano 1 - F2A - 1500×1500"
    dettaglio?: string;  // es. "Aluplast Ideal 4000 · 4/16/4 BE · RAL 7016"
    categoria?: string;  // es. "Cucina · Telaio L · Coprifilo CP40"
    qta: number;
    prezzoUnit: number;
    totale: number;
  }[];
  imponibile: number;
  scontoPerc?: number;
  scontoEuro?: number;
  ivaPerc: number;
  iva: number;
  totaleFinale: number;
  tempiConsegnaGg?: number;
  garanziaAnni?: number;
  noteAggiuntive?: string;
}

export function pdfOrdineConferma(doc: jsPDF, azienda: AziendaInfo, d: OrdineDati): void {
  const pageRef = { n: 1 };
  const reheader = (d2: jsPDF) => pdfHeader(d2, {
    azienda,
    titolo: 'Conferma d\'ordine',
    numero: d.numero,
    data: fmtData(d.data),
    etichettaChip: 'Conferma d\'ordine',
  });

  let y = reheader(doc);

  // ───── BOX CLIENTE + ORDINE ─────
  const boxW = (PDF_PAGE.w - 30 - 5) / 2;
  const clienteRighe = [
    d.cliente.nome,
    d.cliente.indirizzo || '',
    d.cliente.telefono || '',
    d.cliente.email || '',
    d.cliente.codice_fiscale ? `C.F. ${d.cliente.codice_fiscale}` : '',
  ].filter(Boolean);
  pdfInfoBox(doc, 15, y, boxW, 32, 'Cliente', clienteRighe);

  const ordineRighe = [
    `N. ${d.numero}`,
    `Data: ${fmtData(d.data)}`,
    d.detrazione ? `Detrazione: ${d.detrazione}` : '',
    d.tempiConsegnaGg ? `Consegna: ${d.tempiConsegnaGg} giorni lavorativi` : '',
    d.garanziaAnni ? `Garanzia: ${d.garanziaAnni} anni` : '',
  ].filter(Boolean);
  pdfInfoBox(doc, 15 + boxW + 5, y, boxW, 32, 'Riferimento ordine', ordineRighe);

  y += 38;

  // ───── IMMOBILE (se presente) ─────
  if (d.immobile?.indirizzo) {
    const righe = [
      d.immobile.indirizzo,
      d.immobile.catasto || '',
    ].filter(Boolean);
    pdfInfoBox(doc, 15, y, PDF_PAGE.w - 30, 18, 'Immobile oggetto dell\'intervento', righe);
    y += 23;
  }

  // ───── TABELLA VOCI ─────
  y = pdfSectionTitle(doc, 'Descrizione lavori', y);
  y = pdfCheckPageBreak(doc, y, 40, azienda, pageRef, reheader);

  // Costruisco righe estese (descrizione + dettaglio + categoria)
  const righeTabella: (string | number)[][] = d.voci.map(v => {
    const desc = [
      v.descrizione,
      v.dettaglio ? `\n${v.dettaglio}` : '',
      v.categoria ? `\n${v.categoria}` : '',
    ].join('');
    return [v.n, desc, v.qta, fmtEuro(v.prezzoUnit), fmtEuro(v.totale)];
  });

  // tabella custom per supportare multi-line description
  y = tabellaVoci(doc, y, d.voci);

  // ───── TOTALI ─────
  y = pdfCheckPageBreak(doc, y, 50, azienda, pageRef, reheader);
  y += 4;
  y = totaliBox(doc, y, d);

  // ───── CONDIZIONI ─────
  y = pdfCheckPageBreak(doc, y, 60, azienda, pageRef, reheader);
  y += 6;
  y = pdfSectionTitle(doc, 'Condizioni generali', y);
  y = condizioniBlocco(doc, y, d);

  // ───── FIRMA ─────
  y = pdfCheckPageBreak(doc, y, 60, azienda, pageRef, reheader);
  y = slotFirma(doc, y);

  pdfFooter(doc, azienda, pageRef.n);
}

// ───── Sub-helpers ─────

function tabellaVoci(doc: jsPDF, y: number, voci: OrdineDati['voci']): number {
  const x = 15;
  const cols = [
    { w: 10, label: '#', align: 'center' as const },
    { w: 100, label: 'Descrizione', align: 'left' as const },
    { w: 18, label: 'Q.tà', align: 'center' as const },
    { w: 24, label: 'Prezzo un.', align: 'right' as const },
    { w: 28, label: 'Totale', align: 'right' as const },
  ];
  const totW = cols.reduce((s, c) => s + c.w, 0);
  const headH = 7;

  // Header dark
  doc.setFillColor(PDF_T.dark);
  doc.rect(x, y, totW, headH, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let cx = x;
  for (const c of cols) {
    const tx = c.align === 'left' ? cx + 3 : c.align === 'right' ? cx + c.w - 3 : cx + c.w / 2;
    doc.text(c.label, tx, y + 4.5, { align: c.align });
    cx += c.w;
  }
  y += headH;

  // Righe
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(PDF_T.text);

  for (let i = 0; i < voci.length; i++) {
    const v = voci[i];
    // Calcola altezza necessaria
    const descMain = v.descrizione;
    const descSub = [v.dettaglio, v.categoria].filter(Boolean);
    const rowH = 8 + descSub.length * 4;

    if (i % 2 === 1) {
      doc.setFillColor(PDF_T.tealSoft);
      doc.rect(x, y, totW, rowH, 'F');
    }

    cx = x;
    // #
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_T.textSub);
    doc.text(String(v.n), cx + cols[0].w / 2, y + 5, { align: 'center' });
    cx += cols[0].w;

    // Descrizione
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_T.text);
    doc.setFontSize(9);
    doc.text(descMain, cx + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_T.textSub);
    let yy = y + 9;
    for (const sub of descSub) {
      doc.text(sub!, cx + 3, yy);
      yy += 4;
    }
    cx += cols[1].w;

    // Q.tà
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(PDF_T.text);
    doc.text(String(v.qta), cx + cols[2].w / 2, y + 5, { align: 'center' });
    cx += cols[2].w;

    // Prezzo
    doc.text(fmtEuro(v.prezzoUnit), cx + cols[3].w - 3, y + 5, { align: 'right' });
    cx += cols[3].w;

    // Totale
    doc.setFont('helvetica', 'bold');
    doc.text(fmtEuro(v.totale), cx + cols[4].w - 3, y + 5, { align: 'right' });

    y += rowH;
  }

  // Border
  doc.setDrawColor(PDF_T.border);
  doc.setLineWidth(0.2);
  doc.rect(x, y - (voci.reduce((s, v) => s + 8 + [v.dettaglio, v.categoria].filter(Boolean).length * 4, 0) + headH), totW, voci.reduce((s, v) => s + 8 + [v.dettaglio, v.categoria].filter(Boolean).length * 4, 0) + headH);
  return y + 3;
}

function totaliBox(doc: jsPDF, y: number, d: OrdineDati): number {
  const x = PDF_PAGE.w - 15 - 90;
  const w = 90;

  const riga = (label: string, valore: string, bold = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(PDF_T.text);
    doc.text(label, x + 3, y + 5);
    doc.text(valore, x + w - 3, y + 5, { align: 'right' });
    y += 6.5;
  };

  // background sottile
  doc.setFillColor('#FFFFFF');
  doc.setDrawColor(PDF_T.border);
  doc.roundedRect(x, y, w, 28 + (d.scontoPerc ? 6.5 : 0), 2, 2, 'FD');
  y += 2;

  riga('Imponibile', fmtEuro(d.imponibile));
  if (d.scontoPerc && d.scontoPerc > 0) {
    riga(`Sconto ${d.scontoPerc}%`, `− ${fmtEuro(d.scontoEuro || 0)}`);
  }
  riga(`IVA ${d.ivaPerc}%`, fmtEuro(d.iva));
  y += 2;

  // Totale finale full-width
  y += 1;
  return pdfTotaleFinale(doc, y, 'Totale IVA inclusa', fmtEuro(d.totaleFinale));
}

function condizioniBlocco(doc: jsPDF, y: number, d: OrdineDati): number {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_T.textSub);

  const condizioni = [
    `Tempi di consegna: ${d.tempiConsegnaGg || 45} giorni lavorativi dalla conferma d'ordine, salvo imprevisti produttivi comunicati tempestivamente.`,
    'Pagamento: acconto 40% alla conferma, saldo 60% a collaudo positivo dei lavori.',
    `Garanzia: ${d.garanziaAnni || 10} anni sui serramenti installati secondo quanto previsto dalla normativa UNI 11673-1 e dalla garanzia convenzionale del produttore.`,
    'La presente conferma d\'ordine è vincolante dal momento della firma. Eventuali varianti richieste successivamente saranno quotate separatamente.',
    'In caso di ripensamento si applica il diritto di recesso nei 14 giorni ai sensi dell\'art. 52 Codice del Consumo (solo per contratti stipulati fuori dai locali commerciali).',
    d.detrazione ? `Detrazione fiscale ${d.detrazione}: il cliente dichiara di aver ricevuto le informazioni necessarie per la fruizione della detrazione e di aver compreso gli adempimenti a proprio carico (bonifico parlante, conservazione documenti).` : '',
  ].filter(Boolean);

  for (const riga of condizioni) {
    const lines = doc.splitTextToSize(riga, PDF_PAGE.w - 30);
    doc.text(lines, 15, y);
    y += lines.length * 3.8 + 1;
  }

  if (d.noteAggiuntive) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_T.text);
    doc.text('Note aggiuntive:', 15, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_T.textSub);
    const noteLines = doc.splitTextToSize(d.noteAggiuntive, PDF_PAGE.w - 30);
    doc.text(noteLines, 15, y);
    y += noteLines.length * 3.8;
  }
  return y + 2;
}

function slotFirma(doc: jsPDF, y: number): number {
  y += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_T.teal);
  doc.text('ACCETTAZIONE ORDINE', 15, y);
  y += 5;

  const w = PDF_PAGE.w - 30;
  const h = 40;
  doc.setDrawColor(PDF_T.border);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.roundedRect(15, y, w, h, 3, 3);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_T.textSub);
  doc.text('FIRMA CLIENTE', PDF_PAGE.w / 2, y + 7, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor('#B0CFCF');
  doc.text('In attesa di firma', PDF_PAGE.w / 2, y + 22, { align: 'center' });

  y += h + 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_T.textSub);
  doc.text('Luogo e data: _____________________', 15, y);
  doc.text('Firma: _____________________', PDF_PAGE.w - 15, y, { align: 'right' });

  return y + 8;
}
