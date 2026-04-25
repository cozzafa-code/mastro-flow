"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";

const TINTS = {
  red: TT.red, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet,
} as const;

type TipoEvento = "sopralluogo" | "montaggio" | "produzione" | "scadenza" | "admin";

interface EventoSide {
  id: string;
  data: string;        // "Oggi", "Domani", "27 apr"
  giorno: string;      // "Sab"
  ora: string;
  titolo: string;
  sottotitolo: string;
  tipo: TipoEvento;
}

const TIPO_TINT: Record<TipoEvento, keyof typeof TINTS> = {
  sopralluogo: "red", montaggio: "green", produzione: "blue", scadenza: "amber", admin: "violet",
};

const DATA: EventoSide[] = [
  { id: "1", data: "Oggi",   giorno: "Sab", ora: "09:00", titolo: "Sopralluogo Fortini",       sottotitolo: "Via Marconi 18, Cosenza",  tipo: "sopralluogo" },
  { id: "2", data: "Oggi",   giorno: "Sab", ora: "14:30", titolo: "Montaggio Esposito",        sottotitolo: "Via Garibaldi 45",         tipo: "montaggio"   },
  { id: "3", data: "Lun",    giorno: "27",  ora: "10:00", titolo: "Riunione mensile",          sottotitolo: "Sala riunioni",            tipo: "admin"       },
  { id: "4", data: "Mar",    giorno: "28",  ora: "12:00", titolo: "Scadenza fattura 047",      sottotitolo: "Bianchi Maria",            tipo: "scadenza"    },
  { id: "5", data: "Gio",    giorno: "30",  ora: "09:00", titolo: "Sopralluogo definitivo Rossi", sottotitolo: "Via Roma 88, Castrolibero", tipo: "sopralluogo" },
];

export default function CalendarioSidebarTablet() {
  return (
    <div style={cardStyle({ padding: "16px 18px", height: "fit-content" })}>
      <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, marginBottom: 12, letterSpacing: "-0.2px" }}>
        Prossimi eventi
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DATA.map((e) => {
          const ramp = TINTS[TIPO_TINT[e.tipo]];
          return (
            <div
              key={e.id}
              style={{
                display: "flex",
                gap: 10,
                padding: "8px 10px",
                background: ramp[50],
                border: `1px solid ${ramp[100]}`,
                borderLeft: `3px solid ${ramp[400]}`,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {/* Data box */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 40,
                color: ramp[500],
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase" }}>
                  {e.data}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 2 }}>
                  {e.giorno}
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, paddingLeft: 4, borderLeft: `1px solid ${ramp[100]}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: ramp[500], fontVariantNumeric: "tabular-nums" }}>
                    {e.ora}
                  </span>
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: TT.text1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "-0.1px",
                }}>
                  {e.titolo}
                </div>
                <div style={{
                  fontSize: 10,
                  color: TT.text3,
                  marginTop: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
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
