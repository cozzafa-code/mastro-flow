"use client";
import React, { useState } from "react";
import { CycleCountSched } from "../../hooks/useMagazzinoTop";
import { ModalRegistraConta } from "./ModaliMagazzino2";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

export default function VistaCycleCount({ mag }: { mag: any }) {
  const [openConta, setOpenConta] = useState<CycleCountSched | null>(null);
  const aziendaId = (mag.articoli[0] as any)?.azienda_id || "ccca51c1-656b-4e7c-a501-55753e20da29";
  const scheds: CycleCountSched[] = mag.cycleScheds || [];
  const oggi = scheds.filter(s => s.urgenza === "oggi" || s.urgenza === "scaduta");
  const accuracy = mag.accuracy || 98.2;

  return (
    <div style={{ paddingBottom: 70 }}>
      {/* Hero accuracy */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
        color: "#fff", borderRadius: 13, padding: "12px 14px", marginBottom: 9,
      }}>
        <div style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
          Accuracy magazzino
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{accuracy}%</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          +1.4% vs mese scorso · target 99%
        </div>
      </div>

      {/* Conte oggi */}
      <div style={sezStyle}>
        <div style={{
          fontSize: 9.5, fontWeight: 800, color: NAVY,
          letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
          display: "flex", justifyContent: "space-between",
        }}>
          <span>Conte programmate oggi</span>
          <span style={{ background: NAVY, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 10 }}>
            {oggi.length}
          </span>
        </div>

        {oggi.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11 }}>
            Nessuna conta programmata oggi
          </div>
        ) : oggi.map(s => <CcCard key={s.id} s={s} />)}
      </div>

      {/* Cadenza ABC */}
      <div style={sezStyle}>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
          Cadenza ABC
        </div>
        <CadenzaRow classe="A" color={RED} testo="Settimanale" sub={`${mag.kpi?.n_class_a || 0} art. · 52 volte/anno`} />
        <CadenzaRow classe="B" color={AMBER} testo="Bisettimanale" sub={`${mag.kpi?.n_class_b || 0} art. · 26 volte/anno`} />
        <CadenzaRow classe="C" color={MUTED} testo="Mensile" sub={`${mag.kpi?.n_class_c || 0} art. · 12 volte/anno`} />
      </div>

      {/* Vantaggio */}
      <div style={{
        padding: "9px 11px", borderRadius: 9, fontSize: 11, marginBottom: 9,
        display: "flex", alignItems: "center", gap: 9,
        background: "#D5EBE0", color: GREEN, borderLeft: `3px solid ${GREEN}`,
      }}>
        <CheckIcon size={20} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Inventario 31/12 non più necessario</div>
          <div style={{ fontSize: 9.5, marginTop: 2, opacity: 0.9 }}>
            Con conta ciclica continua · risparmio 1 giornata di chiusura
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", padding: "10px 12px",
        display: "flex", gap: 8, alignItems: "center",
        borderTop: "1px solid #E5EAF0", boxShadow: "0 -4px 12px rgba(0,0,0,0.1)", zIndex: 40,
      }}>
        <div style={{ flex: 1, fontSize: 11, color: NAVY, fontWeight: 700 }}>
          Prossima: <b>{oggi[0]?.zona || "oggi 14:30"}</b>
        </div>
        <button onClick={() => setOpenConta(oggi[0] || ({ id: "", zona: "Generica", abc_class: null, cadenza_giorni: 30, ultima_conta_at: null, prossima_conta_at: null, urgenza: "futura", n_articoli_zona: mag.articoli?.length || 0 } as any))} style={{
          padding: "11px 14px", background: TEAL, color: "#fff",
          borderRadius: 9, fontSize: 11, fontWeight: 800,
          letterSpacing: 0.3, textTransform: "uppercase", border: "none", cursor: "pointer",
        }}>CONTA ORA</button>
      {openConta && <ModalRegistraConta mag={mag} aziendaId={aziendaId} schedule={{ id: openConta.id, zona: openConta.zona, abc_class: openConta.abc_class }} onClose={() => setOpenConta(null)} />}
      </div>
    </div>
  );
}

function CcCard({ s }: { s: CycleCountSched }) {
  const colorMap: Record<string, string> = {
    A: RED, B: AMBER, C: MUTED,
  };
  const color = colorMap[s.abc_class || "C"];

  return (
    <div style={{
      background: "#F7F9FB", borderRadius: 9, padding: "9px 11px", marginBottom: 6,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: NAVY, display: "flex", alignItems: "center", gap: 6 }}>
          <TargetIcon size={13} />
          {s.zona || "Zona"}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: "2px 7px",
          borderRadius: 99, color: "#fff", background: color,
          letterSpacing: 0.3, textTransform: "uppercase",
        }}>{s.abc_class || "?"}</span>
      </div>
      <div style={{ fontSize: 9.5, color: MUTED, fontWeight: 600 }}>
        {s.n_articoli_zona} articoli · ogni {s.cadenza_giorni}gg
      </div>
      <div style={{ background: "#fff", height: 6, borderRadius: 99, overflow: "hidden", marginTop: 5 }}>
        <div style={{ height: "100%", width: s.urgenza === "scaduta" ? "0%" : "33%", background: TEAL }} />
      </div>
    </div>
  );
}

function CadenzaRow({ classe, color, testo, sub }: { classe: string; color: string; testo: string; sub: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "7px 0", borderBottom: "1px solid #E5EAF0", fontSize: 11,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 18, height: 18, borderRadius: 5, background: color, color: "#fff",
          fontSize: 10, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{classe}</span>
        <span style={{ fontWeight: 700, color: NAVY }}>{testo}</span>
      </div>
      <span style={{ color: MUTED }}>{sub}</span>
    </div>
  );
}

const sezStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 13, padding: "11px 12px",
  marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

const TargetIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
