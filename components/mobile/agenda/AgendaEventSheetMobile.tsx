// components/mobile/agenda/AgendaEventSheetMobile.tsx
"use client";
import React from "react";
import type { AgendaEvent } from "../../../lib/types/agenda";
import { TIPO_COLORS, TIPO_LABEL } from "../../../lib/types/agenda";

interface Props {
  event: AgendaEvent | null;
  onClose: () => void;
  onAction: (action: "vai" | "chiama" | "mappa" | "chat" | "foto", e: AgendaEvent) => void;
  onOpenCommessa?: (e: AgendaEvent) => void;
}

const PIPELINE = ["Sopralluogo", "Conferma", "Produzione", "Posa", "Fatturato"];

function formatDataLunga(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  const s = d.toLocaleDateString("it-IT", opts);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AgendaEventSheetMobile({ event, onClose, onAction, onOpenCommessa }: Props) {
  if (!event) return null;
  const c = TIPO_COLORS[event.tipo];

  // Pipeline: assumo che il "Posa" corrisponda a un montaggio attivo
  const activeStep = event.tipo === "montaggio" ? 3 : event.tipo === "sopralluogo" ? 0 : event.tipo === "produzione" ? 2 : 1;

  const minutiTra = (() => {
    try {
      const [h1, m1] = event.oraInizio.split(":").map(Number);
      const [h2, m2] = event.oraFine.split(":").map(Number);
      const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h > 0 ? h + "h " : ""}${m > 0 ? m + "m" : ""}`.trim();
    } catch { return ""; }
  })();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "#fff",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: "10px 18px 28px",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 5, background: "#E4E4E7", borderRadius: 4, margin: "0 auto 14px" }} />

        {/* Titolo + badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: c.tx, letterSpacing: 0.6 }}>
              {TIPO_LABEL[event.tipo]}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0D1F1F", marginTop: 4 }}>
              {event.titolo}
              {event.commessaCode && (
                <div style={{ fontSize: 13, fontWeight: 600, color: "#52525B", marginTop: 2 }}>
                  Commessa {event.commessaCode}
                  {event.cliente ? ` · ${event.cliente}` : ""}
                </div>
              )}
            </div>
          </div>
          {event.stato && (
            <span
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                background: c.bg,
                color: c.tx,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.5,
                whiteSpace: "nowrap",
                marginTop: 4,
              }}
            >
              {event.stato.toUpperCase().replace("_", " ")}
            </span>
          )}
        </div>

        {/* Dati */}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <Row icon="cal" text={formatDataLunga(event.data)} />
          <Row icon="time" text={`${event.oraInizio} - ${event.oraFine}${minutiTra ? ` (${minutiTra})` : ""}`} />
          {event.indirizzo && <Row icon="pin" text={event.indirizzo} />}
          {event.persone && event.persone.length > 0 && (
            <Row icon="users" text={`${event.squadra ? event.squadra + " · " : ""}${event.persone.join(", ")}`} />
          )}
          {event.descrizione && <Row icon="info" text={event.descrizione} />}
        </div>

        {/* Azioni rapide */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#28A0A0", letterSpacing: 1, marginBottom: 8 }}>
            AZIONI RAPIDE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {[
              { key: "vai" as const, lbl: "Vai", icon: "M5 12h14 M12 5l7 7-7 7" },
              { key: "chiama" as const, lbl: "Chiama", icon: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" },
              { key: "mappa" as const, lbl: "Mappa", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
              { key: "chat" as const, lbl: "Chat", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
              { key: "foto" as const, lbl: "Foto", icon: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
            ].map((a) => (
              <button
                key={a.key}
                onClick={() => onAction(a.key, event)}
                style={{
                  background: "#F8FAFA",
                  border: "1px solid #E4F2F2",
                  borderRadius: 12,
                  padding: "12px 6px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={a.icon} />
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#0D1F1F" }}>{a.lbl}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stato commessa pipeline */}
        {event.commessaCode && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#28A0A0", letterSpacing: 1, marginBottom: 10 }}>
              STATO COMMESSA
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {PIPELINE.map((step, i) => {
                const done = i < activeStep;
                const active = i === activeStep;
                return (
                  <React.Fragment key={step}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                      <div
                        style={{
                          width: active ? 28 : 22,
                          height: active ? 28 : 22,
                          borderRadius: "50%",
                          background: done ? "#15803D" : active ? "#28A0A0" : "#E4E4E7",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 900,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: active ? "0 0 0 3px rgba(40,160,160,0.18)" : "none",
                        }}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: active ? 900 : 600,
                          color: active ? "#0D1F1F" : "#71717A",
                          marginTop: 4,
                          textAlign: "center",
                          maxWidth: 56,
                          lineHeight: 1.2,
                        }}
                      >
                        {step}
                      </div>
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: i < activeStep ? "#15803D" : "#E4E4E7", margin: "0 4px", marginBottom: 14 }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottone va alla commessa */}
        {event.commessaCode && (
          <button
            onClick={() => onOpenCommessa?.(event)}
            style={{
              width: "100%",
              padding: 14,
              background: "linear-gradient(135deg, #28A0A0 0%, #1A7A7A 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              marginTop: 18,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(40,160,160,0.3)",
            }}
          >
            Vai alla commessa →
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ icon, text }: { icon: string; text: string }) {
  const ICO_PATH: Record<string, string> = {
    cal: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18",
    time: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
    pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#3F3F46" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d={ICO_PATH[icon] || ""} />
      </svg>
      <span>{text}</span>
    </div>
  );
}
