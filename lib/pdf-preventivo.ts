// ===================================================================
// MASTRO ERP - lib/pdf-preventivo.ts
// Genera PDF preventivo professionale con jsPDF
// VERSIONE PULITA - solo ASCII + latin1 per compatibilita jsPDF
// ===================================================================
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Colori brand MASTRO ──
const DARK:  [number,number,number] = [26,  26,  28];
const AMBER: [number,number,number] = [208, 128,  8];
const GREEN: [number,number,number] = [26,  158, 115];
const SUB:   [number,number,number] = [120, 120, 125];
const LINE:  [number,number,number] = [220, 220, 220];
const BG:    [number,number,number] = [245, 244, 240];
const WHITE: [number,number,number] = [255, 255, 255];

// ── Formatta numero italiano ──
function fmt(n: number): string {
  if (isNaN(n) || n === null || n === undefined) return "0,00";
  return n.toFixed(2).replace(".", ",");
}

// ── Pulisce il testo da caratteri non supportati da jsPDF/helvetica ──
function clean(s: any): string {
  if (!s) return "";
  return String(s)
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")   // solo latin1
    .replace(/\s+/g, " ")
    .trim();
}

// ── Header pagina ──
function drawHeader(doc: jsPDF, az: any): void {
  const W = doc.internal.pageSize.width;

  // Barra superiore scura
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 22, "F");

  // Quadrato amber con M
  doc.setFillColor(...AMBER);
  doc.roundedRect(9, 4, 14, 14, 2, 2, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("M", 16, 13.5, { align: "center" });

  // Nome azienda
  doc.setTextColor(...WHITE);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(clean(az.nome) || "MASTRO ERP", 28, 10);

  // Sottotitolo
  const sub = [clean(az.indirizzo), az.piva ? "P.IVA " + clean(az.piva) : ""].filter(Boolean).join("  |  ");
  if (sub) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(190, 190, 190);
    doc.text(sub, 28, 16);
  }

  // Label PREVENTIVO (destra)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...AMBER);
  doc.text("PREVENTIVO", W - 10, 14, { align: "right" });

  doc.setTextColor(...DARK);
}

// ── Sezione cliente + info preventivo ──
function drawClienteInfo(doc: jsPDF, az: any, c: any, y: number): number {
  const W = doc.internal.pageSize.width;
  const colW = (W - 28) / 2;
  const col1 = 12, col2 = 12 + colW + 4;
  const boxH = 38;

  // Box cliente
  doc.setFillColor(...BG);
  doc.roundedRect(col1, y, colW, boxH, 2, 2, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SUB);
  doc.text("CLIENTE", col1 + 4, y + 7);

  const nomeCliente = [clean(c.cliente), clean(c.cognome)].filter(Boolean).join(" ");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(nomeCliente || "—", col1 + 4, y + 15);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SUB);
  let cy = y + 22;
  if (c.indirizzo) { doc.text(clean(c.indirizzo), col1 + 4, cy); cy += 5.5; }
  if (c.telefono)  { doc.text("Tel: " + clean(c.telefono), col1 + 4, cy); cy += 5.5; }
  if (c.email)     { doc.text(clean(c.email), col1 + 4, cy); }

  // Box info preventivo
  doc.setFillColor(...BG);
  doc.roundedRect(col2, y, colW, boxH, 2, 2, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SUB);
  doc.text("PREVENTIVO", col2 + 4, y + 7);

  const rows = [
    ["N.", clean(c.code) || "—"],
    ["Data", new Date().toLocaleDateString("it-IT")],
    ["Validita'", "30 giorni"],
    ["Pagamento", clean(c.condPagamento) || "Da concordare"],
  ];
  doc.setFontSize(8);
  rows.forEach(([k, v], i) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(k, col2 + 4, y + 15 + i * 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SUB);
    doc.text(v, col2 + 30, y + 15 + i * 6);
  });

  doc.setTextColor(...DARK);
  return y + boxH + 8;
}

// ── Linea separatore ──
function drawLine(doc: jsPDF, y: number): void {
  const W = doc.internal.pageSize.width;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(12, y, W - 12, y);
}

