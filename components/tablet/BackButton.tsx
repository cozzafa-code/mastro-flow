"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon } from "./icons";

const SEZIONE_LABEL: Record<string, string> = {
  commesse:      "Commesse",
  calendario:    "Calendario",
  sopralluoghi:  "Sopralluoghi",
  produzione:    "Produzione",
  montaggi:      "Montaggi",
  ordini:        "Ordini fornitori",
  magazzino:     "Magazzino",
  clienti:       "Clienti",
  contabilita:   "Contabilità",
  fiscale:       "Fiscale",
  team:          "Team",
  ops:           "OPS",
  ai:            "AI Mastro AI",
  impostazioni:  "Impostazioni",
};

export interface BackButtonProps {
  active: string;
  onBack: () => void;
}

export default function BackButton({ active, onBack }: BackButtonProps) {
  const [hover, setHover] = React.useState(false);
  const label = SEZIONE_LABEL[active] || active;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
      }}
    >
      <button
        onClick={onBack}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 14px 8px 11px",
          background: hover ? TT.surface : TT.bgSoft,
          color: TT.text2,
          border: `1px solid ${hover ? TT.borderStrong : TT.border}`,
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: TT.fontFamily,
          letterSpacing: "-0.1px",
          boxShadow: hover ? TT.shadowSm : "none",
          transition: "all 0.12s",
        }}
      >
        <Icon
          name="chevronRight"
          size={13}
          color={TT.text2}
          strokeWidth={2.4}
          style={{ transform: "rotate(180deg)" }}
        />
        Indietro
      </button>

      {/* Breadcrumb visivo */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: TT.text3,
            letterSpacing: "-0.05px",
          }}
        >
          Dashboard
        </span>
        <Icon name="chevronRight" size={11} color={TT.text4} strokeWidth={2} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: TT.text1,
            letterSpacing: "-0.05px",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
