"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD v2 — Sistema Parametrico Serramenti
// Una schermata: categoria → configurazione → misure → canvas
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo } from "react";
import MastroCadEngine, {
  defaultCadConfig, TIPOLOGIE_DEFAULT, PROFILI_DEFAULT,
  type CadConfig, type Tipologia,
} from "./MastroCadEngine";

const AMB = "#D08008", GRN = "#1A9E73", RED = "#DC4444", BLU = "#3B7FE0";
const BG = "#F2F1EC", TOP = "#1A1A1C";

// ── CATEGORIE ───────────────────────────────────────────────────
const CATEGORIE = [
  { id: "infisso",    label: "Infisso",      col: BLU },
  { id: "persiana",   label: "Persiana",     col: "#8a6a40" },
  { id: "vetrina",    label: "Vetrina",      col: GRN },
  { id: "porta",      label: "Porta",        col: AMB },
  { id: "zanzariera", label: "Zanzariera",   col: "#5a8a6a" },
  { id: "copricaldaia",label: "Copri Caldaia",col: "#5a5a6a" },
];

// ── CONFIGURAZIONI PER CATEGORIA ────────────────────────────────
// Ogni config ha: id, label, cols (array %), celle, righe
const CONFIGS: Record<string, any[]> = {
  infisso: [
    { id:"F1A_DX",   label:"1 Anta →",        cols:[100],          righe:[[100]],          celle:[{tipo:"anta",verso:"dx"}] },
    { id:"F1A_SX",   label:"← 1 Anta",         cols:[100],          righe:[[100]],          celle:[{tipo:"anta",verso:"sx"}] },
    { id:"F2A",      label:"2 Ante",            cols:[50,50],        righe:[[100],[100]],    celle:[{tipo:"anta",verso:"sx"},{tipo:"anta",verso:"dx"}] },
    { id:"F3A",      label:"3 Ante",            cols:[33,34,33],     righe:[[100],[100],[100]], celle:[{tipo:"fisso"},{tipo:"anta",verso:"sx"},{tipo:"anta",verso:"dx"}] },
    { id:"FISSO",    label:"Fisso",             cols:[100],          righe:[[100]],          celle:[{tipo:"fisso"}] },
    { id:"VASISTAS", label:"Vasistas",          cols:[100],          righe:[[35,65]],        celle:[{tipo:"vasistas"},{tipo:"fisso"}] },
    { id:"SOPRALUCE",label:"Sopraluce",         cols:[50,50],        righe:[[28,72],[28,72]], celle:[{tipo:"fisso"},{tipo:"fisso"},{tipo:"anta",verso:"sx"},{tipo:"anta",verso:"dx"}] },
    { id:"SC2",      label:"Scorrevole 2",      cols:[50,50],        righe:[[100],[100]],    celle:[{tipo:"scorrevole",verso:"dx"},{tipo:"fisso"}] },
    { id:"SC3",      label:"Scorrevole 3",      cols:[33,34,33],     righe:[[100],[100],[100]], celle:[{tipo:"scorrevole",verso:"dx"},{tipo:"fisso"},{tipo:"scorrevole",verso:"sx"}] },
    { id:"PF1",      label:"Portafinestra 1",   cols:[100],          righe:[[100]],          celle:[{tipo:"portafinestra",verso:"dx"}] },
    { id:"PF2",      label:"Portafinestra 2",   cols:[50,50],        righe:[[100],[100]],    celle:[{tipo:"portafinestra",verso:"sx"},{tipo:"portafinestra",verso:"dx"}] },
    { id:"ALZANTE",  label:"Alzante Scorr.",    cols:[50,50],        righe:[[100],[100]],    celle:[{tipo:"alzante",verso:"dx"},{tipo:"fisso"}] },
  ],
  persiana: [
    { id:"P_1",      label:"Avvolgibile 1",     cols:[100],          righe:[[100]],          celle:[{tipo:"fisso"}] },
    { id:"P_2",      label:"Avvolgibile 2",     cols:[50,50],        righe:[[100],[100]],    celle:[{tipo:"fisso"},{tipo:"fisso"}] },
    { id:"P_VEN",    label:"Veneziana",         cols:[100],          righe:[[100]],          celle:[{tipo:"vasistas"}] },
  ],
  vetrina: [
    { id:"V3",       label:"3 Campate",         cols:[33,34,33],     righe:[[100],[100],[100]], celle:[{tipo:"fisso"},{tipo:"scorrevole",verso:"dx"},{tipo:"fisso"}] },
    { id:"V5",       label:"5 Campate",         cols:[20,20,20,20,20], righe:[[100],[100],[100],[100],[100]], celle:[{tipo:"fisso"},{tipo:"anta",verso:"sx"},{tipo:"scorrevole",verso:"dx"},{tipo:"anta",verso:"dx"},{tipo:"fisso"}] },
    { id:"PV",       label:"Porta+Vetrina",     cols:[25,25,25,25],  righe:[[100],[100],[100],[100]], celle:[{tipo:"fisso"},{tipo:"portafinestra",verso:"sx"},{tipo:"portafinestra",verso:"dx"},{tipo:"fisso"}] },
  ],
  porta: [
    { id:"PT1",      label:"Porta singola →",   cols:[100],          righe:[[100]],          celle:[{tipo:"portafinestra",verso:"dx"}] },
    { id:"PT1L",     label:"← Porta singola",   cols:[100],          righe:[[100]],          celle:[{tipo:"portafinestra",verso:"sx"}] },
    { id:"PT2",      label:"Porta doppia",      cols:[50,50],        righe:[[100],[100]],    celle:[{tipo:"portafinestra",verso:"sx"},{tipo:"portafinestra",verso:"dx"}] },
    { id:"PTF",      label:"Fisso+Porta",       cols:[30,70],        righe:[[100],[100]],    celle:[{tipo:"fisso"},{tipo:"portafinestra",verso:"dx"}] },
    { id:"PTFF",     label:"Porta+Fisso",       cols:[70,30],        righe:[[100],[100]],    celle:[{tipo:"portafinestra",verso:"sx"},{tipo:"fisso"}] },
  ],
  zanzariera: [
    { id:"Z1",       label:"1 Anta",            cols:[100],          righe:[[100]],          celle:[{tipo:"scorrevole",verso:"dx"}] },
    { id:"Z2",       label:"2 Ante",            cols:[50,50],        righe:[[100],[100]],    celle:[{tipo:"scorrevole",verso:"dx"},{tipo:"fisso"}] },
    { id:"ZP",       label:"Plissé",            cols:[100],          righe:[[100]],          celle:[{tipo:"vasistas"}] },
  ],
  copricaldaia: [
    { id:"CC1",      label:"Box singolo",       cols:[100],          righe:[[100]],          celle:[{tipo:"fisso"}] },
    { id:"CC2",      label:"Box doppio",        cols:[50,50],        righe:[[100],[100]],    celle:[{tipo:"fisso"},{tipo:"fisso"}] },
    { id:"CCA",      label:"Con anta",          cols:[100],          righe:[[100]],          celle:[{tipo:"anta",verso:"dx"}] },
  ],
};

