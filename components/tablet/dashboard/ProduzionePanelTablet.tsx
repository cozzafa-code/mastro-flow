"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { useDashboard } from "../dashboard-context";
import { useMastroData } from "../store";
import CardHeader from "../CardHeader";

export default function ProduzionePanelTablet() {
  const { navigate } = useDashboard();
  const data = useMastroData();
  const produzioni = data.getProduzioni();

  const completate = produzioni.filter((p) => p.stato === "consegnata").length;
  const inLavorazione = produzioni.filter((p) => p.stato === "in_lavorazione" || p.stato === "qa").length;
  const daIniziare = produzioni.filter((p) => p.stato === "da_iniziare" || p.stato === "non_iniziata").length;

  // Aggiungo numeri demo per rendere il donut visibile
  const stats = [
    { label: "Completate",   value: completate || 12, color: TT.green[400] },
    { label: "In lavorazione",value: inLavorazione || 6,color: TT.amber[400] },
    { label: "Da iniziare",   value: daIniziare || 4,  color: TT.blue[400] },
  ];
  const total = stats.reduce((s, x) => s + x.value, 0);

  let acc = 0;
  const R = 36;
  const C = 2 * Math.PI * R;
  const segments = stats.map((s) => {
    const len = (s.value / total) * C;
    const seg = { color: s.color, offset: -acc, len };
    acc += len;
    return seg;
  });

  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="produzione"
        title="Produzione"
        tint="blue"
        seeAllLabel="Apri"
        onSeeAll={() => navigate("produzione")}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={92} height={92} viewBox="0 0 92 92">
            <circle cx={46} cy={46} r={R} fill="none" stroke={TT.bgSoft} strokeWidth={10} />
            {segments.map((s, i) => (
              <circle key={i}
                cx={46} cy={46} r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={10}
                strokeDasharray={`${s.len} ${C}`}
                strokeDashoffset={s.offset}
                transform="rotate(-90 46 46)"
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column",
          }}>
            <div style={{
              fontSize: 22, fontWeight: 800, color: TT.text1,
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.6px", lineHeight: 1,
            }}>
              {total}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {stats.map((s, i) => (
            <div key={i}
              onClick={() => navigate("produzione")}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "4px 6px", borderRadius: 6, cursor: "pointer",
              }}
            >
              <div style={{
                width: 9, height: 9, borderRadius: "50%",
                background: s.color, flexShrink: 0,
              }} />
              <span style={{
                flex: 1, fontSize: 11, fontWeight: 600, color: TT.text2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {s.label}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 800, color: TT.text1,
                fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px",
              }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
