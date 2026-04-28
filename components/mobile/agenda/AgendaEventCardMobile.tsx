// components/mobile/agenda/AgendaEventCardMobile.tsx
"use client";
import React from "react";
import type { AgendaEvent } from "../../../lib/types/agenda";
import { TIPO_COLORS, TIPO_LABEL } from "../../../lib/types/agenda";

interface Props {
  event: AgendaEvent;
  onTap: (e: AgendaEvent) => void;
  onAction?: (action: "vai" | "chiama" | "mappa" | "risolvi", e: AgendaEvent) => void;
}

const ICONS = {
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

export default function AgendaEventCardMobile({ event, onTap, onAction }: Props) {
  const c = TIPO_COLORS[event.tipo];
  const oraStr = event.oraFine ? `${event.oraInizio}\n${event.oraFine}` : event.oraInizio;

  const showVai = event.tipo === "montaggio" || event.tipo === "sopralluogo";
  const showChiama = event.tipo === "montaggio";
  const showMappa = event.tipo === "montaggio";
  const showRisolvi = event.tipo === "problema";

  const renderBadge = () => {
    if (event.tipo === "produzione" && event.stato === "in_produzione") {
      return (
        <span
          style={{
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: 6,
            background: c.bg,
            color: c.tx,
            fontSize: 10,
            fontWeight: 800,
            marginTop: 6,
            letterSpacing: 0.3,
          }}
        >
          IN PRODUZIONE
        </span>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 12,
        alignItems: "stretch",
      }}
    >
      {/* Ora a sinistra */}
      <div
        style={{
          flex: "0 0 56px",
          textAlign: "right",
          paddingTop: 14,
          fontSize: 12,
          fontWeight: 800,
          color: "#52525B",
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: "pre-line",
          lineHeight: 1.5,
        }}
      >
        {oraStr}
      </div>

      {/* Card evento */}
      <div
        onClick={() => onTap(event)}
        style={{
          flex: 1,
          background: c.soft,
          borderRadius: 14,
          borderLeft: `4px solid ${c.bd}`,
          padding: "12px 14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 900, color: c.tx, letterSpacing: 0.6 }}>
          {TIPO_LABEL[event.tipo]}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0D1F1F", marginTop: 4 }}>
          {event.titolo}
          {event.commessaCode ? (
            <span style={{ fontWeight: 600, color: "#52525B" }}>
              {" "}· {event.commessaCode}
              {event.cliente ? ` · ${event.cliente}` : ""}
            </span>
          ) : event.cliente ? (
            <span style={{ fontWeight: 600, color: "#52525B" }}> · {event.cliente}</span>
          ) : null}
          {event.ordineCode && (
            <span style={{ fontWeight: 600, color: "#52525B" }}>
              {" "}· Ordine {event.ordineCode}
            </span>
          )}
        </div>
        {event.descrizione && (
          <div style={{ fontSize: 12, color: "#52525B", marginTop: 2 }}>{event.descrizione}</div>
        )}
        {event.indirizzo && (
          <div style={{ fontSize: 12, color: "#71717A", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2.4">
              <path d={ICONS.pin} />
            </svg>
            {event.indirizzo}
          </div>
        )}
        {event.persone && event.persone.length > 0 && (
          <div style={{ fontSize: 11, color: "#52525B", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2">
              <path d={ICONS.users} />
            </svg>
            {event.squadra ? `${event.squadra} · ` : ""}
            {event.persone.join(", ")}
          </div>
        )}

        {renderBadge()}

        {/* Azioni rapide */}
        {(showVai || showChiama || showMappa || showRisolvi) && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {showVai && (
              <button
                onClick={(e) => { e.stopPropagation(); onAction?.("vai", event); }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: `1px solid ${c.bd}30`,
                  background: "#fff",
                  color: c.tx,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >Vai</button>
            )}
            {showChiama && (
              <button
                onClick={(e) => { e.stopPropagation(); onAction?.("chiama", event); }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: `1px solid ${c.bd}30`,
                  background: "#fff",
                  color: c.tx,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >Chiama</button>
            )}
            {showMappa && (
              <button
                onClick={(e) => { e.stopPropagation(); onAction?.("mappa", event); }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: `1px solid ${c.bd}30`,
                  background: "#fff",
                  color: c.tx,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >Mappa</button>
            )}
            {showRisolvi && (
              <button
                onClick={(e) => { e.stopPropagation(); onAction?.("risolvi", event); }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: c.bd,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >Risolvi</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
