"use client";
// MASTRO TABLET — Home Cockpit v9.2 RESPONSIVE
// Adatta KPI, grid, padding a tutte le dimensioni tablet (xs/sm/md/lg)
import * as React from "react";
import { TT } from "../design-system";
import { useDashboard } from "../dashboard-context";

type Mode = "xs" | "sm" | "md" | "lg";

const C = {
  bg: "#94A3B8",
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  border: "#E2E8F0",
  navy: "#1E3A5F",
  navyDark: "#0F1B2D",
  navyLight: "#2D5A87",
  navyTint: "#DBE6F1",
  amber: "#92400E",
  amberTint: "#FEF3C7",
  green: "#065F46",
  greenTint: "#ECFDF5",
  red: "#991B1B",
  redTint: "#FEE2E2",
  redSoft: "#FEF2F2",
  blue: "#3B7FE0",
  blueTint: "#DBEAFE",
  purple: "#6D28D9",
  purpleTint: "#EDE9FE",
};

// Hook responsive locale
function useViewport(): Mode {
  const [mode, setMode] = React.useState<Mode>("lg");
  React.useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 900) setMode("xs");
      else if (w < 1100) setMode("sm");
      else if (w < 1280) setMode("md");
      else setMode("lg");
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return mode;
}

const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; pad?: number }> = ({ children, style, pad = 22 }) => (
  <div style={{
    background: C.card, borderRadius: 18, padding: pad,
    boxShadow: "0 4px 16px rgba(15,23,42,0.18)", minWidth: 0, ...style,
  }}>{children}</div>
);

