"use client";
import * as React from "react";
import { useMastro } from "../MastroContext";

type Mode = "sm" | "md" | "lg";

const C = {
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  border: "#E2E8F0",
  navy: "#1E3A5F",
  navyDark: "#0F1B2D",
  red: "#DC2626",
};

export interface TopbarTabletProps {
  notificationCount?: number;
  collapsed?: boolean;
  onToggleSidebar?: () => void;
  mode?: Mode;
}

export default function TopbarTablet({
  notificationCount = 0,
  collapsed = false,
  onToggleSidebar,
  mode = "lg",
}: TopbarTabletProps) {
  const ctx = useMastro();
  const { setShowModal, searchQ, setSearchQ } = ctx as any;

  const handleNuovaCommessa = () => {
    if (setShowModal) setShowModal("commessa");
  };

  return (
    <div style={{
      gridArea: "topbar",
      background: C.card,
      borderBottom: `1px solid ${C.border}`,
      padding: "12px 18px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      minHeight: 64,
    }}>
      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        style={{
          width: 42, height: 42, borderRadius: 10,
          background: C.cardSoft, border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}
        title={collapsed ? "Espandi sidebar" : "Comprimi sidebar"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Search */}
      <div style={{
        flex: 1, minWidth: 0,
        background: C.cardSoft, borderRadius: 11,
        padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.subLight} strokeWidth={2.5} style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={searchQ || ""}
          onChange={(e) => { if (setSearchQ) setSearchQ(e.target.value); }}
          placeholder="Cerca commesse, clienti..."
          style={{
            flex: 1, border: "none", background: "transparent",
            fontSize: 14, fontWeight: 600, color: C.ink, outline: "none",
            fontFamily: "inherit", minWidth: 0,
          }}
        />
      </div>

      {/* Notifiche */}
      <button
        style={{
          width: 42, height: 42, borderRadius: 10,
          background: C.cardSoft, border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative", flexShrink: 0,
        }}
        title="Notifiche"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {notificationCount > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 18, height: 18, borderRadius: 999,
            background: C.red, color: "#fff",
            fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 5px",
          }}>{notificationCount}</span>
        )}
      </button>

      {/* + NUOVA */}
      <button
        onClick={handleNuovaCommessa}
        style={{
          padding: mode === "sm" ? "10px 14px" : "10px 18px",
          background: C.navy, color: "#fff",
          border: "none", borderRadius: 11,
          fontSize: 13, fontWeight: 800,
          letterSpacing: 0.4, textTransform: "uppercase",
          cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "inherit",
          boxShadow: "0 2px 8px rgba(30,58,95,0.25)",
        }}
        title="Nuova commessa"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nuova
      </button>
    </div>
  );
}
