"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";

interface FaseProduzione {
  label: string;
  value: number;
  tint: "green" | "amber" | "blue";
}

const DATA: FaseProduzione[] = [
  { label: "Completate",      value: 12, tint: "green" },
  { label: "In lavorazione",  value: 6,  tint: "amber" },
  { label: "Da iniziare",     value: 4,  tint: "blue"  },
];

const TOT = DATA.reduce((s, d) => s + d.value, 0);

// Donut SVG stroke-dasharray
function Donut({ size = 96 }: { size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TT.bgSoft} strokeWidth={stroke} />
      {DATA.map((d, i) => {
        const ramp = TT[d.tint];
        const len = (d.value / TOT) * c;
        const segOffset = offset;
        offset += len;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ramp[400]}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-segOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.35em"
        fontSize="22"
        fontWeight="800"
        fill={TT.text1}
        style={{ letterSpacing: "-0.6px", fontVariantNumeric: "tabular-nums" }}
      >
        {TOT}
      </text>
    </svg>
  );
}

export default function ProduzionePanelTablet() {
  return (
    <div style={cardStyle({ padding: "16px 18px", display: "flex", flexDirection: "column" })}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: TT.blue[400], display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="produzione" size={14} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
            Produzione
          </div>
        </div>
        <div style={{ fontSize: 11, color: TT.blue[500], fontWeight: 600, cursor: "pointer" }}>
          Apri &rsaquo;
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 4 }}>
        <Donut size={96} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {DATA.map((d, i) => {
            const ramp = TT[d.tint];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: ramp[400], flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: TT.text2, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {d.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ramp[500], fontVariantNumeric: "tabular-nums" }}>
                  {d.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
