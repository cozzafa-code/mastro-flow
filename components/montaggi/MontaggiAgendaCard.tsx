// components/montaggi/MontaggiAgendaCard.tsx
"use client";

import React from "react";
import {
  C,
  MontaggioRow,
  DOW_FULL,
  MONTH_FULL,
  formatHour,
} from "./montaggi-types";

interface Props {
  selectedDay: Date;
  events: MontaggioRow[];
  onMontaggioClick: (m: MontaggioRow) => void;
}

export default function MontaggiAgendaCard({
  selectedDay,
  events,
  onMontaggioClick,
}: Props) {
  const totH = events.reduce((s, m) => s + (m.ore_preventivate || 0), 0);

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        boxShadow: C.shadowSm,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${C.navy2} 0%, ${C.navy} 100%)`,
          padding: "12px 16px",
          color: C.white,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              lineHeight: 1,
              color: C.amberBright,
            }}
          >
            {selectedDay.getDate()}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {DOW_FULL[selectedDay.getDay()]}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
                marginTop: 1,
              }}
            >
              {MONTH_FULL[selectedDay.getMonth()]} {selectedDay.getFullYear()}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11 }}>
          <div>
            <b
              style={{
                fontWeight: 800,
                color: C.amberBright,
                fontSize: 13,
              }}
            >
              {events.length}
            </b>{" "}
            event{events.length === 1 ? "o" : "i"}
          </div>
          {totH > 0 && <div style={{ opacity: 0.7 }}>{totH}h totali</div>}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        {events.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px 10px",
              color: C.navyDim,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Nessun montaggio in questa giornata
          </div>
        ) : (
          events.map((m, i) => {
            const cliente =
              `${m.commessa_cliente || ""} ${m.commessa_cognome || ""}`.trim() ||
              "Cliente";
            return (
              <div
                key={m.id}
                onClick={() => onMontaggioClick(m)}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom:
                    i === events.length - 1 ? "none" : `1px solid ${C.border}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: "0 0 50px", textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: C.navyText,
                    }}
                  >
                    {formatHour(m.ora_inizio)}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.navyFaint,
                      fontWeight: 700,
                      marginTop: 2,
                    }}
                  >
                    {m.ore_preventivate ? `${m.ore_preventivate}h` : ""}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    paddingLeft: 12,
                    borderLeft: `3px solid ${m.stato === "in_corso" ? C.greenBright : C.amber}`,
                    marginLeft: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: C.navyText,
                      lineHeight: 1.2,
                    }}
                  >
                    {cliente} · {m.commessa_code || ""}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.navyDim,
                      fontWeight: 600,
                      marginTop: 2,
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <span>{m.commessa_indirizzo || "—"}</span>
                    {m.squadra && m.squadra.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{m.squadra.join(", ")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
