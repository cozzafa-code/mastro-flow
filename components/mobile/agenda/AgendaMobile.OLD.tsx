// components/mobile/agenda/AgendaMobile.tsx
"use client";
import React, { useState, useMemo } from "react";
import AgendaEventCardMobile from "./AgendaEventCardMobile";
import AgendaEventSheetMobile from "./AgendaEventSheetMobile";
import AgendaWeekMobile from "./AgendaWeekMobile";
import AgendaMonthMobile from "./AgendaMonthMobile";
import AgendaProblemsMobile from "./AgendaProblemsMobile";
import AgendaBottomNav from "./AgendaBottomNav";
import { useAgendaMobile } from "../../../hooks/useAgendaMobile";
import type { AgendaEvent, AgendaEventType } from "../../../lib/types/agenda";

// ─── PALETTE NAVY 50/20 ──────────────────────────────────────
const TH = {
  bgPage: "#94A3B8",
  bgCard: "#FFFFFF",
  navy: "#1E3A5F",
  navyDark: "#0F1B2D",
  navyLight: "#2D5A87",
  navyMuted: "#475A75",
  navySoft: "#93B0CF",
  ink: "#0A1628",
  sub: "#475A75",
  subLight: "#94A3B8",
  border: "#CBD5E1",
  borderSoft: "#E2E8F0",
  bgPill: "#DBE6F1",
  ambra: "#92400E",
  ambraBg: "#FEF3C7",
  red: "#991B1B",
  redBg: "#FEE2E2",
  green: "#065F46",
  greenBg: "#ECFDF5",
};

interface Props {
  bottomNav?: React.ReactNode;
  hideBottomNav?: boolean;
  cantieri?: any[];
  onOpenCommessa?: (cmId: string | undefined, code: string | undefined) => void;
  onCreateEvent?: (kind: AgendaEventType | "nota", selectedDate: string) => void;
}

const TODAY_ISO = new Date().toISOString().split("T")[0];

