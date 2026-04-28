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

const ICO_PATHS = {
  play: "M5 3l14 9-14 9V3z",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  alert: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
};

export default function AgendaEventCardMobile({ event, onTap, onAction }: Props) {
  const c = TIPO_COLORS[event.tipo];

  const showVai = event.tipo === "montaggio" || event.tipo === "sopralluogo";
  const showChiama = event.tipo === "montaggio";
  const showMappa = event.tipo === "montaggio";
  const showRisolvi = event.tipo === "problema";

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "stretch" }}>
      {/* Ora a sinistra in 2 righe */}
      <div
        style={{
          flex: "0 0 52px",
          textAlign: "right",
          paddingTop: 13,
          fontSize: 12,
          fontWeight: 800,
          color: "#52525B",
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1.5,
        }}
      >
        <div>{event.oraInizio}</div>
        {event.oraFine && <div>{event.oraFine}</div>}
      </div>

      {/* Card */}
      <div
        onClick={() => onTap(event)}
        style={{
          flex: 1,
          background: c.bg,
          borderRadius: 16,
          borderLeft: `4px solid ${c.bd}`,
          padding: "12px 14px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          cursor: "pointer",
        }}
      >
        {/* Riga titolo tipo + alert icon per problema */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {event.tipo === "problema" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.tx} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICO_PATHS.alert} />
            </svg>
          )}
          <div style={{ fontSize: 12, fontWeight: 900, color: c.tx, letterSpacing: 0.6 }}>
            {TIPO_LABEL[event.tipo]}
          </div>
        </div>

        {/* Titolo + commessa/cliente/ordine */}
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0D1F1F", marginTop: 4, lineHeight: 1.35 }}>
          {event.commessaCode
            ? <>Commessa {event.commessaCode}{event.cliente ? ` · ${event.cliente}` : ""}</>
            : event.ordineCode
            ? <>Ordine {event.ordineCode}{event.descrizione ? ` · ${event.descrizione}` : ""}</>
            : event.cliente
            ? <>{event.cliente}</>
            : <>{event.titolo}</>}
        </div>

        {/* Riga 2: indirizzo o descrizione secondaria */}
        {event.indirizzo && (
          <div style={{ fontSize: 12, color: "#52525B", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
            {event.indirizzo}
          </div>
        )}
        {!event.indirizzo && event.tipo === "produzione" && event.descrizione && (
          <div style={{ fontSize: 12, color: "#52525B", marginTop: 3 }}>{event.descrizione}</div>
        )}
        {event.tipo === "problema" && event.commessaCode === undefined && event.titolo && (
          <div style={{ fontSize: 12, color: "#52525B", marginTop: 3 }}>{event.titolo}</div>
        )}

        {/* Riga 3: squadra/persone con icona */}
        {event.persone && event.persone.length > 0 && (
          <div style={{ fontSize: 11, color: "#52525B", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round">
              <path d={ICO_PATHS.users} />
            </svg>
            <span>{event.persone.length}</span>
          </div>
        )}

        {/* Badge "IN PRODUZIONE" come pill arrotondata */}
        {event.tipo === "produzione" && event.stato === "in_produzione" && (
          <div style={{ marginTop: 8 }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 10,
                background: c.chip,
                color: c.chipTx,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.4,
              }}
            >
              In produzione
            </span>
          </div>
        )}

        {/* Azioni rapide */}
        {(showVai || showChiama || showMappa) && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {showVai && (
              <ActionPill colorBg="#fff" colorBd={c.bd} colorTx={c.tx} icon={ICO_PATHS.play} label="Vai" onClick={(e) => { e.stopPropagation(); onAction?.("vai", event); }} />
            )}
            {showChiama && (
              <ActionPill colorBg="#fff" colorBd={c.bd} colorTx={c.tx} icon={ICO_PATHS.phone} label="Chiama" onClick={(e) => { e.stopPropagation(); onAction?.("chiama", event); }} />
            )}
            {showMappa && (
              <ActionPill colorBg="#fff" colorBd={c.bd} colorTx={c.tx} icon={ICO_PATHS.pin} label="Mappa" onClick={(e) => { e.stopPropagation(); onAction?.("mappa", event); }} />
            )}
          </div>
        )}

        {showRisolvi && (
          <div style={{ marginTop: 10 }}>
            <span
              onClick={(e) => { e.stopPropagation(); onAction?.("risolvi", event); }}
              style={{
                display: "inline-block",
                padding: "5px 14px",
                borderRadius: 10,
                background: c.chip,
                color: c.chipTx,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.3,
                cursor: "pointer",
              }}
            >
              Risolvi
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionPill({ colorBg, colorBd, colorTx, icon, label, onClick }: { colorBg: string; colorBd: string; colorTx: string; icon: string; label: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${colorBd}55`,
        background: colorBg,
        color: colorTx,
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill={colorTx} stroke="none">
        <path d={icon} />
      </svg>
      {label}
    </button>
  );
}
