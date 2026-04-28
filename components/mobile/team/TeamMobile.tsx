// components/mobile/team/TeamMobile.tsx
// COPIA 1:1 sezione 5 mockup HD. Niente sub-componenti, tutto inline.
"use client";
import React, { useState } from "react";
import { useTeamMobile } from "@/hooks/useTeamMobile";
import { useTeamFilters } from "@/hooks/useTeamFilters";
import type { Operator } from "@/lib/types/team";

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

// PALETTE MOCKUP
const C = {
  grad: "linear-gradient(160deg, #1F8B8B 0%, #176868 100%)",
  pageBg: "#FFFFFF",
  cardBg: "#FFFFFF",
  border: "#E5E7EB",
  text: "#0F172A",
  textGrey: "#64748B",
  pillActive: "#0D1F1F",
  // status
  green: "#22C55E", greenText: "#16A34A", greenBg: "#E8F5EC",
  orange: "#F59E0B", orangeText: "#D97706", orangeBg: "#FEF3C7",
  red: "#EF4444", redText: "#DC2626", redBg: "#FFE4E1",
  blue: "#3B82F6", blueText: "#2563EB", blueBg: "#DBEAFE",
  grey: "#9CA3AF",
  fabBg: "#176868",
};

// ===== ICONE INLINE (Lucide) =====
const Ico = (p: { d?: string; ch?: React.ReactNode; s?: number; sw?: number }) => (
  <svg width={p.s || 16} height={p.s || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw || 2} strokeLinecap="round" strokeLinejoin="round">{p.ch || (p.d ? <path d={p.d} /> : null)}</svg>
);
const IcoMapPin = ({ s = 14 }) => <Ico s={s} ch={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>} />;
const IcoHammer = ({ s = 14 }) => <Ico s={s} ch={<><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/></>} />;
const IcoAlert = ({ s = 14 }) => <Ico s={s} ch={<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>} />;
const IcoClock = ({ s = 14 }) => <Ico s={s} ch={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />;
const IcoNav = ({ s = 14 }) => <Ico s={s} ch={<polygon points="3 11 22 2 13 21 11 13 3 11"/>} />;
const IcoApri = ({ s = 14 }) => <Ico s={s} ch={<><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>} />;
const IcoPhone = ({ s = 14 }) => <Ico s={s} ch={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>} />;
const IcoTask = ({ s = 14 }) => <Ico s={s} ch={<><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></>} />;
const IcoXCircle = ({ s = 14 }) => <Ico s={s} ch={<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>} />;
const IcoChevronRight = ({ s = 18 }) => <Ico s={s} ch={<polyline points="9 18 15 12 9 6"/>} />;
const IcoPlus = ({ s = 22 }) => <Ico s={s} sw={2.5} ch={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;

// ===== AVATAR =====
function Avatar({ name, url, size = 44 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, flexShrink: 0, background: "#F1F5F9" }} />;
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, background: "linear-gradient(135deg,#94A3B8,#64748B)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{init}</div>;
}

// ===== STATUS HELPERS =====
function statusInfo(status: string) {
  switch (status) {
    case "attivo":   return { dot: C.green,  txt: "Attivo ora", txtCol: C.greenText,  bg: C.cardBg };
    case "pausa":    return { dot: C.orange, txt: "In pausa",   txtCol: C.orangeText, bg: C.orangeBg };
    case "problema": return { dot: C.red,    txt: "Problema",   txtCol: C.redText,    bg: C.redBg };
    case "viaggio":  return { dot: C.blue,   txt: "In viaggio", txtCol: C.blueText,   bg: C.blueBg };
    default:         return { dot: C.grey,   txt: "Offline",    txtCol: "#4B5563",    bg: C.cardBg };
  }
}

// ===== MAIN =====
export default function TeamMobile({ hideBottomNav, onOpenCommessa }: Props) {
  const { operators, teams, problems, stats, getTimelineFor } = useTeamMobile();
  const { tab, setTab, filtered } = useTeamFilters(operators);

  const [view, setView] = useState<View>("list");
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [showFab, setShowFab] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskDefaultOp, setTaskDefaultOp] = useState<string | undefined>();

  const handleOpen = (op: Operator) => { setSelectedOp(op); setView("detail"); };
  const handleChiama = (op: Operator) => { if (op.phone) window.location.href = "tel:" + op.phone.replace(/\s/g, ""); };

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
    <div style={{ background: C.pageBg, minHeight: "100vh", paddingBottom: hideBottomNav ? 16 : 100, fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* HEADER GRADIENT */}
      <div style={{ background: C.grad, padding: "16px 16px 20px", color: "#fff" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1 }}>TEAM</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 400, marginTop: 6 }}>
          {stats.total} operatori · {stats.attivi} attivi{stats.probl > 0 ? ` · ${stats.probl} problema${stats.probl > 1 ? "i" : ""}` : ""}
        </div>
      </div>

      {/* PILL TABS */}
      <div style={{ padding: "14px 16px 0", display: "flex", gap: 8 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <div key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "9px 12px", borderRadius: 999, cursor: "pointer",
              background: active ? C.pillActive : "#FFFFFF",
              color: active ? "#FFFFFF" : C.text,
              fontSize: 13, fontWeight: active ? 600 : 500,
              border: active ? "none" : `1px solid ${C.border}`,
              textAlign: "center" as any,
            }}>{t.lbl}</div>
          );
        })}
      </div>

      {(tab === "tutti" || tab === "attivi") && (
        <>
          {/* STATO AZIENDA OGGI */}
          <div style={{
            background: C.cardBg, borderRadius: 16, padding: "14px 16px 16px",
            margin: "14px 16px 0", border: `1px solid ${C.border}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Stato azienda oggi</span>
              <span style={{ color: C.textGrey, display: "flex" }}><IcoChevronRight s={18} /></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <StatItem n={stats.attivi}  col={C.green}  lbl="Attivi" />
              <StatItem n={stats.pausa}   col={C.orange} lbl="In pausa" />
              <StatItem n={stats.probl}   col={C.red}    lbl="Problemi" />
              <StatItem n={stats.offline} col={C.grey}   lbl="Offline" />
            </div>
          </div>

          {/* TITOLO OPERATORI */}
          <div style={{ padding: "20px 16px 4px", fontSize: 16, fontWeight: 600, color: C.text }}>Operatori</div>

          {/* CARDS OPERATORI */}
          <div>
            {filtered.map(op => {
              const s = statusInfo(op.status);
              const cardBg = (op.status === "attivo" || op.status === "offline") ? C.cardBg : s.bg;
              const cardBorder = (op.status === "attivo" || op.status === "offline") ? C.border : "transparent";

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
                  background: cardBg, borderRadius: 16, padding: 16,
                  margin: "12px 16px 0", border: `1px solid ${cardBorder}`,
                  cursor: "pointer",
                }}>
                  {/* HEADER nome + stato */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <Avatar name={op.name} url={op.avatar_url} size={44} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{op.name}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: s.dot }} />
                        <span style={{ fontSize: 12, color: s.txtCol, fontWeight: 600 }}>{s.txt}</span>
                      </span>
                    </div>
                  </div>

                  {/* RIGHE INFO */}
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

                  {/* PROGRESS BAR */}
                  {(op.status === "attivo" || op.status === "pausa") && typeof op.progress === "number" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 6, background: "rgba(13,31,31,0.08)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${op.progress}%`, height: "100%", background: s.dot }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.textGrey, minWidth: 32, textAlign: "right" as any }}>{op.progress}%</span>
                    </div>
                  )}

                  {/* BOTTONI */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {buttons.map((b, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); b.on(); }} style={{
                        flex: 1, padding: "10px 12px", borderRadius: 12,
                        background: C.cardBg,
                        color: b.danger ? C.redText : C.text,
                        border: `1px solid ${b.danger ? C.red + "60" : C.border}`,
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
        background: C.fabBg, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(23,104,104,0.4)",
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

// ===== SUB-COMPONENTS INLINE =====
function StatItem({ n, col, lbl }: { n: number; col: string; lbl: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: col, flexShrink: 0 }} />
        <span style={{ fontSize: 26, fontWeight: 700, color: col, lineHeight: 1, letterSpacing: "-0.5px" }}>{n}</span>
      </div>
      <span style={{ fontSize: 11, color: C.textGrey, fontWeight: 400 }}>{lbl}</span>
    </div>
  );
}

function InfoRow({ icon, text, extra }: { icon: React.ReactNode; text: string; extra?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text }}>
      <span style={{ color: C.textGrey, flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 400 }}>{text}</span>
      {extra && <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{extra}</span>}
    </div>
  );
}