const PanelHead: React.FC<{ icon: React.ReactNode; title: string; link?: string; iconBg?: string; iconColor?: string }> = ({ icon, title, link, iconBg, iconColor }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: iconBg || C.navyTint, color: iconColor || C.navy,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
    </div>
    {link && <div style={{ fontSize: 11, color: C.navy, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>{link}</div>}
  </div>
);

const TODAY_EVENTS = [
  { h: "08", m: ":30", title: "Montaggio Verdi Giuseppe", sub: "Via Roma 12 · sq.A · 8 vani", tag: "MONTAGGIO", color: "mont" as const },
  { h: "09", m: ":00", title: "Preventivo Bianchi Maria", sub: "Studio Rende · €6.820", tag: "PREVENTIVO", color: "prev" as const },
  { h: "11", m: ":30", title: "Sopralluogo Marino Edilizia", sub: "Via Roma 88, Cosenza", tag: "SOPRALLUOGO", color: "sopra" as const },
  { h: "14", m: ":00", title: "Sopralluogo Esposito Franco", sub: "Via Garibaldi 45, Mendicino", tag: "SOPRALLUOGO", color: "sopra" as const },
];

const ALERTS = [
  { code: "RC", title: "Rossi & Co. SRL", sub: "C-2026-049 · ferma in ordini", days: 12, label: "gg" },
  { code: "PG", title: "Pagliaro Giovanni", sub: "C-2026-044 · scaduta 5gg", days: 0, label: "SCAD" },
  { code: "FE", title: "Ferraro Elena", sub: "C-2026-038 · ferma preventivo", days: 8, label: "gg" },
];

const TEAM = [
  { code: "WC", name: "Walter Cozza", where: "Ufficio", status: "online" as const },
  { code: "ME", name: "Marco Esposito", where: "Cantiere Verdi", status: "trasferta" as const },
  { code: "LB", name: "Luca Bianchi", where: "Cantiere Verdi", status: "online" as const },
  { code: "AV", name: "Anna Verdi", where: "Ufficio", status: "online" as const },
  { code: "PR", name: "Paolo Rossi", where: "Magazzino", status: "offline" as const },
];

const PAYMENTS = [
  { name: "FE-2026-048 Esposito", date: "Domani", eur: 4350, type: "in" as const, urgent: true },
  { name: "FE-2026-047 Marino", date: "Mer 13", eur: 2100, type: "in" as const },
  { name: "Aluplast — DDT 2451", date: "Ven 15", eur: 1870, type: "out" as const },
  { name: "FE-2026-046 Palmieri", date: "Sab 16", eur: 2000, type: "in" as const },
];

const PRODUCTIONS = [
  { name: "Verdi Giuseppe · 8 vani", pct: 68, phase: "Taglio profili 5/8", deadline: "scad: 18 mag" },
  { name: "Marino Edilizia · 4 vani", pct: 45, phase: "Assemblaggio", deadline: "scad: 22 mag" },
  { name: "Palmieri R. · 3 vani", pct: 85, phase: "Vetratura", deadline: "scad: 14 mag" },
  { name: "Esposito F. · 3 vani", pct: 95, phase: "Pronta consegna", deadline: "scad: 11 mag" },
];

const REVENUE_CHART = [
  { m: "DIC", v: 11, h: 55 },
  { m: "GEN", v: 14, h: 70 },
  { m: "FEB", v: 12, h: 60 },
  { m: "MAR", v: 16, h: 80 },
  { m: "APR", v: 19, h: 95 },
  { m: "MAG", v: 17.9, h: 90, current: true },
];

const MESSAGES = [
  { ch: "wa" as const, chLabel: "W", from: "Bianchi Maria", text: "Confermo l'appuntamento di lunedì", time: "2m" },
  { ch: "email" as const, chLabel: "@", from: "aluplast.it", text: "Conferma ordine n. 2451 — pronto", time: "25m" },
  { ch: "sms" as const, chLabel: "S", from: "+39 320 1234567", text: "Salve, vorrei un preventivo per...", time: "1h" },
];

const TOP_CLIENTS = [
  { rank: 1, name: "Verdi Giuseppe", meta: "2 commesse · ecobonus", eur: "€18.4k", gold: true },
  { rank: 2, name: "Rossi & Co. SRL", meta: "3 commesse", eur: "€12.1k" },
  { rank: 3, name: "Marino Edilizia", meta: "1 commessa", eur: "€9.2k" },
  { rank: 4, name: "Esposito Franco", meta: "1 commessa", eur: "€4.3k" },
];

const STOCK_LOW = [
  { name: "Profilo Aluplast Ideal 4000 bianco", stock: "Stock: 3 / min: 20 · -85%" },
  { name: "Vetro 4-16-4 basso emissivo", stock: "Stock: 8 m² / min: 50 · -84%" },
  { name: "Maniglia DK Hoppe Atlanta", stock: "Stock: 2 / min: 15 · -87%" },
  { name: "Schiuma poliuretanica 750ml", stock: "Stock: 4 / min: 30 · -87%" },
];

const RECENT_COMMESSE = [
  { code: "VG", name: "Verdi Giuseppe", num: "C-2026-051", phase: "Produzione", phaseClass: "prod" as const, eur: "€12,4k" },
  { code: "BM", name: "Bianchi Maria", num: "C-2026-050", phase: "Preventivo", phaseClass: "prev" as const, eur: "€6,8k", avatarClass: "preventivo" as const },
  { code: "EF", name: "Esposito Franco", num: "C-2026-048", phase: "Fattura", phaseClass: "fatt" as const, eur: "€4,3k", avatarClass: "fattura" as const },
  { code: "ME", name: "Marino Edilizia", num: "C-2026-047", phase: "Sopralluogo", phaseClass: "prod" as const, eur: "€9,2k" },
];

export default function DashboardTablet() {
  const { preset } = useDashboard();
  const mode = useViewport();

  // Responsive layout decisions
  const kpiCols = mode === "xs" ? 3 : mode === "sm" ? 3 : 6;
  const grid3Cols = mode === "xs" ? "1fr" : mode === "sm" ? "1fr 1fr" : "minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)";
  const grid2Cols = mode === "xs" ? "1fr" : "minmax(0,1fr) minmax(0,1fr)";
  const gap = mode === "xs" ? 12 : mode === "sm" ? 14 : 18;
  const panelPad = mode === "xs" ? 16 : 22;
  const heroFontDate = mode === "xs" ? 22 : mode === "sm" ? 26 : 34;
  const heroPad = mode === "xs" ? "20px 22px" : mode === "sm" ? "24px 26px" : "28px 32px";
  const showHeroStats = mode !== "xs";
  const pipBarHeight = mode === "xs" ? 56 : mode === "sm" ? 64 : 72;
  const pipNumSize = mode === "xs" ? 18 : mode === "sm" ? 22 : 26;

  return (
    <div style={{ background: C.bg, minWidth: 0, width: "100%", overflow: "hidden" }}>

      {/* HERO */}
      <div onClick={() => navigate("calendario")} style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyDark} 100%)`,
        cursor: "pointer",
        borderRadius: 20, padding: heroPad, color: "#fff",
        marginBottom: gap, boxShadow: "0 8px 24px rgba(15,27,45,0.4)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-50%", right: "-10%",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(45,90,135,0.4) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", marginBottom: 22, position: "relative", zIndex: 1 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>Buongiorno Fabio</div>
            <div style={{ fontSize: heroFontDate, fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.1, marginTop: 5 }}>Domenica, 10 maggio</div>
            <div style={{ fontSize: 13, color: "#B5C8DD", fontWeight: 600, marginTop: 5 }}>4 eventi oggi · ☀️ 22°C Cosenza</div>
          </div>
          {showHeroStats && (
            <div style={{ display: "flex", gap: mode === "lg" ? 22 : 16, flexShrink: 0 }}>
              <HeroStat num="14" lbl="Attive" mode={mode} />
              <HeroStat num="2" lbl="Ferme" alert mode={mode} />
              <HeroStat num="€17,9k" lbl="Mese" mode={mode} />
            </div>
          )}
        </div>
        <div style={{ position: "relative", zIndex: 1, paddingTop: 8 }}>
          <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 3, margin: "38px 16px 8px" }}>
            <TLEvent left="5%" color={C.green} time="08:30" tag="MONT" />
            <TLEvent left="10%" color={C.amber} time="09:00" tag="PREV" />
            <TLEvent left="32%" color={C.navy} time="11:30" tag="SOPRA" />
            <TLEvent left="60%" color={C.navy} time="14:00" tag="SOPRA" />
            <div style={{ position: "absolute", top: -5, width: 16, height: 16, borderRadius: "50%", background: "#10B981", border: "3px solid #fff", boxShadow: "0 0 0 5px rgba(16,185,129,0.3)", left: "42%" }} />
            <div style={{ position: "absolute", top: -36, transform: "translateX(-50%)", background: "#10B981", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 6, letterSpacing: 0.5, left: "42%" }}>ORA 12:14</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "0 16px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
            <span>08</span><span>10</span>
            <span style={{ color: "#10B981", fontWeight: 800 }}>12</span>
            <span>14</span><span>16</span><span>18</span><span>20</span>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpiCols}, minmax(0, 1fr))`, gap: 12, marginBottom: gap }}>
        <Kpi color="navy" mode={mode} iconPath={<><path d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/></>} value="14" label="Attive" delta="▲ +2" deltaUp onClick={() => navigate("commesse")} />
        <Kpi color="amber" mode={mode} iconPath={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>} value="3" label="Sopra." />
        <Kpi color="purple" mode={mode} iconPath={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} value="5" label="Produz." delta="▲ +1" deltaUp />
        <Kpi color="red" mode={mode} iconPath={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} value="2" label="Ferme" delta="▲ +1" />
        <Kpi color="blue" mode={mode} iconPath={<><path d="M12 2v6m0 0L9 5m3 3l3-3"/><circle cx="12" cy="14" r="6"/></>} value="7" label="Scadenza" />
        <Kpi color="green" mode={mode} iconPath={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>} value="€17,9k" label="Fatturato" delta="▲ 12%" deltaUp small />
      </div>

      {/* PIPELINE */}
      <div style={{ background: C.card, borderRadius: 16, padding: panelPad, boxShadow: "0 4px 16px rgba(15,23,42,0.18)", marginBottom: gap }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.navyTint, color: C.navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Pipeline · 14 attive</div>
          </div>
          <div style={{ fontSize: 11, color: C.navy, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>Dettagli ›</div>
        </div>
        <div style={{ display: "flex", height: pipBarHeight, borderRadius: 11, overflow: "hidden", gap: 2 }}>
          <PipStep grow={3} bg={C.navy} num="3" lbl="Sopra." size={pipNumSize} />
          <PipStep grow={5} bg={C.blue} num="5" lbl="Prev." size={pipNumSize} />
          <PipStep grow={2} bg={C.amber} num="2" lbl="Conf." size={pipNumSize} />
          <PipStep grow={2} bg={C.purple} num="2" lbl="Ord." size={pipNumSize} />
          <PipStep grow={1} bg="#3DB8AA" num="1" lbl="Prod." size={pipNumSize} />
          <PipStep grow={2} bg={C.green} num="2" lbl="Fatt." size={pipNumSize} />
          <PipStep grow={1} bg={C.subLight} num="1" lbl="Pag." size={pipNumSize} />
        </div>
      </div>

      {/* ROW 1: Agenda + Urgenti + Team */}
      <div style={{ display: "grid", gridTemplateColumns: grid3Cols, gap, marginBottom: gap }}>

        <Panel pad={panelPad}>
          <PanelHead title="Agenda oggi" link="Tutti ›" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TODAY_EVENTS.map((e, i) => (
              <div key={i} onClick={() => navigate(e.tag === "MONTAGGIO" ? "montaggi" : e.tag === "PREVENTIVO" ? "commesse" : "sopralluoghi")} style={{ display: "flex", alignItems: "center", gap: 12, padding: 11, background: C.cardSoft, borderRadius: 12, cursor: "pointer", minWidth: 0 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 12, flexShrink: 0,
                  background: e.color === "mont" ? C.green : e.color === "prev" ? C.amber : C.navy,
                  color: "#fff", lineHeight: 1,
                }}>
                  {e.h}<small style={{ fontSize: 9, opacity: 0.75, fontWeight: 700 }}>{e.m}</small>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.sub}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: C.subLight, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 3 }}>{e.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel pad={panelPad}>
          <PanelHead title="Urgenti" link="Tutte ›" iconBg={C.redTint} iconColor={C.red} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ALERTS.map((a, i) => (
              <div key={i} onClick={() => navigate("commesse")} style={{ display: "flex", alignItems: "center", gap: 10, padding: 11, background: C.redSoft, borderRadius: 12, cursor: "pointer", border: "1px solid #FECACA", minWidth: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: C.red, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{a.code}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#7F1D1D", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: C.red, marginTop: 2, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.sub}</div>
                </div>
                <div style={{ background: C.red, color: "#fff", padding: "4px 9px", borderRadius: 8, fontSize: 11, fontWeight: 800, flexShrink: 0, textAlign: "center", lineHeight: 1.1 }}>
                  {a.days > 0 ? <>{a.days}<small style={{ fontSize: 8, opacity: 0.85, fontWeight: 700, display: "block", marginTop: 1 }}>{a.label}</small></> : a.label}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel pad={panelPad}>
          <PanelHead title="Team live" link="Tutti ›" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {TEAM.map((m, i) => (
              <div key={i} onClick={() => navigate("clienti")} style={{ display: "flex", alignItems: "center", gap: 10, padding: 7, borderRadius: 10, cursor: "pointer", minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, #475A75, ${C.navy})`, color: "#fff", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                  {m.code}
                  <div style={{
                    position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", border: "2px solid #fff",
                    background: m.status === "online" ? "#10B981" : m.status === "offline" ? C.subLight : "#F59E0B",
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.where}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ROW 2: Soldi + Produzione */}
      <div style={{ display: "grid", gridTemplateColumns: grid2Cols, gap, marginBottom: gap }}>
        <Panel pad={panelPad}>
          <PanelHead title="Soldi · 7 giorni" link="Contabilità ›" iconBg={C.greenTint} iconColor={C.green} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div style={{ padding: 12, borderRadius: 12, background: C.greenTint, border: "1px solid #A7F3D0" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.green, letterSpacing: 0.5, textTransform: "uppercase" }}>Da incassare</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.green, letterSpacing: -0.4, lineHeight: 1, marginTop: 4 }}>€8.450</div>
              <div style={{ fontSize: 10, color: "#475A75", fontWeight: 700, marginTop: 4 }}>3 fatture · ⌀ 4gg</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: C.amberTint, border: "1px solid #FCD34D" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.amber, letterSpacing: 0.5, textTransform: "uppercase" }}>Da pagare</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.amber, letterSpacing: -0.4, lineHeight: 1, marginTop: 4 }}>€3.220</div>
              <div style={{ fontSize: 10, color: "#475A75", fontWeight: 700, marginTop: 4 }}>2 fornitori · ⌀ 6gg</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PAYMENTS.map((p, i) => (
              <div key={i} onClick={() => navigate("contabilita")} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 11px", borderRadius: 10, cursor: "pointer", gap: 10, minWidth: 0,
                background: p.urgent ? C.redTint : C.cardSoft,
                border: p.urgent ? "1px solid #FCA5A5" : "none",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, flexShrink: 0 }}>{p.date}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: p.type === "in" ? C.green : C.amber, flexShrink: 0 }}>
                  {p.type === "in" ? "+" : "-"}€{p.eur.toLocaleString("it-IT")}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel pad={panelPad}>
          <PanelHead title="Produzione · 5 attive" link="Reparto ›" iconBg={C.purpleTint} iconColor={C.purple} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PRODUCTIONS.map((p, i) => (
              <div key={i} onClick={() => navigate("produzione")} style={{ padding: 12, background: C.cardSoft, borderRadius: 12, cursor: "pointer", minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{p.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, flexShrink: 0 }}>{p.pct}%</div>
                </div>
                <div style={{ height: 7, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg, ${C.navy}, ${C.blue})`, borderRadius: 4, width: `${p.pct}%` }} />
                </div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 6, fontWeight: 600, display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.phase}</span><span style={{ flexShrink: 0 }}>{p.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ROW 3: Fatturato + Messaggi + Top clienti */}
      <div style={{ display: "grid", gridTemplateColumns: grid3Cols, gap, marginBottom: gap }}>
        <Panel pad={panelPad}>
          <PanelHead title="Fatturato 6 mesi" link="Report ›" iconBg={C.greenTint} iconColor={C.green} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 150, padding: "8px 0 4px" }}>
            {REVENUE_CHART.map((b, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: C.ink, whiteSpace: "nowrap" }}>€{b.v}k</div>
                <div style={{ width: "100%", height: `${b.h}%`, background: b.current ? `linear-gradient(180deg, ${C.green}, #10B981)` : `linear-gradient(180deg, ${C.navy}, ${C.blue})`, borderRadius: "6px 6px 0 0", minHeight: 8 }} />
                <div style={{ fontSize: 10, color: b.current ? C.green : C.sub, fontWeight: 700, textTransform: "uppercase" }}>{b.m}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel pad={panelPad}>
          <PanelHead title="Messaggi · 3" link="Talk ›" iconBg={C.blueTint} iconColor={C.blue} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {MESSAGES.map((m, i) => (
              <div key={i} onClick={() => navigate("ai")} style={{ display: "flex", alignItems: "center", gap: 10, padding: 9, background: C.cardSoft, borderRadius: 10, cursor: "pointer", minWidth: 0 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", flexShrink: 0, fontSize: 13, fontWeight: 800,
                  background: m.ch === "wa" ? "#25D366" : m.ch === "email" ? C.blue : C.amber,
                }}>{m.chLabel}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.ink, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.from}</div>
                  <div style={{ fontSize: 9, color: C.sub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{m.text}</div>
                </div>
                <div style={{ fontSize: 9, color: C.subLight, fontWeight: 700, flexShrink: 0 }}>{m.time}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel pad={panelPad}>
          <PanelHead title="Top clienti mese" link="Tutti ›" iconBg={C.amberTint} iconColor={C.amber} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {TOP_CLIENTS.map((c, i) => (
              <div key={i} onClick={() => navigate("clienti")} style={{ display: "flex", alignItems: "center", gap: 10, padding: 9, background: C.cardSoft, borderRadius: 10, cursor: "pointer", minWidth: 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: c.gold ? C.amberTint : C.navyTint,
                  color: c.gold ? C.amber : C.navy,
                  fontSize: 12, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{c.rank}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: 9, color: C.sub, fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.meta}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.green, flexShrink: 0 }}>{c.eur}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ROW 4: Magazzino + Commesse recenti */}
      <div style={{ display: "grid", gridTemplateColumns: grid2Cols, gap }}>
        <Panel pad={panelPad}>
          <PanelHead title="Magazzino sotto-scorta · 5" link="Riordina ›" iconBg={C.redTint} iconColor={C.red} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></svg>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {STOCK_LOW.map((s, i) => (
              <div key={i} onClick={() => navigate("magazzino")} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: C.redSoft, borderRadius: 11, cursor: "pointer", border: "1px solid #FECACA", minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: C.red, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 13 }}>!</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#7F1D1D", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ fontSize: 9, color: C.red, fontWeight: 700, marginTop: 2 }}>{s.stock}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel pad={panelPad}>
          <PanelHead title="Commesse recenti" link="Tutte ›" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {RECENT_COMMESSE.map((c, i) => {
              const avatarBg = c.avatarClass === "preventivo" ? `linear-gradient(135deg, ${C.amber}, #D97706)` : c.avatarClass === "fattura" ? `linear-gradient(135deg, ${C.green}, #10B981)` : `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`;
              const pillBg = c.phaseClass === "prev" ? C.amberTint : c.phaseClass === "fatt" ? C.greenTint : C.navyTint;
              const pillColor = c.phaseClass === "prev" ? C.amber : c.phaseClass === "fatt" ? C.green : C.navy;
              return (
                <div key={i} onClick={() => navigate("commesse")} style={{ display: "flex", alignItems: "center", gap: 10, padding: 9, background: C.cardSoft, borderRadius: 10, cursor: "pointer", minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: avatarBg }}>{c.code}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                    <div style={{ fontSize: 9, color: C.sub, marginTop: 2, display: "flex", gap: 5, alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: C.navy }}>{c.num}</span>
                      <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 6px", borderRadius: 999, letterSpacing: 0.4, textTransform: "uppercase", background: pillBg, color: pillColor }}>{c.phase}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, flexShrink: 0 }}>{c.eur}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

    </div>
  );
}

const HeroStat: React.FC<{ num: string; lbl: string; alert?: boolean; mode: Mode }> = ({ num, lbl, alert, mode }) => (
  <div style={{ textAlign: "right" }}>
    <div style={{ fontSize: mode === "lg" ? 28 : 24, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1, color: alert ? "#FCA5A5" : "#fff", whiteSpace: "nowrap" }}>{num}</div>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#93B0CF", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4 }}>{lbl}</div>
  </div>
);

const TLEvent: React.FC<{ left: string; color: string; time: string; tag: string }> = ({ left, color, time, tag }) => (
  <div style={{
    position: "absolute", top: -24,
    width: 50, height: 50, borderRadius: 13,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transform: "translateX(-50%)",
    boxShadow: "0 4px 14px rgba(0,0,0,0.35)", border: "2px solid #fff",
    background: color, left,
  }}>
    <div style={{ fontSize: 10, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{time}</div>
    <div style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: 0.4, marginTop: 2 }}>{tag}</div>
  </div>
);

const Kpi: React.FC<{ color: "navy" | "amber" | "purple" | "green" | "red" | "blue"; iconPath: React.ReactNode; value: string; label: string; delta?: string; deltaUp?: boolean; small?: boolean; mode: Mode }> = ({ color, iconPath, value, label, delta, deltaUp, small, mode }) => {
  const colorMap = {
    navy: { bd: C.navy, bg: C.navyTint, fg: C.navy },
    amber: { bd: C.amber, bg: C.amberTint, fg: C.amber },
    purple: { bd: C.purple, bg: C.purpleTint, fg: C.purple },
    green: { bd: C.green, bg: C.greenTint, fg: C.green },
    red: { bd: C.red, bg: C.redTint, fg: C.red },
    blue: { bd: C.blue, bg: C.blueTint, fg: C.blue },
  };
  const m = colorMap[color];
  const valueSize = mode === "xs" ? 22 : mode === "sm" ? 24 : (small ? 22 : 28);
  return (
    <div style={{
      background: C.card, borderRadius: 14, padding: mode === "xs" ? 12 : 14,
      boxShadow: "0 4px 16px rgba(15,23,42,0.18)", cursor: "pointer",
      borderTop: `4px solid ${m.bd}`,
      display: "flex", flexDirection: "column", gap: 6,
      minWidth: 0, overflow: "hidden",
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: m.bg, color: m.fg, flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>{iconPath}</svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: valueSize, fontWeight: 800, color: C.ink, letterSpacing: -0.5, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, lineHeight: 1.2, marginTop: 4 }}>{label}</div>
      </div>
      {delta && (
        <div style={{
          fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 5,
          display: "inline-flex", width: "fit-content",
          background: deltaUp ? C.greenTint : C.redTint,
          color: deltaUp ? C.green : C.red,
        }}>{delta}</div>
      )}
    </div>
  );
};

const PipStep: React.FC<{ grow: number; bg: string; num: string; lbl: string; size: number }> = ({ grow, bg, num, lbl, size }) => (
  <div style={{
    flex: 1, flexGrow: grow, minWidth: 0,
    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
    background: bg, color: "#fff", fontWeight: 800, cursor: "pointer", padding: 6, textAlign: "center",
  }}>
    <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1 }}>{num}</div>
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.95, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{lbl}</div>
  </div>
);
