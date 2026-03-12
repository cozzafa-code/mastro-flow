// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/pdf-preventivo.ts
// Genera PDF preventivo professionale con jsPDF
// Firma cliente embedded, totali IVA, logo azienda
// ═══════════════════════════════════════════════════════════
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Colori brand MASTRO ──
const C = {
  dark:   [26,  26,  28],   // #1A1A1C
  amber:  [208, 128,  8],   // #D08008
  green:  [26,  158, 115],  // #1A9E73
  sub:    [134, 134, 139],  // #86868b
  line:   [229, 229, 234],  // #e5e5ea
  bg:     [242, 241, 236],  // #F2F1EC
  white:  [255, 255, 255],
  red:    [220,  68,  68],  // #DC4444
};

function fmt(n: number) {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function drawHeader(doc: jsPDF, az: any, c: any) {
  const W = doc.internal.pageSize.width;

  // Sfondo topbar
  doc.setFillColor(...C.dark as [number,number,number]);
  doc.rect(0, 0, W, 28, "F");

  // Logo M
  doc.setFillColor(...C.amber as [number,number,number]);
  doc.roundedRect(10, 5, 18, 18, 3, 3, "F");
  doc.setTextColor(...C.dark as [number,number,number]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("M", 19, 17.5, { align: "center" });

  // Nome azienda
  doc.setTextColor(...C.white as [number,number,number]);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(az.nome || "MASTRO ERP", 34, 12);

  // Sottotitolo azienda
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  const subLine = [az.indirizzo, az.piva ? `P.IVA ${az.piva}` : ""].filter(Boolean).join(" · ");
  if (subLine) doc.text(subLine, 34, 19);

  // Label PREVENTIVO (destra)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.amber as [number,number,number]);
  doc.text("PREVENTIVO", W - 12, 17, { align: "right" });

  // Reset
  doc.setTextColor(...C.dark as [number,number,number]);
}

function drawInfo(doc: jsPDF, az: any, c: any, startY: number): number {
  const W = doc.internal.pageSize.width;
  const col1 = 12, col2 = W / 2 + 4;

  // Box cliente
  doc.setFillColor(...C.bg as [number,number,number]);
  doc.roundedRect(col1 - 2, startY, W / 2 - 6, 42, 3, 3, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text("CLIENTE", col1, startY + 6);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark as [number,number,number]);
  doc.text(`${c.cliente || ""}${c.cognome ? " " + c.cognome : ""}`, col1, startY + 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.sub as [number,number,number]);
  let cy = startY + 21;
  if (c.indirizzo) { doc.text(c.indirizzo, col1, cy); cy += 6; }
  if (c.telefono)  { doc.text(`Tel: ${c.telefono}`, col1, cy); cy += 6; }
  if (c.email)     { doc.text(c.email, col1, cy); }

  // Box preventivo info
  doc.setFillColor(...C.bg as [number,number,number]);
  doc.roundedRect(col2 - 2, startY, W / 2 - 10, 42, 3, 3, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text("PREVENTIVO", col2, startY + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.dark as [number,number,number]);
  const infoRows = [
    ["N°", c.code || "—"],
    ["Data", new Date().toLocaleDateString("it-IT")],
    ["Validità", "30 giorni"],
    ["Pagamento", c.condPagamento || "Da concordare"],
  ];
  infoRows.forEach(([k, v], i) => {
    doc.setFont("helvetica", "bold");
    doc.text(k, col2, startY + 14 + i * 7);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), col2 + 28, startY + 14 + i * 7);
  });

  return startY + 50;
}

export function generaPreventivoPDF(c: any, ctx: any) {
  const { sistemiDB, vetriDB, coprifiliDB, lamiereDB, aziendaInfo, getVaniAttivi } = ctx;
  const az = aziendaInfo || {};

  // ── Calcola prezzi vani ──
  const calcolaVano = (v: any) => {
    const m = v.misure || {};
    const lc = (m.lCentro || 0) / 1000, hc = (m.hCentro || 0) / 1000;
    const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
    const mq = lc * hc, perim = 2 * (lc + hc);

    // Settori non-serramenti: prezzo manuale
    const settoriManuali = ["porte","boxdoccia","cancelli","zanzariere","tendesole"];
    if (settoriManuali.includes(v.settore)) {
      return { tot: v.prezzoManuale || 0, mq, sistema: null };
    }

    const sysRec = sistemiDB?.find((s: any) =>
      (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema
    );

    const gridPrice = sysRec?.griglia?.length > 0
      ? (sysRec.griglia.find((p: any) => p.l >= lmm && p.h >= hmm)?.prezzo
        ?? sysRec.griglia[sysRec.griglia.length - 1]?.prezzo ?? null)
      : null;

    let tot = gridPrice !== null
      ? gridPrice
      : mq * parseFloat(sysRec?.prezzoMq || sysRec?.euroMq || c.prezzoMq || 350);

    // Extra
    const vetroRec = vetriDB?.find((g: any) => g.code === v.vetro || g.nome === v.vetro);
    if (vetroRec?.prezzoMq) tot += mq * parseFloat(vetroRec.prezzoMq);
    const copRec = coprifiliDB?.find((cp: any) => cp.cod === v.coprifilo);
    if (copRec?.prezzoMl) tot += perim * parseFloat(copRec.prezzoMl);
    const lamRec = lamiereDB?.find((l: any) => l.cod === v.lamiera);
    if (lamRec?.prezzoMl) tot += lc * parseFloat(lamRec.prezzoMl);

    if (v.vociLibere?.length > 0) {
      v.vociLibere.forEach((vl: any) => { tot += (vl.prezzo || 0) * (vl.qta || 1); });
    }

    // Accessori da catalogo (maniglie, cerniere, cremonesi, ecc.)
    if (v.accessoriCatalogo?.length > 0) {
      v.accessoriCatalogo.forEach((a: any) => {
        tot += (parseFloat(a.prezzoUnitario) || 0) * (a.quantita || 1);
      });
    }

    // Accessori
    const acc = v.accessori || {};
    const tapp = acc.tapparella; if (tapp?.attivo && c?.prezzoTapparella) { const tmq = ((tapp.l || lmm) / 1000) * ((tapp.h || hmm) / 1000); tot += tmq * parseFloat(c.prezzoTapparella); }
    const pers = acc.persiana;   if (pers?.attivo && c?.prezzoPersiana)   { const pmq = ((pers.l || lmm) / 1000) * ((pers.h || hmm) / 1000); tot += pmq * parseFloat(c.prezzoPersiana); }
    const zanz = acc.zanzariera; if (zanz?.attivo && c?.prezzoZanzariera) { const zmq = ((zanz.l || lmm) / 1000) * ((zanz.h || hmm) / 1000); tot += zmq * parseFloat(c.prezzoZanzariera); }

    return { tot: Math.round(tot * 100) / 100, mq, sistema: sysRec?.sistema || v.sistema || null, acc };
  };

  const vani = getVaniAttivi(c);
  const vaniCalc = vani.map((v: any) => ({ ...v, _calc: calcolaVano(v) }));
  const totImponibile0 = vaniCalc.reduce((s: number, v: any) => s + v._calc.tot * (v.pezzi || 1), 0);
  const vociLib = (c.vociLibere || []).reduce((s: number, vl: any) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);
  const totBase = totImponibile0 + vociLib;
  const sconto = totBase * parseFloat(c.sconto || 0) / 100;
  const imponibile = totBase - sconto;
  const iva = imponibile * 0.10;
  const totIva = imponibile + iva;
  const acconto = parseFloat(c.accontoRicevuto || 0);
  const saldo = totIva - acconto;

  // ── Crea documento ──
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.width;

  drawHeader(doc, az, c);
  let y = drawInfo(doc, az, c, 34);

  // ── Titolo sezione voci ──
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text("DETTAGLIO VOCI", 12, y);
  y += 4;

  // ── Tabella voci ──
  const rows: any[] = [];
  vaniCalc.forEach((v: any, i: number) => {
    const m = v.misure || {};
    const desc = [
      v.nome || `Vano ${i + 1}`,
      v._calc.sistema ? `Sistema: ${v._calc.sistema}` : "",
      m.lCentro && m.hCentro ? `${m.lCentro}×${m.hCentro}mm` : "",
      v.tipo || "",
    ].filter(Boolean).join(" · ");

    rows.push([
      String(i + 1),
      desc,
      String(v.pezzi || 1),
      `€ ${fmt(v._calc.tot)}`,
      `€ ${fmt(v._calc.tot * (v.pezzi || 1))}`,
    ]);

    // Righe accessori vano (tapparella/persiana/zanzariera)
    const acc = v._calc.acc || {};
    const accLabels: any = { tapparella: "Tapparella", persiana: "Persiana", zanzariera: "Zanzariera" };
    Object.entries(accLabels).forEach(([key, label]) => {
      const a: any = acc[key] || v.accessori?.[key];
      if (!a?.attivo) return;
      const aDesc = [String(label), a.colore ? `Colore: ${a.colore}` : "", a.l && a.h ? `${a.l}×${a.h}mm` : ""].filter(Boolean).join(" · ");
      rows.push(["", `  ↳ ${aDesc}`, String(v.pezzi || 1), "incluso", ""]);
    });

    // Righe accessori da catalogo (maniglie, cerniere, cremonesi, ecc.)
    (v.accessoriCatalogo || []).forEach((a: any) => {
      if (!a?.nome) return;
      const aDesc = [
        a.nome,
        a.codice ? `(${a.codice})` : "",
        a.colore ? `Colore: ${a.colore}` : "",
        a.nota ? a.nota : "",
      ].filter(Boolean).join(" · ");
      const qta = (a.quantita || 1) * (v.pezzi || 1);
      const pu = parseFloat(a.prezzoUnitario) || 0;
      const tot = pu * qta;
      rows.push([
        "",
        `  ↳ ${aDesc}`,
        String(a.quantita || 1),
        pu > 0 ? `€ ${fmt(pu)}` : "incluso",
        pu > 0 ? `€ ${fmt(tot)}` : "",
      ]);
    });

    // Voci libere vano
    (v.vociLibere || []).forEach((vl: any) => {
      rows.push(["", `  ↳ ${vl.desc || vl.descrizione || "Voce aggiuntiva"}`, String(vl.qta || 1), `€ ${fmt(vl.prezzo || 0)}`, `€ ${fmt((vl.prezzo || 0) * (vl.qta || 1))}`]);
    });
  });

  // Voci libere commessa
  (c.vociLibere || []).forEach((vl: any) => {
    rows.push([
      "—",
      vl.desc || vl.descrizione || "Voce aggiuntiva",
      String(vl.qta || 1),
      `€ ${fmt(vl.importo || 0)}`,
      `€ ${fmt((vl.importo || 0) * (vl.qta || 1))}`,
    ]);
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Descrizione", "Q.tà", "Prezzo unit.", "Totale"]],
    body: rows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3, textColor: C.dark },
    headStyles: {
      fillColor: C.dark as [number,number,number],
      textColor: C.white as [number,number,number],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [248, 248, 250] },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Totali ──
  const totW = 90;
  const totX = W - totW - 12;

  const totRows: [string, string, boolean][] = [];
  if (sconto > 0) totRows.push([`Sconto ${c.sconto}%`, `− € ${fmt(sconto)}`, false]);
  totRows.push(["Imponibile", `€ ${fmt(imponibile)}`, false]);
  totRows.push(["IVA 10%", `€ ${fmt(iva)}`, false]);
  totRows.push(["TOTALE IVA INCLUSA", `€ ${fmt(totIva)}`, true]);
  if (acconto > 0) {
    totRows.push([`Acconto ricevuto`, `− € ${fmt(acconto)}`, false]);
    totRows.push(["Saldo da pagare", `€ ${fmt(saldo)}`, true]);
  }

  let ty = y;
  totRows.forEach(([label, val, bold]) => {
    if (bold) {
      doc.setFillColor(...C.dark as [number,number,number]);
      doc.rect(totX, ty - 4, totW, 8, "F");
      doc.setTextColor(...C.white as [number,number,number]);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(...C.sub as [number,number,number]);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
    }
    doc.text(label, totX + 3, ty + 0.5);
    doc.text(val, totX + totW - 3, ty + 0.5, { align: "right" });
    ty += 8;
  });

  y = ty + 8;

  // ── Note preventivo ──
  if (c.notePreventivo) {
    doc.setFillColor(...C.bg as [number,number,number]);
    doc.roundedRect(12, y, W - 24, 0, 3, 3, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.text("NOTE", 14, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark as [number,number,number]);
    doc.setFontSize(8.5);
    const noteLines = doc.splitTextToSize(c.notePreventivo, W - 28);
    doc.rect(12, y, W - 24, noteLines.length * 5 + 10, "F");
    doc.text(noteLines, 14, y + 12);
    y += noteLines.length * 5 + 16;
  }

  // ── Firma cliente ──
  if (c.firmaCliente) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFillColor(...C.bg as [number,number,number]);
    doc.roundedRect(12, y, W - 24, 38, 3, 3, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.text("FIRMA CLIENTE", 14, y + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark as [number,number,number]);
    doc.text(`${c.cliente}${c.cognome ? " " + c.cognome : ""} — ${c.dataFirma || new Date().toLocaleDateString("it-IT")}`, 14, y + 13);

    try {
      doc.addImage(c.firmaCliente, "PNG", 14, y + 16, 80, 18);
    } catch {}

    // Linea firma (lato dx)
    doc.setDrawColor(...C.dark as [number,number,number]);
    doc.setLineWidth(0.5);
    doc.line(W - 80, y + 34, W - 14, y + 34);
    doc.setFontSize(7);
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.text("Firma per accettazione", W - 47, y + 37, { align: "center" });

    y += 44;
  }

  // ── Footer ogni pagina ──
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.height;
    doc.setFillColor(...C.bg as [number,number,number]);
    doc.rect(0, pH - 14, W, 14, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.sub as [number,number,number]);
    const footLeft = [az.telefono, az.email].filter(Boolean).join(" · ");
    if (footLeft) doc.text(footLeft, 12, pH - 5);
    doc.text(`Pag. ${i} / ${pageCount}`, W - 12, pH - 5, { align: "right" });
  }

  // ── Download ──
  const filename = `preventivo_${c.code || c.id}_${c.cliente?.replace(/\s/g, "_") || "cliente"}.pdf`;
  doc.save(filename);
}
