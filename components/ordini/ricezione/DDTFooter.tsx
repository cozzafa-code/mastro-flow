"use client";

import { useState } from "react";

interface Props {
  onConferma: (ddt: { numero: string; data: string; note?: string }) => void;
}

export default function DDTFooter({ onConferma }: Props) {
  const [numero, setNumero] = useState("");
  const [data, setData] = useState(new Date().toISOString().substring(0, 10));
  const canSubmit = numero.trim().length > 0 && data.length > 0;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#fff", borderTop: "1px solid #E0E5EE",
      padding: "14px 16px 100px",
      boxShadow: "0 -8px 24px rgba(0,0,0,0.12)", zIndex: 50
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <Field label="DDT n°" req>
          <input value={numero} onChange={(e) => setNumero(e.target.value)}
            placeholder="es. 2245/2026" style={inputStyle} />
        </Field>
        <Field label="Data DDT" req>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)}
            style={inputStyle} />
        </Field>
      </div>
      <div onClick={() => { if (canSubmit) onConferma({ numero, data }); }}
        style={{
          width: "100%", padding: 14,
          background: canSubmit ? "linear-gradient(180deg,#28A0A0 0%,#1a6b6b 100%)" : "#C8D1E0",
          color: "#fff", border: "none", borderRadius: 12,
          fontSize: 14, fontWeight: 800, letterSpacing: "0.7px",
          textTransform: "uppercase",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: canSubmit ? "0 4px 12px rgba(40,160,160,0.35)" : "none",
          cursor: canSubmit ? "pointer" : "not-allowed"
        }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Conferma ricezione + Carico
      </div>
    </div>
  );
}

function Field({ label, req, children }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: "0.7px",
        color: "#5A6478", textTransform: "uppercase", marginBottom: 4
      }}>
        {label} {req && <span style={{ color: "#C44545" }}>*</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: any = {
  padding: "9px 10px", background: "#F4F6FA",
  border: "1.5px solid #E0E5EE", borderRadius: 8,
  fontSize: 13, fontWeight: 600, color: "#1A2A47",
  fontFamily: "inherit", width: "100%"
};
