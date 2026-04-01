"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel v8 — fliwoX Approved Mockup
import React from "react";
import { useMastro } from "./MastroContext";
import SpesaQuick from "./SpesaQuick";
import { ICO, I } from "./mastro-constants";

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const IcoHome = () => (
  <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l11-6 11 6v13l-11 6L3 22V9z"/><path d="M14 3v19M3 9l11 6 11-6"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="#8BBCBC" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="4" width="22" height="20" rx="2"/><line x1="3" y1="10" x2="25" y2="10"/>
    <line x1="9" y1="4" x2="9" y2="10"/><line x1="19" y1="4" x2="19" y2="10"/>
  </svg>
);
const IcoCommessa = () => (
  <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="#8BBCBC" strokeWidth="1.8" strokeLinecap="round">
    <rect x="5" y="3" width="18" height="22" rx="2"/><line x1="9" y1="13" x2="19" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
  </svg>
);
const IcoTalk = () => (
  <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="#8BBCBC" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 6h16a2 2 0 012 2v9a2 2 0 01-2 2H4L2 22V8a2 2 0 012-2z"/>
  </svg>
);
const IcoSettings = () => (
  <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="#8BBCBC" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="14" cy="14" r="3"/>
    <path d="M14 4v3M14 21v3M4 14h3M21 14h3M6.3 6.3l2.1 2.1M19.6 19.6l2.1 2.1M6.3 21.7l2.1-2.1M19.6 8.4l2.1-2.1"/>
  </svg>
);
const IcoChevron = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);
const IcoSun = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 4v16M4 12h16"/>
  </svg>
);
const IcoDoc = (props: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2.2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IcoMeasure = (props: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2.2" strokeLinecap="round">
    <path d="M4 20L10 8l4 8 4-5 4 9"/>
  </svg>
);
const IcoCalSmall = (props: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2.2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

// ─── TYPES ────────────────────────────────────────────────────────────────────
const T_CLR = "#28A0A0";
const T_DARK = "#156060";
const T_LIGHT = "#EEF8F8";
const INK = "#0D1F1F";
const SUB = "#4A7070";
const BDR = "#C8E4E4";
const RED = "#DC4444";
const AMB = "#D08008";
const GRN = "#1A9E73";

const PIPE_COLORS: Record<string, string> = {
  sopralluogo: T_CLR,
  preventivo: "#1A7070",
  conferma: "#1060A0",
  ordini: "#806020",
  produzione: "#806020",
  posa: "#806020",
  collaudo: "#6B4FB0",
  chiusura: "#6B4FB0",
};

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }: any) => (
  <div style={{
    background: "white", borderRadius: 14, border: `1px solid ${BDR}`,
    boxShadow: `0 4px 0 0 #A8CCCC, 0 6px 14px rgba(0,0,0,.06)`,
    padding: "13px 14px", ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: SUB, textTransform: "uppercase", letterSpacing: "0.07em" }}>
      {children}
    </p>
    {badge}
  </div>
);

const Pill = ({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: bg, color }}>
    {children}
  </span>
);

const BtnP = ({ children, onClick }: any) => (
  <button onClick={onClick} style={{
    background: T_CLR, border: "none", borderRadius: 12, padding: "5px 11px",
    fontSize: 11, fontWeight: 800, color: "white", cursor: "pointer",
    fontFamily: "system-ui", boxShadow: `0 3px 0 0 ${T_DARK}`,
    display: "flex", alignItems: "center", gap: 6,
  }}>
    {children}
  </button>
);

const Avatar = ({ initials, bg, size = 38, fontSize = 13 }: any) => (
  <div style={{
    width: size, height: size, borderRadius: 10, background: bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, color: "white", fontSize,
    border: "2px solid rgba(255,255,255,.7)", boxShadow: "0 2px 0 0 rgba(0,0,0,.12)",
    flexShrink: 0,
  }}>
    {initials}
  </div>
);

