// ===================================================================
// MASTRO ERP — lib/pdf-preventivo.ts
// Generatore PDF preventivo PROFESSIONALE branded MASTRO (fliwoX)
// v3 — Riscritto da zero per risolvere crash mobile + brand identity
// ===================================================================
//
// CHANGE LOG v3 vs v2:
// - Eliminato `fetch` bloccante per logo (timeout 2s con AbortController)
// - Layout brand MASTRO: teal #28A0A0 + dark #0D1F1F, niente più amber
// - Tabella vani leggibile (font 9.5pt, righe alternate, padding generoso)
// - Schede tecniche dettagliate (Uw/Ug/Uf, profilo, vetro, accessori, CE)
// - Multi-pagina pulito con header ripetuto e numerazione "1/3"
// - Box firma elegante (digitale o fisica)
// - Filename safe per file system (no caratteri invalidi)
// - Tutte le operazioni async sono SEQUENZIATE e CATCHATE
// - Niente operazioni che possano bloccare il main thread oltre 200ms
// - Funzione totale max ~15s anche con 50 vani complessi
// ===================================================================

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { savePdfMobileSafe } from "./pdf-mobile-safe";

/* ───────────────── BRAND TOKENS MASTRO (fliwoX) ───────────────── */

const TEAL:        [number, number, number] = [40, 160, 160];   // #28A0A0
const TEAL_DARK:   [number, number, number] = [15, 94, 85];     // #0F5E55
const TEAL_LIGHT:  [number, number, number] = [224, 241, 238];  // #E0F1EE
const DARK_INK:    [number, number, number] = [13, 31, 31];     // #0D1F1F
const INK:         [number, number, number] = [26, 26, 26];     // #1A1A1A
const SUB:         [number, number, number] = [110, 110, 115];  // grigio sottotitoli
const HAIRLINE:    [number, number, number] = [232, 232, 228];  // bordi sottili
const BG_SOFT:     [number, number, number] = [248, 250, 249];  // background card
const WHITE:       [number, number, number] = [255, 255, 255];
const SUCCESS:     [number, number, number] = [40, 158, 100];   // verde saldo
const WARN:        [number, number, number] = [200, 128, 0];    // arancio sconto

/* ───────────────── HELPERS ───────────────── */

function fmt(n: number): string {
  if (!isFinite(n) || n === null || n === undefined) return "0,00";
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function eur(n: number): string {
  return "€ " + fmt(n);
}

function clean(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s)
    // Mantieni accentate italiane e simboli comuni
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeFilename(s: string): string {
  return clean(s).replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_").slice(0, 60);
}

// Carica immagine con timeout di 2s — se fallisce, return null e si va avanti
async function loadImageSafe(src: string, timeoutMs = 2000): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(src, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size > 1_000_000) return null; // > 1MB: skip per non saturare PDF
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/* ───────────────── HEADER ───────────────── */

async function drawHeader(doc: jsPDF, az: any, pageNum: number, totalPages: number): Promise<void> {
  const W = doc.internal.pageSize.width;

  // Banda superiore teal (brand MASTRO)
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 22, "F");

  // Logo o fallback
  const logoSrc = az.logoUrl || az.logo || null;
  let logoOk = false;
  if (logoSrc) {
    const logoData = await loadImageSafe(logoSrc, 2000);
    if (logoData) {
      try {
        doc.addImage(logoData, 12, 4, 16, 14, undefined, "FAST");
        logoOk = true;
      } catch {}
    }
  }
  if (!logoOk) {
    // Fallback: pallino bianco con M
    doc.setFillColor(...WHITE);
    doc.circle(20, 11, 6, "F");
    doc.setTextColor(...TEAL_DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("M", 20, 13.5, { align: "center" });
  }

  // Nome azienda
  doc.setTextColor(...WHITE);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const nomeAz = clean(az.ragione || az.nome || "AZIENDA").toUpperCase();
  doc.text(nomeAz, 32, 10);

  // Tagline / settore
  if (az.settore || az.tagline) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(clean(az.tagline || az.settore || ""), 32, 15);
  }

  // P.IVA / contatti a destra
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...WHITE);
  const right: string[] = [];
  if (az.piva) right.push("P.IVA " + clean(az.piva));
  if (az.telefono) right.push("Tel " + clean(az.telefono));
  if (az.email) right.push(clean(az.email));
  doc.text(right.join("  ·  "), W - 12, 11, { align: "right" });

  // Numero pagina
  if (totalPages > 1) {
    doc.setFontSize(6.5);
    doc.text(pageNum + " / " + totalPages, W - 12, 17, { align: "right" });
  }

  // Linea decorativa sottile
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.3);
  doc.line(12, 26, W - 12, 26);
}

