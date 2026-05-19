"use client";
import React, { useState, useMemo, useEffect } from "react";
import { C } from "./montaggi-editor-types";
import type { ContattoLite } from "./montaggi-editor-types";
import MontaggiContattoNew from "./MontaggiContattoNew";

interface Props {
  open: boolean;
  contatti: ContattoLite[];
  aziendaId: string;
  onPick: (c: ContattoLite) => void;
  onClose: () => void;
  allowAdd?: boolean;
}

export default function MontaggiContattoPicker({
  open,
  contatti,
  aziendaId,
  onPick,
  onClose,
  allowAdd = true,
}: Props) {
  const [q, setQ] = useState("");
  const [addMode, setAddMode] = useState(false);

  useEffect(() => {
    if (open) {
      setQ("");
      setAddMode(false);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return contatti;
    return contatti.filter((c) =>
      `${c.nome || ""} ${c.cognome || ""} ${c.telefono || ""} ${c.citta || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, contatti]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(26, 42, 71, 0.75)",
        zIndex: 60,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: "18px 18px 0 0",
          width: "100%", maxWidth: 420,
          height: "70vh", maxHeight: 600,
          display: "flex", flexDirection: "column",
          boxShadow: C.shadowLg,
        }}
      >
        <div style={{ padding: "16px 16px 10px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 40, height: 4, background: C.navyFaint, borderRadius: 2, margin: "0 auto 12px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navyText }}>
              {addMode ? "Nuovo cliente" : "Rubrica clienti"}
            </div>
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
          {!addMode && (
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca per nome, telefono…"
              style={{
                width: "100%", padding: "10px 12px",
                borderRadius: 10,
                border: `1.5px solid ${C.borderStrong}`,
                background: C.whiteOff,
                fontSize: 13, fontWeight: 600,
                outline: "none", boxSizing: "border-box",
              }}
            />
          )}
        </div>

        {addMode ? (
          <MontaggiContattoNew
            aziendaId={aziendaId}
            onPick={onPick}
            onBack={() => setAddMode(false)}
          />
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", color: C.navyFaint, fontSize: 13, padding: 30 }}>
                  Nessun contatto trovato
                </div>
              )}
              {filtered.map((c) => {
                const ini = `${(c.nome || "?")[0] || ""}${(c.cognome || "")[0] || ""}`.toUpperCase();
                return (
                  <div
                    key={c.id}
                    onClick={() => onPick(c)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: C.white,
                      display: "flex", alignItems: "center", gap: 10,
                      marginBottom: 4,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: C.amberSoft, color: C.amberDark,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 800,
                        flex: "0 0 auto",
                      }}
                    >
                      {ini}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.navyText, lineHeight: 1.2 }}>
                        {c.nome} {c.cognome}
                      </div>
                      <div style={{ fontSize: 11, color: C.navyDim, fontWeight: 600, marginTop: 2 }}>
                        {c.telefono || "no tel"} · {c.citta || ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {allowAdd && (
              <button
                onClick={() => setAddMode(true)}
                style={{
                  margin: "8px 12px 14px 12px",
                  padding: 11, borderRadius: 10,
                  background: C.greenSoft, color: C.green,
                  border: `1.5px dashed ${C.greenBright}`,
                  fontSize: 12, fontWeight: 800,
                  cursor: "pointer", textAlign: "center",
                }}
              >
                + Aggiungi nuovo cliente
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
