"use client";
import React, { useState, useMemo, useEffect } from "react";
import { C } from "./montaggi-editor-types";
import type { CommessaLite } from "./montaggi-editor-types";
import { commesseValide } from "./montaggi-editor-helpers";

interface Props {
  open: boolean;
  commesse: any[];
  onPick: (c: CommessaLite) => void;
  onClose: () => void;
}

export default function MontaggiCommessaPicker({ open, commesse, onPick, onClose }: Props) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const lista = useMemo(() => commesseValide(commesse), [commesse]);
  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return lista;
    return lista.filter((c) =>
      `${c.code || ""} ${c.cliente || ""} ${c.cognome || ""} ${c.indirizzo || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, lista]);

  if (!open) return null;

  function fmtEur(n?: number | null): string {
    if (n == null) return "";
    return `€${Math.round(n).toLocaleString("it-IT")}`;
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26, 42, 71, 0.75)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: "18px 18px 0 0",
          width: "100%",
          maxWidth: 420,
          height: "70vh",
          maxHeight: 600,
          display: "flex",
          flexDirection: "column",
          boxShadow: C.shadowLg,
        }}
      >
        <div style={{ padding: "16px 16px 10px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 40, height: 4, background: C.navyFaint, borderRadius: 2, margin: "0 auto 12px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navyText }}>Scegli commessa</div>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: C.whiteOff, border: "none",
                cursor: "pointer", color: C.navyText,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1={18} y1={6} x2={6} y2={18} />
                <line x1={6} y1={6} x2={18} y2={18} />
              </svg>
            </button>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca codice, cliente, indirizzo…"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: `1.5px solid ${C.borderStrong}`,
              background: C.whiteOff,
              fontSize: 13, fontWeight: 600,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px 16px 12px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: C.navyFaint, fontSize: 13, padding: 30 }}>
              Nessuna commessa attiva
              <div style={{ fontSize: 11, marginTop: 6 }}>
                Le commesse sono disponibili da "Acconto pagato" in poi
              </div>
            </div>
          )}
          {filtered.map((c) => {
            const cliente = `${c.cliente || ""} ${c.cognome || ""}`.trim() || "—";
            const tot = c.totale_finale || c.totale_preventivo;
            return (
              <div
                key={c.id}
                onClick={() => onPick(c)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: C.white,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                  cursor: "pointer",
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    flex: "0 0 auto",
                    minWidth: 40, height: 36,
                    padding: "0 8px",
                    borderRadius: 8,
                    background: C.amberSoft,
                    color: C.amberDark,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                  }}
                >
                  {(c.code || "").replace(/^S-?/, "") || "·"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.navyText, lineHeight: 1.2 }}>
                    {c.code} · {cliente}
                  </div>
                  <div style={{ fontSize: 11, color: C.navyDim, fontWeight: 600, marginTop: 2 }}>
                    {c.vani_count ? `${c.vani_count} vani · ` : ""}{tot ? fmtEur(tot) + " · " : ""}{c.indirizzo || c.citta || ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
