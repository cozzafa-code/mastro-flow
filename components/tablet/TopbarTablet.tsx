"use client";
import * as React from "react";

type Mode = "xs" | "sm" | "md" | "lg";

const C = {
  bg: "#FFFFFF",
  bgSoft: "#F2F4F8",
  border: "#E2E8F0",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  navy: "#1E3A5F",
  red: "#DC2626",
};

export interface TopbarTabletProps {
  greeting?: string;
  subtitle?: string;
  notificationCount?: number;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onBellClick?: () => void;
  onChatClick?: () => void;
  onTaskClick?: () => void;
  onAvatarClick?: () => void;
  compact?: boolean;
  collapsed?: boolean;
  onToggleSidebar?: () => void;
  mode?: Mode;
}

export default function TopbarTablet({
  notificationCount = 3,
  searchPlaceholder = "Cerca commesse, clienti, vani, fatture, articoli...",
  onSearch,
  onBellClick,
  collapsed = false,
  onToggleSidebar,
  mode = "lg",
}: TopbarTabletProps) {
  const [value, setValue] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  const handleChange = (v: string) => {
    setValue(v);
    onSearch?.(v);
  };

  // Responsive sizes
  const btnSize = mode === "xs" ? 40 : mode === "sm" ? 42 : 46;
  const padX = mode === "xs" ? 12 : mode === "sm" ? 16 : 22;
  const gap = mode === "xs" ? 8 : 12;
  const searchPadY = mode === "xs" ? 10 : mode === "sm" ? 11 : 12;
  const searchFont = mode === "xs" ? 13 : mode === "sm" ? 14 : 15;
  const searchPlaceholderShort = mode === "xs" ? "Cerca..." : mode === "sm" ? "Cerca commesse, clienti..." : searchPlaceholder;
  const showShortcut = mode === "lg" || mode === "md";
  const showCtaText = mode !== "xs";

  return (
    <header
      style={{
        gridArea: "topbar",
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        padding: `${mode === "xs" ? 10 : 14}px ${padX}px`,
        display: "flex",
        alignItems: "center",
        gap,
      }}
    >
      {/* TOGGLE SIDEBAR */}
      <div
        onClick={onToggleSidebar}
        title={collapsed ? "Espandi menu" : "Comprimi menu"}
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: 11,
          background: C.bgSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: C.navy,
          flexShrink: 0,
        }}
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
          style={{
            transition: "transform 0.25s ease",
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="15" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>

      {/* SEARCH PERMANENTE */}
      <div
        style={{
          flex: 1,
          background: focused ? C.bg : C.bgSoft,
          border: `2px solid ${focused ? C.navy : "transparent"}`,
          borderRadius: 13,
          padding: `${searchPadY}px ${mode === "xs" ? 12 : 16}px`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          transition: "all 0.15s",
          minWidth: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.subLight} strokeWidth={2.5} style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={searchPlaceholderShort}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: searchFont,
            fontWeight: 600,
            color: C.ink,
            outline: "none",
            fontFamily: "inherit",
            minWidth: 0,
          }}
        />
        {showShortcut && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <kbd style={{
              background: C.bg,
              border: `1px solid #CBD5E1`,
              borderRadius: 5,
              padding: "3px 7px",
              fontSize: 11,
              fontFamily: "inherit",
              fontWeight: 700,
              color: "#475A75",
            }}>⌘</kbd>
            <kbd style={{
              background: C.bg,
              border: `1px solid #CBD5E1`,
              borderRadius: 5,
              padding: "3px 7px",
              fontSize: 11,
              fontFamily: "inherit",
              fontWeight: 700,
              color: "#475A75",
            }}>K</kbd>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS */}
      <div
        onClick={onBellClick}
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: 11,
          background: C.bgSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: C.navy,
          position: "relative",
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {notificationCount > 0 && (
          <span style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 18,
            height: 18,
            background: C.red,
            color: "#fff",
            borderRadius: "50%",
            fontSize: 10,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${C.bgSoft}`,
          }}>{notificationCount}</span>
        )}
      </div>

      {/* CTA NUOVA */}
      <div
        style={{
          height: btnSize,
          padding: `0 ${mode === "xs" ? 12 : 18}px`,
          borderRadius: 11,
          background: C.navy,
          color: "#fff",
          fontSize: 12,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          letterSpacing: 0.4,
          textTransform: "uppercase",
          boxShadow: `0 3px 10px rgba(30,58,95,0.3)`,
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {showCtaText && "Nuova"}
      </div>
    </header>
  );
}
