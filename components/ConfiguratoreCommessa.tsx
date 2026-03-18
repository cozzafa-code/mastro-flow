"use client";
// @ts-nocheck
// MASTRO — ConfiguratoreCommessa.tsx
// Configuratore desktop professionale 3 colonne
// Differenziatori vs Opera/FPPRO: AI, margine live, SVG, U-value, cloud

import { useState, useMemo, useRef } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I, TIPOLOGIE_RAPIDE } from "./mastro-constants";

const TEAL = "#1A9E73";
const DARK = "#1A1A1C";
const AMBER = "#D08008";

// Tipi apertura con icona SVG
const APERTURE = [
  { id: "anta_sx",  label: "Anta SX" },
  { id: "anta_dx",  label: "Anta DX" },
  { id: "due_ante", label: "2 Ante" },
  { id: "fisso",    label: "Fisso" },
  { id: "scorrevole", label: "Scorrevole" },
  { id: "alzante",  label: "Alzante" },
];

const VETRI_COMUNI = ["4/16/4 Basso Emissivo", "4/20/4 Triplo", "4/16/4 Standard", "Stratificato 33.1", "Oscurato"];
const COLORI_COMUNI = ["Bianco RAL 9016", "Antracite RAL 7016", "Bronzo", "Naturale", "Avorio RAL 1013", "Personalizzato"];

// Calcolo U-value semplificato
function calcUw(lmm: number, hmm: number, vetro: string): number {
  const uf = vetro.includes("Triplo") ? 0.8 : vetro.includes("Basso Emissivo") ? 1.0 : 1.4;
  const ug = vetro.includes("Triplo") ? 0.6 : vetro.includes("Basso Emissivo") ? 1.0 : 1.4;
  const mq = (lmm / 1000) * (hmm / 1000);
  if (mq === 0) return 0;
  const perim = 2 * ((lmm + hmm) / 1000);
  const ag = Math.max(0, mq - 0.08 * perim);
  const af = mq - ag;
  return Math.round(((uf * af + ug * ag) / mq) * 100) / 100;
}

// Disegno SVG infisso
function InfissoSVG({ tipo, l, h, apertura, colore }: any) {
  const W = 200, H = 180;
  const scale = Math.min(W / (l || 1000), H / (h || 1000));
  const fw = (l || 1000) * scale;
  const fh = (h || 1000) * scale;
  const ox = (W - fw) / 2, oy = (H - fh) / 2;
  const stroke = colore?.includes("Antracite") ? "#3a3a3a" : colore?.includes("Bronzo") ? "#8B6914" : "#555";
  const t = 8; // spessore telaio

  const renderAnta = (x: number, y: number, w: number, h: number, dir: "sx" | "dx" | "none") => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={w} height={h} fill="rgba(147,210,235,0.35)" stroke={stroke} strokeWidth="1.5" />
      {dir === "sx" && <path d={`M${x+t} ${y+t} L${x+t} ${y+h-t} L${x+w-t} ${y+h/2}`} fill="none" stroke={stroke} strokeWidth="1" strokeDasharray="3,2" opacity="0.6"/>}
      {dir === "dx" && <path d={`M${x+w-t} ${y+t} L${x+w-t} ${y+h-t} L${x+t} ${y+h/2}`} fill="none" stroke={stroke} strokeWidth="1" strokeDasharray="3,2" opacity="0.6"/>}
      {/* maniglia */}
      {dir !== "none" && <rect x={dir==="sx"?x+w-t-3:x+t} y={y+h/2-8} width={3} height={16} rx={1.5} fill={stroke} opacity="0.8"/>}
    </g>
  );

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Telaio esterno */}
      <rect x={ox} y={oy} width={fw} height={fh} fill="none" stroke={stroke} strokeWidth={t} />
      {/* Contenuto per tipo */}
      {apertura === "due_ante" && (
        <>
          {renderAnta(ox + t, oy + t, fw/2 - t - 1, fh - t*2, "sx")}
          {renderAnta(ox + fw/2 + 1, oy + t, fw/2 - t - 1, fh - t*2, "dx")}
          <line x1={ox + fw/2} y1={oy} x2={ox + fw/2} y2={oy + fh} stroke={stroke} strokeWidth={3} />
        </>
      )}
      {apertura === "anta_sx" && renderAnta(ox + t, oy + t, fw - t*2, fh - t*2, "sx")}
      {apertura === "anta_dx" && renderAnta(ox + t, oy + t, fw - t*2, fh - t*2, "dx")}
      {(apertura === "fisso" || !apertura) && (
        <rect x={ox+t} y={oy+t} width={fw-t*2} height={fh-t*2} fill="rgba(147,210,235,0.3)" stroke={stroke} strokeWidth="1" />
      )}
      {apertura === "scorrevole" && (
        <>
          <rect x={ox+t} y={oy+t} width={fw/2-t-2} height={fh-t*2} fill="rgba(147,210,235,0.35)" stroke={stroke} strokeWidth="1"/>
          <rect x={ox+fw/2+2} y={oy+t} width={fw/2-t-2} height={fh-t*2} fill="rgba(147,210,235,0.2)" stroke={stroke} strokeWidth="1" strokeDasharray="4,2"/>
          <line x1={ox+fw/2} y1={oy+t} x2={ox+fw/2} y2={oy+fh-t} stroke={stroke} strokeWidth="2"/>
          <path d={`M${ox+fw/2-8} ${oy+fh/2} l8-6 0 12 z`} fill={stroke}/>
        </>
      )}
      {/* Quote */}
      <text x={ox + fw/2} y={oy + fh + 14} textAnchor="middle" fontSize="10" fill="#888" fontFamily={FM}>{l || "—"}</text>
      <text x={ox - 8} y={oy + fh/2} textAnchor="middle" fontSize="10" fill="#888" fontFamily={FM} transform={`rotate(-90, ${ox-8}, ${oy+fh/2})`}>{h || "—"}</text>
      {/* Quote lines */}
      <line x1={ox} y1={oy+fh+6} x2={ox+fw} y2={oy+fh+6} stroke="#ccc" strokeWidth="0.8"/>
      <line x1={ox-4} y1={oy} x2={ox-4} y2={oy+fh} stroke="#ccc" strokeWidth="0.8"/>
    </svg>
  );
}

