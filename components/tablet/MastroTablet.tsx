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
import MagazzinoTablet from "./magazzino/MagazzinoTablet";
import ClientiTablet from "./clienti/ClientiTablet";
import ContabilitaTablet from "./contabilita/ContabilitaTablet";
import FiscaleTablet from "./fiscale/FiscaleTablet";
import TeamTablet from "./team/TeamTablet";
import OpsTablet from "./ops/OpsTablet";
import AiMastroTablet from "./ai/AiMastroTablet";
import ImpostazioniTablet from "./impostazioni/ImpostazioniTablet";

export default function MastroTablet() {
  const [active, setActive] = React.useState<string>("dashboard");
  const [isPortrait, setIsPortrait] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsPortrait(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  const sidebarW = isPortrait ? TT.sidebarWCollapsed : TT.sidebarW;

  return (
    <div
      style={{
        ...bodyStyle,
        width: "100vw",
        height: "100vh",
        background: TT.bgGradient,
        display: "grid",
        gridTemplateColumns: `${sidebarW}px 1fr`,
        gridTemplateRows: `${TT.topbarH}px 1fr`,
        gridTemplateAreas: `
          "sidebar topbar"
          "sidebar main"
        `,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <SidebarTablet active={active} onSelect={setActive} collapsed={isPortrait} />
      <TopbarTablet greeting="Buongiorno, Fabio Cozza" notificationCount={3} compact={isPortrait} />

      <main style={{
        gridArea: "main",
        overflowY: "auto",
        padding: isPortrait ? "16px 18px 20px" : "20px 28px 24px",
        background: "transparent",
      }}>
        {active === "dashboard"     && <DashboardTablet />}
        {active === "commesse"      && <CommesseListaTablet />}
        {active === "calendario"    && <CalendarioTablet />}
        {active === "sopralluoghi"  && <SopralluoghiTablet />}
        {active === "produzione"    && <ProduzioneTablet />}
        {active === "montaggi"      && <MontaggiTablet />}
        {active === "ordini"        && <OrdiniFornitoriTablet />}
        {active === "magazzino"     && <MagazzinoTablet />}
        {active === "clienti"       && <ClientiTablet />}
        {active === "contabilita"   && <ContabilitaTablet />}
        {active === "fiscale"       && <FiscaleTablet />}
        {active === "team"          && <TeamTablet />}
        {active === "ops"           && <OpsTablet />}
        {active === "ai"            && <AiMastroTablet />}
        {active === "impostazioni"  && <ImpostazioniTablet />}
      </main>
    </div>
  );
}
