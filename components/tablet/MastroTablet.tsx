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
import { DashboardProvider, Preset } from "./dashboard-context";
import ExpandModal from "./ExpandModal";

// Render espansione: viste full-list dei blocchi dashboard
import CommesseListaTablet_Embedded from "./commesse/CommesseListaTablet";

const PRESET_KEY = "mastro_tablet_preset";

export default function MastroTablet() {
  const [active, setActive] = React.useState<string>("dashboard");
  const [isPortrait, setIsPortrait] = React.useState(false);
  const [preset, setPresetState] = React.useState<Preset>("titolare");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  // Resize listener
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

  // Carica preset da localStorage
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
    try {
      window.localStorage.setItem(PRESET_KEY, p);
    } catch {}
  }, []);

  const navigate = React.useCallback((sezione: string, _params?: any) => {
    setActive(sezione);
    setExpanded(null);
  }, []);

  const expand = React.useCallback((blocco: string) => {
    setExpanded(blocco);
  }, []);

  const closeExpand = React.useCallback(() => setExpanded(null), []);

  const sidebarW = isPortrait ? TT.sidebarWCollapsed : TT.sidebarW;

  return (
    <DashboardProvider
      onNavigate={navigate}
      onExpand={expand}
      preset={preset}
      setPreset={setPreset}
    >
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

        {/* Modali espansione blocchi dashboard */}
        <ExpandModal
          open={expanded === "agenda"}
          onClose={closeExpand}
          title="Agenda di oggi"
          subtitle="Tutti gli eventi programmati per oggi"
          icon="calendario"
          tint="violet"
        >
          <ExpandedAgenda onNavigate={navigate} />
        </ExpandModal>

        <ExpandModal
          open={expanded === "scadenze"}
          onClose={closeExpand}
          title="Scadenze prossime"
          subtitle="Pagamenti, fatture e dichiarazioni in scadenza"
          icon="bell"
          tint="amber"
        >
          <ExpandedScadenze onNavigate={navigate} />
        </ExpandModal>

        <ExpandModal
          open={expanded === "produzione"}
          onClose={closeExpand}
          title="Produzione in corso"
          subtitle="Stato di tutte le commesse in lavorazione"
          icon="produzione"
          tint="blue"
        >
          <ExpandedProduzione onNavigate={navigate} />
        </ExpandModal>

        <ExpandModal
          open={expanded === "commesse"}
          onClose={closeExpand}
          title="Commesse recenti"
          subtitle="Ultime 20 commesse aperte"
          icon="commesse"
          tint="orange"
          width={1080}
        >
          <ExpandedCommesse onNavigate={navigate} />
        </ExpandModal>

        <ExpandModal
          open={expanded === "team"}
          onClose={closeExpand}
          title="Team"
          subtitle="Tutti gli operatori e il loro stato"
          icon="team"
          tint="teal"
        >
          <ExpandedTeam onNavigate={navigate} />
        </ExpandModal>
      </div>
    </DashboardProvider>
  );
}

// ============================================================
// EXPANDED VIEWS - liste piu' complete dei blocchi
// ============================================================

