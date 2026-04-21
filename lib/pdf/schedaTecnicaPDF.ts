// lib/pdf/schedaTecnicaPDF.ts
// PDF Scheda Tecnica Commessa — completo: disegni, dati prestazionali, CAM, CE, condizioni.
// Una pagina riepilogo + una pagina per vano con disegno SVG.

import jsPDF from 'jspdf';
import {
  PDF_T, PDF_PAGE, pdfHeader, pdfFooter, pdfSectionTitle,
  pdfInfoBox, fmtEuro, fmtData, type AziendaInfo,
} from './pdfHelpers';
import { buildSVGVano, svgToPngDataUrl, type VanoPerDisegno } from './disegnoVanoSVG';

export interface SchedaVano extends VanoPerDisegno {
  // Dati vano estesi
  stanza?: string | null;
  piano?: string | null;
  sistema?: string | null;
  sottosistema?: string | null;
  vetro?: string | null;
  colore_int?: string | null;
  colore_est?: string | null;
  bicolore?: boolean;
  accessori?: any;
  pezzi?: number | null;
  peso_vetri?: number | null;
  flag_critico?: boolean;
  flag_condensa?: boolean;

  // Dati prestazionali (da catalogo_prestazioni JOIN)
  uw?: number | null;
  uf?: number | null;
  ug?: number | null;
  rw?: number | null;
  g_tot?: number | null;
  tl?: number | null;
  classe_aria?: string | null;
  classe_acqua?: string | null;
  classe_vento?: string | null;
  classe_antieffrazione?: string | null;
  perc_riciclato?: number | null;
  cam_compliant?: boolean;
  uni11673_1?: boolean;

  // CE
  norma_ce?: string | null;
  certificazioni?: string[] | null;
}

export interface SchedaTecnicaDati {
  numero: string;
  data: string;
  cliente: { nome: string; codice_fiscale?: string | null; };
  immobile: {
    indirizzo: string;
    comune?: string | null;
    foglio?: string | null;
    particella?: string | null;
    subalterno?: string | null;
    categoria?: string | null;
    zona_climatica?: string | null;
  };
  vani: SchedaVano[];
  tempiConsegnaGg?: number;
  garanziaAnni?: number;
  detrazione?: string | null;
}

