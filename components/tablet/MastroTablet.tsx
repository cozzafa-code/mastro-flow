"use client";
// MASTRO TABLET v20
// FIX: filterFase = "tutte" per Commesse (default che mostra tutte)
// Per Sopralluoghi/Produzione/Montaggi resta la fase specifica
import * as React from "react";
import { TT, bodyStyle } from "./design-system";
import SidebarTablet from "./SidebarTablet";
import TopbarTablet from "./TopbarTablet";
import DashboardTablet from "./dashboard/DashboardTablet";

import CommessePanel from "../CommessePanel";
import AgendaPanel from "../AgendaPanel";
import ClientiPanel from "../ClientiPanel";
import ContabilitaPanel from "../ContabilitaPanel";
import MessaggiPanel from "../MessaggiPanel";
import SettingsPanel from "../SettingsPanel";

import MagazzinoTablet from "./magazzino/MagazzinoTablet";
import FiscaleTablet from "./fiscale/FiscaleTablet";
import OrdiniTablet from "./ordini/OrdiniTablet";

import TeamTablet from "./team/TeamTablet";
import OpsTablet from "./ops/OpsTablet";

import EntityDetailPanel from "./EntityDetailPanel";
import SideEffectsToaster from "./SideEffectsToaster";
import { EntityType } from "./dashboard-context";
import { RuoloProvider } from "./store";
import BannerRuolo from "./BannerRuolo";
import { DashboardProvider, Preset } from "./dashboard-context";
import { useMastro } from "../MastroContext";

const PRESET_KEY = "mastro_tablet_preset";
const COLLAPSE_KEY = "mastro_tablet_collapsed";
const BG = "#94A3B8";

function useViewport(): { w: number; mode: "sm" | "md" | "lg" } {
  const [size, setSize] = React.useState<{ w: number; mode: "sm" | "md" | "lg" }>({
    w: typeof window !== "undefined" ? window.innerWidth : 1280,
    mode: "lg",
  });
  React.useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      let mode: "sm" | "md" | "lg" = "lg";
      if (w < 1024) mode = "sm";
      else if (w < 1280) mode = "md";
      else mode = "lg";
      setSize({ w, mode });
    };
    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("orientationchange", calc);
    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("orientationchange", calc);
    };
  }, []);
  return size;
}

const SECTION_TO_TAB: Record<string, string> = {
  dashboard: "home",
  commesse: "commesse",
  sopralluoghi: "commesse",
  produzione: "commesse",
  montaggi: "commesse",
  calendario: "agenda",
  clienti: "clienti",
  contabilita: "contabilita",
  ai: "messaggi",
  impostazioni: "settings",
};

// FIX v20: "tutte" per Commesse (CommessePanel riga 794 usa "tutte" come default no-filtro)
const SECTION_TO_FASE: Record<string, string> = {
  commesse: "tutte",
  sopralluoghi: "sopralluogo",
  produzione: "produzione",
  montaggi: "posa",
};

