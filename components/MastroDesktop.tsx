"use client";
import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, PIPELINE_DEFAULT, Ico, ICO } from "./mastro-constants";
import HomePanel from "./HomePanel";
import CommessePanel from "./CommessePanel";
import AgendaPanel from "./AgendaPanel";
import MessaggiPanel from "./MessaggiPanel";
import ClientiPanel from "./ClientiPanel";
import ContabilitaPanel from "./ContabilitaPanel";
import SettingsPanel from "./SettingsPanel";
import MontaggiCalendar from "./MontaggiCalendar";

const NAV = [
  { key: "home",        ico: "home",      label: "Dashboard" },
  { key: "commesse",    ico: "clipboard", label: "Commesse" },
  { key: "agenda",      ico: "calendar",  label: "Agenda" },
  { key: "clienti",     ico: "users",     label: "Clienti" },
  { key: "messaggi",    ico: "mail",      label: "Messaggi" },
  { key: "misure",      ico: "ruler",     label: "Misure" },
  { key: "montaggi",    ico: "wrench",    label: "Montaggi" },
  { key: "contabilita", ico: "barChart",  label: "Contabilità" },
  { key: "magazzino",   ico: "package",   label: "Magazzino" },
  { key: "documenti",   ico: "fileText",  label: "Documenti" },
  { key: "team",        ico: "shield",    label: "Team & Permessi" },
  { key: "settings",    ico: "settings",  label: "Impostazioni" },
];

const FASE_COLOR: Record<string, string> = {
  sopralluogo: "#3B7FE0",
  preventivo:  "#E8A020",
  misure:      "#af52de",
  ordini:      "#DC4444",
  produzione:  "#F97316",
  posa:        "#F59E0B",
  chiusura:    "#1A9E73",
};

const MODULES_MOBILE = [
  { key: "home",        label: "Dashboard" },
  { key: "commesse",    label: "Commesse" },
  { key: "agenda",      label: "Agenda" },
  { key: "messaggi",    label: "Messaggi" },
  { key: "misure",      label: "Misure" },
  { key: "montaggi",    label: "Montaggi" },
  { key: "clienti",     label: "Clienti" },
  { key: "contabilita", label: "Contabilità" },
];

