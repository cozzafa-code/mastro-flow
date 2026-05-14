"use client";

interface Props {
  fornitoreNome: string;
  articolo: string;
  pctAumento: number;
  onDettaglio?: () => void;
}

export default function StatsAlertInflazione({ fornitoreNome, articolo, pctAumento, onDettaglio }: Props) {
  return (
    <div style={{
      margin: "12px 14px 0",
      background: "linear-gradient(135deg,#F5DADA,#FBF0DC)",
      borderRadius: 13, padding: "12px 14px",
      display: "flex", gap: 10, alignItems: "flex-start",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      borderLeft: "4px solid #C44545"
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: "#C44545", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.5px", color: "#A33333", textTransform: "uppercase" }}>
          Aumento rilevato
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2A47", marginTop: 3, lineHeight: 1.3 }}>
          <strong>{fornitoreNome}</strong> ha aumentato i prezzi del <strong>+{pctAumento.toFixed(1)}%</strong> su {articolo}
        </div>
        {onDettaglio && (
          <div onClick={onDettaglio} style={{
            fontSize: 9.5, fontWeight: 800, color: "#A33333",
            textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 6,
            display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer"
          }}>
            Vedi dettaglio
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
