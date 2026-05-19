"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon, IconName } from "./icons";

const TINTS = {
  teal: TT.teal, blue: TT.blue, violet: TT.violet, amber: TT.amber,
} as const;

const RUOLI: Record<string, { label: string; descr: string; icon: IconName; tint: keyof typeof TINTS; nome: string }> = {
  titolare:   { label: "Titolare",   descr: "Vista completa", icon: "trendUp",  tint: "teal",   nome: "Walter Cozza"   },
  posatore:   { label: "Posatore",   descr: "Vedi solo le tue cose", icon: "team",     tint: "blue",   nome: "Walter Cozza"   },
  segreteria: { label: "Segreteria", descr: "Vista amministrativa", icon: "documento",tint: "violet", nome: "Walter Cozza"   },
};

interface Props {
  presetRuolo: "titolare" | "posatore" | "segreteria";
  setPresetRuolo: (p: "titolare" | "posatore" | "segreteria") => void;
}

export default function BannerRuolo({ presetRuolo, setPresetRuolo }: Props) {
  if (presetRuolo === "titolare") return null; // banner solo se non titolare

  const r = RUOLI[presetRuolo];
  const ramp = TINTS[r.tint];

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      padding: "8px 18px",
      background: `linear-gradient(135deg, ${ramp[400]}, ${ramp[500]})`,
      color: "#fff",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: `0 2px 12px ${ramp[300]}`,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: "rgba(255,255,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={r.icon} size={15} color="#fff" strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.1px" }}>
          Vista <strong>{r.label}</strong> attiva &middot; {r.descr}
        </div>
        <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1 }}>
          Stai vedendo solo i dati relativi a <strong>{r.nome}</strong>
        </div>
      </div>
      <button onClick={() => setPresetRuolo("titolare")} style={{
        padding: "6px 12px",
        background: "rgba(255,255,255,0.2)",
        border: "1px solid rgba(255,255,255,0.4)",
        borderRadius: 7,
        color: "#fff",
        fontSize: 11, fontWeight: 700,
        cursor: "pointer", fontFamily: TT.fontFamily,
      }}>
        Torna a Titolare
      </button>
    </div>
  );
}
