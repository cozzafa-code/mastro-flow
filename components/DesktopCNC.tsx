"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO — DesktopCNC v2
// Lista taglio reale da vani · Ottimizzazione FFD · Export LST/OPT
// Disegno tipologie SVG parametrico stile Opera
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

// ── Design System ──────────────────────────────────────────────
const DS = {
  bg: "#F2F1EC", surface: "#FFFFFF", topbar: "#1A1A1C",
  amber: "#D08008", amberLight: "#FEF3C7",
  green: "#1A9E73", red: "#DC4444", blue: "#3B7FE0",
  border: "#E5E3DC", text: "#1A1A1C", sub: "#6B7280",
  mono: "JetBrains Mono, monospace",
};

// ── Costanti ottimizzatore (da Opera OPERACFG.DAT reale) ───────
const OPT = {
  scartoTesta: 30, scartoCoda: 30,
  scartoLama: 4.5, scartoPosiz: 10,
};

// ── Tipi ────────────────────────────────────────────────────────
type TipApertura =
  | "fisso" | "1anta_ar" | "2ante_ar"
  | "1anta_ab" | "2ante_ab"
  | "balcone_1" | "balcone_2"
  | "wasistas" | "scorrevole_2" | "ribalta_scorre";

interface PezzoTaglio {
  id: string; label: string; vanoN: number; vanoDesc: string;
  profilo: string; categoria: string; colore: string;
  lunghezza: number; qt: number; angSx: number; angDx: number;
}
interface BarraOtt { pezzi: PezzoTaglio[]; residuo: number; }
interface GruppoProfilo {
  profilo: string; categoria: string; colore: string;
  barre: BarraOtt[]; rendimento: number;
}

// ── Algoritmo FFD ────────────────────────────────────────────────
function ottimizzaFFD(pezzi: PezzoTaglio[], lungBarra: number): BarraOtt[] {
  const sorted = [...pezzi].sort((a, b) => b.lunghezza - a.lunghezza);
  const barre: BarraOtt[] = [];
  const disp: number[] = [];
  for (const p of sorted) {
    let ins = false;
    for (let i = 0; i < barre.length; i++) {
      if (disp[i] - OPT.scartoLama >= p.lunghezza) {
        barre[i].pezzi.push(p);
        disp[i] -= p.lunghezza + OPT.scartoLama;
        ins = true; break;
      }
    }
    if (!ins) {
      barre.push({ pezzi: [p], residuo: 0 });
      disp.push(lungBarra - OPT.scartoTesta - OPT.scartoCoda - p.lunghezza - OPT.scartoLama);
    }
  }
  barre.forEach((b, i) => { b.residuo = Math.max(0, disp[i]); });
  return barre;
}

