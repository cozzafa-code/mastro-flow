"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useDashboard } from "../dashboard-context";

interface KpiCardData {
  id: string;
  label: string;
  value: string;
  delta?: string;
  tint: "teal" | "red" | "blue" | "green" | "violet";
  icon: IconName;
  target: string;
}

const KPI_DATA: KpiCardData[] = [
  { id: "commesse",    label: "Commesse attive",     value: "20",          delta: "+2 da ieri",       tint: "teal",   icon: "kpiCommesse",    target: "commesse"     },
  { id: "sopralluoghi",label: "Sopralluoghi oggi",   value: "4",           delta: "+1 da ieri",       tint: "red",    icon: "kpiSopralluogo", target: "sopralluoghi" },
  { id: "produzione",  label: "Produzione in corso",  value: "6",           delta: "+2 da ieri",       tint: "blue",   icon: "kpiProduzione",  target: "produzione"   },
  { id: "fatturato",   label: "Fatturato mese",      value: "€ 24.850",delta: "+12% vs scorso", tint: "green",  icon: "kpiFatturato",   target: "contabilita"  },
  { id: "margine",     label: "Margine medio",       value: "28%",         delta: "+4% vs scorso",    tint: "violet", icon: "kpiMargine",     target: "contabilita"  },
];

export default function KpiRowTablet() {
  const { navigate, preset } = useDashboard();

  // Posatore vede solo 3 KPI rilevanti
  const data = preset === "posatore"
    ? KPI_DATA.filter((k) => ["commesse","sopralluoghi","produzione"].includes(k.id))
    : KPI_DATA;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 18,
      }}
    >
      {data.map((k) => (
        <KpiCard key={k.id} data={k} onClick={() => navigate(k.target)} />
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
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={cardStyle({
        padding: "16px 16px 14px",
        cursor: "pointer",
        minWidth: 0,
        overflow: "hidden",
        boxShadow: hover ? TT.shadowMd : TT.shadowSm,
        borderColor: hover ? ramp[100] : TT.border,
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.18s",
        position: "relative",
      })}
    >
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 90, height: 90,
        background: `radial-gradient(circle, ${ramp[50]} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{
        width: 42, height: 42,
        borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
        color: "#fff",
        marginBottom: 12,
        boxShadow: `0 4px 12px ${ramp[300]}, inset 0 1px 0 rgba(255,255,255,0.2)`,
        position: "relative", zIndex: 1,
      }}>
        <Icon name={data.icon} size={20} color="#fff" strokeWidth={2.2} />
      </div>

      <div style={{
        fontSize: 11, color: TT.text2, fontWeight: 600,
        marginBottom: 4, letterSpacing: "-0.05px",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {data.label}
      </div>

      <div style={{
        fontSize: 24, fontWeight: 800,
        letterSpacing: "-0.7px", lineHeight: 1.1,
        color: ramp[600],
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {data.value}
      </div>

      {data.delta && (
        <div style={{
          fontSize: 10, color: TT.green[600], fontWeight: 700,
          marginTop: 6, letterSpacing: "-0.05px",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{
            display: "inline-block", width: 0, height: 0,
            borderLeft: "3px solid transparent",
            borderRight: "3px solid transparent",
            borderBottom: `4px solid ${TT.green[500]}`,
          }} />
          {data.delta}
        </div>
      )}
    </div>
  );
}
