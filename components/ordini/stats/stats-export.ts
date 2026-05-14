import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ExportPayload {
  azienda?: string;
  annoCorrente: number;
  annoConfronto: number;
  kpiCorrente: {
    spesa_totale: number; n_ordini: number; n_righe: number; n_fornitori: number;
  };
  kpiConfronto: {
    spesa_totale: number; n_ordini: number; n_righe: number; n_fornitori: number;
  } | null;
  deltaPct: number | null;
  topFornitori: Array<{
    fornitore_nome: string; n_ordini: number; spesa_totale: number; delta_pct: number | null;
  }>;
  topArticoli: Array<{
    codice_articolo: string; descrizione: string; fornitore_nome: string;
    qta_totale: number; prezzo_medio_corrente: number; prezzo_medio_confronto: number | null;
  }>;
  statsMese: Array<{ anno: number; mese: number; spesa: number; }>;
}

const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export function exportStatsToPdf(p: ExportPayload): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();

  // ===== Header brand =====
  doc.setFillColor(26, 42, 71); // navy
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(232, 176, 92); // amber
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("FLIWOX  -  MASTRO SUITE", 14, 11);
  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("Statistiche Ordini " + p.annoCorrente, 14, 19);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Confronto vs " + p.annoConfronto, 14, 24);
  // Data export top-right
  const today = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(8);
  doc.text("Export del " + today, W - 14, 24, { align: "right" });

  let y = 38;

  // ===== KPI Big =====
  doc.setTextColor(26, 42, 71);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Spesa totale " + p.annoCorrente, 14, y);
  y += 7;
  doc.setFontSize(22);
  doc.text("EUR " + formatNum(p.kpiCorrente.spesa_totale, 0), 14, y);
  if (p.deltaPct !== null && Math.abs(p.deltaPct) > 0.1) {
    doc.setFontSize(10);
    doc.setTextColor(p.deltaPct > 0 ? 196 : 31, p.deltaPct > 0 ? 69 : 90, p.deltaPct > 0 ? 69 : 63);
    const sign = p.deltaPct > 0 ? "+" : "";
    doc.text(sign + p.deltaPct.toFixed(1) + "% vs " + p.annoConfronto, 75, y);
  }
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(89, 100, 120);
  doc.setFont("helvetica", "normal");
  doc.text(p.kpiCorrente.n_ordini + " ordini  -  " + p.kpiCorrente.n_righe + " righe  -  " + p.kpiCorrente.n_fornitori + " fornitori", 14, y);
  y += 8;

  // ===== Confronto anno =====
  if (p.kpiConfronto) {
    autoTable(doc, {
      startY: y,
      head: [["Periodo", "Spesa totale", "Ordini", "Righe", "Fornitori"]],
      body: [
        [p.annoCorrente.toString(), "EUR " + formatNum(p.kpiCorrente.spesa_totale), p.kpiCorrente.n_ordini, p.kpiCorrente.n_righe, p.kpiCorrente.n_fornitori],
        [p.annoConfronto.toString(), "EUR " + formatNum(p.kpiConfronto.spesa_totale), p.kpiConfronto.n_ordini, p.kpiConfronto.n_righe, p.kpiConfronto.n_fornitori],
      ],
      theme: "striped",
      headStyles: { fillColor: [26, 42, 71], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== Spesa per mese =====
  if (p.statsMese && p.statsMese.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 42, 71);
    doc.text("Spesa per mese", 14, y);
    y += 4;

    const mesiBody: any[] = [];
    for (let m = 1; m <= 12; m++) {
      const corr = p.statsMese.find((x) => x.anno === p.annoCorrente && x.mese === m);
      const conf = p.statsMese.find((x) => x.anno === p.annoConfronto && x.mese === m);
      mesiBody.push([
        MESI[m - 1],
        corr ? "EUR " + formatNum(corr.spesa) : "-",
        conf ? "EUR " + formatNum(conf.spesa) : "-",
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [["Mese", p.annoCorrente + "", p.annoConfronto + ""]],
      body: mesiBody,
      theme: "striped",
      headStyles: { fillColor: [26, 42, 71], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== Top fornitori =====
  if (p.topFornitori && p.topFornitori.length > 0) {
    if (y > 230) { doc.addPage(); y = 14; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 42, 71);
    doc.text("Top fornitori " + p.annoCorrente, 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["#", "Fornitore", "Ordini", "Spesa", "Delta"]],
      body: p.topFornitori.slice(0, 10).map((f, i) => [
        (i + 1).toString(),
        f.fornitore_nome,
        f.n_ordini.toString(),
        "EUR " + formatNum(f.spesa_totale),
        f.delta_pct !== null ? (f.delta_pct > 0 ? "+" : "") + f.delta_pct.toFixed(1) + "%" : "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [26, 42, 71], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
      columnStyles: { 3: { halign: "right" }, 4: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ===== Top articoli =====
  if (p.topArticoli && p.topArticoli.length > 0) {
    if (y > 220) { doc.addPage(); y = 14; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 42, 71);
    doc.text("Top articoli per quantita", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Articolo", "Fornitore", "Qta", "Prezzo " + p.annoCorrente, "Prezzo " + p.annoConfronto, "Delta"]],
      body: p.topArticoli.slice(0, 15).map((a) => {
        const hasConf = a.prezzo_medio_confronto !== null && a.prezzo_medio_confronto > 0;
        const delta = hasConf
          ? ((a.prezzo_medio_corrente - a.prezzo_medio_confronto!) / a.prezzo_medio_confronto!) * 100
          : null;
        return [
          (a.descrizione || a.codice_articolo).substring(0, 38),
          (a.fornitore_nome || "-").substring(0, 22),
          Math.round(a.qta_totale).toString(),
          "EUR " + formatNum(a.prezzo_medio_corrente),
          hasConf ? "EUR " + formatNum(a.prezzo_medio_confronto!) : "-",
          delta !== null ? (delta > 0 ? "+" : "") + delta.toFixed(1) + "%" : "-",
        ];
      }),
      theme: "striped",
      headStyles: { fillColor: [26, 42, 71], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    });
  }

  // ===== Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Generato da MASTRO Suite - fliwoX  -  Pagina " + i + " di " + pageCount, W / 2, 290, { align: "center" });
  }

  const filename = "mastro-statistiche-ordini-" + p.annoCorrente + "-" + Date.now() + ".pdf";
  doc.save(filename);
}

export function exportStatsToExcel(p: ExportPayload): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Riepilogo
  const riepilogo: any[][] = [
    ["STATISTICHE ORDINI MASTRO SUITE"],
    ["Anno corrente", p.annoCorrente],
    ["Anno confronto", p.annoConfronto],
    ["Export del", new Date().toLocaleString("it-IT")],
    [],
    ["", "Anno corrente", "Anno confronto"],
    ["Spesa totale (EUR)", p.kpiCorrente.spesa_totale, p.kpiConfronto?.spesa_totale ?? "-"],
    ["Numero ordini", p.kpiCorrente.n_ordini, p.kpiConfronto?.n_ordini ?? "-"],
    ["Righe totali", p.kpiCorrente.n_righe, p.kpiConfronto?.n_righe ?? "-"],
    ["Fornitori", p.kpiCorrente.n_fornitori, p.kpiConfronto?.n_fornitori ?? "-"],
    [],
    ["Variazione % spesa", p.deltaPct !== null ? p.deltaPct.toFixed(2) + "%" : "-"],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(riepilogo);
  ws1["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Riepilogo");

  // Sheet 2: Mese
  const meseRows: any[][] = [["Mese", p.annoCorrente, p.annoConfronto, "Delta EUR"]];
  for (let m = 1; m <= 12; m++) {
    const corr = p.statsMese.find((x) => x.anno === p.annoCorrente && x.mese === m);
    const conf = p.statsMese.find((x) => x.anno === p.annoConfronto && x.mese === m);
    const corrVal = corr?.spesa ?? 0;
    const confVal = conf?.spesa ?? 0;
    meseRows.push([
      MESI[m - 1],
      corrVal,
      confVal,
      corrVal - confVal,
    ]);
  }
  const ws2 = XLSX.utils.aoa_to_sheet(meseRows);
  ws2["!cols"] = [{ wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Spesa per mese");

  // Sheet 3: Fornitori
  const fornitoriRows: any[][] = [["#", "Fornitore", "N. ordini", "Spesa EUR", "Delta vs anno prec."]];
  p.topFornitori.forEach((f, i) => {
    fornitoriRows.push([
      i + 1,
      f.fornitore_nome,
      f.n_ordini,
      f.spesa_totale,
      f.delta_pct !== null ? f.delta_pct.toFixed(2) + "%" : "-",
    ]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(fornitoriRows);
  ws3["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Top fornitori");

  // Sheet 4: Articoli
  const articoliRows: any[][] = [["Codice", "Descrizione", "Fornitore", "Qta totale", "Prezzo " + p.annoCorrente, "Prezzo " + p.annoConfronto, "Delta %"]];
  p.topArticoli.forEach((a) => {
    const hasConf = a.prezzo_medio_confronto !== null && a.prezzo_medio_confronto > 0;
    const delta = hasConf
      ? ((a.prezzo_medio_corrente - a.prezzo_medio_confronto!) / a.prezzo_medio_confronto!) * 100
      : null;
    articoliRows.push([
      a.codice_articolo,
      a.descrizione || "-",
      a.fornitore_nome || "-",
      Math.round(a.qta_totale),
      a.prezzo_medio_corrente,
      hasConf ? a.prezzo_medio_confronto : "-",
      delta !== null ? delta.toFixed(2) + "%" : "-",
    ]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(articoliRows);
  ws4["!cols"] = [{ wch: 14 }, { wch: 40 }, { wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws4, "Top articoli");

  const filename = "mastro-statistiche-ordini-" + p.annoCorrente + "-" + Date.now() + ".xlsx";
  XLSX.writeFile(wb, filename);
}

function formatNum(v: number, dec = 2): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