// ── Calcola pezzi da vano reale ──────────────────────────────────
function calcolaPezziVano(vano: any, nVano: number): PezzoTaglio[] {
  const m = vano.misure || {};
  const L = parseInt(m.lCentro || m.larghezza || 0);
  const H = parseInt(m.hCentro || m.altezza || 0);
  if (!L || !H) return [];

  const sistema = (vano.sistema || "IDEAL_5000").replace(/ /g, "_");
  const colore = vano.coloreEsterno || vano.colore || "BASE BIANCA";
  const tipo: TipApertura = vano.tipologia || "2ante_ar";
  const desc = vano.nome || vano.tipologiaLabel || `Vano ${nVano}`;

  // Spessore profilo Ideal 5000: 77mm
  // Correzione taglio 45°: lunghezza reale - 2*(spessore/tan(45°))
  const sp = 77;
  const corr45 = sp; // per angolo 45° su entrambi i lati

  const pezzi: PezzoTaglio[] = [];
  const mk = (
    label: string, prof: string, cat: string,
    mm: number, angSx: number, angDx: number
  ): PezzoTaglio => {
    const taglio = mm - (angSx === 45 ? corr45 / 2 : 0) - (angDx === 45 ? corr45 / 2 : 0);
    return {
      id: `${nVano}-${label}`, label, vanoN: nVano, vanoDesc: desc,
      profilo: `${sistema} ${prof}`, categoria: cat, colore,
      lunghezza: mm, qt: Math.round(taglio), angSx, angDx,
    };
  };

  // Telaio 4 lati a 45°
  pezzi.push(mk("TEL.L sx",   "TELAIO", "PROFILI IN PVC", L, 45, 45));
  pezzi.push(mk("TEL.L dx",   "TELAIO", "PROFILI IN PVC", L, 45, 45));
  pezzi.push(mk("TEL.H sup",  "TELAIO", "PROFILI IN PVC", H, 45, 45));
  pezzi.push(mk("TEL.H inf",  "TELAIO", "PROFILI IN PVC", H, 45, 45));
  // Rinforzi telaio 90°
  pezzi.push(mk("RINF.TEL.L sx",  "RINFORZO", "PROFILI IN FERRO", L, 90, 90));
  pezzi.push(mk("RINF.TEL.L dx",  "RINFORZO", "PROFILI IN FERRO", L, 90, 90));
  pezzi.push(mk("RINF.TEL.H sup", "RINFORZO", "PROFILI IN FERRO", H, 90, 90));
  pezzi.push(mk("RINF.TEL.H inf", "RINFORZO", "PROFILI IN FERRO", H, 90, 90));

  const nAnte = tipo.includes("2") || tipo === "balcone_2" ? 2 : 1;
  const lAnta = nAnte === 2 ? Math.round((L - sp) / 2) : L - sp;
  const hAnta = H - sp;

  for (let a = 1; a <= nAnte; a++) {
    const s = nAnte === 2 ? (a === 1 ? "SX" : "DX") : "";
    pezzi.push(mk(`BAT.L ${s} a`, "ANTA", "PROFILI IN PVC", lAnta, 45, 45));
    pezzi.push(mk(`BAT.L ${s} b`, "ANTA", "PROFILI IN PVC", lAnta, 45, 45));
    pezzi.push(mk(`BAT.H ${s} a`, "ANTA", "PROFILI IN PVC", hAnta, 45, 45));
    pezzi.push(mk(`BAT.H ${s} b`, "ANTA", "PROFILI IN PVC", hAnta, 45, 45));
    pezzi.push(mk(`RINF.ANT.L ${s}`, "RINFORZO", "PROFILI IN FERRO", lAnta, 90, 90));
    pezzi.push(mk(`RINF.ANT.H ${s}`, "RINFORZO", "PROFILI IN FERRO", hAnta, 90, 90));
  }

  // Fermavetro
  pezzi.push(mk("FEV.L a", "FERMAVETRO", "PROFILI IN PVC", lAnta, 45, 45));
  pezzi.push(mk("FEV.L b", "FERMAVETRO", "PROFILI IN PVC", lAnta, 45, 45));
  pezzi.push(mk("FEV.H a", "FERMAVETRO", "PROFILI IN PVC", hAnta, 45, 45));
  pezzi.push(mk("FEV.H b", "FERMAVETRO", "PROFILI IN PVC", hAnta, 45, 45));

  // Montante centrale per 2 ante
  if (nAnte === 2) {
    pezzi.push(mk("MONT.H", "MONTANTE", "PROFILI IN PVC", H, 90, 90));
    pezzi.push(mk("RINF.MONT.H", "RINFORZO", "PROFILI IN FERRO", H, 90, 90));
  }

  return pezzi;
}

