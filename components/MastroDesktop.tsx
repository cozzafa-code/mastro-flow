"use client";
// @ts-nocheck
// MASTRO ERP — MastroDesktop v3
// Layout desktop nativo: sidebar + content area multi-pannello
// Tutti i moduli reali collegati al MastroContext

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, Ico, ICO, I } from "./mastro-constants";
import HomePanel from "./HomePanel";
import CommessePanel from "./CommessePanel";
import AgendaPanel from "./AgendaPanel";
import MessaggiPanel from "./MessaggiPanel";
import ClientiPanel from "./ClientiPanel";
import ContabilitaPanel from "./ContabilitaPanel";
import SettingsPanel from "./SettingsPanel";
import MontaggiCalendar from "./MontaggiCalendar";

const TEAL = "#1A9E73";
const DARK = "#1A1A1C";

const NAV_GROUPS = [
  {
    label: "Lavoro",
    items: [
      { key: "home",        ico: "home",      label: "Dashboard" },
      { key: "commesse",    ico: "folder",    label: "Commesse" },
      { key: "agenda",      ico: "calendar",  label: "Agenda" },
      { key: "montaggi",    ico: "wrench",    label: "Montaggi" },
    ]
  },
  {
    label: "Gestione",
    items: [
      { key: "clienti",     ico: "users",     label: "Clienti" },
      { key: "messaggi",    ico: "inbox",     label: "Messaggi" },
      { key: "contabilita", ico: "wallet",    label: "Contabilità" },
    ]
  },
  {
    label: "Moduli",
    items: [
      { key: "cnc",         ico: "cpu",       label: "CNC", badge: "Presto" },
      { key: "enea",        ico: "shield",    label: "ENEA", badge: "Presto" },
      { key: "leads",       ico: "zap",       label: "TROVA CLIENTI", badge: "Presto" },
      { key: "rete",        ico: "globe",     label: "RETE Agenti", badge: "Presto" },
    ]
  },
  {
    label: "Sistema",
    items: [
      { key: "settings",    ico: "settings",  label: "Impostazioni" },
    ]
  },
];

