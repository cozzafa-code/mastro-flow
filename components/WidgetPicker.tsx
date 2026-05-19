"use client";
import React, { useState } from "react";
import { WIDGET_CATALOG, CATEGORIES, CATEGORY_COLORS } from "./widgetCatalog";

const TEAL = "#28A0A0";
const TEAL_DARK = "#1A7A7A";
const DARK = "#0D1F1F";
const SUB = "#5A7878";
const WHITE = "#FFFFFF";
const LIGHT = "#EEF8F8";
const BORDER = "#C8E4E4";

interface Props {
  open: boolean;
  onClose: () => void;
  activeIds: string[];
  onToggle: (id: string) => void;
}

export default function WidgetPicker({ open, onClose, activeIds, onToggle }: Props) {
  const [search, setSearch] = useState("");
  const [tabCat, setTabCat] = useState<string>("TUTTI");

  if (!open) return null;

  const filtered = WIDGET_CATALOG.filter(w => {
    if (tabCat !== "TUTTI" && w.category !== tabCat) return false;
    if (search && !w.label.toLowerCase().includes(search.toLowerCase()) &&
        !w.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(13,31,31,0.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 500, background: WHITE,
        borderRadius: "28px 28px 0 0", padding: "14px 0 24px",
        maxHeight: "88vh", display: "flex", flexDirection: "column",
        boxShadow: "0 -6px 40px rgba(0,0,0,0.25)",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ width: 44, height: 5, borderRadius: 3, background: BORDER, margin: "0 auto 12px" }} />

        <div style={{ padding: "0 20px 12px" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: DARK, letterSpacing: "-0.3px" }}>Personalizza home</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>Scegli cosa vedere sulla tua dashboard</div>
        </div>

        <div style={{ padding: "0 20px 10px" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca widget..."
            style={{
              width: "100%", padding: "11px 14px", borderRadius: 12,
              border: `1.5px solid ${BORDER}`, background: LIGHT,
              fontSize: 14, color: DARK, outline: "none",
              boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, padding: "0 16px 12px", overflowX: "auto", flexShrink: 0 }}>
          {["TUTTI", ...CATEGORIES].map(cat => {
            const active = tabCat === cat;
            const col = cat === "TUTTI" ? TEAL : CATEGORY_COLORS[cat as any];
            return (
              <button key={cat} onClick={() => setTabCat(cat)} style={{
                padding: "7px 13px", borderRadius: 16,
                border: `1.5px solid ${active ? col : BORDER}`,
                background: active ? col : "transparent",
                color: active ? WHITE : SUB,
                fontSize: 11, fontWeight: 800, cursor: "pointer",
                whiteSpace: "nowrap" as any, flexShrink: 0,
                letterSpacing: "0.3px", fontFamily: "inherit",
              }}>{cat}</button>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 8px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: SUB, fontSize: 13 }}>Nessun widget trovato</div>
          )}
          {filtered.map(w => {
            const active = activeIds.includes(w.id);
            const catCol = CATEGORY_COLORS[w.category];
            return (
              <div key={w.id} onClick={() => onToggle(w.id)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", marginBottom: 7, borderRadius: 14,
                background: active ? LIGHT : WHITE,
                border: `1.5px solid ${active ? TEAL : BORDER}`,
                cursor: "pointer", transition: "all 0.15s",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${catCol}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={catCol} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {w.iconPath}
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{w.label}</div>
                  <div style={{ fontSize: 11, color: SUB, marginTop: 1 }}>{w.description}</div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: 8,
                  border: `1.5px solid ${active ? TEAL : BORDER}`,
                  background: active ? TEAL : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "10px 20px 0", borderTop: `1px solid ${BORDER}`, marginTop: 6 }}>
          <button onClick={onClose} style={{
            width: "100%", padding: 14, borderRadius: 14, border: "none",
            background: `linear-gradient(145deg, ${TEAL}, ${TEAL_DARK})`,
            color: WHITE, fontSize: 15, fontWeight: 800, cursor: "pointer",
            boxShadow: `0 4px 12px ${TEAL}40`,
            fontFamily: "inherit", letterSpacing: "0.2px",
          }}>
            Fatto · {activeIds.length} widget attivi
          </button>
        </div>
      </div>
    </div>
  );
}
