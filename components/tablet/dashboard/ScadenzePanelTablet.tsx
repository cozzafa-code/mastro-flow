"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { useDashboard } from "../dashboard-context";
import CardHeader from "../CardHeader";

interface Scadenza {
  id: string;
  titolo: string;
  stato: string;
  importo: string;
  tint: keyof typeof TINTS;
}

const TINTS = {
  red: TT.red, amber: TT.amber, blue: TT.blue,
} as const;

const SCADENZE: Scadenza[] = [
  { id: "1", titolo: "F24 Aprile",             stato: "Scaduta da 2gg",   importo: "1.240", tint: "red"   },
  { id: "2", titolo: "Fatt. 2026/047 Bianchi",  stato: "Scade oggi",       importo: "3.450", tint: "red"   },
  { id: "3", titolo: "INPS contributi",          stato: "Tra 3 giorni",     importo: "980",   tint: "amber" },
  { id: "4", titolo: "Fatt. 2026/051 Verdi",    stato: "Tra 7 giorni",     importo: "2.180", tint: "amber" },
];

export default function ScadenzePanelTablet() {
  const { navigate, expand } = useDashboard();

  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="bell"
        title="Scadenze prossime"
        tint="amber"
        seeAllLabel="Tutte"
        onSeeAll={() => navigate("contabilita")}
        onExpand={() => expand("scadenze")}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {SCADENZE.map((s) => {
          const ramp = TINTS[s.tint];
          return (
            <div
              key={s.id}
              onClick={() => navigate("contabilita")}
              style={{
                display: "flex", alignItems: "center",
                padding: "8px 10px",
                background: ramp[50],
                border: `1px solid ${ramp[100]}`,
                borderRadius: 7,
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: TT.text1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  letterSpacing: "-0.1px",
                }}>
                  {s.titolo}
                </div>
                <div style={{ fontSize: 10, color: ramp[600], fontWeight: 600, marginTop: 1 }}>
                  {s.stato}
                </div>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 800, color: ramp[600],
                fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px",
                whiteSpace: "nowrap",
              }}>
                € {s.importo}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