export async function pdfSchedaTecnica(doc: jsPDF, azienda: AziendaInfo, d: SchedaTecnicaDati): Promise<void> {
  const pageRef = { n: 1 };
  const reheader = (doc2: jsPDF) => pdfHeader(doc2, {
    azienda,
    titolo: 'Scheda tecnica commessa',
    numero: d.numero,
    data: fmtData(d.data),
    cliente: d.cliente.nome,
    etichettaChip: 'Scheda tecnica',
  });

  // ───── PAGINA 1: RIEPILOGO ─────
  let y = reheader(doc);

  // Box cliente + immobile
  const boxW = (PDF_PAGE.w - 30 - 5) / 2;
  pdfInfoBox(doc, 15, y, boxW, 30, 'Cliente', [
    d.cliente.nome,
    d.cliente.codice_fiscale ? `C.F. ${d.cliente.codice_fiscale}` : '',
  ].filter(Boolean));

  const immRighe = [
    d.immobile.indirizzo,
    d.immobile.comune || '',
    [d.immobile.foglio ? `F. ${d.immobile.foglio}` : '',
     d.immobile.particella ? `Part. ${d.immobile.particella}` : '',
     d.immobile.subalterno ? `Sub. ${d.immobile.subalterno}` : ''].filter(Boolean).join(' · '),
    d.immobile.categoria ? `Cat. ${d.immobile.categoria}` : '',
    d.immobile.zona_climatica ? `Zona climatica: ${d.immobile.zona_climatica}` : '',
  ].filter(Boolean);
  pdfInfoBox(doc, 15 + boxW + 5, y, boxW, 30, 'Immobile', immRighe);
  y += 36;

  // Sommario vani
  y = pdfSectionTitle(doc, 'Sommario commessa', y);
  y = sommarioVani(doc, y, d.vani);
  y += 4;

  // Medie prestazionali commessa
  y = pdfSectionTitle(doc, 'Prestazioni medie di commessa', y);
  y = kpiGriglia(doc, y, calcolaKPI(d.vani));
  y += 4;

  // CAM compliance
  y = pdfSectionTitle(doc, 'Conformità CAM (DM 23/06/2022)', y);
  y = camBlocco(doc, y, d.vani);

  pdfFooter(doc, azienda, pageRef.n, d.vani.length + 1);

  // ───── PAGINE 2..N: UNA PER VANO ─────
  for (const vano of d.vani) {
    doc.addPage();
    pageRef.n++;
    y = reheader(doc);

    // Etichetta vano
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_T.teal);
    doc.text(`${vano.nome || 'Vano'} · ${vano.tipo || '—'}`, 15, y);
    y += 8;

    const luogoPezzi = [
      vano.stanza,
      vano.piano ? `Piano ${vano.piano}` : '',
      vano.pezzi ? `${vano.pezzi} pezzi` : '',
    ].filter(Boolean).join(' · ');
    if (luogoPezzi) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_T.textSub);
      doc.text(luogoPezzi, 15, y);
      y += 6;
    }

    // Disegno SVG embed (come PNG)
    try {
      const svg = buildSVGVano(vano, { showQuote: true });
      const png = await svgToPngDataUrl(svg, 1200);
      const imgW = 100;
      const imgH = 70;
      doc.setDrawColor(PDF_T.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, y, imgW, imgH, 2, 2);
      doc.addImage(png, 'PNG', 16, y + 1, imgW - 2, imgH - 2, undefined, 'FAST');

      // Box specifiche a destra del disegno
      const bx = 15 + imgW + 5;
      const bw = PDF_PAGE.w - 15 - bx;
      specificheBox(doc, bx, y, bw, imgH, vano);

      y += imgH + 6;
    } catch (e) {
      // se SVG fallisce, stampa fallback testo
      doc.setFontSize(9);
      doc.setTextColor(PDF_T.danger);
      doc.text('Disegno non generabile: ' + (e as any).message, 15, y);
      y += 6;
    }

    // Sezione prestazioni energetiche + acustiche
    y = pdfSectionTitle(doc, 'Prestazioni', y);
    y = prestazioniTabella(doc, y, vano);

    // Composizione stratigrafica
    y = pdfSectionTitle(doc, 'Composizione', y);
    y = composizioneBlocco(doc, y, vano);

    // CE + certificazioni
    if (vano.norma_ce || (vano.certificazioni && vano.certificazioni.length)) {
      y = pdfSectionTitle(doc, 'Marcatura CE e certificazioni', y);
      y = ceBlocco(doc, y, vano);
    }

    pdfFooter(doc, azienda, pageRef.n, d.vani.length + 1);
  }
}

// ───── Sub-helpers ─────

function sommarioVani(doc: jsPDF, y: number, vani: SchedaVano[]): number {
  const cols = [
    { w: 18, label: 'Vano', align: 'left' as const },
    { w: 22, label: 'Tipo', align: 'center' as const },
    { w: 28, label: 'Dimensioni', align: 'center' as const },
    { w: 12, label: 'Pz', align: 'center' as const },
    { w: 40, label: 'Sistema', align: 'left' as const },
    { w: 18, label: 'Uw', align: 'right' as const },
    { w: 42, label: 'Stanza', align: 'left' as const },
  ];
  return tabellaGenerica(doc, 15, y, cols, vani.map(v => {
    const m = v.misure_json || {};
    const dim = m.L && m.H ? `${m.L}×${m.H}` : '—';
    return [
      v.nome || '—',
      v.tipo || '—',
      dim,
      v.pezzi ?? '—',
      v.sistema || '—',
      v.uw != null ? v.uw.toFixed(2) + ' W/m²K' : '—',
      v.stanza || '—',
    ];
  }));
}

function kpiGriglia(doc: jsPDF, y: number, kpi: { label: string; valore: string; sotto?: string }[]): number {
  const nCols = 4;
  const w = (PDF_PAGE.w - 30 - 5 * (nCols - 1)) / nCols;
  const h = 18;

  for (let i = 0; i < kpi.length; i++) {
    const col = i % nCols;
    const row = Math.floor(i / nCols);
    const x = 15 + col * (w + 5);
    const yy = y + row * (h + 5);

    doc.setFillColor('#FFFFFF');
    doc.setDrawColor(PDF_T.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yy, w, h, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_T.teal);
    doc.text(kpi[i].label.toUpperCase(), x + 3, yy + 5);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_T.text);
    doc.text(kpi[i].valore, x + 3, yy + 12);

    if (kpi[i].sotto) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_T.textSub);
      doc.text(kpi[i].sotto, x + 3, yy + 16);
    }
  }
  return y + Math.ceil(kpi.length / nCols) * (h + 5);
}

