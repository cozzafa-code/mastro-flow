"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";

// =========================================================
// DashboardTablet - orchestratore Dashboard
// =========================================================
// STEP 1: solo placeholder per verificare che la route carica.
// STEP 2: KPI row (5 cards).
// STEP 3: Agenda + Scadenze + Produzione (3 panel).
// STEP 4: Commesse recenti + Team.
// STEP 5: Azioni rapide footer.
// =========================================================

export default function DashboardTablet() {
  return (
    <div>
      <div
        style={cardStyle({
          padding: "24px 28px",
          marginBottom: 14,
        })}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: TT.text1,
            letterSpacing: "-0.3px",
            marginBottom: 6,
          }}
        >
          Tablet Preview - Fondamenta caricate
        </div>
        <div style={{ fontSize: 13, color: TT.text2, lineHeight: 1.55 }}>
          Design system, AvatarGradient, MastroTablet shell, route{" "}
          <code
            style={{
              background: TT.bgSoft,
              padding: "1px 6px",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            /tablet-preview
          </code>{" "}
          attive. Procediamo con STEP 2: sidebar piena 15 voci + topbar.
        </div>
      </div>

      {/* Visual check token: una card per colore modulo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {[
          { label: "Teal", color: TT.teal[400], bg: TT.teal[50] },
          { label: "Orange", color: TT.orange[400], bg: TT.orange[50] },
          { label: "Green", color: TT.green[400], bg: TT.green[50] },
          { label: "Blue", color: TT.blue[400], bg: TT.blue[50] },
          { label: "Violet", color: TT.violet[400], bg: TT.violet[50] },
        ].map((c) => (
          <div
            key={c.label}
            style={cardStyle({
              padding: "14px 16px",
              background: c.bg,
              borderColor: TT.border,
            })}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: c.color,
                marginBottom: 8,
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 600, color: TT.text1 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 10, color: TT.text3, fontFamily: "monospace" }}>
              {c.color}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 11,
          color: TT.text3,
          textAlign: "center",
          marginTop: 18,
        }}
      >
        STEP 1 - {new Date().toISOString().slice(0, 10)} - se vedi questa schermata
        renderizzata correttamente le fondamenta sono OK
      </div>
    </div>
  );
}
