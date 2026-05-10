"use client";
// MASTRO TABLET — Sidebar v9
// Navy uniforme (#1E3A5F), voci con icone monocrome, badge notifiche.
// Mantiene props identiche per non rompere MastroTablet.tsx
import * as React from "react";
import { TT } from "./design-system";
import { Icon, IconName } from "./icons";

interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
  badge?: number;
}

const MENU: MenuItem[] = [
  { id: "dashboard",    label: "Home",            icon: "dashboard"    },
  { id: "commesse",     label: "Commesse",        icon: "commesse",   badge: 2 },
  { id: "calendario",   label: "Agenda",          icon: "calendario"   },
  { id: "ai",           label: "Talk",            icon: "ai",         badge: 3 },
  { id: "clienti",      label: "Clienti",         icon: "clienti"      },
  { id: "contabilita",  label: "Contabilità",     icon: "contabilita"  },
  { id: "produzione",   label: "Produzione",      icon: "produzione"   },
  { id: "magazzino",    label: "Magazzino",       icon: "magazzino",  badge: 5 },
  { id: "team",         label: "Team",            icon: "team"         },
  { id: "ops",          label: "OPS",             icon: "ops"          },
  { id: "fiscale",      label: "Fiscale",         icon: "fiscale"      },
  { id: "impostazioni", label: "Impostazioni",    icon: "impostazioni" },
];

const C = {
  navy: "#1E3A5F",
  navyDark: "#0F1B2D",
  navyLight: "#2D5A87",
  white60: "rgba(255,255,255,0.6)",
  white12: "rgba(255,255,255,0.12)",
  white06: "rgba(255,255,255,0.06)",
  white10: "rgba(255,255,255,0.1)",
  blueLight: "#93B0CF",
  red: "#DC2626",
};

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
  userRole = "Titolare",
  collapsed = false,
}: SidebarTabletProps) {
  const initials = userName.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside
      style={{
        gridArea: "sidebar",
        background: C.navy,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        transition: "all 0.25s ease",
      }}
    >
      {/* LOGO */}
      <div style={{
        padding: collapsed ? "20px 0 24px" : "20px 24px 24px",
        borderBottom: `1px solid ${C.white10}`,
        marginBottom: 14,
        display: "flex",
        justifyContent: collapsed ? "center" : "flex-start",
        alignItems: "center",
      }}>
        {collapsed ? (
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: C.navyLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.5,
          }}>X</div>
        ) : (
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1 }}>fliwoX</div>
            <div style={{ fontSize: 11, color: C.blueLight, fontWeight: 600, letterSpacing: 0.5, marginTop: 4 }}>MASTRO ERP</div>
          </div>
        )}
      </div>

      {/* MENU */}
      <nav style={{
        flex: 1,
        padding: collapsed ? "0 12px" : "0 14px",
        overflowY: "auto",
        overflowX: "hidden",
      }}>
        {MENU.map(item => {
          const isActive = active === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onSelect?.(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: collapsed ? "14px 0" : "13px 16px",
                borderRadius: 12,
                cursor: "pointer",
                color: isActive ? "#fff" : C.white60,
                fontSize: 14,
                fontWeight: isActive ? 700 : 600,
                marginBottom: 4,
                background: isActive ? C.white12 : "transparent",
                boxShadow: isActive ? `inset 4px 0 0 #fff` : "none",
                justifyContent: collapsed ? "center" : "flex-start",
                position: "relative",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = C.white06;
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <div style={{ width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={item.icon} size={22} color="currentColor" />
              </div>
              {!collapsed && (
                <>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      background: C.red,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 999,
                      minWidth: 20,
                      textAlign: "center",
                    }}>{item.badge}</span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span style={{
                  position: "absolute",
                  top: 8,
                  right: 14,
                  background: C.red,
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "1px 5px",
                  borderRadius: 999,
                  minWidth: 14,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}>{item.badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* USER BOX */}
      <div style={{
        padding: collapsed ? "14px 0" : "14px 16px",
        margin: collapsed ? "0 12px 14px" : "0 14px 14px",
        background: C.white06,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 13, color: "#fff", flexShrink: 0,
        }}>{initials}</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
            <div style={{ fontSize: 11, color: C.blueLight, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userRole}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
