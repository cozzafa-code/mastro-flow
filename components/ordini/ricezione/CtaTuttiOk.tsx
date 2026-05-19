"use client";

interface Props {
  totRighe: number;
  onTuttiOk: () => void;
}

export default function CtaTuttiOk({ totRighe, onTuttiOk }: Props) {
  return (
    <div onClick={onTuttiOk} style={{
      margin: "12px 16px 0", padding: 16,
      background: "linear-gradient(180deg,#1A2A47 0%,#0f1d33 100%)",
      color: "#fff", borderRadius: 14,
      display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 4px 12px rgba(26,42,71,0.4)",
      cursor: "pointer", border: "2px solid #28A0A0"
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%", background: "#28A0A0",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.3px", lineHeight: 1.1 }}>
          TUTTI OK COME ORDINATO
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3, letterSpacing: "0.2px" }}>
          Conferma {totRighe} righe + DDT + scarico magazzino
        </div>
      </div>
    </div>
  );
}
