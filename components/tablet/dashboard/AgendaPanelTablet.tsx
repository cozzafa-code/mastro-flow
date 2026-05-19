"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { useDashboard } from "../dashboard-context";
import { useMastroData } from "../store";
import CardHeader from "../CardHeader";

const TINTS = {
  red: TT.red, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet,
} as const;

interface EventoAgenda {
  id: string;
  ora: string;
  titolo: string;
  indirizzo: string;
  tint: keyof typeof TINTS;
  commessaId?: string;
  sopralluogoId?: string;
  montaggioId?: string;
}

export default function AgendaPanelTablet() {
  const { navigate } = useDashboard();
  const data = useMastroData();

  // Compongo lista eventi: 4 prossimi sopralluoghi + montaggi
  const sopralluoghi = data.getSopralluoghi()
    .filter((s) => s.stato !== "completato")
    .slice(0, 3);

  const montaggi = data.getMontaggi().slice(0, 2);

  const eventi: EventoAgenda[] = [
    ...sopralluoghi.map((s): EventoAgenda => {
      const cli = data.getCliente(s.clienteId);
      return {
        id: s.id,
        ora: s.ora,
        titolo: `Sopralluogo ${cli?.nome.split(" ")[0] || ""}`,
        indirizzo: `${cli?.indirizzo || ""}, ${cli?.citta || ""}`,
        tint: "red",
        commessaId: s.commessaId,
        sopralluogoId: s.id,
      };
    }),
    ...montaggi.map((m): EventoAgenda => {
      const c = data.getCommessa(m.commessaId);
      const cli = c ? data.getCliente(c.clienteId) : undefined;
      return {
        id: m.id,
        ora: m.ora,
        titolo: `Montaggio ${cli?.nome.split(" ")[0] || ""}`,
        indirizzo: `${cli?.indirizzo || ""}, ${cli?.citta || ""}`,
        tint: "green",
        commessaId: m.commessaId,
        montaggioId: m.id,
      };
    }),
  ].slice(0, 5);

  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="calendario"
        title="Agenda prossima"
        tint="violet"
        seeAllLabel="Tutti"
        onSeeAll={() => navigate("calendario")}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {eventi.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", color: TT.text3, fontSize: 11 }}>
            Nessun evento programmato
          </div>
        )}
        {eventi.map((e) => {
          const ramp = TINTS[e.tint];
          return (
            <div
              key={e.id}
              onClick={() => {
                if (e.sopralluogoId) navigate("sopralluoghi");
                else if (e.montaggioId) navigate("montaggi");
                else navigate("calendario");
              }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px",
                background: ramp[50],
                borderLeft: `3px solid ${ramp[400]}`,
                borderRadius: 7, cursor: "pointer",
                transition: "transform 0.12s",
              }}
              onMouseEnter={(ev) => ((ev.currentTarget as HTMLDivElement).style.transform = "translateX(2px)")}
              onMouseLeave={(ev) => ((ev.currentTarget as HTMLDivElement).style.transform = "translateX(0)")}
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
