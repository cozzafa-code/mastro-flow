// components/mobile/team/TeamHeaderMobile.tsx
"use client";
import React from "react";
import { PAL } from "@/lib/types/team";

interface Props {
  totalOperators: number;
  attivi: number;
  problemi: number;
}

export default function TeamHeaderMobile({ totalOperators, attivi, problemi }: Props) {
  return (
    <div style={{
      background: PAL.headerGrad,
      padding: "16px 16px 20px",
      color: "#FFFFFF",
      fontFamily: "Inter, -apple-system, sans-serif",
    }}>
      {/* H1 24px Bold */}
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
        TEAM
      </div>
      {/* Body2 12px Regular */}
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 400, marginTop: 6 }}>
        {totalOperators} operatori · {attivi} attivi{problemi > 0 ? ` · ${problemi} problema${problemi > 1 ? 'i' : ''}` : ''}
      </div>
    </div>
  );
}
