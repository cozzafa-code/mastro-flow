"use client";
import React from "react";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";
const BORDER = "#E5EAF0";

// Sub-components helpers

export function Sez({ tit, right, children }: { tit: string; right?: any; children: any }) {
  return (
    <div style={{ background: "#fff", borderRadius: 13, padding: "11px 12px", marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{tit}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ fontSize: 9.5, color: MUTED, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{
        width: "100%", padding: "9px 10px", border: `1px solid ${BORDER}`, borderRadius: 7,
        fontSize: 12, color: NAVY, background: "#fff", fontFamily: "inherit",
      }} />
    </div>
  );
}

export function Row2({ children }: { children: any }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 9 }}>{children}</div>;
}

export function Check({ label, value, onChange }: any) {
  return (
    <div onClick={() => onChange(!value)} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
      fontSize: 11.5, color: NAVY, cursor: "pointer", fontWeight: 600,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 5,
        border: `1.5px solid ${value ? TEAL_DARK : "#D8DEE5"}`,
        background: value ? TEAL : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        color: "#fff",
      }}>
        {value && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
      </div>
      {label}
    </div>
  );
}

export function Tag({ pct }: { pct: number }) {
  const bg = pct === 22 ? TEAL : pct === 10 ? AMBER : pct === 4 ? GREEN : MUTED;
  return (
    <span style={{
      display: "inline-block", background: bg, color: "#fff",
      padding: "1px 6px", borderRadius: 99, fontSize: 9, fontWeight: 800, marginRight: 5,
    }}>{pct}%</span>
  );
}

export function RiepRow({ lbl, val, big }: { lbl: any; val: string; big?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      fontSize: big ? 13.5 : 10.5,
      color: big ? NAVY : MUTED,
      marginBottom: big ? 0 : 3,
      fontWeight: big ? 800 : 600,
      paddingTop: big ? 6 : 0,
      borderTop: big ? `1.5px solid #D8DEE5` : "none",
      marginTop: big ? 4 : 0,
    }}>
      <span>{lbl}</span>
      <span style={{ fontWeight: 700, color: NAVY }}>{val}</span>
    </div>
  );
}

export function vtBtn(act: boolean): React.CSSProperties {
  return {
    padding: "5px 10px", fontSize: 9.5, fontWeight: 800,
    color: act ? "#fff" : MUTED, background: act ? NAVY : "transparent",
    borderRadius: 5, cursor: "pointer", letterSpacing: 0.3, border: "none",
    fontFamily: "inherit",
  };
}
