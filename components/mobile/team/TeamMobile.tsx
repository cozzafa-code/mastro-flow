// components/mobile/team/TeamMobile.tsx
// FASE 3 - wire-up Avvia/Pausa/Riprende/Stop con scrittura DB
"use client";
import React, { useState, useMemo } from "react";
import { useTeamMobile } from "@/hooks/useTeamMobile";
import { useTeamFilters } from "@/hooks/useTeamFilters";
import type { Operator } from "@/lib/types/team";
import { useMastro } from "@/components/MastroContext";
import {
  submitTask, risolviAnomalia, creaAnomalia,
  avviaLavoro, pausaLavoro, riprendiLavoro, stopLavoro,
  type CommessaPerAvvio,
} from "@/lib/team-actions";

import { MiniAppCard, MiniListRow, MiniBadge, MiniLivePulse, TOKENS } from "@/components/widgets/MiniAppCard";
import {
  IconUsers, IconUser, IconPhone, IconPin, IconNav, IconAlert,
  IconClock, IconArrow, IconPause, IconCheck, IconChat, IconFile, IconPlus,
} from "@/components/widgets/shared/icons";

import OperatorDetailMobile from "./OperatorDetailMobile";
import TeamSquadsMobile from "./TeamSquadsMobile";
import TeamProblemsMobile from "./TeamProblemsMobile";
import TeamMapMobile from "./TeamMapMobile";
import NewTaskSheetMobile from "./NewTaskSheetMobile";
import NewTeamActionSheetMobile from "./NewTeamActionSheetMobile";
import StartLavoroSheet from "./StartLavoroSheet";
import TeamPlanningMobile from "./TeamPlanningMobile";

interface Props {
  hideBottomNav?: boolean;
  onOpenCommessa?: (id: string) => void;
  onNavigate?: (tab: string) => void;
}

type View = "list" | "detail" | "map";

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const PAGE_BG = "#F4F1EA";

function Avatar({ name, url, size = 36 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, flexShrink: 0, background: "#F1F5F9" }} />;
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, background: "linear-gradient(135deg,#94A3B8,#64748B)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{init}</div>;
}

function statusInfo(status: string) {
  switch (status) {
    case "attivo":   return { dot: TOKENS.mintBar,  text: "Attivo ora", bg: TOKENS.mint,  fg: TOKENS.mintInk,  bar: TOKENS.mintBar };
    case "pausa":    return { dot: TOKENS.amberBar, text: "In pausa",   bg: TOKENS.amber, fg: TOKENS.amberInk, bar: TOKENS.amberBar };
    case "problema": return { dot: TOKENS.redBar,   text: "Problema",   bg: TOKENS.red,   fg: TOKENS.redInk,   bar: TOKENS.redBar };
    case "viaggio":  return { dot: TOKENS.skyBar,   text: "In viaggio", bg: TOKENS.sky,   fg: TOKENS.skyInk,   bar: TOKENS.skyBar };
    default:         return { dot: "#9CA3AF",       text: "Offline",    bg: TOKENS.hairlineSoft, fg: TOKENS.muted, bar: "#9CA3AF" };
  }
}

