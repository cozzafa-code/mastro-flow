"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { useDashboard } from "../dashboard-context";
import CardHeader from "../CardHeader";

interface CommessaRow {
  id: string;
  cliente: string;
  rif: string;
  vani: number;
  stato: string;
  statoTint: keyof typeof TINTS;
  valore: string;
}

const TINTS = {
  blue: TT.blue, amber: TT.amber, green: TT.green,
  violet: TT.violet, orange: TT.orange,
} as const;

const RIGHE: CommessaRow[] = [
  { id: "C-2026-051", cliente: "Verdi G.",   rif: "C-2026-051", vani: 8,  stato: "Produzione", statoTint: "blue",   valore: "12.450" },
  { id: "C-2026-050", cliente: "Bianchi M.", rif: "C-2026-050", vani: 4,  stato: "Confermata", statoTint: "amber",  valore: "6.820"  },
  { id: "C-2026-049", cliente: "Rossi & Co.",rif: "C-2026-049", vani: 12, stato: "Montaggio",  statoTint: "green",  valore: "18.900" },
  { id: "C-2026-048", cliente: "Esposito F.",rif: "C-2026-048", vani: 3,  stato: "Preventivo", statoTint: "violet", valore: "4.350"  },
  { id: "C-2026-047", cliente: "De Luca P.", rif: "C-2026-047", vani: 6,  stato: "Rilievo",    statoTint: "orange", valore: "9.200"  },
];

export default function CommesseRecentiPanelTablet() {
  const { navigate, expand } = useDashboard();

  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="commesse"
        title="Commesse recenti"
        tint="orange"
        seeAllLabel="Tutte"
        onSeeAll={() => navigate("commesse")}
        onExpand={() => expand("commesse")}
      />
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={th}>Cliente</th>
            <th style={th}>Riferimento</th>
            <th style={{ ...th, textAlign: "center" }}>Vani</th>
            <th style={th}>Stato</th>
            <th style={{ ...th, textAlign: "right" }}>Valore</th>
          </tr>
        </thead>
        <tbody>
          {RIGHE.map((r) => {
            const ramp = TINTS[r.statoTint];
            return (
              <tr
                key={r.id}
                onClick={() => navigate("commesse", { commessaId: r.id })}
                style={{ cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = TT.bgSoft)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
              >
                <td style={td}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
                    {r.cliente}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: TT.text3, fontWeight: 600 }}>
                    {r.rif}
                  </span>
                </td>
                <td style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums", color: TT.text2, fontWeight: 600 }}>
                  {r.vani}
                </td>
                <td style={td}>
                  <span style={{
                    padding: "1px 7px",
                    background: ramp[100], color: ramp[600],
                    borderRadius: 999,
                    fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.3px", textTransform: "uppercase",
                  }}>
                    {r.stato}
                  </span>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <span style={{
                    fontSize: 12, fontWeight: 800, color: TT.text1,
                    fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px",
                    whiteSpace: "nowrap",
                  }}>
                    € {r.valore}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "6px 8px",
  fontSize: 9,
  fontWeight: 700,
  color: TT.text3,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  textAlign: "left",
  borderBottom: `1px solid ${TT.border}`,
};

const td: React.CSSProperties = {
  padding: "8px 8px",
  borderBottom: `1px solid ${TT.border}`,
};
