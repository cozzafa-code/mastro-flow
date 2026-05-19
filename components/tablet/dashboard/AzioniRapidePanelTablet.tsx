"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useDashboard } from "../dashboard-context";
import CardHeader from "../CardHeader";

interface Azione {
  id: string;
  label: string;
  icon: IconName;
  tint: keyof typeof TINTS;
  target: string;
}

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
  pink: TT.pink, orange: TT.orange,
} as const;

const AZIONI: Azione[] = [
  { id: "nuova-comm",      label: "Nuova commessa",   icon: "commesse",     tint: "orange", target: "commesse"     },
  { id: "nuovo-sopr",      label: "Nuovo sopralluogo", icon: "sopralluoghi",tint: "red",    target: "sopralluoghi" },
  { id: "nuovo-ordine",    label: "Nuovo ordine",      icon: "ordini",      tint: "amber",  target: "ordini"       },
  { id: "nuovo-mont",      label: "Nuovo montaggio",   icon: "montaggi",    tint: "green",  target: "montaggi"     },
  { id: "nuovo-prev",      label: "Nuovo preventivo",  icon: "preventivo",  tint: "blue",   target: "commesse"     },
  { id: "carica-doc",      label: "Carica documento",  icon: "documento",   tint: "violet", target: "commesse"     },
];

export default function AzioniRapidePanelTablet() {
  const { navigate } = useDashboard();
  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="dashboard"
        title="Azioni rapide"
        tint="amber"
      />
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 10,
      }}>
        {AZIONI.map((a) => {
          const ramp = TINTS[a.tint];
          return (
            <div
              key={a.id}
              onClick={() => navigate(a.target)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: ramp[50],
                border: `1px solid ${ramp[100]}`,
                borderRadius: TT.rMd,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = ramp[100];
                el.style.transform = "translateY(-1px)";
                el.style.boxShadow = `0 4px 8px ${ramp[100]}`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = ramp[50];
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 32, height: 32,
                borderRadius: 9,
                background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 2px 6px ${ramp[200]}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                flexShrink: 0,
              }}>
                <Icon name={a.icon} size={15} color="#fff" strokeWidth={2.4} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: TT.text1, letterSpacing: "-0.1px",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {a.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
