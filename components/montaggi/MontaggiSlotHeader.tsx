"use client";
import React from "react";
import { C, SQUADRE_PRESET, fmtDataBreve, fmtIso } from "./montaggi-editor-types";

interface Props {
  sqPrimary: string;
  durMini: string;
  suggerito: Date | null;
  commessaLabel: string | null;
  tipo: "cantiere" | "intervento" | "sopralluogo";
  squadra: string[];
  onToggleSquadra: (sq: string) => void;
  onOpenCommessa: () => void;
}

export default function MontaggiSlotHeader({
  sqPrimary, durMini, suggerito, commessaLabel,
  tipo, squadra, onToggleSquadra, onOpenCommessa,
}: Props) {
  return (
    <>
      <div
        style={{
          background: `linear-gradient(135deg, ${C.navy2} 0%, ${C.navy} 100%)`,
          color: C.white,
          padding: "12px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Pianifica</div>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.65)",
            fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 0.4, marginTop: 2,
          }}>
            Squadra {sqPrimary} · {durMini}
          </div>
        </div>
        {suggerito && (
          <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
            Suggerito<br />
            <b style={{ color: C.amber, fontSize: 13, fontWeight: 800 }}>{fmtDataBreve(fmtIso(suggerito))}</b>
          </div>
        )}
      </div>

      <div style={{
        padding: "8px 10px",
        background: C.whiteOff,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div
          onClick={onOpenCommessa}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.white,
            border: `1.5px solid ${C.borderStrong}`,
            borderRadius: 9,
            padding: "7px 9px",
            cursor: "pointer",
          }}
        >
          <div style={{
            flex: "0 0 28px", width: 28, height: 28, borderRadius: 7,
            background: C.amberSoft, color: C.amberDark,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
            <div style={{
              fontSize: 8, fontWeight: 800, color: C.navyDim,
              textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 1,
            }}>
              Commessa
            </div>
            <div style={{
              fontSize: 12, fontWeight: 800,
              color: commessaLabel ? C.navyText : C.navyFaint,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {commessaLabel || (tipo === "cantiere" ? "Scegli commessa" : "Opzionale - tap per scegliere")}
            </div>
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.navyFaint} strokeWidth={2.5} strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.white,
          border: `1.5px solid ${C.borderStrong}`,
          borderRadius: 9,
          padding: "7px 9px",
        }}>
          <div style={{
            flex: "0 0 28px", width: 28, height: 28, borderRadius: 7,
            background: C.navy, color: C.white,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx={9} cy={7} r={4} />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 8, fontWeight: 800, color: C.navyDim,
              textTransform: "uppercase", letterSpacing: 0.4,
            }}>
              Squadra
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {SQUADRE_PRESET.map((sp) => {
              const active = squadra.includes(sp.key);
              return (
                <button
                  key={sp.key}
                  type="button"
                  onClick={() => onToggleSquadra(sp.key)}
                  style={{
                    padding: "4px 8px", borderRadius: 6,
                    background: active ? C.navy : C.whiteOff,
                    color: active ? C.white : C.navyText,
                    fontSize: 10, fontWeight: 800,
                    cursor: "pointer",
                    border: `1px solid ${active ? C.navy : C.borderStrong}`,
                  }}
                >
                  {sp.key}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
