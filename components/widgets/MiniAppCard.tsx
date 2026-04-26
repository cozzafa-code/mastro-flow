"use client";
import React from "react";
import { stopProp } from "./shared/helpers";
import { IconClose, IconArrow } from "./shared/icons";

/* ────────────────────────────────────────────────────────────
   MINI-APP CARD · MASTRO
   Componente base riutilizzabile per tutti i widget mini-app.
   Stile light coerente con HomePanelMobile.
   ──────────────────────────────────────────────────────────── */

export const TOKENS = {
  white: "#FFFFFF",
  ink: "#1A1A1A",
  inkSoft: "#555555",
  muted: "#888888",
  hairline: "#F0F0EB",
  hairlineSoft: "#F5F5F0",

  teal: "#2BA89A",
  tealLight: "#E0F1EE",
  tealLight2: "#F0F9F7",
  tealInk: "#0F5E55",

  peach: "#FFE5DC",
  peachInk: "#C44D2B",
  peachBar: "#F0997B",

  lilac: "#EBE8FA",
  lilacInk: "#5C4FB5",
  lilacBar: "#AFA9EC",

  mint: "#DFF5EA",
  mintInk: "#2A8E5C",
  mintBar: "#5DCAA5",

  amber: "#FFF1D6",
  amberInk: "#A36B12",
  amberBar: "#F5A030",

  rose: "#FFE0EA",
  roseInk: "#A12349",
  roseBar: "#F26B92",

  sky: "#DCEBFA",
  skyInk: "#1F4F87",
  skyBar: "#5C9FE0",

  red: "#FFE0E0",
  redInk: "#A02020",
  redBar: "#E45050",

  green: "#E1F5DC",
  greenInk: "#2D6E1A",
  greenBar: "#5BC042",
};