const OpDot = ({ color }: { color: string }) => (
  <div style={{
    width: 9, height: 9, borderRadius: "50%", background: color,
    border: "2px solid white", position: "absolute", bottom: -1, right: -1,
  }} />
);

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function HomePanel() {
  const {
    PIPELINE, cantieri, events, tasks, problemi,
    fattureDB, montaggiDB,
    sogliaDays, dayOffset, setDayOffset,
    setTab, setFilterFase, setSelectedCM,
    setShowContabilita, setShowProblemiView, setShowModal,
    giorniFermaCM, today,
  } = useMastro();

  const [showSpesa, setShowSpesa] = React.useState(false);

  const todayISO = today.toISOString().split("T")[0];
  const h = today.getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const dataLabel = today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dataFormatted = dataLabel.charAt(0).toUpperCase() + dataLabel.slice(1);

  // KPI
  const commesseAttive = cantieri.filter(c => c.fase !== "chiusura").length;
  const fatAtt = fattureDB.filter(f => !f.pagata);
  const totFat = fatAtt.reduce((s, f) => s + (f.importo || 0), 0);
  const fmtK = (n: number) => "€" + (n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : n.toLocaleString("it-IT"));

  // Da fare
  const ferme = cantieri.filter(c => c.fase !== "chiusura" && giorniFermaCM(c) >= sogliaDays);
  const preventiviDaFare = cantieri.filter(c => c.fase === "preventivo");
  const problemiAperti = (problemi || []).filter(p => p.stato !== "risolto");
  const todayEvents = events.filter(e => e.date === todayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));

  const tasks_dyn: Array<{ titolo: string; sotto: string; color: string; icon: React.ReactNode; action: () => void }> = [];
  if (problemiAperti.length > 0) tasks_dyn.push({ titolo: "Problema: " + (problemiAperti[0].titolo || "da risolvere"), sotto: problemiAperti.length + " aperti", color: RED, icon: <IcoDoc color={RED} />, action: () => setShowProblemiView(true) });
  if (ferme.length > 0) { const c = ferme[0]; tasks_dyn.push({ titolo: "Sblocca " + c.cliente, sotto: c.code + " · ferma da " + giorniFermaCM(c) + " gg", color: RED, icon: <IcoDoc color={RED} />, action: () => { setSelectedCM(c); setTab("commesse"); } }); }
  if (preventiviDaFare.length > 0) { const c = preventiviDaFare[0]; tasks_dyn.push({ titolo: "Preventivo: " + c.cliente, sotto: preventiviDaFare.length + " in attesa", color: AMB, icon: <IcoMeasure color={AMB} />, action: () => { setSelectedCM(c); setTab("commesse"); } }); }
  if (todayEvents.length > 0) { const e = todayEvents[0]; tasks_dyn.push({ titolo: e.text, sotto: (e.time || "") + (e.persona ? " · " + e.persona : ""), color: T_CLR, icon: <IcoCalSmall color={T_CLR} />, action: () => setTab("agenda") }); }

  const pipeline = (PIPELINE || []).filter(f => f.attiva);
  const faseCounts: Record<string, number> = {};
  pipeline.forEach(f => { faseCounts[f.id] = cantieri.filter(c => c.fase === f.id).length; });

  // Commesse recenti (last 3)
  const recenti = [...cantieri].sort((a, b) => String(b.updatedAt || b.id || "").localeCompare(String(a.updatedAt || a.id || ""))).slice(0, 3);

  // Fake operatori statici (reali da Supabase non disponibili in HomePanel context)
  const operatori = [
    { ini: "FC", bg: "#1A7878", nome: "Fabio Cozza", ruolo: "Titolare · ufficio", status: "online", dot: GRN, opacity: 1 },
    { ini: "MV", bg: "#1060A0", nome: "Marco Vito", ruolo: "Montatore · Via Roma 14", status: "in cantiere", dot: GRN, opacity: 1 },
    { ini: "PG", bg: "#6B4FB0", nome: "Paolo Greco", ruolo: "Tecnico misure · in giro", status: "in rilievo", dot: AMB, opacity: 1 },
    { ini: "AB", bg: "#806020", nome: "Antonio Bruno", ruolo: "Magazziniere", status: "offline", dot: "#8BBCBC", opacity: 0.55 },
  ];

  const statusPill = (s: string) => {
    if (s === "online" || s === "in cantiere") return { bg: "#D8F2F2", color: "#0A5050" };
    if (s === "in rilievo") return { bg: "#FFF0DC", color: "#7A4000" };
    return { bg: "#F0F8F8", color: "#8BBCBC" };
  };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", backgroundColor: "#D8EEEE", backgroundImage: "linear-gradient(rgba(40,160,160,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.18) 1px,transparent 1px)", backgroundSize: "24px 24px", minHeight: "100%", paddingBottom: 90 }}>

      {/* ── TOPBAR ── */}
      <div style={{ background: INK, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <p suppressHydrationWarning style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: 600 }}>{dataFormatted}</p>
            <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1.2 }}>{saluto}, Fabio</p>
          </div>
          {/* meteo widget */}
          <div style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
            <IcoSun />
            <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 900, color: "white" }}>22°</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,.5)" }}>Brindisi</p>
          </div>
        </div>
        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div style={{ background: "rgba(40,160,160,.15)", border: "1px solid rgba(40,160,160,.25)", borderRadius: 10, padding: "9px 10px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: T_CLR }}>{commesseAttive}</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>commesse</p>
          </div>
          <div style={{ background: "rgba(40,160,160,.15)", border: "1px solid rgba(40,160,160,.25)", borderRadius: 10, padding: "9px 10px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: T_CLR }}>3</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>oggi in campo</p>
          </div>
          <div style={{ background: "rgba(40,160,160,.15)", border: "1px solid rgba(40,160,160,.25)", borderRadius: 10, padding: "9px 10px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: totFat > 0 ? GRN : T_CLR }}>{fmtK(totFat)}</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>da incassare</p>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* DA FARE ORA */}
        {tasks_dyn.length > 0 && (
          <Card>
            <SectionTitle badge={<Pill bg="#FFF0DC" color="#7A4000">{tasks_dyn.length} azioni</Pill>}>Da fare ora</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {tasks_dyn.map((t, i) => (
                <div key={i} onClick={t.action} style={{ background: "white", borderRadius: 12, border: `1px solid ${BDR}`, boxShadow: "0 2px 0 0 #A8CCCC", padding: "11px 13px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderLeft: `4px solid ${t.color}` }}>
                  <div style={{ width: 32, height: 32, background: t.color + "1A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {t.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: INK }}>{t.titolo}</p>
                    <p style={{ margin: 0, fontSize: 10, color: SUB }}>{t.sotto}</p>
                  </div>
                  <IcoChevron />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* AZIONI RAPIDE */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div onClick={() => setShowModal("commessa")} style={{ padding: "18px 16px", borderRadius: 18, background: T_CLR, boxShadow: `0 8px 0 0 ${T_DARK}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I d={ICO.folder} s={22} c="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "white" }}>Commessa</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>Nuova pratica</p>
            </div>
          </div>
          <div onClick={() => setShowSpesa(true)} style={{ padding: "18px 16px", borderRadius: 18, background: AMB, boxShadow: "0 8px 0 0 #7A4800", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I d={ICO.receipt || ICO.tag} s={22} c="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "white" }}>Invia spesa</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>Scontrino / nota</p>
            </div>
          </div>
          <div onClick={() => setShowModal("contatto")} style={{ padding: "18px 16px", borderRadius: 18, background: "white", border: `2px solid ${BDR}`, boxShadow: "0 7px 0 0 #A8CCCC", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(40,160,160,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I d={ICO.user} s={22} c={T_CLR} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: INK }}>Cliente</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700, color: SUB }}>Nuovo contatto</p>
            </div>
          </div>
          <div onClick={() => setShowModal("evento")} style={{ padding: "18px 16px", borderRadius: 18, background: "white", border: `2px solid ${BDR}`, boxShadow: "0 7px 0 0 #A8CCCC", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124,95,191,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I d={ICO.calendar} s={22} c="#7C5FBF" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: INK }}>Appuntamento</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700, color: SUB }}>Agenda</p>
            </div>
          </div>
        </div>

        {/* OPERATORI OGGI */}
        <Card>
          <SectionTitle badge={<Pill bg="#D8F2F2" color="#0A5050">3 in campo</Pill>}>Operatori oggi</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {operatori.map((op, i) => {
              const pill = statusPill(op.status);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: op.opacity }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar initials={op.ini} bg={op.bg} />
                    <OpDot color={op.dot} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: INK }}>{op.nome}</p>
                    <p style={{ margin: 0, fontSize: 10, color: SUB }}>{op.ruolo}</p>
                  </div>
                  <Pill bg={pill.bg} color={pill.color}>{op.status}</Pill>
                </div>
              );
            })}
          </div>
        </Card>

        {/* AGENDA OGGI */}
        <Card>
          <SectionTitle badge={<BtnP onClick={() => setTab("agenda")}>Vedi tutto</BtnP>}>Agenda oggi</SectionTitle>
          {todayEvents.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: "8px 0" }}>Nessun evento oggi</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {todayEvents.slice(0, 4).map((e, i) => {
                const isLast = i === Math.min(todayEvents.length, 4) - 1;
                const clr = i === 0 ? T_CLR : i === 1 ? AMB : "#1060A0";
                return (
                  <div key={e.id || i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: isLast ? "none" : `1px solid ${T_LIGHT}` }}>
                    <div style={{ width: 40, flexShrink: 0, textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: clr }}>{e.time || "—"}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: INK }}>{e.text}</p>
                      <p style={{ margin: 0, fontSize: 10, color: SUB }}>{e.persona || ""}{e.luogo ? " · " + e.luogo : ""}</p>
                    </div>
                    <div style={{ width: 4, background: clr, borderRadius: 2, flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ULTIME COMMESSE */}
        <Card>
          <SectionTitle badge={<BtnP onClick={() => setTab("commesse")}>Tutte →</BtnP>}>Ultime commesse</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recenti.length === 0 && (
              <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: "8px 0" }}>Nessuna commessa</p>
            )}
            {recenti.map((c, i) => {
              const isClosed = c.fase === "chiusura";
              const fasi = ["sopralluogo", "preventivo", "conferma", "ordini", "posa", "fattura"];
              const faseIdx = fasi.indexOf(c.fase);
              const initials = (c.cliente || "??").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const avatarColors = ["#1A7878", "#6B4FB0", "#B05020", "#1060A0"];
              const bg = avatarColors[i % avatarColors.length];
              return (
                <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: T_LIGHT, borderRadius: 9, border: `1px solid ${BDR}`, cursor: "pointer" }}>
                  <Avatar initials={initials} bg={bg} size={32} fontSize={11} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: INK }}>{c.cliente}</p>
                    <div style={{ display: "flex", gap: 2, marginTop: 3, height: 13 }}>
                      {fasi.map((f, fi) => {
                        const done = fi <= faseIdx;
                        const clr = done ? (PIPE_COLORS[f] || T_CLR) : "#D0E8E8";
                        const txtClr = done ? "white" : SUB;
                        return (
                          <div key={f} style={{ flex: fi === 0 ? 3 : 2, background: clr, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: txtClr }}>
                            {f[0].toUpperCase()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {isClosed
                    ? <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: GRN, flexShrink: 0 }}>✓ chiusa</p>
                    : <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: INK, flexShrink: 0 }}>{c.euro ? fmtK(parseFloat(c.euro)) : "—"}</p>
                  }
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ background: "white", borderTop: `1px solid ${BDR}`, padding: "10px 16px 14px", display: "flex", justifyContent: "space-around", alignItems: "center", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30 }}>
        {[
          { icon: <IcoHome />, label: "Home", active: true, action: () => {} },
          { icon: <IcoCalendar />, label: "Agenda", active: false, action: () => setTab("agenda") },
          { icon: <IcoCommessa />, label: "Commesse", active: false, action: () => setTab("commesse") },
          { icon: <IcoTalk />, label: "Talk", active: false, action: () => setTab("messaggi") },
          { icon: <IcoSettings />, label: "Altro", active: false, action: () => setTab("settings") },
        ].map((item, i) => (
          <div key={i} onClick={item.action} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: item.active ? T_CLR : T_LIGHT, boxShadow: item.active ? `0 3px 0 0 ${T_DARK}` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {item.active
                ? React.cloneElement(item.icon, { color: "white" })
                : item.icon}
            </div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: item.active ? T_CLR : "#8BBCBC" }}>{item.label}</p>
          </div>
        ))}
      </div>

      {showSpesa && <SpesaQuick onClose={() => setShowSpesa(false)} />}
    </div>
  );
}