export default function TeamMobile({ hideBottomNav, onOpenCommessa, onNavigate }: Props) {
  const mastro: any = (() => { try { return useMastro(); } catch { return {}; } })();
  const user = mastro?.user || {};

  const { operators, teams, problems, stats, getTimelineFor, refetch, loading, error } = useTeamMobile();
  const { tab, setTab, filtered } = useTeamFilters(operators);

  const [view, setView] = useState<View>("list");
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [showFab, setShowFab] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskDefaultOp, setTaskDefaultOp] = useState<string | undefined>();
  const [busy, setBusy] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  // FASE 3: sheet "Avvia lavoro" (selezione commessa)
  const [showStartSheet, setShowStartSheet] = useState<{ op: Operator } | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  // Aggiorna selectedOp dopo refetch (cosi' il dettaglio aperto vede i nuovi dati)
  const syncSelectedOp = () => {
    if (selectedOp) {
      const fresh = operators.find(o => o.id === selectedOp.id);
      if (fresh) setSelectedOp(fresh);
    }
  };

  const handleOpen = (op: Operator) => { setSelectedOp(op); setView("detail"); };

  const handleChiama = (op: Operator) => {
    if (op.phone) window.location.href = "tel:" + op.phone.replace(/\s/g, "");
    else showToast("Telefono non disponibile per " + op.name);
  };

  const handleApriCommessa = (op: Operator) => {
    if (op.commessa_id) onOpenCommessa?.(op.commessa_id);
    else showToast(op.name + " non ha una commessa attiva");
  };

  const handleChat = (op: Operator) => {
    if (onNavigate) onNavigate("messaggi");
    else showToast("Apri Messaggi dal menu");
  };

  const handleMappa = () => setView("map");

  const handleTask = (op?: Operator) => {
    setTaskDefaultOp(op?.id);
    setShowNewTask(true);
  };

  const handleNuovoProblema = async (op?: Operator) => {
    try {
      setBusy(true);
      const titolo = window.prompt("Titolo del problema:");
      if (!titolo) return;
      await creaAnomalia({
        operatore_id: op?.id, commessa_id: op?.commessa_id,
        titolo, severita: "media", origine: "team_app",
      });
      showToast("Problema segnalato");
      await refetch();
    } catch (e: any) {
      showToast("Errore: " + (e?.message || "salvataggio fallito"));
    } finally { setBusy(false); }
  };

  const handleRisolviProblema = async (problemId: string) => {
    try {
      setBusy(true);
      await risolviAnomalia(problemId);
      showToast("Problema risolto");
      await refetch();
    } catch (e: any) {
      showToast("Errore: " + (e?.message || "risoluzione fallita"));
    } finally { setBusy(false); }
  };

  const handleRisolviProblemaOp = async (op: Operator) => {
    const myProblem = problems.find(p =>
      p.status === "aperto" && (
        p.commessa_id === op.commessa_id ||
        p.reported_by === op.name
      )
    );
    if (!myProblem) {
      showToast("Nessun problema aperto per " + op.name);
      return;
    }
    handleRisolviProblema(myProblem.id);
  };

  const handleSubmitTask = async (data: any) => {
    try {
      const operatore = operators.find(o => o.id === taskDefaultOp);
      await submitTask({
        operatore_id: taskDefaultOp,
        operatore_nome: operatore?.name,
        cm_id: data?.cm_id || operatore?.commessa_id,
        cliente: data?.cliente || operatore?.cliente,
        titolo: data?.titolo || data?.task || "Nuovo task",
        note: data?.note,
        giorno: data?.giorno,
        ora_inizio: data?.ora_inizio,
      });
      showToast("Task creato");
      setShowNewTask(false);
      setTaskDefaultOp(undefined);
      await refetch();
    } catch (e: any) {
      showToast("Errore: " + (e?.message || "salvataggio fallito"));
    }
  };

  // === FASE 3 HANDLERS ===
  const handleAvvia = (op: Operator) => {
    // Apre sheet selezione commessa
    setShowStartSheet({ op });
  };

  const handleStartConfirm = async (commessa: CommessaPerAvvio) => {
    if (!showStartSheet) return;
    const opTarget = showStartSheet.op;
    setShowStartSheet(null);
    try {
      setBusy(true);
      await avviaLavoro({ operatore_id: opTarget.id, commessa_id: commessa.id });
      showToast(`${opTarget.name} ha avviato ${commessa.code || "il lavoro"}`);
      await refetch();
      syncSelectedOp();
    } catch (e: any) {
      showToast("Errore: " + (e?.message || "avvio fallito"));
    } finally { setBusy(false); }
  };

  const handlePausa = async (op: Operator) => {
    try {
      setBusy(true);
      await pausaLavoro({ operatore_id: op.id, motivo: "manuale" });
      showToast(`${op.name} in pausa`);
      await refetch();
      syncSelectedOp();
    } catch (e: any) {
      showToast("Errore: " + (e?.message || "pausa fallita"));
    } finally { setBusy(false); }
  };

  const handleRiprende = async (op: Operator) => {
    try {
      setBusy(true);
      await riprendiLavoro({ operatore_id: op.id });
      showToast(`${op.name} ha ripreso`);
      await refetch();
      syncSelectedOp();
    } catch (e: any) {
      showToast("Errore: " + (e?.message || "ripresa fallita"));
    } finally { setBusy(false); }
  };

  const handleStop = async (op: Operator) => {
    try {
      setBusy(true);
      await stopLavoro({ operatore_id: op.id });
      showToast(`${op.name} ha completato`);
      await refetch();
      syncSelectedOp();
    } catch (e: any) {
      showToast("Errore: " + (e?.message || "stop fallito"));
    } finally { setBusy(false); }
  };

  const handleTapKPI = (which: "attivi" | "pausa" | "problemi" | "offline") => {
    if (which === "problemi") setTab("problemi");
    else setTab("attivi");
  };

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
      <>
        <OperatorDetailMobile
          op={selectedOp}
          timeline={getTimelineFor(selectedOp.id)}
          onBack={() => { setView("list"); setSelectedOp(null); }}
          onChiama={() => handleChiama(selectedOp)}
          onMappa={() => setView("map")}
          onChat={() => handleChat(selectedOp)}
          onFoto={() => showToast("Foto: in arrivo")}
          onTask={() => handleTask(selectedOp)}
          onProblema={() => handleNuovoProblema(selectedOp)}
          onVaiCommessa={() => selectedOp.commessa_id && onOpenCommessa?.(selectedOp.commessa_id)}
          onAvvia={() => handleAvvia(selectedOp)}
          onPausa={() => handlePausa(selectedOp)}
          onRiprende={() => handleRiprende(selectedOp)}
          onStop={() => handleStop(selectedOp)}
          onAssegnaTask={() => handleTask(selectedOp)}
          busy={busy}
        />
        {showStartSheet && (
          <StartLavoroSheet
            operatorName={showStartSheet.op.name}
            onClose={() => setShowStartSheet(null)}
            onSelect={handleStartConfirm}
          />
        )}
        {toast && (
          <div style={{
            position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
            background: "#0D1F1F", color: "#FFF", padding: "10px 16px", borderRadius: 12,
            fontSize: 12, fontWeight: 500, zIndex: 10000, boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            maxWidth: "85%", textAlign: "center" as any,
          }}>{toast}</div>
        )}
      </>
    );
  }
  if (view === "map") {
    return <TeamMapMobile operators={operators} onBack={() => setView("list")} onOpenOperator={(op) => { setSelectedOp(op); setView("detail"); }} />;
  }

  const TABS: { id: any; lbl: string; n?: number }[] = [
    { id: "tutti", lbl: "Tutti", n: stats.total },
    { id: "attivi", lbl: "Attivi", n: stats.attivi },
    { id: "pianificazione", lbl: "Piano" },
    { id: "squadre", lbl: "Squadre", n: teams.length },
    { id: "problemi", lbl: "Problemi", n: problems.filter(p => p.status === "aperto").length },
  ];

  return (
    <div style={{ background: PAGE_BG, minHeight: "100vh", paddingBottom: hideBottomNav ? 16 : 100, fontFamily: FONT }}>

      <div style={{ padding: "12px 10px 0" }}>
        <div style={{
          background: `linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)`,
          padding: "18px 18px 20px", borderRadius: 22,
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
              <div onClick={() => onNavigate?.("agenda")} style={{ background: "#FFFFFF", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                <IconUsers size={14} color="#28A0A0" strokeWidth={2.2} />
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                  <span style={{ color: "#28A0A0", fontSize: 9, fontWeight: 700, letterSpacing: 0.4 }}>TEAM</span>
                  <span style={{ color: "#1A1A1A", fontSize: 10, fontWeight: 600, marginTop: 1 }}>{stats.attivi} attivi</span>
                </div>
              </div>
              <div onClick={() => onNavigate?.("altro")} style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </div>
              <div onClick={() => onNavigate?.("settings")} style={{ width: 34, height: 34, borderRadius: 50, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#28A0A0", fontSize: 12, fontWeight: 600, marginLeft: 4, cursor: "pointer" }}>{iniziali}</div>
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 400, letterSpacing: 0.5 }}>{greeting}</div>
          <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 600, marginTop: 2, letterSpacing: -0.5 }}>{nome}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{dataLunga}</div>
        </div>
      </div>

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

      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 12 }}>

        {loading && (
          <div style={{ padding: 24, textAlign: "center" as any, color: TOKENS.muted, fontSize: 13 }}>Caricamento operatori...</div>
        )}
        {!loading && error && (
          <div style={{ background: TOKENS.red, color: TOKENS.redInk, padding: 14, borderRadius: 14, fontSize: 12 }}>
            {error === "not_authenticated" ? "Devi accedere per vedere il team." :
             error === "no_azienda" ? "Profilo azienda non trovato." :
             "Errore caricamento: " + error}
          </div>
        )}
        {!loading && !error && operators.length === 0 && (
          <div style={{ background: "#FFF", borderRadius: 22, padding: 24, textAlign: "center" as any, border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13, color: TOKENS.inkSoft, marginBottom: 10 }}>Nessun operatore registrato</div>
            <button onClick={() => onNavigate?.("settings")} style={{ background: TOKENS.teal, color: "#FFF", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Aggiungi operatore</button>
          </div>
        )}

        {!loading && !error && operators.length > 0 && (tab === "tutti" || tab === "attivi") && (
          <>
            <MiniAppCard
              icon={<IconUsers size={14} color={TOKENS.teal} />}
              title="Stato azienda oggi"
              subtitle={`${stats.total} operatori in linea`}
              onOpen={() => setTab("attivi")}
              openLabel="dettagli"
              heroVariant="teal"
              hero={
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  <KPI n={stats.attivi}  col={TOKENS.mintBar}  inkCol={TOKENS.mintInk}  lbl="Attivi"   onClick={() => handleTapKPI("attivi")} />
                  <KPI n={stats.pausa}   col={TOKENS.amberBar} inkCol={TOKENS.amberInk} lbl="In pausa" onClick={() => handleTapKPI("pausa")} />
                  <KPI n={stats.probl}   col={TOKENS.redBar}   inkCol={TOKENS.redInk}   lbl="Problemi" onClick={() => handleTapKPI("problemi")} />
                  <KPI n={stats.offline} col="#9CA3AF"          inkCol="#555555"          lbl="Offline"  onClick={() => handleTapKPI("offline")} />
                </div>
              }
            />

            {filtered.map(op => {
              const s = statusInfo(op.status);
              const actions: any[] = [];

              // FASE 3: bottoni stato dinamici inline su card
              if (op.status === "attivo") {
                actions.push({ label: "Pausa", variant: "secondary", icon: <IconPause size={11} color={TOKENS.amberInk} />, onClick: () => handlePausa(op), disabled: busy });
                actions.push({ label: "Stop",  variant: "danger", icon: <IconCheck size={11} color={TOKENS.redInk} />, onClick: () => handleStop(op), disabled: busy });
                actions.push({ label: "Apri",  variant: "secondary", icon: <IconFile size={11} color={TOKENS.ink} />, onClick: () => handleApriCommessa(op) });
              } else if (op.status === "pausa") {
                actions.push({ label: "Riprendi", variant: "primary", icon: <IconCheck size={11} color="#FFF" />, onClick: () => handleRiprende(op), disabled: busy });
                actions.push({ label: "Stop",     variant: "danger", icon: <IconCheck size={11} color={TOKENS.redInk} />, onClick: () => handleStop(op), disabled: busy });
                actions.push({ label: "Apri",     variant: "secondary", icon: <IconFile size={11} color={TOKENS.ink} />, onClick: () => handleApriCommessa(op) });
              } else if (op.status === "problema") {
                actions.push({ label: "Risolvi", variant: "danger", icon: <IconCheck size={11} color={TOKENS.redInk} />, onClick: () => handleRisolviProblemaOp(op), disabled: busy });
                actions.push({ label: "Chiama",  variant: "secondary", icon: <IconPhone size={11} color={TOKENS.ink} />, onClick: () => handleChiama(op) });
                actions.push({ label: "Apri",    variant: "secondary", icon: <IconFile size={11} color={TOKENS.ink} />, onClick: () => handleApriCommessa(op) });
              } else if (op.status === "viaggio") {
                actions.push({ label: "Avvia",   variant: "primary", icon: <IconCheck size={11} color="#FFF" />, onClick: () => handleAvvia(op), disabled: busy });
                actions.push({ label: "Chiama",  variant: "secondary", icon: <IconPhone size={11} color={TOKENS.ink} />, onClick: () => handleChiama(op) });
                actions.push({ label: "Mappa",   variant: "secondary", icon: <IconPin size={11} color={TOKENS.ink} />, onClick: () => handleMappa() });
              } else {
                // Offline
                actions.push({ label: "Avvia lavoro", variant: "primary", icon: <IconCheck size={11} color="#FFF" />, onClick: () => handleAvvia(op), disabled: busy });
                actions.push({ label: "Chiama", variant: "secondary", icon: <IconPhone size={11} color={TOKENS.ink} />, onClick: () => handleChiama(op) });
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
                               op.status === "viaggio"  ? "PROGRAMMATO OGGI" :
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

        {!loading && !error && tab === "pianificazione" && (
          <TeamPlanningMobile
            operators={operators}
            onOpenCommessa={onOpenCommessa}
            onPlanned={() => refetch()}
          />
        )}

        {!loading && !error && tab === "squadre" && (
          teams.length === 0 ? (
            <MiniAppCard
              icon={<IconUsers size={14} color={TOKENS.teal} />}
              title="Nessuna squadra"
              subtitle="Crea la tua prima squadra"
              heroVariant="none"
              actions={[{ label: "+ Nuova squadra", variant: "primary", onClick: () => onNavigate?.("settings") }]}
            />
          ) : (
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
                  onClick={() => showToast("Dettaglio squadra: in arrivo")}
                />
              ))}
            </MiniAppCard>
          )
        )}

        {!loading && !error && tab === "problemi" && (
          problems.filter(p => p.status === "aperto").length === 0 ? (
            <MiniAppCard
              icon={<IconCheck size={14} color={TOKENS.mintInk} />}
              iconBg={TOKENS.mint}
              iconColor={TOKENS.mintInk}
              title="Nessun problema aperto"
              subtitle="Tutto sotto controllo"
              heroVariant="mint"
            />
          ) : (
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
                  onClick={() => pb.commessa_id && onOpenCommessa?.(pb.commessa_id)}
                  alert={pb.priority === "Alta"}
                  actions={[{ icon: <IconCheck size={12} color={TOKENS.mintInk} />, color: TOKENS.mint, onClick: () => handleRisolviProblema(pb.id) }]}
                />
              ))}
            </MiniAppCard>
          )
        )}
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: hideBottomNav ? 90 : 140, left: "50%", transform: "translateX(-50%)",
          background: "#0D1F1F", color: "#FFF", padding: "10px 16px", borderRadius: 12,
          fontSize: 12, fontWeight: 500, zIndex: 200, boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          maxWidth: "85%", textAlign: "center" as any,
        }}>{toast}</div>
      )}

      <div onClick={() => setShowFab(true)} style={{
        position: "fixed",
        bottom: hideBottomNav ? 24 : 80,
        right: 16, zIndex: 100,
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
          onNuovoTask={() => { setShowFab(false); handleTask(); }}
          onNuovaSquadra={() => { setShowFab(false); onNavigate?.("settings"); }}
          onNuovoProblema={() => { setShowFab(false); handleNuovoProblema(); }}
          onAssegnaLavoro={() => { setShowFab(false); handleTask(); }}
          onApriMappa={() => { setShowFab(false); setView("map"); }}
          onNotaVeloce={() => { setShowFab(false); showToast("Nota veloce: in arrivo"); }}
        />
      )}

      {showNewTask && (
        <NewTaskSheetMobile
          operators={operators}
          defaultOperatorId={taskDefaultOp}
          onClose={() => { setShowNewTask(false); setTaskDefaultOp(undefined); }}
          onSubmit={handleSubmitTask}
        />
      )}

      {showStartSheet && (
        <StartLavoroSheet
          operatorName={showStartSheet.op.name}
          onClose={() => setShowStartSheet(null)}
          onSelect={handleStartConfirm}
        />
      )}
    </div>
  );
}

function KPI({ n, col, inkCol, lbl, onClick }: { n: number; col: string; inkCol: string; lbl: string; onClick?: () => void }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onClick?.(); }} style={{
      background: "rgba(255,255,255,0.65)",
      borderRadius: 12,
      padding: "8px 6px",
      display: "flex", flexDirection: "column", alignItems: "center",
      cursor: onClick ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: col }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: inkCol, lineHeight: 1, letterSpacing: "-0.3px" }}>{n}</span>
      </div>
      <span style={{ fontSize: 10, color: inkCol, fontWeight: 500, marginTop: 4 }}>{lbl}</span>
    </div>
  );
}
