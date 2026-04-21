// lib/pdf/pdfHelpers.ts
// Helpers condivisi per tutti i PDF MASTRO: header/footer, tabelle, KPI, separatori.
// Palette fliwoX: dark header, teal accent, card bianche.

import jsPDF from 'jspdf';

export const PDF_T = {
  dark: '#0D1F1F',
  teal: '#28A0A0',
  tealSoft: '#EEF8F8',
  border: '#C8E4E4',
  text: '#0D1F1F',
  textSub: '#6A8484',
  ok: '#16A34A',
  warn: '#F59E0B',
  danger: '#DC2626',
};

export const PDF_PAGE = { w: 210, h: 297, ml: 15, mr: 15, mt: 15, mb: 15 };

export interface AziendaInfo {
  ragione: string;
  piva: string;
  codice_fiscale?: string | null;
  indirizzo?: string | null;
  citta?: string | null;
  cap?: string | null;
  provincia?: string | null;
  telefono?: string | null;
  email?: string | null;
  website?: string | null;
  iban?: string | null;
  logo_url?: string | null;
  cciaa?: string | null;
}

// Header: barra dark full-width con logo box + ragione + info, poi titolo documento + meta
export function pdfHeader(doc: jsPDF, opts: {
  azienda: AziendaInfo;
  titolo: string;
  numero?: string;
  data?: string;
  cliente?: string;
  etichettaChip?: string; // es. "Scheda tecnica commessa"
}) {
  const { azienda, titolo, numero, data, cliente, etichettaChip } = opts;

  // Barra dark (alta)
  doc.setFillColor(PDF_T.dark);
  doc.rect(0, 0, PDF_PAGE.w, 34, 'F');

  // Logo placeholder (quadrato teal)
  doc.setFillColor(PDF_T.teal);
  doc.roundedRect(15, 10, 14, 14, 2, 2, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(azienda.ragione?.charAt(0)?.toUpperCase() || 'M', 22, 19.5, { align: 'center' });

  // Nome + info azienda
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(azienda.ragione || '', 33, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#A0CFCF');
  const riga2 = [
    azienda.indirizzo,
    [azienda.cap, azienda.citta, azienda.provincia].filter(Boolean).join(' '),
  ].filter(Boolean).join(' · ');
  if (riga2) doc.text(riga2, 33, 19.5);

  const riga3 = [
    `P.IVA ${azienda.piva || '—'}`,
    azienda.telefono,
    azienda.email,
  ].filter(Boolean).join(' · ');
  if (riga3) doc.text(riga3, 33, 23.5);

  // Chip etichetta a destra (pill teal)
  if (etichettaChip) {
    doc.setFillColor(PDF_T.teal);
    doc.roundedRect(PDF_PAGE.w - 15 - 54, 12, 54, 10, 5, 5, 'F');
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(etichettaChip.toUpperCase(), PDF_PAGE.w - 15 - 27, 18, { align: 'center' });
  }

  // Titolo documento (dark text sotto barra)
  let y = 44;
  doc.setTextColor(PDF_T.text);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(titolo, 15, y);
  y += 2;

  // Riga meta (numero · data · cliente)
  const meta = [
    numero ? `N. ${numero}` : null,
    data ? `Data ${data}` : null,
    cliente ? `Cliente: ${cliente}` : null,
  ].filter(Boolean).join('    ·    ');
  if (meta) {
    doc.setFontSize(9);
    doc.setTextColor(PDF_T.textSub);
    doc.setFont('helvetica', 'normal');
    doc.text(meta, 15, y + 4);
  }

  // Linea separatrice teal
  doc.setDrawColor(PDF_T.teal);
  doc.setLineWidth(0.6);
  doc.line(15, y + 8, PDF_PAGE.w - 15, y + 8);

  return y + 14; // return Y di lavoro iniziale
}

// Footer: P.IVA · email · numero pagina
export function pdfFooter(doc: jsPDF, azienda: AziendaInfo, pagina: number, totale?: number) {
  const y = PDF_PAGE.h - 10;
  doc.setDrawColor(PDF_T.border);
  doc.setLineWidth(0.3);
  doc.line(15, y - 3, PDF_PAGE.w - 15, y - 3);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_T.textSub);

  const sx = [azienda.ragione, `P.IVA ${azienda.piva}`, azienda.email].filter(Boolean).join(' · ');
  doc.text(sx, 15, y);

  const dx = totale ? `Pag. ${pagina} / ${totale}` : `Pag. ${pagina}`;
  doc.text(dx, PDF_PAGE.w - 15, y, { align: 'right' });
}

// Sezione titolata con linea accent teal sotto
export function pdfSectionTitle(doc: jsPDF, titolo: string, y: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_T.teal);
  doc.text(titolo.toUpperCase(), 15, y);
  doc.setDrawColor(PDF_T.teal);
  doc.setLineWidth(0.3);
  doc.line(15, y + 1.5, 15 + doc.getTextWidth(titolo.toUpperCase()) + 4, y + 1.5);
  return y + 7;
}

