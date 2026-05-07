// components/mobile/agenda/AgendaMobile.tsx
"use client";
import React, { useState, useMemo } from "react";
import AgendaHeaderMobile from "./AgendaHeaderMobile";
import AgendaDayStripMobile from "./AgendaDayStripMobile";
import AgendaEventCardMobile from "./AgendaEventCardMobile";
import AgendaEventSheetMobile from "./AgendaEventSheetMobile";
import AgendaFabSheetMobile from "./AgendaFabSheetMobile";
import AgendaFiltersMobile from "./AgendaFiltersMobile";
import AgendaWeekMobile from "./AgendaWeekMobile";
import AgendaMonthMobile from "./AgendaMonthMobile";
import AgendaProblemsMobile from "./AgendaProblemsMobile";
import AgendaBottomNav from "./AgendaBottomNav";
import { useAgendaMobile } from "../../../hooks/useAgendaMobile";
import type { AgendaEvent } from "../../../lib/types/agenda";

interface Props {
  bottomNav?: React.ReactNode;
  hideBottomNav?: boolean;
  cantieri?: any[];
  onOpenCommessa?: (cmId: string | undefined, code: string | undefined) => void;
  onCreateEvent?: (kind: "montaggio" | "sopralluogo" | "produzione" | "problema" | "task" | "nota", selectedDate: string) => void;
}

const TODAY_ISO = new Date().toISOString().split("T")[0];

