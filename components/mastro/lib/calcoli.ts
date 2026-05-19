// ═══════════════════════════════════════════
// MASTRO ERP — Funzioni di calcolo (pure)
// Nessuna dipendenza da state React
// ═══════════════════════════════════════════

// Mappa tipologia → categoria minimo mq
export const tipoToMinCat = (tipo: string): string => {
  if (tipo.includes("SC") || tipo === "ALZSC") return "scorrevole";
  if (tipo === "FIS" || tipo === "FISTONDO") return "fisso";
  if (tipo.includes("3A") || tipo.includes("4A")) return "3ante";
  if (tipo.includes("2A")) return "2ante";
  return "1anta";
};

// Vani attivi = ultimo rilievo
export const getVaniAttivi = (c: any): any[] => {
  if (!c?.rilievi || c.rilievi.length === 0) return [];
  return c.rilievi[c.rilievi.length - 1]?.vani || [];
};

// Formato euro
export const fmt = (n: number): string =>
  typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";

// Deps needed for price calculation
export interface CalcoloDeps {
  sistemiDB: any[];
  vetriDB: any[];
  coprifiliDB: any[];
  lamiereDB: any[];
}

/**
 * Calcola il prezzo di un singolo vano
 * @param v - vano object
 * @param c - commessa/cantiere object (per prezzoMq, prezzoTapparella etc.)
 * @param deps - database arrays (sistemi, vetri, coprifili, lamiere)
 */
export const calcolaVanoPrezzo = (v: any, c: any, deps: CalcoloDeps): number => {
  const m = v.misure || {};
  const lc = (m.lCentro || 0) / 1000, hc = (m.hCentro || 0) / 1000;
  const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
  const mq = lc * hc, perim = 2 * (lc + hc);
  if (mq <= 0) return 0;

  const sysRec = deps.sistemiDB.find((s: any) =>
    (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema
  );

  // Minimo mq
  const minCat = tipoToMinCat(v.tipo || "F1A");
  const minimoMq = sysRec?.minimiMq?.[minCat] || 0;
  const mqCalc = (minimoMq > 0 && mq > 0 && mq < minimoMq) ? minimoMq : mq;

  // Grid or €/mq
  let tot = 0;
  const gridPrice = sysRec?.griglia ? (() => {
    const g = sysRec.griglia;
    const exact = g.find((p: any) => p.l >= lmm && p.h >= hmm);
    return exact ? exact.prezzo : (g.length > 0 ? g[g.length - 1].prezzo : null);
  })() : null;
  tot = gridPrice !== null ? gridPrice : mqCalc * parseFloat(sysRec?.prezzoMq || sysRec?.euroMq || c?.prezzoMq || 350);

  // Vetro
  const vetroRec = deps.vetriDB.find((g: any) => g.code === v.vetro || g.nome === v.vetro);
  if (vetroRec?.prezzoMq) tot += mq * parseFloat(vetroRec.prezzoMq);

  // Coprifilo
  const copRec = deps.coprifiliDB.find((cp: any) => cp.cod === v.coprifilo);
  if (copRec?.prezzoMl) tot += perim * parseFloat(copRec.prezzoMl);

  // Lamiera
  const lamRec = deps.lamiereDB.find((l: any) => l.cod === v.lamiera);
  if (lamRec?.prezzoMl) tot += lc * parseFloat(lamRec.prezzoMl);

  // Accessori
  const tapp = v.accessori?.tapparella;
  if (tapp?.attivo && c?.prezzoTapparella) {
    const tmq = ((tapp.l || lmm) / 1000) * ((tapp.h || hmm) / 1000);
    tot += tmq * parseFloat(c.prezzoTapparella);
  }
  const pers = v.accessori?.persiana;
  if (pers?.attivo && c?.prezzoPersiana) {
    const pmq = ((pers.l || lmm) / 1000) * ((pers.h || hmm) / 1000);
    tot += pmq * parseFloat(c.prezzoPersiana);
  }
  const zanz = v.accessori?.zanzariera;
  if (zanz?.attivo && c?.prezzoZanzariera) {
    const zmq = ((zanz.l || lmm) / 1000) * ((zanz.h || hmm) / 1000);
    tot += zmq * parseFloat(c.prezzoZanzariera);
  }

  // Voci libere del vano
  if (v.vociLibere?.length > 0) {
    v.vociLibere.forEach((vl: any) => { tot += (vl.prezzo || 0) * (vl.qta || 1); });
  }

  return Math.round(tot * 100) / 100;
};

/**
 * Calcola totale commessa = somma vani + voci libere
 */
export const calcolaTotaleCommessa = (c: any, deps: CalcoloDeps): number => {
  const vani = getVaniAttivi(c);
  const totVani = vani.reduce((s: number, v: any) => s + calcolaVanoPrezzo(v, c, deps), 0);
  const totVoci = (c.vociLibere || []).reduce((s: number, vl: any) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);
  return totVani + totVoci;
};

/**
 * Calcola scadenza pagamento
 */
export const calcolaScadenzaPagamento = (dataOrdine: string, termini: string): string => {
  const d = new Date(dataOrdine);
  if (termini === "anticipato") return dataOrdine;
  const days = termini === "30gg_fm" ? 30 : termini === "60gg_fm" ? 60 : termini === "90gg_fm" ? 90 : 30;
  d.setDate(d.getDate() + days);
  // Fine mese
  if (termini.includes("fm")) { d.setMonth(d.getMonth() + 1, 0); }
  return d.toISOString().split("T")[0];
};
