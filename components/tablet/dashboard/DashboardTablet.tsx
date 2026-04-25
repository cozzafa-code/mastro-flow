"use client";
import * as React from "react";
import KpiRowTablet from "./KpiRowTablet";
import AgendaPanelTablet from "./AgendaPanelTablet";
import ScadenzePanelTablet from "./ScadenzePanelTablet";
import ProduzionePanelTablet from "./ProduzionePanelTablet";
import CommesseRecentiPanelTablet from "./CommesseRecentiPanelTablet";
import TeamPanelTablet from "./TeamPanelTablet";
import AzioniRapidePanelTablet from "./AzioniRapidePanelTablet";

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
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
        <CommesseRecentiPanelTablet />
        <TeamPanelTablet />
      </div>

      {/* FOOTER - Azioni rapide */}
      <AzioniRapidePanelTablet onAction={(id) => console.log("Action:", id)} />
    </div>
  );
}