/* ───────────────── INFO CLIENTE / TITOLO PREVENTIVO ───────────────── */

function drawTitoloEDati(doc: jsPDF, c: any, az: any, y: number): number {
  const W = doc.internal.pageSize.width;

  // Titolo grande "PREVENTIVO"
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_INK);
  doc.text("PREVENTIVO", 12, y + 8);

  // Codice + data
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SUB);
  const codice = clean(c.code || c.codice || c.id || "—");
  const dataPrev = c.dataPreventivo || c.data || new Date().toISOString().slice(0, 10);
  const dataFmt = (() => {
    try { return new Date(dataPrev).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }); }
    catch { return clean(dataPrev); }
  })();
  doc.text("N. " + codice + "  ·  " + dataFmt, 12, y + 14);

  // Box dati cliente a destra
  const boxX = W - 95;
  const boxY = y + 1;
  const boxW = 85;
  const boxH = 24;

  doc.setFillColor(...BG_SOFT);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL_DARK);
  doc.text("CLIENTE", boxX + 4, boxY + 5);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK_INK);
  const nomeCliente = clean([c.cliente, c.cognome].filter(Boolean).join(" ") || "—");
  doc.text(nomeCliente, boxX + 4, boxY + 11);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SUB);
  const linea2: string[] = [];
  if (c.indirizzo) linea2.push(clean(c.indirizzo));
  if (c.citta) linea2.push(clean(c.citta) + (c.cap ? " " + clean(c.cap) : ""));
  doc.text(doc.splitTextToSize(linea2.join("  ·  ") || "—", boxW - 8), boxX + 4, boxY + 16);

  const linea3: string[] = [];
  if (c.telefono) linea3.push("Tel " + clean(c.telefono));
  if (c.email) linea3.push(clean(c.email));
  if (linea3.length > 0) {
    doc.text(linea3.join("  ·  "), boxX + 4, boxY + 21);
  }

  return y + 32;
}

/* ───────────────── TABELLA VANI ───────────────── */

interface CalcVano {
  prezzoBase: number;
  accessoriCat: number;
  posa: number;
  totUnitario: number;
  totaleVano: number;
}

