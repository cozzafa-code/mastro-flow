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
      padding: "10px 16px 18px",
      color: "#fff",
    }}>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.3px", lineHeight: 1.1, marginTop: 4 }}>
        TEAM
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginTop: 4 }}>
        {totalOperators} operatori · {attivi} attivi{problemi > 0 ? ` · ${problemi} problema${problemi > 1 ? 'i' : ''}` : ''}
      </div>
    </div>
  );
}
