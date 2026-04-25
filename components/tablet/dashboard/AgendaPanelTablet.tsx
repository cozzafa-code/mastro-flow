"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { useDashboard } from "../dashboard-context";
import CardHeader from "../CardHeader";

interface Evento {
  id: string;
  ora: string;
  titolo: string;
  indirizzo: string;
  tint: keyof typeof TINTS;
}

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
} as const;

const EVENTI: Evento[] = [
  { id: "1", ora: "09:00", titolo: "Sopralluogo Bianchi", indirizzo: "Via Roma 12, Cosenza", tint: "red"    },
  { id: "2", ora: "11:30", titolo: "Riunione produzione",  indirizzo: "Sala riunioni",        tint: "violet" },
  { id: "3", ora: "14:30", titolo: "Montaggio Verdi",      indirizzo: "Via Garibaldi 45",     tint: "green"  },
  { id: "4", ora: "16:00", titolo: "Consegna fornitore",   indirizzo: "Schuco - magazzino",  tint: "blue"   },
];

export default function AgendaPanelTablet() {
  const { navigate, expand } = useDashboard();

  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="calendario"
        title="Agenda di oggi"
        tint="violet"
        seeAllLabel="Tutti"
        onSeeAll={() => navigate("calendario")}
        onExpand={() => expand("agenda")}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {EVENTI.map((e) => {
          const ramp = TINTS[e.tint];
          return (
            <div
              key={e.id}
              onClick={() => navigate("calendario", { eventoId: e.id })}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px",
                background: ramp[50],
                borderLeft: `3px solid ${ramp[400]}`,
                borderRadius: 7,
                cursor: "pointer",
                transition: "transform 0.12s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateX(2px)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateX(0)")}
            >
              <div style={{
                fontSize: 11, fontWeight: 800, color: ramp[600],
                fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px",
                minWidth: 38,
              }}>
                {e.ora}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: TT.text1,
                  letterSpacing: "-0.1px",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {e.titolo}
                </div>
                <div style={{
                  fontSize: 10, color: TT.text3,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {e.indirizzo}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
