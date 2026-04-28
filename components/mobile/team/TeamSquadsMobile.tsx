// components/mobile/team/TeamSquadsMobile.tsx
"use client";
import React from "react";
import type { Team } from "@/lib/types/team";
import { TT, STATUS_COLORS } from "@/lib/types/team";

interface Props {
  teams: Team[];
  onOpen?: (t: Team) => void;
  onAssegna?: (t: Team) => void;
  onNuovaSquadra?: () => void;
}

export default function TeamSquadsMobile({ teams, onOpen, onAssegna, onNuovaSquadra }: Props) {
  return (
    <div style={{ padding: "12px 14px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: TT.text }}>Squadre</div>
        <button onClick={onNuovaSquadra} style={{
          background: TT.acc, color: "#fff", border: "none", padding: "6px 12px",
          borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 4,
        }}>+ Nuova squadra</button>
      </div>

      {teams.map(t => {
        const probl = t.problem_count > 0;
        const badge = probl ? `${t.problem_count} problema${t.problem_count > 1 ? "i" : ""}` : t.status_label;
        const badgeColor = probl ? STATUS_COLORS.problema.tag : STATUS_COLORS.attivo.tag;
        return (
          <div key={t.id} onClick={() => onOpen?.(t)} style={{
            background: TT.card, borderRadius: 16, padding: "12px 14px", marginBottom: 10,
            border: `1px solid ${TT.bdr}`, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(13,31,31,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: TT.text }}>{t.name}</div>
                <div style={{ fontSize: 11, color: TT.sub, marginTop: 2 }}>{t.members.join(", ")}</div>
                <div style={{ fontSize: 11, color: TT.text, fontWeight: 700, marginTop: 2 }}>{t.current_job || "—"}</div>
              </div>
              <span style={{
                background: probl ? STATUS_COLORS.problema.bgPastel : STATUS_COLORS.attivo.bgPastel,
                color: badgeColor, padding: "3px 8px", borderRadius: 999,
                fontSize: 10, fontWeight: 800, whiteSpace: "nowrap",
              }}>
                {probl && "● "}{badge}
              </span>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: TT.sub, fontWeight: 700, marginBottom: 4 }}>Avanzamento lavori</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: "rgba(13,31,31,0.06)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${t.progress}%`, height: "100%", background: TT.acc, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: TT.sub }}>{t.progress}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
