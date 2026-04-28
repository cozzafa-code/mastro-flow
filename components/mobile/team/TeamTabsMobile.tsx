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
    <div style={{ padding: "12px 16px 0", display: "flex", gap: 6, fontFamily: "Inter, sans-serif" }}>
      {TABS.map(t => {
        const active = tab === t.id;
        return (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "8px 12px",
              borderRadius: 999,
              cursor: "pointer",
              background: active ? PAL.pillActive : PAL.pillInactiveBg,
              color: active ? "#FFFFFF" : PAL.text,
              // Body2 12px
              fontSize: 12, fontWeight: active ? 600 : 500,
              border: active ? "none" : `1px solid ${PAL.border}`,
              textAlign: "center" as any,
            }}>
            {t.lbl}
          </div>
        );
      })}
    </div>
  );
}
