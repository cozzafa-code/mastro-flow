"use client";
import * as React from "react";
import { TT, bodyStyle } from "./design-system";
import SidebarTablet from "./SidebarTablet";
import TopbarTablet from "./TopbarTablet";
import DashboardTablet from "./dashboard/DashboardTablet";
import CommesseListaTablet from "./commesse/CommesseListaTablet";
import CommessaDettaglioTablet from "./commesse/CommessaDettaglioTablet";
import ClienteDettaglioTablet from "./clienti/ClienteDettaglioTablet";
import EntityDetailPanel from "./EntityDetailPanel";
import SideEffectsToaster from "./SideEffectsToaster";
import { EntityType } from "./dashboard-context";
import { RuoloProvider } from "./store";
import BannerRuolo from "./BannerRuolo";
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
import { DashboardProvider, Preset } from "./dashboard-context";
import ExpandModal from "./ExpandModal";
import BackButton from "./BackButton";
import { useMastro } from "../MastroContext";

const PRESET_KEY = "mastro_tablet_preset";

export default function MastroTablet() {
  const [active, setActive] = React.useState<string>("dashboard");
  // SPRINT 2 BRIDGE: sincronizza sidebar fliwoX con tab ERP
  // Quando user clicca una sezione che ha equivalente ERP, settiamo
  // tab ERP cosi MastroTabletWrapper renderizza il pannello vero.
  const erpCtx = (() => {
    try { return useMastro(); } catch { return null; }
  })();
  const TABLET_TO_ERP_TAB = {
    commesse: "commesse",
    clienti: "clienti",
    sopralluoghi: "sopralluoghi",
    calendario: "agenda",
    contabilita: "contabilita",
    montaggi: "montaggi_cal",
    impostazioni: "settings",
  };
  React.useEffect(() => {
    if (!erpCtx) return;
    const erpTab = TABLET_TO_ERP_TAB[active];
    if (erpTab && erpCtx.tab !== erpTab && erpCtx.setTab) {
      erpCtx.setTab(erpTab);
    }
  }, [active, erpCtx]);

  const [isPortrait, setIsPortrait] = React.useState(false);
  const [preset, setPresetState] = React.useState<Preset>("titolare");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [selectedCommessaId, setSelectedCommessaId] = React.useState<string | null>(null);
  const [activeClienteId, setActiveClienteId] = React.useState<string | null>(null);
  const [activeEntity, setActiveEntity] = React.useState<{ tipo: EntityType; id: string } | null>(null);

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

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PRESET_KEY) as Preset | null;
      if (saved && ["titolare", "posatore", "segreteria"].includes(saved)) {
        setPresetState(saved);
      }
    } catch {}
  }, []);

  const setPreset = React.useCallback((p: Preset) => {
    setPresetState(p);
    try { window.localStorage.setItem(PRESET_KEY, p); } catch {}
  }, []);

  const openCommessa = React.useCallback((id: string) => {
    setSelectedCommessaId(id);
    setActiveClienteId(null);
    setActiveEntity(null);
    setActive("commesse");
    setExpanded(null);
  }, []);

  const openCliente = React.useCallback((id: string) => {
    setActiveClienteId(id);
    setSelectedCommessaId(null);
    setActiveEntity(null);
    setActive("clienti");
    setExpanded(null);
  }, []);

  const openEntity = React.useCallback((tipo: EntityType, id: string) => {
    setActiveEntity({ tipo, id });
  }, []);

  const closeCommessa = React.useCallback(() => {
    setSelectedCommessaId(null);
  }, []);

  const navigate = React.useCallback((sezione: string, params?: any) => {
    if (params?.commessaId) {
      openCommessa(params.commessaId);
      return;
    }
    setActive(sezione);
    setSelectedCommessaId(null);
    setActiveClienteId(null);
    setActiveEntity(null);
    setExpanded(null);
  }, [openCommessa]);

  const expand = React.useCallback((blocco: string) => {
    setExpanded(blocco);
  }, []);

  const closeExpand = React.useCallback(() => setExpanded(null), []);

  const goBack = React.useCallback(() => {
    if (selectedCommessaId) {
      // Se sono dentro un dettaglio commessa, prima torno alla lista
      setSelectedCommessaId(null);
      return;
    }
    navigate("dashboard");
  }, [selectedCommessaId, navigate]);

  const sidebarW = isPortrait ? TT.sidebarWCollapsed : TT.sidebarW;
  const isDashboard = active === "dashboard" && !selectedCommessaId;

  // Sidebar select: se cambio sezione, chiudo il dettaglio
  const handleSidebarSelect = React.useCallback((s: string) => {
    setActive(s);
    setSelectedCommessaId(null);
    setActiveClienteId(null);
    setActiveEntity(null);
    setExpanded(null);
  }, []);

  const currentUserId = "op-walter"; // posatore corrente quando preset = posatore

  return (
    <RuoloProvider ruolo={preset} currentUserId={currentUserId}>
      <BannerRuolo presetRuolo={preset} setPresetRuolo={setPreset} />
      <DashboardProvider
      navigate={navigate}
      onNavigate={navigate}
      onExpand={expand}
      preset={preset}
      setPreset={setPreset}
      selectedCommessaId={selectedCommessaId}
      openCommessa={openCommessa}
      openCliente={openCliente}
      openEntity={openEntity}
      closeCommessa={closeCommessa}
    >
      <div
        style={{
          ...bodyStyle,
          width: "100vw", height: "100vh",
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
        <SidebarTablet active={active} onSelect={handleSidebarSelect} collapsed={isPortrait} />
        <TopbarTablet greeting="Buongiorno, Fabio Cozza" notificationCount={3} compact={isPortrait} />

        <main style={{
          gridArea: "main",
          overflowY: "auto",
          padding: isPortrait ? "16px 18px 20px" : "20px 28px 24px",
          background: "transparent",
        }}>
          {!isDashboard && (
            <BackButton active={active} onBack={goBack} />
          )}

          {/* DETTAGLIO COMMESSA: prevale su tutto */}
          {selectedCommessaId ? (
            <CommessaDettaglioTablet commessaId={selectedCommessaId} />
          ) : (
            <>
              {active === "dashboard"     && <DashboardTablet />}
              {active === "commesse"      && <CommesseListaTablet />}
              {active === "calendario"    && <CalendarioTablet />}
              {active === "sopralluoghi"  && <SopralluoghiTablet />}
              {active === "produzione"    && <ProduzioneTablet />}
              {active === "montaggi"      && <MontaggiTablet />}
              {active === "ordini"        && <OrdiniFornitoriTablet />}
              {active === "magazzino"     && <MagazzinoTablet />}
              {active === "clienti"       && (activeClienteId ? <ClienteDettaglioTablet clienteId={activeClienteId} onBack={() => setActiveClienteId(null)} /> : <ClientiTablet />)}
              {active === "contabilita"   && <ContabilitaTablet />}
              {active === "fiscale"       && <FiscaleTablet />}
              {active === "team"          && <TeamTablet />}
              {active === "ops"           && <OpsTablet />}
              {active === "ai"            && <AiMastroTablet />}
              {active === "impostazioni"  && <ImpostazioniTablet />}
            </>
          )}
        </main>

        <ExpandModal open={expanded === "agenda"} onClose={closeExpand} title="Agenda" subtitle="" icon="calendario" tint="violet">
          <div style={{ padding: 12, color: TT.text2 }}>Vista estesa.</div>
        </ExpandModal>
        <ExpandModal open={expanded === "scadenze"} onClose={closeExpand} title="Scadenze" subtitle="" icon="bell" tint="amber">
          <div style={{ padding: 12, color: TT.text2 }}>Vista estesa.</div>
        </ExpandModal>
        <ExpandModal open={expanded === "produzione"} onClose={closeExpand} title="Produzione" subtitle="" icon="produzione" tint="blue">
          <div style={{ padding: 12, color: TT.text2 }}>Vista estesa.</div>
        </ExpandModal>
        <ExpandModal open={expanded === "commesse"} onClose={closeExpand} title="Commesse" subtitle="" icon="commesse" tint="orange">
          <div style={{ padding: 12, color: TT.text2 }}>Vista estesa.</div>
        </ExpandModal>
        <ExpandModal open={expanded === "team"} onClose={closeExpand} title="Team" subtitle="" icon="team" tint="teal">
          <div style={{ padding: 12, color: TT.text2 }}>Vista estesa.</div>
        </ExpandModal>
      </div>
      <SideEffectsToaster />
      <EntityDetailPanel
        tipo={activeEntity?.tipo || null}
        id={activeEntity?.id || null}
        onClose={() => setActiveEntity(null)}
        onOpenCommessa={openCommessa}
        onOpenCliente={openCliente}
      />
      </DashboardProvider>
    </RuoloProvider>
  );
}
