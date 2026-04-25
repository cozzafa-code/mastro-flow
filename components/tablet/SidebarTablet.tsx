"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon, IconName } from "./icons";
import AvatarGradient from "./AvatarGradient";

interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
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
  active?: string;
  onSelect?: (id: string) => void;
  userName?: string;
  userRole?: string;
  collapsed?: boolean;
}

export default function SidebarTablet({
  active = "dashboard",
  onSelect,
  userName = "Fabio Cozza",
  userRole = "Amministratore",
  collapsed = false,
}: SidebarTabletProps) {
  return (
    <aside
      style={{
        gridArea: "sidebar",
        background: TT.surface,
        borderRight: `1px solid ${TT.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.18s ease",
      }}
    >
      {/* LOGO */}
      <div
        style={{
          margin: collapsed ? "16px 12px 18px" : "16px 16px 18px",
          height: 44,
          background: TT.logoBgGradient,
          borderRadius: TT.rMd,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: collapsed ? 0 : "0 12px",
          boxShadow: "0 4px 12px rgba(15,23,42,0.20), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            background: `linear-gradient(135deg, ${TT.teal[300]}, ${TT.teal[500]})`,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "-0.3px",
            boxShadow: "0 2px 6px rgba(20,165,153,0.4)",
          }}
        >
          X
        </div>
        {!collapsed && (
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
        )}
      </div>

      {/* NAV */}
      <nav style={{ flex: 1, padding: collapsed ? "0 8px" : "0 12px", overflowY: "auto" }}>
        {MENU.map((m) => {
          const isActive = m.id === active;
          return (
            <div
              key={m.id}
              onClick={() => onSelect?.(m.id)}
              title={collapsed ? m.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "9px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 11,
                cursor: "pointer",
                marginBottom: 2,
                color: isActive ? "#fff" : TT.text2,
                background: isActive
                  ? `linear-gradient(135deg, ${m.color}, ${m.color}E0)`
                  : "transparent",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: "-0.1px",
                transition: "all 0.15s",
                boxShadow: isActive
                  ? `0 4px 12px ${m.color}40, inset 0 1px 0 rgba(255,255,255,0.18)`
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = TT.bgSoft;
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: isActive
                    ? "rgba(255,255,255,0.22)"
                    : `linear-gradient(135deg, ${m.color}, ${m.color}D0)`,
                  boxShadow: isActive
                    ? "inset 0 1px 0 rgba(255,255,255,0.25)"
                    : `0 2px 6px ${m.color}40`,
                }}
              >
                <Icon name={m.icon} size={14} color="#fff" />
              </div>
              {!collapsed && <span>{m.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* USER CARD */}
      <div
        style={{
          margin: collapsed ? "10px 8px 14px" : "10px 16px 16px",
          padding: collapsed ? "8px" : "10px 12px",
          background: TT.bgSoft,
          borderRadius: TT.rMd,
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          border: `1px solid ${TT.border}`,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <AvatarGradient size={collapsed ? 32 : 36} preset="default" />
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TT.text1, letterSpacing: "-0.1px" }}>
                {userName}
              </div>
              <div style={{ fontSize: 11, color: TT.text3, marginTop: 1 }}>
                {userRole}
              </div>
            </div>
            <Icon name="chevronRight" size={14} color={TT.text3} strokeWidth={2} />
          </>
        )}
      </div>
    </aside>
  );
}
