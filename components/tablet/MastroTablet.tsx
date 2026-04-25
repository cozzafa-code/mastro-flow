"use client";
import * as React from "react";
import { TT, bodyStyle } from "./design-system";
import SidebarTablet from "./SidebarTablet";
import TopbarTablet from "./TopbarTablet";
import DashboardTablet from "./dashboard/DashboardTablet";
import CommesseListaTablet from "./commesse/CommesseListaTablet";
import CalendarioTablet from "./calendario/CalendarioTablet";
import SopralluoghiTablet from "./sopralluoghi/SopralluoghiTablet";
import ProduzioneTablet from "./produzione/ProduzioneTablet";
import MontaggiTablet from "./montaggi/MontaggiTablet";
import OrdiniFornitoriTablet from "./ordini/OrdiniFornitoriTablet";

export default function MastroTablet() {
  const [active, setActive] = React.useState<string>("dashboard");

  return (
    <div
      style={{
        ...bodyStyle,
        width: "100%",
        minHeight: "100vh",
        background: TT.bgSoft,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: TT.contentMaxW,
          maxWidth: "100%",
          height: 800,
          background: TT.bg,
          borderRadius: TT.rLg,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: `${TT.sidebarW}px 1fr`,
          gridTemplateRows: `${TT.topbarH}px 1fr`,
          gridTemplateAreas: `
            "sidebar topbar"
            "sidebar main"
          `,
          boxShadow: TT.shadowLg,
          border: `1px solid ${TT.border}`,
        }}
      >
        <SidebarTablet active={active} onSelect={setActive} />
        <TopbarTablet greeting="Buongiorno, Fabio Cozza" notificationCount={3} />

        <main style={{ gridArea: "main", overflowY: "auto", padding: "18px 24px 22px" }}>
          {active === "dashboard"     && <DashboardTablet />}
          {active === "commesse"      && <CommesseListaTablet />}
          {active === "calendario"    && <CalendarioTablet />}
          {active === "sopralluoghi"  && <SopralluoghiTablet />}
          {active === "produzione"    && <ProduzioneTablet />}
          {active === "montaggi"      && <MontaggiTablet />}
          {active === "ordini"        && <OrdiniFornitoriTablet />}
          {!["dashboard","commesse","calendario","sopralluoghi","produzione","montaggi","ordini"].includes(active) && (
            <div style={{ padding: "40px 28px", textAlign: "center", color: TT.text3, fontSize: 14 }}>
              Sezione &quot;{active}&quot; in arrivo nei prossimi step.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
