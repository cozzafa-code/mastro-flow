// ═══════════════════════════════════════════
// MASTRO ERP — Generatori PDF/HTML (pure)
// Tutti ricevono i dati necessari come parametri
// ═══════════════════════════════════════════

import { FM, FF, FONT } from "../data/constants";
import { getVaniAttivi, calcolaVanoPrezzo, fmt, tipoToMinCat } from "./calcoli";
import type { CalcoloDeps } from "./calcoli";

export interface PdfDeps extends CalcoloDeps {
  aziendaDB: any;
}


// ═══ PREVENTIVO PDF ═══
export const generaPreventivoPDF = (c: any, deps: PdfDeps) => {
  // Grid price lookup: find smallest grid cell where L>=vanoL and H>=vanoH (ceiling approach like real suppliers)
  const grigliaLookup = (griglia: any[], lmm: number, hmm: number): number | null => {
    if (!griglia || griglia.length === 0) return null;
    // Sort by L then H
    const sorted = [...griglia].sort((a, b) => a.l - b.l || a.h - b.h);
    // Find exact match first
    const exact = sorted.find(g => g.l === lmm && g.h === hmm);
    if (exact) return exact.prezzo;
    // Find ceiling: smallest grid cell that covers the window
    const ceiling = sorted.find(g => g.l >= lmm && g.h >= hmm);
    if (ceiling) return ceiling.prezzo;
    // If window is larger than any grid entry, find the largest grid entry
    const largest = sorted[sorted.length - 1];
    if (largest) return largest.prezzo;
    return null;
  };

  const calcolaVanoPDF = (v) => {
    const m = v.misure||{};
    const lc=(m.lCentro||0)/1000, hc=(m.hCentro||0)/1000;
    const lmm=m.lCentro||0, hmm=m.hCentro||0;
    const mq=lc*hc, perim=2*(lc+hc);
    const sysRec = deps.sistemiDB.find(s=>(s.marca+" "+s.sistema)===v.sistema||s.sistema===v.sistema);
    // Get minimo mq for this tipologia
    const minCat = tipoToMinCat(v.tipo || "F1A");
    const minimoMq = sysRec?.minimiMq?.[minCat] || 0;
    const mqCalc = (minimoMq > 0 && mq > 0 && mq < minimoMq) ? minimoMq : mq;
    // Price: try grid first, fallback to €/mq with minimo applied
    let basePrezzoSer = 0;
    const gridPrice = sysRec?.griglia ? grigliaLookup(sysRec.griglia, lmm, hmm) : null;
    if (gridPrice !== null) {
      basePrezzoSer = gridPrice;
    } else {
      basePrezzoSer = mqCalc * parseFloat(sysRec?.prezzoMq||sysRec?.euroMq||c.prezzoMq||350);
    }
    let tot = basePrezzoSer;
    const vetroRec = deps.vetriDB.find(g=>g.code===v.vetro||g.nome===v.vetro);
    if(vetroRec?.prezzoMq) tot += mq * parseFloat(vetroRec.prezzoMq);
    const copRec = deps.coprifiliDB.find(cp=>cp.cod===v.coprifilo);
    if(copRec?.prezzoMl) tot += perim * parseFloat(copRec.prezzoMl);
    const lamRec = deps.lamiereDB.find(l=>l.cod===v.lamiera);
    if(lamRec?.prezzoMl) tot += lc * parseFloat(lamRec.prezzoMl);
    const tapp=v.accessori?.tapparella; if(tapp?.attivo&&c.prezzoTapparella){const tmq=((tapp.l||m.lCentro||0)/1000)*((tapp.h||m.hCentro||0)/1000);tot+=tmq*parseFloat(c.prezzoTapparella);}
    const pers=v.accessori?.persiana; if(pers?.attivo&&c.prezzoPersiana){const pmq=((pers.l||m.lCentro||0)/1000)*((pers.h||m.hCentro||0)/1000);tot+=pmq*parseFloat(c.prezzoPersiana);}
    const zanz=v.accessori?.zanzariera; if(zanz?.attivo&&c.prezzoZanzariera){const zmq=((zanz.l||m.lCentro||0)/1000)*((zanz.h||m.hCentro||0)/1000);tot+=zmq*parseFloat(c.prezzoZanzariera);}
    // Voci libere
    if (v.vociLibere?.length > 0) v.vociLibere.forEach(vl => { tot += (vl.prezzo || 0) * (vl.qta || 1); });
    return { tot, mq, perim, sysRec, vetroRec, copRec, lamRec };
  };
  const vaniPDF = getVaniAttivi(c);
  const totale = vaniPDF.reduce((s,v)=>s+calcolaVanoPDF(v).tot, 0) + (c.vociLibere || []).reduce((s: number, vl: any) => s + ((vl.importo || vl.prezzo || 0) * (vl.qta || 1)), 0);
  const sconto = parseFloat(c.sconto||0);
  const scontoVal = totale * sconto / 100;
  const imponibile = totale - scontoVal;
  const ivaPerc = parseFloat(c.ivaPerc||10);
  const iva = imponibile * ivaPerc / 100;
  const totIva = imponibile + iva;
  const oggi = new Date().toLocaleDateString("it-IT");
  const totalMq = vaniPDF.reduce((s,v)=>s+calcolaVanoPDF(v).mq, 0);
  const az = aziendaInfo;
  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const TIPI_LABEL: Record<string,string> = { F1A:"Finestra 1 anta", F2A:"Finestra 2 ante", PF1A:"Portafinestra 1 anta", PF2A:"Portafinestra 2 ante", SC2A:"Scorrevole 2 ante", SC4A:"Scorrevole 4 ante", VAS:"Vasistas", FIS:"Fisso", PB:"Porta blindata", PI:"Porta interna" };

  // SVG technical drawing per tipo - IMPROVED
  const drawSVG = (tipo: string, w: number, h: number) => {
    // Use standard dimensions if 0
    const DEFAULTS: Record<string,number[]> = { F1A:[700,1200], F2A:[1200,1400], F3A:[1800,1400], PF1A:[800,2200], PF2A:[1400,2200], PF3A:[2100,2200], VAS:[700,500], SOPR:[800,400], FIS:[600,1000], FISTONDO:[600,600], SC2A:[1600,2200], SC4A:[2800,2200], ALZSC:[3000,2200], BLI:[900,2100], PI:[900,2100] };
    const [defW, defH] = DEFAULTS[tipo] || [1000, 1300];
    const ww = w > 0 ? w : defW;
    const hh = h > 0 ? h : defH;
    const vw=140, vh=Math.max(Math.min(Math.round(vw*(hh/Math.max(ww,1))),180), 60);
    const pad=5, iw=vw-pad*2, ih=vh-pad*2;
    // Frame
    let d = `<rect x="${pad}" y="${pad}" width="${iw}" height="${ih}" rx="1.5" fill="#f0f6ff" stroke="#333" stroke-width="2.5"/>`;
    // Internal frame
    d += `<rect x="${pad+3}" y="${pad+3}" width="${iw-6}" height="${ih-6}" rx="0.5" fill="none" stroke="#555" stroke-width="0.8"/>`;
    
    if (tipo.includes("SC") || tipo === "ALZSC") {
      // Scorrevole
      const mid=vw/2;
      d += `<rect x="${pad+5}" y="${pad+5}" width="${mid-pad-7}" height="${ih-10}" fill="#e8f0fe" stroke="#555" stroke-width="0.7"/>`;
      d += `<rect x="${mid+2}" y="${pad+5}" width="${mid-pad-7}" height="${ih-10}" fill="#e8f0fe" stroke="#555" stroke-width="0.7"/>`;
      // Rails
      d += `<line x1="${pad+5}" y1="${vh/2}" x2="${vw-pad-5}" y2="${vh/2}" stroke="#bbb" stroke-width="0.3" stroke-dasharray="2,2"/>`;
      // Handles
      d += `<rect x="${mid-10}" y="${vh/2-6}" width="3" height="12" rx="1" fill="#666"/>`;
      d += `<rect x="${mid+7}" y="${vh/2-6}" width="3" height="12" rx="1" fill="#666"/>`;
      // Arrows
      d += `<path d="M${mid-16},${vh/2} L${mid-22},${vh/2-3} L${mid-22},${vh/2+3}Z" fill="#999"/>`;
      d += `<path d="M${mid+16},${vh/2} L${mid+22},${vh/2-3} L${mid+22},${vh/2+3}Z" fill="#999"/>`;
    } else if (tipo.includes("2A") || tipo === "PF2A") {
      // 2 ante
      const mid=vw/2;
      d += `<line x1="${mid}" y1="${pad+3}" x2="${mid}" y2="${vh-pad-3}" stroke="#333" stroke-width="1.5"/>`;
      // Left pane
      d += `<rect x="${pad+5}" y="${pad+5}" width="${mid-pad-7}" height="${ih-10}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>`;
      d += `<line x1="${pad+5}" y1="${pad+5}" x2="${mid-2}" y2="${vh-pad-5}" stroke="#ccc" stroke-width="0.4"/>`;
      d += `<line x1="${mid-2}" y1="${pad+5}" x2="${pad+5}" y2="${vh-pad-5}" stroke="#ccc" stroke-width="0.4"/>`;
      // Right pane
      d += `<rect x="${mid+2}" y="${pad+5}" width="${mid-pad-7}" height="${ih-10}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>`;
      d += `<line x1="${mid+2}" y1="${pad+5}" x2="${vw-pad-5}" y2="${vh-pad-5}" stroke="#ccc" stroke-width="0.4"/>`;
      d += `<line x1="${vw-pad-5}" y1="${pad+5}" x2="${mid+2}" y2="${vh-pad-5}" stroke="#ccc" stroke-width="0.4"/>`;
      // Handles
      d += `<circle cx="${mid-8}" cy="${vh/2}" r="3" fill="none" stroke="#333" stroke-width="1"/>`;
      d += `<circle cx="${mid+8}" cy="${vh/2}" r="3" fill="none" stroke="#333" stroke-width="1"/>`;
      // Hinge indicators
      d += `<rect x="${pad+2}" y="${vh/3}" width="2" height="8" rx="1" fill="#888"/>`;
      d += `<rect x="${pad+2}" y="${vh*2/3}" width="2" height="8" rx="1" fill="#888"/>`;
      d += `<rect x="${vw-pad-4}" y="${vh/3}" width="2" height="8" rx="1" fill="#888"/>`;
      d += `<rect x="${vw-pad-4}" y="${vh*2/3}" width="2" height="8" rx="1" fill="#888"/>`;
    } else if (tipo === "VAS" || tipo === "SOPR") {
      // Vasistas / Sopraluce
      d += `<rect x="${pad+5}" y="${pad+5}" width="${iw-10}" height="${ih-10}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>`;
      d += `<line x1="${pad+5}" y1="${vh-pad-5}" x2="${vw/2}" y2="${pad+5}" stroke="#ccc" stroke-width="0.4"/>`;
      d += `<line x1="${vw-pad-5}" y1="${vh-pad-5}" x2="${vw/2}" y2="${pad+5}" stroke="#ccc" stroke-width="0.4"/>`;
      // Handle bottom center
      d += `<rect x="${vw/2-5}" y="${vh-pad-9}" width="10" height="3" rx="1" fill="#666"/>`;
      // Hinge top
      d += `<rect x="${vw/3}" y="${pad+2}" width="8" height="2" rx="1" fill="#888"/>`;
      d += `<rect x="${vw*2/3-8}" y="${pad+2}" width="8" height="2" rx="1" fill="#888"/>`;
    } else if (tipo === "FIS" || tipo === "FISTONDO") {
      // Fisso
      d += `<rect x="${pad+5}" y="${pad+5}" width="${iw-10}" height="${ih-10}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>`;
      // Glass dividers
      d += `<line x1="${vw/2}" y1="${pad+5}" x2="${vw/2}" y2="${vh-pad-5}" stroke="#ddd" stroke-width="0.3"/>`;
      d += `<line x1="${pad+5}" y1="${vh/2}" x2="${vw-pad-5}" y2="${vh/2}" stroke="#ddd" stroke-width="0.3"/>`;
      // "FISSO" label
      d += `<text x="${vw/2}" y="${vh/2+3}" text-anchor="middle" font-size="8" fill="#999" font-style="italic">fisso</text>`;
    } else if (tipo === "BLI") {
      // Porta blindata
      d += `<rect x="${pad+5}" y="${pad+5}" width="${iw-10}" height="${ih-10}" fill="#f5ece0" stroke="#555" stroke-width="0.7"/>`;
      // Panel details
      d += `<rect x="${pad+12}" y="${pad+15}" width="${iw-24}" height="${ih/4}" rx="2" fill="none" stroke="#987" stroke-width="0.5"/>`;
      d += `<rect x="${pad+12}" y="${vh/2-ih/8}" width="${iw-24}" height="${ih/4}" rx="2" fill="none" stroke="#987" stroke-width="0.5"/>`;
      // Handle
      d += `<rect x="${vw-pad-14}" y="${vh/2-8}" width="3" height="16" rx="1.5" fill="#666"/>`;
      // Lock
      d += `<circle cx="${vw-pad-12}" cy="${vh/2+14}" r="2.5" fill="none" stroke="#666" stroke-width="0.8"/>`;
    } else {
      // 1 anta standard (F1A, PF1A)
      d += `<rect x="${pad+5}" y="${pad+5}" width="${iw-10}" height="${ih-10}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>`;
      // Opening diagonals
      d += `<line x1="${pad+5}" y1="${pad+5}" x2="${vw-pad-5}" y2="${vh-pad-5}" stroke="#ccc" stroke-width="0.4"/>`;
      d += `<line x1="${vw-pad-5}" y1="${pad+5}" x2="${pad+5}" y2="${vh-pad-5}" stroke="#ccc" stroke-width="0.4"/>`;
      // Handle
      d += `<circle cx="${vw-pad-12}" cy="${vh/2}" r="3" fill="none" stroke="#333" stroke-width="1"/>`;
      d += `<line x1="${vw-pad-12}" y1="${vh/2-3}" x2="${vw-pad-12}" y2="${vh/2-10}" stroke="#333" stroke-width="1"/>`;
      // Hinges left
      d += `<rect x="${pad+2}" y="${vh/3}" width="2" height="8" rx="1" fill="#888"/>`;
      d += `<rect x="${pad+2}" y="${vh*2/3}" width="2" height="8" rx="1" fill="#888"/>`;
    }
    // Dimension labels
    d += `<text x="${vw/2}" y="${vh+10}" text-anchor="middle" font-size="8" fill="#333" font-weight="700">${w} mm</text>`;
    d += `<text x="${vw+6}" y="${vh/2+3}" text-anchor="start" font-size="8" fill="#333" font-weight="700" transform="rotate(90,${vw+6},${vh/2})">${h} mm</text>`;
    return `<svg viewBox="0 0 ${vw+14} ${vh+14}" width="160" style="display:block;margin:6px auto;">${d}</svg>`;
  };

  // Build grouped sections by sistema
  const vaniWithCalc = vaniPDF.map((v, i) => {
    const { tot: sub, mq, perim, sysRec, vetroRec, copRec, lamRec } = calcolaVanoPDF(v);
    const m = v.misure||{};
    const lmm = m.lCentro||0, hmm = m.hCentro||0;
    const colInt = v.coloreInt || v.coloreInterno || v.colore || "Bianco";
    const colEst = v.coloreEst || v.coloreEsterno || v.colore || "Bianco";
    const vetroDesc = vetroRec ? vetroRec.code + (vetroRec.nome ? " " + vetroRec.nome : "") : (v.vetro || "");
    const sysKey = sysRec ? sysRec.id : (v.sistema || "nessuno");
    const sysName = sysRec ? (sysRec.marca ? sysRec.marca.toUpperCase() + " - " + sysRec.sistema.toUpperCase() : sysRec.sistema.toUpperCase()) : (v.sistema ? v.sistema.toUpperCase() : "");
    const tipoCode = v.tipo || "F1A";
    const tipoLabel = TIPI_LABEL[tipoCode] || tipoCode;
    const acc = v.accessori || {};
    let specs = '';
    const addS = (l: string, val: string) => { if (val) specs += `<tr><td class="sl">${l}</td><td class="sv"><b>${val}</b></td></tr>`; };
    addS("Colore interno:", colInt);
    addS("Colore esterno:", colEst);
    if (v.bicolore) addS("Finitura:", "Bicolore");
    if (vetroDesc) addS("Vetro:", vetroDesc);
    if (v.maniglia) addS("Martellina:", v.maniglia);
    addS("Superficie:", mq.toFixed(2).replace(".",",") + " m\u00b2");
    if (v.rifilDx) addS("Sagoma telaio dx:", v.rifilDx);
    if (v.rifilSotto || v.sagomaInf) addS("Sagoma telaio inf:", v.rifilSotto || v.sagomaInf || "");
    if (v.rifilSopra || v.sagomaSup) addS("Sagoma telaio sup:", v.rifilSopra || v.sagomaSup || "");
    if (v.rifilSx) addS("Sagoma telaio sx:", v.rifilSx);
    if (v.telaio) addS("Telaio fisso:", v.telaio);
    if (v.telaioAlaZ) addS("Telaio mobile:", v.telaioAlaZ);
    if (copRec) addS("Coprifilo:", copRec.nome || copRec.cod);
    if (lamRec) addS("Lamiera:", lamRec.nome || lamRec.cod);
    addS("Trasmitt. termica:", (v.trasmittanzaUw || sysRec?.uw || "1,2") + " W/m\u00b2K");
    if (acc.tapparella?.attivo) addS("Tapparella:", (acc.tapparella.tipo || "PVC") + (acc.tapparella.colore ? " " + acc.tapparella.colore : ""));
    if (acc.persiana?.attivo) addS("Persiana:", (acc.persiana.tipo || "Alluminio"));
    if (acc.zanzariera?.attivo) addS("Zanzariera:", (acc.zanzariera.tipo || "Rullo"));
    if (v.note && !v.note.startsWith("\ud83d\udd34")) addS("Note:", v.note);
    // Voci libere
    if (v.vociLibere?.length > 0) {
      v.vociLibere.forEach(vl => {
        const vlTot = (vl.prezzo || 0) * (vl.qta || 1);
        const unitaLabel = { pz: "pz", mq: "mq", ml: "ml", kg: "kg", forfait: "forfait" }[vl.unita] || (typeof vl.unita === "string" ? vl.unita : "pz");
        addS("📦 " + (vl.descrizione || "Voce extra") + ":", `€${(parseFloat(vl.prezzo)||0).toFixed(2)}/${unitaLabel} × ${vl.qta||1} = <b style="color:#1a7f37">€${vlTot.toFixed(2)}</b>`);
      });
    }
    return { ...v, idx: i, sub, mq, sysKey, sysName, sysRec, tipoCode, tipoLabel, lmm, hmm, specs };
  });

  // Group by system
  const groups: Record<string, typeof vaniWithCalc> = {};
  vaniWithCalc.forEach(v => {
    const k = String(v.sysKey);
    if (!groups[k]) groups[k] = [];
    groups[k].push(v);
  });

  // Build HTML sections
  let globalIdx = 0;
  const sectionsHtml = Object.entries(groups).map(([key, vani]) => {
    const sys = vani[0].sysRec;
    const sysName = vani[0].sysName || "Senza sistema assegnato";
    const subTot = vani.reduce((s, v) => s + v.sub, 0);
    const subMq = vani.reduce((s, v) => s + v.mq, 0);

    // System header with profile image
    const sysHeader = `<div style="margin-top:16px;margin-bottom:8px;padding:10px 14px;background:#f5f8fc;border:1.5px solid #0066cc30;border-radius:6px;display:flex;align-items:center;gap:14px;page-break-inside:avoid">
      ${sys?.immagineProfilo ? `<img src="${sys.immagineProfilo}" style="height:65px;max-width:140px;object-fit:contain;border-radius:4px;background:#fff;padding:4px;border:1px solid #ddd" alt=""/>` : `<div style="width:60px;height:60px;background:#e8f0fe;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:28px">🪟</div>`}
      <div style="flex:1">
        <div style="font-size:14px;font-weight:900;color:#0066cc;letter-spacing:-0.3px">${sysName}</div>
        ${sys ? `<div style="font-size:9px;color:#666;margin-top:2px">${sys.euroMq ? "€" + sys.euroMq + "/m² base" : ""} ${sys.uw ? " · Uw " + sys.uw + " W/m²K" : ""}</div>` : ""}
        <div style="font-size:9px;color:#888;margin-top:1px">${vani.length} element${vani.length > 1 ? "i" : "o"} · ${subMq.toFixed(2).replace(".",",")} m²</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:900;color:#1a1a1c">&euro; ${fmt(subTot)}</div>
        <div style="font-size:8px;color:#888">subtotale</div>
      </div>
    </div>`;

    // Vani rows
    const rows = vani.map(v => {
      globalIdx++;
      return `<div style="display:flex;gap:10px;padding:10px 8px;border-bottom:1px solid #eee;page-break-inside:avoid">
        <div style="width:180px;text-align:center;flex-shrink:0">
          <div style="font-size:22px;font-weight:900;color:#0066cc;margin-bottom:2px">${String(globalIdx).padStart(2,"0")}</div>
          ${drawSVG(v.tipoCode, v.lmm, v.hmm)}
          <div style="font-size:7.5px;color:#999;font-style:italic;margin-top:1px">Vista interna</div>
          <div style="font-size:9px;font-weight:700;color:#333;margin-top:2px">${v.tipoLabel}</div>
          ${v.stanza ? `<div style="font-size:8px;color:#888">${v.stanza}${v.piano ? ", " + v.piano : ""}</div>` : ""}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
            <div style="font-size:11px;font-weight:700">${v.lmm} × ${v.hmm} mm</div>
            <div style="font-size:12px;font-weight:900;color:#1a1a1c">&euro; ${fmt(v.sub)}</div>
          </div>
          <table class="st"><tbody>${v.specs}</tbody></table>
          ${Object.values(v.foto || {}).filter(f => f.tipo === "foto" && f.dataUrl).length > 0 ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${Object.values(v.foto || {}).filter(f => f.tipo === "foto" && f.dataUrl).slice(0, 4).map(f => `<img src="${f.dataUrl}" style="width:60px;height:45px;object-fit:cover;border-radius:3px;border:1px solid #ddd" alt=""/>`).join("")}${Object.values(v.foto || {}).filter(f => f.tipo === "foto" && f.dataUrl).length > 4 ? `<div style="width:60px;height:45px;background:#f0f0f0;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#666">+${Object.values(v.foto || {}).filter(f => f.tipo === "foto" && f.dataUrl).length - 4}</div>` : ""}</div>` : ""}
        </div>
      </div>`;
    }).join("");

    return sysHeader + `<div style="border:1px solid #ddd;border-radius:4px;overflow:hidden;margin-bottom:6px">${rows}</div>`;
  }).join("");

  // Extra rows (trasporto etc)
  let extraHtml = '';
  if (c.trasporto && parseFloat(c.trasporto) > 0) {
    extraHtml = `<div style="margin-top:8px;padding:10px 14px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:11px;font-weight:700">🚛 Trasporto</div><div style="font-size:9px;color:#666">${c.trasportoNote || "Trasporto e scarico"}</div></div>
      <div style="font-size:12px;font-weight:900">&euro; ${fmt(parseFloat(c.trasporto))}</div>
    </div>`;
  }

  // ── Voci libere commessa ──────────────────────────────────────────────────
  let vociLibereHtml = '';
  if (c.vociLibere && c.vociLibere.length > 0) {
    const righe = c.vociLibere.map((vl: any) => {
      const vlTot = (vl.importo || vl.prezzo || 0) * (vl.qta || 1);
      const unitaMap: Record<string,string> = { pz:"pz", mq:"mq", ml:"ml", kg:"kg", forfait:"forfait" };
      const uLabel = unitaMap[vl.unita] || (typeof vl.unita === "string" ? vl.unita : "pz");
      return `<div style="margin-top:6px;padding:10px 14px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:11px;font-weight:700">${vl.descrizione || "Voce extra"}</div>
          <div style="font-size:9px;color:#666">${(vl.importo || vl.prezzo || 0).toFixed(2)} &euro;/${uLabel} &times; ${vl.qta || 1}</div>
        </div>
        <div style="font-size:12px;font-weight:900">&euro; ${fmt(vlTot)}</div>
      </div>`;
    }).join('');
    vociLibereHtml = `<div style="margin-top:8px">
      <div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;padding:0 2px">Accessori e voci aggiuntive</div>
      ${righe}
    </div>`;
  }

  const scontoRow = sconto > 0 ? `<tr><td class="tl" style="color:#D08008">Sconto ${sconto}%</td><td class="tv" style="color:#D08008">&minus; ${fmt(scontoVal)}</td></tr>` : '';
  const noteHtml = c.notePreventivo ? `<div style="border:1px solid #ddd;padding:10px 12px;margin:10px 0;font-size:9.5px;color:#444;line-height:1.5"><b>Note:</b> ${c.notePreventivo}</div>` : '';
  const firmaHtml = c.firmaCliente ? `<img src="${c.firmaCliente}" style="max-height:55px;max-width:100%;display:block;margin:0 auto 4px"/>` : '<div style="border-bottom:1px solid #666;height:45px;margin-bottom:4px"></div>';

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/><title>Preventivo ${c.code}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:12mm 10mm 15mm 10mm}
body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#1a1a1c;font-size:10px;line-height:1.35;background:#fff}
.pg{max-width:210mm;margin:0 auto;padding:12px 16px}
/* HEADER */
.hd{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;margin-bottom:14px;border-bottom:3px solid #0066cc}
.an{font-size:20px;font-weight:900;color:#0066cc;letter-spacing:-0.3px}
.ai{font-size:9px;color:#555;line-height:1.6}
/* CLIENT */
.cl-s{margin-bottom:12px;display:flex;justify-content:space-between}
.cl-l{font-size:9px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.cl-n{font-size:13px;font-weight:800}
.cl-a{font-size:10px;color:#555}
.pi{font-size:10px;line-height:1.6}.pi b{color:#0066cc}
.intro{font-size:10px;color:#444;margin:10px 0 8px;font-style:italic}
/* TABLE */
.pt{width:100%;border-collapse:collapse;margin-bottom:8px;border:1px solid #ccc}
.pt thead th{background:#f0f0f0;border:1px solid #ccc;padding:5px 7px;font-size:8.5px;font-weight:700;text-transform:uppercase;color:#444;text-align:center}
.ir{border-bottom:1px solid #ddd}.ir2{border-bottom:1.5px solid #aaa}
.cn{width:150px;padding:8px;vertical-align:top;border-right:1px solid #ddd;text-align:center}
.n0{font-size:26px;font-weight:900;color:#0066cc;margin-bottom:4px}
.cv{font-size:7.5px;color:#999;font-style:italic;margin-top:2px}
.ct{font-size:9px;font-weight:700;color:#333;margin-top:3px;text-transform:uppercase}
.cs{font-size:8px;color:#888}
.csys{font-size:8px;font-weight:700;color:#0066cc;margin-top:2px;line-height:1.2}
.cd{padding:5px 7px;vertical-align:top;border-bottom:1px solid #eee}
.dv{font-size:11px;font-weight:700}
.cp,.cq,.ce{width:70px;padding:5px 7px;text-align:right;vertical-align:top;border-left:1px solid #ddd;font-size:10px}
.ce{font-weight:800}
.csp{padding:0 7px 7px;border-bottom:none}
.st{border-collapse:collapse;width:100%}
.st td{padding:1.5px 5px;font-size:9.5px;vertical-align:top}
.st .sl{color:#666;width:130px;white-space:nowrap}
.st .sv b{font-weight:700;color:#1a1a1c}
/* TOTALS */
.ts{margin-top:4px;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
.qi{font-size:10px;color:#555;padding-top:6px}.qi b{color:#1a1a1c}
.tt{border-collapse:collapse;min-width:250px}
.tt td{padding:4px 10px;font-size:10px}
.tl{text-align:right;color:#555;border:1px solid #ddd;background:#fafafa}
.tv{text-align:right;font-weight:700;border:1px solid #ddd;min-width:85px}
.tf .tl,.tf .tv{font-size:14px;font-weight:900;background:#f0f0f0;border:2px solid #333}
.tf .tv{color:#0066cc}
/* CONDIZIONI */
.ct2{font-size:10px;font-weight:800;text-transform:uppercase;text-align:center;margin:14px 0 8px;letter-spacing:.5px}
.cst{font-size:9px;font-weight:700;text-align:center;margin-bottom:6px;color:#555}
.ctx{font-size:9px;color:#444;line-height:1.6;margin-bottom:8px}.ctx b{color:#1a1a1c}
/* FIRMA */
.fs{display:flex;gap:36px;margin-top:20px;padding-top:14px;border-top:1.5px solid #ccc}
.fb{flex:1;text-align:center}.fl{font-size:8.5px;color:#555}
/* FOOTER */
.ft{margin-top:14px;padding:10px 0;border-top:2px solid #0066cc;display:flex;justify-content:space-between;font-size:8px;color:#888}
.ft b{color:#555}
/* PRINT */
.pb{display:block;margin:0 auto 12px;padding:10px 28px;background:#0066cc;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
@media print{.pb{display:none!important}.pg{padding:0;margin:0}}
</style></head><body>
<div class="pg">
<button class="pb" onclick="window.print()">\ud83d\udda8\ufe0f Stampa / Salva PDF</button>

<div class="hd">
<div>
  ${az.logo?`<img src="${az.logo}" style="height:48px;max-width:120px;object-fit:contain;margin-bottom:6px;display:block" alt=""/>`:''}
  <div class="an">${az.ragione||"La Tua Azienda"}</div>
  <div class="ai">${az.indirizzo||""}<br/>Tel. ${az.telefono||""}${az.email?" &middot; "+az.email:""}${az.piva?"<br/>P.IVA "+az.piva:""}${az.cciaa?" &middot; REA "+az.cciaa:""}${(az as any).pec?"<br/>PEC: "+(az as any).pec:""}</div>
</div>
<div style="text-align:right">

</div>
</div>

<div class="cl-s">
<div>
  <div class="cl-l">Spett.le</div>
  <div class="cl-n">${c.cliente} ${c.cognome||""}</div>
  <div class="cl-a">${c.indirizzo||""}</div>
  ${c.telefono?`<div class="cl-a">Tel. ${c.telefono}</div>`:""}
  ${c.email?`<div class="cl-a">${c.email}</div>`:""}
</div>
<div style="text-align:right">
  <div class="pi">Preventivo n. <b>${c.code.replace("CM-","")}</b></div>
  <div class="pi">Riferimento ordine <b>${c.cliente} ${c.cognome||""}</b></div>
  <div class="pi">Data: <b>${oggi}</b></div>
</div>
</div>

<div class="intro">A seguito della Vostra gentile richiesta Vi rimettiamo il presente preventivo:</div>

${sectionsHtml}
${extraHtml}
${vociLibereHtml}

<div class="ts">
<div class="qi">Quadratura: <b>${totalMq.toFixed(2).replace(".",",")} m&sup2;</b></div>
<table class="tt">
  <tr><td class="tl">Imponibile:</td><td class="tv">${fmt(imponibile)}</td></tr>
  ${scontoRow}
  <tr><td class="tl">I.V.A. ${ivaPerc}%:</td><td class="tv">${fmt(iva)}</td></tr>
  <tr class="tf"><td class="tl">Totale iva inclusa:</td><td class="tv">&euro; ${fmt(totIva)}</td></tr>
</table>
</div>

${noteHtml}

${(() => {
const nl2br = (s: string) => s.replace(/\n/g, "<br/>");
const defFornitura = (az.ragione?az.ragione.toUpperCase():"L'AZIENDA") + ", NELL'ESECUZIONE DELLA PRODUZIONE E' GARANTE DELL'OSSERVANZA SCRUPOLOSA DELLA REGOLA D'ARTE E DELLE NORME VIGENTI.";
const defPagamento = "<b>1. Pagamento</b><br/>&middot; 50% acconto alla firma del contratto previa ricezione di ns fattura di acconto<br/>&middot; 50% a SALDO, se non diversamente autorizzato a mezzo mail, a comunicazione merce pronta previa ricezione ns fattura a saldo fornitura.";
const defConsegna = "<b>2. Tempi di consegna per tipologia di prodotto:</b><br/>&middot; PVC: BATTENTE STANDARD 30 GG.<br/>&middot; PVC: PORTE 35 GG.<br/>&middot; PVC: ALZANTI SCORREVOLI 40 GG.<br/>&middot; PVC: SCORREVOLE PARALLELO/RIBALTA E SCORRE 35 GG.<br/>&middot; PVC: FUORI SQUADRO 50 GG.<br/>&middot; ALLUMINIO: 45/50 GG LAVORATIVI.<br/><br/>Il contratto aggiornato datato e sottoscritto dal cliente con accettazione dei disegni tecnici allegati ed avviato dopo aver avviato l'ordine al fornitore dei materiali, non potranno pi&ugrave; essere accettate variazioni di alcun tipo.";
const defContratto = "(I prezzi si intendono IVA esclusa)<br/><br/><b>1. Qualificazione giuridica del contratto</b><br/>Il contratto &egrave; ad ogni utile effetto di legge una compravendita in quanto la fornitura del materiale &egrave; prevalente.<br/><br/><b>2. Conclusione del contratto</b><br/>Il presente contratto si conclude con la sua sottoscrizione da parte dell'Acquirente e del Venditore.<br/><br/><b>3. Misure</b><br/>L'Acquirente &egrave; responsabile nel caso in cui abbia dato misure inesatte o non abbia comunicato tempestivamente variazioni.<br/><br/><b>4. Consegna</b><br/>La data di consegna ha natura meramente indicativa e non tassativa.<br/><br/><b>5. Garanzia</b><br/>I manufatti sono coperti da garanzia a norma di legge.<br/><br/><b>6. Trattamento dati</b><br/>Il trattamento dei dati personali viene svolto nel rispetto del D. Lgs. n. 196/2003.";
const defDettagli = (vaniPDF.length > 0 && vaniPDF[0].sistema ? "Telai e strutture di manovra, sistema " + vaniPDF[0].sistema + ", colorazione \"" + (vaniPDF[0].coloreInt || vaniPDF[0].coloreEst || vaniPDF[0].colore || "Bianco") + "\"." : "Come da specifiche indicate per ogni singola voce del preventivo.") + "<br/><br/><b>Documenti da allegare alla consegna:</b><br/>- Dichiarazione di Prestazione;<br/>- Dichiarazione energetica;<br/>- Etichetta CE;<br/>- Manuale d'uso e manutenzione.";

const txFornitura = az.condFornitura ? nl2br(az.condFornitura) : defFornitura;
const txPagamento = az.condPagamento ? nl2br(az.condPagamento) : defPagamento;
const txConsegna = az.condConsegna ? nl2br(az.condConsegna) : defConsegna;
const txContratto = az.condContratto ? nl2br(az.condContratto) : defContratto;
const txDettagli = az.condDettagli ? nl2br(az.condDettagli) : defDettagli;

return `
<div class="ct2">CONDIZIONI GENERALI DI FORNITURA:</div>
<div class="ctx">${txFornitura}</div>

<div class="cst">CONDIZIONI PAGAMENTO E CONSEGNA (parte del preventivo)</div>
<div class="ctx">${txPagamento}<br/><br/>${txConsegna}</div>

<div class="ct2">CONDIZIONI GENERALI DI CONTRATTO</div>
<div class="ctx">${txContratto}</div>

<div class="ctx" style="margin-top:10px">
<b>Dettagli tecnici:</b><br/>
${txDettagli}<br/><br/>
${az.indirizzo ? (az.indirizzo.split(",").pop()?.trim() || "") + ", " : ""}${oggi}<br/><br/>
<div style="text-align:right;font-style:italic">Distinti saluti.</div>
</div>`;
})()}

<div class="fs">
<div class="fb"><div style="border-bottom:1px solid #666;height:45px;margin-bottom:4px"></div><div class="fl">Firma tecnico / Timbro azienda</div></div>
<div class="fb">${firmaHtml}<div class="fl">Firma cliente per accettazione${c.dataFirma?" &mdash; "+c.dataFirma:""}</div></div>
</div>

<div class="ft">
<div><b>Indirizzo:</b><br/>${az.indirizzo||""}</div>
<div><b>Contatti:</b><br/>Tel. ${az.telefono||""}${az.email?"<br/>"+az.email:""}</div>
<div><b>Dati Aziendali:</b><br/>${az.ragione||""}${az.piva?"<br/>P.IVA "+az.piva:""}${az.iban?"<br/>IBAN: "+az.iban:""}</div>
</div>
<div style="text-align:center;font-size:7px;color:#bbb;margin-top:6px">Documento generato con MASTRO ERP &mdash; mastro.app</div>
</div>
</body></html>`;

  const blob = new Blob([html], {type:"text/html"});
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

// ═══ PDF MISURE (per produzione) ═══
export const generaPDFMisure = (c: any, deps: PdfDeps) => {
  const az = deps.aziendaDB;
  const vani = getVaniAttivi(c);
  const fmt = (n) => n.toLocaleString("it-IT", { minimumFractionDigits: 2 });

  const vaniHtml = vani.map((v, i) => {
    const m = v.misure || {};
    const fotoEntries = Object.entries(v.foto || {}).filter(([, f]) => f.tipo === "foto" && f.dataUrl);
    const tip = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo);
    const lmm = m.lCentro || m.lAlto || m.lBasso || 0;
    const hmm = m.hCentro || m.hSx || m.hDx || 0;
    const mq = lmm > 0 && hmm > 0 ? ((lmm / 1000) * (hmm / 1000)) : 0;

    return `<div style="border:1.5px solid #333;border-radius:6px;padding:12px;margin-bottom:10px;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:8px">
        <div>
          <span style="font-size:18px;font-weight:900;color:#0066cc">${String(i + 1).padStart(2, "0")}</span>
          <span style="font-size:14px;font-weight:800;margin-left:8px">${v.nome}</span>
          <span style="font-size:11px;color:#666;margin-left:8px">${tip?.label || v.tipo} · ${v.stanza || ""} · ${v.piano || ""}</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:900">${lmm} × ${hmm} mm</div>
          <div style="font-size:10px;color:#666">${mq.toFixed(2)} m² ${(v.pezzi || 1) > 1 ? "× " + v.pezzi + " pz" : ""}</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:10px">
        <tr>
          <td style="border:1px solid #ccc;padding:4px;background:#f0f8ff;font-weight:700;width:50%" colspan="2">📏 LARGHEZZE (mm)</td>
          <td style="border:1px solid #ccc;padding:4px;background:#fff8f0;font-weight:700;width:50%" colspan="2">📐 ALTEZZE (mm)</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:4px">Alto</td><td style="border:1px solid #ccc;padding:4px;font-weight:700;font-family:monospace">${m.lAlto || "—"}</td>
          <td style="border:1px solid #ccc;padding:4px">Sinistra</td><td style="border:1px solid #ccc;padding:4px;font-weight:700;font-family:monospace">${m.hSx || "—"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:4px">Centro</td><td style="border:1px solid #ccc;padding:4px;font-weight:700;font-family:monospace">${m.lCentro || "—"}</td>
          <td style="border:1px solid #ccc;padding:4px">Centro</td><td style="border:1px solid #ccc;padding:4px;font-weight:700;font-family:monospace">${m.hCentro || "—"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:4px">Basso</td><td style="border:1px solid #ccc;padding:4px;font-weight:700;font-family:monospace">${m.lBasso || "—"}</td>
          <td style="border:1px solid #ccc;padding:4px">Destra</td><td style="border:1px solid #ccc;padding:4px;font-weight:700;font-family:monospace">${m.hDx || "—"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:4px;background:#fef3f3" colspan="2">↗ Diag 1: <b>${m.d1 || "—"}</b></td>
          <td style="border:1px solid #ccc;padding:4px;background:#fef3f3" colspan="2">↘ Diag 2: <b>${m.d2 || "—"}</b> ${m.d1 > 0 && m.d2 > 0 ? `(Δ ${Math.abs(m.d1 - m.d2)} mm${Math.abs(m.d1 - m.d2) > 3 ? " ⚠️" : " ✅"})` : ""}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px">
        <tr>
          <td style="border:1px solid #ccc;padding:4px;background:#f0fff0;font-weight:700" colspan="4">⚙️ CONFIGURAZIONE</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:4px">Sistema</td><td style="border:1px solid #ccc;padding:4px;font-weight:700">${v.sistema || "—"}</td>
          <td style="border:1px solid #ccc;padding:4px">Vetro</td><td style="border:1px solid #ccc;padding:4px;font-weight:700">${v.vetro || "—"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:4px">Colore INT</td><td style="border:1px solid #ccc;padding:4px;font-weight:700">${v.coloreInt || "—"}</td>
          <td style="border:1px solid #ccc;padding:4px">Colore EST</td><td style="border:1px solid #ccc;padding:4px;font-weight:700">${v.bicolore ? (v.coloreEst || "—") : "= INT"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:4px">Telaio</td><td style="border:1px solid #ccc;padding:4px;font-weight:700">${v.telaio === "Z" ? "Z" : v.telaio === "L" ? "L" : "—"}${v.telaioAlaZ ? " Ala " + v.telaioAlaZ : ""}</td>
          <td style="border:1px solid #ccc;padding:4px">Coprifilo</td><td style="border:1px solid #ccc;padding:4px;font-weight:700">${v.coprifilo || "—"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:4px">Lamiera</td><td style="border:1px solid #ccc;padding:4px;font-weight:700">${v.lamiera || "—"}</td>
          <td style="border:1px solid #ccc;padding:4px">Col. Acc.</td><td style="border:1px solid #ccc;padding:4px;font-weight:700">${v.coloreAcc || "= profili"}</td>
        </tr>
        ${v.rifilato ? `<tr><td style="border:1px solid #ccc;padding:4px;background:#fff8e6" colspan="4">✂️ RIFILATO — Sx: ${v.rifilSx || "—"} · Dx: ${v.rifilDx || "—"} · Sopra: ${v.rifilSopra || "—"} · Sotto: ${v.rifilSotto || "—"}</td></tr>` : ""}
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px">
        <tr>
          <td style="border:1px solid #ccc;padding:4px;background:#f5f0ff;font-weight:700" colspan="4">🧱 MURATURA</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:3px">Sp. Sx</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${m.spSx || "—"}</td>
          <td style="border:1px solid #ccc;padding:3px">Sp. Dx</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${m.spDx || "—"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:3px">Sp. Sopra</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${m.spSopra || "—"}</td>
          <td style="border:1px solid #ccc;padding:3px">Imbotte</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${m.imbotte || "—"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ccc;padding:3px">Dav. Prof.</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${m.davProf || "—"}</td>
          <td style="border:1px solid #ccc;padding:3px">Dav. Sporg.</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${m.davSporg || "—"}</td>
        </tr>
        <tr><td style="border:1px solid #ccc;padding:3px">Soglia</td><td style="border:1px solid #ccc;padding:3px;font-weight:700" colspan="3">${m.soglia || "—"}</td></tr>
      </table>
      ${v.controtelaio?.tipo ? `<table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px">
        <tr><td style="border:1px solid #ccc;padding:4px;background:#e8f4fd;font-weight:700" colspan="4">🔲 CONTROTELAIO ${(v.controtelaio.tipo || "").toUpperCase()}</td></tr>
        <tr><td style="border:1px solid #ccc;padding:3px">L</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${v.controtelaio.l || "—"}</td><td style="border:1px solid #ccc;padding:3px">H</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${v.controtelaio.h || "—"}</td></tr>
        ${v.controtelaio.hCass ? `<tr><td style="border:1px solid #ccc;padding:3px">H Cass.</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${v.controtelaio.hCass}</td><td style="border:1px solid #ccc;padding:3px">Sezione</td><td style="border:1px solid #ccc;padding:3px;font-weight:700">${v.controtelaio.sezione || "—"}</td></tr>` : ""}
      </table>` : ""}
      ${v.accessori?.tapparella?.attivo || v.accessori?.persiana?.attivo || v.accessori?.zanzariera?.attivo ? `<div style="font-size:10px;margin-top:4px;padding:4px;background:#f5f5ff;border:1px solid #ddd;border-radius:3px">
        <b>Accessori:</b> ${v.accessori?.tapparella?.attivo ? "🪟 Tapparella" : ""} ${v.accessori?.persiana?.attivo ? "🏠 Persiana" : ""} ${v.accessori?.zanzariera?.attivo ? "🦟 Zanzariera" : ""}
      </div>` : ""}
      ${fotoEntries.length > 0 ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${fotoEntries.slice(0, 6).map(([, f]) => `<img src="${f.dataUrl}" style="width:70px;height:52px;object-fit:cover;border-radius:3px;border:1px solid #ccc" alt=""/>`).join("")}</div>` : ""}
      ${v.note ? `<div style="font-size:10px;margin-top:4px;padding:4px;background:#fff8e6;border:1px solid #f0e0b0;border-radius:3px">📝 <b>Note:</b> ${v.note}</div>` : ""}
      ${v.difficoltaSalita ? `<div style="font-size:10px;margin-top:3px;color:#b45309">🏗 Accesso: ${v.difficoltaSalita}${v.mezzoSalita ? " — " + v.mezzoSalita : ""}</div>` : ""}
    </div>`;
  }).join("");

  const totalMq = vani.reduce((s, v) => {
    const m = v.misure || {};
    const l = m.lCentro || m.lAlto || m.lBasso || 0;
    const h = m.hCentro || m.hSx || m.hDx || 0;
    return s + (l > 0 && h > 0 ? (l / 1000) * (h / 1000) * (v.pezzi || 1) : 0);
  }, 0);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Misure — ${c.code}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:15px;font-size:11px}
    @media print{body{padding:5px} .no-print{display:none!important}}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #333;padding-bottom:10px;margin-bottom:12px}
  </style></head><body>
  <div class="header">
    <div>
      ${az.logo ? `<img src="${az.logo}" style="max-height:50px;max-width:180px;margin-bottom:4px" alt=""/>` : ""}
      <div style="font-size:16px;font-weight:900;color:#333">${az.nome || "MASTRO"}</div>
      <div style="font-size:9px;color:#666">${az.indirizzo || ""} ${az.citta || ""} · ${az.tel || ""}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:900;color:#5856d6">SCHEDA MISURE</div>
      <div style="font-size:11px;color:#333;margin-top:2px"><b>${c.code}</b></div>
      <div style="font-size:10px;color:#666">${new Date().toLocaleDateString("it-IT")}</div>
    </div>
  </div>
  <div style="display:flex;gap:16px;margin-bottom:12px;padding:10px;background:#f5f5f7;border-radius:6px">
    <div style="flex:1"><div style="font-size:8px;color:#999;text-transform:uppercase">Cliente</div><div style="font-size:13px;font-weight:800">${c.cliente}</div></div>
    <div style="flex:1"><div style="font-size:8px;color:#999;text-transform:uppercase">Indirizzo</div><div style="font-size:11px">${c.indirizzo || "—"}</div></div>
    <div><div style="font-size:8px;color:#999;text-transform:uppercase">Vani</div><div style="font-size:13px;font-weight:800">${vani.length}</div></div>
    <div><div style="font-size:8px;color:#999;text-transform:uppercase">Tot. m²</div><div style="font-size:13px;font-weight:800">${totalMq.toFixed(2)}</div></div>
  </div>
  ${vaniHtml}
  <div style="margin-top:12px;padding:10px;background:#f9f9f9;border:1px solid #ddd;border-radius:6px;font-size:10px;color:#666;text-align:center">
    Documento generato da MASTRO ERP — ${new Date().toLocaleDateString("it-IT")} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
    <br><b style="color:#333">⚠ DOCUMENTO PER USO INTERNO / PRODUZIONE — NON VALIDO COME PREVENTIVO</b>
  </div>
  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;padding:12px 24px;background:#5856d6;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(88,86,214,0.3)">🖨️ Stampa / Salva PDF</button>
  </body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

// ═══ FATTURA PDF ═══
export const generaFatturaPDF = (fat: any, deps: PdfDeps) => {
  const az = deps.aziendaDB;
  const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fattura ${fat.numero}/${fat.anno}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;font-size:12px;color:#333}
    @media print{.no-print{display:none!important}body{padding:10px}}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #ccc;padding:8px;text-align:left}
    th{background:#f5f8fc;font-size:10px;text-transform:uppercase;color:#666}
    .totale{font-size:16px;font-weight:900}
  </style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
    <div>
      ${az.logo ? `<img src="${az.logo}" style="max-height:60px;max-width:200px;margin-bottom:6px" alt=""/>` : ""}
      <div style="font-size:18px;font-weight:900">${az.nome || "MASTRO"}</div>
      <div style="font-size:10px;color:#666">${az.indirizzo || ""} · ${az.citta || ""}</div>
      <div style="font-size:10px;color:#666">P.IVA: ${az.piva || "—"} · Tel: ${az.tel || "—"}</div>
      ${az.pec ? `<div style="font-size:10px;color:#666">PEC: ${az.pec}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div style="font-size:24px;font-weight:900;color:#007aff">FATTURA</div>
      <div style="font-size:14px;font-weight:700">N. ${fat.numero}/${fat.anno}</div>
      <div style="font-size:11px;color:#666">Data: ${fat.data}</div>
      <div style="font-size:10px;color:#999;margin-top:4px">${fat.tipo === "acconto" ? "ACCONTO" : fat.tipo === "saldo" ? "SALDO" : "FATTURA"}</div>
    </div>
  </div>
  <div style="background:#f5f5f7;padding:14px;border-radius:8px;margin-bottom:16px">
    <div style="font-size:9px;color:#999;text-transform:uppercase;margin-bottom:4px">Destinatario</div>
    <div style="font-size:14px;font-weight:800">${fat.cliente} ${fat.cognome}</div>
    <div style="font-size:11px">${fat.indirizzo || ""}</div>
    ${fat.cf ? `<div style="font-size:10px;color:#666">C.F.: ${fat.cf}</div>` : ""}
    ${fat.piva ? `<div style="font-size:10px;color:#666">P.IVA: ${fat.piva}</div>` : ""}
    ${fat.sdi ? `<div style="font-size:10px;color:#666">SDI: ${fat.sdi}</div>` : ""}
    ${fat.pec ? `<div style="font-size:10px;color:#666">PEC: ${fat.pec}</div>` : ""}
    <div style="font-size:10px;color:#666;margin-top:4px">Rif. commessa: ${fat.cmCode}</div>
  </div>
  <table>
    <thead><tr><th>Descrizione</th><th style="width:80px;text-align:right">Imponibile</th><th style="width:60px;text-align:right">IVA %</th><th style="width:80px;text-align:right">IVA</th><th style="width:90px;text-align:right">Totale</th></tr></thead>
    <tbody>
      <tr>
        <td>Fornitura e posa serramenti${fat.tipo === "acconto" ? " — Acconto 50%" : fat.tipo === "saldo" ? " — Saldo" : ""}<br><span style="font-size:10px;color:#666">${fat.note || ""}</span></td>
        <td style="text-align:right;font-weight:700">&euro; ${fmt(fat.imponibile)}</td>
        <td style="text-align:right">${fat.iva}%</td>
        <td style="text-align:right">&euro; ${fmt(fat.ivaAmt)}</td>
        <td style="text-align:right;font-weight:900;font-size:14px">&euro; ${fmt(fat.importo)}</td>
      </tr>
    </tbody>
  </table>
  <div style="text-align:right;margin-top:12px;padding:12px;background:#f0f8ff;border-radius:8px">
    <div style="font-size:10px;color:#666">Imponibile: &euro; ${fmt(fat.imponibile)}</div>
    <div style="font-size:10px;color:#666">IVA ${fat.iva}%: &euro; ${fmt(fat.ivaAmt)}</div>
    <div class="totale" style="margin-top:6px;color:#007aff">TOTALE: &euro; ${fmt(fat.importo)}</div>
  </div>
  <div style="margin-top:16px;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:10px;color:#666">
    <b>Modalità pagamento:</b> Bonifico bancario<br>
    <b>IBAN:</b> ${az.iban || "________________"}<br>
    <b>Scadenza:</b> ${fat.scadenza || "30 giorni data fattura"}<br>
    ${fat.note ? `<b>Note:</b> ${fat.note}` : ""}
  </div>
  <div style="margin-top:20px;text-align:center;font-size:9px;color:#999">Documento generato da MASTRO ERP</div>
  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;padding:12px 24px;background:#007aff;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">🖨️ Stampa / Salva PDF</button>
  </body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  window.open(URL.createObjectURL(blob), "_blank");
};

// ═══ ORDINE FORNITORE PDF ═══
export const generaOrdinePDF = (ord: any, deps: PdfDeps) => {
  const az = deps.aziendaDB;
  const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";
  const imponibile = ord.totale;
  const ivaVal = imponibile * ord.iva / 100;
  const scontoPerc = ord.sconto || 0;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1c;padding:20px;max-width:800px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #1a1a1c}
    .title{font-size:20px;font-weight:800;letter-spacing:-0.3px}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f5f5f7;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ddd}
    td{padding:8px 10px;border-bottom:1px solid #eee}
    .total-row td{font-weight:700;border-top:2px solid #1a1a1c;border-bottom:none}
    .box{background:#f9f9fb;border-radius:8px;padding:14px;margin-bottom:12px}
    .sign-area{margin-top:40px;display:flex;justify-content:space-between}
    .sign-box{width:45%;border-top:1px solid #aaa;padding-top:8px;text-align:center;font-size:10px;color:#888}
    @media print{body{padding:10px}}
  </style></head><body>

  <div class="header">
    <div>
      ${az.logo ? `<img src="${az.logo}" style="max-height:45px;margin-bottom:6px" /><br>` : ""}
      <div class="title">${az.nome || "MASTRO"}</div>
      <div style="font-size:10px;color:#666;margin-top:2px">${az.indirizzo || ""}<br>${az.tel || ""} · ${az.email || ""}<br>${az.piva ? "P.IVA " + az.piva : ""}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:16px;font-weight:800;color:#007aff">ORDINE FORNITORE</div>
      <div style="font-size:12px;font-weight:700">N. ${ord.numero}/${ord.anno}</div>
      <div style="font-size:10px;color:#666">Data: ${new Date(ord.dataOrdine).toLocaleDateString("it-IT")}</div>
      <div style="font-size:10px;color:#666">Rif. Commessa: ${ord.cmCode}</div>
    </div>
  </div>

  <div style="display:flex;gap:16px;margin-bottom:16px">
    <div class="box" style="flex:1">
      <div style="font-size:9px;text-transform:uppercase;color:#888;letter-spacing:1px;margin-bottom:6px">Fornitore</div>
      <div style="font-size:14px;font-weight:700">${ord.fornitore.nome || "—"}</div>
      ${ord.fornitore.referente ? `<div>Att.ne: ${ord.fornitore.referente}</div>` : ""}
      ${ord.fornitore.email ? `<div>${ord.fornitore.email}</div>` : ""}
      ${ord.fornitore.tel ? `<div>${ord.fornitore.tel}</div>` : ""}
      ${ord.fornitore.piva ? `<div>P.IVA: ${ord.fornitore.piva}</div>` : ""}
    </div>
    <div class="box" style="flex:1">
      <div style="font-size:9px;text-transform:uppercase;color:#888;letter-spacing:1px;margin-bottom:6px">Consegna</div>
      <div style="font-size:12px;font-weight:600">${ord.consegna.luogo || "Da definire"}</div>
      ${ord.consegna.prevista ? `<div>📅 Prevista: ${new Date(ord.consegna.prevista).toLocaleDateString("it-IT")}</div>` : ""}
      ${ord.consegna.settimane ? `<div>⏱ Produzione: ${ord.consegna.settimane} settimane</div>` : ""}
      <div style="margin-top:4px;font-size:10px;color:#888">Pagamento: ${ord.pagamento.termini === "anticipato" ? "Anticipato" : ord.pagamento.termini === "30gg_fm" ? "30gg FM" : ord.pagamento.termini === "60gg_fm" ? "60gg FM" : ord.pagamento.termini === "90gg_fm" ? "90gg FM" : "A ricevimento merce"}</div>
    </div>
  </div>

  <div style="font-size:12px;font-weight:700;margin-bottom:4px">Cliente finale: ${ord.cliente}</div>

  <table>
    <tr><th style="width:5%">#</th><th style="width:40%">Descrizione</th><th style="width:12%">Misure</th><th style="width:8%">Qtà</th><th style="width:15%">Prezzo Unit.</th><th style="width:15%">Totale</th><th>Note</th></tr>
    ${ord.righe.map((r, i) => `<tr>
      <td>${i + 1}</td>
      <td style="font-weight:600">${r.desc}</td>
      <td>${r.misure}</td>
      <td style="text-align:center">${r.qta}</td>
      <td style="text-align:right">&euro;${fmt(r.prezzoUnit)}</td>
      <td style="text-align:right">&euro;${fmt(r.qta * r.prezzoUnit)}</td>
      <td style="font-size:9px;color:#666">${r.note || ""}</td>
    </tr>`).join("")}
    ${scontoPerc > 0 ? `<tr><td colspan="5" style="text-align:right;font-weight:600">Sconto ${scontoPerc}%</td><td style="text-align:right;color:#ff3b30">-&euro;${fmt(ord.righe.reduce((s, r) => s + r.qta * r.prezzoUnit, 0) * scontoPerc / 100)}</td><td></td></tr>` : ""}
    <tr><td colspan="5" style="text-align:right">Imponibile</td><td style="text-align:right">&euro;${fmt(imponibile)}</td><td></td></tr>
    <tr><td colspan="5" style="text-align:right">IVA ${ord.iva}%</td><td style="text-align:right">&euro;${fmt(ivaVal)}</td><td></td></tr>
    <tr class="total-row"><td colspan="5" style="text-align:right;font-size:13px">TOTALE</td><td style="text-align:right;font-size:13px">&euro;${fmt(ord.totaleIva)}</td><td></td></tr>
  </table>

  ${ord.note ? `<div class="box"><div style="font-size:9px;text-transform:uppercase;color:#888;margin-bottom:4px">Note</div>${ord.note}</div>` : ""}

  <div class="sign-area">
    <div class="sign-box">Timbro e firma ordinante<br><br><br></div>
    <div class="sign-box">Per accettazione fornitore<br><br><br></div>
  </div>

  <div style="text-align:center;font-size:8px;color:#ccc;margin-top:30px">Generato con MASTRO · ${new Date().toLocaleDateString("it-IT")}</div>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
};

// ═══ CONFERMA FIRMATA PDF ═══
export const generaConfermaFirmataPDF = (ord: any, deps: PdfDeps) => {
  const az = deps.aziendaDB;
  const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1c;padding:30px;max-width:800px;margin:0 auto}
    .stamp{border:3px solid #34c759;border-radius:12px;padding:16px;margin:20px 0;text-align:center}
  </style></head><body>
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:18px;font-weight:800;color:#34c759">✅ CONFERMA ORDINE APPROVATA</div>
    <div style="font-size:12px;color:#666;margin-top:4px">Ordine N. ${ord.numero}/${ord.anno} — ${ord.fornitore.nome}</div>
  </div>

  <div style="background:#f9f9fb;border-radius:8px;padding:14px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between">
      <div><b>Committente:</b> ${az.nome || "MASTRO"}<br>${az.indirizzo || ""}<br>${az.piva ? "P.IVA " + az.piva : ""}</div>
      <div style="text-align:right"><b>Fornitore:</b> ${ord.fornitore.nome}<br>${ord.fornitore.email || ""}<br>${ord.fornitore.piva ? "P.IVA " + ord.fornitore.piva : ""}</div>
    </div>
  </div>

  <div style="margin:14px 0"><b>Rif. Commessa:</b> ${ord.cmCode} — ${ord.cliente}</div>

  <table style="width:100%;border-collapse:collapse">
    <tr><th style="background:#34c75920;padding:8px;text-align:left;border-bottom:2px solid #34c759">#</th><th style="background:#34c75920;padding:8px;text-align:left;border-bottom:2px solid #34c759">Descrizione</th><th style="background:#34c75920;padding:8px;border-bottom:2px solid #34c759">Misure</th><th style="background:#34c75920;padding:8px;border-bottom:2px solid #34c759">Qtà</th><th style="background:#34c75920;padding:8px;text-align:right;border-bottom:2px solid #34c759">Prezzo</th></tr>
    ${ord.righe.map((r, i) => `<tr><td style="padding:6px;border-bottom:1px solid #eee">${i + 1}</td><td style="padding:6px;border-bottom:1px solid #eee">${r.desc}</td><td style="padding:6px;border-bottom:1px solid #eee">${r.misure}</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:center">${r.qta}</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:right">&euro;${fmt(r.qta * r.prezzoUnit)}</td></tr>`).join("")}
  </table>
  <div style="text-align:right;font-size:14px;font-weight:800;margin-top:8px">TOTALE: &euro;${fmt(ord.totaleIva)}</div>

  <div class="stamp">
    <div style="font-size:14px;font-weight:800;color:#34c759">CONFERMATO E APPROVATO</div>
    <div style="font-size:11px;color:#666;margin-top:4px">Data conferma: ${ord.conferma.dataFirma ? new Date(ord.conferma.dataFirma).toLocaleDateString("it-IT") : new Date().toLocaleDateString("it-IT")}</div>
    <div style="font-size:11px;color:#666">Consegna prevista: ${ord.consegna.prevista ? new Date(ord.consegna.prevista).toLocaleDateString("it-IT") : "Da concordare"}</div>
    <div style="font-size:11px;color:#666">Pagamento: ${ord.pagamento.termini === "anticipato" ? "Anticipato" : ord.pagamento.termini.replace("_", " ").toUpperCase()}</div>
    ${ord.conferma.differenze ? `<div style="margin-top:8px;font-size:10px;color:#ff9500;font-weight:600">⚠️ Note: ${ord.conferma.differenze}</div>` : ""}
  </div>

  <div style="display:flex;justify-content:space-between;margin-top:40px">
    <div style="width:45%;border-top:1px solid #aaa;padding-top:8px;text-align:center;font-size:10px;color:#888">Firma ${az.nome || "committente"}<br>${ord.conferma.dataFirma || ""}</div>
    <div style="width:45%;border-top:1px solid #aaa;padding-top:8px;text-align:center;font-size:10px;color:#888">Per accettazione fornitore</div>
  </div>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
};

// ═══ PREVENTIVO CONDIVISIBILE ═══
export const generaPreventivoCondivisibile = async (c: any, deps: PdfDeps) => {
  const az = deps.aziendaDB;
  const vani = getVaniAttivi(c);
  const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";
  // Calcola prezzi reali dai sistemi/griglie
  const vaniConPrezzi = vani.map(v => ({ ...v, _prezzo: calcolaVanoPrezzo(v, c, deps) }));
  const subtot = vaniConPrezzi.reduce((s, v) => s + v._prezzo, 0) + (c.vociLibere || []).reduce((s, vl) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);
  const iva = subtot * 0.1;
  const tot = subtot + iva;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1d1d1f;max-width:600px;margin:0 auto;padding:16px;background:#f5f5f7}
    .card{background:#fff;border-radius:14px;padding:18px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
    .header{text-align:center;margin-bottom:16px}
    .logo{max-height:50px;margin-bottom:8px}
    .title{font-size:22px;font-weight:800;color:#1d1d1f}
    .sub{font-size:12px;color:#86868b}
    .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px}
    .row:last-child{border:none}
    .total{font-size:18px;font-weight:800;color:#007aff;text-align:right;padding:12px 0}
    .btn{width:100%;padding:16px;border-radius:12px;border:none;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px;font-family:inherit}
    .btn-green{background:#34c759;color:#fff}
    .btn-outline{background:#fff;color:#007aff;border:2px solid #007aff}
    canvas{border:1px solid #e5e5ea;border-radius:10px;background:#fff;touch-action:none}
    .firma-done{background:#f0fdf4;border:2px solid #34c759;border-radius:12px;padding:16px;text-align:center}
  </style></head><body>
  <div class="header">
    ${az.logo ? `<img src="${az.logo}" class="logo"/><br>` : ""}
    <div class="title">${az.nome || "MASTRO"}</div>
    <div class="sub">${az.indirizzo || ""}<br>${az.tel || ""} · ${az.email || ""}</div>
  </div>

  <div class="card">
    <div style="font-size:11px;text-transform:uppercase;color:#86868b;letter-spacing:1px;margin-bottom:8px">Preventivo</div>
    <div style="font-size:16px;font-weight:700">${c.code}</div>
    <div style="font-size:13px;color:#86868b;margin-top:2px">Per: ${c.cliente} ${c.cognome || ""}</div>
    <div style="font-size:12px;color:#86868b">${c.indirizzo || ""}</div>
    <div style="font-size:11px;color:#86868b;margin-top:4px">Data: ${new Date().toLocaleDateString("it-IT")}</div>
  </div>

  <div class="card">
    <div style="font-size:11px;text-transform:uppercase;color:#86868b;letter-spacing:1px;margin-bottom:10px">Riepilogo fornitura</div>
    ${vaniConPrezzi.map((v, i) => {
      const tipLabel = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo || "Vano";
      return `<div class="row">
        <div><strong>${i + 1}. ${tipLabel}</strong><br><span style="font-size:11px;color:#86868b">${v.stanza || ""} ${v.piano || ""} — ${v.misure?.lCentro || 0}×${v.misure?.hCentro || 0} mm</span></div>
        <div style="font-weight:700;white-space:nowrap">&euro;${fmt(v._prezzo)}</div>
      </div>`;
    }).join("")}
    ${(c.vociLibere || []).map(vl => `<div class="row"><div>${vl.desc}</div><div style="font-weight:700">&euro;${fmt(vl.importo)}</div></div>`).join("")}
    <div style="border-top:2px solid #e5e5ea;margin-top:8px;padding-top:8px">
      <div class="row"><span>Imponibile</span><span style="font-weight:600">&euro;${fmt(subtot)}</span></div>
      <div class="row"><span>IVA 10%</span><span>&euro;${fmt(iva)}</span></div>
    </div>
    <div class="total">TOTALE: &euro;${fmt(tot)}</div>
  </div>

  ${c.condPagamento ? `<div class="card"><div style="font-size:11px;text-transform:uppercase;color:#86868b;letter-spacing:1px;margin-bottom:6px">Condizioni di pagamento</div><div style="font-size:12px;line-height:1.5">${c.condPagamento.replace(/\n/g, "<br>")}</div></div>` : ""}

  <div class="card" id="firma-section">
    <div style="font-size:11px;text-transform:uppercase;color:#86868b;letter-spacing:1px;margin-bottom:10px">Firma di accettazione</div>
    <div id="firma-pad" style="text-align:center">
      <canvas id="sigCanvas" width="340" height="150" style="width:100%;max-width:340px"></canvas>
      <div style="font-size:10px;color:#86868b;margin-top:4px">Firma con il dito o con il mouse</div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-outline" onclick="clearSig()" style="flex:1;padding:10px;font-size:13px">Cancella</button>
        <button class="btn btn-green" onclick="confirmSig()" style="flex:1;padding:10px;font-size:13px">✅ Conferma e Firma</button>
      </div>
    </div>
    <div id="firma-done" class="firma-done" style="display:none">
      <div style="font-size:24px;margin-bottom:6px">✅</div>
      <div style="font-size:16px;font-weight:700;color:#34c759">Preventivo Firmato!</div>
      <div style="font-size:12px;color:#86868b;margin-top:4px">Grazie per la conferma. Riceverà aggiornamenti sull'avanzamento del suo ordine.</div>
      <img id="firma-img" style="max-height:60px;margin-top:10px" alt=""/>
    </div>
  </div>

  <div style="text-align:center;font-size:10px;color:#ccc;margin-top:16px">Generato con MASTRO · ${new Date().toLocaleDateString("it-IT")}</div>

  <script>
  const canvas=document.getElementById('sigCanvas'),ctx=canvas.getContext('2d');
  let drawing=false,lastX=0,lastY=0,hasDrawn=false;
  ctx.strokeStyle='#1d1d1f';ctx.lineWidth=2;ctx.lineCap='round';
  function getPos(e){const r=canvas.getBoundingClientRect();const t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
  canvas.addEventListener('mousedown',e=>{drawing=true;const p=getPos(e);lastX=p.x;lastY=p.y;});
  canvas.addEventListener('mousemove',e=>{if(!drawing)return;hasDrawn=true;const p=getPos(e);ctx.beginPath();ctx.moveTo(lastX,lastY);ctx.lineTo(p.x,p.y);ctx.stroke();lastX=p.x;lastY=p.y;});
  canvas.addEventListener('mouseup',()=>drawing=false);
  canvas.addEventListener('touchstart',e=>{e.preventDefault();drawing=true;const p=getPos(e);lastX=p.x;lastY=p.y;},{passive:false});
  canvas.addEventListener('touchmove',e=>{e.preventDefault();if(!drawing)return;hasDrawn=true;const p=getPos(e);ctx.beginPath();ctx.moveTo(lastX,lastY);ctx.lineTo(p.x,p.y);ctx.stroke();lastX=p.x;lastY=p.y;},{passive:false});
  canvas.addEventListener('touchend',()=>drawing=false);
  function clearSig(){ctx.clearRect(0,0,canvas.width,canvas.height);hasDrawn=false;}
  function confirmSig(){
    if(!hasDrawn){alert('Firma prima di confermare');return;}
    const img=canvas.toDataURL();
    document.getElementById('firma-pad').style.display='none';
    document.getElementById('firma-done').style.display='block';
    document.getElementById('firma-img').src=img;
  }
  <\/script>
  </body></html>`;

  // Upload to Supabase Storage per URL pubblico condivisibile
  const fileName = `preventivo_${c.code}_${Date.now()}.html`;
  try {
    const blob = new Blob([html], { type: "text/html" });
    const { data: uploadData, error } = await supabase.storage
      .from("preventivi")
      .upload(`public/${fileName}`, blob, { contentType: "text/html", upsert: true });
    
    if (!error && uploadData) {
      const { data: urlData } = supabase.storage.from("preventivi").getPublicUrl(`public/${fileName}`);
      const publicUrl = urlData?.publicUrl;
      if (publicUrl) {
        // Salva URL nella commessa
        setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, linkPreventivo: publicUrl } : x));
        setSelectedCM(p => p?.id === c.id ? { ...p, linkPreventivo: publicUrl } : p);
        
        // Apri link + offri invio WhatsApp
        window.open(publicUrl, "_blank");
        
        // Auto-WhatsApp
        const tel = (c.telefono || "").replace(/\D/g, "");
        if (tel) {
          const msg = `Gentile ${c.cliente}, ecco il preventivo per ${c.code}:\n${publicUrl}\n\nPuò visionarlo e firmarlo direttamente dal suo telefono.\n\nCordiali saluti,\n${deps.aziendaDB.nome || "MASTRO"}`;
          setTimeout(() => {
            if (confirm("Inviare il link via WhatsApp al cliente?")) {
              window.open(`https://wa.me/${tel.startsWith("39") ? tel : "39" + tel}?text=${encodeURIComponent(msg)}`, "_blank");
            }
          }, 500);
        }
        return publicUrl;
      }
    }
  } catch (e) { console.warn("Upload Supabase non riuscito, uso blob locale:", e); }
  
  // Fallback: blob locale se Supabase non disponibile
  const blobFallback = new Blob([html], { type: "text/html" });
  const urlFallback = URL.createObjectURL(blobFallback);
  window.open(urlFallback, "_blank");
  return urlFallback;
};

// ═══ TRACKING CLIENTE ═══
export interface TrackingDeps extends PdfDeps { fattureDB: any[]; montaggiDB: any[]; }

export const generaTrackingCliente = (c: any, deps: TrackingDeps) => {
  const az = deps.aziendaDB;
  const trackSteps = [
    { id: "ordinato", label: "Ordinato", icon: "📦", desc: "Il materiale è stato ordinato al fornitore" },
    { id: "produzione", label: "In Produzione", icon: "🏭", desc: "I serramenti sono in fase di produzione" },
    { id: "pronto", label: "Pronto", icon: "✅", desc: "Il materiale è pronto per la consegna" },
    { id: "consegnato", label: "Consegnato", icon: "🚛", desc: "Il materiale è stato consegnato" },
    { id: "montato", label: "Montato", icon: "🔧", desc: "L'installazione è completata" },
  ];
  const curIdx = trackSteps.findIndex(s => s.id === c.trackingStato);
  const fatture = deps.fattureDB.filter(f => f.cmId === c.id);
  const totFat = fatture.reduce((s, f) => s + f.importo, 0);
  const totPag = fatture.filter(f => f.pagata).reduce((s, f) => s + f.importo, 0);
  const montaggio = deps.montaggiDB.find(m => m.cmId === c.id && m.stato !== "completato");
  const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tracking Ordine ${c.code} — ${az.nome || "MASTRO"}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#1a1a1c;padding:16px;max-width:480px;margin:0 auto}
    .card{background:#fff;border-radius:16px;padding:20px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
    .step{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f2}
    .step:last-child{border-bottom:none}
    .dot{width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
    .active .dot{background:#007aff20} .done .dot{background:#34c75920} .pending .dot{background:#f0f0f2}
    .line{width:2px;height:20px;margin:0 17px;background:#e0e0e2}
    .done .line{background:#34c759} .active .line{background:#007aff}
    .badge{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700}
    h2{font-size:20px;font-weight:800;letter-spacing:-0.3px}
  </style></head><body>
  <div class="card" style="text-align:center">
    ${az.logo ? `<img src="${az.logo}" style="max-height:50px;max-width:180px;margin-bottom:8px" alt="">` : ""}
    <h2>${az.nome || "MASTRO"}</h2>
    <div style="font-size:12px;color:#8e8e93;margin-top:4px">${az.tel || ""} · ${az.email || ""}</div>
  </div>

  <div class="card">
    <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Ordine</div>
    <h2>${c.code}</h2>
    <div style="font-size:13px;color:#8e8e93;margin-top:2px">${c.cliente} ${c.cognome || ""}</div>
    <div style="font-size:12px;color:#8e8e93">${c.indirizzo || ""}</div>
    ${c.dataPrevConsegna ? `<div style="margin-top:10px;padding:8px 12px;background:#007aff10;border-radius:8px;font-size:12px;color:#007aff;font-weight:600">📅 Consegna prevista: ${new Date(c.dataPrevConsegna).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>` : ""}
    ${montaggio?.data ? `<div style="margin-top:6px;padding:8px 12px;background:#30b0c710;border-radius:8px;font-size:12px;color:#30b0c7;font-weight:600">🔧 Montaggio programmato: ${new Date(montaggio.data).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })} ore ${montaggio.oraInizio || "08:00"}</div>` : ""}
  </div>

  <div class="card">
    <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Stato avanzamento</div>
    ${trackSteps.map((st, i) => {
      const isDone = i < curIdx;
      const isActive = i === curIdx;
      const cls = isDone ? "done" : isActive ? "active" : "pending";
      return `<div class="step ${cls}">
        <div>
          <div class="dot">${st.icon}</div>
          ${i < trackSteps.length - 1 ? `<div class="line"></div>` : ""}
        </div>
        <div style="padding-top:6px">
          <div style="font-size:14px;font-weight:700;color:${isDone ? "#34c759" : isActive ? "#007aff" : "#c7c7cc"}">${st.label}</div>
          <div style="font-size:11px;color:#8e8e93;margin-top:2px">${st.desc}</div>
          ${isDone && c["tracking_" + st.id + "_data"] ? `<div style="font-size:10px;color:#34c759;margin-top:2px">✅ ${c["tracking_" + st.id + "_data"]}</div>` : ""}
          ${isActive ? `<span class="badge" style="background:#007aff20;color:#007aff;margin-top:4px">In corso</span>` : ""}
        </div>
      </div>`;
    }).join("")}
  </div>

  ${fatture.length > 0 ? `<div class="card">
    <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Situazione pagamenti</div>
    ${fatture.map(f => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f2">
      <div>
        <div style="font-size:12px;font-weight:600">${f.tipo === "acconto" ? "Acconto" : f.tipo === "saldo" ? "Saldo" : "Fattura"} N.${f.numero}/${f.anno}</div>
        <div style="font-size:10px;color:#8e8e93">${f.data}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:800">&euro;${fmt(f.importo)}</div>
        <div style="font-size:10px;color:${f.pagata ? "#34c759" : "#ff3b30"};font-weight:600">${f.pagata ? "✅ Pagata" : "⏳ Da pagare"}</div>
      </div>
    </div>`).join("")}
    <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:4px">
      <span style="font-size:12px;color:#8e8e93">Totale: &euro;${fmt(totFat)}</span>
      <span style="font-size:12px;font-weight:700;color:${totPag >= totFat ? "#34c759" : "#ff9500"}">${totPag >= totFat ? "✅ Saldato" : `Da pagare: €${fmt(totFat - totPag)}`}</span>
    </div>
  </div>` : ""}

  <div style="text-align:center;font-size:10px;color:#c7c7cc;margin-top:16px;padding:12px">
    Pagina generata da MASTRO · ${new Date().toLocaleDateString("it-IT")}
  </div>
  </body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  return url;
};