// ── SVG Tipologia parametrico stile Opera ──────────────────────
function DisegnoTipologia({
  tipo, L, H, w = 280, h = 200
}: { tipo: TipApertura; L: number; H: number; w?: number; h?: number }) {
  const pad = 24; const qh = 18;
  const fw = w - pad * 2 - qh;
  const fh = h - pad * 2 - qh;
  const ox = pad + qh; const oy = pad;
  const sp = 7;

  const nAnte = tipo === "2ante_ar" || tipo === "2ante_ab" || tipo === "balcone_2" || tipo === "scorrevole_2" ? 2 : 1;
  const isSc = tipo === "scorrevole_2";
  const isAR = tipo.includes("ar") || tipo === "balcone_1" || tipo === "balcone_2";
  const isAB = tipo.includes("ab");
  const isWas = tipo === "wasistas";
  const isFisso = tipo === "fisso";

  const antaW = nAnte === 2 ? (fw - sp) / 2 : fw;
  const antaH = fh;
  const colVetro = ["#DBEAFE", "#E0F2FE"];

  const mkAnta = (i: number) => {
    const ax = ox + sp / 2 + i * (antaW + (nAnte === 2 ? sp : 0));
    const ay = oy + sp / 2;
    const aw = antaW - sp;
    const ah = antaH - sp;
    return (
      <g key={i}>
        <rect x={ax + sp} y={ay + sp} width={aw - sp * 2} height={ah - sp * 2}
          fill={colVetro[i % 2]} stroke="#93C5FD" strokeWidth={0.5} />
        <rect x={ax} y={ay} width={aw} height={ah}
          fill="none" stroke={DS.text} strokeWidth={sp * 0.7}
          strokeDasharray={isSc ? "5,2" : "none"} />
        {isAR && !isSc && !isWas && (
          <g>
            <line x1={i === 0 ? ax + aw : ax} y1={ay}
                  x2={i === 0 ? ax : ax + aw} y2={ay + ah}
                  stroke={DS.amber} strokeWidth={0.8} opacity={0.5} />
            <line x1={ax + aw / 2} y1={ay + ah - 4}
                  x2={ax + aw / 2} y2={ay + ah * 0.45}
                  stroke={DS.amber} strokeWidth={1.2} markerEnd="url(#arr)" />
            <circle cx={ax + aw / 2} cy={ay + ah} r={3.5} fill={DS.amber} />
          </g>
        )}
        {isAB && !isSc && (
          <g>
            <line x1={i === 0 ? ax : ax + aw} y1={ay}
                  x2={ax + aw / 2} y2={ay + ah / 2}
                  stroke={DS.amber} strokeWidth={0.8} opacity={0.5} />
            <line x1={ax + aw / 2} y1={ay + ah / 2}
                  x2={ax + aw / 2} y2={ay + sp * 2}
                  stroke={DS.amber} strokeWidth={1.2} markerEnd="url(#arr)" />
          </g>
        )}
        {isSc && (
          <line x1={ax + (i === 0 ? aw * 0.7 : aw * 0.3)} y1={ay + ah / 2}
                x2={ax + (i === 0 ? aw * 0.2 : aw * 0.8)} y2={ay + ah / 2}
                stroke={DS.amber} strokeWidth={1.5} markerEnd="url(#arr)" />
        )}
        {isWas && (
          <g>
            <line x1={ax + sp} y1={ay + ah} x2={ax + aw - sp} y2={ay + sp}
                  stroke={DS.amber} strokeWidth={0.8} opacity={0.4} />
            <line x1={ax + aw / 2} y1={ay + ah * 0.1}
                  x2={ax + aw / 2} y2={ay + ah * 0.55}
                  stroke={DS.amber} strokeWidth={1.2} markerEnd="url(#arr)" />
          </g>
        )}
        {isFisso && (
          <g>
            <line x1={ax + sp} y1={ay + sp} x2={ax + aw - sp} y2={ay + ah - sp}
                  stroke={DS.sub} strokeWidth={0.6} opacity={0.3} />
            <line x1={ax + aw - sp} y1={ay + sp} x2={ax + sp} y2={ay + ah - sp}
                  stroke={DS.sub} strokeWidth={0.6} opacity={0.3} />
          </g>
        )}
      </g>
    );
  };

  return (
    <svg width={w} height={h} style={{ background: DS.surface, borderRadius: 6, display: "block" }}>
      <defs>
        <marker id="arr" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
          <polygon points="0,0 5,2.5 0,5" fill={DS.amber} />
        </marker>
      </defs>
      {/* Quote L */}
      <line x1={ox} y1={oy + fh + qh / 2} x2={ox + fw} y2={oy + fh + qh / 2}
        stroke={DS.sub} strokeWidth={0.7} />
      <line x1={ox} y1={oy + fh + 2} x2={ox} y2={oy + fh + qh - 2} stroke={DS.sub} strokeWidth={0.7} />
      <line x1={ox + fw} y1={oy + fh + 2} x2={ox + fw} y2={oy + fh + qh - 2} stroke={DS.sub} strokeWidth={0.7} />
      <text x={ox + fw / 2} y={oy + fh + qh - 2} textAnchor="middle"
        fontSize={8} fill={DS.sub} fontFamily={DS.mono}>{L} mm</text>
      {/* Quote H */}
      <line x1={ox - qh / 2} y1={oy} x2={ox - qh / 2} y2={oy + fh}
        stroke={DS.sub} strokeWidth={0.7} />
      <line x1={ox - 2} y1={oy} x2={ox - qh + 2} y2={oy} stroke={DS.sub} strokeWidth={0.7} />
      <line x1={ox - 2} y1={oy + fh} x2={ox - qh + 2} y2={oy + fh} stroke={DS.sub} strokeWidth={0.7} />
      <text x={ox - qh / 2} y={oy + fh / 2} textAnchor="middle"
        fontSize={8} fill={DS.sub} fontFamily={DS.mono}
        transform={`rotate(-90,${ox - qh / 2},${oy + fh / 2})`}>{H} mm</text>
      {/* Telaio */}
      <rect x={ox} y={oy} width={fw} height={fh} fill="none"
        stroke={DS.text} strokeWidth={sp} />
      {/* Ante */}
      {Array.from({ length: nAnte }).map((_, i) => mkAnta(i))}
      {/* Montante centrale */}
      {nAnte === 2 && (
        <line x1={ox + fw / 2} y1={oy} x2={ox + fw / 2} y2={oy + fh}
          stroke={DS.text} strokeWidth={sp} />
      )}
      {/* Label tipo */}
      <text x={ox + fw / 2} y={oy - 6} textAnchor="middle"
        fontSize={8} fill={DS.sub} fontFamily={FF}>{tipo.toUpperCase()}</text>
    </svg>
  );
}

