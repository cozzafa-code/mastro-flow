// components/montaggi/MontaggiHeroCard.tsx
"use client";

import React from "react";
import {
  C,
  MontaggioRow,
  DOW_FULL,
  MONTH_FULL,
  formatHour,
  parseDateISO,
  daysBetween,
} from "./montaggi-types";

interface Props {
  prossimo: MontaggioRow;
  today: Date;
  onApriCommessa: (commessaId: string) => void;
}

export default function MontaggiHeroCard({
  prossimo,
  today,
  onApriCommessa,
}: Props) {
  const d = parseDateISO(prossimo.data_montaggio);
  const giorni = d ? daysBetween(today, d) : 0;
  const cliente =
    `${prossimo.commessa_cliente || ""} ${prossimo.commessa_cognome || ""}`.trim() ||
    "Cliente";
  const oreLav =
    prossimo.ora_inizio && prossimo.ora_fine
      ? `${formatHour(prossimo.ora_inizio)} - ${formatHour(prossimo.ora_fine)}`
      : "Da definire";

  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${C.white} 0%, ${C.whiteOff} 100%)`,
        borderRadius: 18,
        marginBottom: 14,
        boxShadow: C.shadowMd,
        overflow: "hidden",
      }}
    >
      {/* Banner ambra */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.amber} 0%, #D49A47 100%)`,
          padding: "8px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: C.navy,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Prossimo montaggio
        </div>
        <div style={{ fontSize: 11, fontWeight: 800 }}>
          {giorni === 0
            ? "Oggi"
            : giorni === 1
              ? "Domani"
              : `Tra ${giorni} giorni`}
        </div>
      </div>

      <div style={{ padding: "14px 16px 16px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: C.navyText,
                marginBottom: 4,
                letterSpacing: -0.4,
              }}
            >
              {cliente}
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.navyDim,
                fontWeight: 600,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: '"SF Mono", Menlo, monospace',
                  fontWeight: 800,
                  color: C.navyText,
                  background: C.whiteOff,
                  padding: "2px 7px",
                  borderRadius: 5,
                  fontSize: 11,
                }}
              >
                {prossimo.commessa_code || "—"}
              </span>
              <span>
                {prossimo.commessa_vani_count || 0} vani
                {prossimo.commessa_totale
                  ? ` · €${prossimo.commessa_totale.toLocaleString("it-IT")}`
                  : ""}
              </span>
            </div>
          </div>
          {d && (
            <div style={{ textAlign: "right", flex: "0 0 auto" }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: C.amberDark,
                  lineHeight: 1,
                }}
              >
                {d.getDate()}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: C.navyDim,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  fontWeight: 800,
                  marginTop: 4,
                }}
              >
                {DOW_FULL[d.getDay()].slice(0, 3)} · {MONTH_FULL[d.getMonth()].slice(0, 3)}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onApriCommessa(prossimo.commessa_id)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 800,
            border: `1.5px solid ${C.borderStrong}`,
            background: C.white,
            color: C.navyText,
            cursor: "pointer",
          }}
        >
          Apri commessa
        </button>

        {prossimo.commessa_indirizzo && (
          <div
            style={{
              fontSize: 11,
              color: C.navyDim,
              marginTop: 10,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {prossimo.commessa_indirizzo}
            {prossimo.commessa_citta ? `, ${prossimo.commessa_citta}` : ""}
            {" · "}
            {oreLav}
          </div>
        )}
      </div>
    </div>
  );
}
