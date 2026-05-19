"use client";

interface Props {
  spesaTotale: number;
  nOrdini: number;
  nRighe: number;
  nFornitori: number;
  deltaPct: number | null;
}

export default function StatsKpiBig(p: Props) {
  const isUp = (p.deltaPct ?? 0) > 0;
  const hasDelta = p.deltaPct !== null && Math.abs(p.deltaPct) > 0.1;

  return (
    <div style={{
      margin: "12px 14px 0", background: "#fff", borderRadius: 13,
      padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.7px",
            color: "#5A6478", textTransform: "uppercase"
          }}>Spesa totale (a oggi)</div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: "#1A2A47",
            lineHeight: 1, letterSpacing: "-0.8px", marginTop: 4
          }}>EUR {formatNum(p.spesaTotale)}</div>
          <div style={{ fontSize: 10, color: "#8893A8", fontWeight: 600, marginTop: 3 }}>
            {p.nOrdini} ordini - {p.nRighe} righe - {p.nFornitori} fornitori
          </div>
        </div>
        {hasDelta && (
          <div style={{
            padding: "5px 9px", borderRadius: 7,
            background: isUp ? "#F5DADA" : "#D8EBDF",
            color: isUp ? "#A33333" : "#1F5A3F",
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 13, fontWeight: 800
          }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              {isUp ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
            </svg>
            {isUp ? "+" : ""}{p.deltaPct!.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