export default function ConfiguratoreCommessa({ commessa, onClose }: { commessa: any, onClose: () => void }) {
  const ctx = useMastro();
  const { T, sistemiDB=[], vetriDB=[], aziendaDB, aziendaInfo, getVaniAttivi, calcolaVanoPrezzo, setCantieri } = ctx;
  const az = aziendaDB || aziendaInfo || {};

  const vaniOriginali = getVaniAttivi ? getVaniAttivi(commessa) : (commessa.vani || []).filter((v: any) => !v.eliminato);
  const [vani, setVani] = useState<any[]>(vaniOriginali.length > 0 ? vaniOriginali : [{ id: Date.now(), nome: "Vano 1", tipo: "finestra", misure: {}, pezzi: 1 }]);
  const [selIdx, setSelIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  const vano = vani[selIdx] || vani[0];
  const sistemi = sistemiDB.map((s: any) => s.sistema || s.nome).filter(Boolean);

  const upd = (field: string, val: any) => {
    setVani(prev => prev.map((v, i) => i === selIdx ? { ...v, [field]: val } : v));
  };
  const updMisure = (field: string, val: any) => {
    setVani(prev => prev.map((v, i) => i === selIdx ? { ...v, misure: { ...v.misure, [field]: val } } : v));
  };
  const addVano = () => {
    const n = { id: Date.now(), nome: `Vano ${vani.length + 1}`, tipo: "finestra", misure: {}, pezzi: 1 };
    setVani(p => [...p, n]);
    setSelIdx(vani.length);
  };
  const dupVano = () => {
    const copy = { ...vano, id: Date.now(), nome: vano.nome + " (copia)" };
    setVani(p => [...p, copy]);
    setSelIdx(vani.length);
  };
  const delVano = () => {
    if (vani.length === 1) return;
    setVani(p => p.filter((_, i) => i !== selIdx));
    setSelIdx(Math.max(0, selIdx - 1));
  };

  // Calcoli
  const prezzoVano = (v: any) => {
    if (calcolaVanoPrezzo) return calcolaVanoPrezzo(v, commessa);
    const m = v.misure || {};
    const lc = (m.lCentro || 0) / 1000;
    const hc = (m.hCentro || 0) / 1000;
    const mq = lc * hc;
    const pm = parseFloat(az.prezzoMqDefault || commessa.prezzoMq || 350);
    return Math.round(mq * pm * 100) / 100;
  };
  const costoVano = (v: any) => {
    const p = prezzoVano(v);
    const margin = parseFloat(az.marginePerc || "35") / 100;
    return Math.round(p * (1 - margin) * 100) / 100;
  };

  const totPrezzo = vani.reduce((s, v) => s + prezzoVano(v) * (v.pezzi || 1), 0);
  const totCosto = vani.reduce((s, v) => s + costoVano(v) * (v.pezzi || 1), 0);
  const margine = totPrezzo > 0 ? Math.round((1 - totCosto / totPrezzo) * 100) : 0;

  const uw = calcUw(vano.misure?.lCentro || 0, vano.misure?.hCentro || 0, vano.vetro || "");
  const uvClass = uw === 0 ? "—" : uw <= 1.0 ? "A+ (Eccellente)" : uw <= 1.4 ? "A (Ottimo)" : uw <= 1.8 ? "B (Buono)" : "C (Standard)";
  const uvColor = uw === 0 ? T.sub : uw <= 1.0 ? TEAL : uw <= 1.4 ? "#3B7FE0" : uw <= 1.8 ? AMBER : "#DC4444";

  const ivaPerc = commessa.ivaPerc || 10;
  const totIva = Math.round(totPrezzo * (1 + ivaPerc / 100) * 100) / 100;

  const Field = ({ label, children }: any) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      {children}
    </div>
  );
  const inp = (val: any, onChange: any, type = "text", ph = "") => (
    <input value={val || ""} onChange={e => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)} type={type} placeholder={ph}
      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${T.bdr}`, fontSize: 13, outline: "none", background: "#fff", fontFamily: FF, color: T.text, boxSizing: "border-box" }} />
  );
  const sel = (val: any, onChange: any, opts: string[]) => (
    <select value={val || ""} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${T.bdr}`, fontSize: 13, outline: "none", background: "#fff", fontFamily: FF, color: T.text }}>
      <option value="">— Seleziona —</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const saveAll = () => {
    setCantieri((prev: any[]) => prev.map(c => c.id === commessa.id ? { ...c, vani: vani } : c));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const COL1 = 260, COL2 = 380, COL3 = "flex: 1";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#F4F6F8", display: "flex", flexDirection: "column", fontFamily: FF }}>
      {/* HEADER */}
      <div style={{ height: 52, background: DARK, display: "flex", alignItems: "center", padding: "0 20px", gap: 14, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>M</div>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>CONFIGURATORE</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{commessa.code} — {commessa.cliente} {commessa.cognome || ""}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={saveAll} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: saved ? "#1A9E73" : TEAL, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
            {saved ? "✓ Salvato" : "Salva tutto"}
          </button>
          <button onClick={onClose} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", fontFamily: FF }}>Chiudi ×</button>
        </div>
      </div>

      {/* 3 COLONNE */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* COL 1 — LISTA VANI */}
        <div style={{ width: COL1, flexShrink: 0, background: "#fff", borderRight: `1px solid ${T.bdr}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.bdr}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: T.text, textTransform: "uppercase", letterSpacing: 0.5 }}>Vani ({vani.length})</span>
              <button onClick={addVano} style={{ padding: "4px 10px", borderRadius: 7, border: "none", background: TEAL, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>+ Aggiungi</button>
            </div>
            {/* Totali mini */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { l: "Totale vendita", v: `€${totPrezzo.toLocaleString("it-IT")}`, c: T.text },
                { l: `IVA ${ivaPerc}%`, v: `€${totIva.toLocaleString("it-IT")}`, c: T.text },
                { l: "Costo stimato", v: `€${totCosto.toLocaleString("it-IT")}`, c: T.sub },
                { l: "Margine", v: `${margine}%`, c: margine >= 30 ? TEAL : margine >= 20 ? AMBER : "#DC4444" },
              ].map((k, i) => (
                <div key={i} style={{ background: "#F8FAFC", borderRadius: 8, padding: "7px 10px" }}>
                  <div style={{ fontSize: 10, color: T.sub }}>{k.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: k.c, fontFamily: FM }}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {vani.map((v, i) => {
              const p = prezzoVano(v) * (v.pezzi || 1);
              const active = i === selIdx;
              return (
                <div key={v.id} onClick={() => setSelIdx(i)}
                  style={{ padding: "11px 16px", borderBottom: `1px solid ${T.bdr}`, cursor: "pointer", background: active ? TEAL + "10" : "transparent", borderLeft: `3px solid ${active ? TEAL : "transparent"}`, transition: "all 0.1s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: T.text }}>{v.nome || `Vano ${i + 1}`}</div>
                      <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                        {v.tipo || "—"} · {v.misure?.lCentro || "?"} × {v.misure?.hCentro || "?"} mm
                        {v.pezzi > 1 ? ` · x${v.pezzi}` : ""}
                      </div>
                      {v.sistema && <div style={{ fontSize: 10, color: TEAL, marginTop: 2 }}>{v.sistema}</div>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: FM, flexShrink: 0, marginLeft: 8 }}>
                      {p > 0 ? `€${p.toLocaleString("it-IT")}` : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COL 2 — CONFIGURATORE */}
        <div style={{ width: COL2, flexShrink: 0, background: "#fff", borderRight: `1px solid ${T.bdr}`, overflowY: "auto" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text, flex: 1 }}>{vano.nome || "Vano"}</span>
            <button onClick={dupVano} title="Duplica" style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: "transparent", fontSize: 11, color: T.sub, cursor: "pointer" }}>⧉ Duplica</button>
            <button onClick={delVano} title="Elimina" style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #DC444430", background: "transparent", fontSize: 11, color: "#DC4444", cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ padding: "16px 18px" }}>

            <Field label="Nome vano">
              {inp(vano.nome, (v: string) => upd("nome", v), "text", "Es. Soggiorno, Camera 1...")}
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Stanza">{inp(vano.stanza, (v: string) => upd("stanza", v), "text", "Es. Cucina")}</Field>
              <Field label="Piano">{inp(vano.piano, (v: string) => upd("piano", v), "text", "Es. P1")}</Field>
            </div>

            <Field label="Tipologia">
              {sel(vano.tipo, (v: string) => upd("tipo", v), TIPOLOGIE_RAPIDE?.map((t: any) => t.label) || ["Finestra", "Porta finestra", "Portone", "Scorrevole", "Alzante scorrevole", "Porta"])}
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field label="Larghezza (mm)">{inp(vano.misure?.lCentro, (v: number) => updMisure("lCentro", v), "number", "1200")}</Field>
              <Field label="Altezza (mm)">{inp(vano.misure?.hCentro, (v: number) => updMisure("hCentro", v), "number", "2100")}</Field>
              <Field label="Pezzi">{inp(vano.pezzi, (v: number) => upd("pezzi", Math.max(1, v || 1)), "number", "1")}</Field>
            </div>

            <Field label="Tipo apertura">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {APERTURE.map(a => (
                  <div key={a.id} onClick={() => upd("apertura", a.id)}
                    style={{ padding: "5px 12px", borderRadius: 7, border: `1.5px solid ${vano.apertura === a.id ? TEAL : T.bdr}`, background: vano.apertura === a.id ? TEAL + "12" : "transparent", fontSize: 11, fontWeight: 600, color: vano.apertura === a.id ? TEAL : T.sub, cursor: "pointer" }}>
                    {a.label}
                  </div>
                ))}
              </div>
            </Field>

            <Field label="Sistema profilo">
              {sel(vano.sistema, (v: string) => upd("sistema", v), sistemi.length > 0 ? sistemi : ["Schüco AWS 70", "Schüco AWS 90", "Reynaers CS 68", "Metra B70", "Sapa 4150", "PVC Veka Softline 82"])}
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Vetro">
                {sel(vano.vetro, (v: string) => upd("vetro", v), vetriDB.map((v: any) => v.nome || v.code) || VETRI_COMUNI)}
              </Field>
              <Field label="Colore">
                {sel(vano.coloreInt || vano.colore, (v: string) => upd("coloreInt", v), COLORI_COMUNI)}
              </Field>
            </div>

            {/* Accessori rapidi */}
            <Field label="Accessori">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[["tapparella", "Tapparella"], ["zanzariera", "Zanzariera"], ["cassonetto", "Cassonetto"], ["davanzale", "Davanzale"]].map(([key, label]) => {
                  const acc = vano.accessori || {};
                  const on = acc[key]?.attivo;
                  return (
                    <div key={key} onClick={() => upd("accessori", { ...acc, [key]: { ...(acc[key]||{}), attivo: !on } })}
                      style={{ padding: "5px 12px", borderRadius: 7, border: `1.5px solid ${on ? TEAL : T.bdr}`, background: on ? TEAL + "12" : "transparent", fontSize: 11, fontWeight: 600, color: on ? TEAL : T.sub, cursor: "pointer" }}>
                      {on ? "✓ " : ""}{label}
                    </div>
                  );
                })}
              </div>
            </Field>

            <Field label="Note vano">
              <textarea value={vano.note || ""} onChange={e => upd("note", e.target.value)} rows={2} placeholder="Specificazioni tecniche, note montaggio..."
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${T.bdr}`, fontSize: 12, outline: "none", resize: "none", fontFamily: FF, color: T.text, boxSizing: "border-box" }} />
            </Field>

            {/* Override prezzo manuale */}
            <Field label="Override prezzo (opzionale)">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input value={vano.prevPrezzoOverride ?? ""} onChange={e => upd("prevPrezzoOverride", e.target.value === "" ? null : parseFloat(e.target.value))} type="number" placeholder={`Auto: €${prezzoVano(vano).toLocaleString("it-IT")}`}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${T.bdr}`, fontSize: 13, outline: "none", fontFamily: FF }} />
                {vano.prevPrezzoOverride && <button onClick={() => upd("prevPrezzoOverride", null)} style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.bdr}`, background: "transparent", fontSize: 11, cursor: "pointer" }}>Reset</button>}
              </div>
            </Field>

          </div>
        </div>

        {/* COL 3 — ANTEPRIMA + DATI TECNICI */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Anteprima SVG */}
          <div style={{ background: "#fff", borderBottom: `1px solid ${T.bdr}`, padding: 20, display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>Anteprima</div>
              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, border: `1px solid ${T.bdr}` }}>
                <InfissoSVG tipo={vano.tipo} l={vano.misure?.lCentro} h={vano.misure?.hCentro} apertura={vano.apertura} colore={vano.coloreInt || vano.colore} />
              </div>
            </div>

            {/* Dati tecnici */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Dati tecnici</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { l: "Superficie", v: vano.misure?.lCentro && vano.misure?.hCentro ? `${((vano.misure.lCentro/1000) * (vano.misure.hCentro/1000)).toFixed(2)} m²` : "—" },
                  { l: "Pezzi", v: vano.pezzi || 1 },
                  { l: "Sistema", v: vano.sistema || "—" },
                  { l: "Vetro", v: vano.vetro || "—" },
                ].map((d, i) => (
                  <div key={i} style={{ background: "#F8FAFC", borderRadius: 8, padding: "9px 12px" }}>
                    <div style={{ fontSize: 10, color: T.sub }}>{d.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{d.v}</div>
                  </div>
                ))}
              </div>

              {/* U-value */}
              {uw > 0 && (
                <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: uvColor + "10", border: `1.5px solid ${uvColor}30` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: T.sub }}>Trasmittanza termica (CAM 2026)</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: uvColor, fontFamily: FM }}>Uw {uw} W/m²K</div>
                      <div style={{ fontSize: 11, color: uvColor, fontWeight: 600 }}>{uvClass}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown prezzo */}
          <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Riepilogo prezzi — {vano.nome || "Vano"}</div>
            <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
              {[
                { l: "Prezzo base (calcolato)", v: prezzoVano(vano), bold: false },
                { l: `Costo stimato (margine ${az.marginePerc || 35}%)`, v: costoVano(vano), bold: false, sub: true },
                { l: `Totale × ${vano.pezzi || 1} pezzi`, v: prezzoVano(vano) * (vano.pezzi || 1), bold: true },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", borderBottom: i < 2 ? `1px solid ${T.bdr}` : "none" }}>
                  <span style={{ fontSize: 13, color: r.sub ? T.sub : T.text }}>{r.l}</span>
                  <span style={{ fontSize: 13, fontWeight: r.bold ? 800 : 500, color: r.sub ? T.sub : T.text, fontFamily: FM }}>€{r.v.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            {/* Tutti i vani riepilogo */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5, margin: "20px 0 12px" }}>Riepilogo commessa</div>
            <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
              {vani.map((v, i) => (
                <div key={v.id} onClick={() => setSelIdx(i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: i < vani.length - 1 ? `1px solid ${T.bdr}` : "none", cursor: "pointer", background: i === selIdx ? TEAL + "08" : "transparent" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{v.nome || `Vano ${i + 1}`}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{v.misure?.lCentro || "?"}×{v.misure?.hCentro || "?"} · {v.tipo || "—"}{v.pezzi > 1 ? ` · ×${v.pezzi}` : ""}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: FM }}>€{(prezzoVano(v) * (v.pezzi || 1)).toLocaleString("it-IT")}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: DARK }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Totale IVA esclusa</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", fontFamily: FM }}>€{totPrezzo.toLocaleString("it-IT")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
