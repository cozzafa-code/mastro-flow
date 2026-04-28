// components/mobile/team/TeamSquadsMobile.tsx
"use client";
import React from "react";
import type { Team } from "@/lib/types/team";
import { PAL } from "@/lib/types/team";

interface Props {
  teams: Team[];
  onOpen?: (t: Team) => void;
  onNuovaSquadra?: () => void;
}

export default function TeamSquadsMobile({ teams, onOpen, onNuovaSquadra }: Props) {
  return (
    <div style={{ padding: "16px 14px 100px" }}>
      {teams.map(t => {
        const probl = t.problem_count > 0;
        const badgeText = probl ? `● ${t.problem_count} problema${t.problem_count > 1 ? 'i' : ''}` : `● ${t.status_label}`;
        const badgeColor = probl ? PAL.problemaText : PAL.attivoText;

        return (
          <div key={t.id} onClick={() => onOpen?.(t)} style={{
            background: PAL.card,
            borderRadius: 14,
            padding: "14px 14px",
            marginBottom: 10,
            border: `1px solid ${PAL.cardBorder}`,
            cursor: "pointer",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: PAL.text }}>{t.name}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: badgeColor }}>
                {badgeText}
              </span>
            </div>
            <div style={{ fontSize: 12, color: PAL.textSub, marginBottom: 2 }}>{t.members.join(", ")}</div>
            <div style={{ fontSize: 12, color: PAL.text, fontWeight: 600, marginBottom: 10 }}>{t.current_job || "—"}</div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#F0EDE5", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${t.progress}%`, height: "100%", background: probl ? PAL.problemaDot : PAL.attivoDot }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: PAL.textSub, minWidth: 32, textAlign: "right" as any }}>{t.progress}%</span>
            </div>
          </div>
        );
      })}

      <button onClick={onNuovaSquadra} style={{
        width: "100%", marginTop: 8, padding: "12px 14px",
        background: PAL.teal, color: "#fff", border: "none",
        borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      }}>
        + Nuova squadra
      </button>
    </div>
  );
}