// ── Barra ottimizzazione ────────────────────────────────────────
function BarraViz({ barra, idx, lungBarra }: { barra: BarraOtt; idx: number; lungBarra: number }) {
  const colors = [DS.blue, DS.green, "#8B5CF6", DS.amber, "#EC4899", "#14B8A6", "#F97316"];
  const usato = barra.pezzi.reduce((s, p) => s + p.lunghezza + OPT.scartoLama, 0) + OPT.scartoTesta + OPT.scartoCoda;
  const rend = Math.round(usato / lungBarra * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: DS.sub, fontFamily: DS.mono }}>Barra {idx + 1} · {barra.pezzi.length} pezzi</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: rend >= 85 ? DS.green : rend >= 70 ? DS.amber : DS.red, fontFamily: DS.mono }}>
          {rend}% · residuo {barra.residuo} mm
        </span>
      </div>
      <div style={{ display: "flex", height: 20, borderRadius: 4, overflow: "hidden", border: `1px solid ${DS.border}` }}>
        <div style={{ width: `${OPT.scartoTesta / lungBarra * 100}%`, background: "#E5E3DC", minWidth: 3 }} title={`Scarto testa ${OPT.scartoTesta}mm`} />
        {barra.pezzi.map((p, pi) => (
          <div key={pi}
            style={{ width: `${p.lunghezza / lungBarra * 100}%`, background: colors[pi % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff", fontWeight: 700, borderRight: "1px solid rgba(255,255,255,0.25)", overflow: "hidden", minWidth: 2 }}
            title={`${p.label} · ${p.lunghezza}mm`}>
            {p.lunghezza > 350 ? p.lunghezza : ""}
          </div>
        ))}
        {barra.residuo > 0 && (
          <div style={{ flex: barra.residuo, background: "#F3F0E8", minWidth: 2 }} title={`Residuo ${barra.residuo}mm`} />
        )}
        <div style={{ width: `${OPT.scartoCoda / lungBarra * 100}%`, background: "#E5E3DC", minWidth: 3 }} title={`Scarto coda ${OPT.scartoCoda}mm`} />
      </div>
    </div>
  );
}

// ── Generatori export formato FpPro ────────────────────────────
function generaLST(gruppi: GruppoProfilo[], code: string): string {
  const ts = new Date().toISOString().split("T")[0];
  return gruppi.flatMap(g =>
    g.barre.flatMap(b =>
      b.pezzi.map(p =>
        `"${code}","${p.vanoN}","${p.vanoN}","${p.categoria}","${p.profilo.split("_")[0]}","${p.profilo.split(" ").slice(1).join(" ")}","${p.profilo}","${p.colore}","","","${p.colore}","","","1","${p.lunghezza}.0","${p.angSx}.0","${p.angDx}.0","0.0","20.0","0.0","${p.id}","${p.label}","${ts}","0"`
      )
    )
  ).join("\r\n");
}

function generaOPT(gruppi: GruppoProfilo[], code: string, lungBarra: number): string {
  const ts = new Date().toISOString().split("T")[0];
  let nCiclo = 1;
  return gruppi.flatMap(g =>
    g.barre.flatMap((b, bi) => {
      const rows = b.pezzi.map(p =>
        `"${code}","${p.profilo.split("_")[0]}","${p.profilo.split(" ").slice(1).join(" ")}","${p.profilo}","${p.colore}","","","${p.colore}","","","1","${lungBarra}.0","${nCiclo}","${bi + 1}","${p.vanoN}","${p.vanoN}","${p.categoria}","1","${p.lunghezza}.0","${p.angSx}.0","${p.angDx}.0","0.0","20.0","0.0","${p.id}","${p.label}","${ts}","","0"`
      );
      nCiclo++;
      return rows;
    })
  ).join("\r\n");
}

function scaricaFile(contenuto: string, nome: string) {
  const blob = new Blob([contenuto], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Componente principale ───────────────────────────────────────
export default function DesktopCNC() {
  const { cantieri = [] } = useMastro();

  const [selCm, setSelCm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"disegni" | "taglio" | "ott" | "export">("disegni");
  const [lungBarra, setLungBarra] = useState(6000);

  const commesseProd = cantieri.filter((c: any) =>
    ["ordine", "produzione", "posa", "completato"].includes(c.fase)
  );
  const cmSel = cantieri.find((c: any) => c.id === selCm);
  const vaniSel = cmSel ? (cmSel.vani || []).filter((v: any) => !v.eliminato) : [];

  const tuttiPezzi = useMemo(() =>
    vaniSel.flatMap((v: any, i: number) => calcolaPezziVano(v, i + 1)),
    [vaniSel]
  );

  const gruppiOtt = useMemo((): GruppoProfilo[] => {
    if (!tuttiPezzi.length) return [];
    const map = new Map<string, PezzoTaglio[]>();
    for (const p of tuttiPezzi) {
      const key = `${p.profilo}__${p.colore}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([key, pezzi]) => {
      const [profilo, colore] = key.split("__");
      const barre = ottimizzaFFD(pezzi, lungBarra);
      const totUsato = pezzi.reduce((s, p) => s + p.lunghezza + OPT.scartoLama, 0);
      const totBarre = barre.length * lungBarra;
      return {
        profilo, colore,
        categoria: pezzi[0].categoria,
        barre,
        rendimento: Math.round(totUsato / totBarre * 100),
      };
    }).sort((a, b) => a.categoria.localeCompare(b.categoria));
  }, [tuttiPezzi, lungBarra]);

  const kpi = useMemo(() => ({
    totBarre: gruppiOtt.reduce((s, g) => s + g.barre.length, 0),
    totPezzi: tuttiPezzi.length,
    rendMedio: gruppiOtt.length
      ? Math.round(gruppiOtt.reduce((s, g) => s + g.rendimento, 0) / gruppiOtt.length)
      : 0,
    metriLineari: Math.round(gruppiOtt.reduce((s, g) => s + g.barre.length * lungBarra, 0) / 1000),
  }), [gruppiOtt, tuttiPezzi, lungBarra]);

  // ── helpers UI ──
  const Tab = ({ id, label }: { id: string; label: string }) => (
    <div onClick={() => setActiveTab(id as any)}
      style={{ padding: "8px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" as any, color: activeTab === id ? DS.amber : DS.sub, borderBottom: `2px solid ${activeTab === id ? DS.amber : "transparent"}` }}>
      {label}
    </div>
  );

  const Kpi = ({ label, value, color }: any) => (
    <div style={{ background: DS.surface, borderRadius: 8, padding: "12px 14px", border: `1px solid ${DS.border}`, textAlign: "center" as any }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: DS.mono }}>{value}</div>
      <div style={{ fontSize: 10, color: DS.sub, marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column" as any, background: DS.bg, overflow: "hidden", fontFamily: FF }}>

      {/* TOPBAR */}
      <div style={{ background: DS.surface, borderBottom: `1px solid ${DS.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: DS.text }}>CNC · Emmegi CENTRO 2</span>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: DS.amberLight, color: DS.amber, fontWeight: 700 }}>TCUT v1.7 · USTD PVC</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: DS.sub }}>Barra:</span>
          <select value={lungBarra} onChange={e => setLungBarra(+e.target.value)}
            style={{ padding: "4px 8px", border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, fontFamily: DS.mono, background: DS.surface, color: DS.text }}>
            {[5000, 5500, 6000, 6500, 7000].map(l =>
              <option key={l} value={l}>{l} mm</option>
            )}
          </select>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: `1px solid ${DS.border}`, background: DS.surface, paddingLeft: 16, flexShrink: 0 }}>
        <Tab id="disegni" label="Disegni tipologie" />
        <Tab id="taglio" label="Lista taglio" />
        <Tab id="ott" label="Ottimizzazione barre" />
        <Tab id="export" label="Export LST / OPT" />
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* SIDEBAR */}
        <div style={{ width: 220, flexShrink: 0, background: DS.surface, borderRight: `1px solid ${DS.border}`, display: "flex", flexDirection: "column" as any, overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${DS.border}`, fontSize: 10, fontWeight: 700, color: DS.sub, textTransform: "uppercase" as any, letterSpacing: 0.8 }}>
            Commesse ({commesseProd.length})
          </div>
          <div style={{ flex: 1, overflowY: "auto" as any }}>
            {commesseProd.length === 0 && (
              <div style={{ padding: 24, textAlign: "center" as any, fontSize: 12, color: DS.sub }}>
                Nessuna commessa in produzione
              </div>
            )}
            {commesseProd.map((c: any) => {
              const vani = (c.vani || []).filter((v: any) => !v.eliminato);
              const sel = selCm === c.id;
              return (
                <div key={c.id} onClick={() => setSelCm(sel ? null : c.id)}
                  style={{ padding: "10px 12px", borderBottom: `1px solid ${DS.border}`, cursor: "pointer", background: sel ? "#FEF3C7" : "transparent", borderLeft: `3px solid ${sel ? DS.amber : "transparent"}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: DS.text }}>{c.cliente} {c.cognome || ""}</div>
                  <div style={{ fontSize: 10, color: DS.sub, marginTop: 1 }}>{c.code} · {vani.length} vani</div>
                  <div style={{ fontSize: 10, marginTop: 3, display: "inline-block", padding: "1px 6px", borderRadius: 3, background: DS.amberLight, color: DS.amber, fontWeight: 600 }}>{c.fase}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, overflowY: "auto" as any, padding: 20, minWidth: 0 }}>

          {!selCm ? (
            <div style={{ textAlign: "center" as any, padding: 60, color: DS.sub }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>⚙</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: DS.text }}>Seleziona una commessa</div>
              <div style={{ fontSize: 12, maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
                La lista taglio, l'ottimizzazione FFD e l'export in formato Emmegi USTD PVC vengono calcolati automaticamente dalle misure dei vani.
              </div>
            </div>
          ) : (
            <>
              {/* KPI */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                <Kpi label="Barre totali" value={kpi.totBarre} color={DS.amber} />
                <Kpi label="Pezzi da tagliare" value={kpi.totPezzi} color={DS.blue} />
                <Kpi label="Rendimento medio" value={`${kpi.rendMedio}%`}
                  color={kpi.rendMedio >= 85 ? DS.green : kpi.rendMedio >= 70 ? DS.amber : DS.red} />
                <Kpi label="Metri lineari" value={`${kpi.metriLineari}m`} color={DS.text} />
              </div>

              {/* ─── TAB DISEGNI ─── */}
              {activeTab === "disegni" && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DS.text, marginBottom: 14 }}>
                    Vista interna · {vaniSel.length} vani
                  </div>
                  {vaniSel.length === 0 && (
                    <div style={{ color: DS.sub, fontSize: 12 }}>Nessun vano in questa commessa.</div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px,1fr))", gap: 14 }}>
                    {vaniSel.map((v: any, i: number) => {
                      const m = v.misure || {};
                      const L = parseInt(m.lCentro || m.larghezza || 1200);
                      const H = parseInt(m.hCentro || m.altezza || 2100);
                      const tipo: TipApertura = v.tipologia || "2ante_ar";
                      const nPezzi = calcolaPezziVano(v, i + 1).length;
                      return (
                        <div key={v.id || i} style={{ background: DS.surface, borderRadius: 10, border: `1px solid ${DS.border}`, overflow: "hidden" }}>
                          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${DS.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: DS.text }}>
                                Vano {i + 1} · {v.nome || v.tipologiaLabel || tipo.toUpperCase()}
                              </div>
                              <div style={{ fontSize: 10, color: DS.sub, marginTop: 1 }}>
                                {v.sistema || "—"} · {v.coloreEsterno || v.colore || "—"}
                              </div>
                            </div>
                            <span style={{ fontSize: 12, fontFamily: DS.mono, color: DS.amber, fontWeight: 700 }}>
                              {L}×{H}
                            </span>
                          </div>
                          <div style={{ padding: 12, background: DS.bg, display: "flex", justifyContent: "center" }}>
                            <DisegnoTipologia tipo={tipo} L={L} H={H} w={260} h={180} />
                          </div>
                          <div style={{ padding: "6px 12px", display: "flex", justifyContent: "space-between", fontSize: 10, color: DS.sub }}>
                            <span>{nPezzi} pezzi da tagliare</span>
                            <span>{v.vetro || "—"} · qtà {v.qtà || 1}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── TAB LISTA TAGLIO ─── */}
              {activeTab === "taglio" && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DS.text, marginBottom: 14 }}>
                    Lista taglio · {tuttiPezzi.length} pezzi
                  </div>
                  {gruppiOtt.map((g, gi) => (
                    <div key={gi} style={{ marginBottom: 16, background: DS.surface, borderRadius: 10, border: `1px solid ${DS.border}`, overflow: "hidden" }}>
                      <div style={{ padding: "8px 14px", background: DS.bg, borderBottom: `1px solid ${DS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: DS.text }}>{g.profilo}</span>
                          <span style={{ fontSize: 10, color: DS.sub, marginLeft: 8 }}>{g.categoria}</span>
                        </div>
                        <span style={{ fontSize: 10, color: DS.sub }}>
                          {g.barre.reduce((s, b) => s + b.pezzi.length, 0)} pz · {g.barre.length} barre · {g.colore}
                        </span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead>
                          <tr style={{ background: "#FAFAF8" }}>
                            {["N°", "Vano", "Etichetta", "Lungh. mm", "QT mm", "∠SX", "∠DX"].map((h, hi) => (
                              <th key={hi} style={{ padding: "6px 10px", textAlign: hi >= 3 ? "right" as any : "left", fontSize: 10, color: DS.sub, fontWeight: 600, borderBottom: `1px solid ${DS.border}`, textTransform: "uppercase" as any, letterSpacing: 0.5 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {g.barre.flatMap((b, bi) => b.pezzi.map((p, pi) => (
                            <tr key={`${bi}-${pi}`} style={{ borderBottom: `1px solid ${DS.border}` }}>
                              <td style={{ padding: "5px 10px", color: DS.sub, fontFamily: DS.mono }}>{bi * 100 + pi + 1}</td>
                              <td style={{ padding: "5px 10px", color: DS.sub }}>{p.vanoN}</td>
                              <td style={{ padding: "5px 10px", fontWeight: 500, color: DS.text }}>{p.label}</td>
                              <td style={{ padding: "5px 10px", textAlign: "right" as any, fontFamily: DS.mono, color: DS.amber, fontWeight: 700 }}>{p.lunghezza}</td>
                              <td style={{ padding: "5px 10px", textAlign: "right" as any, fontFamily: DS.mono, color: DS.sub }}>{p.qt}</td>
                              <td style={{ padding: "5px 10px", textAlign: "right" as any, fontFamily: DS.mono }}>{p.angSx}°</td>
                              <td style={{ padding: "5px 10px", textAlign: "right" as any, fontFamily: DS.mono }}>{p.angDx}°</td>
                            </tr>
                          )))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── TAB OTTIMIZZAZIONE ─── */}
              {activeTab === "ott" && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DS.text, marginBottom: 8 }}>
                    Ottimizzazione barre · FFD · {lungBarra} mm
                  </div>
                  <div style={{ fontSize: 11, color: DS.sub, marginBottom: 16, padding: "8px 12px", background: DS.surface, borderRadius: 6, border: `1px solid ${DS.border}`, display: "flex", gap: 16 }}>
                    <span>Scarto testa: {OPT.scartoTesta}mm</span>
                    <span>Coda: {OPT.scartoCoda}mm</span>
                    <span>Lama: {OPT.scartoLama}mm</span>
                    <span>Posizionamento: {OPT.scartoPosiz}mm</span>
                  </div>
                  {gruppiOtt.map((g, gi) => (
                    <div key={gi} style={{ marginBottom: 20, background: DS.surface, borderRadius: 10, border: `1px solid ${DS.border}`, overflow: "hidden" }}>
                      <div style={{ padding: "8px 14px", background: DS.bg, borderBottom: `1px solid ${DS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: DS.text }}>{g.profilo}</span>
                          <span style={{ fontSize: 10, color: DS.sub, marginLeft: 8 }}>{g.categoria} · {g.colore}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: DS.mono, color: g.rendimento >= 85 ? DS.green : g.rendimento >= 70 ? DS.amber : DS.red }}>
                          {g.rendimento}% · {g.barre.length} barre
                        </span>
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        {g.barre.map((b, bi) => (
                          <BarraViz key={bi} barra={b} idx={bi} lungBarra={lungBarra} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── TAB EXPORT ─── */}
              {activeTab === "export" && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DS.text, marginBottom: 14 }}>
                    Export · Emmegi USTD PVC · FpPro formato reale
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                    <div style={{ background: DS.surface, borderRadius: 10, border: `1px solid ${DS.border}`, padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: DS.text, marginBottom: 12 }}>Riepilogo</div>
                      {[
                        ["Commessa", `${cmSel?.code} · ${cmSel?.cliente}`],
                        ["Macchina", "Emmegi CENTRO 2"],
                        ["Driver", "emmegi_ustd_pvc · ID 280 · v4.1"],
                        ["Formato", "LST.TXT + OPT.TXT"],
                        ["Encoding", "ISO-8859-1 (FpPro standard)"],
                        ["Vani elaborati", `${vaniSel.length}`],
                        ["Pezzi totali", `${kpi.totPezzi}`],
                        ["Barre necessarie", `${kpi.totBarre}`],
                        ["Rendimento medio", `${kpi.rendMedio}%`],
                        ["Parametri ottimizzatore", `testa ${OPT.scartoTesta} · coda ${OPT.scartoCoda} · lama ${OPT.scartoLama}mm`],
                      ].map(([l, v], i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 9 ? `1px solid ${DS.border}` : "none" }}>
                          <span style={{ fontSize: 11, color: DS.sub }}>{l}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: DS.text }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: DS.topbar, borderRadius: 10, padding: 16, overflow: "hidden" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: DS.mono }}>
                        Anteprima LST.TXT
                      </div>
                      <div style={{ fontSize: 10, color: "#4ADE80", lineHeight: 2, fontFamily: DS.mono, whiteSpace: "pre-wrap" as any, wordBreak: "break-all" as any }}>
                        {tuttiPezzi.slice(0, 5).map(p =>
                          `"${cmSel?.code}","${p.vanoN}","${p.categoria}","${p.lunghezza}.0","${p.angSx}.0","${p.angDx}.0"\n`
                        ).join("")}
                        {tuttiPezzi.length > 5 && `... +${tuttiPezzi.length - 5} righe`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as any }}>
                    <button onClick={() => scaricaFile(generaLST(gruppiOtt, cmSel?.code || "CM"), `${cmSel?.code}_LST.TXT`)}
                      style={{ padding: "10px 20px", borderRadius: 8, background: DS.amber, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                      Scarica LST.TXT
                    </button>
                    <button onClick={() => scaricaFile(generaOPT(gruppiOtt, cmSel?.code || "CM", lungBarra), `${cmSel?.code}_OPT.TXT`)}
                      style={{ padding: "10px 20px", borderRadius: 8, background: DS.green, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                      Scarica OPT.TXT
                    </button>
                    <button onClick={() => {
                      scaricaFile(generaLST(gruppiOtt, cmSel?.code || "CM"), `${cmSel?.code}_LST.TXT`);
                      setTimeout(() => scaricaFile(generaOPT(gruppiOtt, cmSel?.code || "CM", lungBarra), `${cmSel?.code}_OPT.TXT`), 500);
                    }}
                      style={{ padding: "10px 20px", borderRadius: 8, background: DS.blue, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                      Scarica tutto
                    </button>
                    <button onClick={() => {
                      const b = gruppiOtt.flatMap(g => g.barre.flatMap(br => br.pezzi));
                      const csv = ["Vano,Profilo,Categoria,Colore,Lunghezza,QT,AngSX,AngDX",
                        ...b.map(p => `${p.vanoN},${p.profilo},${p.categoria},${p.colore},${p.lunghezza},${p.qt},${p.angSx},${p.angDx}`)
                      ].join("\n");
                      scaricaFile(csv, `${cmSel?.code}_distinta.csv`);
                    }}
                      style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", color: DS.sub, border: `1px solid ${DS.border}`, fontSize: 13, cursor: "pointer", fontFamily: FF }}>
                      Distinta CSV
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
