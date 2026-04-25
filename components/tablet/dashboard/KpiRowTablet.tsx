"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";

// =========================================================
// KpiRowTablet - 5 KPI in row
// =========================================================
// Card con: icona quadrata 48px pastel-400 + label + valore -500 + delta
// Allineato al mockup HD pastello approvato.
// =========================================================

interface KpiCardData {
  id: string;
  label: string;
  value: string;
  delta?: string;
  /** Tinta pastel: usa TT.<tint>[400] per icona, [500] per valore. */
  tint: "teal" | "red" | "blue" | "green" | "violet";
  icon: IconName;
}

const DEFAULT_DATA: KpiCardData[] = [
  { id: "commesse",    label: "Commesse attive",    value: "20",       delta: "+2 da ieri",          tint: "teal",   icon: "kpiCommesse"    },
  { id: "sopralluoghi",label: "Sopralluoghi oggi",  value: "4",        delta: "+1 da ieri",          tint: "red",    icon: "kpiSopralluogo" },
  { id: "produzione",  label: "Produzione in corso",value: "6",        delta: "+2 da ieri",          tint: "blue",   icon: "kpiProduzione"  },
  { id: "fatturato",   label: "Fatturato mese",     value: "€ 24.850", delta: "+12% vs mese scorso", tint: "green",  icon: "kpiFatturato"   },
  { id: "margine",     label: "Margine medio",      value: "28%",      delta: "+4% vs mese scorso",  tint: "violet", icon: "kpiMargine"     },
];

export interface KpiRowTabletProps {
  /** Override dei dati (per test / data live). Default = DEFAULT_DATA. */
  data?: KpiCardData[];
  /** Click su una card. */
  onCardClick?: (id: string) => void;
}

export default function KpiRowTablet({ data = DEFAULT_DATA, onCardClick }: KpiRowTabletProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${data.length}, 1fr)`,
        gap: 14,
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
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: onClick ? "pointer" : "default",
      })}
    >
      {/* Icon square pastel-400 */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: ramp[400],
          color: "#fff",
        }}
      >
        <Icon name={data.icon} size={22} color="#fff" strokeWidth={2} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: TT.text2,
            fontWeight: 500,
            marginBottom: 4,
            letterSpacing: "-0.1px",
          }}
        >
          {data.label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.8px",
            lineHeight: 1,
            color: ramp[500],
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {data.value}
        </div>
        {data.delta && (
          <div
            style={{
              fontSize: 11,
              color: TT.green[500],
              fontWeight: 600,
              marginTop: 6,
              letterSpacing: "-0.05px",
            }}
          >
            {data.delta}
          </div>
        )}
      </div>
    </div>
  );
}
