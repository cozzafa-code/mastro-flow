// ═══════════════════════════════════════════════════════════
// MASTRO ERP - lib/pdf-preventivo.ts
// Genera PDF preventivo professionale con jsPDF
// Firma cliente embedded, totali IVA, logo azienda
// ═══════════════════════════════════════════════════════════
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Renderizza il disegno tecnico del vano su canvas e restituisce dataURL ──
async function renderDisegnoVano(elements: any[], lmm: number, hmm: number): Promise<string | null> {
  if (!elements || elements.length === 0) return null;
  try {
    const SCALE = 2; // antialiasing
    const W = 160, H = 120; // mm → px target
    const canvas = document.createElement("canvas");
    canvas.width = W * SCALE; canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);

    // Bounding box elementi
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach((el: any) => {
      const x = el.x || 0, y = el.y || 0, w = el.w || el.width || 0, h = el.h || el.height || 0;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
    });
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = lmm || 1000; maxY = hmm || 800; }
    const PAD = 10;
    const scaleX = (W - PAD * 2) / Math.max(maxX - minX, 1);
    const scaleY = (H - PAD * 2) / Math.max(maxY - minY, 1);
    const scale = Math.min(scaleX, scaleY);
    const offX = PAD + ((W - PAD * 2) - (maxX - minX) * scale) / 2;
    const offY = PAD + ((H - PAD * 2) - (maxY - minY) * scale) / 2;

    const tx = (x: number) => offX + (x - minX) * scale;
    const ty = (y: number) => offY + (y - minY) * scale;

    ctx.strokeStyle = "#1A1A1C"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
    elements.forEach((el: any) => {
      const x = tx(el.x || 0), y = ty(el.y || 0);
      const w = (el.w || el.width || 40) * scale, h = (el.h || el.height || 40) * scale;
      ctx.beginPath();
      if (el.type === "rect" || el.type === "window" || el.type === "frame") {
        ctx.strokeStyle = "#1A1A1C"; ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        // Diagonali apertura
        if (el.type === "window" || el.openDir) {
          ctx.strokeStyle = "#aaaaaa"; ctx.lineWidth = 0.5;
          ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
        }
      } else if (el.type === "line") {
        ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
        ctx.moveTo(x, y); ctx.lineTo(tx((el.x2 || (el.x || 0) + (el.w || 0))), ty((el.y2 || (el.y || 0) + (el.h || 0))));
        ctx.stroke();
      } else if (el.type === "circle") {
        ctx.arc(x, y, w / 2, 0, Math.PI * 2); ctx.stroke();
      } else if (el.type === "text" && el.text) {
        ctx.fillStyle = "#555"; ctx.font = `${Math.max(7, 8 * scale)}px Arial`;
        ctx.fillText(el.text, x, y);
      } else {
        // Default: rettangolo generico
        ctx.strokeStyle = "#cccccc"; ctx.lineWidth = 0.8;
        ctx.strokeRect(x, y, w, h);
      }
      ctx.beginPath(); // reset path
    });

    // Quota larghezza (sotto)
    if (lmm > 0) {
      ctx.strokeStyle = "#888"; ctx.lineWidth = 0.5;
      const qy = offY + (maxY - minY) * scale + 8;
      ctx.moveTo(offX, qy); ctx.lineTo(offX + (maxX - minX) * scale, qy); ctx.stroke();
      ctx.fillStyle = "#555"; ctx.font = "8px Arial"; ctx.textAlign = "center";
      ctx.fillText(`${lmm} mm`, offX + (maxX - minX) * scale / 2, qy + 9);
    }
    // Quota altezza (destra)
    if (hmm > 0) {
      ctx.strokeStyle = "#888"; ctx.lineWidth = 0.5;
      const qx = offX + (maxX - minX) * scale + 8;
      ctx.moveTo(qx, offY); ctx.lineTo(qx, offY + (maxY - minY) * scale); ctx.stroke();
      ctx.save(); ctx.translate(qx + 9, offY + (maxY - minY) * scale / 2);
      ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.font = "8px Arial"; ctx.fillStyle = "#555";
      ctx.fillText(`${hmm} mm`, 0, 0); ctx.restore();
    }

    return canvas.toDataURL("image/png");
  } catch { return null; }
}

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
  const subLine = [az.indirizzo, az.piva ? `P.IVA ${az.piva}` : ""].filter(Boolean).join(" . ");
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
    ["N°", c.code || "-"],
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

