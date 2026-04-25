"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";

export type FaseWorkflow =
  | "rilievo" | "preventivo" | "conferma_ordine"
  | "ordine_confermato" | "produzione" | "montaggio" | "fattura_pagata";

interface FaseDef {
  id: FaseWorkflow;
  label: string;
  short: string;
}

const FASI: FaseDef[] = [
  { id: "rilievo",            label: "Rilievo",          short: "Rilievo" },
  { id: "preventivo",         label: "Preventivo",       short: "Preventivo" },
  { id: "conferma_ordine",    label: "Conferma ordine",  short: "Conferma" },
  { id: "ordine_confermato",  label: "Ordine confermato",short: "Confermato" },
  { id: "produzione",         label: "Produzione",       short: "Produzione" },
  { id: "montaggio",          label: "Montaggio",        short: "Montaggio" },
  { id: "fattura_pagata",     label: "Fattura pagata",   short: "Pagata" },
];

export interface CommessaStepperTabletProps {
  /** Fase corrente (default: produzione = indice 4). */
  current: FaseWorkflow;
  onClick?: (id: FaseWorkflow) => void;
}

export default function CommessaStepperTablet({ current, onClick }: CommessaStepperTabletProps) {
  const currentIdx = FASI.findIndex((f) => f.id === current);

  return (
    <div style={cardStyle({ padding: "16px 20px", marginBottom: 14 })}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {FASI.map((f, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          const isLast = i === FASI.length - 1;

          const bg = isDone ? TT.green[400] : isCurrent ? TT.teal[400] : TT.bgSoft;
          const colorLabel = isDone ? TT.green[500] : isCurrent ? TT.teal[500] : TT.text3;
          const lineColor = isDone || (isCurrent && i < FASI.length - 1) ? TT.green[300] : TT.border;

          return (
            <React.Fragment key={f.id}>
              <div
                onClick={() => onClick?.(f.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: bg,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    border: isCurrent ? `3px solid ${TT.teal[100]}` : "none",
                    boxShadow: isCurrent ? `0 0 0 4px ${TT.teal[50]}` : "none",
                    transition: "all 0.18s",
                  }}
                >
                  {isDone ? (
                    <Icon name="check" size={14} color="#fff" strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: isCurrent ? 700 : 600,
                    color: colorLabel,
                    marginTop: 6,
                    textAlign: "center",
                    letterSpacing: "-0.05px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.short}
                </div>
              </div>
              {!isLast && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: lineColor,
                    margin: "0 6px",
                    marginBottom: 22,
                    borderRadius: 1,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
