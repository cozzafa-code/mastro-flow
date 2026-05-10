"use client";
import * as React from "react";
import { Icon, IconName } from "./icons";

type Mode = "xs" | "sm" | "md" | "lg";

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
  mode?: Mode;
}

export default function SidebarTablet({
  active = "dashboard",
  onSelect,
  userName = "Fabio Cozza",
  userRole = "Titolare",
  collapsed = false,
  mode = "lg",
}: SidebarTabletProps) {
  const initials = userName.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  // Dimensioni responsive
  const itemPadX = collapsed ? 0 : (mode === "lg" ? 16 : mode === "md" ? 14 : 12);
  const itemPadY = mode === "lg" ? 13 : mode === "md" ? 12 : 10;
  const navItemFont = mode === "lg" ? 14 : mode === "md" ? 13 : 13;
  const iconSize = mode === "xs" ? 20 : 22;
  const logoSize = mode === "lg" ? 24 : mode === "md" ? 22 : 20;

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
      }}
    >
      {/* LOGO */}
      <div style={{
        padding: collapsed ? "16px 0 18px" : `${mode === "lg" ? 20 : 16}px ${mode === "lg" ? 24 : 18}px ${mode === "lg" ? 24 : 18}px`,
        borderBottom: `1px solid ${C.white10}`,
        marginBottom: 12,
        display: "flex",
        justifyContent: collapsed ? "center" : "flex-start",
        alignItems: "center",
      }}>
        {collapsed ? (
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: C.navyLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff",
          }}>X</div>
        ) : (
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: logoSize, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>fliwoX</div>
            <div style={{ fontSize: 10, color: C.blueLight, fontWeight: 600, letterSpacing: 0.4, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>MASTRO ERP</div>
          </div>
        )}
      </div>

      {/* MENU */}
      <nav style={{
        flex: 1,
        padding: collapsed ? "0 10px" : `0 ${mode === "lg" ? 12 : 10}px`,
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
                gap: collapsed ? 0 : 14,
                padding: collapsed ? `${itemPadY + 1}px 0` : `${itemPadY}px ${itemPadX}px`,
                borderRadius: 11,
                cursor: "pointer",
                color: isActive ? "#fff" : C.white60,
                fontSize: navItemFont,
                fontWeight: isActive ? 700 : 600,
                marginBottom: 3,
                background: isActive ? C.white12 : "transparent",
                boxShadow: isActive ? `inset 4px 0 0 #fff` : "none",
                justifyContent: collapsed ? "center" : "flex-start",
                position: "relative",
              }}
            >
              <div style={{ width: iconSize, height: iconSize, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={item.icon} size={iconSize} color="currentColor" />
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
                      padding: "2px 6px",
                      borderRadius: 999,
                      minWidth: 18,
                      textAlign: "center",
                    }}>{item.badge}</span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span style={{
                  position: "absolute",
                  top: 5,
                  right: 11,
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
        padding: collapsed ? "12px 0" : `12px ${mode === "lg" ? 14 : 12}px`,
        margin: collapsed ? "0 10px 12px" : `0 ${mode === "lg" ? 12 : 10}px 12px`,
        background: C.white06,
        borderRadius: 11,
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 12, color: "#fff", flexShrink: 0,
        }}>{initials}</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
            <div style={{ fontSize: 10, color: C.blueLight, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userRole}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
