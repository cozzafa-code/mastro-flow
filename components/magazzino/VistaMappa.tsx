"use client";
import React, { useState } from "react";
import { SlottingSugg, ABC_COLOR } from "../../hooks/useMagazzinoTop";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

type MapView = "abc" | "calore" | "saturazione";

// Layout fisso magazzino tipico (24 celle)
const MAP_LAYOUT: Array<{ type: "dock" | "zone-a" | "zone-b" | "zone-c" | "empty" | "aisle"; code?: string; dot?: boolean }> = [
  { type: "dock" }, { type: "dock" }, { type: "zone-a", code: "A1", dot: true }, { type: "zone-a", code: "A2" }, { type: "zone-a", code: "A3" }, { type: "zone-a", code: "A4", dot: true },
  { type: "zone-b", code: "B1" }, { type: "zone-b", code: "B2" }, { type: "aisle" }, { type: "zone-b", code: "B3" }, { type: "zone-b", code: "B4" }, { type: "zone-b", code: "B5" },
  { type: "zone-c", code: "C1" }, { type: "empty" }, { type: "aisle" }, { type: "empty" }, { type: "zone-c", code: "C2" }, { type: "empty" },
  { type: "empty" }, { type: "empty" }, { type: "aisle" }, { type: "empty" }, { type: "empty" }, { type: "empty" },
];

