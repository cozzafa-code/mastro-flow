"use client";
import * as React from "react";
import { TT } from "../design-system";
import { useDashboard } from "../dashboard-context";
import KpiRowTablet from "./KpiRowTablet";
import AgendaPanelTablet from "./AgendaPanelTablet";
import ScadenzePanelTablet from "./ScadenzePanelTablet";
import ProduzionePanelTablet from "./ProduzionePanelTablet";
import CommesseRecentiPanelTablet from "./CommesseRecentiPanelTablet";
import TeamPanelTablet from "./TeamPanelTablet";
import AzioniRapidePanelTablet from "./AzioniRapidePanelTablet";

export default function DashboardTablet() {
  const { preset } = useDashboard();

  // Preset determina layout dashboard
  // - titolare: vista completa (tutti i blocchi)
  // - posatore: focus su agenda + commesse assegnate (no contabilita)
  // - segreteria: focus su scadenze + commesse + azioni (no produzione, no team)

  return (
    <div>
      {/* KPI ROW - sempre visibile, ma per posatore mostra solo 3 KPI rilevanti */}
      <KpiRowTablet />

      {/* RIGA 2: Agenda + Scadenze + Produzione */}
      <div style={{
        display: "grid",
        gridTemplateColumns: preset === "posatore" ? "1.4fr 1fr" : "1fr 1fr 1fr",
        gap: 12,
        marginBottom: 12,
      }}>
        <AgendaPanelTablet />
        {preset !== "posatore" && <ScadenzePanelTablet />}
        {preset !== "segreteria" && <ProduzionePanelTablet />}
      </div>

      {/* RIGA 3: Commesse + Team */}
      {preset !== "posatore" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: preset === "segreteria" ? "1fr" : "1.6fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}>
          <CommesseRecentiPanelTablet />
          {preset !== "segreteria" && <TeamPanelTablet />}
        </div>
      )}

      {/* RIGA 4: Azioni rapide - sempre visibile */}
      <AzioniRapidePanelTablet />
    </div>
  );
}