function formatHeaderSub(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const s = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatHeaderTitle(view: "giorno" | "settimana" | "mese") {
  if (view === "settimana") return "Settimana";
  if (view === "mese") return "Mese";
  return "Agenda";
}

export default function AgendaMobile({ bottomNav, hideBottomNav, cantieri, onOpenCommessa, onCreateEvent }: Props) {
  const a = useAgendaMobile(cantieri);
  const [tap, setTap] = useState<AgendaEvent | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [completed, setCompleted] = useState<AgendaEvent | null>(null);

  const headerSub = useMemo(() => {
    if (a.view === "settimana") {
      const d = new Date(a.selectedDate + "T00:00:00");
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1 - day);
      const s = new Date(d); s.setDate(d.getDate() + diff);
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return `${s.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`;
    }
    if (a.view === "mese") {
      const d = new Date(a.selectedDate + "T00:00:00");
      const m = d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
      return m.charAt(0).toUpperCase() + m.slice(1);
    }
    return formatHeaderSub(a.selectedDate);
  }, [a.selectedDate, a.view]);

  const handleAction = (action: "vai" | "chiama" | "mappa" | "risolvi" | "apri" | "sollecita" | "fattura" | "incassa", e: AgendaEvent) => {
    if (action === "mappa" || action === "vai") {
      if (e.indirizzo) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.indirizzo)}`, "_blank");
      return;
    }
    if (action === "chiama") {
      window.alert(`Chiama ${e.cliente || "cliente"}: numero non disponibile in MOCK`);
      return;
    }
    if (action === "risolvi") {
      a.completeEvent(e.id);
      setCompleted(e);
      return;
    }
    // === Azioni documentali ===
    if (action === "apri") {
      // Apre la commessa nel pannello MastroERP
      onOpenCommessa?.(e.cmId, e.commessaCode);
      return;
    }
    if (action === "sollecita") {
      // Per ora apre la commessa, l'utente sollecita da lì
      onOpenCommessa?.(e.cmId, e.commessaCode);
      return;
    }
    if (action === "fattura") {
      onOpenCommessa?.(e.cmId, e.commessaCode);
      return;
    }
    if (action === "incassa") {
      onOpenCommessa?.(e.cmId, e.commessaCode);
      return;
    }
  };

  const handleSheetAction = (action: "vai" | "chiama" | "mappa" | "chat" | "foto", e: AgendaEvent) => {
    if (action === "vai" || action === "mappa") {
      if (e.indirizzo) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.indirizzo)}`, "_blank");
      return;
    }
    if (action === "chiama") { window.alert(`Chiama ${e.cliente || "cliente"}`); return; }
    if (action === "chat" || action === "foto") { window.alert(`${action.toUpperCase()}: da implementare`); }
  };

  // ===== VISTA PROBLEMI =====
  if (a.view === "problemi") {
    return (
      <div style={{ background: "#94A3B8", minHeight: "100vh", paddingBottom: 90, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        <AgendaProblemsMobile
          events={a.events}
          onSegnala={() => setFabOpen(true)}
          onTap={() => {}}
          onBack={() => a.setView("giorno")}
        />
        {!hideBottomNav && (bottomNav ?? <AgendaBottomNav active="agenda" />)}
      </div>
    );
  }

  return (
    <div style={{ background: "#94A3B8", minHeight: "100vh", paddingBottom: 90, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      {/* HEADER GRADIENT con TUTTO dentro: titolo + day strip + switch */}
      <AgendaHeaderMobile
        title={formatHeaderTitle(a.view)}
        subtitle={headerSub}
        onMenu={() => a.setView("problemi")}
      >
        {a.view === "giorno" && (
          <AgendaDayStripMobile selectedDate={a.selectedDate} onSelect={a.setSelectedDate} inHeader />
        )}

        {/* Switch GIORNO/SETTIMANA/MESE — pill bianco active */}
        <div style={{ display: "flex", gap: 6, marginTop: 14, justifyContent: "center" }}>
          {(["giorno", "settimana", "mese"] as const).map((v) => {
            const active = a.view === v;
            return (
              <div
                key={v}
                onClick={() => a.setView(v)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: active ? "#fff" : "rgba(255,255,255,0.12)",
                  color: active ? "#0A1628" : "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,
                  cursor: "pointer",
                  border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.18)",
                  textTransform: "capitalize" as const,
                  transition: "all 0.15s",
                  boxShadow: active ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                }}
              >
                {v}
              </div>
            );
          })}
        </div>
      </AgendaHeaderMobile>

      {/* === VISTA GIORNO === */}
      {a.view === "giorno" && (
        <>
          {/* Riepilogo documenti urgenti (oltre operativo) */}
          {(() => {
            const docUrgenti = a.eventsOfDay.filter((e) => e.isAllDay && (e.tipo === "firma" || (e.tipo === "saldo" && e.stato === "urgente") || (e.tipo === "preventivo" && e.stato === "urgente")));
            const conteggi = a.eventsOfDay.filter((e) => e.isAllDay).reduce((acc: Record<string, number>, e) => {
              acc[e.tipo] = (acc[e.tipo] || 0) + 1;
              return acc;
            }, {});
            const totDoc = Object.values(conteggi).reduce((s, n) => s + n, 0);
            if (totDoc === 0) return null;
            const summary: string[] = [];
            if (conteggi.preventivo) summary.push(`${conteggi.preventivo} preventivi in attesa`);
            if (conteggi.firma) summary.push(`${conteggi.firma} da firmare`);
            if (conteggi.acconto) summary.push(`${conteggi.acconto} acconti`);
            if (conteggi.saldo) summary.push(`${conteggi.saldo} saldi`);
            return (
              <div style={{ padding: "14px 14px 0" }}>
                <div style={{ background: "linear-gradient(135deg, #FFF8E1 0%, #FCE6F2 100%)", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(229,178,58,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📋</span>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#9C7A1A", letterSpacing: 0.5 }}>
                      {totDoc} {totDoc === 1 ? "DOCUMENTO" : "DOCUMENTI"} DA GESTIRE
                      {docUrgenti.length > 0 && (
                        <span style={{ marginLeft: 6, padding: "2px 7px", background: "#DC2626", color: "#fff", borderRadius: 6, fontSize: 9, letterSpacing: 0.4 }}>
                          {docUrgenti.length} URGENTI
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#52525B", marginTop: 4, marginLeft: 26 }}>
                    {summary.join(" · ")}
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ padding: "16px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#1E3A5F", letterSpacing: 1 }}>
              {a.selectedDate === TODAY_ISO ? "OGGI" : "GIORNO"} · {a.eventsOfDay.length} {a.eventsOfDay.length === 1 ? "IMPEGNO" : "IMPEGNI"}
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              style={{ padding: "6px 12px", borderRadius: 10, background: "#fff", border: "1px solid #E4E4E7", fontSize: 11, fontWeight: 700, color: "#0D1F1F", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filtri
            </button>
          </div>

          <div style={{ padding: "8px 14px 0" }}>
            {a.eventsOfDay.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 16, padding: "30px 16px", textAlign: "center", color: "#71717A", fontSize: 13 }}>
                Nessun impegno per questo giorno
              </div>
            ) : (
              a.eventsOfDay.map((e) => (
                <AgendaEventCardMobile key={e.id} event={e} onTap={setTap} onAction={handleAction} />
              ))
            )}
          </div>
        </>
      )}

      {/* === VISTA SETTIMANA === */}
      {a.view === "settimana" && (
        <AgendaWeekMobile
          selectedDate={a.selectedDate}
          eventsByDate={a.eventsByDate}
          onSelectDay={a.setSelectedDate}
          onTapEvent={setTap}
        />
      )}

      {/* === VISTA MESE === */}
      {a.view === "mese" && (
        <AgendaMonthMobile
          selectedDate={a.selectedDate}
          eventsByDate={a.eventsByDate}
          onSelectDay={a.setSelectedDate}
          onTapEvent={setTap}
        />
      )}

      {/* FAB */}
      <button
        onClick={() => setFabOpen(true)}
        style={{
          position: "fixed",
          right: 18,
          bottom: 84,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1E3A5F 0%, #0F1B2D 100%)",
          border: "none",
          color: "#fff",
          fontSize: 30,
          fontWeight: 300,
          cursor: "pointer",
          boxShadow: "0 8px 22px rgba(15,27,45,0.5)",
          zIndex: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        +
      </button>

      {/* Bottom nav */}
      {!hideBottomNav && (bottomNav ?? <AgendaBottomNav active="agenda" />)}

      {/* Sheets */}
      <AgendaEventSheetMobile
        event={tap}
        onClose={() => setTap(null)}
        onAction={handleSheetAction}
        onOpenCommessa={(e) => { onOpenCommessa?.(e.cmId, e.commessaCode); setTap(null); }}
      />
      <AgendaFabSheetMobile
        open={fabOpen}
        onClose={() => setFabOpen(false)}
        onPick={(kind) => {
          // Se l'host (MastroERP) fornisce onCreateEvent → chiama lui (apre form vero)
          if (onCreateEvent) {
            onCreateEvent(kind, a.selectedDate);
            return;
          }
          // Standalone: aggiungo evento di placeholder e mostro toast
          a.addEvent({
            id: "ev_" + Date.now(),
            tipo: kind === "nota" ? "task" : kind,
            oraInizio: "09:00",
            oraFine: "10:00",
            data: a.selectedDate,
            titolo: "Nuovo " + (kind === "nota" ? "appunto" : kind),
          });
          if (typeof window !== "undefined") window.alert("Evento aggiunto in agenda (mock)");
        }}
      />
      <AgendaFiltersMobile open={filtersOpen} current={a.filters} onClose={() => setFiltersOpen(false)} onApply={a.setFilters} />

      {/* Schermata completato */}
      {completed && <CompletedScreen event={completed} onClose={() => setCompleted(null)} onOpenCommessa={() => { onOpenCommessa?.(completed.cmId, completed.commessaCode); setCompleted(null); }} />}
    </div>
  );
}

function CompletedScreen({ event, onClose, onOpenCommessa }: { event: AgendaEvent; onClose: () => void; onOpenCommessa: () => void }) {
  // confetti pseudo-random posizionati
  const confetti = useMemo(() => {
    const arr: { x: number; y: number; c: string; r: number }[] = [];
    const colors = ["#FFD166", "#2D5A87", "#F08599", "#7AA0E0", "#5FBA7D", "#F0A658"];
    for (let i = 0; i < 26; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 60,
        c: colors[i % colors.length],
        r: Math.random() * 6 + 3,
      });
    }
    return arr;
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(160deg, #1E3A5F 0%, #0F1B2D 100%)",
        zIndex: 1500,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${c.y}%`,
            left: `${c.x}%`,
            width: c.r,
            height: c.r,
            borderRadius: "50%",
            background: c.c,
            opacity: 0.85,
          }}
        />
      ))}

      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: "#1E3A5F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
          boxShadow: "0 0 0 10px rgba(30,58,95,0.25)",
          zIndex: 1,
        }}
      >
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, zIndex: 1, textAlign: "center" }}>
        {event.tipo === "montaggio" ? "Montaggio completato!" : "Completato!"}
      </div>
      <div style={{ fontSize: 13, marginTop: 6, opacity: 0.92, zIndex: 1, textAlign: "center" }}>
        {event.commessaCode ? `Commessa ${event.commessaCode}${event.cliente ? " · " + event.cliente : ""}` : event.titolo}
      </div>
      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.78, fontFamily: "'JetBrains Mono', monospace", zIndex: 1 }}>
        {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} · Martedì 28 Aprile
      </div>

      <div style={{ width: "100%", maxWidth: 320, marginTop: 28, display: "flex", flexDirection: "column", gap: 10, zIndex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, textAlign: "center", marginBottom: 4 }}>COSA VUOI FARE ORA?</div>
        <button onClick={(e) => { e.stopPropagation(); onOpenCommessa(); }} style={{ padding: 13, background: "#1E3A5F", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
          Vai alla commessa
        </button>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ padding: 13, background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Nuovo montaggio
        </button>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ padding: 13, background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Torna all&apos;agenda
        </button>
        <button onClick={(e) => { e.stopPropagation(); if ((navigator as any).share) (navigator as any).share({ title: "Aggiornamento", text: "Completato" }); }} style={{ padding: 13, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          ↗ Condividi aggiornamento
        </button>
      </div>
    </div>
  );
}
