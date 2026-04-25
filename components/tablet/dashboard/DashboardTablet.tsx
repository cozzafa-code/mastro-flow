"use client";
import * as React from "react";
import { TT } from "../design-system";
import KpiRowTablet from "./KpiRowTablet";

// =========================================================
// DashboardTablet - orchestratore Dashboard tablet
// =========================================================
// STEP 3: KPI row 5 cards.
// Prossimi step: Agenda + Scadenze + Produzione (row 2),
//                Commesse recenti + Team (row 3),
//                Azioni rapide (footer).
// =========================================================

export default function DashboardTablet() {
  return (
    <div>
      <KpiRowTablet
        onCardClick={(id) => console.log("KPI click:", id)}
      />

      <div
        style={{
          padding: "40px 28px",
          textAlign: "center",
          color: TT.text3,
          fontSize: 13,
          background: TT.surface,
          border: `1px solid ${TT.border}`,
          borderRadius: TT.rLg,
          boxShadow: TT.shadowSm,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: TT.text2, marginBottom: 6 }}>
          STEP 3 OK - KPI row caricata
        </div>
        Prossimi step: Agenda + Scadenze + Produzione (row 2),
        Commesse recenti + Team (row 3), Azioni rapide (footer).
      </div>
    </div>
  );
}