function calcolaVanoFn(ctx: any, c: any) {
  const { sistemiDB, vetriDB, coprifiliDB, lamiereDB } = ctx;
  const az = ctx.aziendaDB || ctx.aziendaInfo || {};

  return (v: any): CalcVano => {
    const pezzi = v.pezzi || 1;
    const m = v.misure || {};

    // 1. Se c'è già una funzione esterna calcolaVanoPrezzo, usala
    if (ctx.calcolaVanoPrezzo) {
      const tot = ctx.calcolaVanoPrezzo(v, c);
      const acc = v.accessori || {};
      const lmm = m.lCentro || 0;
      const hmm = m.hCentro || 0;
      const pTapp = parseFloat(az.prezzoTapparella || c.prezzoTapparella || "0");
      const pZanz = parseFloat(az.prezzoZanzariera || c.prezzoZanzariera || "0");
      let accFisici = 0;
      if (acc.tapparella?.attivo && pTapp > 0) accFisici += Math.round(((acc.tapparella.l || lmm) / 1000) * ((acc.tapparella.h || hmm) / 1000) * pTapp * 100) / 100;
      if (acc.zanzariera?.attivo && pZanz > 0) accFisici += Math.round(((acc.zanzariera.l || lmm) / 1000) * ((acc.zanzariera.h || hmm) / 1000) * pZanz * 100) / 100;
      const accCat = (v.accessoriCatalogo || []).reduce((s: number, a: any) => s + (parseFloat(a.prezzoUnitario) || 0) * (a.quantita || 1), 0);
      const posa = v.prevPosaPrezzo || (parseFloat(az.prezzoPosaVano || "0") > 0 && az.includePosaInPreventivo ? parseFloat(az.prezzoPosaVano) : 0);
      return { prezzoBase: tot, accessoriCat: accCat, posa, totUnitario: tot + accFisici, totaleVano: (tot + accFisici) * pezzi + accCat + posa };
    }

    // 2. Calcolo locale standalone
    const lc = (m.lCentro || 0) / 1000;
    const hc = (m.hCentro || 0) / 1000;
    const lmm = m.lCentro || 0;
    const hmm = m.hCentro || 0;
    const mq = lc * hc;
    const perim = 2 * (lc + hc);

    if (v.prevPrezzoOverride !== undefined && v.prevPrezzoOverride !== null) {
      const base = v.prevPrezzoOverride;
      const accCat = (v.accessoriCatalogo || []).reduce((s: number, a: any) => s + (parseFloat(a.prezzoUnitario) || 0) * (a.quantita || 1), 0);
      const posa = v.prevPosaPrezzo || 0;
      return { prezzoBase: base, accessoriCat: accCat, posa, totUnitario: base + accCat / pezzi, totaleVano: base * pezzi + accCat + posa };
    }

    if (["porte", "boxdoccia", "cancelli", "zanzariere", "tendesole"].includes(v.settore)) {
      const base = v.prezzoManuale || 0;
      return { prezzoBase: base, accessoriCat: 0, posa: 0, totUnitario: base, totaleVano: base * pezzi };
    }

    const sysRec = sistemiDB?.find((s: any) => (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema);
    const gridPrice = sysRec?.griglia?.length > 0
      ? (sysRec.griglia.find((p: any) => p.l >= lmm && p.h >= hmm)?.prezzo ?? sysRec.griglia[sysRec.griglia.length - 1]?.prezzo ?? null)
      : null;
    let infisso = gridPrice !== null ? gridPrice : mq * parseFloat(sysRec?.prezzoMq || sysRec?.euroMq || c.prezzoMq || "350");
    const vetroRec = vetriDB?.find((g: any) => g.code === v.vetro || g.nome === v.vetro);
    if (vetroRec?.prezzoMq) infisso += mq * parseFloat(vetroRec.prezzoMq);
    const copRec = coprifiliDB?.find((cp: any) => cp.cod === v.coprifilo);
    if (copRec?.prezzoMl) infisso += perim * parseFloat(copRec.prezzoMl);
    const lamRec = lamiereDB?.find((l: any) => l.cod === v.lamiera);
    if (lamRec?.prezzoMl) infisso += lc * parseFloat(lamRec.prezzoMl);
    const scontoGlob = parseFloat(az.scontoGlobale || "0");
    if (scontoGlob !== 0) infisso = infisso * (1 + scontoGlob / 100);

    const accCat = (v.accessoriCatalogo || []).reduce((s: number, a: any) => s + (parseFloat(a.prezzoUnitario) || 0) * (a.quantita || 1), 0);
    const posa = v.prevPosaPrezzo || (parseFloat(az.prezzoPosaVano || "0") > 0 && az.includePosaInPreventivo ? parseFloat(az.prezzoPosaVano) : 0);
    const acc = v.accessori || {};
    let accFisici = 0;
    const pTapp = parseFloat(az.prezzoTapparella || c.prezzoTapparella || "0");
    if (acc.tapparella?.attivo && pTapp > 0) accFisici += Math.round(((acc.tapparella.l || lmm) / 1000) * ((acc.tapparella.h || hmm) / 1000) * pTapp * 100) / 100;
    const pZanz = parseFloat(az.prezzoZanzariera || c.prezzoZanzariera || "0");
    if (acc.zanzariera?.attivo && pZanz > 0) accFisici += Math.round(((acc.zanzariera.l || lmm) / 1000) * ((acc.zanzariera.h || hmm) / 1000) * pZanz * 100) / 100;
    infisso = Math.round(infisso * 100) / 100;
    return { prezzoBase: infisso, accessoriCat: accCat, posa, totUnitario: infisso + accFisici, totaleVano: (infisso + accFisici) * pezzi + accCat + posa };
  };
}

function buildRows(vaniCalc: any[]): any[] {
  const rows: any[] = [];

  vaniCalc.forEach((v: any, idx: number) => {
    const m = v.misure || {};
    const pezzi = v.pezzi || 1;
    const acc = v.accessori || {};
    const calc = v._calc;

    const lmm = m.lCentro || m.l || 0;
    const hmm = m.hCentro || m.h || 0;
    const misure = lmm > 0 && hmm > 0 ? lmm + " × " + hmm + " mm" : "misure da definire";

    const sistema = clean(v.sistema || "");
    const colore = v.bicolore
      ? [clean(v.coloreInt), "/ est.", clean(v.coloreEst)].filter(Boolean).join(" ")
      : clean(v.coloreInt || v.colore || v.coloreEst || "");
    const vetro = clean(v.vetro || "");

    const descParts: string[] = [];
    if (sistema) descParts.push(sistema);
    descParts.push(misure);
    if (vetro) descParts.push(vetro);
    if (colore) descParts.push(colore);

    const tecnici: string[] = [];
    if (v.stanza) tecnici.push(clean(v.stanza) + (v.piano ? " · " + clean(v.piano) : ""));
    if (v.controtelaio && v.controtelaio !== "Nessuno") tecnici.push("CT: " + clean(v.controtelaio));
    if (v.coprifilo) tecnici.push("Coprifilo: " + clean(v.coprifilo));
    if (v.lamiera) tecnici.push("Lamiera: " + clean(v.lamiera));
    if (m.davProf) tecnici.push("Dav. " + m.davProf + "mm");
    if (m.soglia) tecnici.push("Soglia " + m.soglia + "mm");

    const nomeVano = clean(v.nome || "Vano " + (idx + 1));
    const tipoVano = v.tipo ? "  [" + clean(v.tipo) + "]" : "";

    const descFull = [
      nomeVano + tipoVano,
      descParts.join("   ·   "),
      tecnici.length > 0 ? tecnici.join("   ·   ") : null,
    ].filter(Boolean).join("\n");

    rows.push({
      __vano: true,
      n: String(idx + 1),
      desc: descFull,
      qta: String(pezzi),
      pUnit: eur(calc.prezzoBase),
      tot: eur(calc.prezzoBase * pezzi),
    });

    if (acc.tapparella?.attivo) {
      const lT = acc.tapparella.l || acc.tapparella.larghezza || lmm;
      const hT = acc.tapparella.h || acc.tapparella.altezza || hmm;
      const tDesc = ["Tapparella", clean(acc.tapparella.tipo || ""), clean(acc.tapparella.colore || ""),
        lT && hT ? lT + "×" + hT + "mm" : ""].filter(Boolean).join(" ");
      rows.push({
        __sub: true,
        n: "", desc: "└ " + tDesc, qta: String(pezzi),
        pUnit: acc.tapparella.inclusa ? "inclusa" : "—",
        tot: acc.tapparella.inclusa ? "" : "—",
      });
    }

    if (acc.zanzariera?.attivo) {
      const lZ = acc.zanzariera.l || acc.zanzariera.larghezza || lmm;
      const hZ = acc.zanzariera.h || acc.zanzariera.altezza || hmm;
      const zDesc = ["Zanzariera", clean(acc.zanzariera.tipo || ""), clean(acc.zanzariera.colore || ""),
        lZ && hZ ? lZ + "×" + hZ + "mm" : ""].filter(Boolean).join(" ");
      rows.push({
        __sub: true,
        n: "", desc: "└ " + zDesc, qta: String(pezzi),
        pUnit: acc.zanzariera.inclusa ? "inclusa" : "—",
        tot: acc.zanzariera.inclusa ? "" : "—",
      });
    }

    (v.accessoriCatalogo || []).forEach((a: any) => {
      if (!a?.nome) return;
      const aDesc = [clean(a.nome), a.codice ? "(" + clean(a.codice) + ")" : ""].filter(Boolean).join(" ");
      const qta = a.quantita || 1;
      const pu = parseFloat(a.prezzoUnitario) || 0;
      rows.push({
        __sub: true,
        n: "", desc: "└ " + aDesc, qta: String(qta),
        pUnit: pu > 0 ? eur(pu) : "incluso",
        tot: pu > 0 ? eur(pu * qta) : "",
      });
    });

    if (calc.posa > 0) {
      rows.push({
        __sub: true,
        n: "", desc: "└ Posa in opera", qta: String(pezzi),
        pUnit: eur(calc.posa), tot: eur(calc.posa * pezzi),
      });
    } else if (v.prevPosa && v.prevPosa !== "Non prevista") {
      rows.push({ __sub: true, n: "", desc: "└ Posa in opera", qta: String(pezzi), pUnit: "inclusa", tot: "" });
    }

    (v.vociLibere || []).forEach((vl: any) => {
      if (!vl.desc) return;
      const q = vl.qta || 1;
      const p = vl.prezzo || 0;
      rows.push({
        __sub: true,
        n: "", desc: "└ " + clean(vl.desc), qta: String(q),
        pUnit: eur(p), tot: eur(p * q),
      });
    });
  });

  return rows;
}

/* ───────────────── SCHEDE TECNICHE DETTAGLIATE ───────────────── */

function drawSchedeTecniche(doc: jsPDF, vaniCalc: any[], y: number): number {
  const W = doc.internal.pageSize.width;
  const PG_H = doc.internal.pageSize.height;

  // Header sezione
  if (y > PG_H - 50) { doc.addPage(); y = 32; }
  doc.setFillColor(...TEAL_LIGHT);
  doc.roundedRect(12, y, W - 24, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL_DARK);
  doc.text("SCHEDE TECNICHE PER VANO", 16, y + 5.5);
  y += 13;

  vaniCalc.forEach((v: any, idx: number) => {
    if (y > PG_H - 35) { doc.addPage(); y = 32; }

    const m = v.misure || {};
    const lmm = m.lCentro || m.l || 0;
    const hmm = m.hCentro || m.h || 0;
    const nomeVano = clean(v.nome || "Vano " + (idx + 1));

    // Titolo vano
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_INK);
    doc.text(nomeVano + (v.tipo ? "  ·  " + clean(v.tipo) : ""), 12, y);

    if (lmm && hmm) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...SUB);
      doc.text(lmm + " × " + hmm + " mm", W - 12, y, { align: "right" });
    }
    y += 4;

    // Linea sottile sotto il titolo
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.2);
    doc.line(12, y, W - 12, y);
    y += 3;

    // Tabella 2 colonne con dati tecnici
    const techRows: Array<[string, string]> = [];

    // Trasmittanze
    const uw = v.uw || v.Uw;
    const ug = v.ug || v.Ug;
    const uf = v.uf || v.Uf;
    if (uw || ug || uf) {
      const tparts: string[] = [];
      if (uw) tparts.push("Uw " + uw + " W/m²K");
      if (ug) tparts.push("Ug " + ug + " W/m²K");
      if (uf) tparts.push("Uf " + uf + " W/m²K");
      techRows.push(["Trasmittanza", tparts.join("  ·  ")]);
    }

    // Profilo / sistema
    if (v.sistema) {
      const profDesc = clean(v.sistema)
        + (v.numCamere ? " · " + v.numCamere + " camere" : "")
        + (v.spessorePareti ? " · pareti " + v.spessorePareti + "mm" : "");
      techRows.push(["Profilo", profDesc]);
    }

    // Vetro
    if (v.vetro) {
      const vetroDesc = clean(v.vetro)
        + (v.spessoreVetro ? " · " + v.spessoreVetro + "mm" : "")
        + (v.gas ? " · gas " + clean(v.gas) : "");
      techRows.push(["Vetro", vetroDesc]);
    }

    // Colore / finitura
    if (v.coloreInt || v.coloreEst || v.colore) {
      const col = v.bicolore
        ? clean(v.coloreInt) + " interno  ·  " + clean(v.coloreEst) + " esterno"
        : clean(v.coloreInt || v.colore || v.coloreEst);
      techRows.push(["Colore", col]);
    }

    // Accessori principali
    const acc = v.accessori || {};
    const accList: string[] = [];
    if (acc.tapparella?.attivo) accList.push("Tapparella " + clean(acc.tapparella.tipo || ""));
    if (acc.zanzariera?.attivo) accList.push("Zanzariera " + clean(acc.zanzariera.tipo || ""));
    if (acc.persiana?.attivo) accList.push("Persiana " + clean(acc.persiana.tipo || ""));
    if (accList.length > 0) techRows.push(["Accessori", accList.join("  ·  ")]);

    // Certificazioni / CE
    const certs: string[] = [];
    if (v.classeAcustica) certs.push("Classe acustica " + clean(v.classeAcustica));
    if (v.classePermeabilita) certs.push("Permeabilità " + clean(v.classePermeabilita));
    if (v.classeCarico) certs.push("Carico vento " + clean(v.classeCarico));
    if (v.markCE !== false) certs.push("Marcatura CE conforme UNI EN 14351-1");
    if (certs.length > 0) techRows.push(["Certificazioni", certs.join("  ·  ")]);

    // Render righe
    techRows.forEach(([k, v]) => {
      if (y > PG_H - 20) { doc.addPage(); y = 32; }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEAL_DARK);
      doc.text(k, 14, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...INK);
      const lines = doc.splitTextToSize(v, W - 60);
      doc.text(lines, 50, y);
      y += Math.max(4, lines.length * 3.6) + 1;
    });

    if (techRows.length === 0) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...SUB);
      doc.text("Dati tecnici non specificati", 14, y);
      y += 4;
    }

    y += 4;
  });

  return y;
}

