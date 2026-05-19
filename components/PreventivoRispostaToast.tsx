"use client";
import React from "react";
import type { PreventivoNotifyItem } from "../lib/preventivo-notifier";

/* ════════════════════════════════════════════════════════════
   MASTRO · PreventivoRispostaToast
   Popup full-width sospeso in alto che appare quando arriva
   una risposta cliente. Persistente fino ad azione utente.
   ════════════════════════════════════════════════════════════ */

interface Props {
  item: PreventivoNotifyItem | null;
  pendingCount: number;
  onApri: (item: PreventivoNotifyItem) => void;
  onAck: (item: PreventivoNotifyItem) => void;
  onAckAll: () => void;
}

const TOKENS = {
  white: "#FFFFFF",
  ink: "#1A1A1A",
  inkSoft: "#555555",
  muted: "#888888",
  hairline: "#EAEAE6",
  teal: "#1E3A5F",
  tealDark: "#0F1B2D",
  tealLight: "#E6F1FB",

  green: "#28A268",
  greenLight: "#DDF5E6",
  greenInk: "#0E5E33",

  amber: "#F5A030",
  amberLight: "#FFF1D6",
  amberInk: "#A36B12",

  rose: "#E45050",
  roseLight: "#FFE0E0",
  roseInk: "#A02020",
};

const VARIANTI = {
  accettato: {
    icon: "✓",
    title: "Cliente ha accettato — Manda conferma d'ordine",
    bg: TOKENS.greenLight,
    bar: TOKENS.green,
    ink: TOKENS.greenInk,
    cta: "→ Conferma ordine",
  },
  modifiche: {
    icon: "⚠",
    title: "Cliente chiede modifiche",
    bg: TOKENS.amberLight,
    bar: TOKENS.amber,
    ink: TOKENS.amberInk,
    cta: "Apri preventivo",
  },
  chiamare: {
    icon: "📞",
    title: "Cliente ti chiede di chiamarlo",
    bg: TOKENS.tealLight,
    bar: TOKENS.teal,
    ink: TOKENS.tealDark,
    cta: "Apri commessa",
  },
};

export default function PreventivoRispostaToast({ item, pendingCount, onApri, onAck, onAckAll }: Props) {
  if (!item) return null;
  const v = VARIANTI[item.risposta] || VARIANTI.accettato;
  const cliente = item.snapshot?.cliente || "Cliente";
  const totale = item.snapshot?.totale;

  return (
    <>
      {/* Overlay leggero per attirare attenzione */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 4,
        background: v.bar,
        zIndex: 99998,
        animation: "mastro-toast-slide 0.25s ease-out",
      }} />

      {/* Toast principale */}
      <div
        role="alert"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          right: 12,
          maxWidth: 520,
          margin: "0 auto",
          background: TOKENS.white,
          borderRadius: 16,
          boxShadow: "0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)",
          zIndex: 99999,
          overflow: "hidden",
          animation: "mastro-toast-pop 0.35s cubic-bezier(.2,.9,.3,1.4)",
        }}
      >
        {/* Banda colorata top */}
        <div style={{
          height: 4,
          background: v.bar,
        }} />

        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 12,
              background: v.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              color: v.ink,
              flexShrink: 0,
            }}>{v.icon}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: v.ink,
                marginBottom: 3,
              }}>
                NUOVA RISPOSTA · {item.cm_code}
                {pendingCount > 1 && (
                  <span style={{
                    marginLeft: 8,
                    background: v.bar,
                    color: TOKENS.white,
                    padding: "1px 6px",
                    borderRadius: 8,
                    fontSize: 9,
                  }}>+{pendingCount - 1} altre</span>
                )}
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: TOKENS.ink,
                lineHeight: 1.3,
                marginBottom: 2,
              }}>{v.title}</div>
              <div style={{
                fontSize: 12,
                color: TOKENS.inkSoft,
                marginBottom: 4,
              }}>
                <strong>{cliente}</strong>
                {totale ? ` · €${Number(totale).toLocaleString("it-IT")}` : ""}
              </div>
              {item.risposta_nota && (
                <div style={{
                  fontSize: 11,
                  color: TOKENS.muted,
                  fontStyle: "italic",
                  background: TOKENS.hairline,
                  padding: "6px 8px",
                  borderRadius: 6,
                  marginTop: 6,
                  marginBottom: 4,
                  whiteSpace: "pre-wrap",
                }}>“{item.risposta_nota}”</div>
              )}
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: pendingCount > 1 ? "1fr 1fr 1fr" : "2fr 1fr",
            gap: 6,
            marginTop: 12,
          }}>
            <button
              onClick={() => onApri(item)}
              style={{
                background: v.bar,
                color: TOKENS.white,
                border: "none",
                borderRadius: 9,
                padding: "10px 8px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >{v.cta}</button>

            <button
              onClick={() => onAck(item)}
              style={{
                background: TOKENS.white,
                border: `1.5px solid ${TOKENS.hairline}`,
                color: TOKENS.inkSoft,
                borderRadius: 9,
                padding: "10px 8px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >Visto</button>

            {pendingCount > 1 && (
              <button
                onClick={() => onAckAll()}
                style={{
                  background: TOKENS.white,
                  border: `1.5px solid ${TOKENS.hairline}`,
                  color: TOKENS.muted,
                  borderRadius: 9,
                  padding: "10px 6px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >Visto tutto</button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mastro-toast-slide {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes mastro-toast-pop {
          0% { transform: translateY(-30px) scale(0.95); opacity: 0; }
          60% { transform: translateY(2px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
