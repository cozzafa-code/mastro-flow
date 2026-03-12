// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/pdf-misure.ts
// PDF misure per produzione/fornitore
// Griglia compatta, ogni vano su riga, dati tecnici completi
// ═══════════════════════════════════════════════════════════
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const C = {
  dark:  [26,  26,  28],
  amber: [208, 128,  8],
  green: [26,  158, 115],
  sub:   [134, 134, 139],
  bg:    [242, 241, 236],
  white: [255, 255, 255],
  blue:  [59,  127, 224],
};

const PUNTI_LABEL: Record<string, string> = {
  lCentro: "L Centro", hCentro: "H Centro",
  lMuro:   "L Muro",   hMuro:   "H Muro",
  lLuce:   "L Luce",   hLuce:   "H Luce",
  profondo: "Profondo", spessore: "Spessore",
  ribassato: "Ribassato", soglia: "Soglia",
};

function drawHeaderMisure(doc: jsPDF, az: any, c: any) {
  const W = doc.internal.pageSize.width;

  doc.setFillColor(...C.dark as [number,number,number]);
  doc.rect(0, 0, W, 22, "F");

  doc.setFillColor(...C.blue as [number,number,number]);
  doc.roundedRect(8, 4, 14, 14, 2, 2, "F");
  doc.setTextColor(...C.dark as [number,number,number]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("M", 15, 13.5, { align: "center" });

  doc.setTextColor(...C.white as [number,number,number]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(az.nome || "MASTRO ERP", 26, 10);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  if (az.telefono || az.email) {
    doc.text([az.telefono, az.email].filter(Boolean).join(" · "), 26, 16);
  }

  // Label destra
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.blue as [number,number,number]);
  doc.text("SCHEDA MISURE", W - 10, 14, { align: "right" });

  doc.setTextColor(...C.dark as [number,number,number]);
}

export function generaPDFMisure(c: any, ctx: any) {
  const { aziendaInfo, getVaniAttivi } = ctx;
  const az = aziendaInfo || {};

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.width;

  drawHeaderMisure(doc, az, c);

  // Info commessa
  let y = 28;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.sub as [number,number,number]);

  const infoItems = [
    ["COMMESSA", c.code || "—"],
    ["CLIENTE", `${c.cliente || ""}${c.cognome ? " " + c.cognome : ""}`],
    ["INDIRIZZO", c.indirizzo || "—"],
    ["DATA", new Date().toLocaleDateString("it-IT")],
  ];

  infoItems.forEach(([k, v], i) => {
    const x = 10 + i * (W / 4);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.text(k, x, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark as [number,number,number]);
    doc.setFontSize(9);
    doc.text(String(v), x, y + 5);
    doc.setFontSize(7);
  });

  y += 14;

  // Linea separatore
  doc.setDrawColor(...C.sub as [number,number,number]);
  doc.setLineWidth(0.3);
  doc.line(10, y, W - 10, y);
  y += 4;

  const vani = getVaniAttivi(c);

  if (vani.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.text("Nessun vano attivo in questa commessa.", W / 2, 100, { align: "center" });
    doc.save(`misure_${c.code || c.id}.pdf`);
    return;
  }

  // Colonne dinamiche: cerca tutti i punti misura presenti
  const tuttiPunti = new Set<string>();
  vani.forEach((v: any) => {
    Object.keys(v.misure || {}).forEach(k => {
      if ((v.misure[k] || 0) > 0) tuttiPunti.add(k);
    });
  });

  const puntiCols = Array.from(tuttiPunti);

  const head = [
    [
      "#", "Vano / Nome", "Tipo", "Settore", "Sistema / Modello",
      "Col. Int.", "Col. Est.", "Vetro",
      ...puntiCols.map(p => PUNTI_LABEL[p] || p),
      "Pz", "Tappar.", "Persiana", "Zanzar.", "Controtelaio", "Note",
    ]
  ];

  const rows = vani.map((v: any, i: number) => {
    const m = v.misure || {};
    const settore = v.settore || "serramenti";
    const sistema = v.sistema || v.modello || v.tipoBox || v.tipoCancello || "—";
    const acc = v.accessori || {};
    const tappStr = acc.tapparella?.attivo
      ? [acc.tapparella.tipo || "Si", acc.tapparella.colore, acc.tapparella.l && acc.tapparella.h ? `${acc.tapparella.l}x${acc.tapparella.h}` : ""].filter(Boolean).join(" ")
      : "";
    const persianaStr = acc.persiana?.attivo
      ? [acc.persiana.tipo || "Si", acc.persiana.colore].filter(Boolean).join(" ")
      : "";
    const zanzStr = acc.zanzariera?.attivo
      ? [acc.zanzariera.tipo || "Si", acc.zanzariera.colore].filter(Boolean).join(" ")
      : "";
    const colInt = v.coloreInt || v.colore || "";
    const colEst = v.coloreEst || "";

    return [
      String(i + 1),
      v.nome || `Vano ${i + 1}`,
      v.tipo || "—",
      settore.charAt(0).toUpperCase() + settore.slice(1),
      sistema,
      colInt || "—",
      colEst && colEst !== colInt ? colEst : "=",
      v.vetro || "—",
      ...puntiCols.map(p => m[p] ? `${m[p]}` : "—"),
      String(v.pezzi || 1),
      tappStr || "—",
      persianaStr || "—",
      zanzStr || "—",
      v.controtelaio || "—",
      v.note || "",
    ];
  });

  autoTable(doc, {
    startY: y,
    head,
    body: rows,
    theme: "striped",
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: C.dark,
      font: "helvetica",
    },
    headStyles: {
      fillColor: C.dark as [number,number,number],
      textColor: C.white as [number,number,number],
      fontStyle: "bold",
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 7,  halign: "center" },
      1: { cellWidth: 22 },
      2: { cellWidth: 12 },
      3: { cellWidth: 16 },
      4: { cellWidth: 28 },
      5: { cellWidth: 16 },  // Col Int
      6: { cellWidth: 16 },  // Col Est
      7: { cellWidth: 20 },  // Vetro
    },
    alternateRowStyles: { fillColor: [248, 248, 250] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Riepilogo conteggio
  const totalePezzi = vani.reduce((s: number, v: any) => s + (v.pezzi || 1), 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark as [number,number,number]);
  doc.text(`Totale vani: ${vani.length}  ·  Totale pezzi: ${totalePezzi}`, 10, finalY);

  // Casella firma tecnico
  doc.setFillColor(...C.bg as [number,number,number]);
  doc.roundedRect(W - 80, finalY - 6, 70, 22, 3, 3, "F");
  doc.setFontSize(7);
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text("Verificato da:", W - 78, finalY);
  doc.setDrawColor(...C.sub as [number,number,number]);
  doc.setLineWidth(0.3);
  doc.line(W - 78, finalY + 14, W - 12, finalY + 14);
  doc.text("Firma", W - 45, finalY + 18, { align: "center" });

  // Footer
  const pH = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text(`Generato da MASTRO ERP · ${new Date().toLocaleString("it-IT")}`, 10, pH - 6);
  doc.text(`Commessa ${c.code || c.id}`, W - 10, pH - 6, { align: "right" });

  doc.save(`misure_produzione_${c.code || c.id}_${c.cliente?.replace(/\s/g, "_") || "cliente"}.pdf`);
}