export default function MastroDesktop() {
  const ctx = useMastro();
  const { T, setTab, cantieri, tasks, msgs, aziendaInfo, team, setTeam,
          setSelectedCM, filterFase, setFilterFase } = ctx;

  // Sync activeNav con tab del MastroContext
  const activeNav = ctx.tab || "home";
  const setActiveNav = (key: string) => { navTo(key); };
  const [collapsed, setCollapsed] = useState(false);
  const [searchDesktop, setSearchDesktop] = useState("");

  const sw = collapsed ? 64 : 220;
  const unreadMsgs = (msgs || []).filter((m: any) => !m.read).length;
  const commesseAttive = (cantieri || []).filter((c: any) => c.fase !== "chiusura").length;
  const taskAperte = (tasks || []).filter((t: any) => !t.done).length;
  const taskUrgenti = (tasks || []).filter((t: any) => !t.done && t.urgente).length;
  const valorePortafoglio = (cantieri || []).reduce((sum: number, c: any) =>
    sum + ((c.rilievi || []).reduce((rs: number, r: any) =>
      rs + ((r.vani || []).reduce((vs: number, v: any) => vs + (v.prezzoTotale || 0), 0)), 0)), 0);

  const PIPELINE = ctx.PIPELINE || PIPELINE_DEFAULT || [];
  const pipelineCounts = PIPELINE.map((p: any) => ({
    ...p,
    count: (cantieri || []).filter((c: any) => c.fase === p.key).length,
    color: FASE_COLOR[p.key] || T.acc,
  }));

  function navTo(key: string) {
    const tabMap: Record<string,string> = {
      home: "home", commesse: "commesse", agenda: "agenda",
      messaggi: "messaggi", clienti: "clienti", contabilita: "contabilita",
      montaggi: "montaggi_cal", settings: "settings",
      misure: "commesse", documenti: "commesse", magazzino: "commesse", team: "settings",
    };
    ctx.setTab(tabMap[key] || key);
  }

  const card = {
    background: T.card, borderRadius: T.r,
    border: `1px solid ${T.bdr}`, boxShadow: T.cardSh,
  };
  const cardHeader = {
    padding: "14px 20px 12px", display: "flex", alignItems: "center",
    justifyContent: "space-between", borderBottom: `1px solid ${T.bdr}`,
  };
  const rowStyle = {
    display: "flex", alignItems: "center", padding: "12px 20px",
    borderBottom: `1px solid ${T.bdrL}`, cursor: "pointer",
    transition: "background 0.12s",
  };
  const pill = (color: string) => ({
    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
    background: color + "20", color, border: `1px solid ${color}30`,
    textTransform: "uppercase" as const, letterSpacing: 0.3,
  });

  // ── PANELS ────────────────────────────────────────────────────────────────

  function renderDashboard() {
    const oggi = new Date().toLocaleDateString("it-IT", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 2 }}>
            Buongiorno, {aziendaInfo?.nomeAzienda || "MASTRO"} 👋
          </div>
          <div style={{ fontSize: 13, color: T.sub }}>{oggi}</div>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Commesse Attive",    value: commesseAttive,   sub: "in corso",      color: T.acc },
            { label: "Valore Portafoglio", value: `€${Math.round(valorePortafoglio/1000)}k`, sub: "stimato", color: T.grn },
            { label: "Task Aperte",        value: taskAperte,       sub: taskUrgenti > 0 ? `${taskUrgenti} urgenti` : "ok", color: taskUrgenti > 0 ? T.red : T.grn },
            { label: "Messaggi",           value: unreadMsgs,       sub: "non letti",     color: T.blue },
          ].map((k, i) => (
            <div key={i} style={{ ...card, padding: "20px 20px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: k.color, fontFamily: FM, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={cardHeader}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>PIPELINE</span>
            <span style={{ fontSize: 12, color: T.acc, cursor: "pointer", fontWeight: 600 }}
              onClick={() => navTo("commesse")}>Vedi tutte →</span>
          </div>
          <div style={{ display: "flex", padding: "16px 20px", gap: 10 }}>
            {pipelineCounts.map((p: any) => (
              <div key={p.key}
                onClick={() => { navTo("commesse"); setFilterFase(filterFase === p.key ? "" : p.key); }}
                style={{ flex: 1, textAlign: "center", cursor: "pointer", padding: "12px 4px",
                  borderRadius: 10, background: p.count > 0 ? p.color + "12" : T.bg,
                  border: `1px solid ${p.count > 0 ? p.color + "40" : T.bdr}`, transition: "all 0.15s" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: p.count > 0 ? p.color : T.sub, fontFamily: FM }}>{p.count}</div>
                <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginTop: 4 }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          {/* Commesse recenti */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>COMMESSE RECENTI</span>
            </div>
            {(cantieri || []).slice(0, 6).map((c: any) => {
              const col = FASE_COLOR[c.fase] || T.acc;
              return (
                <div key={c.id} style={rowStyle}
                  onClick={() => { setSelectedCM(c); navTo("commesse"); }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.bg2)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.cliente} {c.cognome}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{c.code} · {c.indirizzo}</div>
                  </div>
                  <span style={pill(col)}>{c.fase}</span>
                </div>
              );
            })}
            {!(cantieri || []).length && (
              <div style={{ padding: 24, textAlign: "center", color: T.sub, fontSize: 13 }}>Nessuna commessa</div>
            )}
          </div>

          {/* Task */}
          <div style={card}>
            <div style={cardHeader}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>TASK</span>
            </div>
            {(tasks || []).filter((t: any) => !t.done).slice(0, 7).map((t: any) => (
              <div key={t.id} style={rowStyle}
                onMouseEnter={e => (e.currentTarget.style.background = T.bg2)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 8, height: 8, borderRadius: "50%",
                  background: t.urgente ? T.red : T.orange, marginRight: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{t.testo || t.descrizione}</div>
                  {t.scadenza && <div style={{ fontSize: 10, color: T.sub }}>{t.scadenza}</div>}
                </div>
              </div>
            ))}
            {!(tasks || []).filter((t: any) => !t.done).length && (
              <div style={{ padding: 24, textAlign: "center", color: T.grn, fontSize: 13 }}>✓ Tutto in ordine</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCommesse() {
    const filtered = (cantieri || []).filter((c: any) => {
      const match = filterFase ? c.fase === filterFase : true;
      const q = searchDesktop.toLowerCase();
      const text = (c.cliente + " " + (c.cognome || "") + " " + c.code + " " + (c.indirizzo || "")).toLowerCase();
      return match && (!q || text.includes(q));
    });
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
          <div style={{ fontSize: 20, fontWeight: 800, flex: 1, color: T.text }}>Commesse</div>
          {pipelineCounts.map((p: any) => (
            <button key={p.key} onClick={() => setFilterFase(filterFase === p.key ? "" : p.key)}
              style={{ padding: "4px 12px", borderRadius: 20,
                border: `1px solid ${filterFase === p.key ? p.color : T.bdr}`,
                background: filterFase === p.key ? p.color : T.card,
                color: filterFase === p.key ? "#fff" : T.sub,
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FF, transition: "all 0.15s" }}>
              {p.label} {p.count > 0 && `(${p.count})`}
            </button>
          ))}
        </div>
        <div style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 40px",
            padding: "10px 20px", borderBottom: `1px solid ${T.bdr}`,
            fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
            <span>Cliente</span><span>Indirizzo</span><span>Fase</span><span>Aggiornata</span><span></span>
          </div>
          {filtered.map((c: any) => {
            const col = FASE_COLOR[c.fase] || T.acc;
            return (
              <div key={c.id}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 40px",
                  padding: "13px 20px", borderBottom: `1px solid ${T.bdrL}`, alignItems: "center",
                  cursor: "pointer", transition: "background 0.12s" }}
                onClick={() => setSelectedCM(c)}
                onMouseEnter={e => (e.currentTarget.style.background = T.bg2)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.cliente} {c.cognome}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{c.code}</div>
                </div>
                <div style={{ fontSize: 12, color: T.sub }}>{c.indirizzo}</div>
                <span style={pill(col)}>{c.fase}</span>
                <div style={{ fontSize: 11, color: T.sub }}>{c.aggiornato}</div>
                <Ico d={ICO.back} s={14} c={T.sub} style={{ transform: "rotate(180deg)" }} />
              </div>
            );
          })}
          {!filtered.length && (
            <div style={{ padding: 32, textAlign: "center", color: T.sub }}>Nessuna commessa trovata</div>
          )}
        </div>
      </div>
    );
  }

  function renderTeam() {
    const members = team || [];
    return (
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, color: T.text }}>Team & Permessi</div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 20 }}>
          Scegli quali moduli sono visibili su mobile e tablet per ogni membro del team.
        </div>
        <div style={{ ...card, overflowX: "auto" as const }}>
          <div style={{ display: "grid",
            gridTemplateColumns: `220px repeat(${MODULES_MOBILE.length}, 90px)`,
            padding: "10px 20px", borderBottom: `1px solid ${T.bdr}`,
            fontSize: 10, fontWeight: 700, color: T.sub,
            textTransform: "uppercase" as const, letterSpacing: 0.3, minWidth: 900 }}>
            <span>Membro</span>
            {MODULES_MOBILE.map(m => (
              <span key={m.key} style={{ textAlign: "center" }}>{m.label}</span>
            ))}
          </div>
          {!members.length && (
            <div style={{ padding: 32, textAlign: "center", color: T.sub, fontSize: 13 }}>
              Nessun membro — aggiungili da Impostazioni → Team
            </div>
          )}
          {members.map((m: any) => (
            <div key={m.id} style={{
              display: "grid", gridTemplateColumns: `220px repeat(${MODULES_MOBILE.length}, 90px)`,
              padding: "14px 20px", borderBottom: `1px solid ${T.bdrL}`,
              alignItems: "center", minWidth: 900 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%",
                  background: T.accLt, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.acc }}>
                  {(m.nome || m.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{m.nome || m.email}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{m.ruolo || "Operaio"}</div>
                </div>
              </div>
              {MODULES_MOBILE.map(mod => {
                const enabled = m.mobileModules
                  ? m.mobileModules.includes(mod.key)
                  : true;
                return (
                  <div key={mod.key} style={{ display: "flex", justifyContent: "center" }}>
                    <div onClick={() => {
                      const newTeam = members.map((mem: any) => {
                        if (mem.id !== m.id) return mem;
                        const current: string[] = mem.mobileModules || MODULES_MOBILE.map(x => x.key);
                        const updated = current.includes(mod.key)
                          ? current.filter((k: string) => k !== mod.key)
                          : [...current, mod.key];
                        return { ...mem, mobileModules: updated };
                      });
                      setTeam(newTeam);
                    }}
                      style={{ width: 22, height: 22, borderRadius: 5, cursor: "pointer",
                        background: enabled ? T.acc : "transparent",
                        border: `1.5px solid ${enabled ? T.acc : T.bdr}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s" }}>
                      {enabled && <Ico d={ICO.check} s={12} c="#fff" sw={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: T.r,
          background: T.accLt, border: `1px solid ${T.acc}30`, fontSize: 12, color: T.sub }}>
          💡 Le modifiche sono visibili al prossimo accesso del membro dall&apos;app mobile.
        </div>
      </div>
    );
  }

  function renderPlaceholder(label: string) {
    return (
      <div style={{ display: "flex", flexDirection: "column" as const,
        alignItems: "center", justifyContent: "center", height: "60%", gap: 12 }}>
        <div style={{ fontSize: 40 }}>🔧</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{label}</div>
        <div style={{ fontSize: 13, color: T.sub }}>Vista desktop in arrivo</div>
      </div>
    );
  }

  function renderContent() {
    switch (activeNav) {
      case "home":        return <HomePanel />;
      case "commesse":    return <CommessePanel />;
      case "agenda":      return <AgendaPanel />;
      case "messaggi":    return <MessaggiPanel />;
      case "clienti":     return <ClientiPanel />;
      case "contabilita": return <ContabilitaPanel />;
      case "montaggi":
      case "montaggi_cal": return <MontaggiCalendar />;
      case "settings":    return <SettingsPanel />;
      default:            return renderPlaceholder(NAV.find(n => n.key === activeNav)?.label || "");
    }
  }

  const currentLabel = NAV.find(n => n.key === activeNav)?.label || "MASTRO";

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw",
      background: T.bg, fontFamily: FF, color: T.text, overflow: "hidden" }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: sw, flexShrink: 0, background: "#1A1A1C",
        display: "flex", flexDirection: "column" as const,
        transition: "width 0.2s ease", overflow: "hidden", zIndex: 10 }}>

        {/* Logo */}
        <div style={{ height: 56, display: "flex", alignItems: "center",
          padding: "0 16px", gap: 10,
          borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.acc,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 900, color: "#fff", fontFamily: FM,
            flexShrink: 0, letterSpacing: -0.5 }}>M</div>
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff",
              letterSpacing: 1.5, whiteSpace: "nowrap" as const }}>MASTRO</span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto" as const, padding: "8px 0" }}>
          {NAV.map(({ key, ico, label }) => {
            const active = activeNav === key;
            const badge = key === "messaggi" && unreadMsgs > 0 ? unreadMsgs : 0;
            const icoKey = ico as keyof typeof ICO;
            return (
              <div key={key} onClick={() => navTo(key)}
                style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: collapsed ? "10px 0 10px 20px" : "10px 12px 10px 16px",
                  cursor: "pointer", position: "relative" as const,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  transition: "background 0.15s" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "rgba(255,255,255,0.08)" : "transparent"; }}>
                {active && (
                  <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%",
                    width: 3, borderRadius: "0 2px 2px 0", background: T.acc }} />
                )}
                <Ico d={ICO[icoKey]} s={18} c={active ? "#fff" : "rgba(255,255,255,0.45)"} />
                {!collapsed && (
                  <>
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 400,
                      color: active ? "#fff" : "rgba(255,255,255,0.5)",
                      whiteSpace: "nowrap" as const, overflow: "hidden", flex: 1 }}>{label}</span>
                    {badge > 0 && (
                      <span style={{ background: T.red, color: "#fff", fontSize: 10,
                        fontWeight: 700, borderRadius: 10, padding: "1px 5px",
                        minWidth: 16, textAlign: "center" as const }}>{badge}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse */}
        <div onClick={() => setCollapsed(c => !c)}
          style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center",
            borderTop: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
            color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{ height: 56, flexShrink: 0, background: T.card,
          borderBottom: `1px solid ${T.bdr}`, display: "flex",
          alignItems: "center", padding: "0 24px", gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{currentLabel}</span>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 360, display: "flex", alignItems: "center",
            background: T.bg, borderRadius: 8, padding: "6px 12px", gap: 8,
            border: `1px solid ${T.bdr}` }}>
            <Ico d={ICO.search} s={14} c={T.sub} />
            <input style={{ flex: 1, border: "none", background: "transparent",
              fontSize: 13, color: T.text, outline: "none", fontFamily: FF }}
              placeholder="Cerca commesse, clienti..."
              value={searchDesktop}
              onChange={e => setSearchDesktop(e.target.value)} />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            {/* Bell */}
            <div style={{ position: "relative" as const, cursor: "pointer" }}>
              <Ico d={ICO.inbox} s={18} c={T.sub} />
              {unreadMsgs > 0 && (
                <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14,
                  borderRadius: "50%", background: T.red, fontSize: 9, fontWeight: 700,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadMsgs}
                </div>
              )}
            </div>

            {/* Device indicators */}
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { label: "Desktop", active: true, path: "M2 3h20v14H2zM8 21h8M12 17v4" },
                { label: "Tablet",  active: false, path: "M5 2h14a2 2 0 012 2v18a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01" },
                { label: "Mobile",  active: false, path: "M7 2h10a2 2 0 012 2v18a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zM12 18h.01" },
              ].map(({ label, active, path }) => (
                <div key={label} title={label}
                  style={{ padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4,
                    background: active ? T.acc + "20" : T.bg, border: `1px solid ${active ? T.acc + "50" : T.bdr}` }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke={active ? T.acc : T.sub} strokeWidth="2">
                    <path d={path} />
                  </svg>
                  {active && <span style={{ fontSize: 10, fontWeight: 600, color: T.acc }}>Attivo</span>}
                </div>
              ))}
            </div>

            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: "50%",
              background: T.accLt, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 700,
              color: T.acc, cursor: "pointer" }}>
              {(aziendaInfo?.nomeAzienda || "M")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto" as const }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
