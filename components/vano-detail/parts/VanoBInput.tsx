// ======================================================================
// MASTRO ERP - Vano Detail / VanoBInput
// Estratto da components/VanoDetailPanel.tsx (refactor S2)
// ======================================================================

import React from "react";
import { FF } from "@/components/mastro-constants";

export default function VanoBInput({ label, field, value, stepColor, textColor, subColor, bdrColor, cardBg, onUpdate }: {
  label: string; field: string; value: number;
  stepColor: string; textColor: string; subColor: string; bdrColor: string; cardBg: string;
  onUpdate: (val: number) => void;
}) {
  const isFilled = value > 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: isFilled ? "#1E3A5F" : "#8A8A82", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value > 0 ? value : ""}
          placeholder="—"
          onChange={e => onUpdate(parseInt(e.target.value) || 0)}
          style={{
            width: "100%", padding: "14px 16px", fontSize: 24, fontWeight: 900,
            fontFamily: "'JetBrains Mono',monospace", textAlign: "center" as const,
            border: `2px solid ${isFilled ? "#1E3A5F" : "#F0EFEC"}`,
            borderRadius: 14,
            background: isFilled ? "rgba(30,58,95,0.06)" : "white",
            color: isFilled ? "#0D1F1F" : "#8BBCBC",
            outline: "none", boxSizing: "border-box" as const,
            WebkitAppearance: "none" as const,
            boxShadow: isFilled ? "0 2px 8px rgba(30,58,95,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
          }}
        />
        {isFilled && <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 800, color: "#8A8A82", pointerEvents: "none" }}>mm</span>}
      </div>
    </div>
  );
}
