"use client";
// MASTRO TABLET v11 - Delega panel mobile + filtri fase preset
// 10 sezioni dei mobile riusate:
//   - commesse, agenda, clienti, contabilita, talk, ordini, settings (full panel)
//   - sopralluoghi, produzione, montaggi (CommessePanel con filterFase preset)
// 4 sezioni tablet finte ancora attive: magazzino, fiscale, team, ops
import * as React from "react";
import { TT, bodyStyle } from "./design-system";
import SidebarTablet from "./SidebarTablet";
import TopbarTablet from "./TopbarTablet";
import DashboardTablet from "./dashboard/DashboardTablet";

// ============ PANEL MOBILE (DATI REALI) ============
import CommessePanel from "../CommessePanel";
import AgendaPanel from "../AgendaPanel";
import ClientiPanel from "../ClientiPanel";
import ContabilitaPanel from "../ContabilitaPanel";
import MessaggiPanel from "../MessaggiPanel";
import MaterialiPanel from "../MaterialiPanel";
import SettingsPanel from "../SettingsPanel";

// ============ PANEL TABLET FINTI (RESTANO PER ORA) ============
import MagazzinoTablet from "./magazzino/MagazzinoTablet";
import FiscaleTablet from "./fiscale/FiscaleTablet";
import TeamTablet from "./team/TeamTablet";
import OpsTablet from "./ops/OpsTablet";

// Servizi
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

// Mappa sezione tablet -> tab MastroERP per sincronizzare context.tab
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
  ordini: "materiali",
  impostazioni: "settings",
};

// Mappa sezione -> filterFase da preselezionare in CommessePanel
const SECTION_TO_FASE: Record<string, string | null> = {
  commesse: null,            // tutte
  sopralluoghi: "sopralluogo",
  produzione: "produzione",
  montaggi: "posa",
};

export default function MastroTablet() {
  const { setTab, setFilterFase } = useMastro();
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

  // Sincronizza tab MastroERP + filterFase al cambio sezione
  React.useEffect(() => {
    const mappedTab = SECTION_TO_TAB[active];
    if (mappedTab && setTab) setTab(mappedTab);
    // Se la sezione richiede un filtro fase preset, applicalo
    if (active in SECTION_TO_FASE && setFilterFase) {
      const fase = SECTION_TO_FASE[active];
      setFilterFase(fase || "");
    }
  }, [active, setTab, setFilterFase]);

  const navigate = React.useCallback((sezione: string) => { setActive(sezione); }, []);
  const expand = React.useCallback(() => {}, []);
  const openCommessa = React.useCallback(() => { setActive("commesse"); }, []);
  const openCliente = React.useCallback(() => { setActive("clienti"); }, []);
  const openEntity = React.useCallback((tipo: EntityType, id: string) => {
    setActiveEntity({ tipo, id });
  }, []);
  const closeCommessa = React.useCallback(() => {}, []);

  const handleSidebarSelect = React.useCallback((s: string) => {
    setActive(s);
    setActiveEntity(null);
  }, []);

  const sidebarW = isCollapsed ? 88 : (mode === "lg" ? 280 : mode === "md" ? 240 : 220);

  // Sezioni delegate a panel mobile (no padding extra: hanno il loro)
  const isMobilePanel = ["commesse", "sopralluoghi", "produzione", "montaggi", "calendario", "clienti", "contabilita", "ai", "ordini", "impostazioni"].includes(active);
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
            {/* DASHBOARD: home tablet v9 */}
            {active === "dashboard" && <DashboardTablet />}

            {/* SEZIONI MOBILE RIUSATE (DATI REALI) */}
            {active === "commesse"     && <CommessePanel />}
            {active === "sopralluoghi" && <CommessePanel />}
            {active === "produzione"   && <CommessePanel />}
            {active === "montaggi"     && <CommessePanel />}
            {active === "calendario"   && <AgendaPanel />}
            {active === "clienti"      && <ClientiPanel />}
            {active === "contabilita"  && <ContabilitaPanel />}
            {active === "ai"           && <MessaggiPanel />}
            {active === "ordini"       && <MaterialiPanel onBack={() => setActive("dashboard")} />}
            {active === "impostazioni" && <SettingsPanel />}

            {/* SEZIONI TABLET FINTE (DA RISCRIVERE IN LOTTO SUCCESSIVO) */}
            {active === "magazzino"    && <MagazzinoTablet />}
            {active === "fiscale"      && <FiscaleTablet />}
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
