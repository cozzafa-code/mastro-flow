"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";

// =========================================================
// KpiRowTablet - 5 KPI in row (layout verticale compatto)
// =========================================================
// Card: icona quadrata 38px in alto + label small + valore -500 + delta
// Layout verticale per stare in 1/5 della larghezza senza overflow.
// =========================================================

interface KpiCardData {
  id: string;
  label: string;
  value: string;
  delta?: string;
  tint: "teal" | "red" | "blue" | "green" | "violet";
  icon: IconName;
}

const DEFAULT_DATA: KpiCardData[] = [
  { id: "commesse",    label: "Commesse attive",    value: "20",       delta: "+2 da ieri",        tint: "teal",   icon: "kpiCommesse"    },
  { id: "sopralluoghi",label: "Sopralluoghi oggi",  value: "4",        delta: "+1 da ieri",        tint: "red",    icon: "kpiSopralluogo" },
  { id: "produzione",  label: "Produzione in corso",value: "6",        delta: "+2 da ieri",        tint: "blue",   icon: "kpiProduzione"  },
  { id: "fatturato",   label: "Fatturato mese",     value: "€ 24.850", delta: "+12% vs scorso", tint: "green",  icon: "kpiFatturato"   },
  { id: "margine",     label: "Margine medio",      value: "28%",      delta: "+4% vs scorso",     tint: "violet", icon: "kpiMargine"     },
];

export interface KpiRowTabletProps {
  data?: KpiCardData[];
  onCardClick?: (id: string) => void;
}

export default function KpiRowTablet({ data = DEFAULT_DATA, onCardClick }: KpiRowTabletProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
        gap: 12,
        marginBottom: 18,
      }}
    >
      {data.map((k) => (
        <KpiCard key={k.id} data={k} onClick={() => onCardClick?.(k.id)} />
      ))}
    </div>
  );
}

interface KpiCardProps {
  data: KpiCardData;
  onClick?: () => void;
}

function KpiCard({ data, onClick }: KpiCardProps) {
  const ramp = TT[data.tint];
  return (
    <div
      onClick={onClick}
      style={cardStyle({
        padding: "14px 14px 12px",
        cursor: onClick ? "pointer" : "default",
        minWidth: 0,
        overflow: "hidden",
      })}
    >
      {/* Icon square pastel-400 - top */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: ramp[400],
          color: "#fff",
          marginBottom: 10,
        }}
      >
        <Icon name={data.icon} size={18} color="#fff" strokeWidth={2} />
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 11,
          color: TT.text2,
          fontWeight: 500,
          marginBottom: 4,
          letterSpacing: "-0.05px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {data.label}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.6px",
          lineHeight: 1.1,
          color: ramp[500],
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {data.value}
      </div>

      {/* Delta */}
      {data.delta && (
        <div
          style={{
            fontSize: 10,
            color: TT.green[500],
            fontWeight: 600,
            marginTop: 5,
            letterSpacing: "-0.05px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {data.delta}
        </div>
      )}
    </div>
  );
}