// ── MINI SVG PREVIEW ────────────────────────────────────────────
function MiniSVG({ cfg, sel, col }: { cfg: any; sel: boolean; col: string }) {
  const W = 72, H = 56, TF = 5, TM = 3, TA = 4;
  const cols = cfg.cols;
  const nCols = cols.length;
  const totalPct = cols.reduce((s: number, c: number) => s + c, 0);
  const innerW = W - TF * 2 - TM * (nCols - 1);
  const stroke = sel ? col : "#3a5a7a";
  const bg = sel ? col + "12" : "#f0f4f8";

  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" rx="4" fill="${bg}"/>`;
  // Telaio
  s += `<rect x="0" y="0" width="${W}" height="${TF}" fill="${stroke}" opacity="0.7"/>`;
  s += `<rect x="0" y="${H-TF}" width="${W}" height="${TF}" fill="${stroke}" opacity="0.7"/>`;
  s += `<rect x="0" y="${TF}" width="${TF}" height="${H-TF*2}" fill="${stroke}" opacity="0.7"/>`;
  s += `<rect x="${W-TF}" y="${TF}" width="${TF}" height="${H-TF*2}" fill="${stroke}" opacity="0.7"/>`;

  let curX = TF;
  cols.forEach((pct: number, ci: number) => {
    const cw = (pct / totalPct) * innerW;
    const righe = cfg.righe?.[ci] || [100];
    const totalH = righe.reduce((a: number, b: number) => a + b, 0);
    const innerH = H - TF * 2;

    if (ci > 0) {
      s += `<rect x="${curX - TM}" y="${TF}" width="${TM}" height="${innerH}" fill="${stroke}" opacity="0.5"/>`;
    }

    let curY = TF;
    righe.forEach((rh: number, ri: number) => {
      const ch = (rh / totalH) * innerH;
      const cellaIdx = cols.slice(0, ci).reduce((sum: number, _: any, i: number) => sum + (cfg.righe?.[i]?.length || 1), 0) + ri;
      const cella = cfg.celle?.[cellaIdx] || { tipo: "fisso", verso: "dx" };
      const gx = curX + TA, gy = curY + TA, gw = cw - TA * 2, gh = ch - TA * 2;

      // Bordo anta
      s += `<rect x="${curX}" y="${curY}" width="${cw}" height="${ch}" fill="none" stroke="${stroke}" stroke-width="0.8" opacity="0.4"/>`;
      // Vetro
      if (gw > 2 && gh > 2) s += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="#a8d4f040" stroke="#4a96b8" stroke-width="0.5"/>`;

      // Apertura
      if (cella.tipo === "anta" || cella.tipo === "portafinestra") {
        const r = Math.min(gw * 0.8, gh * 0.8);
        const cx = cella.verso === "sx" ? curX + cw : curX;
        const ex = cella.verso === "sx" ? curX : curX + cw;
        const sw = cella.verso === "sx" ? 1 : 0;
        s += `<path d="M${cx} ${curY+ch} A${r} ${r} 0 0 ${sw} ${ex} ${curY+ch}" fill="${GRN}15" stroke="${GRN}" stroke-width="0.8" stroke-dasharray="3,2"/>`;
        // Maniglia
        const mx = cella.verso === "dx" ? curX + cw - TA - 2 : curX + TA + 2;
        s += `<rect x="${mx-1.5}" y="${curY+ch/2-5}" width="3" height="10" rx="1.5" fill="${AMB}"/>`;
      } else if (cella.tipo === "scorrevole" || cella.tipo === "alzante") {
        const dir = cella.verso === "dx" ? 1 : -1;
        const cx2 = curX + cw/2, cy2 = curY + ch/2;
        s += `<line x1="${cx2-8*dir}" y1="${cy2}" x2="${cx2+8*dir}" y2="${cy2}" stroke="${GRN}" stroke-width="1.5"/>`;
        s += `<polygon points="${cx2+8*dir},${cy2-3} ${cx2+12*dir},${cy2} ${cx2+8*dir},${cy2+3}" fill="${GRN}"/>`;
      } else if (cella.tipo === "vasistas") {
        if (gw > 4 && gh > 4) {
          const vh = gh * 0.35;
          s += `<path d="M${gx} ${gy+vh} L${gx+gw/2} ${gy+2} L${gx+gw} ${gy+vh}" fill="${GRN}15" stroke="${GRN}" stroke-width="0.8" stroke-dasharray="2,2"/>`;
        }
      } else if (cella.tipo === "fisso") {
        s += `<line x1="${gx+2}" y1="${gy+2}" x2="${gx+gw-2}" y2="${gy+gh-2}" stroke="#4a7a9a" stroke-width="0.6" opacity="0.4"/>`;
        s += `<line x1="${gx+gw-2}" y1="${gy+2}" x2="${gx+2}" y2="${gy+gh-2}" stroke="#4a7a9a" stroke-width="0.6" opacity="0.4"/>`;
      }
      curY += ch;
    });
    curX += cw + TM;
  });

  s += `<rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="3.5" fill="none" stroke="${sel ? col : "#3a5a7a"}" stroke-width="${sel ? 2 : 0.8}"/>`;
  s += `</svg>`;
  return <div dangerouslySetInnerHTML={{ __html: s }} />;
}

// ── NUMPAD ───────────────────────────────────────────────────────
function Numpad({ label, value, onKey, onQuick }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ padding: "14px 18px", borderRadius: 12, background: "#fff", border: `2px solid ${AMB}`, fontSize: 32, fontWeight: 800, fontFamily: "monospace", textAlign: "right", color: TOP }}>
        {value || "—"}{value ? <span style={{ fontSize: 14, color: "#999", fontWeight: 400 }}> mm</span> : ""}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {["600","900","1200","1800"].map(v => (
          <button key={v} onClick={() => onKey("SET:" + v)} style={{ padding: "10px 4px", borderRadius: 9, border: `1px solid ${value===v?AMB:"#ddd"}`, background: value===v?AMB:"#fff", color: value===v?"#fff":"#444", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "monospace" }}>{v}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
        {[[-50,"−50"],[-10,"−10"],[+10,"+10"],[+50,"+50"]].map(([d,l]) => (
          <button key={l as string} onClick={() => onQuick(d as number)} style={{ padding: "8px 4px", borderRadius: 8, border: `1px solid ${GRN}40`, background: `${GRN}10`, color: GRN, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
        {["7","8","9","4","5","6","1","2","3","0","⌫","OK"].map(k => (
          <button key={k} onClick={() => onKey(k)} style={{ borderRadius: 10, border: `1px solid ${k==="OK"?GRN:k==="⌫"?RED:"#ddd"}`, background: k==="OK"?GRN:k==="⌫"?RED:"#fff", color: k==="OK"||k==="⌫"?"#fff":TOP, fontSize: k==="OK"||k==="⌫"?13:22, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 52, touchAction: "manipulation" }}>{k}</button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════
interface Props {
  onClose: () => void;
  onSalva?: (data: any) => void;
  onMisureUpdate?: (mis: { lCentro: number; hCentro: number }) => void;
  vanoNome?: string;
  misureIniziali?: { lCentro?: number; hCentro?: number };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════
export default function MastroCAD({ onClose, onSalva, onMisureUpdate, vanoNome, misureIniziali }: Props) {
  const [cat, setCat] = useState("infisso");
  const [cfgSel, setCfgSel] = useState<any>(CONFIGS.infisso[0]);
  const [step, setStep] = useState<"scegli" | "misure" | "canvas">("scegli");
  const [npTarget, setNpTarget] = useState<"W"|"H">("W");
  const [npW, setNpW] = useState(String(misureIniziali?.lCentro || ""));
  const [npH, setNpH] = useState(String(misureIniziali?.hCentro || ""));
  const [cadCfg, setCadCfg] = useState<CadConfig | null>(null);
  const [panelTab, setPanelTab] = useState<"profilo"|"divisori"|"quote">("profilo");
  const [montInput, setMontInput] = useState("");
  const [travInput, setTravInput] = useState("");

  const catCol = CATEGORIE.find(c => c.id === cat)?.col || BLU;
  const configs = CONFIGS[cat] || [];

  // ── Cambio categoria ─────────────────────────────────────────
  function selectCat(id: string) {
    setCat(id);
    setCfgSel(CONFIGS[id]?.[0] || null);
  }

  // ── Vai alle misure ──────────────────────────────────────────
  function vaiMisure() {
    if (!cfgSel) return;
    const W = parseInt(npW, 10), H = parseInt(npH, 10);
    if (W > 100 && H > 100) { buildCanvas(W, H); return; }
    setNpTarget("W");
    setStep("misure");
  }

  // ── Numpad key ───────────────────────────────────────────────
  function npKey(k: string) {
    const set = npTarget === "W" ? setNpW : setNpH;
    const val = npTarget === "W" ? npW : npH;
    if (k.startsWith("SET:")) { set(k.slice(4)); return; }
    if (k === "⌫") { set(val.slice(0, -1)); return; }
    if (k === "OK") {
      const mm = parseInt(val, 10) || 0;
      if (npTarget === "W") {
        const h = parseInt(npH, 10);
        if (h > 100) { buildCanvas(mm, h); }
        else { setNpTarget("H"); }
      } else {
        buildCanvas(parseInt(npW, 10), mm);
      }
      return;
    }
    set(val + k);
  }
  function npQuick(d: number) {
    const set = npTarget === "W" ? setNpW : setNpH;
    const val = npTarget === "W" ? npW : npH;
    set(String(Math.max(0, (parseInt(val, 10) || 0) + d)));
  }

  // ── Costruisci config canvas ─────────────────────────────────
  function buildCanvas(W: number, H: number) {
    // Converti config locale in formato CadConfig
    const tip: Tipologia = {
      id: cfgSel.id,
      nome: cfgSel.label,
      cols: cfgSel.cols,
      righe: cfgSel.righe,
      celle: cfgSel.celle,
    };
    const cfg: CadConfig = {
      ...defaultCadConfig(),
      W, H,
      tipologia: tip,
      montanti: [],
      traversi: [],
      showQuote: true,
    };
    setCadCfg(cfg);
    if (onMisureUpdate) onMisureUpdate({ lCentro: W, hCentro: H });
    setStep("canvas");
  }

  function handleSalva() {
    if (onSalva && cadCfg) onSalva({ config: cadCfg });
    onClose();
  }

  // ── STILI ────────────────────────────────────────────────────
  const root = { position: "fixed" as const, inset: 0, zIndex: 600, display: "flex", flexDirection: "column" as const, fontFamily: "system-ui", background: BG };
  const topbar = { background: TOP, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 };
  const backBtn = { background: "none", border: "none", color: "#888", fontSize: 22, cursor: "pointer" };
  const topTitle = { color: "#fff", fontSize: 14, fontWeight: 700, flex: 1 };
  const saveBtn = { padding: "7px 18px", borderRadius: 9, border: "none", background: GRN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" };

  // ════════════════════════════════════════════════════════════
  // STEP: SCEGLI (categoria + config in una sola schermata)
  // ════════════════════════════════════════════════════════════
  if (step === "scegli") {
    return (
      <div style={root}>
        <div style={topbar}>
          <button style={backBtn} onClick={onClose}>←</button>
          <div style={topTitle}>MASTRO CAD — {vanoNome || "Nuovo disegno"}</div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>

          {/* CATEGORIE — chip orizzontali */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {CATEGORIE.map(c => (
              <button key={c.id} onClick={() => selectCat(c.id)} style={{
                padding: "9px 18px", borderRadius: 20, border: `2px solid ${cat===c.id ? c.col : "#ddd"}`,
                background: cat===c.id ? c.col : "#fff", color: cat===c.id ? "#fff" : "#444",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>{c.label}</button>
            ))}
          </div>

          {/* CONFIGURAZIONI — griglia con preview SVG */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
            {configs.map((cfg: any) => (
              <button key={cfg.id} onClick={() => setCfgSel(cfg)} style={{
                background: cfgSel?.id===cfg.id ? catCol+"10" : "#fff",
                border: `2px solid ${cfgSel?.id===cfg.id ? catCol : "#e0ddd6"}`,
                borderRadius: 12, padding: "10px 6px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                <MiniSVG cfg={cfg} sel={cfgSel?.id===cfg.id} col={catCol} />
                <div style={{ fontSize: 11, fontWeight: 700, color: cfgSel?.id===cfg.id ? catCol : TOP, textAlign: "center" }}>{cfg.label}</div>
              </button>
            ))}
          </div>

          {/* MISURE RAPIDE inline */}
          {cfgSel && (
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: `1px solid #e0ddd6` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Misure (mm)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Larghezza</div>
                  <input
                    type="number" inputMode="numeric" value={npW} placeholder="es. 1200"
                    onChange={e => setNpW(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: 10, border: `2px solid ${npW ? AMB : "#ddd"}`, fontSize: 20, fontWeight: 800, fontFamily: "monospace", textAlign: "right", background: BG, color: TOP, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>Altezza</div>
                  <input
                    type="number" inputMode="numeric" value={npH} placeholder="es. 1500"
                    onChange={e => setNpH(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: 10, border: `2px solid ${npH ? AMB : "#ddd"}`, fontSize: 20, fontWeight: 800, fontFamily: "monospace", textAlign: "right", background: BG, color: TOP, boxSizing: "border-box" }}
                  />
                </div>
              </div>
              {/* Shortcuts misure */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {[["600×900","600","900"],["900×1500","900","1500"],["1200×1500","1200","1500"],["1500×2200","1500","2200"]].map(([l,w,h]) => (
                  <button key={l} onClick={() => { setNpW(w); setNpH(h); }} style={{
                    padding: "7px 12px", borderRadius: 8, border: `1px solid #ddd`,
                    background: (npW===w&&npH===h) ? AMB : "#fafafa",
                    color: (npW===w&&npH===h) ? "#fff" : "#666",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "monospace",
                  }}>{l}</button>
                ))}
              </div>
              <button
                onClick={vaiMisure}
                disabled={!cfgSel}
                style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: catCol, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: cfgSel ? 1 : 0.4 }}
              >
                Disegna {cfgSel?.label} {npW && npH ? `${npW}×${npH}mm` : "→"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // STEP: MISURE (numpad touch se non inserite sopra)
  // ════════════════════════════════════════════════════════════
  if (step === "misure") {
    const isW = npTarget === "W";
    return (
      <div style={root}>
        <div style={topbar}>
          <button style={backBtn} onClick={() => setStep("scegli")}>←</button>
          <div style={topTitle}>{cfgSel?.label} — {isW ? "Larghezza" : "Altezza"}</div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {!isW && npW && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: AMB+"15", border: `1px solid ${AMB}30`, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#888" }}>Larghezza: </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: AMB, fontFamily: "monospace" }}>{npW} mm</span>
            </div>
          )}
          <Numpad
            label={isW ? "Larghezza (mm)" : "Altezza (mm)"}
            value={isW ? npW : npH}
            onKey={npKey}
            onQuick={npQuick}
          />
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // STEP: CANVAS
  // ════════════════════════════════════════════════════════════
  if (step === "canvas" && cadCfg) {
    return (
      <div style={root}>
        <div style={topbar}>
          <button style={backBtn} onClick={() => setStep("scegli")}>←</button>
          <div style={topTitle}>
            {cfgSel?.label}
            <span style={{ fontSize: 11, color: "#555", marginLeft: 8, fontWeight: 400 }}>{cadCfg.W}×{cadCfg.H} mm</span>
          </div>
          <button style={saveBtn} onClick={handleSalva}>Salva</button>
        </div>

        {/* TABS */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0ddd6", display: "flex", flexShrink: 0 }}>
          {[["profilo","Profilo"],["divisori","Divisori"],["quote","Quote"]].map(([id,l]) => (
            <button key={id} onClick={() => setPanelTab(id as any)} style={{
              padding: "10px 16px", fontSize: 12, fontWeight: panelTab===id?700:500,
              border: "none", background: "none", cursor: "pointer", fontFamily: "inherit",
              color: panelTab===id?AMB:"#888",
              borderBottom: panelTab===id?`2px solid ${AMB}`:"2px solid transparent",
            }}>{l}</button>
          ))}
        </div>

        {/* PANEL */}
        <div style={{ background: "#fff", padding: "10px 14px", borderBottom: "1px solid #e0ddd6", flexShrink: 0, maxHeight: 160, overflow: "auto" }}>
          {panelTab === "profilo" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#888", fontWeight: 700 }}>Sistema:</span>
              {["Alluminio","PVC","Legno","Ferro"].map(s => {
                const cur = cadCfg.profili?.telaio?.sistema || "Generico";
                const sel = cur === s;
                return <button key={s} onClick={() => setCadCfg(p => ({ ...p!, profili: { ...p!.profili, telaio: { ...p!.profili.telaio, sistema: s } } }))} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${sel?AMB:"#ddd"}`, background: sel?AMB+"15":"#fafafa", color: sel?AMB:"#666", fontSize: 12, fontWeight: sel?700:500, cursor: "pointer" }}>{s}</button>;
              })}
              <span style={{ fontSize: 10, color: "#888", fontWeight: 700, marginLeft: 8 }}>Sp. telaio:</span>
              {[60,70,80,90].map(sp => {
                const cur = cadCfg.profili?.telaio?.larghezza || 60;
                return <button key={sp} onClick={() => setCadCfg(p => ({ ...p!, profili: { ...p!.profili, telaio: { ...p!.profili.telaio, larghezza: sp }, anta: { ...p!.profili.anta, larghezza: sp-10 }, montante: { ...p!.profili.montante, larghezza: sp } } }))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${cur===sp?BLU:"#ddd"}`, background: cur===sp?BLU+"15":"#fafafa", color: cur===sp?BLU:"#666", fontSize: 12, fontWeight: cur===sp?700:500, cursor: "pointer" }}>{sp}</button>;
              })}
            </div>
          )}
          {panelTab === "divisori" && (
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#888", fontWeight: 700, marginBottom: 6 }}>MONTANTE (mm dal sx)</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="number" value={montInput} onChange={e => setMontInput(e.target.value)} placeholder="es. 900" style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontFamily: "monospace" }}/>
                  <button onClick={() => { const mm = parseInt(montInput,10); if(mm>0&&mm<cadCfg.W){setCadCfg(p=>({...p!,montanti:[...(p!.montanti||[]),mm].sort((a,b)=>a-b)}));setMontInput("");} }} style={{ padding: "8px 12px", borderRadius: 8, background: AMB, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>+</button>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                  {(cadCfg.montanti||[]).map((mm,i) => <button key={i} onClick={() => setCadCfg(p=>({...p!,montanti:p!.montanti.filter((_,j)=>j!==i)}))} style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${AMB}`, background: AMB+"15", color: AMB, fontSize: 11, cursor: "pointer" }}>{mm}mm ×</button>)}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#888", fontWeight: 700, marginBottom: 6 }}>TRAVERSO (mm dall'alto)</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="number" value={travInput} onChange={e => setTravInput(e.target.value)} placeholder="es. 400" style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontFamily: "monospace" }}/>
                  <button onClick={() => { const mm = parseInt(travInput,10); if(mm>0&&mm<cadCfg.H){setCadCfg(p=>({...p!,traversi:[...(p!.traversi||[]),{mm}].sort((a:any,b:any)=>a.mm-b.mm)}));setTravInput("");} }} style={{ padding: "8px 12px", borderRadius: 8, background: BLU, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>+</button>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                  {(cadCfg.traversi||[]).map((t:any,i:number) => <button key={i} onClick={() => setCadCfg(p=>({...p!,traversi:p!.traversi.filter((_,j)=>j!==i)}))} style={{ padding: "3px 8px", borderRadius: 6, border: `1px solid ${BLU}`, background: BLU+"15", color: BLU, fontSize: 11, cursor: "pointer" }}>{t.mm}mm ×</button>)}
                </div>
              </div>
            </div>
          )}
          {panelTab === "quote" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={() => setCadCfg(p=>({...p!,showQuote:!p!.showQuote}))} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${cadCfg.showQuote?GRN:"#ddd"}`, background: cadCfg.showQuote?GRN+"15":"#fafafa", color: cadCfg.showQuote?GRN:"#666", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Quote {cadCfg.showQuote?"ON":"OFF"}</button>
              <span style={{ fontSize: 10, color: "#888" }}>L:</span>
              <input type="number" value={cadCfg.W} onChange={e => setCadCfg(p=>({...p!,W:parseInt(e.target.value,10)||p!.W}))} style={{ width: 70, padding: "6px 8px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13, fontFamily: "monospace" }}/>
              <span style={{ fontSize: 10, color: "#888" }}>H:</span>
              <input type="number" value={cadCfg.H} onChange={e => setCadCfg(p=>({...p!,H:parseInt(e.target.value,10)||p!.H}))} style={{ width: 70, padding: "6px 8px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13, fontFamily: "monospace" }}/>
              <span style={{ fontSize: 10, color: "#aaa" }}>mm</span>
            </div>
          )}
        </div>

        {/* CANVAS ENGINE */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <MastroCadEngine config={cadCfg} onChange={setCadCfg} height={undefined as any} />
        </div>
      </div>
    );
  }

  return null;
}
