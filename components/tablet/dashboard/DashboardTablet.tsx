"use client";
import * as React from "react";
import { TT } from "../design-system";
import KpiRowTablet from "./KpiRowTablet";
import AgendaPanelTablet from "./AgendaPanelTablet";
import ScadenzePanelTablet from "./ScadenzePanelTablet";
import ProduzionePanelTablet from "./ProduzionePanelTablet";
import CommesseRecentiPanelTablet from "./CommesseRecentiPanelTablet";
import TeamPanelTablet from "./TeamPanelTablet";

export default function DashboardTablet() {
  return (
    <div>
      <KpiRowTablet onCardClick={(id) => console.log("KPI click:", id)} />

      {/* ROW 2 - Agenda + Scadenze + Produzione */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <AgendaPanelTablet />
        <ScadenzePanelTablet />
        <ProduzionePanelTablet />
      </div>

      {/* ROW 3 - Commesse 2/3 + Team 1/3 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 18 }}>
        <CommesseRecentiPanelTablet />
        <TeamPanelTablet />
      </div>

      <div
        style={{
          padding: "26px 28px",
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
          STEP 5 OK - Row 3 caricata
        </div>
        Prossimo: Azioni rapide footer (6 bottoni).
      </div>
    </div>
  );
}