export default function AgendaMobile({ bottomNav, hideBottomNav, cantieri, onOpenCommessa, onCreateEvent }: Props) {
  const a = useAgendaMobile(cantieri);
  const [tap, setTap] = useState<AgendaEvent | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [filterTipo, setFilterTipo] = useState<"tutti" | "eventi" | "task">("tutti");
  const [completed, setCompleted] = useState<AgendaEvent | null>(null);

  // ===== Titoli dinamici per vista =====
  const headerTitle = useMemo(() => {
    if (a.view === "mese") {
      const d = new Date(a.selectedDate + "T00:00:00");
      const m = d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
      return m.charAt(0).toUpperCase() + m.slice(1);
    }
    if (a.view === "settimana") {
      const d = new Date(a.selectedDate + "T00:00:00");
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1 - day);
      const s = new Date(d); s.setDate(d.getDate() + diff);
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return `${s.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`;
    }
    const d = new Date(a.selectedDate + "T00:00:00");
    const s = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [a.selectedDate, a.view]);

  // ===== Strip giorni settimana corrente =====
  const weekStrip = useMemo(() => {
    const sel = new Date(a.selectedDate + "T00:00:00");
    const day = sel.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    const start = new Date(sel); start.setDate(sel.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      return d;
    });
  }, [a.selectedDate]);

  const isoOf = (d: Date) => d.toISOString().split("T")[0];

  // ===== Counts per filtri =====
  const allEvents = a.events || [];
  const nEventi = allEvents.filter(e => e.tipo !== "task").length;
  const nTask = allEvents.filter(e => e.tipo === "task").length;
  const nTotal = allEvents.length;

  // ===== Filter applied to current day =====
  const eventsOfDayFiltered = useMemo(() => {
    const list = a.eventsOfDay || [];
    if (filterTipo === "eventi") return list.filter(e => e.tipo !== "task");
    if (filterTipo === "task") return list.filter(e => e.tipo === "task");
    return list;
  }, [a.eventsOfDay, filterTipo]);

  // ===== Navigazione tempo =====
  const navMese = (delta: number) => {
    const d = new Date(a.selectedDate + "T00:00:00");
    d.setMonth(d.getMonth() + delta);
    a.setSelectedDate(d.toISOString().split("T")[0]);
  };
  const navWeek = (delta: number) => {
    const d = new Date(a.selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta * 7);
    a.setSelectedDate(d.toISOString().split("T")[0]);
  };
  const navDay = (delta: number) => {
    const d = new Date(a.selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    a.setSelectedDate(d.toISOString().split("T")[0]);
  };
  const navTime = (delta: number) => {
    if (a.view === "mese") return navMese(delta);
    if (a.view === "settimana") return navWeek(delta);
    return navDay(delta);
  };

  // ===== Action handlers (preservati dal file originale) =====
  const handleAction = (action: any, e: AgendaEvent) => {
    if (action === "mappa" || action === "vai") {
      if (e.indirizzo) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.indirizzo)}`, "_blank");
      return;
    }
    if (action === "chiama") {
      window.alert(`Chiama ${e.cliente || "cliente"}`);
      return;
    }
    if (action === "risolvi") {
      a.completeEvent(e.id);
      setCompleted(e);
      return;
    }
    if (action === "apri" || action === "sollecita" || action === "fattura" || action === "incassa") {
      onOpenCommessa?.(e.cmId, e.commessaCode);
      return;
    }
  };

  const handleSheetAction = (action: any, e: AgendaEvent) => {
    if (action === "vai" || action === "mappa") {
      if (e.indirizzo) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.indirizzo)}`, "_blank");
      return;
    }
    if (action === "chiama") { window.alert(`Chiama ${e.cliente || "cliente"}`); return; }
    if (action === "chat" || action === "foto") { window.alert(`${action.toUpperCase()}: da implementare`); }
  };

  const handleNewItem = (kind: AgendaEventType | "nota") => {
    setShowCreateMenu(false);
    if (onCreateEvent) {
      onCreateEvent(kind, a.selectedDate);
    } else {
      a.addEvent({
        id: "ev_" + Date.now(),
        tipo: kind === "nota" ? "task" : kind,
        oraInizio: "09:00",
        oraFine: "10:00",
        data: a.selectedDate,
        titolo: "Nuovo " + (kind === "nota" ? "appunto" : kind),
      } as AgendaEvent);
    }
  };

  // ===== VISTA PROBLEMI =====
  if (a.view === "problemi") {
    return (
      <div style={{ background: TH.bgPage, minHeight: "100vh", paddingBottom: 90, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        <AgendaProblemsMobile
          events={a.events}
          onSegnala={() => setShowCreateMenu(true)}
          onTap={() => {}}
          onBack={() => a.setView("giorno")}
        />
        {!hideBottomNav && (bottomNav ?? <AgendaBottomNav active="agenda" />)}
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER (mockup approvato)
  // ============================================================
  return (
    <div style={{
      background: TH.bgPage,
      minHeight: "100vh",
      paddingBottom: 90,
      fontFamily: "'Manrope', -apple-system, 'SF Pro Display', system-ui, sans-serif",
      overflowX: "hidden" as any,
    }}>

      {/* ═══ HEADER NAVY MOCKUP ═══ */}
      <div style={{
        background: `linear-gradient(160deg, ${TH.navy} 0%, ${TH.navyDark} 100%)`,
        padding: "calc(env(safe-area-inset-top, 0px) + 16px) 18px 22px",
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        color: "#FFF",
        boxShadow: "0 8px 22px rgba(15,23,42,0.25)",
        marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: TH.navySoft, textTransform: "uppercase" as any }}>Pianificazione</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1, marginTop: 2 }}>Calendario</div>
            <div style={{ fontSize: 12, color: "#B5C8DD", fontWeight: 600, marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span>{nEventi} eventi</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{nTask} task</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Toggle M/S/G */}
            <div style={{
              display: "flex", gap: 2, padding: 3,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 10,
            }}>
              {[
                { v: "mese", short: "M" },
                { v: "settimana", short: "S" },
                { v: "giorno", short: "G" },
              ].map(({ v, short }) => {
                const sel = a.view === v;
                return (
                  <div key={v} onClick={() => a.setView(v as any)} style={{
                    width: 32, height: 28, borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    background: sel ? "#FFF" : "transparent",
                    color: sel ? TH.navy : "rgba(255,255,255,0.65)",
                    fontSize: 11, fontWeight: 800,
                    transition: "all 0.15s",
                  }}>{short}</div>
                );
              })}
            </div>

            {/* Bottone + */}
            <div onClick={() => setShowCreateMenu(true)} style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#FFF", color: TH.navy,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(15,23,42,0.25)",
              marginLeft: 6,
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
          </div>
        </div>

        {/* NAV TITOLO < Mese > */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <div onClick={() => navTime(-1)} style={{
            width: 32, height: 32,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
          </div>

          <div style={{ flex: 1, textAlign: "center" as any }}>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1, textTransform: "capitalize" as any }}>
              {headerTitle}
            </div>
            <div onClick={() => a.setSelectedDate(TODAY_ISO)} style={{ fontSize: 10, color: "#B5C8DD", fontWeight: 600, marginTop: 2, cursor: "pointer", textDecoration: "underline" }}>
              oggi
            </div>
          </div>

          <div onClick={() => navTime(1)} style={{
            width: 32, height: 32,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      {/* ═══ FILTRI CHIPS NAVY/BIANCO ═══ */}
      <div style={{
        padding: "0 14px 10px",
        display: "flex", gap: 6,
        overflowX: "auto",
        scrollbarWidth: "none" as any,
      }}>
        {[
          { id: "tutti", label: "Tutti", count: nTotal },
          { id: "eventi", label: "Eventi", count: nEventi },
          { id: "task", label: "Task", count: nTask },
        ].map(c => {
          const sel = filterTipo === c.id;
          return (
            <div key={c.id} onClick={() => setFilterTipo(c.id as any)} style={{
              background: sel ? TH.navy : "#FFF",
              border: `1px solid ${sel ? TH.navy : TH.subLight}`,
              color: sel ? "#FFF" : TH.sub,
              borderRadius: 999,
              padding: "6px 12px",
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 700,
              whiteSpace: "nowrap" as any, flexShrink: 0,
              cursor: "pointer",
            }}>
              <span>{c.label}</span>
              <span style={{
                background: sel ? "rgba(15,27,45,0.9)" : TH.navyMuted,
                color: "#FFF",
                fontSize: 9, fontWeight: 800,
                padding: "1px 6px", borderRadius: 999,
                minWidth: 18, textAlign: "center" as any,
              }}>{c.count}</span>
            </div>
          );
        })}
      </div>

      {/* ═══ STRIP GIORNI SETTIMANA (sempre visibile in vista giorno) ═══ */}
      {a.view === "giorno" && (
        <div style={{ padding: "0 14px 12px" }}>
          <div style={{ display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none" as any }}>
            {weekStrip.map((d, i) => {
              const isTod = isoOf(d) === TODAY_ISO;
              const isSelected = isoOf(d) === a.selectedDate;
              const isSun = d.getDay() === 0;
              const items = (a.eventsByDate?.[isoOf(d)]) || [];
              return (
                <div key={i} onClick={() => a.setSelectedDate(isoOf(d))} style={{
                  background: isSelected ? TH.navy : "#FFF",
                  border: isSelected ? "none" : `1px solid ${TH.borderSoft}`,
                  borderRadius: 12,
                  padding: "8px 10px",
                  textAlign: "center" as any,
                  minWidth: 46, flexShrink: 0,
                  boxShadow: isSelected ? `0 4px 10px ${TH.navy}55` : "none",
                  cursor: "pointer",
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 800,
                    color: isSelected ? "rgba(255,255,255,0.85)" : (isSun ? TH.red : TH.subLight),
                    textTransform: "uppercase" as any, letterSpacing: 0.4,
                  }}>{isTod ? "OGGI" : d.toLocaleDateString("it-IT", { weekday: "short" }).slice(0, 3)}</div>
                  <div style={{
                    fontSize: 16, fontWeight: 800,
                    color: isSelected ? "#FFF" : (isSun ? TH.red : TH.ink),
                    marginTop: 1,
                  }}>{d.getDate()}</div>
                  {items.length > 0 && !isSelected && (
                    <div style={{ display: "flex", gap: 2, justifyContent: "center", marginTop: 3 }}>
                      {items.slice(0, 3).map((it: any, k: number) => (
                        <div key={k} style={{ width: 4, height: 4, background: TH.navy, borderRadius: 50 }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════ */}
      {/* VISTA GIORNO */}
      {/* ═══════════════════════════════ */}
      {a.view === "giorno" && (
        <>
          <div style={{ padding: "0 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: TH.navy, letterSpacing: 1 }}>
              {a.selectedDate === TODAY_ISO ? "OGGI" : "GIORNO"} · {eventsOfDayFiltered.length} {eventsOfDayFiltered.length === 1 ? "IMPEGNO" : "IMPEGNI"}
            </div>
          </div>

          <div style={{ padding: "0 14px 0" }}>
            {eventsOfDayFiltered.length === 0 ? (
              <div style={{
                background: TH.bgCard,
                border: `1px dashed ${TH.border}`,
                borderRadius: 14,
                padding: 24,
                textAlign: "center" as any,
              }}>
                <div style={{ fontSize: 12, color: TH.sub, marginBottom: 10 }}>Nessun impegno per questo giorno</div>
                <div onClick={() => setShowCreateMenu(true)} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: TH.navy, color: "#FFF",
                  padding: "10px 18px", borderRadius: 10,
                  fontSize: 12, fontWeight: 800,
                  cursor: "pointer",
                }}>+ Aggiungi item</div>
              </div>
            ) : (
              eventsOfDayFiltered.map((e) => (
                <AgendaEventCardMobile key={e.id} event={e} onTap={setTap} onAction={handleAction} />
              ))
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════ */}
      {/* VISTA SETTIMANA */}
      {/* ═══════════════════════════════ */}
      {a.view === "settimana" && (
        <AgendaWeekMobile
          selectedDate={a.selectedDate}
          eventsByDate={a.eventsByDate}
          onSelectDay={a.setSelectedDate}
          onTapEvent={setTap}
        />
      )}

      {/* ═══════════════════════════════ */}
      {/* VISTA MESE */}
      {/* ═══════════════════════════════ */}
      {a.view === "mese" && (
        <AgendaMonthMobile
          selectedDate={a.selectedDate}
          eventsByDate={a.eventsByDate}
          onSelectDay={a.setSelectedDate}
          onTapEvent={setTap}
        />
      )}

      {/* Bottom nav */}
      {!hideBottomNav && (bottomNav ?? <AgendaBottomNav active="agenda" />)}

      {/* Sheet evento */}
      <AgendaEventSheetMobile
        event={tap}
        onClose={() => setTap(null)}
        onAction={handleSheetAction}
        onOpenCommessa={(e) => { onOpenCommessa?.(e.cmId, e.commessaCode); setTap(null); }}
      />

      {/* ═══════════════════════════════ */}
      {/* MODAL CREA ITEM (3 scelte mockup) */}
      {/* ═══════════════════════════════ */}
      {showCreateMenu && (
        <div onClick={() => setShowCreateMenu(false)} style={{
          position: "fixed" as any, inset: 0,
          background: "rgba(15,23,42,0.5)",
          zIndex: 1100,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#FFF",
            width: "100%", maxWidth: 500,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: "16px 18px calc(env(safe-area-inset-bottom, 0px) + 24px)",
          }}>
            <div style={{ width: 36, height: 4, background: TH.border, borderRadius: 2, margin: "0 auto 14px" }} />
            <div style={{ fontSize: 19, fontWeight: 800, color: TH.ink, marginBottom: 4 }}>Cosa vuoi creare?</div>
            <div style={{ fontSize: 11, color: TH.sub, marginBottom: 16 }}>Scegli il tipo di item da aggiungere</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* EVENTO */}
              <div onClick={() => handleNewItem("sopralluogo")} style={{
                border: `2px solid ${TH.navy}`, background: TH.bgPill,
                borderRadius: 12, padding: 14,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: TH.navy, color: "#FFF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink }}>Evento</div>
                  <div style={{ fontSize: 11, color: TH.sub, marginTop: 2 }}>Sopralluogo, posa, riunione...</div>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={TH.navy} strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              {/* TASK PERSONALE */}
              <div onClick={() => handleNewItem("task")} style={{
                border: `1.5px solid ${TH.border}`, background: "#FFF",
                borderRadius: 12, padding: 14,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: "#F1F5F9", color: TH.sub,
                  border: `2px dashed ${TH.subLight}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink }}>Task personale</div>
                  <div style={{ fontSize: 11, color: TH.sub, marginTop: 2 }}>Cose da fare non legate a commesse</div>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={TH.subLight} strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              {/* TASK COMMESSA */}
              <div onClick={() => handleNewItem("task")} style={{
                border: `1.5px solid ${TH.border}`, background: "#FFF",
                borderRadius: 12, padding: 14,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: TH.bgPill, color: TH.navy,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink }}>Task commessa</div>
                  <div style={{ fontSize: 11, color: TH.sub, marginTop: 2 }}>Da fare collegato a una commessa</div>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={TH.navy} strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>

            <div onClick={() => setShowCreateMenu(false)} style={{
              marginTop: 14, padding: 12,
              background: "#F1F5F9", color: TH.sub,
              border: `1px solid ${TH.border}`,
              borderRadius: 10,
              fontSize: 12, fontWeight: 800,
              textAlign: "center" as any, cursor: "pointer",
              letterSpacing: 0.3,
            }}>Annulla</div>
          </div>
        </div>
      )}

      {/* Schermata completato */}
      {completed && <CompletedScreen event={completed} onClose={() => setCompleted(null)} onOpenCommessa={() => { onOpenCommessa?.(completed.cmId, completed.commessaCode); setCompleted(null); }} />}
    </div>
  );
}

function CompletedScreen({ event, onClose, onOpenCommessa }: { event: AgendaEvent; onClose: () => void; onOpenCommessa: () => void }) {
  const confetti = useMemo(() => {
    const arr: { x: number; y: number; c: string; r: number }[] = [];
    const colors = ["#FFD166", "#2D5A87", "#F08599", "#7AA0E0", "#5FBA7D", "#F0A658"];
    for (let i = 0; i < 26; i++) {
      arr.push({ x: Math.random() * 100, y: Math.random() * 60, c: colors[i % colors.length], r: Math.random() * 6 + 3 });
    }
    return arr;
  }, []);

  return (
    <div onClick={onClose} style={{
      position: "fixed" as any, inset: 0,
      background: "linear-gradient(160deg, #1E3A5F 0%, #0F1B2D 100%)",
      zIndex: 1500,
      display: "flex", flexDirection: "column" as any,
      alignItems: "center", justifyContent: "center",
      padding: 28, color: "#fff", overflow: "hidden",
    }}>
      {confetti.map((c, i) => (
        <div key={i} style={{
          position: "absolute" as any,
          top: `${c.y}%`, left: `${c.x}%`,
          width: c.r, height: c.r, borderRadius: "50%",
          background: c.c, opacity: 0.85,
        }} />
      ))}

      <div style={{
        width: 90, height: 90, borderRadius: "50%",
        background: "#1E3A5F",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 22,
        boxShadow: "0 0 0 10px rgba(30,58,95,0.25)",
        zIndex: 1,
      }}>
        <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, zIndex: 1, textAlign: "center" as any }}>
        {event.tipo === "montaggio" ? "Montaggio completato!" : "Completato!"}
      </div>
      <div style={{ fontSize: 13, marginTop: 6, opacity: 0.92, zIndex: 1, textAlign: "center" as any }}>
        {event.commessaCode ? `Commessa ${event.commessaCode}${event.cliente ? " · " + event.cliente : ""}` : event.titolo}
      </div>

      <div style={{ width: "100%", maxWidth: 320, marginTop: 28, display: "flex", flexDirection: "column" as any, gap: 10, zIndex: 1 }}>
        <button onClick={(e) => { e.stopPropagation(); onOpenCommessa(); }} style={{ padding: 13, background: "#1E3A5F", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
          Vai alla commessa
        </button>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ padding: 13, background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Torna all'agenda
        </button>
      </div>
    </div>
  );
}
