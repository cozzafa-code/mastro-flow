// components/mobile/team/TeamMobile.tsx
// STILE MASTRO ufficiale: header fliwoX + card stato widget-style + bg #F4F1EA
"use client";
import React, { useState, useMemo } from "react";
import { useTeamMobile } from "@/hooks/useTeamMobile";
import { useTeamFilters } from "@/hooks/useTeamFilters";
import type { Operator } from "@/lib/types/team";
import { useMastro } from "@/components/MastroContext";

import OperatorDetailMobile from "./OperatorDetailMobile";
import TeamSquadsMobile from "./TeamSquadsMobile";
import TeamProblemsMobile from "./TeamProblemsMobile";
import TeamMapMobile from "./TeamMapMobile";
import NewTaskSheetMobile from "./NewTaskSheetMobile";
import NewTeamActionSheetMobile from "./NewTeamActionSheetMobile";

interface Props {
  hideBottomNav?: boolean;
  onOpenCommessa?: (id: string) => void;
}

type View = "list" | "detail" | "map";

// PALETTE MASTRO OFFICIAL (HomePanelMobile)
const M = {
  pageBg:  "#F4F1EA",
  cardBg:  "#FFFFFF",
  border:  "#E0DCD0",
  text:    "#1A1A1A",
  textGrey:"#888888",
  // Header gradient teal MASTRO
  gradStart:"#28A0A0",
  gradEnd:  "#1E8080",
  // Status colors
  green:"#22C55E", greenText:"#16A34A", greenBg:"#E8F5EC",
  orange:"#F59E0B", orangeText:"#D97706", orangeBg:"#FEF3C7",
  red:"#EF4444",  redText:"#DC2626",  redBg:"#FFE4E1",
  blue:"#3B82F6", blueText:"#2563EB", blueBg:"#DBEAFE",
  grey:"#9CA3AF",
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// ===== ICONE =====
const SVGico = (p: { ch: React.ReactNode; s?: number; sw?: number; col?: string }) => (
  <svg width={p.s || 16} height={p.s || 16} viewBox="0 0 24 24" fill="none" stroke={p.col || "currentColor"} strokeWidth={p.sw || 2} strokeLinecap="round" strokeLinejoin="round">{p.ch}</svg>
);
const IcoMapPin = ({ s = 14 }) => <SVGico s={s} ch={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>} />;
const IcoHammer = ({ s = 14 }) => <SVGico s={s} ch={<><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/></>} />;
const IcoAlert = ({ s = 14 }) => <SVGico s={s} ch={<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>} />;
const IcoClock = ({ s = 14 }) => <SVGico s={s} ch={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />;
const IcoNav = ({ s = 14 }) => <SVGico s={s} ch={<polygon points="3 11 22 2 13 21 11 13 3 11"/>} />;
const IcoApri = ({ s = 14 }) => <SVGico s={s} ch={<><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>} />;
const IcoPhone = ({ s = 14 }) => <SVGico s={s} ch={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>} />;
const IcoTask = ({ s = 14 }) => <SVGico s={s} ch={<><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/></>} />;
const IcoXCircle = ({ s = 14 }) => <SVGico s={s} ch={<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>} />;
const IcoArrowRight = ({ s = 14, col = "#1A1A1A" }) => <SVGico s={s} sw={2.5} col={col} ch={<path d="M7 17L17 7M17 7H9M17 7v8"/>} />;
const IcoPlus = ({ s = 22 }) => <SVGico s={s} sw={2.5} ch={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoCalendar = ({ s = 14, col = "#28A0A0" }) => <SVGico s={s} col={col} ch={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;
const IcoMenu = ({ s = 16 }) => <SVGico s={s} sw={2.4} col="#FFFFFF" ch={<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>} />;

// ===== AVATAR =====
function Avatar({ name, url, size = 44 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, flexShrink: 0, background: "#F1F5F9" }} />;
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, background: "linear-gradient(135deg,#94A3B8,#64748B)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{init}</div>;
}

// ===== STATUS HELPERS =====
function statusInfo(status: string) {
  switch (status) {
    case "attivo":   return { dot: M.green,  txt: "Attivo ora", txtCol: M.greenText,  bg: M.cardBg };
    case "pausa":    return { dot: M.orange, txt: "In pausa",   txtCol: M.orangeText, bg: M.orangeBg };
    case "problema": return { dot: M.red,    txt: "Problema",   txtCol: M.redText,    bg: M.redBg };
    case "viaggio":  return { dot: M.blue,   txt: "In viaggio", txtCol: M.blueText,   bg: M.blueBg };
    default:         return { dot: M.grey,   txt: "Offline",    txtCol: "#4B5563",    bg: M.cardBg };
  }
}

// ===== MAIN =====
export default function TeamMobile({ hideBottomNav, onOpenCommessa }: Props) {
  const mastro: any = (() => { try { return useMastro(); } catch { return {}; } })();
  const user = mastro?.user || {};

  const { operators, teams, problems, stats, getTimelineFor } = useTeamMobile();
  const { tab, setTab, filtered } = useTeamFilters(operators);

  const [view, setView] = useState<View>("list");
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [showFab, setShowFab] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskDefaultOp, setTaskDefaultOp] = useState<string | undefined>();

  const handleOpen = (op: Operator) => { setSelectedOp(op); setView("detail"); };
  const handleChiama = (op: Operator) => { if (op.phone) window.location.href = "tel:" + op.phone.replace(/\s/g, ""); };

  // === Saluto + nome + data (stile HomePanelMobile) ===
  const now = useMemo(() => new Date(), []);
  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 12) return "BUONGIORNO";
    if (h < 18) return "BUON POMERIGGIO";
    return "BUONASERA";
  }, [now]);
  const dataLunga = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" });
  const nome = (user?.nome || user?.email?.split("@")[0] || "FABIO").toString().toUpperCase();
  const iniziali = nome.slice(0, 2);

  if (view === "detail" && selectedOp) {
    return (
      <OperatorDetailMobile
        op={selectedOp}
        timeline={getTimelineFor(selectedOp.id)}
        onBack={() => { setView("list"); setSelectedOp(null); }}
        onChiama={() => handleChiama(selectedOp)}
        onMappa={() => setView("map")}
        onChat={() => {}}
        onFoto={() => {}}
        onTask={() => { setTaskDefaultOp(selectedOp.id); setShowNewTask(true); }}
        onProblema={() => {}}
        onVaiCommessa={() => selectedOp.commessa_id && onOpenCommessa?.(selectedOp.commessa_id)}
        onPausa={() => {}}
        onStop={() => {}}
        onAssegnaTask={() => { setTaskDefaultOp(selectedOp.id); setShowNewTask(true); }}
      />
    );
  }

  if (view === "map") {
    return <TeamMapMobile operators={operators} onBack={() => setView("list")} onOpenOperator={(op) => { setSelectedOp(op); setView("detail"); }} />;
  }

  const TABS: { id: any; lbl: string }[] = [
    { id: "tutti", lbl: "Tutti" },
    { id: "attivi", lbl: "Attivi" },
    { id: "squadre", lbl: "Squadre" },
    { id: "problemi", lbl: "Problemi" },
  ];

  return (
    <div style={{ background: M.pageBg, minHeight: "100vh", paddingBottom: hideBottomNav ? 16 : 100, fontFamily: FONT }}>

      {/* ===== HEADER fliwoX (clone HomePanelMobile righe 949-969) ===== */}
      <div style={{ padding: "12px 10px 0" }}>
        <div style={{
          background: `linear-gradient(135deg, ${M.gradStart} 0%, ${M.gradEnd} 100%)`,
          padding: "18px 18px 20px",
          borderRadius: 22,
          boxShadow: "0 4px 16px rgba(40,160,160,0.18)",
        }}>
          {/* Riga top: pill fliwoX | DAY + menu + avatar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={M.gradStart} strokeWidth={3}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </div>
              <span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 500 }}>fliwoX</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {/* Pill TEAM (al posto di DAY) */}
              <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={M.gradStart} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                  <span style={{ color: M.gradStart, fontSize: 9, fontWeight: 700, letterSpacing: 0.4 }}>TEAM</span>
                  <span style={{ color: "#1A1A1A", fontSize: 10, fontWeight: 600, marginTop: 1 }}>{stats.attivi} attivi</span>
                </div>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <IcoMenu s={16} />
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 50, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: M.gradStart, fontSize: 12, fontWeight: 600, marginLeft: 4 }}>{iniziali}</div>
            </div>
          </div>
          {/* Saluto + nome + data */}
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 400, letterSpacing: 0.5 }}>{greeting}</div>
          <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 600, marginTop: 2, letterSpacing: -0.5 }}>{nome}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{dataLunga}</div>
        </div>
      </div>

      {/* ===== PILL TABS ===== */}
      <div style={{ padding: "14px 14px 0", display: "flex", gap: 6 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <div key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "9px 12px", borderRadius: 14, cursor: "pointer",
              background: active ? "#1A1A1A" : "#FFFFFF",
              color: active ? "#FFFFFF" : M.text,
              fontSize: 12, fontWeight: active ? 600 : 500,
              border: active ? "none" : `1px solid ${M.border}`,
              textAlign: "center" as any,
            }}>{t.lbl}</div>
          );
        })}
      </div>

      {(tab === "tutti" || tab === "attivi") && (
        <>
          {/* ===== STATO AZIENDA OGGI - WIDGET STILE MASTRO ===== */}
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{
              background: "#B5E4D8",
              borderRadius: 20,
              padding: "14px 16px",
              position: "relative",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#0F6E56", fontWeight: 500, letterSpacing: 0.3 }}>STATO AZIENDA OGGI</div>
                  <div style={{ fontSize: 16, color: "#04342C", fontWeight: 600, marginTop: 3 }}>{stats.total} operatori in linea</div>
                </div>
                <div style={{ background: "#FFFFFF", borderRadius: 50, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <IcoArrowRight s={14} col="#04342C" />
                </div>
              </div>
              {/* 4 indicatori in linea, stile widget MASTRO compatto */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                <Pill n={stats.attivi}  col={M.green}  lbl="Attivi" />
                <Pill n={stats.pausa}   col={M.orange} lbl="In pausa" />
                <Pill n={stats.probl}   col={M.red}    lbl="Problemi" />
                <Pill n={stats.offline} col={M.grey}   lbl="Offline" />
              </div>
            </div>
          </div>

          {/* ===== TITOLO OPERATORI ===== */}
          <div style={{ padding: "20px 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, color: M.text, fontWeight: 500 }}>Operatori</div>
            <div style={{ fontSize: 11, color: M.textGrey }}>{filtered.length} totali</div>
          </div>

          {/* ===== CARDS OPERATORI (stile invariato, solo padding orizz allineato 14) ===== */}
          <div>
            {filtered.map(op => {
              const s = statusInfo(op.status);
              const cardBg = (op.status === "attivo" || op.status === "offline") ? M.cardBg : s.bg;
              const cardBorder = (op.status === "attivo" || op.status === "offline") ? M.border : "transparent";

              let buttons: { lbl: string; ico: React.ReactNode; on: () => void; danger?: boolean }[] = [];
              if (op.status === "problema") {
                buttons = [
                  { lbl: "Risolvi", ico: <IcoXCircle />, on: () => handleOpen(op), danger: true },
                  { lbl: "Chiama",  ico: <IcoPhone />,   on: () => handleChiama(op), danger: true },
                ];
              } else if (op.status === "viaggio") {
                buttons = [
                  { lbl: "Traccia", ico: <IcoNav />,   on: () => setView("map") },
                  { lbl: "Chiama",  ico: <IcoPhone />, on: () => handleChiama(op) },
                ];
              } else if (op.status === "pausa") {
                buttons = [
                  { lbl: "Apri", ico: <IcoApri />, on: () => handleOpen(op) },
                  { lbl: "Task", ico: <IcoTask />, on: () => { setTaskDefaultOp(op.id); setShowNewTask(true); } },
                ];
              } else {
                buttons = [
                  { lbl: "Apri",   ico: <IcoApri />,   on: () => handleOpen(op) },
                  { lbl: "Chiama", ico: <IcoPhone />,  on: () => handleChiama(op) },
                  { lbl: "Mappa",  ico: <IcoMapPin />, on: () => setView("map") },
                ];
              }

              return (
                <div key={op.id} onClick={() => handleOpen(op)} style={{
                  background: cardBg, borderRadius: 20, padding: 16,
                  margin: "10px 14px 0", border: `1px solid ${cardBorder}`,
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <Avatar name={op.name} url={op.avatar_url} size={44} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: M.text }}>{op.name}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: s.dot }} />
                        <span style={{ fontSize: 12, color: s.txtCol, fontWeight: 600 }}>{s.txt}</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, paddingLeft: 4 }}>
                    {op.position_label && <InfoRow icon={<IcoMapPin />} text={op.position_label} />}
                    {op.cliente && op.status === "problema" && <InfoRow icon={<IcoMapPin />} text={op.cliente} />}
                    {op.current_job && <InfoRow icon={<IcoHammer />} text={op.current_job + (op.cliente && op.status === "attivo" ? ` · ${op.cliente}` : "")} extra={op.status === "attivo" && op.timer_label ? op.timer_label : null} />}
                    {op.problem_title && <InfoRow icon={<IcoAlert />} text={op.problem_title} />}
                    {op.problem_reported_ago && <InfoRow icon={<IcoClock />} text={`Segnalato ${op.problem_reported_ago}`} />}
                    {op.status === "viaggio" && op.destination_label && <InfoRow icon={<IcoNav />} text={`In viaggio verso ${op.destination_label}`} />}
                    {op.status === "viaggio" && op.arrival_eta && <InfoRow icon={<IcoClock />} text={`Arrivo stimato ${op.arrival_eta}`} />}
                    {op.status === "pausa" && op.timer_label && <InfoRow icon={<IcoClock />} text={op.timer_label} />}
                  </div>

                  {(op.status === "attivo" || op.status === "pausa") && typeof op.progress === "number" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 6, background: "rgba(13,31,31,0.08)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${op.progress}%`, height: "100%", background: s.dot }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: M.textGrey, minWidth: 32, textAlign: "right" as any }}>{op.progress}%</span>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    {buttons.map((b, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); b.on(); }} style={{
                        flex: 1, padding: "10px 12px", borderRadius: 12,
                        background: M.cardBg,
                        color: b.danger ? M.redText : M.text,
                        border: `1px solid ${b.danger ? M.red + "60" : M.border}`,
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}>
                        {b.ico}<span>{b.lbl}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "squadre" && <TeamSquadsMobile teams={teams} onOpen={() => {}} onNuovaSquadra={() => {}} />}
      {tab === "problemi" && <TeamProblemsMobile problems={problems.filter(p => p.status === "aperto")} onOpen={() => {}} onRisolvi={() => {}} onVediTutti={() => {}} />}

      {/* FAB */}
      <div onClick={() => setShowFab(true)} style={{
        position: "fixed",
        bottom: hideBottomNav ? 24 : 80,
        right: 16,
        zIndex: 100,
        width: 48, height: 48, borderRadius: 999,
        background: M.gradEnd, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(40,160,160,0.4)",
      }}>
        <IcoPlus s={22} />
      </div>

      {showFab && (
        <NewTeamActionSheetMobile
          onClose={() => setShowFab(false)}
          onNuovoTask={() => { setShowFab(false); setShowNewTask(true); }}
          onNuovaSquadra={() => setShowFab(false)}
          onNuovoProblema={() => setShowFab(false)}
          onAssegnaLavoro={() => setShowFab(false)}
          onApriMappa={() => { setShowFab(false); setView("map"); }}
          onNotaVeloce={() => setShowFab(false)}
        />
      )}

      {showNewTask && (
        <NewTaskSheetMobile
          operators={operators}
          defaultOperatorId={taskDefaultOp}
          onClose={() => { setShowNewTask(false); setTaskDefaultOp(undefined); }}
          onSubmit={() => { setShowNewTask(false); setTaskDefaultOp(undefined); }}
        />
      )}
    </div>
  );
}

// ===== SUB =====
function Pill({ n, col, lbl }: { n: number; col: string; lbl: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.6)",
      borderRadius: 12,
      padding: "8px 6px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: col }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: col, lineHeight: 1, letterSpacing: "-0.3px" }}>{n}</span>
      </div>
      <span style={{ fontSize: 10, color: "#04342C", fontWeight: 500, marginTop: 4 }}>{lbl}</span>
    </div>
  );
}

function InfoRow({ icon, text, extra }: { icon: React.ReactNode; text: string; extra?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1A1A1A" }}>
      <span style={{ color: "#888", flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 400 }}>{text}</span>
      {extra && <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{extra}</span>}
    </div>
  );
}