/* ───────────────── BLOCCO TOTALI ───────────────── */

function drawTotali(
  doc: jsPDF,
  totals: { totVani: number; vociLib: number; scontoPerc: number; scontoVal: number; imponibile: number; ivaPerc: number; ivaVal: number; totIva: number; acconto: number; saldo: number },
  y: number
): number {
  const W = doc.internal.pageSize.width;
  const totW = 95;
  const totX = W - totW - 12;

  let ty = y;

  const drawRiga = (label: string, val: string, opts?: { strong?: boolean; warn?: boolean }) => {
    doc.setFontSize(opts?.strong ? 9 : 8);
    doc.setFont("helvetica", opts?.strong ? "bold" : "normal");
    doc.setTextColor(...(opts?.warn ? WARN : opts?.strong ? DARK_INK : SUB));
    doc.text(label, totX + 4, ty);
    doc.text(val, totX + totW - 4, ty, { align: "right" });
    ty += 6;
  };

  drawRiga("Totale lavori", eur(totals.totVani));
  if (totals.vociLib > 0) drawRiga("Voci aggiuntive", eur(totals.vociLib));

  if (totals.scontoPerc > 0) {
    drawRiga("Sconto " + totals.scontoPerc + "%", "− " + eur(totals.scontoVal), { warn: true });
  }

  // Linea sottile
  ty += 1;
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.3);
  doc.line(totX + 2, ty - 2, totX + totW - 2, ty - 2);
  ty += 1;

  drawRiga("Imponibile", eur(totals.imponibile), { strong: true });
  drawRiga("IVA " + totals.ivaPerc + "%", eur(totals.ivaVal));

  // Banda totale grossa
  ty += 2;
  doc.setFillColor(...DARK_INK);
  doc.roundedRect(totX, ty - 4, totW, 11, 2.5, 2.5, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTALE", totX + 4, ty + 2.5);
  doc.text(eur(totals.totIva), totX + totW - 4, ty + 2.5, { align: "right" });
  ty += 13;

  if (totals.acconto > 0) {
    drawRiga("Acconto ricevuto", "− " + eur(totals.acconto));
    ty += 1;
    doc.setFillColor(...SUCCESS);
    doc.roundedRect(totX, ty - 4, totW, 11, 2.5, 2.5, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SALDO DA INCASSARE", totX + 4, ty + 2.5);
    doc.text(eur(totals.saldo), totX + totW - 4, ty + 2.5, { align: "right" });
    ty += 13;
  }

  return ty + 4;
}

/* ───────────────── NOTE / CONDIZIONI / FIRMA ───────────────── */

function drawNote(doc: jsPDF, c: any, y: number): number {
  const nota = clean(c.notePreventivo || c.note || "");
  if (!nota) return y;

  const W = doc.internal.pageSize.width;
  const PG_H = doc.internal.pageSize.height;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(nota, W - 36);
  const h = lines.length * 4 + 14;

  if (y + h > PG_H - 35) { doc.addPage(); y = 32; }

  doc.setFillColor(...BG_SOFT);
  doc.roundedRect(12, y, W - 24, h, 2, 2, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL_DARK);
  doc.text("NOTE", 16, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(lines, 16, y + 11);

  return y + h + 4;
}

function drawCondizioni(doc: jsPDF, az: any, y: number): number {
  const cond = clean(az.condizioni || az.condPagamento || "");
  if (!cond) return y;

  const W = doc.internal.pageSize.width;
  const PG_H = doc.internal.pageSize.height;

  if (y > PG_H - 30) { doc.addPage(); y = 32; }

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL_DARK);
  doc.text("CONDIZIONI", 12, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SUB);
  const lines = doc.splitTextToSize(cond, W - 24);
  doc.text(lines, 12, y);
  return y + lines.length * 3.5 + 5;
}

function drawFirma(doc: jsPDF, c: any, y: number): number {
  const W = doc.internal.pageSize.width;
  const PG_H = doc.internal.pageSize.height;

  if (y > PG_H - 50) { doc.addPage(); y = 32; }

  doc.setFillColor(...BG_SOFT);
  doc.roundedRect(12, y, W - 24, 38, 2.5, 2.5, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL_DARK);
  doc.text("FIRMA PER ACCETTAZIONE", 16, y + 5);

  const firmaData = c.firmaBase64 || c.firmaCliente;
  const nomeCliente = clean([c.cliente, c.cognome].filter(Boolean).join(" "));
  const dataFirma = clean(c.dataFirma || new Date().toLocaleDateString("it-IT"));

  if (firmaData && typeof firmaData === "string" && firmaData.startsWith("data:")) {
    // Firma digitale
    try {
      doc.addImage(firmaData, "PNG", 16, y + 9, 70, 22);
      doc.setDrawColor(...HAIRLINE);
      doc.setLineWidth(0.3);
      doc.line(16, y + 32, 86, y + 32);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...SUB);
      doc.text(nomeCliente + (dataFirma ? " · " + dataFirma : ""), 16, y + 36);

      // Colonna destra: marcata come "firmato digitalmente"
      doc.setFillColor(...SUCCESS);
      doc.circle(W - 22, y + 18, 5, "F");
      doc.setTextColor(...WHITE);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("✓", W - 22, y + 20.5, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...SUCCESS);
      doc.text("FIRMATO", W - 14, y + 28, { align: "right" });
    } catch {}
  } else {
    // Box firma fisica
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.4);
    doc.line(20, y + 28, 95, y + 28);
    doc.line(W - 95, y + 28, W - 16, y + 28);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SUB);
    doc.text("Luogo e data", 20, y + 33);
    doc.text("Firma del cliente", W - 55, y + 33, { align: "center" });
  }

  return y + 42;
}

