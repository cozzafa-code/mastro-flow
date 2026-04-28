// components/mobile/team/TeamSquadsMobile.tsx
"use client";
import React from "react";
import type { Team } from "@/lib/types/team";
import { PAL } from "@/lib/types/team";
import { IcoPlus } from "./icons";

interface Props {
  teams: Team[];
  onOpen?: (t: Team) => void;
  onNuovaSquadra?: () => void;
}

export default function TeamSquadsMobile({ teams, onOpen, onNuovaSquadra }: Props) {
  return (
    <div style={{ padding: "16px 16px 100px", fontFamily: "Inter, sans-serif" }}>
      {teams.map(t => {
        const probl = t.problem_count > 0;
        const badgeText = probl ? `${t.problem_count} problema${t.problem_count > 1 ? 'i' : ''}` : t.status_label;
        const badgeBg = probl ? PAL.problemaBg : PAL.attivoBg;
        const badgeTx = probl ? PAL.problemaText : PAL.attivoText;

        return (
          <div key={t.id} onClick={() => onOpen?.(t)} style={{
            background: PAL.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            border: `1px solid ${PAL.border}`,
            cursor: "pointer",
          }}>
            {/* HEADER: titolo squadra + badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              {/* H3 16px SemiBold */}
              <div style={{ fontSize: 16, fontWeight: 600, color: PAL.text }}>{t.name}</div>
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: "4px 10px", borderRadius: 999,
                background: badgeBg, color: badgeTx,
              }}>{badgeText}</span>
            </div>
            {/* Body 14px */}
            <div style={{ fontSize: 13, color: PAL.textGrey, marginBottom: 4 }}>{t.members.join(", ")}</div>
            <div style={{ fontSize: 13, color: PAL.text, fontWeight: 500, marginBottom: 12 }}>{t.current_job || "—"}</div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#F0F0F0", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${t.progress}%`, height: "100%", background: probl ? PAL.errorRed : PAL.attivoGreen }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: PAL.textGrey, minWidth: 36, textAlign: "right" as any }}>{t.progress}%</span>
            </div>
          </div>
        );
      })}

      <button onClick={onNuovaSquadra} style={{
        width: "100%", marginTop: 8, padding: "14px 16px",
        background: PAL.gradEnd,
        color: "#FFFFFF", border: "none",
        borderRadius: 12,
        fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <IcoPlus s={16} /> Nuova squadra
      </button>
    </div>
  );
}
