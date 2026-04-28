// components/mobile/team/TeamTabsMobile.tsx
"use client";
import React from "react";
import type { TeamTab } from "@/hooks/useTeamFilters";
import { TT } from "@/lib/types/team";

interface Props {
  tab: TeamTab;
  setTab: (t: TeamTab) => void;
  problemiBadge: number;
}

export default function TeamTabsMobile({ tab, setTab, problemiBadge }: Props) {
  const TABS: { id: TeamTab; lbl: string }[] = [
    { id: "tutti",    lbl: "Tutti" },
    { id: "attivi",   lbl: "Attivi" },
    { id: "squadre",  lbl: "Squadre" },
    { id: "problemi", lbl: "Problemi" },
  ];
  return (
    <div style={{ padding: "12px 14px 0", display: "flex", gap: 6, overflowX: "auto" as any, WebkitOverflowScrolling: "touch" as any }}>
      {TABS.map(t => {
        const active = tab === t.id;
        const showBadge = t.id === "problemi" && problemiBadge > 0;
        return (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px", borderRadius: 999, cursor: "pointer", flexShrink: 0,
              background: active ? "#0D1F1F" : "#FFFFFF",
              color: active ? "#FFFFFF" : "#0D1F1F",
              fontSize: 12, fontWeight: 800, letterSpacing: 0.2,
              border: active ? "none" : `1px solid ${TT.bdr}`,
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: active ? "0 2px 6px rgba(13,31,31,0.15)" : "none",
            }}>
            {t.lbl}
            {showBadge && (
              <span style={{
                background: "#EF4444", color: "#fff",
                minWidth: 18, height: 18, borderRadius: 999,
                fontSize: 10, fontWeight: 900,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "0 5px",
              }}>{problemiBadge}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
