// components/PassaggiSaltati.tsx
// Mostra la lista dei passaggi saltati con bottone "Riprendi" per riaprirli.

import React from "react";

type SkipEntry = { fase: string; motivo?: string; quando?: string };
type StepInfo = { id: string; l: string };

type Props = {
  skipLog: SkipEntry[];
  steps: StepInfo[];
  onRiprendi: (skipIndex: number, faseId: string) => void;
};

const T = {
  accent: "#ff9500",
  teal: "#28A0A0",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
};

export default function PassaggiSaltati({ skipLog, steps, onRiprendi }: Props) {
  if (!skipLog || skipLog.length === 0) return null;

  return (
    <div style={{
      marginBottom: 8,
      padding: "8px 10px",
      borderRadius: 8,
      background: "#ff950010",
      border: "1px solid #ff950030",
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 800,
        color: T.accent,
        textTransform: "uppercase",
        marginBottom: 6,
        letterSpacing: 0.4,
      }}>
        Passaggi saltati
      </div>

      {skipLog.map((skip, si) => {
        const stepInfo = steps.find(s => s.id === skip.fase);
        const label = stepInfo?.l || skip.fase;
        return (
          <div key={si} style={{
            fontSize: 10,
            color: T.textDark,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 0",
            borderTop: si > 0 ? "1px solid #ff950020" : "none",
          }}>
            <span style={{
              color: T.accent,
              fontWeight: 700,
              minWidth: 70,
            }}>⏭ {label}</span>
            <span style={{
              color: T.textSub,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {skip.motivo || "·"}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onRiprendi(si, skip.fase);
              }}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
                background: T.teal,
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
                userSelect: "none",
                flexShrink: 0,
              }}
            >
              Riprendi
            </span>
          </div>
        );
      })}
    </div>
  );
}