export async function generaPreventivoPDF(c: any, ctx: any) {
  const { sistemiDB, vetriDB, coprifiliDB, lamiereDB, aziendaInfo, getVaniAttivi } = ctx;
  const az = aziendaInfo || {};

  // ── Calcola prezzi vani con dettaglio per accessorio ──
  const calcolaVano = (v: any) => {
    const m = v.misure || {};
    const lc = (m.lCentro || 0) / 1000, hc = (m.hCentro || 0) / 1000;
    const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
    const mq = lc * hc, perim = 2 * (lc + hc);

    // Settori non-serramenti: prezzo manuale
    const settoriManuali = ["porte","boxdoccia","cancelli","zanzariere","tendesole"];
    if (settoriManuali.includes(v.settore)) {
      return { infisso: v.prezzoManuale || 0, tot: v.prezzoManuale || 0, mq, sistema: null, prezzi: {} };
    }

    const sysRec = sistemiDB?.find((s: any) =>
      (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema
    );
    const gridPrice = sysRec?.griglia?.length > 0
      ? (sysRec.griglia.find((p: any) => p.l >= lmm && p.h >= hmm)?.prezzo
        ?? sysRec.griglia[sysRec.griglia.length - 1]?.prezzo ?? null)
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

    // Sconto/maggiorazione globale solo sull'infisso
    const scontoGlob = parseFloat(az.scontoGlobale || 0);
    if (scontoGlob !== 0) infisso = infisso * (1 + scontoGlob / 100);

    let tot = infisso;

    // ── Prezzi accessori separati (legge da azienda, non da commessa) ──
    const acc = v.accessori || {};
    const prezzi: any = {};

    const pTapp = parseFloat(az.prezzoTapparella || c.prezzoTapparella || 0);
    const tapp = acc.tapparella;
    if (tapp?.attivo) {
      const p = pTapp > 0 ? Math.round(((tapp.l || lmm) / 1000) * ((tapp.h || hmm) / 1000) * pTapp * 100) / 100 : 0;
      prezzi.tapparella = p; tot += p;
    }
    const pPers = parseFloat(az.prezzoPersiana || c.prezzoPersiana || 0);
    const pers = acc.persiana;
    if (pers?.attivo) {
      const p = pPers > 0 ? Math.round(((pers.l || lmm) / 1000) * ((pers.h || hmm) / 1000) * pPers * 100) / 100 : 0;
      prezzi.persiana = p; tot += p;
    }
    const pZanz = parseFloat(az.prezzoZanzariera || c.prezzoZanzariera || 0);
    const zanz = acc.zanzariera;
    if (zanz?.attivo) {
      const p = pZanz > 0 ? Math.round(((zanz.l || lmm) / 1000) * ((zanz.h || hmm) / 1000) * pZanz * 100) / 100 : 0;
      prezzi.zanzariera = p; tot += p;
    }
    const pCT = parseFloat(az.prezzoControtelaio || 0);
    if (v.controtelaio && v.controtelaio !== "Nessuno" && pCT > 0) {
      prezzi.controtelaio = pCT; tot += pCT;
    }
    const pPosa = parseFloat(az.prezzoPosaVano || 0);
    if (pPosa > 0 && az.includePosaInPreventivo) {
      prezzi.posa = pPosa; tot += pPosa * (v.pezzi || 1);
    }

    // Accessori catalogo
    (v.accessoriCatalogo || []).forEach((a: any) => {
      tot += (parseFloat(a.prezzoUnitario) || 0) * (a.quantita || 1);
    });
    // Voci libere vano
    (v.vociLibere || []).forEach((vl: any) => { tot += (vl.prezzo || 0) * (vl.qta || 1); });

    return { infisso: Math.round(infisso * 100) / 100, tot: Math.round(tot * 100) / 100, mq, sistema: sysRec?.sistema || v.sistema || null, prezzi, acc };
  };

  const vani = getVaniAttivi(c);
  const vaniCalc = vani.map((v: any) => ({ ...v, _calc: calcolaVano(v) }));
  const totImponibile0 = vaniCalc.reduce((s: number, v: any) => s + v._calc.tot * (v.pezzi || 1), 0);
  const vociLib = (c.vociLibere || []).reduce((s: number, vl: any) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);
  const totBase = totImponibile0 + vociLib;
  const sconto = totBase * parseFloat(c.sconto || 0) / 100;
  const imponibile = totBase - sconto;
  const ivaPerc = parseFloat(c.iva || c.aliquotaIva || 10);
  const iva = imponibile * ivaPerc / 100;
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
    const pezzi = v.pezzi || 1;

    // ── Descrizione completa vano (tutti i campi rilevanti) ──
    const ct = v.controtelaio || {};
    const acc = v._calc.acc || {};
    const colore = v.bicolore
      ? `${v.coloreInt || "-"} int. / ${v.coloreEst || "-"} est.`
      : (v.coloreInt || v.colore || "");

    // Riga 1: nome + tipo + misure + sistema
    const descLine1 = [
      v._calc.sistema || v.sistema || "",
      m.lCentro && m.hCentro ? `${m.lCentro}x${m.hCentro}mm` : "",
      v.vetro || "",
      colore,
    ].filter(Boolean).join(" . ");

    // Riga 2: dettagli tecnici (telaio, coprifilo, controtelaio, stanza)
    const descLine2Parts: string[] = [];
    if (v.stanza) descLine2Parts.push(`📍 ${v.stanza}${v.piano ? " " + v.piano : ""}`);
    if (ct.tipo && ct.tipo !== "Nessuno") {
      const ctStr = ct.tipo === "singolo" ? "CT Singolo" : ct.tipo === "doppio" ? "CT Doppio" : "CT Cassonetto";
      const ctMis = ct.l && ct.h ? ` ${ct.l}x${ct.h}` : "";
      descLine2Parts.push(ctStr + ctMis);
    }
    if (v.telaio) descLine2Parts.push(`Telaio ${v.telaio === "Z" ? "a Z" : "a L"}${v.telaioAlaZ ? " " + v.telaioAlaZ + "mm" : ""}`);
    if (v.rifilato) {
      const rif = [v.rifilSx ? `Sx${v.rifilSx}` : null, v.rifilDx ? `Dx${v.rifilDx}` : null, v.rifilSopra ? `S${v.rifilSopra}` : null, v.rifilSotto ? `I${v.rifilSotto}` : null].filter(Boolean).join("/");
      descLine2Parts.push(`Rifilato${rif ? " " + rif : ""}`);
    }
    if (v.coprifilo) descLine2Parts.push(`Coprifilo ${v.coprifilo}`);
    if (v.lamiera) descLine2Parts.push(`Lamiera ${v.lamiera}`);

    // Riga 3: misure secondarie (se presenti)
    const misure2: string[] = [];
    if (m.lAlto && m.lAlto !== m.lCentro) misure2.push(`lAlto ${m.lAlto}`);
    if (m.lBasso && m.lBasso !== m.lCentro) misure2.push(`lBasso ${m.lBasso}`);
    if (m.hSx && m.hSx !== m.hCentro) misure2.push(`hSx ${m.hSx}`);
    if (m.hDx && m.hDx !== m.hCentro) misure2.push(`hDx ${m.hDx}`);
    if (m.d1 || m.d2) misure2.push(`D1 ${m.d1 || "-"} / D2 ${m.d2 || "-"}`);
    if (m.spSx || m.spDx || m.spSopra) misure2.push(`Sp ${[m.spSx,m.spDx,m.spSopra].filter(Boolean).join("/")} mm`);
    if (m.davProf || m.davSporg) misure2.push(`Dav ${m.davProf || ""}${m.davSporg ? "/"+m.davSporg : ""}`);
    if (m.soglia) misure2.push(`Soglia ${m.soglia}mm`);
    if (m.imbotte) misure2.push(`Imbotte ${m.imbotte}mm`);

    // Componi descrizione finale per autoTable (usa \n per andare a capo)
    const descParts = [
      `${v.nome || "Vano " + (i+1)}  [${v.tipo || ""}]`,
      descLine1,
      descLine2Parts.length > 0 ? descLine2Parts.join("  .  ") : null,
      misure2.length > 0 ? misure2.join("  .  ") + " mm" : null,
    ].filter(Boolean);
    const desc = descParts.join("\n");

    // Riga principale: solo infisso (senza accessori scorpati)
    rows.push([
      String(i + 1),
      desc,
      String(pezzi),
      `EUR ${fmt(v._calc.infisso)}`,
      `EUR ${fmt(v._calc.infisso * pezzi)}`,
    ]);

    // ── Sub-righe accessori con prezzo reale ──

    const prezzi = v._calc.prezzi || {};

    // Tapparella
    const tapp = acc.tapparella;
    if (tapp?.attivo) {
      const tDesc = ["Tapparella", tapp.tipo, tapp.colore, tapp.azionamento, tapp.motorizzata ? "Motorizzata" : null, tapp.l && tapp.h ? `${tapp.l}x${tapp.h}mm` : null].filter(Boolean).join(" ");
      const p = prezzi.tapparella || 0;
      rows.push(["", `  > ${tDesc}`, String(pezzi), p > 0 ? `EUR ${fmt(p)}` : "incluso", p > 0 ? `EUR ${fmt(p * pezzi)}` : ""]);
    }
    // Persiana
    const pers = acc.persiana;
    if (pers?.attivo) {
      const pDesc = ["Persiana", pers.tipo, pers.colore].filter(Boolean).join(" ");
      const p = prezzi.persiana || 0;
      rows.push(["", `  > ${pDesc}`, String(pezzi), p > 0 ? `EUR ${fmt(p)}` : "incluso", p > 0 ? `EUR ${fmt(p * pezzi)}` : ""]);
    }
    // Zanzariera
    const zanz = acc.zanzariera;
    if (zanz?.attivo) {
      const zDesc = ["Zanzariera", zanz.tipo, zanz.colore].filter(Boolean).join(" ");
      const p = prezzi.zanzariera || 0;
      rows.push(["", `  > ${zDesc}`, String(pezzi), p > 0 ? `EUR ${fmt(p)}` : "incluso", p > 0 ? `EUR ${fmt(p * pezzi)}` : ""]);
    }
    // Controtelaio
    const ctInf = v.controtelaio || {};
    if (ctInf.tipo && ctInf.tipo !== "Nessuno") {
      const ctLabel = ctInf.tipo === "singolo" ? "Singolo" : ctInf.tipo === "doppio" ? "Doppio" : "Con cassonetto";
      const ctMis = ctInf.l && ctInf.h ? ` ${ctInf.l}x${ctInf.h}mm` : "";
      const p = prezzi.controtelaio || 0;
      rows.push(["", `  > Controtelaio ${ctLabel}${ctMis}`, String(pezzi), p > 0 ? `EUR ${fmt(p)}` : "incluso", p > 0 ? `EUR ${fmt(p * pezzi)}` : ""]);
    }
    // Posa
    if (prezzi.posa) {
      rows.push(["", `  > Posa in opera`, String(pezzi), `EUR ${fmt(prezzi.posa)}`, `EUR ${fmt(prezzi.posa * pezzi)}`]);
    }
    // Accessori catalogo (maniglie, cilindri, molle, ecc.)
    (v.accessoriCatalogo || []).forEach((a: any) => {
      if (!a?.nome) return;
      const aDesc = [a.nome, a.codice ? `(${a.codice})` : "", a.colore || "", a.nota || ""].filter(Boolean).join(" . ");
      const qta = a.quantita || 1;
      const pu = parseFloat(a.prezzoUnitario) || 0;
      rows.push(["", `  > ${aDesc}`, String(qta), pu > 0 ? `EUR ${fmt(pu)}` : "incluso", pu > 0 ? `EUR ${fmt(pu * qta)}` : ""]);
    });
    // Voci libere vano
    (v.vociLibere || []).forEach((vl: any) => {
      if (!vl.desc) return;
      const qta = vl.qta || 1;
      const p = vl.prezzo || 0;
      rows.push(["", `  > ${vl.desc}`, String(qta), `EUR ${fmt(p)}`, `EUR ${fmt(p * qta)}`]);
    });
  });

  // Voci libere commessa
  (c.vociLibere || []).forEach((vl: any) => {
    rows.push([
      "-",
      vl.desc || vl.descrizione || "Voce aggiuntiva",
      String(vl.qta || 1),
      `EUR ${fmt(vl.importo || 0)}`,
      `EUR ${fmt((vl.importo || 0) * (vl.qta || 1))}`,
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

  // ── Disegni tecnici vani ──
  const vaniConDisegno = vaniCalc.filter((v: any) => v.disegno?.elements?.length > 0);
  if (vaniConDisegno.length > 0) {
    // Titolo sezione
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.text("DISEGNI TECNICI", 12, y); y += 5;

    const colW = (W - 28) / Math.min(vaniConDisegno.length, 3); // max 3 per riga
    const imgH = 40; // mm
    let col = 0;
    for (const v of vaniConDisegno) {
      if (y + imgH + 16 > doc.internal.pageSize.height - 20) { doc.addPage(); y = 20; col = 0; }
      const lmm = v.misure?.lCentro || 0, hmm = v.misure?.hCentro || 0;
      const imgData = await renderDisegnoVano(v.disegno.elements, lmm, hmm);
      const x = 12 + col * colW;
      // Box contorno
      doc.setDrawColor(...C.line as [number,number,number]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, colW - 4, imgH + 8, 2, 2);
      // Etichetta vano
      doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.sub as [number,number,number]);
      doc.text(v.nome || `Vano ${vaniCalc.indexOf(v) + 1}`, x + 2, y + 5);
      // Immagine
      if (imgData) {
        try { doc.addImage(imgData, "PNG", x + 2, y + 7, colW - 8, imgH - 2); } catch {}
      }
      col++;
      if (col >= 3) { col = 0; y += imgH + 14; }
    }
    if (col > 0) y += imgH + 14;
    y += 4;
  }

  // ── Totali ──
  const totW = 90;
  const totX = W - totW - 12;

  const totRows: [string, string, boolean][] = [];
  if (sconto > 0) totRows.push([`Sconto ${c.sconto}%`, `− EUR ${fmt(sconto)}`, false]);
  totRows.push(["Imponibile", `EUR ${fmt(imponibile)}`, false]);
  totRows.push([`IVA ${ivaPerc}%`, `EUR ${fmt(iva)}`, false]);
  totRows.push(["TOTALE IVA INCLUSA", `EUR ${fmt(totIva)}`, true]);
  if (acconto > 0) {
    totRows.push([`Acconto ricevuto`, `− EUR ${fmt(acconto)}`, false]);
    totRows.push(["Saldo da pagare", `EUR ${fmt(saldo)}`, true]);
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
    doc.text(`${c.cliente}${c.cognome ? " " + c.cognome : ""} - ${c.dataFirma || new Date().toLocaleDateString("it-IT")}`, 14, y + 13);

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
    const footLeft = [az.telefono, az.email].filter(Boolean).join(" . ");
    if (footLeft) doc.text(footLeft, 12, pH - 5);
    doc.text(`Pag. ${i} / ${pageCount}`, W - 12, pH - 5, { align: "right" });
  }

  // ── Download ──
  const filename = `preventivo_${c.code || c.id}_${c.cliente?.replace(/\s/g, "_") || "cliente"}.pdf`;
  doc.save(filename);
}

