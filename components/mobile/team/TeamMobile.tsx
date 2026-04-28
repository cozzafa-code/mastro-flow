// components/mobile/team/TeamMobile.tsx
// STILE MASTRO ufficiale - usa MiniAppCard del design system esistente
"use client";
import React, { useState, useMemo } from "react";
import { useTeamMobile } from "@/hooks/useTeamMobile";
import { useTeamFilters } from "@/hooks/useTeamFilters";
import type { Operator } from "@/lib/types/team";
import { useMastro } from "@/components/MastroContext";

import { MiniAppCard, MiniListRow, MiniBadge, MiniLivePulse, TOKENS } from "@/components/widgets/MiniAppCard";
import {
  IconUsers, IconUser, IconPhone, IconPin, IconNav, IconAlert,
  IconClock, IconArrow, IconPause, IconCheck, IconChat, IconFile, IconPlus, IconRefresh,
} from "@/components/widgets/shared/icons";

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

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const PAGE_BG = "#F4F1EA";

// ---- Avatar ----
function Avatar({ name, url, size = 36 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, flexShrink: 0, background: "#F1F5F9" }} />;
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, background: "linear-gradient(135deg,#94A3B8,#64748B)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{init}</div>;
}

// ---- Stato visivo per operatore ----
function statusInfo(status: string) {
  switch (status) {
    case "attivo":   return { dot: TOKENS.mintBar,  text: "Attivo ora", bg: TOKENS.mint,  fg: TOKENS.mintInk,  bar: TOKENS.mintBar };
    case "pausa":    return { dot: TOKENS.amberBar, text: "In pausa",   bg: TOKENS.amber, fg: TOKENS.amberInk, bar: TOKENS.amberBar };
    case "problema": return { dot: TOKENS.redBar,   text: "Problema",   bg: TOKENS.red,   fg: TOKENS.redInk,   bar: TOKENS.redBar };
    case "viaggio":  return { dot: TOKENS.skyBar,   text: "In viaggio", bg: TOKENS.sky,   fg: TOKENS.skyInk,   bar: TOKENS.skyBar };
    default:         return { dot: "#9CA3AF",       text: "Offline",    bg: TOKENS.hairlineSoft, fg: TOKENS.muted, bar: "#9CA3AF" };
  }
}

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

  // --- Saluto / nome / data (stile HomePanelMobile) ---
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

  const TABS: { id: any; lbl: string; n?: number }[] = [
    { id: "tutti", lbl: "Tutti", n: stats.total },
    { id: "attivi", lbl: "Attivi", n: stats.attivi },
    { id: "squadre", lbl: "Squadre", n: teams.length },
    { id: "problemi", lbl: "Problemi", n: problems.filter(p => p.status === "aperto").length },
  ];

  return (
    <div style={{ background: PAGE_BG, minHeight: "100vh", paddingBottom: hideBottomNav ? 16 : 100, fontFamily: FONT }}>

      {/* HEADER fliwoX (clone HomePanelMobile) */}
      <div style={{ padding: "12px 10px 0" }}>
        <div style={{
          background: `linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)`,
          padding: "18px 18px 20px",
          borderRadius: 22,
          boxShadow: "0 4px 16px rgba(40,160,160,0.18)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth={3}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </div>
              <span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 500 }}>fliwoX</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 7 }}>
                <IconUsers size={14} color="#28A0A0" strokeWidth={2.2} />
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                  <span style={{ color: "#28A0A0", fontSize: 9, fontWeight: 700, letterSpacing: 0.4 }}>TEAM</span>
                  <span style={{ color: "#1A1A1A", fontSize: 10, fontWeight: 600, marginTop: 1 }}>{stats.attivi} attivi</span>
                </div>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 50, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#28A0A0", fontSize: 12, fontWeight: 600, marginLeft: 4 }}>{iniziali}</div>
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 400, letterSpacing: 0.5 }}>{greeting}</div>
          <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 600, marginTop: 2, letterSpacing: -0.5 }}>{nome}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{dataLunga}</div>
        </div>
      </div>

      {/* PILL TABS */}
      <div style={{ padding: "14px 14px 0", display: "flex", gap: 6 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <div key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "9px 10px", borderRadius: 14, cursor: "pointer",
              background: active ? "#1A1A1A" : "#FFFFFF",
              color: active ? "#FFFFFF" : "#1A1A1A",
              fontSize: 12, fontWeight: active ? 600 : 500,
              border: active ? "none" : `1px solid ${TOKENS.hairline}`,
              textAlign: "center" as any,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              <span>{t.lbl}</span>
              {typeof t.n === "number" && t.n > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: active ? "rgba(255,255,255,0.2)" : TOKENS.hairlineSoft,
                  color: active ? "#FFFFFF" : TOKENS.muted,
                  borderRadius: 999, padding: "1px 6px", minWidth: 14, textAlign: "center" as any,
                }}>{t.n}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* CONTENUTI TABS */}
      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 12 }}>

        {(tab === "tutti" || tab === "attivi") && (
          <>
            {/* === Card 1: Stato azienda oggi === */}
            <MiniAppCard
              icon={<IconUsers size={14} color={TOKENS.teal} />}
              title="Stato azienda oggi"
              subtitle={`${stats.total} operatori in linea`}
              onOpen={() => {}}
              openLabel="dettagli"
              heroVariant="teal"
              hero={
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  <KPI n={stats.attivi}  col={TOKENS.mintBar}  inkCol={TOKENS.mintInk}  lbl="Attivi" />
                  <KPI n={stats.pausa}   col={TOKENS.amberBar} inkCol={TOKENS.amberInk} lbl="In pausa" />
                  <KPI n={stats.probl}   col={TOKENS.redBar}   inkCol={TOKENS.redInk}   lbl="Problemi" />
                  <KPI n={stats.offline} col="#9CA3AF"          inkCol="#555555"          lbl="Offline" />
                </div>
              }
            />

            {/* === Card 2..N: una card per operatore === */}
            {filtered.map(op => {
              const s = statusInfo(op.status);

              const actions: any[] = [];
              if (op.status === "problema") {
                actions.push({ label: "Risolvi", variant: "danger", icon: <IconCheck size={11} color={TOKENS.redInk} />, onClick: () => handleOpen(op) });
                actions.push({ label: "Chiama",  variant: "secondary", icon: <IconPhone size={11} color={TOKENS.ink} />, onClick: () => handleChiama(op) });
              } else if (op.status === "viaggio") {
                actions.push({ label: "Traccia", variant: "primary",   icon: <IconNav size={11} color="#fff" />, onClick: () => setView("map") });
                actions.push({ label: "Chiama",  variant: "secondary", icon: <IconPhone size={11} color={TOKENS.ink} />, onClick: () => handleChiama(op) });
              } else if (op.status === "pausa") {
                actions.push({ label: "Apri", variant: "secondary", icon: <IconFile size={11} color={TOKENS.ink} />, onClick: () => handleOpen(op) });
                actions.push({ label: "Task", variant: "secondary", icon: <IconPlus size={11} color={TOKENS.ink} />, onClick: () => { setTaskDefaultOp(op.id); setShowNewTask(true); } });
              } else {
                actions.push({ label: "Apri",   variant: "secondary", icon: <IconFile size={11} color={TOKENS.ink} />, onClick: () => handleOpen(op) });
                actions.push({ label: "Chiama", variant: "secondary", icon: <IconPhone size={11} color={TOKENS.ink} />, onClick: () => handleChiama(op) });
                actions.push({ label: "Mappa",  variant: "secondary", icon: <IconPin size={11} color={TOKENS.ink} />, onClick: () => setView("map") });
              }

              return (
                <MiniAppCard
                  key={op.id}
                  icon={<IconUser size={14} color={s.fg} />}
                  iconBg={s.bg}
                  iconColor={s.fg}
                  title={op.name}
                  subtitle={op.position_label || op.current_job}
                  badge={{ label: s.text.toUpperCase(), bg: s.bg, fg: s.fg }}
                  onOpen={() => handleOpen(op)}
                  heroVariant={op.status === "attivo" ? "mint" : op.status === "pausa" ? "amber" : op.status === "problema" ? "red" : op.status === "viaggio" ? "sky" : "none"}
                  hero={
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Avatar name={op.name} url={op.avatar_url} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            {op.status === "attivo" && <MiniLivePulse color={s.bar} size={6} />}
                            <span style={{ fontSize: 9, fontWeight: 700, color: s.fg, letterSpacing: 0.4 }}>
                              {op.status === "problema" ? "PROBLEMA APERTO" :
                               op.status === "viaggio"  ? "IN VIAGGIO" :
                               op.status === "pausa"    ? "IN PAUSA" :
                               op.status === "attivo"   ? "ATTIVO ORA" : "OFFLINE"}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.25 }}>
                            {op.current_job || op.problem_title || op.destination_label || op.position_label || "—"}
                          </div>
                          {(op.cliente || op.timer_label) && (
                            <div style={{ fontSize: 10, color: TOKENS.inkSoft, marginTop: 2 }}>
                              {op.cliente && <>{op.cliente}{op.timer_label ? " · " : ""}</>}
                              {op.timer_label}
                              {op.problem_reported_ago && <> · segnalato {op.problem_reported_ago}</>}
                              {op.arrival_eta && <> · arrivo {op.arrival_eta}</>}
                            </div>
                          )}
                        </div>
                      </div>
                      {(op.status === "attivo" || op.status === "pausa") && typeof op.progress === "number" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                          <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.55)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ width: `${op.progress}%`, height: "100%", background: s.bar, borderRadius: 999 }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: s.fg, minWidth: 28, textAlign: "right" as any }}>{op.progress}%</span>
                        </div>
                      )}
                    </div>
                  }
                  actions={actions}
                />
              );
            })}
          </>
        )}

        {tab === "squadre" && (
          <MiniAppCard
            icon={<IconUsers size={14} color={TOKENS.teal} />}
            title="Squadre attive"
            subtitle={`${teams.length} squadre · ${teams.reduce((a, t) => a + t.active_count, 0)} operatori`}
            heroVariant="none"
          >
            {teams.map((sq, i) => (
              <MiniListRow
                key={sq.id}
                isFirst={i === 0}
                leading={<div style={{ width: 28, height: 28, borderRadius: 8, background: TOKENS.tealLight, display: "flex", alignItems: "center", justifyContent: "center" }}><IconUsers size={13} color={TOKENS.teal} /></div>}
                bar={sq.problem_count > 0 ? TOKENS.redBar : TOKENS.mintBar}
                title={sq.name}
                subtitle={`${sq.members.join(", ")} · ${sq.current_job || ""}`}
                trailing={<MiniBadge label={sq.problem_count > 0 ? `${sq.problem_count} prob.` : `${sq.active_count} attivi`} bg={sq.problem_count > 0 ? TOKENS.red : TOKENS.mint} fg={sq.problem_count > 0 ? TOKENS.redInk : TOKENS.mintInk} />}
                onClick={() => {}}
              />
            ))}
          </MiniAppCard>
        )}

        {tab === "problemi" && (
          <MiniAppCard
            icon={<IconAlert size={14} color={TOKENS.redInk} />}
            iconBg={TOKENS.red}
            iconColor={TOKENS.redInk}
            title="Problemi aperti"
            subtitle={`${problems.filter(p => p.status === "aperto").length} in attesa di risoluzione`}
            heroVariant="none"
          >
            {problems.filter(p => p.status === "aperto").map((pb, i) => (
              <MiniListRow
                key={pb.id}
                isFirst={i === 0}
                bar={pb.priority === "Alta" ? TOKENS.redBar : pb.priority === "Media" ? TOKENS.amberBar : TOKENS.mintBar}
                title={pb.title}
                subtitle={`${pb.commessa_label || pb.ordine_label || ""} · ${pb.reported_by} · ${pb.reported_ago}`}
                trailing={<MiniBadge label={pb.priority.toUpperCase()} bg={pb.priority === "Alta" ? TOKENS.red : TOKENS.amber} fg={pb.priority === "Alta" ? TOKENS.redInk : TOKENS.amberInk} />}
                onClick={() => {}}
                alert={pb.priority === "Alta"}
              />
            ))}
          </MiniAppCard>
        )}

      </div>

      {/* FAB */}
      <div onClick={() => setShowFab(true)} style={{
        position: "fixed",
        bottom: hideBottomNav ? 24 : 80,
        right: 16,
        zIndex: 100,
        width: 48, height: 48, borderRadius: 999,
        background: "#1E8080", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(40,160,160,0.4)",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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

// ---- KPI cell dentro hero ----
function KPI({ n, col, inkCol, lbl }: { n: number; col: string; inkCol: string; lbl: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.65)",
      borderRadius: 12,
      padding: "8px 6px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: col }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: inkCol, lineHeight: 1, letterSpacing: "-0.3px" }}>{n}</span>
      </div>
      <span style={{ fontSize: 10, color: inkCol, fontWeight: 500, marginTop: 4 }}>{lbl}</span>
    </div>
  );
}
