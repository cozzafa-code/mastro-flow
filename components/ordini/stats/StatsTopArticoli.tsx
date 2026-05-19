"use client";

interface ArticoloStat {
  codice_articolo: string;
  descrizione: string;
  fornitore_nome: string;
  qta_totale: number;
  prezzo_medio_corrente: number;
  prezzo_medio_confronto: number | null;
}

interface Props { articoli: ArticoloStat[]; }

export default function StatsTopArticoli({ articoli }: Props) {
  const top = articoli.slice(0, 8);
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
          Articoli top - prezzi anno vs anno
        </div>
        <div style={{ fontSize: 10, color: "#8893A8" }}>Δ prezzo unit.</div>
      </div>

      {top.map((a, i) => {
        const hasConfronto = a.prezzo_medio_confronto !== null && a.prezzo_medio_confronto > 0;
        const delta = hasConfronto
          ? ((a.prezzo_medio_corrente - a.prezzo_medio_confronto!) / a.prezzo_medio_confronto!) * 100
          : null;
        const ico = (a.descrizione || "?").charAt(0).toUpperCase();
        return (
          <div key={a.codice_articolo + i} style={{
            padding: "8px 0", borderBottom: i < top.length - 1 ? "1px solid #F0F2F6" : "none",
            display: "flex", alignItems: "center", gap: 9
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "#FBF0DC", color: "#8B6926",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 11, flexShrink: 0
            }}>{ico}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 800, color: "#1A2A47", lineHeight: 1.15,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>{a.descrizione || a.codice_articolo}</div>
              <div style={{
                fontSize: 9.5, color: "#8893A8", fontWeight: 600, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>{a.fornitore_nome} - {Math.round(a.qta_totale)} pz</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, fontSize: 10, lineHeight: 1.3 }}>
              <div style={{ color: "#1A2A47", fontWeight: 800 }}>
                EUR {formatNum(a.prezzo_medio_corrente)}
              </div>
              {hasConfronto && (
                <div style={{ color: "#8B6926", fontWeight: 800, textDecoration: "line-through", opacity: 0.6 }}>
                  EUR {formatNum(a.prezzo_medio_confronto!)}
                </div>
              )}
              {delta !== null && Math.abs(delta) > 0.5 && (
                <div style={{
                  display: "inline-block", padding: "2px 6px", borderRadius: 5,
                  fontSize: 9.5, fontWeight: 800, marginTop: 3,
                  background: delta > 0 ? "#F5DADA" : "#D8EBDF",
                  color: delta > 0 ? "#A33333" : "#1F5A3F"
                }}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}%</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