export default function MastroTablet() {
  const ctx = useMastro();
  const { setTab, setFilterFase, setSelectedCM } = ctx as any;

  const [active, setActive] = React.useState<string>("dashboard");
  const [userCollapsed, setUserCollapsed] = React.useState(false);
  const [hasUserOverride, setHasUserOverride] = React.useState(false);
  const [preset, setPresetState] = React.useState<Preset>("titolare");
  const [activeEntity, setActiveEntity] = React.useState<{ tipo: EntityType; id: string } | null>(null);

  const { mode } = useViewport();
  const autoCollapsed = mode === "sm";
  const isCollapsed = hasUserOverride ? userCollapsed : autoCollapsed;

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COLLAPSE_KEY);
      if (saved !== null) {
        setUserCollapsed(saved === "1");
        setHasUserOverride(true);
      }
    } catch {}
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    const next = !isCollapsed;
    setUserCollapsed(next);
    setHasUserOverride(true);
    try { window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch {}
  }, [isCollapsed]);

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

  React.useEffect(() => {
    const mappedTab = SECTION_TO_TAB[active];
    if (mappedTab && setTab) setTab(mappedTab);
    if (active in SECTION_TO_FASE && setFilterFase) {
      setFilterFase(SECTION_TO_FASE[active]);
    }
  }, [active, setTab, setFilterFase]);

  const navigate = React.useCallback((sezione: string) => { setActive(sezione); }, []);
  const expand = React.useCallback(() => {}, []);
  const openCommessa = React.useCallback((id?: string) => {
    if (id && setSelectedCM) setSelectedCM(id);
    setActive("commesse");
  }, [setSelectedCM]);
  const openCliente = React.useCallback(() => { setActive("clienti"); }, []);
  const openEntity = React.useCallback((tipo: EntityType, id: string) => {
    setActiveEntity({ tipo, id });
  }, []);
  const closeCommessa = React.useCallback(() => {
    if (setSelectedCM) setSelectedCM(null);
  }, [setSelectedCM]);

  const handleSidebarSelect = React.useCallback((s: string) => {
    setActive(s);
    setActiveEntity(null);
  }, []);

  const sidebarW = isCollapsed ? 88 : (mode === "lg" ? 280 : mode === "md" ? 240 : 220);

  const isMobilePanel = ["commesse", "sopralluoghi", "produzione", "montaggi", "calendario", "clienti", "contabilita", "ai", "impostazioni"].includes(active);
  const mainPad = isMobilePanel ? 0 : (mode === "sm" ? "16px 18px 20px" : "20px 24px 24px");
  const mainBg = isMobilePanel ? "#94A3B8" : BG;

  const currentUserId = "op-walter";

  return (
    <RuoloProvider ruolo={preset} currentUserId={currentUserId}>
      <BannerRuolo presetRuolo={preset} setPresetRuolo={setPreset} />
      <DashboardProvider
        navigate={navigate}
        onNavigate={navigate}
        onExpand={expand}
        preset={preset}
        setPreset={setPreset}
        selectedCommessaId={null}
        openCommessa={openCommessa}
        openCliente={openCliente}
        openEntity={openEntity}
        closeCommessa={closeCommessa}
      >
        <div
          style={{
            ...bodyStyle,
            width: "100vw",
            height: "100vh",
            background: BG,
            display: "grid",
            gridTemplateColumns: `${sidebarW}px 1fr`,
            gridTemplateRows: `auto 1fr`,
            gridTemplateAreas: `
              "sidebar topbar"
              "sidebar main"
            `,
            overflow: "hidden",
            boxSizing: "border-box",
            transition: "grid-template-columns 0.25s ease",
          }}
        >
          <SidebarTablet
            active={active}
            onSelect={handleSidebarSelect}
            collapsed={isCollapsed}
            mode={mode}
          />
          <TopbarTablet
            notificationCount={3}
            collapsed={isCollapsed}
            onToggleSidebar={toggleCollapsed}
            mode={mode}
          />

          <main style={{ gridArea: "main", overflowY: "auto", overflowX: "hidden", padding: mainPad, background: mainBg }}>
            {active === "dashboard" && <DashboardTablet />}

            {active === "commesse"     && <CommessePanel />}
            {active === "sopralluoghi" && <CommessePanel />}
            {active === "produzione"   && <CommessePanel />}
            {active === "montaggi"     && <CommessePanel />}
            {active === "calendario"   && <AgendaPanel />}
            {active === "clienti"      && <ClientiPanel />}
            {active === "contabilita"  && <ContabilitaPanel />}
            {active === "ai"           && <MessaggiPanel />}
            {active === "impostazioni" && <SettingsPanel />}

            {active === "magazzino"    && <MagazzinoTablet />}
            {active === "fiscale"      && <FiscaleTablet />}
            {active === "ordini"       && <OrdiniTablet />}

            {active === "team"         && <TeamTablet />}
            {active === "ops"          && <OpsTablet />}
          </main>
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