function calcolaKPI(vani: SchedaVano[]): { label: string; valore: string; sotto?: string }[] {
  const uws = vani.map(v => v.uw).filter((n): n is number => typeof n === 'number' && !isNaN(n));
  const uwMed = uws.length ? uws.reduce((s, n) => s + n, 0) / uws.length : null;
  const rws = vani.map(v => v.rw).filter((n): n is number => typeof n === 'number' && !isNaN(n));
  const rwMed = rws.length ? rws.reduce((s, n) => s + n, 0) / rws.length : null;
  const pezzi = vani.reduce((s, v) => s + (v.pezzi || 0), 0);
  const camOk = vani.filter(v => v.cam_compliant).length;
  const perc = vani.map(v => v.perc_riciclato).filter((n): n is number => typeof n === 'number');
  const percMed = perc.length ? perc.reduce((s, n) => s + n, 0) / perc.length : null;

  return [
    { label: 'Uw medio', valore: uwMed != null ? uwMed.toFixed(2) : '—', sotto: 'W/m²K' },
    { label: 'Rw medio', valore: rwMed != null ? rwMed.toFixed(0) : '—', sotto: 'dB' },
    { label: 'Pezzi totali', valore: String(pezzi), sotto: `${vani.length} vani` },
    { label: 'CAM conformi', valore: `${camOk}/${vani.length}`, sotto: percMed != null ? `Riciclato ${percMed.toFixed(0)}%` : '' },
  ];
}

function camBlocco(doc: jsPDF, y: number, vani: SchedaVano[]): number {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_T.text);

  const tuttiCAM = vani.every(v => v.cam_compliant);
  const tuttiUNI = vani.every(v => v.uni11673_1);

  const labelStatus = (ok: boolean) => ok ? '✓ conforme' : '⚠ verificare';
  const colorStatus = (ok: boolean) => ok ? PDF_T.ok : PDF_T.warn;

  const riga = (label: string, ok: boolean, dettaglio: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_T.text);
    doc.text(label, 18, y);
    doc.setTextColor(colorStatus(ok));
    doc.text(labelStatus(ok), 110, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_T.textSub);
    const lines = doc.splitTextToSize(dettaglio, PDF_PAGE.w - 30);
    doc.text(lines, 18, y + 4);
    return y + 4 + lines.length * 3.8 + 2;
  };

  y = riga('CAM Criteri Ambientali Minimi', tuttiCAM, 'PVC ≥ 20% materiale riciclato · Alluminio ≥ 40% · Legno FSC/PEFC');
  y = riga('UNI 11673-1 (posa in opera)', tuttiUNI, 'Posa qualificata secondo norma UNI 11673-1 con sigillature tripla barriera.');
  return y;
}

function specificheBox(doc: jsPDF, x: number, y: number, w: number, h: number, v: SchedaVano): void {
  doc.setFillColor('#FFFFFF');
  doc.setDrawColor(PDF_T.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_T.teal);
  doc.text('SPECIFICHE', x + 3, y + 5);

  const m = v.misure_json || {};
  const specs: [string, string][] = [
    ['Larghezza', m.L ? `${m.L} mm` : '—'],
    ['Altezza', m.H ? `${m.H} mm` : '—'],
    ['Sistema', v.sistema || '—'],
    ['Sottosistema', v.sottosistema || '—'],
    ['Vetro', v.vetro || '—'],
    ['Colore int.', v.colore_int || '—'],
    ['Colore est.', v.colore_est || '—'],
    ['Pezzi', v.pezzi ? String(v.pezzi) : '—'],
  ];

  doc.setFontSize(8);
  let yy = y + 10;
  for (const [k, val] of specs) {
    if (yy - y > h - 2) break;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_T.textSub);
    doc.text(k, x + 3, yy);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_T.text);
    doc.text(val, x + w - 3, yy, { align: 'right' });
    yy += 5;
  }
}

