"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";
import AvatarGradient from "../AvatarGradient";

type Status = "online" | "trasferta" | "offline";

interface Membro {
  id: string;
  nome: string;
  ruolo: string;
  status: Status;
  preset: "a" | "b" | "c" | "d" | "e";
}

const STATUS: Record<Status, { color: string; label: string }> = {
  online:    { color: TT.green[500],  label: "Online"    },
  trasferta: { color: TT.amber[500],  label: "Trasferta" },
  offline:   { color: TT.slate[400],  label: "Offline"   },
};

const DATA: Membro[] = [
  { id: "1", nome: "Walter Cozza",    ruolo: "Titolare",     status: "online",    preset: "b" },
  { id: "2", nome: "Marco Esposito",  ruolo: "Posatore",     status: "trasferta", preset: "a" },
  { id: "3", nome: "Luca Bianchi",    ruolo: "Posatore",     status: "online",    preset: "e" },
  { id: "4", nome: "Anna Verdi",      ruolo: "Segreteria",   status: "online",    preset: "c" },
  { id: "5", nome: "Paolo Rossi",     ruolo: "Magazziniere", status: "offline",   preset: "d" },
];

export default function TeamPanelTablet() {
  return (
    <div style={cardStyle({ padding: "16px 18px", display: "flex", flexDirection: "column" })}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: TT.teal[400], display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="team" size={14} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
            Team
          </div>
        </div>
        <div style={{ fontSize: 11, color: TT.teal[500], fontWeight: 600, cursor: "pointer" }}>
          Tutti &rsaquo;
        </div>
      </div>

      {/* Lista membri */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DATA.map((m) => {
          const s = STATUS[m.status];
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 4px",
              }}
            >
              {/* Avatar con dot status sovrapposto */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <AvatarGradient size={36} preset={m.preset} />
                <div
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -1,
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: s.color,
                    border: "2px solid #fff",
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TT.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.nome}
                </div>
                <div style={{ fontSize: 11, color: TT.text3, marginTop: 1 }}>
                  {m.ruolo}
                </div>
              </div>

              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: s.color,
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
