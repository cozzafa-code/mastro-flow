// components/mobile/agenda/AgendaBottomNav.tsx
"use client";
import React from "react";

interface Props {
  active?: "home" | "commesse" | "agenda" | "talk" | "menu";
  onNavigate?: (k: "home" | "commesse" | "agenda" | "talk" | "menu") => void;
}

const ITEMS = [
  { key: "home" as const,     label: "Home",     pill: "#D4F0E5", icon: "M3 12l9-9 9 9 M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" },
  { key: "commesse" as const, label: "Commesse", pill: "#D4E0F5", icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
  { key: "agenda" as const,   label: "Agenda",   pill: "#FFD9E1", icon: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" },
  { key: "talk" as const,     label: "Talk",     pill: "#FCE4C2", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { key: "menu" as const,     label: "Altro",    pill: "#E0D6F0", icon: "M5 12h.01 M12 12h.01 M19 12h.01" },
];

export default function AgendaBottomNav({ active = "agenda", onNavigate }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1px solid #E4E4E7",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        paddingTop: 8,
        display: "flex",
        zIndex: 80,
        boxShadow: "0 -4px 14px rgba(0,0,0,0.04)",
      }}
    >
      {ITEMS.map((it) => {
        const isActive = active === it.key;
        return (
          <div
            key={it.key}
            onClick={() => onNavigate?.(it.key)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            <div
              style={{
                width: 40,
                height: 28,
                borderRadius: 14,
                background: isActive ? it.pill : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#0D1F1F" : "#71717A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={it.icon} />
              </svg>
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 600, color: isActive ? "#0D1F1F" : "#71717A" }}>
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
