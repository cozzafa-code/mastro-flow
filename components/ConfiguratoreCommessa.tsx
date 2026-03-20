"use client";
// @ts-nocheck
import React, { useState } from "react";
import DisegnoTecnico from "./DisegnoTecnico";
import { useMastro } from "./MastroContext";

export default function ConfiguratoreCommessa({ commessa, onClose }) {
  const { setCantieri } = useMastro();
  const [vani, setVani] = useState(commessa.vani || [{ id: Date.now(), nome: "Vetrina Negozio", misure: { lCentro: 2500, hCentro: 3000 }, disegno: {} }]);
  const [selIdx, setSelIdx] = useState(0);
  const vano = vani[selIdx];

  const onCadUpdate = (d) => {
    setVani(prev => prev.map((v, i) => i === selIdx ? { ...v, disegno: d, misure: { lCentro: d.L, hCentro: d.H } } : v));
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#1A1A1C", display: "flex", flexDirection: "column" }}>
      {/* TOPBAR */}
      <div style={{ height: 60, background: "#000", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
        <div style={{ color: "#D08008", fontWeight: 900 }}>MASTRO APEX STRUTTURE v2.0</div>
        <button onClick={onClose} style={{ color: "#fff", background: "none", border: "none", fontSize: 24, cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ flex: 1, display: "flex" }}>
        {/* SIDEBAR DATI */}
        <div style={{ width: 350, background: "#FFF", borderRight: "1px solid #E0DED8", display: "flex", flexDirection: "column", padding: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>{vano.nome}</h2>
          
          {/* DASHBOARD PRESTAZIONI REALI */}
          <div style={{ background: "#1A1A1C", padding: 20, borderRadius: 20, color: "#fff" }}>
            <div style={{ fontSize: 10, color: "#D08008", fontWeight: 900, marginBottom: 15 }}>ANALISI FACCIATA</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div><small>Uw Termica</small><div style={{ fontSize: 20, fontWeight: 900, color: "#1A9E73" }}>{vano.disegno?.stats?.uw || "—"}</div></div>
              <div><small>Peso Vetrate</small><div style={{ fontSize: 20, fontWeight: 900, color: "#3B7FE0" }}>{vano.disegno?.stats?.peso || 0} kg</div></div>
              <div><small>Sfrido Alluminio</small><div style={{ fontSize: 16, fontWeight: 800, color: "#D08008" }}>{vano.disegno?.stats?.sfrido || 0}%</div></div>
              <div><small>Ore Officina</small><div style={{ fontSize: 16, fontWeight: 800 }}>{vano.disegno?.stats?.ore || 0}h</div></div>
            </div>
          </div>

          <div style={{ marginTop: "auto" }}>
            <button onClick={() => setCantieri(p => p.map(c => c.id === commessa.id ? { ...c, vani } : c))} 
                    style={{ width: "100%", padding: 20, background: "#D08008", color: "#fff", border: "none", borderRadius: 15, fontWeight: 900, cursor: "pointer" }}>SALVA PROGETTO</button>
          </div>
        </div>

        {/* CAD AREA */}
        <div style={{ flex: 1 }}>
          <DisegnoTecnico 
            realW={vano.misure.lCentro} 
            realH={vano.misure.hCentro} 
            onUpdate={onCadUpdate} 
            mode="marketing" 
          />
        </div>
      </div>
    </div>
  );
}