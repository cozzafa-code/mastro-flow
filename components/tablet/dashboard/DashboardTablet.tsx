"use client";
import * as React from "react";
import { TT } from "../design-system";
import KpiRowTablet from "./KpiRowTablet";
import AgendaPanelTablet from "./AgendaPanelTablet";
import ScadenzePanelTablet from "./ScadenzePanelTablet";
import ProduzionePanelTablet from "./ProduzionePanelTablet";

export default function DashboardTablet() {
  return (
    <div>
      <KpiRowTablet onCardClick={(id) => console.log("KPI click:", id)} />

      {/* ROW 2 - Agenda + Scadenze + Produzione */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <AgendaPanelTablet />
        <ScadenzePanelTablet />
        <ProduzionePanelTablet />
      </div>

      <div
        style={{
          padding: "30px 28px",
          textAlign: "center",
          color: TT.text3,
          fontSize: 12,
          background: TT.surface,
          border: `1px solid ${TT.border}`,
          borderRadius: TT.rLg,
          boxShadow: TT.shadowSm,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: TT.text2, marginBottom: 4 }}>
          STEP 4 OK - Row 2 caricata
        </div>
        Prossimi: Commesse recenti + Team (row 3), Azioni rapide (footer).
      </div>
    </div>
  );
}
