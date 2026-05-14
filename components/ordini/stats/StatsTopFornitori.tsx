"use client";

interface FornitoreStat {
  fornitore_id: string;
  fornitore_nome: string;
  n_ordini: number;
  spesa_totale: number;
  delta_pct: number | null;
}

interface Props {
  annoCorrente: number;
  fornitori: FornitoreStat[];
}

export default function StatsTopFornitori({ annoCorrente, fornitori }: Props) {
  const top = fornitori.slice(0, 5);
  if (top.length === 0) return null;

  return (
    <div style={{
      margin: "12px 14px 0", background: "#fff", borderRadius: 13,
      padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.7px", color: "#1A2A47", textTransform: "uppercase" }}>
          Top fornitori spesa
        </div>
        <div style={{ fontSize: 10, color: "#8893A8" }}>{annoCorrente}</div>
      </div>

      {top.map((f, i) => {
        const isMedal = i < 3;
        return (
          <div key={f.fornitore_id} style={{
            padding: "9px 0", borderBottom: i < top.length - 1 ? "1px solid #F0F2F6" : "none",
            display: "flex", alignItems: "center", gap: 10
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: isMedal ? "#FBF0DC" : "#F4F6FA",
              color: isMedal ? "#8B6926" : "#5A6478",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, flexShrink: 0
            }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 800, color: "#1A2A47", lineHeight: 1.15,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>{f.fornitore_nome}</div>
              <div style={{ fontSize: 9.5, color: "#8893A8", fontWeight: 600, marginTop: 2 }}>
                {f.n_ordini} ordini
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1A2A47", lineHeight: 1 }}>
                EUR {formatNum(f.spesa_totale)}
              </div>
              {f.delta_pct !== null && Math.abs(f.delta_pct) > 0.1 && (
                <div style={{
                  fontSize: 10, fontWeight: 800, marginTop: 3,
                  color: f.delta_pct > 0 ? "#A33333" : "#1F5A3F",
                  display: "inline-flex", alignItems: "center", gap: 2
                }}>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    {f.delta_pct > 0 ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                  </svg>
                  {f.delta_pct > 0 ? "+" : ""}{f.delta_pct.toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