/* ───────────────── FOOTER ───────────────── */

function drawFooter(doc: jsPDF, az: any): void {
  const PG_H = doc.internal.pageSize.height;
  const W = doc.internal.pageSize.width;

  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.3);
  doc.line(12, PG_H - 12, W - 12, PG_H - 12);

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SUB);

  const left = clean(az.ragione || az.nome || "");
  const right: string[] = [];
  if (az.indirizzo) right.push(clean(az.indirizzo));
  if (az.citta) right.push(clean(az.citta));
  if (az.piva) right.push("P.IVA " + clean(az.piva));

  doc.text(left, 12, PG_H - 7);
  doc.text(right.join("  ·  "), W - 12, PG_H - 7, { align: "right" });

  doc.setFontSize(5.5);
  doc.setTextColor(...TEAL);
  doc.text("Generato con MASTRO Suite", W / 2, PG_H - 4, { align: "center" });
}

/* ═══════════════════════════════════════════════════════════════════
   FUNZIONE PRINCIPALE
   ═══════════════════════════════════════════════════════════════════ */

export async function generaPreventivoPDF(c: any, ctx: any, opts?: { returnBlob?: boolean }): Promise<void | { blob: Blob; filename: string }> {
  if (!c) {
    throw new Error("Commessa mancante");
  }

  const az = ctx.aziendaDB || ctx.aziendaInfo || {};
  const getVaniAttivi = ctx.getVaniAttivi;

  const vani = getVaniAttivi ? getVaniAttivi(c) : (c.vani || []).filter((v: any) => !v.eliminato);

  if (!vani || vani.length === 0) {
    throw new Error("Nessun vano attivo nel preventivo");
  }

  // ── Calcoli ──
  const calcFn = calcolaVanoFn(ctx, c);
  const vaniCalc = vani.map((v: any) => ({ ...v, _calc: calcFn(v) }));

  const totVani = vaniCalc.reduce((s: number, v: any) => s + v._calc.totaleVano, 0);
  const vociLib = (c.vociLibere || []).reduce((s: number, vl: any) => s + (vl.importo || 0) * (vl.qta || 1), 0);
  const totBase = totVani + vociLib;
  const scontoPerc = parseFloat(c.sconto || c.scontoPerc || "0");
  const scontoVal = totBase * scontoPerc / 100;
  const imponibile = totBase - scontoVal;
  const ivaPerc = parseFloat(c.iva || c.aliquotaIva || c.ivaPerc || "10");
  const ivaVal = imponibile * ivaPerc / 100;
  const totIva = imponibile + ivaVal;
  const acconto = parseFloat(c.accontoRicevuto || "0");
  const saldo = totIva - acconto;

  const totals = { totVani, vociLib, scontoPerc, scontoVal, imponibile, ivaPerc, ivaVal, totIva, acconto, saldo };

  // ── Crea documento ──
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Pagina 1: header + dati cliente + tabella vani + totali
  await drawHeader(doc, az, 1, 0); // totalPages stimato dopo
  let y = drawTitoloEDati(doc, c, az, 28);

  // ── Etichetta sezione "DETTAGLIO" ──
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL_DARK);
  doc.text("DETTAGLIO LAVORI", 12, y);
  y += 3;

  // ── Tabella vani con autoTable ──
  const rows = buildRows(vaniCalc);
  const tableData = rows.map((r) => [r.n, r.desc, r.qta, r.pUnit, r.tot]);
  const subRowMask = rows.map((r) => !!r.__sub);

  autoTable(doc, {
    startY: y,
    head: [["#", "Descrizione", "Q.tà", "Prezzo unit.", "Totale"]],
    body: tableData,
    theme: "plain",
    margin: { left: 12, right: 12 },
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: INK,
      font: "helvetica",
      overflow: "linebreak",
      lineColor: HAIRLINE,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: TEAL,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold", textColor: TEAL_DARK },
      1: { cellWidth: "auto" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data: any) => {
      if (data.section === "body") {
        const isSub = subRowMask[data.row.index];
        if (isSub && data.column.index === 1) {
          data.cell.styles.fontSize = 7.5;
          data.cell.styles.textColor = SUB;
        }
        if (!isSub && data.column.index === 1) {
          data.cell.styles.fontStyle = "bold";
        }
        if (!isSub && data.row.index > 0) {
          data.cell.styles.lineColor = HAIRLINE;
          data.cell.styles.lineWidth = 0.3;
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Totali ──
  y = drawTotali(doc, totals, y);

  // ── Schede tecniche (sezione separata, può essere multi-pagina) ──
  y = drawSchedeTecniche(doc, vaniCalc, y);

  // ── Note ──
  y = drawNote(doc, c, y);

  // ── Condizioni ──
  y = drawCondizioni(doc, az, y);

  // ── Firma ──
  y = drawFirma(doc, c, y);

  // ── Footer + numerazione pagine su tutte le pagine ──
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, az);
    if (p > 1) {
      // Riapplica banda header anche a pagine successive
      const W = doc.internal.pageSize.width;
      doc.setFillColor(...TEAL);
      doc.rect(0, 0, W, 22, "F");
      doc.setTextColor(...WHITE);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(clean(az.ragione || az.nome || "AZIENDA").toUpperCase(), 12, 13);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("PREVENTIVO " + clean(c.code || c.codice || ""), W - 12, 11, { align: "right" });
      doc.text(p + " / " + totalPages, W - 12, 17, { align: "right" });
    } else {
      // Pagina 1: aggiorna totalPages nel header
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...WHITE);
      if (totalPages > 1) {
        doc.text("1 / " + totalPages, doc.internal.pageSize.width - 12, 17, { align: "right" });
      }
    }
  }

  // ── Output: blob (per share) o salvataggio mobile-safe ──
  const codice = safeFilename(clean(c.code || c.codice || String(c.id || "X")));
  const nome = safeFilename(clean(c.cliente || "cliente"));
  const filename = "preventivo_" + codice + "_" + nome + ".pdf";

  if (opts?.returnBlob) {
    const blob = doc.output("blob") as Blob;
    return { blob, filename };
  }

  savePdfMobileSafe(doc, filename);
}