function prestazioniTabella(doc: jsPDF, y: number, v: SchedaVano): number {
  const cols = [
    { w: 46, label: 'Parametro', align: 'left' as const },
    { w: 50, label: 'Valore', align: 'left' as const },
    { w: 84, label: 'Note', align: 'left' as const },
  ];
  const righe: (string | number)[][] = [
    ['Uw (trasmittanza serramento)', v.uw != null ? `${v.uw.toFixed(2)} W/m²K` : '—', 'UNI EN ISO 10077-1'],
    ['Uf (profilo)', v.uf != null ? `${v.uf.toFixed(2)} W/m²K` : '—', ''],
    ['Ug (vetro)', v.ug != null ? `${v.ug.toFixed(1)} W/m²K` : '—', ''],
    ['Rw (abbattimento acustico)', v.rw != null ? `${v.rw} dB` : '—', 'UNI EN ISO 10140'],
    ['g_tot (trasmittanza solare)', v.g_tot != null ? v.g_tot.toFixed(2) : '—', ''],
    ['Permeabilità aria', v.classe_aria || '—', 'UNI EN 12207'],
    ['Tenuta acqua', v.classe_acqua || '—', 'UNI EN 12208'],
    ['Resistenza vento', v.classe_vento || '—', 'UNI EN 12210'],
    ['Antieffrazione', v.classe_antieffrazione || '—', 'UNI EN 1627'],
  ];
  return tabellaGenerica(doc, 15, y, cols, righe);
}

function composizioneBlocco(doc: jsPDF, y: number, v: SchedaVano): number {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_T.text);

  const accLista = estraiAccessori(v.accessori);
  const righe = [
    `Sistema: ${v.sistema || '—'}${v.sottosistema ? ' / ' + v.sottosistema : ''}`,
    `Vetro: ${v.vetro || '—'}`,
    `Colore: ${v.colore_int || '—'}${v.bicolore && v.colore_est ? ' (int.) · ' + v.colore_est + ' (est.)' : ''}`,
    accLista.length ? `Accessori: ${accLista.join(' · ')}` : '',
    v.flag_condensa ? '⚠ attenzione rischio condensa rilevato' : '',
    v.flag_critico ? '⚠ elemento critico da monitorare' : '',
  ].filter(Boolean);

  for (const r of righe) {
    const lines = doc.splitTextToSize(r, PDF_PAGE.w - 30);
    doc.text(lines, 15, y);
    y += lines.length * 4;
  }
  return y + 2;
}

function ceBlocco(doc: jsPDF, y: number, v: SchedaVano): number {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_T.text);

  if (v.norma_ce) {
    doc.text(`Norma CE: ${v.norma_ce}`, 15, y);
    y += 4.5;
  }
  if (v.certificazioni && v.certificazioni.length) {
    doc.text(`Certificazioni: ${v.certificazioni.join(', ')}`, 15, y);
    y += 4.5;
  }
  if (v.perc_riciclato != null) {
    doc.text(`% materiale riciclato: ${v.perc_riciclato.toFixed(0)}%`, 15, y);
    y += 4.5;
  }
  return y + 2;
}

function estraiAccessori(acc: any): string[] {
  if (!acc) return [];
  if (Array.isArray(acc)) return acc.map(a => typeof a === 'string' ? a : (a.nome || a.descrizione || '')).filter(Boolean);
  if (typeof acc === 'object') return Object.entries(acc).filter(([_, v]) => v).map(([k]) => k);
  return [];
}

function tabellaGenerica(doc: jsPDF, x: number, y: number, cols: { w: number; label: string; align: 'left' | 'right' | 'center' }[], righe: (string | number)[][]): number {
  const rowH = 6;
  const headH = 6;
  const totW = cols.reduce((s, c) => s + c.w, 0);

  doc.setFillColor(PDF_T.dark);
  doc.rect(x, y, totW, headH, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  let cx = x;
  for (const c of cols) {
    const tx = c.align === 'left' ? cx + 2 : c.align === 'right' ? cx + c.w - 2 : cx + c.w / 2;
    doc.text(c.label, tx, y + 4, { align: c.align });
    cx += c.w;
  }
  y += headH;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_T.text);
  for (let i = 0; i < righe.length; i++) {
    if (i % 2 === 1) {
      doc.setFillColor(PDF_T.tealSoft);
      doc.rect(x, y, totW, rowH, 'F');
    }
    cx = x;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      const tx = col.align === 'left' ? cx + 2 : col.align === 'right' ? cx + col.w - 2 : cx + col.w / 2;
      doc.text(String(righe[i][c] ?? ''), tx, y + 4, { align: col.align });
      cx += col.w;
    }
    y += rowH;
  }

  doc.setDrawColor(PDF_T.border);
  doc.setLineWidth(0.2);
  doc.rect(x, y - (righe.length + 1) * rowH, totW, (righe.length + 1) * rowH);
  return y + 3;
}