export interface MiniAppAction {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "primary" | "secondary" | "danger" | "neutral";
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface MiniAppCardProps {
  /* Header */
  iconBg?: string;        // background colore icona (default tealLight)
  iconColor?: string;     // colore stroke icona (default teal)
  icon: React.ReactNode;  // SVG icona
  title: string;
  subtitle?: string;
  badge?: { label: string; bg?: string; fg?: string } | null;

  /* Hero — riga principale a colpo d'occhio */
  hero?: React.ReactNode;

  /* Lista — children scrollabile interno */
  children?: React.ReactNode;

  /* Actions in fondo (fino a 4 bottoni) */
  actions?: MiniAppAction[];

  /* Stato vuoto (sostituisce children quando isEmpty=true) */
  empty?: { title: string; cta?: { label: string; onClick: () => void } } | null;
  isEmpty?: boolean;

  /* Edit mode dell'host */
  editMode?: boolean;
  onRemove?: () => void;

  /* Click su intero widget (header) → naviga */
  onOpen?: () => void;
  openLabel?: string;     // testo del link in header (es. "vedi tutto")

  /* Variante hero */
  heroVariant?: "teal" | "peach" | "lilac" | "mint" | "amber" | "rose" | "sky" | "red" | "green" | "none";

  /* Altezza max della lista scrollabile */
  listMaxHeight?: number; // default 200
}

const heroBg = (variant: MiniAppCardProps["heroVariant"]) => {
  switch (variant) {
    case "peach":  return `linear-gradient(135deg, ${TOKENS.peach} 0%, #FFF0E8 100%)`;
    case "lilac":  return `linear-gradient(135deg, ${TOKENS.lilac} 0%, #F4F2FE 100%)`;
    case "mint":   return `linear-gradient(135deg, ${TOKENS.mint} 0%, #EAFAF1 100%)`;
    case "amber":  return `linear-gradient(135deg, ${TOKENS.amber} 0%, #FFF7E5 100%)`;
    case "rose":   return `linear-gradient(135deg, ${TOKENS.rose} 0%, #FFEAF1 100%)`;
    case "sky":    return `linear-gradient(135deg, ${TOKENS.sky} 0%, #ECF3FB 100%)`;
    case "red":    return `linear-gradient(135deg, ${TOKENS.red} 0%, #FFEAEA 100%)`;
    case "green":  return `linear-gradient(135deg, ${TOKENS.green} 0%, #ECFAE5 100%)`;
    case "none":   return TOKENS.tealLight2;
    case "teal":
    default:       return `linear-gradient(135deg, ${TOKENS.tealLight} 0%, ${TOKENS.tealLight2} 100%)`;
  }
};

const actionStyle = (variant: MiniAppAction["variant"], disabled?: boolean): React.CSSProperties => {
  const base: React.CSSProperties = {
    border: "none",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 11,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    flex: 1,
    opacity: disabled ? 0.45 : 1,
    transition: "transform 0.1s ease",
    minHeight: 32,
    whiteSpace: "nowrap",
  };
  switch (variant) {
    case "primary":
      return { ...base, background: TOKENS.teal, color: TOKENS.white };
    case "danger":
      return { ...base, background: TOKENS.red, color: TOKENS.redInk, border: `1px solid ${TOKENS.redBar}40` };
    case "neutral":
      return { ...base, background: TOKENS.hairlineSoft, color: TOKENS.ink, border: `1px solid ${TOKENS.hairline}` };
    case "secondary":
    default:
      return { ...base, background: TOKENS.white, border: `1px solid ${TOKENS.hairline}`, color: TOKENS.ink };
  }
};

export const MiniAppCard: React.FC<MiniAppCardProps> = ({
  iconBg = TOKENS.tealLight,
  iconColor = TOKENS.teal,
  icon,
  title,
  subtitle,
  badge = null,
  hero,
  children,
  actions = [],
  empty = null,
  isEmpty = false,
  editMode = false,
  onRemove,
  onOpen,
  openLabel,
  heroVariant = "teal",
  listMaxHeight = 200,
}) => {

  const headerClickable = !editMode && onOpen;

  return (
    <div style={{
      background: TOKENS.white,
      borderRadius: 22,
      padding: 14,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      border: "1px solid rgba(0,0,0,0.04)",
      position: "relative",
      cursor: headerClickable ? "pointer" : "default",
    }}
    onClick={headerClickable ? onOpen : undefined}>

      {/* Bottone × in edit mode */}
      {editMode && onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            position: "absolute" as any,
            top: -7, right: -7,
            width: 24, height: 24, borderRadius: 12,
            background: TOKENS.white,
            border: "1px solid rgba(0,0,0,0.08)",
            color: TOKENS.muted,
            cursor: "pointer", padding: 0,
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2,
          }}
          aria-label="Rimuovi widget"
        >
          <IconClose size={12} color={TOKENS.muted} strokeWidth={2.5} />
        </button>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28,
          background: iconBg,
          borderRadius: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.2 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: 10, color: TOKENS.muted, marginTop: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{subtitle}</div>
          )}
        </div>
        {badge && (
          <div style={{
            background: badge.bg || TOKENS.tealLight,
            color: badge.fg || TOKENS.teal,
            fontSize: 10, fontWeight: 700,
            padding: "3px 8px", borderRadius: 8,
            flexShrink: 0,
          }}>{badge.label}</div>
        )}
        {!badge && headerClickable && openLabel && (
          <div style={{
            fontSize: 10, color: TOKENS.teal, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 3, flexShrink: 0,
          }}>
            {openLabel}
            <IconArrow size={9} color={TOKENS.teal} />
          </div>
        )}
      </div>

      {/* Empty state — sostituisce hero + children */}
      {isEmpty && empty ? (
        <div style={{
          padding: "20px 8px",
          textAlign: "center" as const,
          background: TOKENS.hairlineSoft,
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 13, color: TOKENS.inkSoft, marginBottom: empty.cta ? 10 : 0 }}>
            {empty.title}
          </div>
          {empty.cta && (
            <button
              onClick={(e) => { stopProp(e); empty.cta!.onClick(); }}
              style={{
                background: TOKENS.teal,
                border: "none",
                color: TOKENS.white,
                fontSize: 11, fontWeight: 600,
                padding: "7px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >{empty.cta.label}</button>
          )}
        </div>
      ) : (
        <>
          {/* Hero */}
          {hero && (
            <div style={{
              background: heroVariant === "none" ? "transparent" : heroBg(heroVariant),
              borderRadius: 14,
              padding: heroVariant === "none" ? 0 : 12,
              marginBottom: children ? 12 : (actions.length ? 12 : 0),
            }} onClick={stopProp}>
              {hero}
            </div>
          )}

          {/* Children scrollabili */}
          {children && (
            <div
              onTouchStart={stopProp as any}
              onTouchMove={stopProp as any}
              onClick={stopProp}
              style={{
                maxHeight: listMaxHeight,
                overflowY: "auto" as const,
                overflowX: "hidden" as const,
                WebkitOverflowScrolling: "touch" as any,
                touchAction: "pan-y" as any,
                margin: "0 -2px",
                padding: "0 2px",
                marginBottom: actions.length ? 10 : 0,
              }}
            >
              {children}
            </div>
          )}
        </>
      )}

      {/* Azioni in fondo */}
      {actions.length > 0 && !isEmpty && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(actions.length, 4)}, 1fr)`,
          gap: 5,
          marginTop: 4,
        }} onClick={stopProp}>
          {actions.slice(0, 4).map((a, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); if (!a.disabled) a.onClick(e); }}
              disabled={a.disabled}
              style={actionStyle(a.variant, a.disabled)}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   MiniListRow · riga standard nella lista interna
   ──────────────────────────────────────────────────────────── */

export interface MiniListRowProps {
  leading?: React.ReactNode;     // pallino, orario, avatar
  bar?: string;                  // colore barra verticale
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;    // badge tipo, contatore
  onClick?: () => void;
  actions?: { icon: React.ReactNode; onClick: () => void; color?: string }[];
  isFirst?: boolean;
  alert?: boolean;               // se true sfondo rossiccio leggero
}

export const MiniListRow: React.FC<MiniListRowProps> = ({
  leading, bar, title, subtitle, trailing, onClick, actions = [], isFirst = false, alert = false,
}) => {
  return (
    <div
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderTop: isFirst ? "none" : `1px solid ${TOKENS.hairline}`,
        cursor: onClick ? "pointer" : "default",
        background: alert ? "linear-gradient(90deg, #FFF5F5 0%, transparent 60%)" : "transparent",
        marginLeft: alert ? -2 : 0,
        marginRight: alert ? -2 : 0,
        paddingLeft: alert ? 2 : 0,
        paddingRight: alert ? 2 : 0,
        borderRadius: alert ? 6 : 0,
      }}
    >
      {leading && (
        <div style={{ flexShrink: 0 }}>{leading}</div>
      )}
      {bar && (
        <div style={{ width: 3, height: 26, background: bar, borderRadius: 2, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: TOKENS.ink,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontSize: 10, color: TOKENS.muted, marginTop: 1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{subtitle}</div>
        )}
      </div>
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); a.onClick(); }}
          style={{
            background: a.color || TOKENS.tealLight,
            border: "none",
            borderRadius: 8,
            padding: "5px 7px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {a.icon}
        </button>
      ))}
      {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   MiniBadge · badge inline standard
   ──────────────────────────────────────────────────────────── */

export const MiniBadge: React.FC<{ label: string; bg?: string; fg?: string; size?: "sm" | "md" }> = ({ label, bg, fg, size = "md" }) => (
  <div style={{
    background: bg || TOKENS.tealLight,
    color: fg || TOKENS.teal,
    fontSize: size === "sm" ? 8 : 9,
    fontWeight: 700,
    padding: size === "sm" ? "2px 5px" : "2px 7px",
    borderRadius: size === "sm" ? 4 : 5,
    letterSpacing: "0.2px",
    whiteSpace: "nowrap",
  }}>{label}</div>
);

/* Pallino pulsante per "live" indicator */
export const MiniLivePulse: React.FC<{ color?: string; size?: number }> = ({ color = TOKENS.teal, size = 6 }) => (
  <span style={{
    display: "inline-block",
    width: size, height: size,
    borderRadius: 50,
    background: color,
    animation: "miniapp-pulse 2s infinite",
    flexShrink: 0,
  }} />
);

/* CSS keyframes injection: una volta sola */
if (typeof document !== "undefined" && !document.getElementById("miniapp-keyframes")) {
  const style = document.createElement("style");
  style.id = "miniapp-keyframes";
  style.textContent = `@keyframes miniapp-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.55; transform: scale(1.5); }
  }`;
  document.head.appendChild(style);
}

export default MiniAppCard;
