"use client";
// MASTRO TABLET v12 - Conservativo
// SOLO delega CommessePanel (già verificato VERDE per commesse/sopralluoghi/produzione/montaggi)
// Magazzino e Fiscale = file tablet con dati reali Supabase
// Tutto il resto = *Tablet finti (da delegare 1 alla volta in commit successivi)
import * as React from "react";
import { TT, bodyStyle } from "./design-system";
import SidebarTablet from "./SidebarTablet";
import TopbarTablet from "./TopbarTablet";
import DashboardTablet from "./dashboard/DashboardTablet";

// Solo CommessePanel mobile riusato (test confermato verde)
import CommessePanel from "../CommessePanel";

// Custom tablet con dati reali Supabase
import MagazzinoTablet from "./magazzino/MagazzinoTablet";
import FiscaleTablet from "./fiscale/FiscaleTablet";

// Tablet finti (da delegare 1 alla volta, non toccare)
import CalendarioTablet from "./calendario/CalendarioTablet";
import SopralluoghiTablet from "./sopralluoghi/SopralluoghiTablet";
import ProduzioneTablet from "./produzione/ProduzioneTablet";
import MontaggiTablet from "./montaggi/MontaggiTablet";
import OrdiniFornitoriTablet from "./ordini/OrdiniFornitoriTablet";
import ClientiTablet from "./clienti/ClientiTablet";
import ContabilitaTablet from "./contabilita/ContabilitaTablet";
import TeamTablet from "./team/TeamTablet";
import OpsTablet from "./ops/OpsTablet";
import AiMastroTablet from "./ai/AiMastroTablet";
import ImpostazioniTablet from "./impostazioni/ImpostazioniTablet";

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

const SECTION_TO_TAB: Record<string, string> = {
  dashboard: "home",
  commesse: "commesse",
  sopralluoghi: "commesse",
  produzione: "commesse",
  montaggi: "commesse",
};

const SECTION_TO_FASE: Record<string, string | null> = {
  commesse: null,
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

  React.useEffect(() => {
    const mappedTab = SECTION_TO_TAB[active];
    if (mappedTab && setTab) setTab(mappedTab);
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

  // Sezioni che usano panel mobile (no padding extra)
  const isMobilePanel = ["commesse", "sopralluoghi", "produzione", "montaggi"].includes(active);
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

            {/* SEZIONI MOBILE RIUSATE (DATI REALI) - SOLO CommessePanel verificato */}
            {active === "commesse"     && <CommessePanel />}
            {active === "sopralluoghi" && <CommessePanel />}
            {active === "produzione"   && <CommessePanel />}
            {active === "montaggi"     && <CommessePanel />}

            {/* CUSTOM TABLET CON DATI REALI SUPABASE */}
            {active === "magazzino"    && <MagazzinoTablet />}
            {active === "fiscale"      && <FiscaleTablet />}

            {/* TABLET FINTI (DA DELEGARE 1 ALLA VOLTA) */}
            {active === "calendario"   && <CalendarioTablet />}
            {active === "ordini"       && <OrdiniFornitoriTablet />}
            {active === "clienti"      && <ClientiTablet />}
            {active === "contabilita"  && <ContabilitaTablet />}
            {active === "team"         && <TeamTablet />}
            {active === "ops"          && <OpsTablet />}
            {active === "ai"           && <AiMastroTablet />}
            {active === "impostazioni" && <ImpostazioniTablet />}
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
