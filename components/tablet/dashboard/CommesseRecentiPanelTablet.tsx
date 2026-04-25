"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";

interface Commessa {
  id: string;
  cliente: string;
  riferimento: string;
  vani: number;
  stato: "rilievo" | "preventivo" | "confermata" | "produzione" | "montaggio";
  valore: string;
}

const STATI: Record<Commessa["stato"], { label: string; tint: keyof typeof TINTS }> = {
  rilievo:    { label: "Rilievo",    tint: "amber"  },
  preventivo: { label: "Preventivo", tint: "blue"   },
  confermata: { label: "Confermata", tint: "violet" },
  produzione: { label: "Produzione", tint: "teal"   },
  montaggio:  { label: "Montaggio",  tint: "green"  },
};

const TINTS = {
  amber: TT.amber, blue: TT.blue, violet: TT.violet, teal: TT.teal, green: TT.green,
} as const;

const DATA: Commessa[] = [
  { id: "C-2026-051", cliente: "Verdi G.",    riferimento: "C-2026-051", vani: 8,  stato: "produzione", valore: "€ 12.450" },
  { id: "C-2026-050", cliente: "Bianchi M.",  riferimento: "C-2026-050", vani: 4,  stato: "confermata", valore: "€ 6.820"  },
  { id: "C-2026-049", cliente: "Rossi & Co.", riferimento: "C-2026-049", vani: 12, stato: "montaggio",  valore: "€ 18.900" },
  { id: "C-2026-048", cliente: "Esposito F.", riferimento: "C-2026-048", vani: 3,  stato: "preventivo", valore: "€ 4.350"  },
  { id: "C-2026-047", cliente: "De Luca P.",  riferimento: "C-2026-047", vani: 6,  stato: "rilievo",    valore: "€ 9.200"  },
];

export default function CommesseRecentiPanelTablet() {
  return (
    <div style={cardStyle({ padding: "16px 18px", display: "flex", flexDirection: "column" })}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: TT.orange[400], display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="commesse" size={14} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
            Commesse recenti
          </div>
        </div>
        <div style={{ fontSize: 11, color: TT.orange[500], fontWeight: 600, cursor: "pointer" }}>
          Tutte &rsaquo;
        </div>
      </div>

      {/* Tabella */}
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
        <thead>
          <tr>
            <Th>Cliente</Th>
            <Th>Riferimento</Th>
            <Th align="center">Vani</Th>
            <Th>Stato</Th>
            <Th align="right">Valore</Th>
          </tr>
        </thead>
        <tbody>
          {DATA.map((c, i) => {
            const s = STATI[c.stato];
            const ramp = TINTS[s.tint];
            return (
              <tr key={c.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${TT.border}` }}>
                <Td>
                  <div style={{ fontWeight: 600, color: TT.text1 }}>{c.cliente}</div>
                </Td>
                <Td>
                  <div style={{ color: TT.text3, fontFamily: "monospace", fontSize: 11 }}>{c.riferimento}</div>
                </Td>
                <Td align="center">
                  <div style={{ color: TT.text2, fontWeight: 500 }}>{c.vani}</div>
                </Td>
                <Td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "2px 8px",
                      background: ramp[100],
                      color: ramp[500],
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.2px",
                      textTransform: "uppercase",
                    }}
                  >
                    {s.label}
                  </span>
                </Td>
                <Td align="right">
                  <div style={{ fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {c.valore}
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---- Helpers tabella ----

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <th
      style={{
        padding: "8px 8px",
        textAlign: align || "left",
        fontSize: 10,
        fontWeight: 600,
        color: TT.text3,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        borderBottom: `1px solid ${TT.border}`,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <td style={{ padding: "10px 8px", textAlign: align || "left", verticalAlign: "middle" }}>
      {children}
    </td>
  );
}
