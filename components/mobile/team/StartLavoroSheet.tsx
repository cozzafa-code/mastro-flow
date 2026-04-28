// components/mobile/team/StartLavoroSheet.tsx
// Sheet di selezione commessa per "Avvia lavoro"
"use client";
import React, { useEffect, useState } from "react";
import { listaCommesseAttive, type CommessaPerAvvio } from "@/lib/team-actions";
import { TOKENS } from "@/components/widgets/MiniAppCard";
import { IconClose, IconFile } from "@/components/widgets/shared/icons";

interface Props {
  operatorName: string;
  onClose: () => void;
  onSelect: (commessa: CommessaPerAvvio) => void;
}

export default function StartLavoroSheet({ operatorName, onClose, onSelect }: Props) {
  const [commesse, setCommesse] = useState<CommessaPerAvvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listaCommesseAttive();
        if (alive) { setCommesse(list); setLoading(false); }
      } catch (e: any) {
        if (alive) { setError(e?.message || "Errore"); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = commesse.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.code || "").toLowerCase().includes(s) ||
           (c.cliente || "").toLowerCase().includes(s) ||
           (c.cognome || "").toLowerCase().includes(s) ||
           (c.indirizzo || "").toLowerCase().includes(s);
  });

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.5)", zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#F4F1EA", width: "100%", maxWidth: 480,
        maxHeight: "85vh", overflowY: "auto",
        borderRadius: "20px 20px 0 0",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)",
          padding: "16px 18px", color: "#FFF",
          display: "flex", alignItems: "center", gap: 12,
          borderRadius: "20px 20px 0 0",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Avvia lavoro</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>per {operatorName}</div>
          </div>
          <div onClick={onClose} style={{ cursor: "pointer" }}>
            <IconClose size={20} color="#FFF" />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: TOKENS.muted, marginBottom: 10, paddingLeft: 4 }}>Scegli la commessa</div>

          {/* Search */}
          <input
            type="text"
            placeholder="Cerca codice / cliente / indirizzo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px",
              borderRadius: 12, border: `1px solid ${TOKENS.hairline}`,
              background: "#FFF", fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
              marginBottom: 10,
              boxSizing: "border-box" as any,
            }}
          />

          {loading && <div style={{ padding: 24, textAlign: "center" as any, color: TOKENS.muted, fontSize: 13 }}>Caricamento...</div>}
          {error && <div style={{ padding: 14, background: TOKENS.red, color: TOKENS.redInk, borderRadius: 10, fontSize: 12 }}>Errore: {error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center" as any, color: TOKENS.muted, fontSize: 13 }}>
              {commesse.length === 0 ? "Nessuna commessa attiva" : "Nessun risultato"}
            </div>
          )}

          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              style={{
                background: "#FFF", borderRadius: 14, padding: 12,
                marginBottom: 8, cursor: "pointer",
                border: `1px solid ${TOKENS.hairline}`,
                display: "flex", alignItems: "center", gap: 10,
              }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: TOKENS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconFile size={14} color={TOKENS.teal} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>
                  {c.code || "—"} {c.cliente && `· ${c.cliente}${c.cognome ? " " + c.cognome : ""}`}
                </div>
                {c.indirizzo && (
                  <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                    {c.indirizzo}
                  </div>
                )}
              </div>
              {c.fase && (
                <div style={{
                  fontSize: 9, fontWeight: 700,
                  background: TOKENS.tealLight, color: TOKENS.tealInk,
                  padding: "3px 7px", borderRadius: 6,
                  textTransform: "uppercase" as any, letterSpacing: 0.3,
                  flexShrink: 0,
                }}>{c.fase}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
