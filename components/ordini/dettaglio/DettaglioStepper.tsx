"use client";

const STEPS = [
  { key: "inviato", label: "Inviato" },
  { key: "confermato", label: "Confermato" },
  { key: "in_transito", label: "Transito" },
  { key: "arrivato", label: "Arrivato" },
  { key: "verificato", label: "Chiuso" },
];

interface Props { stato: string; }

export default function DettaglioStepper({ stato }: Props) {
  const idx = STEPS.findIndex((s) => s.key === stato);
  const progresso = idx >= 0 ? idx : 0;

  return (
    <div style={{
      margin: "12px 14px 0", background: "#fff",
      borderRadius: 12, padding: "14px 12px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      display: "flex", alignItems: "flex-start", position: "relative"
    }}>
      <div style={{
        position: "absolute", left: 30, right: 30, top: 21,
        height: 3, background: "#E8EAF0", borderRadius: 99
      }} />
      <div style={{
        position: "absolute", left: 30, top: 21, height: 3,
        background: "linear-gradient(90deg,#1F5A3F,#E8B05C)",
        borderRadius: 99,
        width: `${Math.max(0, (progresso / (STEPS.length - 1)) * 80)}%`
      }} />
      {STEPS.map((s, i) => {
        const done = i < progresso;
        const curr = i === progresso;
        return (
          <div key={s.key} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", position: "relative", zIndex: 1
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: done ? "#1F5A3F" : curr ? "#E8B05C" : "#E8EAF0",
              border: "3px solid #fff",
              boxShadow: curr ? "0 0 0 4px rgba(232,176,92,0.25)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {done && (
                <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={4}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div style={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: "0.4px",
              color: done ? "#1F5A3F" : curr ? "#8B6926" : "#8893A8",
              textTransform: "uppercase", marginTop: 6, textAlign: "center"
            }}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
