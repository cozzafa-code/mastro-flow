"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon, IconName } from "./icons";
import AvatarGradient from "./AvatarGradient";

// =========================================================
// SidebarTablet - 224px fisso
// =========================================================
// Struttura:
//   - Logo box scuro "fliwoX" (44px) margin 16/16/18
//   - Nav: 15 voci (icona quadrata 28px colorata + label)
//     Voce attiva = sfondo teal-400 + ombra soft
//   - User card in basso: avatar gradient + nome + ruolo + chevron
// =========================================================

interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
  /** Colore quadratino icona (pastel-400). */
  color: string;
}

const MENU: MenuItem[] = [
  { id: "dashboard",    label: "Dashboard",       icon: "dashboard",    color: TT.teal[400]   },
  { id: "calendario",   label: "Calendario",      icon: "calendario",   color: TT.violet[400] },
  { id: "commesse",     label: "Commesse",        icon: "commesse",     color: TT.orange[400] },
  { id: "sopralluoghi", label: "Sopralluoghi",    icon: "sopralluoghi", color: TT.red[400]    },
  { id: "produzione",   label: "Produzione",      icon: "produzione",   color: TT.blue[400]   },
  { id: "montaggi",     label: "Montaggi",        icon: "montaggi",     color: TT.green[400]  },
  { id: "ordini",       label: "Ordini fornitori",icon: "ordini",       color: TT.orange[400] },
  { id: "magazzino",    label: "Magazzino",       icon: "magazzino",    color: TT.amber[400]  },
  { id: "clienti",      label: "Clienti",         icon: "clienti",      color: TT.violet[400] },
  { id: "contabilita",  label: "Contabilità",icon:"contabilita",  color: TT.pink[400]   },
  { id: "fiscale",      label: "Fiscale",         icon: "fiscale",      color: TT.green[400]  },
  { id: "team",         label: "Team",            icon: "team",         color: TT.teal[400]   },
  { id: "ops",          label: "OPS",             icon: "ops",          color: TT.teal[400]   },
  { id: "ai",           label: "AI Mastro AI",    icon: "ai",           color: TT.blue[400]   },
  { id: "impostazioni", label: "Impostazioni",    icon: "impostazioni", color: TT.orange[400] },
];

export interface SidebarTabletProps {
  /** Voce attiva (default "dashboard"). */
  active?: string;
  /** Callback click voce. */
  onSelect?: (id: string) => void;
  /** Nome utente nella card in basso. */
  userName?: string;
  /** Ruolo utente. */
  userRole?: string;
}

export default function SidebarTablet({
  active = "dashboard",
  onSelect,
  userName = "Fabio Cozza",
  userRole = "Amministratore",
}: SidebarTabletProps) {
  return (
    <aside
      style={{
        gridArea: "sidebar",
        background: TT.surface,
        borderRight: `1px solid ${TT.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* LOGO */}
      <div
        style={{
          margin: "16px 16px 18px",
          height: 44,
          background: TT.logoBg,
          borderRadius: TT.rMd,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "0 12px",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            background: TT.teal[400],
            borderRadius: TT.rXs,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "-0.3px",
          }}
        >
          X
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.4px",
          }}
        >
          fliwo<span style={{ color: TT.teal[300] }}>X</span>
        </div>
      </div>

      {/* NAV */}
      <nav
        style={{
          flex: 1,
          padding: "0 12px",
          overflowY: "auto",
        }}
      >
        {MENU.map((m) => {
          const isActive = m.id === active;
          return (
            <div
              key={m.id}
              onClick={() => onSelect?.(m.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: TT.rSm + 2, // 10
                cursor: "pointer",
                marginBottom: 2,
                color: isActive ? "#fff" : TT.text2,
                background: isActive ? TT.teal[400] : "transparent",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: "-0.1px",
                transition: "background 0.12s",
                boxShadow: isActive
                  ? "0 2px 6px rgba(45,212,191,0.25)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              {/* Quadratino icona */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: TT.rSm,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: isActive ? "rgba(255,255,255,0.22)" : m.color,
                }}
              >
                <Icon name={m.icon} size={14} color="#fff" />
              </div>
              <span>{m.label}</span>
            </div>
          );
        })}
      </nav>

      {/* USER CARD */}
      <div
        style={{
          margin: "10px 16px 16px",
          padding: "10px 12px",
          background: TT.bgSoft,
          borderRadius: TT.rMd,
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          border: `1px solid ${TT.border}`,
        }}
      >
        <AvatarGradient size={36} preset="default" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: TT.text1,
              letterSpacing: "-0.1px",
            }}
          >
            {userName}
          </div>
          <div style={{ fontSize: 11, color: TT.text3, marginTop: 1 }}>
            {userRole}
          </div>
        </div>
        <Icon name="chevronRight" size={14} color={TT.text3} strokeWidth={2} />
      </div>
    </aside>
  );
}