function ExpandedAgenda({ onNavigate }: { onNavigate: (s: string) => void }) {
  const items = [
    { ora: "09:00", titolo: "Sopralluogo Bianchi",   indirizzo: "Via Roma 12, Cosenza",  tipo: "sopralluogo", tint: TT.red    },
    { ora: "10:30", titolo: "Chiamata cliente Rossi",indirizzo: "Telefonica",             tipo: "admin",       tint: TT.violet },
    { ora: "11:30", titolo: "Riunione produzione",    indirizzo: "Sala riunioni",         tipo: "admin",       tint: TT.violet },
    { ora: "12:30", titolo: "Pranzo + pausa",         indirizzo: "",                      tipo: "admin",       tint: TT.slate  },
    { ora: "14:30", titolo: "Montaggio Verdi",        indirizzo: "Via Garibaldi 45",      tipo: "montaggio",   tint: TT.green  },
    { ora: "16:00", titolo: "Consegna fornitore",     indirizzo: "Schuco - magazzino",   tipo: "produzione",  tint: TT.blue   },
    { ora: "17:30", titolo: "Chiusura giornata",      indirizzo: "Briefing finale",       tipo: "admin",       tint: TT.violet },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((i, idx) => (
        <div
          key={idx}
          onClick={() => onNavigate("calendario")}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 16px",
            background: i.tint[50],
            border: `1px solid ${i.tint[100]}`,
            borderRadius: TT.rMd,
            cursor: "pointer",
            transition: "transform 0.12s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0)")}
        >
          <div style={{
            fontSize: 14, fontWeight: 800, color: i.tint[600],
            fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px",
            minWidth: 50,
          }}>
            {i.ora}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.15px" }}>
              {i.titolo}
            </div>
            {i.indirizzo && (
              <div style={{ fontSize: 11, color: TT.text3, marginTop: 2 }}>
                {i.indirizzo}
              </div>
            )}
          </div>
          <span style={{
            padding: "2px 8px",
            background: i.tint[100], color: i.tint[600],
            borderRadius: 999,
            fontSize: 9, fontWeight: 700,
            letterSpacing: "0.4px", textTransform: "uppercase",
          }}>
            {i.tipo}
          </span>
        </div>
      ))}
      <button
        onClick={() => onNavigate("calendario")}
        style={{
          marginTop: 8,
          padding: "10px 14px",
          background: TT.violet[400],
          color: "#fff",
          border: "none",
          borderRadius: TT.rMd,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.violet[200]}`,
        }}
      >
        Apri Calendario completo &rsaquo;
      </button>
    </div>
  );
}

function ExpandedScadenze({ onNavigate }: { onNavigate: (s: string) => void }) {
  const items = [
    { ord: 1, titolo: "F24 Aprile",            stato: "Scaduta da 2gg", importo: "1.240",  tint: TT.red    },
    { ord: 2, titolo: "Fatt. 2026/047 Bianchi", stato: "Scade oggi",     importo: "3.450",  tint: TT.red    },
    { ord: 3, titolo: "INPS contributi",        stato: "Tra 3 giorni",   importo: "980",   tint: TT.amber  },
    { ord: 4, titolo: "Fatt. 2026/051 Verdi",   stato: "Tra 7 giorni",   importo: "2.180", tint: TT.amber  },
    { ord: 5, titolo: "IVA trimestre",          stato: "Tra 12 giorni",  importo: "5.430", tint: TT.blue   },
    { ord: 6, titolo: "Fatt. 2026/048 Greco",   stato: "Tra 14 giorni",  importo: "780",   tint: TT.blue   },
    { ord: 7, titolo: "Affitto magazzino",      stato: "Tra 28 giorni",  importo: "650",   tint: TT.slate  },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((i) => (
        <div
          key={i.ord}
          onClick={() => onNavigate("contabilita")}
          style={{
            display: "flex", alignItems: "center",
            padding: "12px 16px",
            background: i.tint[50],
            border: `1px solid ${i.tint[100]}`,
            borderRadius: TT.rMd,
            cursor: "pointer",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.15px" }}>
              {i.titolo}
            </div>
            <div style={{ fontSize: 11, color: i.tint[600], fontWeight: 600, marginTop: 2 }}>
              {i.stato}
            </div>
          </div>
          <div style={{
            fontSize: 14, fontWeight: 800, color: i.tint[600],
            fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px",
          }}>
            € {i.importo}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpandedProduzione({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        <StatCard label="Completate" value="12" tint={TT.green} />
        <StatCard label="In lavorazione" value="6" tint={TT.amber} />
        <StatCard label="Da iniziare" value="4" tint={TT.blue} />
      </div>
      <button
        onClick={() => onNavigate("produzione")}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: TT.blue[400],
          color: "#fff",
          border: "none",
          borderRadius: TT.rMd,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.blue[200]}`,
        }}
      >
        Apri Kanban Produzione &rsaquo;
      </button>
    </div>
  );
}

function ExpandedCommesse({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: TT.text2, marginBottom: 14, lineHeight: 1.5 }}>
        Vista compatta. Per tutti i filtri, ricerca e azioni avanzate apri la lista completa.
      </div>
      <button
        onClick={() => onNavigate("commesse")}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: TT.orange[400],
          color: "#fff",
          border: "none",
          borderRadius: TT.rMd,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.orange[200]}`,
        }}
      >
        Apri lista Commesse completa &rsaquo;
      </button>
    </div>
  );
}

function ExpandedTeam({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div>
      <button
        onClick={() => onNavigate("team")}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: TT.teal[400],
          color: "#fff",
          border: "none",
          borderRadius: TT.rMd,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.teal[200]}`,
        }}
      >
        Apri sezione Team completa &rsaquo;
      </button>
    </div>
  );
}

function StatCard({ label, value, tint }: { label: string; value: string; tint: any }) {
  return (
    <div style={{
      padding: "12px 14px",
      background: tint[50],
      border: `1px solid ${tint[100]}`,
      borderRadius: TT.rMd,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: tint[600], letterSpacing: "0.4px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: tint[600], letterSpacing: "-0.6px", lineHeight: 1.1, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}