export default function VistaMappa({ mag }: { mag: any }) {
  const [view, setView] = useState<MapView>("abc");
  const slotting: SlottingSugg[] = mag.slotting || [];

  return (
    <div style={{ paddingBottom: 70 }}>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
        <Pill active={view === "abc"} onClick={() => setView("abc")}>ABC zone</Pill>
        <Pill active={view === "calore"} onClick={() => setView("calore")}>Calore picking</Pill>
        <Pill active={view === "saturazione"} onClick={() => setView("saturazione")}>Saturazione</Pill>
      </div>

      {/* Mappa */}
      <div style={{
        background: NAVY_DEEP, padding: 14, borderRadius: 10,
        display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6,
        marginBottom: 9,
      }}>
        {MAP_LAYOUT.map((cell, i) => {
          let bg = "rgba(255,255,255,0.05)";
          let color = "rgba(255,255,255,0.3)";
          let content: React.ReactNode = "·";
          let span = 1;
          let border = "1px solid rgba(255,255,255,0.1)";

          if (cell.type === "dock") {
            if (i === 0) { bg = TEAL; color = "#fff"; content = <span style={{ display: "flex", alignItems: "center", gap: 3 }}><TruckIcon size={11} />DOCK</span>; span = 2; }
            else return null;
          } else if (cell.type === "zone-a") {
            bg = RED; color = "#fff"; content = cell.code || "";
          } else if (cell.type === "zone-b") {
            bg = AMBER; color = "#fff"; content = cell.code || "";
          } else if (cell.type === "zone-c") {
            bg = MUTED; color = "#fff"; content = cell.code || "";
          } else if (cell.type === "aisle") {
            content = "―"; border = "1px dashed rgba(255,255,255,0.1)";
          }

          return (
            <div key={i} style={{
              aspectRatio: span === 2 ? "2 / 1" : "1 / 1",
              gridColumn: span === 2 ? "span 2" : undefined,
              borderRadius: 5, background: bg, color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 800, cursor: "pointer",
              border, position: "relative",
            }}>
              {content}
              {cell.dot && (
                <div style={{
                  position: "absolute", top: 2, right: 2,
                  width: 6, height: 6, borderRadius: "50%", background: "#fff",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Slotting suggestions */}
      {slotting.length > 0 && (
        <div style={{
          background: "#E3EDF9", borderLeft: "3px solid #2D5A8C",
          padding: "9px 11px", borderRadius: 9, marginBottom: 9,
          display: "flex", alignItems: "center", gap: 9, fontSize: 11,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: "#2D5A8C" }}>
              {slotting.length} riposizionamenti suggeriti
            </div>
            <div style={{ fontSize: 9.5, color: "#2D5A8C", opacity: 0.9, marginTop: 2 }}>
              Risparmio stimato: <b>−{slotting.reduce((s, x) => s + (x.risparmio_min_sett || 0), 0)} min/sett</b>
            </div>
          </div>
        </div>
      )}

      {slotting.length > 0 && (
        <div style={sezStyle}>
          <div style={{
            fontSize: 9.5, fontWeight: 800, color: NAVY,
            letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
            display: "flex", justifyContent: "space-between",
          }}>
            <span>Slotting dinamico AI</span>
            <span style={{ background: TEAL, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 800 }}>
              {slotting.length}
            </span>
          </div>

          {slotting.map(s => (
            <SlotRow key={s.id} s={s} mag={mag} />
          ))}
        </div>
      )}

      {/* Saturazione zona A */}
      <div style={sezStyle}>
        <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>
          Saturazione zona A
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginBottom: 7 }}>
          Articoli classe A (20% / 80% valore)
        </div>
        <div style={{ background: "#F1F4F7", height: 12, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "74%", background: `linear-gradient(90deg, ${TEAL}, #1a6b6b)` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: MUTED, fontWeight: 700 }}>
          <span>74% pieno</span>
          <span><b style={{ color: NAVY }}>3 slot liberi</b></span>
        </div>
      </div>

      {/* Bottom bar */}
      {slotting.length > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff", padding: "10px 12px",
          display: "flex", gap: 8, alignItems: "center",
          borderTop: "1px solid #E5EAF0", boxShadow: "0 -4px 12px rgba(0,0,0,0.1)", zIndex: 40,
        }}>
          <div style={{ flex: 1, fontSize: 11, color: NAVY, fontWeight: 700 }}>
            Walk path <b>−{slotting.reduce((s, x) => s + (x.risparmio_min_sett || 0), 0)} min/sett</b>
          </div>
          <button onClick={async () => {
            for (const s of slotting) await mag.slottingApplica(s.id);
          }} style={{
            padding: "11px 14px", background: TEAL, color: "#fff",
            borderRadius: 9, fontSize: 11, fontWeight: 800,
            letterSpacing: 0.3, textTransform: "uppercase", border: "none", cursor: "pointer",
          }}>APPLICA TUTTO</button>
        </div>
      )}
    </div>
  );
}

function SlotRow({ s, mag }: { s: SlottingSugg; mag: any }) {
  const artNome = mag.articoli.find((a: any) => a.id === s.articolo_id)?.nome || "—";
  const abc = mag.articoli.find((a: any) => a.id === s.articolo_id)?.abc_class as "A" | "B" | "C" | null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: "1px solid #E5EAF0" }}>
      {abc && (
        <span style={{
          width: 16, height: 16, borderRadius: 4,
          background: ABC_COLOR[abc], color: "#fff",
          fontSize: 9, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{abc}</span>
      )}
      <span style={{ background: "#F1F4F7", color: MUTED, padding: "3px 7px", borderRadius: 5, fontFamily: "SF Mono, monospace", fontSize: 10, fontWeight: 700 }}>
        DA
      </span>
      <span style={{ color: TEAL, fontSize: 13, fontWeight: 800 }}>→</span>
      <span style={{ background: TEAL, color: "#fff", padding: "3px 7px", borderRadius: 5, fontFamily: "SF Mono, monospace", fontSize: 10, fontWeight: 800 }}>
        A
      </span>
      <div style={{ flex: 1, minWidth: 0, marginLeft: 3 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {artNome}
        </div>
        {s.risparmio_picks_sett && (
          <div style={{ fontSize: 9, color: GREEN, fontWeight: 800, marginTop: 1 }}>
            +{s.risparmio_picks_sett} picking/sett
          </div>
        )}
      </div>
      <button onClick={() => mag.slottingApplica(s.id)} style={{
        padding: "5px 9px", fontSize: 9, fontWeight: 800,
        background: TEAL, color: "#fff", borderRadius: 5,
        letterSpacing: 0.3, textTransform: "uppercase", border: "none", cursor: "pointer",
      }}>OK</button>
    </div>
  );
}

function Pill({ children, active, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 10px",
      background: active ? TEAL : "#fff",
      borderRadius: 99, fontSize: 10, fontWeight: 800,
      color: active ? "#fff" : MUTED,
      border: `1px solid ${active ? "#1a6b6b" : "#D8DEE5"}`,
      letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer",
    }}>{children}</button>
  );
}

const sezStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 13, padding: "11px 12px",
  marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

const TruckIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
