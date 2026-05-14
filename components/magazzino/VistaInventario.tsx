"use client";
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

export default function VistaInventario({ mag }: { mag: any }) {
  // Calcolo placeholder: in produzione da v_magazzino_inventario_anno + cycle_count_runs
  const mancanze = 260;
  const cali = 0;
  const eccedenze = 16;
  const netto = -mancanze + cali + eccedenze;
  const annoCorrente = new Date().getFullYear();

  return (
    <div style={{ paddingBottom: 70 }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY}, #0F1F33)`,
        color: "#fff", borderRadius: 13, padding: "12px 14px", marginBottom: 9,
      }}>
        <div style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
          Differenze nette anno {annoCorrente}
        </div>
        <div style={{
          fontSize: 24, fontWeight: 800, marginTop: 4,
          color: netto < 0 ? AMBER : GREEN,
        }}>
          {netto < 0 ? "−" : "+"} € {Math.abs(netto)}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          Solo grazie a conta ciclica continua · accuracy {mag.accuracy || "98.2"}%
        </div>
      </div>

      {/* Causali */}
      <div style={sezStyle}>
        <SezTit>Causali fiscali</SezTit>

        <CausaleRow lbl="Mancanze (CR-MAN)" val={`€${mancanze}`} bg="#FCE3E3" color={RED} />
        <CausaleRow lbl="Cali tecnici (CR-CAL)" val={`€${cali}`} bg="#FBF0DC" color="#8B6926" />
        <CausaleRow lbl="Eccedenze (CR-ECC)" val={`+€${eccedenze}`} bg="#D5EBE0" color={GREEN} />
      </div>

      {/* Info conservazione */}
      <div style={{
        padding: "9px 11px", borderRadius: 9, fontSize: 11, marginBottom: 9,
        display: "flex", alignItems: "center", gap: 9,
        background: "#E3EDF9", color: "#2D5A8C", borderLeft: `3px solid #2D5A8C`,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Conservazione 10 anni</div>
          <div style={{ fontSize: 9.5, marginTop: 2, opacity: 0.9 }}>
            PDF firmato · DPR 600/73 art. 14
          </div>
        </div>
        <button style={{
          padding: "6px 11px", background: "#2D5A8C", color: "#fff",
          fontSize: 9.5, fontWeight: 800, borderRadius: 6,
          letterSpacing: 0.3, textTransform: "uppercase", border: "none", cursor: "pointer",
        }}>FIRMA</button>
      </div>

      {/* Export */}
      <div style={sezStyle}>
        <SezTit>Export commercialista</SezTit>
        <div style={{ display: "grid", gap: 5 }}>
          <ExportBtn lbl="CSV completo articoli + giacenze" />
          <ExportBtn lbl="PDF firmato (libro inventari)" highlight />
          <ExportBtn lbl="XML SDI (eventuali corrispettivi)" />
          <ExportBtn lbl="Excel pivot per analisi" />
        </div>
      </div>

      {/* Stato sistema cycle counting */}
      <div style={sezStyle}>
        <SezTit>Cycle counting sostituisce 31/12</SezTit>
        <div style={{ fontSize: 11, color: NAVY, fontWeight: 700, marginBottom: 7 }}>
          Conta continua tutto l'anno:
        </div>
        <div style={{ display: "grid", gap: 5 }}>
          <Stat lbl="Articoli classe A" val="3 art. · settimanale (52/anno)" />
          <Stat lbl="Articoli classe B" val="5 art. · bisettimanale (26/anno)" />
          <Stat lbl="Articoli classe C" val="9 art. · mensile (12/anno)" />
          <Stat lbl="Accuracy media" val={`${mag.accuracy || "98.2"}% · differenze auto-rilevate`} />
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
          Netto <b style={{ fontSize: 13, color: netto < 0 ? AMBER : GREEN }}>
            {netto < 0 ? "−" : "+"} €{Math.abs(netto)}
          </b>
        </div>
        <button onClick={async () => {
          const { data } = await supabase.from("v_magazzino_articoli_full").select("codice,nome,unita_misura,scorta_attuale,prezzo_acquisto,scaffale_codice,fornitore_nome,abc_class");
          if (!data) return;
          const csv = ["codice;nome;um;scorta;prezzo;valore;scaffale;fornitore;classe_abc"];
          let totV = 0;
          data.forEach((r) => {
            const v = (r.scorta_attuale || 0) * (r.prezzo_acquisto || 0);
            totV += v;
            csv.push(r.codice + ";" + r.nome + ";" + (r.unita_misura || "") + ";" + r.scorta_attuale + ";" + (r.prezzo_acquisto || 0) + ";" + v.toFixed(2) + ";" + (r.scaffale_codice || "") + ";" + (r.fornitore_nome || "") + ";" + (r.abc_class || ""));
          });
          csv.push(";;;;;" + totV.toFixed(2) + ";;;TOTALE");
          const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "inventario-" + new Date().toISOString().split("T")[0] + ".csv";
          a.click();
          URL.revokeObjectURL(url);
        }} style={{
          padding: "11px 14px", background: NAVY, color: "#fff",
          borderRadius: 9, fontSize: 11, fontWeight: 800,
          letterSpacing: 0.3, textTransform: "uppercase", border: "none", cursor: "pointer",
        }}>EXPORT</button>
        <button style={{
          padding: "11px 14px", background: TEAL, color: "#fff",
          borderRadius: 9, fontSize: 11, fontWeight: 800,
          letterSpacing: 0.3, textTransform: "uppercase", border: "none", cursor: "pointer",
        }}>CHIUDI</button>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function CausaleRow({ lbl, val, bg, color }: { lbl: string; val: string; bg: string; color: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "7px 9px", background: bg, borderRadius: 7,
      fontSize: 11, color, fontWeight: 700, marginBottom: 5,
    }}>
      <span>{lbl}</span>
      <span>{val}</span>
    </div>
  );
}

function ExportBtn({ lbl, highlight }: { lbl: string; highlight?: boolean }) {
  return (
    <button style={{
      padding: "9px 11px",
      background: highlight ? TEAL : "#F7F9FB",
      color: highlight ? "#fff" : NAVY,
      borderRadius: 7, fontSize: 11, fontWeight: 700,
      border: `1px solid ${highlight ? "#1a6b6b" : "#D8DEE5"}`,
      cursor: "pointer", textAlign: "left",
    }}>{lbl}</button>
  );
}

function Stat({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "6px 0", borderBottom: "1px solid #E5EAF0",
      fontSize: 11,
    }}>
      <span style={{ color: NAVY, fontWeight: 600 }}>{lbl}</span>
      <span style={{ color: MUTED, fontWeight: 700 }}>{val}</span>
    </div>
  );
}

function SezTit({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9.5, fontWeight: 800, color: NAVY,
      letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
    }}>{children}</div>
  );
}

const sezStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 13, padding: "11px 12px",
  marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};
