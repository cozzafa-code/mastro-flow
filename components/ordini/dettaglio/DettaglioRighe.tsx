"use client";

import { RigaOrdine } from "../ordini-types";

interface Props { righe: RigaOrdine[]; }

const CATEGORIA_COLOR: Record<string, { bg: string; fg: string; ico: string }> = {
  vetri: { bg: "#E3EDF9", fg: "#2D5A8C", ico: "V" },
  profili: { bg: "#FBF0DC", fg: "#8B6926", ico: "P" },
  ferramenta: { bg: "#F5DADA", fg: "#A33333", ico: "F" },
  guarnizioni: { bg: "#EEF2F7", fg: "#5A6478", ico: "G" },
  minuteria: { bg: "#D8EBDF", fg: "#1F5A3F", ico: "M" },
  tapparelle: { bg: "#F4E4D0", fg: "#8B5A26", ico: "T" },
  altro: { bg: "#EEF2F7", fg: "#5A6478", ico: "•" },
};

export default function DettaglioRighe({ righe }: Props) {
  if (!righe || righe.length === 0) {
    return (
      <div style={{
        margin: "12px 14px", padding: 24, background: "rgba(255,255,255,0.5)",
        borderRadius: 12, textAlign: "center", color: "#5A6478", fontSize: 12
      }}>
        Nessuna riga in questo ordine
      </div>
    );
  }

  const totale = righe.reduce((s, r) => s + (r.totale_riga || (r.qta_ordinata || 0) * (r.costo_unitario || 0)), 0);

  return (
    <div style={{ margin: "12px 12px 0" }}>
      <div style={{
        padding: "8px 12px", display: "flex", alignItems: "center",
        justifyContent: "space-between", fontSize: 11, fontWeight: 800,
        letterSpacing: "0.6px", color: "#1A2A47", textTransform: "uppercase"
      }}>
        <span>Righe ordine ({righe.length})</span>
        <span style={{ color: "#5A6478", fontSize: 11, textTransform: "none" }}>
          Totale EUR {formatNum(totale)}
        </span>
      </div>

      {righe.map((r, i) => {
        const cat = (r.categoria || "altro").toLowerCase();
        const col = CATEGORIA_COLOR[cat] || CATEGORIA_COLOR.altro;
        return (
          <div key={r.id || i} style={{
            background: "#fff", borderRadius: 11, marginTop: 8,
            padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 10,
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)"
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: col.bg, color: col.fg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, flexShrink: 0
            }}>{col.ico}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 800, color: "#1A2A47",
                lineHeight: 1.2, letterSpacing: "0.1px"
              }}>{r.descrizione || "—"}</div>
              {r.codice_articolo && (
                <div style={{
                  fontSize: 9.5, color: "#8893A8", marginTop: 2,
                  fontFamily: "SF Mono, Menlo, monospace", letterSpacing: "0.3px"
                }}>{r.codice_articolo}</div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1A2A47", lineHeight: 1 }}>
                {r.qta_ordinata || 0}<span style={{ fontSize: 10, color: "#8893A8", fontWeight: 600, marginLeft: 2 }}>
                  {r.unita_misura || "pz"}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: "#5A6478", marginTop: 3 }}>
                EUR {formatNum(r.costo_unitario || 0)}
              </div>
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
