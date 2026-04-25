"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { useDashboard } from "../dashboard-context";
import CardHeader from "../CardHeader";
import AvatarGradient from "../AvatarGradient";

interface Membro {
  id: string;
  nome: string;
  ruolo: string;
  stato: "online" | "trasferta" | "offline";
  preset: "a" | "b" | "c" | "d" | "e";
}

const STATO_COLOR = {
  online: TT.green[500],
  trasferta: TT.amber[500],
  offline: TT.slate[400],
} as const;

const MEMBRI: Membro[] = [
  { id: "1", nome: "Walter Cozza",   ruolo: "Titolare",     stato: "online",    preset: "b" },
  { id: "2", nome: "Marco Esposito", ruolo: "Posatore",     stato: "trasferta", preset: "a" },
  { id: "3", nome: "Luca Bianchi",   ruolo: "Posatore",     stato: "online",    preset: "e" },
  { id: "4", nome: "Anna Verdi",     ruolo: "Segreteria",   stato: "online",    preset: "c" },
  { id: "5", nome: "Paolo Rossi",    ruolo: "Magazziniere", stato: "offline",   preset: "d" },
];

export default function TeamPanelTablet() {
  const { navigate, expand } = useDashboard();
  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="team"
        title="Team"
        tint="teal"
        seeAllLabel="Tutti"
        onSeeAll={() => navigate("team")}
        onExpand={() => expand("team")}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {MEMBRI.map((m) => (
          <div
            key={m.id}
            onClick={() => navigate("team")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "5px 6px",
              borderRadius: 7,
              cursor: "pointer",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = TT.bgSoft)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <AvatarGradient size={30} preset={m.preset} />
              <div style={{
                position: "absolute", bottom: -1, right: -1,
                width: 9, height: 9, borderRadius: "50%",
                background: STATO_COLOR[m.stato],
                border: "2px solid #fff",
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: TT.text1,
                letterSpacing: "-0.1px",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {m.nome}
              </div>
              <div style={{
                fontSize: 10, color: TT.text3, fontWeight: 600, marginTop: 1,
              }}>
                {m.ruolo}
              </div>
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700,
              color: STATO_COLOR[m.stato],
              letterSpacing: "0.3px", textTransform: "uppercase",
            }}>
              {m.stato === "online" ? "Online" : m.stato === "trasferta" ? "Trasferta" : "Offline"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
