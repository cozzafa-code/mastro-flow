"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { useDashboard } from "../dashboard-context";
import { useMastroData } from "../store";
import { FaseCommessa } from "../store";
import CardHeader from "../CardHeader";

const FASE_LABEL: Record<FaseCommessa, { label: string; tint: keyof typeof TINTS }> = {
  rilievo:            { label: "Rilievo",     tint: "orange" },
  rilievo_confermato: { label: "Rilievo OK",  tint: "orange" },
  preventivo:         { label: "Preventivo",  tint: "violet" },
  conferma_ordine:    { label: "Conferma",    tint: "amber"  },
  ordine_confermato:  { label: "Ordine",      tint: "amber"  },
  produzione:         { label: "Produzione",  tint: "blue"   },
  montaggio:          { label: "Montaggio",   tint: "green"  },
  fattura:            { label: "Fattura",     tint: "pink"   },
  pagata:             { label: "Pagata",      tint: "green"  },
};

const TINTS = {
  blue: TT.blue, amber: TT.amber, green: TT.green,
  violet: TT.violet, orange: TT.orange, pink: TT.pink,
} as const;

export default function CommesseRecentiPanelTablet() {
  const { navigate } = useDashboard();
  const data = useMastroData();
  const commesse = data.getCommesse().slice(0, 5);

  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="commesse"
        title="Commesse recenti"
        tint="orange"
        seeAllLabel="Tutte"
        onSeeAll={() => navigate("commesse")}
      />
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={th}>Cliente</th>
            <th style={th}>Riferimento</th>
            <th style={{ ...th, textAlign: "center" }}>Vani</th>
            <th style={th}>Fase</th>
            <th style={{ ...th, textAlign: "right" }}>Valore</th>
          </tr>
        </thead>
        <tbody>
          {commesse.map((c) => {
            const cli = data.getCliente(c.clienteId);
            const fase = FASE_LABEL[c.fase];
            const ramp = TINTS[fase.tint];
            return (
              <tr key={c.id}
                onClick={() => navigate("commesse", { commessaId: c.id })}
                style={{ cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = TT.bgSoft)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
              >
                <td style={td}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
                    {cli?.nome.split(" ").slice(0, 2).join(" ") || "?"}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: TT.text3, fontWeight: 600 }}>
                    {c.numero}
                  </span>
                </td>
                <td style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums", color: TT.text2, fontWeight: 600 }}>
                  {c.vani.length}
                </td>
                <td style={td}>
                  <span style={{
                    padding: "1px 7px",
                    background: ramp[100], color: ramp[600],
                    borderRadius: 999,
                    fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.3px", textTransform: "uppercase",
                  }}>
                    {fase.label}
                  </span>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <span style={{
                    fontSize: 12, fontWeight: 800, color: TT.text1,
                    fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px",
                    whiteSpace: "nowrap",
                  }}>
                    € {c.valore.toLocaleString("it-IT")}
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
  padding: "6px 8px", fontSize: 9, fontWeight: 700, color: TT.text3,
  letterSpacing: "0.4px", textTransform: "uppercase", textAlign: "left",
  borderBottom: `1px solid ${TT.border}`,
};

const td: React.CSSProperties = {
  padding: "8px 8px", borderBottom: `1px solid ${TT.border}`,
};