// Box info (card sottile con border)
export function pdfInfoBox(doc: jsPDF, x: number, y: number, w: number, h: number, titolo: string, righe: string[]): number {
  doc.setFillColor('#FFFFFF');
  doc.setDrawColor(PDF_T.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_T.teal);
  doc.text(titolo.toUpperCase(), x + 4, y + 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_T.text);
  let yy = y + 10;
  for (const r of righe) {
    if (yy - y > h - 2) break;
    const lines = doc.splitTextToSize(r, w - 8);
    doc.text(lines, x + 4, yy);
    yy += lines.length * 4.2;
  }
  return y + h;
}

// Riga key-value (per tabelle dati)
export function pdfKV(doc: jsPDF, k: string, v: string, x: number, y: number, wLabel: number, wTot: number) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_T.textSub);
  doc.text(k, x, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_T.text);
  const vLines = doc.splitTextToSize(v, wTot - wLabel - 2);
  doc.text(vLines, x + wLabel, y);
  return vLines.length * 4;
}

// Separatore sottile
export function pdfSeparator(doc: jsPDF, y: number, color = PDF_T.border) {
  doc.setDrawColor(color);
  doc.setLineWidth(0.2);
  doc.line(15, y, PDF_PAGE.w - 15, y);
  return y + 3;
}

// Check page break + return nuovo y
export function pdfCheckPageBreak(doc: jsPDF, y: number, heightNeeded: number, azienda: AziendaInfo, pageRef: { n: number }, reheader: (d: jsPDF) => number): number {
  if (y + heightNeeded > PDF_PAGE.h - PDF_PAGE.mb - 5) {
    pdfFooter(doc, azienda, pageRef.n);
    doc.addPage();
    pageRef.n++;
    return reheader(doc);
  }
  return y;
}

// Tabella generica con header teal + righe alternate
export function pdfTable(doc: jsPDF, x: number, y: number, colonne: { label: string; w: number; align?: 'left' | 'right' | 'center' }[], righe: (string | number)[][]): number {
  const rowH = 7;

  // Header dark
  doc.setFillColor(PDF_T.dark);
  let totW = colonne.reduce((s, c) => s + c.w, 0);
  doc.rect(x, y, totW, rowH, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let cx = x;
  for (const col of colonne) {
    const align = col.align || 'left';
    const tx = align === 'left' ? cx + 3 : align === 'right' ? cx + col.w - 3 : cx + col.w / 2;
    doc.text(col.label, tx, y + 4.5, { align });
    cx += col.w;
  }

  // Righe
  y += rowH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(PDF_T.text);
  for (let i = 0; i < righe.length; i++) {
    if (i % 2 === 1) {
      doc.setFillColor(PDF_T.tealSoft);
      doc.rect(x, y, totW, rowH, 'F');
    }
    cx = x;
    for (let c = 0; c < colonne.length; c++) {
      const col = colonne[c];
      const valore = String(righe[i][c] ?? '');
      const align = col.align || 'left';
      const tx = align === 'left' ? cx + 3 : align === 'right' ? cx + col.w - 3 : cx + col.w / 2;
      const lines = doc.splitTextToSize(valore, col.w - 4);
      doc.text(lines[0] || '', tx, y + 4.5, { align });
      cx += col.w;
    }
    y += rowH;
  }

  // Border
  doc.setDrawColor(PDF_T.border);
  doc.setLineWidth(0.2);
  doc.rect(x, y - rowH * (righe.length + 1), totW, rowH * (righe.length + 1));
  return y + 2;
}

// Totale grande teal (bottom fattura)
export function pdfTotaleFinale(doc: jsPDF, y: number, label: string, valore: string): number {
  doc.setFillColor(PDF_T.dark);
  doc.rect(15, y, PDF_PAGE.w - 30, 14, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(label.toUpperCase(), 19, y + 9);
  doc.setFontSize(14);
  doc.setTextColor(PDF_T.teal);
  doc.text(valore, PDF_PAGE.w - 19, y + 9, { align: 'right' });
  return y + 18;
}

export function fmtEuro(n: number): string {
  return '€ ' + (Number(n) || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtData(s?: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('it-IT');
}
