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
import { useAgendaMobile } from "../../../hooks/useAgendaMobile";
import type { AgendaEvent } from "../../../lib/types/agenda";

interface Props {
  // bottom nav esterno (passa da MastroERP/page). Se non passato, mostra placeholder navigazione.
  bottomNav?: React.ReactNode;
  // callback per aprire commessa nel router della app
  onOpenCommessa?: (cmId: string | undefined, code: string | undefined) => void;
}

const TODAY_ISO = new Date().toISOString().split("T")[0];

function formatHeaderSub(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const s = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AgendaMobile({ bottomNav, onOpenCommessa }: Props) {
  const a = useAgendaMobile();
  const [tap, setTap] = useState<AgendaEvent | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [completed, setCompleted] = useState<AgendaEvent | null>(null);

  const headerSub = useMemo(() => formatHeaderSub(a.selectedDate), [a.selectedDate]);

  const handleAction = (action: "vai" | "chiama" | "mappa" | "risolvi", e: AgendaEvent) => {
    if (action === "mappa" || action === "vai") {
      if (e.indirizzo) {
        const q = encodeURIComponent(e.indirizzo);
        window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
      }
      return;
    }
    if (action === "chiama") {
      // numero non noto da mock; mostro alert simbolico
      window.alert(`Chiama ${e.cliente || "cliente"}: numero non disponibile in MOCK`);
      return;
    }
    if (action === "risolvi") {
      a.completeEvent(e.id);
      setCompleted(e);
      return;
    }
  };

  const handleSheetAction = (action: "vai" | "chiama" | "mappa" | "chat" | "foto", e: AgendaEvent) => {
    if (action === "vai" || action === "mappa") {
      if (e.indirizzo) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.indirizzo)}`, "_blank");
      return;
    }
    if (action === "chiama") {
      window.alert(`Chiama ${e.cliente || "cliente"}: numero non disponibile in MOCK`);
      return;
    }
    if (action === "chat" || action === "foto") {
      window.alert(`${action.toUpperCase()}: collegamento da implementare`);
    }
  };

  if (a.view === "problemi") {
    return (
      <div style={{ background: "#F8FAFA", minHeight: "100vh" }}>
        <AgendaProblemsMobile
          events={a.events}
          onSegnala={() => setFabOpen(true)}
          onTap={() => {}}
        />
        {/* Toolbar switch tornare ad agenda */}
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 60 }}>
          <button
            onClick={() => a.setView("giorno")}
            style={{ padding: "8px 14px", borderRadius: 10, background: "#0D1F1F", color: "#fff", border: "none", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
          >
            ← Agenda
          </button>
        </div>
        {bottomNav}
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFA", minHeight: "100vh", paddingBottom: 100, fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
      <AgendaHeaderMobile
        title="Agenda"
        subtitle={headerSub}
        onMenu={() => a.setView("problemi")}
      />

      {/* Day strip */}
      <AgendaDayStripMobile selectedDate={a.selectedDate} onSelect={a.setSelectedDate} />

      {/* Switch giorno/settimana/mese */}
      <div style={{ padding: "14px 14px 0", display: "flex", gap: 6, justifyContent: "center" }}>
        {(["giorno", "settimana", "mese"] as const).map((v) => {
          const active = a.view === v;
          return (
            <div
              key={v}
              onClick={() => a.setView(v)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                background: active ? "#0D1F1F" : "#fff",
                color: active ? "#fff" : "#0D1F1F",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                border: active ? "none" : "1px solid #E4E4E7",
                textTransform: "capitalize" as const,
                boxShadow: active ? "0 3px 10px rgba(13,31,31,0.18)" : "none",
                transition: "all 0.15s",
              }}
            >
              {v}
            </div>
          );
        })}
      </div>

      {/* === VISTA GIORNO === */}
      {a.view === "giorno" && (
        <>
          {/* Card titolo "OGGI · N IMPEGNI" + filtri */}
          <div style={{ padding: "14px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#28A0A0", letterSpacing: 1 }}>
                {a.selectedDate === TODAY_ISO ? "OGGI" : "GIORNO"} · {a.eventsOfDay.length} {a.eventsOfDay.length === 1 ? "IMPEGNO" : "IMPEGNI"}
              </div>
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              style={{ padding: "7px 12px", borderRadius: 10, background: "#fff", border: "1px solid #E4E4E7", fontSize: 11, fontWeight: 700, color: "#0D1F1F", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0D1F1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filtri
            </button>
          </div>

          {/* Eventi */}
          <div style={{ padding: "8px 16px 0" }}>
            {a.eventsOfDay.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: "30px 16px", textAlign: "center", color: "#71717A", fontSize: 13 }}>
                Nessun impegno per questo giorno
              </div>
            ) : (
              a.eventsOfDay.map((e) => (
                <AgendaEventCardMobile
                  key={e.id}
                  event={e}
                  onTap={setTap}
                  onAction={handleAction}
                />
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
          bottom: 90,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #28A0A0 0%, #1A7A7A 100%)",
          border: "none",
          color: "#fff",
          fontSize: 28,
          fontWeight: 300,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(40,160,160,0.5)",
          zIndex: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        +
      </button>

      {/* Bottom nav passata da fuori */}
      {bottomNav}

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
          // mock: aggiungo evento placeholder
          const id = "ev_" + Date.now();
          a.addEvent({
            id,
            tipo: kind === "nota" ? "task" : kind,
            oraInizio: "09:00",
            oraFine: "10:00",
            data: a.selectedDate,
            titolo: "Nuovo " + (kind === "nota" ? "appunto" : kind),
          });
        }}
      />
      <AgendaFiltersMobile
        open={filtersOpen}
        current={a.filters}
        onClose={() => setFiltersOpen(false)}
        onApply={a.setFilters}
      />

      {/* Schermata completato */}
      {completed && (
        <div
          onClick={() => setCompleted(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "linear-gradient(135deg, #0F4F4F 0%, #0D1F1F 100%)",
            zIndex: 1500,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 28,
            color: "#fff",
          }}
        >
          {/* Coriandoli decorativi */}
          <div style={{ position: "absolute", top: 60, left: 40, fontSize: 16 }}>✨</div>
          <div style={{ position: "absolute", top: 90, right: 50, fontSize: 14 }}>✨</div>
          <div style={{ position: "absolute", top: 140, left: 80, fontSize: 12 }}>✨</div>

          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "rgba(40,160,160,0.18)",
              border: "3px solid #28A0A0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 22,
              boxShadow: "0 0 0 8px rgba(40,160,160,0.08)",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            {completed.tipo === "montaggio" ? "Montaggio completato!" : "Completato!"}
          </div>
          <div style={{ fontSize: 13, marginTop: 6, opacity: 0.85 }}>
            {completed.commessaCode ? `Commessa ${completed.commessaCode}${completed.cliente ? " · " + completed.cliente : ""}` : completed.titolo}
          </div>
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.75, fontFamily: "'JetBrains Mono', monospace" }}>
            {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} · {formatHeaderSub(completed.data)}
          </div>

          <div style={{ width: "100%", maxWidth: 320, marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#28A0A0", letterSpacing: 1.5, textAlign: "center", marginBottom: 4 }}>COSA VUOI FARE ORA?</div>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenCommessa?.(completed.cmId, completed.commessaCode); setCompleted(null); }}
              style={{ padding: 13, background: "#28A0A0", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            >
              Vai alla commessa
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCompleted(null); setFabOpen(true); }}
              style={{ padding: 13, background: "transparent", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Nuovo montaggio
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCompleted(null); }}
              style={{ padding: 13, background: "transparent", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Torna all&apos;agenda
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (typeof navigator !== "undefined" && (navigator as any).share) {
                  (navigator as any).share({ title: "Aggiornamento", text: `${completed.tipo} completato` });
                }
              }}
              style={{ padding: 13, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              ↗ Condividi aggiornamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
