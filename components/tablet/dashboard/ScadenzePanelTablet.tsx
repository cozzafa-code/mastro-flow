"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";

interface Scadenza {
  id: string;
  titolo: string;
  data: string;
  tint: "red" | "amber" | "blue";
  importo?: string;
}

const DATA: Scadenza[] = [
  { id: "1", titolo: "F24 Aprile",            data: "Scaduta da 2gg", tint: "red",   importo: "€ 1.240" },
  { id: "2", titolo: "Fatt. 2026/047 Bianchi",data: "Scade oggi",     tint: "amber", importo: "€ 3.450" },
  { id: "3", titolo: "INPS contributi",       data: "Tra 3 giorni",   tint: "amber", importo: "€ 980"   },
  { id: "4", titolo: "Fatt. 2026/051 Verdi",  data: "Tra 7 giorni",   tint: "blue",  importo: "€ 2.180" },
];

export default function ScadenzePanelTablet() {
  return (
    <div style={cardStyle({ padding: "16px 18px", display: "flex", flexDirection: "column" })}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: TT.red[400], display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bell" size={14} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
            Scadenze prossime
          </div>
        </div>
        <div style={{ fontSize: 11, color: TT.red[500], fontWeight: 600, cursor: "pointer" }}>
          Tutte &rsaquo;
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DATA.map((s) => {
          const ramp = TT[s.tint];
          return (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: ramp[50],
                border: `1px solid ${ramp[100]}`,
                borderRadius: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TT.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.titolo}
                </div>
                <div style={{ fontSize: 10, color: ramp[500], marginTop: 1, fontWeight: 600 }}>
                  {s.data}
                </div>
              </div>
              {s.importo && (
                <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {s.importo}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
