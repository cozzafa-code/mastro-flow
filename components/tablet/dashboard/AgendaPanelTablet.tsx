"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";

interface EventoAgenda {
  id: string;
  ora: string;
  titolo: string;
  sottotitolo: string;
  tint: "violet" | "amber" | "green" | "blue" | "red" | "teal";
}

const DATA: EventoAgenda[] = [
  { id: "1", ora: "09:00", titolo: "Sopralluogo Bianchi",   sottotitolo: "Via Roma 12, Cosenza",     tint: "violet" },
  { id: "2", ora: "11:30", titolo: "Riunione produzione",   sottotitolo: "Sala riunioni",            tint: "amber"  },
  { id: "3", ora: "14:30", titolo: "Montaggio Verdi",       sottotitolo: "Via Garibaldi 45",         tint: "green"  },
  { id: "4", ora: "16:00", titolo: "Consegna fornitore",    sottotitolo: "Schuco - magazzino",       tint: "blue"   },
];

export default function AgendaPanelTablet() {
  return (
    <div style={cardStyle({ padding: "16px 18px", display: "flex", flexDirection: "column" })}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: TT.violet[400], display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="calendario" size={14} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
            Agenda di oggi
          </div>
        </div>
        <div style={{ fontSize: 11, color: TT.violet[500], fontWeight: 600, cursor: "pointer" }}>
          Tutti &rsaquo;
        </div>
      </div>

      {/* Lista eventi */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DATA.map((e) => {
          const ramp = TT[e.tint];
          return (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: ramp[50],
                border: `1px solid ${ramp[100]}`,
                borderLeft: `3px solid ${ramp[400]}`,
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: ramp[500], minWidth: 38, fontVariantNumeric: "tabular-nums" }}>
                {e.ora}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TT.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.titolo}
                </div>
                <div style={{ fontSize: 10, color: TT.text3, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.sottotitolo}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
