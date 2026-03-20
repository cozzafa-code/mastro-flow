"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO APEX CONFIGURATORE V2 — THE ULTIMATE COMMAND CENTER
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useCallback } from "react";
import DisegnoTecnico from "./DisegnoTecnico";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

// Palette Design System Immutabile
const BG = "#F2F1EC"; const TOPBAR = "#1A1A1C"; const AMBER = "#D08008";
const GREEN = "#1A9E73"; const RED = "#DC4444"; const BLUE = "#3B7FE0";
const BDR = "#E0DED8"; const WHITE = "#FFFFFF";

export default function ConfiguratoreCommessa({ commessa, onClose }: { commessa: any, onClose: () => void }) {
  const { setCantieri, getVaniAttivi } = useMastro();

  // 1. STATO GLOBALE VANI (Recupero o Inizializzazione)
  const vaniInit = getVaniAttivi ? getVaniAttivi(commessa) : (commessa.vani || []).filter(v => !v.eliminato);
  const [vani, setVani] = useState<any[]>(vaniInit.length > 0 ? vaniInit : [{
    id: Date.now(), 
    nome: "Vano 1", 
    misure: { lCentro: 1000, hCentro: 1200 }, 
    pezzi: 1, 
    sistema: "ALLUMINIO", 
    vetro: "std",
    disegno: { montanti: [{id: "m1", x: 500}], traversi: [], config: {}, vetriConfig: {} }
  }]);

  const [selIdx, setSelIdx] = useState(0);
  const [tab, setTab] = useState<"base" | "tecnica" | "accessori">("base");
  const [saved, setSaved] = useState(false);

  const vano = vani[selIdx] || vani[0];

  // 2. HELPER AGGIORNAMENTO DINAMICO
  const upd = (field: string, val: any) => setVani(p => p.map((v, i) => i === selIdx ? { ...v, [field]: val } : v));
  const updM = (field: string, val: any) => setVani(p => p.map((v, i) => i === selIdx ? { ...v, misure: { ...v.misure, [field]: val } } : v));

  // 3. SYNC CAD -> SIDEBAR (Il ponte dei dati)
  const onCadUpdate = useCallback((cadData: any) => {
    setVani(prev => prev.map((v, i) => i === selIdx ? { 
      ...v, 
      disegno: cadData, 
      cadStats: cadData.stats,
      misure: { ...v.misure, lCentro: cadData.L || v.misure.lCentro, hCentro: cadData.H || v.misure.hCentro }
    } : v));
  }, [selIdx]);

  const save = () => {
    setCantieri((p: any[]) => p.map(c => c.id === commessa.id ? { ...c, vani } : c));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: BG, display: "flex", flexDirection: "column", fontFamily: FF, overflow: "hidden" }}>
      
      {/* ── TOPBAR NERA PROFESSIONALE ── */}
      <div style={{ height: 60, background: TOPBAR, display: "flex", alignItems: "center", padding: "0 24px", gap: 20, color: WHITE }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: AMBER, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: TOPBAR }}>M</div>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 1.5 }}>MASTRO APEX ENGINE</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#6B6B70", fontWeight: 700 }}>TOTALE COMMESSA</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: GREEN, fontFamily: FM }}>€ {vani.reduce((acc, v) => acc + (v.cadStats?.prezzoFin || 0), 0).toLocaleString()}</div>
          </div>
          <button onClick={save} style={{ padding: "12px 28px", background: saved ? GREEN : AMBER, color: WHITE, border: "none", borderRadius: 12, fontWeight: 800, cursor: "pointer", transition: "0.3s" }}>
            {saved ? "✓ SALVATO" : "SALVA TUTTO"}
          </button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B6B70", cursor: "pointer", fontSize: 24 }}>✕</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* COL 1: LISTA VANI (240px) */}
        <div style={{ width: 240, background: WHITE, borderRight: `1px solid ${BDR}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px", borderBottom: `1px solid ${BDR}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: TOPBAR, letterSpacing: 1 }}>VANI ({vani.length})</span>
            <button onClick={() => setVani([...vani, { id: Date.now(), nome: `Vano ${vani.length+1}`, misure: {lCentro:1000, hCentro:1200}, sistema:"ALLUMINIO", vetro:"std", disegno:{} }])} 
                    style={{ width: 24, height: 24, borderRadius: 6, background: GREEN, color: WHITE, border: "none", cursor: "pointer" }}>+</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {vani.map((v, i) => (
              <div key={v.id} onClick={() => setSelIdx(i)} style={{ padding: "16px 20px", borderBottom: `1px solid ${BG}`, cursor: "pointer", background: i === selIdx ? "#F2F1EC" : "transparent", borderLeft: i === selIdx ? `4px solid ${AMBER}` : "4px solid transparent" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: i === selIdx ? TOPBAR : "#6B6B70" }}>{v.nome}</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{v.misure.lCentro} x {v.misure.hCentro} mm</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: AMBER, marginTop: 8, fontFamily: FM }}>€ {v.cadStats?.prezzoFin || 0}</div>
              </div>
            ))}
          </div>
        </div>

        {/* COL 2: DATI TECNICI E REPORT (380px) */}
        <div style={{ width: 380, background: WHITE, borderRight: `1px solid ${BDR}`, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${BDR}` }}>
            {["base", "accessori"].map((tId) => (
              <div key={tId} onClick={() => setTab(tId as any)} style={{ flex: 1, textAlign: "center", padding: "16px 0", fontSize: 11, fontWeight: 800, cursor: "pointer", color: tab === tId ? AMBER : "#6B6B70", borderBottom: tab === tId ? `2.5px solid ${AMBER}` : "none", textTransform: "uppercase" }}>{tId}</div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            <input value={vano.nome} onChange={e => upd("nome", e.target.value)} style={{ fontSize: 24, fontWeight: 900, border: "none", outline: "none", marginBottom: 24, width: "100%" }} />
            
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 800, color: "#999", display: "block", marginBottom: 8 }}>LARGHEZZA mm</label>
                <input type="number" value={vano.misure.lCentro} onChange={e => updM("lCentro", parseInt(e.target.value))} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 800, color: "#999", display: "block", marginBottom: 8 }}>ALTEZZA mm</label>
                <input type="number" value={vano.misure.hCentro} onChange={e => updM("hCentro", parseInt(e.target.value))} style={inputStyle} />
              </div>
            </div>

            {/* DASHBOARD RISULTATI INDUSTRIALI (VINCITRICE) */}
            <div style={{ background: TOPBAR, borderRadius: 20, padding: 24, color: WHITE, marginTop: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: AMBER, marginBottom: 20, letterSpacing: 1.5 }}>ANALISI PRESTAZIONALE V150</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#6B6B70" }}>TERMICA Uw</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: GREEN, fontFamily: FM }}>{vano.cadStats?.uw || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#6B6B70" }}>PESO TOTALE</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: BLUE, fontFamily: FM }}>{vano.cadStats?.peso || 0} kg</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#6B6B70" }}>SFRIDO BARRE</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: AMBER, fontFamily: FM }}>{vano.cadStats?.sfrido || 0}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#6B6B70" }}>ORE PROD.</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: WHITE, fontFamily: FM }}>{vano.cadStats?.ore || 0}h</div>
                </div>
              </div>
              {vano.cadStats?.condensa && (
                <div style={{ marginTop: 20, background: RED, color: WHITE, padding: 12, borderRadius: 12, fontSize: 10, fontWeight: 900, textAlign: "center" }}>⚠️ RISCHIO CONDENSA RILEVATO</div>
              )}
            </div>
          </div>

          <div style={{ padding: 24, borderTop: `1px solid ${BDR}`, display: "flex", gap: 10 }}>
            <button onClick={() => setVani([...vani, { ...vano, id: Date.now() }])} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${BDR}`, fontWeight: 700, cursor: "pointer", background: WHITE }}>DUPLICA</button>
            <button onClick={() => { if(vani.length>1){ setVani(vani.filter((_,i)=>i!==selIdx)); setSelIdx(0); } }} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${RED}30`, color: RED, fontWeight: 700, cursor: "pointer" }}>ELIMINA</button>
          </div>
        </div>

        {/* COL 3: IL MOTORE CAD (flex:1) */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex" }}>
          <DisegnoTecnico
            realW={vano.misure.lCentro}
            realH={vano.misure.hCentro}
            vanoNome={vano.nome}
            {...(vano.disegno || {})} 
            mode="marketing" 
            onUpdate={onCadUpdate}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${BDR}`, fontSize: 16, fontWeight: 700, fontFamily: FM, outline: "none" };