// ── Footer su ogni pagina ──
function drawFooter(doc: jsPDF, az: any): void {
  const pageCount = (doc.internal as any).getNumberOfPages();
  const W = doc.internal.pageSize.width;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.height;
    doc.setFillColor(...BG);
    doc.rect(0, pH - 12, W, 12, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SUB);
    const footL = [clean(az.telefono), clean(az.email)].filter(Boolean).join("  |  ");
    if (footL) doc.text(footL, 12, pH - 4);
    doc.text("Pag. " + i + " / " + pageCount, W - 12, pH - 4, { align: "right" });
  }
}

// ===================================================================
// FUNZIONE PRINCIPALE
// ===================================================================
export async function generaPreventivoPDF(c: any, ctx: any): Promise<void> {
  const { sistemiDB, vetriDB, coprifiliDB, lamiereDB, aziendaInfo, getVaniAttivi } = ctx;
  const az = aziendaInfo || {};

  // ── Calcola prezzo singolo vano ──
  const calcolaVano = (v: any): { prezzoBase: number; accessoriCat: number; posa: number; totUnitario: number; totaleVano: number } => {
    const m = v.misure || {};
    const lc = (m.lCentro || 0) / 1000;
    const hc = (m.hCentro || 0) / 1000;
    const lmm = m.lCentro || 0;
    const hmm = m.hCentro || 0;
    const mq = lc * hc;
    const perim = 2 * (lc + hc);
    const pezzi = v.pezzi || 1;

    // Override manuale dal PreventivoConfiguratoreTab
    if (v.prevPrezzoOverride !== undefined && v.prevPrezzoOverride !== null) {
      const base = v.prevPrezzoOverride;
      const accCat = (v.accessoriCatalogo || []).reduce((s: number, a: any) => s + (parseFloat(a.prezzoUnitario) || 0) * (a.quantita || 1), 0);
      const posa = v.prevPosaPrezzo || 0;
      return { prezzoBase: base, accessoriCat: accCat, posa, totUnitario: base + accCat / pezzi, totaleVano: base * pezzi + accCat + posa };
    }

    // Settori a prezzo manuale
    if (["porte","boxdoccia","cancelli","zanzariere","tendesole"].includes(v.settore)) {
      const base = v.prezzoManuale || 0;
      return { prezzoBase: base, accessoriCat: 0, posa: 0, totUnitario: base, totaleVano: base * pezzi };
    }

    // Calcolo automatico da sistema
    const sysRec = sistemiDB?.find((s: any) =>
      (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema
    );
    const gridPrice = sysRec?.griglia?.length > 0
      ? (sysRec.griglia.find((p: any) => p.l >= lmm && p.h >= hmm)?.prezzo ?? sysRec.griglia[sysRec.griglia.length - 1]?.prezzo ?? null)
      : null;

    let infisso = gridPrice !== null
      ? gridPrice
      : mq * parseFloat(sysRec?.prezzoMq || sysRec?.euroMq || c.prezzoMq || 350);

    const vetroRec = vetriDB?.find((g: any) => g.code === v.vetro || g.nome === v.vetro);
    if (vetroRec?.prezzoMq) infisso += mq * parseFloat(vetroRec.prezzoMq);
    const copRec = coprifiliDB?.find((cp: any) => cp.cod === v.coprifilo);
    if (copRec?.prezzoMl) infisso += perim * parseFloat(copRec.prezzoMl);
    const lamRec = lamiereDB?.find((l: any) => l.cod === v.lamiera);
    if (lamRec?.prezzoMl) infisso += lc * parseFloat(lamRec.prezzoMl);

    const scontoGlob = parseFloat(az.scontoGlobale || 0);
    if (scontoGlob !== 0) infisso = infisso * (1 + scontoGlob / 100);

    // Accessori da catalogo
    const accCat = (v.accessoriCatalogo || []).reduce((s: number, a: any) => s + (parseFloat(a.prezzoUnitario) || 0) * (a.quantita || 1), 0);

    // Posa
    const posa = v.prevPosaPrezzo || (parseFloat(az.prezzoPosaVano || 0) > 0 && az.includePosaInPreventivo ? parseFloat(az.prezzoPosaVano) : 0);

    // Accessori fisici (tapparella, zanzariera, ecc.)
    const acc = v.accessori || {};
    let accFisici = 0;
    const pTapp = parseFloat(az.prezzoTapparella || c.prezzoTapparella || 0);
    if (acc.tapparella?.attivo && pTapp > 0) {
      accFisici += Math.round(((acc.tapparella.l || lmm) / 1000) * ((acc.tapparella.h || hmm) / 1000) * pTapp * 100) / 100;
    }
    const pZanz = parseFloat(az.prezzoZanzariera || c.prezzoZanzariera || 0);
    if (acc.zanzariera?.attivo && pZanz > 0) {
      accFisici += Math.round(((acc.zanzariera.l || lmm) / 1000) * ((acc.zanzariera.h || hmm) / 1000) * pZanz * 100) / 100;
    }

    infisso = Math.round(infisso * 100) / 100;
    return {
      prezzoBase: infisso,
      accessoriCat: accCat,
      posa,
      totUnitario: infisso + accFisici,
      totaleVano: (infisso + accFisici) * pezzi + accCat + posa,
    };
  };

  // ── Ottieni e calcola vani ──
  const vani = getVaniAttivi ? getVaniAttivi(c) : (c.vani || []).filter((v: any) => !v.eliminato);
  const vaniCalc = vani.map((v: any) => ({ ...v, _calc: calcolaVano(v) }));

  // ── Totali commessa ──
  const totVani = vaniCalc.reduce((s: number, v: any) => s + v._calc.totaleVano, 0);
  const vociLib = (c.vociLibere || []).reduce((s: number, vl: any) => s + (vl.importo || 0) * (vl.qta || 1), 0);
  const totBase = totVani + vociLib;
  const scontoPerc = parseFloat(c.sconto || c.scontoPerc || 0);
  const scontoVal = totBase * scontoPerc / 100;
  const imponibile = totBase - scontoVal;
  const ivaPerc = parseFloat(c.iva || c.aliquotaIva || c.ivaPerc || 10);
  const ivaVal = imponibile * ivaPerc / 100;
  const totIva = imponibile + ivaVal;
  const acconto = parseFloat(c.accontoRicevuto || 0);
  const saldo = totIva - acconto;

  // ── Crea documento ──
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.width;

  drawHeader(doc, az);
  let y = drawClienteInfo(doc, az, c, 28);

  // ── Titolo tabella voci ──
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SUB);
  doc.text("DETTAGLIO VOCI", 12, y);
  y += 3;

  // ── Costruisce righe tabella ──
  const rows: any[] = [];

  vaniCalc.forEach((v: any, idx: number) => {
    const m = v.misure || {};
    const pezzi = v.pezzi || 1;
    const acc = v.accessori || {};
    const calc = v._calc;

    // ── Riga 1: nome vano + misure + sistema ──
    const misure = m.lCentro && m.hCentro ? m.lCentro + "x" + m.hCentro + "mm" : "";
    const sistema = clean(v.sistema) || clean(v._calc?.sistema) || "";
    const colore = v.bicolore
      ? [clean(v.coloreInt), "int. /", clean(v.coloreEst), "est."].filter(Boolean).join(" ")
      : clean(v.coloreInt || v.colore || "");
    const vetro = clean(v.vetro || "");

    // Descrizione principale del vano
    const descParts: string[] = [];
    if (sistema)  descParts.push(sistema);
    if (misure)   descParts.push(misure);
    if (vetro)    descParts.push(vetro);
    if (colore)   descParts.push(colore);
    const descLine1 = descParts.join("  |  ");

    // Dettagli tecnici riga 2
    const tecnici: string[] = [];
    if (v.stanza) tecnici.push(clean(v.stanza) + (v.piano ? " " + clean(v.piano) : ""));
    if (v.controtelaio && v.controtelaio !== "Nessuno") tecnici.push("CT " + clean(v.controtelaio));
    if (v.coprifilo) tecnici.push("Coprifilo " + clean(v.coprifilo));
    if (v.lamiera) tecnici.push("Lamiera " + clean(v.lamiera));
    if (m.davProf) tecnici.push("Dav. " + m.davProf + "mm");
    if (m.soglia) tecnici.push("Soglia " + m.soglia + "mm");
    if (m.imbotte) tecnici.push("Imbotte " + m.imbotte + "mm");

    const descFull = [
      clean(v.nome || "Vano " + (idx + 1)) + "  [" + clean(v.tipo || "") + "]",
      descLine1,
      tecnici.length > 0 ? tecnici.join("  |  ") : null,
    ].filter(Boolean).join("\n");

    // Riga principale infisso
    rows.push([
      String(idx + 1),
      descFull,
      String(pezzi),
      "EUR " + fmt(calc.prezzoBase),
      "EUR " + fmt(calc.prezzoBase * pezzi),
    ]);

    // ── Sub-righe accessori fisici ──
    if (acc.tapparella?.attivo) {
      const tDesc = ["Tapparella", clean(acc.tapparella.tipo), clean(acc.tapparella.colore),
        acc.tapparella.larghezza && acc.tapparella.altezza ? acc.tapparella.larghezza + "x" + acc.tapparella.altezza + "mm" : ""
      ].filter(Boolean).join(" ");
      const inclusa = acc.tapparella.inclusa;
      rows.push(["", "  > " + tDesc, String(pezzi), inclusa ? "inclusa" : "a preventivo", inclusa ? "" : ""]);
    }
    if (acc.zanzariera?.attivo) {
      const zDesc = ["Zanzariera", clean(acc.zanzariera.tipo), clean(acc.zanzariera.colore),
        acc.zanzariera.larghezza && acc.zanzariera.altezza ? acc.zanzariera.larghezza + "x" + acc.zanzariera.altezza + "mm" : ""
      ].filter(Boolean).join(" ");
      const inclusa = acc.zanzariera.inclusa;
      rows.push(["", "  > " + zDesc, String(pezzi), inclusa ? "inclusa" : "a preventivo", inclusa ? "" : ""]);
    }

    // ── Sub-righe accessori catalogo ──
    (v.accessoriCatalogo || []).forEach((a: any) => {
      if (!a?.nome) return;
      const aDesc = [clean(a.nome), a.codice ? "(" + clean(a.codice) + ")" : ""].filter(Boolean).join(" ");
      const qta = a.quantita || 1;
      const pu = parseFloat(a.prezzoUnitario) || 0;
      rows.push([
        "",
        "  > " + aDesc,
        String(qta),
        pu > 0 ? "EUR " + fmt(pu) : "incluso",
        pu > 0 ? "EUR " + fmt(pu * qta) : "",
      ]);
    });

    // ── Posa ──
    if (calc.posa > 0) {
      rows.push(["", "  > Posa in opera", String(pezzi), "EUR " + fmt(calc.posa), "EUR " + fmt(calc.posa * pezzi)]);
    } else if (v.prevPosa && v.prevPosa !== "Non prevista") {
      rows.push(["", "  > Posa in opera", String(pezzi), "inclusa", ""]);
    }

    // ── Voci libere vano ──
    (v.vociLibere || []).forEach((vl: any) => {
      if (!vl.desc) return;
      const qta = vl.qta || 1;
      const p = vl.prezzo || 0;
      rows.push(["", "  > " + clean(vl.desc), String(qta), "EUR " + fmt(p), "EUR " + fmt(p * qta)]);
    });
  });

  // ── Voci libere commessa ──
  (c.vociLibere || []).forEach((vl: any) => {
    rows.push([
      "-",
      clean(vl.desc || vl.descrizione || "Voce aggiuntiva"),
      String(vl.qta || 1),
      "EUR " + fmt(vl.importo || 0),
      "EUR " + fmt((vl.importo || 0) * (vl.qta || 1)),
    ]);
  });

  // ── Stampa tabella ──
  autoTable(doc, {
    startY: y,
    head: [["#", "Descrizione", "Q.ta'", "Prezzo unit.", "Totale"]],
    body: rows,
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: DARK,
      font: "helvetica",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [249, 249, 252] },
    bodyStyles: { lineColor: LINE, lineWidth: 0.1 },
    didParseCell: (data: any) => {
      // Sub-righe accessori: testo grigio più piccolo
      if (data.section === "body" && data.row.raw[0] === "" && data.column.index === 1) {
        data.cell.styles.fontSize = 7.5;
        data.cell.styles.textColor = SUB;
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Totali ──
  const totW = 85;
  const totX = W - totW - 12;

  drawLine(doc, y);
  y += 5;

  const totRows: Array<[string, string, boolean, boolean]> = [];
  totRows.push(["Totale vani", "EUR " + fmt(totVani), false, false]);
  if (vociLib > 0) totRows.push(["Voci extra", "EUR " + fmt(vociLib), false, false]);
  if (scontoPerc > 0) totRows.push(["Sconto " + scontoPerc + "%", "- EUR " + fmt(scontoVal), false, true]);
  totRows.push(["Imponibile", "EUR " + fmt(imponibile), true, false]);
  totRows.push(["IVA " + ivaPerc + "%", "EUR " + fmt(ivaVal), false, false]);
  totRows.push(["TOTALE IVA INCLUSA", "EUR " + fmt(totIva), false, false]);

  totRows.forEach(([label, val, bold, amber]) => {
    const isGrandTotal = label === "TOTALE IVA INCLUSA";

    if (isGrandTotal) {
      doc.setFillColor(...DARK);
      doc.rect(totX, y - 5, totW, 9, "F");
      doc.setTextColor(...WHITE);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
    } else if (bold) {
      doc.setTextColor(...DARK);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
    } else if (amber) {
      doc.setTextColor(...AMBER);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
    } else {
      doc.setTextColor(...SUB);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
    }

    doc.text(label, totX + 3, y);
    doc.text(val, totX + totW - 3, y, { align: "right" });
    y += isGrandTotal ? 10 : 7;
  });

  // ── Acconto e saldo ──
  if (acconto > 0) {
    y += 2;
    doc.setTextColor(...SUB);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Acconto ricevuto", totX + 3, y);
    doc.text("- EUR " + fmt(acconto), totX + totW - 3, y, { align: "right" });
    y += 7;

    doc.setFillColor(...GREEN);
    doc.rect(totX, y - 5, totW, 9, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("SALDO", totX + 3, y);
    doc.text("EUR " + fmt(saldo), totX + totW - 3, y, { align: "right" });
    y += 12;
  }

  y += 4;

  // ── Note preventivo ──
  if (c.notePreventivo || c.note) {
    const nota = clean(c.notePreventivo || c.note);
    if (nota) {
      if (y > 240) { doc.addPage(); drawHeader(doc, az); y = 32; }
      doc.setFillColor(...BG);
      const noteLines = doc.splitTextToSize(nota, W - 30);
      const noteH = noteLines.length * 5 + 10;
      doc.roundedRect(12, y, W - 24, noteH, 2, 2, "F");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...SUB);
      doc.text("NOTE", 16, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text(noteLines, 16, y + 12);
      y += noteH + 8;
    }
  }

  // ── Firma cliente ──
  if (c.firmaCliente) {
    if (y > 220) { doc.addPage(); drawHeader(doc, az); y = 32; }
    doc.setFillColor(...BG);
    doc.roundedRect(12, y, W - 24, 38, 2, 2, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SUB);
    doc.text("FIRMA PER ACCETTAZIONE", 16, y + 7);
    const nomeCliente = [clean(c.cliente), clean(c.cognome)].filter(Boolean).join(" ");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(nomeCliente + "  -  " + (clean(c.dataFirma) || new Date().toLocaleDateString("it-IT")), 16, y + 14);
    try { doc.addImage(c.firmaCliente, "PNG", 16, y + 17, 70, 17); } catch {}
    // Linea firma destra
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.4);
    doc.line(W - 80, y + 34, W - 14, y + 34);
    doc.setFontSize(7);
    doc.setTextColor(...SUB);
    doc.text("Firma per accettazione", W - 47, y + 38, { align: "center" });
  }

  // ── Footer ──
  drawFooter(doc, az);

  // ── Salva ──
  const nome = clean(c.cliente || "cliente").replace(/\s+/g, "_");
  const filename = "preventivo_" + clean(c.code || String(c.id)) + "_" + nome + ".pdf";
  doc.save(filename);
}
