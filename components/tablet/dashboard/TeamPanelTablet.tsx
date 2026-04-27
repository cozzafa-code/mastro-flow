"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { useDashboard } from "../dashboard-context";
import { useMastroData } from "../store";
import CardHeader from "../CardHeader";
import AvatarGradient from "../AvatarGradient";

const STATO_COLOR = {
  online: TT.green[500],
  trasferta: TT.amber[500],
  ferie: TT.blue[500],
  offline: TT.slate[400],
} as const;

const RUOLO_LABEL: Record<string, string> = {
  titolare: "Titolare",
  posatore: "Posatore",
  segreteria: "Segreteria",
  magazziniere: "Magazziniere",
  agente: "Agente",
  produzione: "Produzione",
};

export default function TeamPanelTablet() {
  const { navigate } = useDashboard();
  const data = useMastroData();
  const membri = data.getOperatori().slice(0, 5);

  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="team"
        title="Team"
        tint="teal"
        seeAllLabel="Tutti"
        onSeeAll={() => navigate("team")}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {membri.map((m) => (
          <div key={m.id}
            onClick={() => navigate("team")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "5px 6px", borderRadius: 7,
              cursor: "pointer", transition: "background 0.1s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = TT.bgSoft)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <AvatarGradient size={30} preset={m.preset} />
              <div style={{
                position: "absolute", bottom: -1, right: -1,
                width: 9, height: 9, borderRadius: "50%",
                background: STATO_COLOR[m.status],
                border: "2px solid #fff",
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: TT.text1,
                letterSpacing: "-0.1px",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {m.nome} {m.cognome}
              </div>
              <div style={{
                fontSize: 10, color: TT.text3, fontWeight: 600, marginTop: 1,
              }}>
                {RUOLO_LABEL[m.ruolo] || m.ruolo}
              </div>
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700,
              color: STATO_COLOR[m.status],
              letterSpacing: "0.3px", textTransform: "uppercase",
            }}>
              {m.status === "online" ? "Online" : m.status === "trasferta" ? "Trasferta" : m.status === "ferie" ? "Ferie" : "Offline"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
