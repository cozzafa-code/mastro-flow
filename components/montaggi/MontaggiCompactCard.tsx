// components/montaggi/MontaggiCompactCard.tsx
"use client";

import React from "react";
import {
  C,
  MontaggioRow,
  bdgColors,
  formatHour,
  statoLabel,
} from "./montaggi-types";

interface Props {
  montaggio: MontaggioRow;
  onClick?: (m: MontaggioRow) => void;
  showDate?: boolean; // se true mostra data invece di ora (per completati)
}

export default function MontaggiCompactCard({
  montaggio,
  onClick,
  showDate,
}: Props) {
  const colors = bdgColors(montaggio.stato);
  const isCompletato = montaggio.stato === "completato";
  const isDaPianif = montaggio.stato === "da_pianificare";
  const isInCorso = montaggio.stato === "in_corso";

  // progresso simulato per in_corso (in futuro: dato reale da DB)
  const progress = isInCorso ? 67 : 0;

  // colonna sinistra: ora o data
  let leftTop = formatHour(montaggio.ora_inizio);
  let leftBottom = formatHour(montaggio.ora_fine);
  let leftColor = C.navyText;
  let leftSize = 14;
  let leftLetter = "normal";

  if (isDaPianif) {
    leftTop = "DAL";
    leftBottom = montaggio.data_montaggio
      ? new Date(montaggio.data_montaggio).toLocaleDateString("it-IT", {
          day: "numeric",
          month: "short",
        })
      : "—";
    leftColor = C.red;
    leftSize = 11;
    leftLetter = "0";
  } else if (showDate && montaggio.data_montaggio) {
    const d = new Date(montaggio.data_montaggio);
    leftTop = String(d.getDate());
    leftBottom = d.toLocaleDateString("it-IT", { month: "short" }).toLowerCase();
    leftColor = C.navyDim;
  }

  // badge testo
  let badgeText: string = statoLabel(montaggio.stato);
  if (montaggio.stato === "programmato" && montaggio.ore_preventivate) {
    badgeText = `${montaggio.ore_preventivate}h`;
  } else if (isCompletato) {
    badgeText = "✓ Fatto";
  } else if (isDaPianif) {
    badgeText = "Pianifica";
  }

  // meta string
  const metaParts: string[] = [];
  if (montaggio.stato === "programmato") {
    if (montaggio.ore_preventivate && montaggio.ore_preventivate < 24) {
      badgeText = `${montaggio.ore_preventivate}h`;
    } else if (montaggio.ore_preventivate && montaggio.ore_preventivate >= 24) {
      badgeText = `${Math.round(montaggio.ore_preventivate / 8)}gg`;
    }
  } else if (isCompletato) {
  const metaStr = metaParts.join(" · ");

  const cliente =
    `${montaggio.commessa_cliente || ""} ${montaggio.commessa_cognome || ""}`.trim() ||
    "Cliente";

  return (
    <div
      onClick={() => onClick && onClick(montaggio)}
      style={{
        background: C.white,
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 8,
        boxShadow: C.shadowSm,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: isCompletato ? 0.78 : 1,
      }}
    >
      {/* Barra colorata laterale */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: colors.bar,
        }}
      />

      {/* Colonna sinistra: ora/data */}
      <div
        style={{
          flex: "0 0 auto",
          width: 50,
          textAlign: "center",
          borderRight: `1px solid ${C.border}`,
          paddingRight: 12,
        }}
      >
        <div
          style={{
            fontSize: leftSize,
            fontWeight: 800,
            color: leftColor,
            lineHeight: 1,
            letterSpacing: leftLetter as React.CSSProperties["letterSpacing"],
          }}
        >
          {leftTop}
        </div>
        <div
          style={{
            fontSize: 10,
            color: isDaPianif ? C.red : C.navyDim,
            marginTop: 4,
            fontWeight: isDaPianif ? 800 : 700,
          }}
        >
          {isInCorso
            ? `${montaggio.commessa_vani_count ? Math.ceil((montaggio.commessa_vani_count * progress) / 100) : 2}/${montaggio.commessa_vani_count || 3} vani`
            : leftBottom}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: isCompletato ? C.navyDim : C.navyText,
            lineHeight: 1.2,
            marginBottom: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {cliente}
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.navyDim,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              fontFamily: '"SF Mono", Menlo, monospace',
              fontWeight: 800,
              color: C.navyText,
              background: C.whiteOff,
              padding: "1px 5px",
              borderRadius: 4,
              fontSize: 10,
            }}
          >
            {montaggio.commessa_code || "—"}
          </span>
          {metaStr && (
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {metaStr}
            </span>
          )}
        </div>
      </div>

      {/* Right: badge + progresso */}
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
        }}
      >
        <div
          style={{
            padding: "3px 8px",
            borderRadius: 6,
            fontSize: 9,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            background: colors.bg,
            color: colors.fg,
            whiteSpace: "nowrap",
          }}
        >
          {badgeText}
        </div>
        {isInCorso && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: C.green,
              fontWeight: 800,
            }}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {progress}%
          </div>
        )}
      </div>
    </div>
  );
}
