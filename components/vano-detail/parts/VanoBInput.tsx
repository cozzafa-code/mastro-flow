// MASTRO ERP - Vano Detail / VanoBInput
// Usa stato locale per evitare reset durante la digitazione
import React, { useState, useEffect, useRef } from "react";

export default function VanoBInput({ label, field, value, stepColor, textColor, subColor, bdrColor, cardBg, onUpdate }: {
  label: string; field: string; value: number;
  stepColor: string; textColor: string; subColor: string; bdrColor: string; cardBg: string;
  onUpdate: (val: number) => void;
}) {
  const [localVal, setLocalVal] = useState(value > 0 ? String(value) : "");
  const isFocused = useRef(false);

  // Aggiorna solo se non si sta digitando
  useEffect(() => {
    if (!isFocused.current) {
      setLocalVal(value > 0 ? String(value) : "");
    }
  }, [value]);

  const isFilled = localVal !== "" && parseInt(localVal) > 0;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: isFilled ? "#1E3A5F" : "#8A8A82", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localVal}
          placeholder="—"
          onFocus={() => { isFocused.current = true; }}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={() => {
            isFocused.current = false;
            const num = parseInt(localVal) || 0;
            onUpdate(num);
          }}
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
