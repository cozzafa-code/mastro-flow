// components/mobile/team/TeamTabsMobile.tsx
"use client";
import React from "react";
import type { TeamTab } from "@/hooks/useTeamFilters";
import { PAL } from "@/lib/types/team";

interface Props {
  tab: TeamTab;
  setTab: (t: TeamTab) => void;
  problemiBadge: number;
}

export default function TeamTabsMobile({ tab, setTab, problemiBadge }: Props) {
  const TABS: { id: TeamTab; lbl: string }[] = [
    { id: "tutti", lbl: "Tutti" },
    { id: "attivi", lbl: "Attivi" },
    { id: "squadre", lbl: "Squadre" },
    { id: "problemi", lbl: "Problemi" },
  ];
  return (
    <div style={{ padding: "10px 14px 0", display: "flex", gap: 6 }}>
      {TABS.map(t => {
        const active = tab === t.id;
        const showBadge = t.id === "problemi" && problemiBadge > 0;
        return (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 999, cursor: "pointer",
              background: active ? PAL.tabActive : PAL.tabInactive,
              color: active ? "#fff" : PAL.tabInactiveText,
              fontSize: 12, fontWeight: 700,
              border: active ? "none" : `1px solid ${PAL.tabBorder}`,
              textAlign: "center" as any,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            <span>{t.lbl}</span>
            {showBadge && (
              <span style={{
                background: "#EF4444", color: "#fff",
                minWidth: 16, height: 16, borderRadius: 999,
                fontSize: 9, fontWeight: 800,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px",
              }}>{problemiBadge}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
