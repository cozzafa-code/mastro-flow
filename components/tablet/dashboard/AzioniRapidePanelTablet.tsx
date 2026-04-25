"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";

interface Azione {
  id: string;
  label: string;
  icon: IconName;
  tint: "teal" | "red" | "orange" | "green" | "blue" | "violet";
}

const DATA: Azione[] = [
  { id: "commessa",    label: "Nuova commessa",    icon: "commesse",     tint: "teal"   },
  { id: "sopralluogo", label: "Nuovo sopralluogo", icon: "sopralluoghi", tint: "red"    },
  { id: "ordine",      label: "Nuovo ordine",      icon: "ordini",       tint: "orange" },
  { id: "montaggio",   label: "Nuovo montaggio",   icon: "montaggi",     tint: "green"  },
  { id: "preventivo",  label: "Nuovo preventivo",  icon: "preventivo",   tint: "blue"   },
  { id: "documento",   label: "Carica documento",  icon: "documento",    tint: "violet" },
];

export interface AzioniRapidePanelTabletProps {
  onAction?: (id: string) => void;
}

export default function AzioniRapidePanelTablet({ onAction }: AzioniRapidePanelTabletProps) {
  return (
    <div style={cardStyle({ padding: "16px 18px" })}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: TT.amber[400], display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="trendUp" size={14} color="#fff" strokeWidth={2.2} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
          Azioni rapide
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${DATA.length}, minmax(0, 1fr))`,
          gap: 10,
        }}
      >
        {DATA.map((a) => (
          <ActionButton key={a.id} data={a} onClick={() => onAction?.(a.id)} />
        ))}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  data: Azione;
  onClick?: () => void;
}

function ActionButton({ data, onClick }: ActionButtonProps) {
  const ramp = TT[data.tint];
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "14px 10px",
        background: hover ? ramp[100] : ramp[50],
        border: `1px solid ${hover ? ramp[300] : ramp[100]}`,
        borderRadius: 12,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "background 0.12s, border 0.12s",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: ramp[400],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: hover ? `0 4px 10px ${ramp[300]}` : "none",
          transition: "box-shadow 0.15s",
        }}
      >
        <Icon name={data.icon} size={18} color="#fff" strokeWidth={2.2} />
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: TT.text1,
          textAlign: "center",
          letterSpacing: "-0.05px",
          lineHeight: 1.25,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
        }}
      >
        {data.label}
      </div>
    </div>
  );
}