export default function MastroDesktop() {
  const ctx = useMastro();
  const { T, cantieri, tasks, fattureDB, montaggiDB, ordiniFornDB,
    aziendaInfo, msgs, setTab, tab, giorniFermaCM, sogliaDays,
    setSelectedCM, setFilterFase } = ctx;

  const [collapsed, setCollapsed] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const sw = collapsed ? 56 : 220;

  const activeNav = tab || "home";
  const unreadMsgs = (msgs || []).filter(m => !m.letto).length;
  const ferme = (cantieri || []).filter(c => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura").length;
  const taskOpen = (tasks || []).filter(t => !t.done).length;
  const fattureScad = (fattureDB || []).filter(f => !f.pagata && f.scadenza < new Date().toISOString().split("T")[0]).length;

  function navTo(key: string) {
    const map: Record<string, string> = {
      home: "home", commesse: "commesse", agenda: "agenda",
      montaggi: "montaggi_cal", clienti: "clienti", messaggi: "messaggi",
      contabilita: "contabilita", settings: "settings",
    };
    if (map[key]) setTab(map[key]);
    else setTab(key);
  }

  function getBadge(key: string) {
    if (key === "messaggi" && unreadMsgs > 0) return unreadMsgs;
    if (key === "commesse" && ferme > 0) return ferme;
    if (key === "contabilita" && fattureScad > 0) return fattureScad;
    return 0;
  }

  function renderPlaceholder(label: string, desc: string, icon: string) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: TEAL + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <I d={ICO[icon] || ICO.zap} s={32} c={TEAL} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{label}</div>
        <div style={{ fontSize: 14, color: T.sub, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>{desc}</div>
        <div style={{ padding: "8px 18px", borderRadius: 100, background: TEAL + "15", fontSize: 12, fontWeight: 700, color: TEAL }}>In arrivo</div>
      </div>
    );
  }

  function renderContent() {
    switch (activeNav) {
      case "home":        return <HomePanel />;
      case "commesse":    return <CommessePanel />;
      case "agenda":      return <AgendaPanel />;
      case "montaggi_cal":
      case "montaggi":    return <MontaggiCalendar />;
      case "clienti":     return <ClientiPanel />;
      case "messaggi":    return <MessaggiPanel />;
      case "contabilita": return <ContabilitaPanel />;
      case "settings":    return <SettingsPanel />;
      case "cnc":         return renderPlaceholder("Modulo CNC", "Genera i file DXF per le tue macchine CNC direttamente dalle commesse. Importa taglie, ottimizza i pannelli, zero errori manuali.", "cpu");
      case "enea":        return renderPlaceholder("Modulo ENEA", "Pratiche Ecobonus e detrazioni fiscali automatizzate. CAM 2026, U-value per zona climatica, report ENEA in un click.", "shield");
      case "leads":       return renderPlaceholder("TROVA CLIENTI", "Intercetta richieste da Habitissimo, Instapro e Subito nella tua zona. Lead qualificati direttamente nelle commesse MASTRO.", "zap");
      case "rete":        return renderPlaceholder("RETE Agenti", "Rete di agenti commerciali con app dedicata. Ogni agente vede i suoi preventivi, i suoi clienti, le sue provvigioni.", "globe");
      default:            return <HomePanel />;
    }
  }

  const currentLabel = NAV_GROUPS.flatMap(g => g.items).find(n => n.key === activeNav || (activeNav === "montaggi_cal" && n.key === "montaggi"))?.label || "MASTRO";

  // KPI bar sopra il content
  const KPI = [
    { label: "Commesse attive", val: (cantieri||[]).filter(c => c.fase !== "chiusura").length, color: TEAL, icon: "folder" },
    { label: "Commesse ferme", val: ferme, color: ferme > 0 ? "#DC4444" : TEAL, icon: "alertTriangle" },
    { label: "Task aperti", val: taskOpen, color: taskOpen > 0 ? "#E8A020" : TEAL, icon: "checkSquare" },
    { label: "Fatture scadute", val: fattureScad, color: fattureScad > 0 ? "#DC4444" : TEAL, icon: "wallet" },
    { label: "Messaggi non letti", val: unreadMsgs, color: unreadMsgs > 0 ? "#3B7FE0" : TEAL, icon: "inbox" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: T.bg, fontFamily: FF, color: T.text, overflow: "hidden" }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: sw, flexShrink: 0, background: DARK, display: "flex", flexDirection: "column", transition: "width 0.2s ease", overflow: "hidden", zIndex: 10, borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Logo */}
        <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 14px", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", flexShrink: 0, letterSpacing: -0.5 }}>M</div>
          {!collapsed && <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 1.5, whiteSpace: "nowrap" }}>MASTRO</span>}
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.25)", padding: "12px 16px 4px" }}>{group.label}</div>
              )}
              {group.items.map(({ key, ico, label, badge: modBadge }) => {
                const active = activeNav === key || (activeNav === "montaggi_cal" && key === "montaggi");
                const numBadge = getBadge(key);
                const icoKey = ico as keyof typeof ICO;
                return (
                  <div key={key} onClick={() => navTo(key)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "9px 0 9px 17px" : "9px 12px 9px 14px", cursor: "pointer", position: "relative", background: active ? "rgba(255,255,255,0.08)" : "transparent", transition: "background 0.12s" }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    {active && <div style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 3, borderRadius: "0 2px 2px 0", background: TEAL }} />}
                    <Ico d={ICO[icoKey]} s={17} c={active ? "#fff" : "rgba(255,255,255,0.4)"} />
                    {!collapsed && (
                      <>
                        <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#fff" : "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", flex: 1 }}>{label}</span>
                        {numBadge > 0 && (
                          <span style={{ background: "#DC4444", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>{numBadge}</span>
                        )}
                        {modBadge && numBadge === 0 && (
                          <span style={{ background: TEAL + "20", color: TEAL, fontSize: 9, fontWeight: 700, borderRadius: 6, padding: "2px 6px", whiteSpace: "nowrap" }}>{modBadge}</span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User + collapse */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: TEAL + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: TEAL, flexShrink: 0 }}>
                {(aziendaInfo?.nome || aziendaInfo?.ragione || "M")[0].toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{aziendaInfo?.nome || aziendaInfo?.ragione || "La mia azienda"}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Piano START</div>
              </div>
            </div>
          )}
          <div onClick={() => setCollapsed(c => !c)} style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ height: 56, flexShrink: 0, background: "#fff", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>{currentLabel}</span>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 380, display: "flex", alignItems: "center", background: T.bg, borderRadius: 8, padding: "7px 12px", gap: 8, border: `1px solid ${T.bdr}` }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: FF }} placeholder="Cerca commesse, clienti, codici..." value={searchQ} onChange={e => { setSearchQ(e.target.value); if (ctx.setSearchQ) ctx.setSearchQ(e.target.value); }} />
          </div>

          {/* Alerts */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {ferme > 0 && (
              <div onClick={() => { setFilterFase("tutte"); navTo("commesse"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "#DC444412", border: "1px solid #DC444430", cursor: "pointer" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC4444" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#DC4444" }}>{ferme} ferme</span>
              </div>
            )}
            {unreadMsgs > 0 && (
              <div onClick={() => navTo("messaggi")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "#3B7FE012", border: "1px solid #3B7FE030", cursor: "pointer" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B7FE0" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#3B7FE0" }}>{unreadMsgs} msg</span>
              </div>
            )}
            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: TEAL + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: TEAL, cursor: "pointer" }}>
              {(aziendaInfo?.nome || "M")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* KPI bar — solo su dashboard */}
        {activeNav === "home" && (
          <div style={{ display: "flex", gap: 0, background: "#fff", borderBottom: `1px solid ${T.bdr}`, flexShrink: 0 }}>
            {KPI.map((k, i) => (
              <div key={i} style={{ flex: 1, padding: "10px 20px", borderRight: i < KPI.length - 1 ? `1px solid ${T.bdr}` : "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                onClick={() => { if (k.icon === "folder" || k.icon === "alertTriangle") navTo("commesse"); else if (k.icon === "inbox") navTo("messaggi"); else if (k.icon === "wallet") navTo("contabilita"); }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: k.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <I d={ICO[k.icon as keyof typeof ICO]} s={16} c={k.color} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: k.val > 0 && k.color !== TEAL ? k.color : T.text, fontFamily: FM, lineHeight: 1 }}>{k.val}</div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{k.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
