"use client";
import * as React from "react";
import { TT, bodyStyle } from "./design-system";
import AvatarGradient from "./AvatarGradient";
import DashboardTablet from "./dashboard/DashboardTablet";

// =========================================================
// MastroTablet - root component versione tablet
// =========================================================
// Layout fisso 1280x800 in preview, responsive in produzione.
// Grid: sidebar 224px | topbar 64px | main scrollabile.
//
// In STEP 1: sidebar e topbar sono placeholder minimi.
// Step 2+ riempiamo con menu, search, KPI, pannelli.
// =========================================================

export default function MastroTablet() {
  return (
    <div
      style={{
        ...bodyStyle,
        width: "100%",
        minHeight: "100vh",
        background: TT.bgSoft,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: TT.contentMaxW,
          maxWidth: "100%",
          height: 800,
          background: TT.bg,
          borderRadius: TT.rLg,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: `${TT.sidebarW}px 1fr`,
          gridTemplateRows: `${TT.topbarH}px 1fr`,
          gridTemplateAreas: `
            "sidebar topbar"
            "sidebar main"
          `,
          boxShadow: TT.shadowLg,
          border: `1px solid ${TT.border}`,
        }}
      >
        {/* SIDEBAR - placeholder step 1 */}
        <aside
          style={{
            gridArea: "sidebar",
            background: TT.surface,
            borderRight: `1px solid ${TT.border}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Logo */}
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

          {/* Placeholder menu (step 2 = 15 voci complete) */}
          <div style={{ flex: 1, padding: "0 12px", color: TT.text3, fontSize: 12 }}>
            <div style={{ padding: "10px 12px", fontStyle: "italic" }}>
              Menu: STEP 2
            </div>
          </div>

          {/* User card placeholder */}
          <div
            style={{
              margin: "10px 16px 16px",
              padding: "10px 12px",
              background: TT.bgSoft,
              borderRadius: TT.rMd,
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: `1px solid ${TT.border}`,
            }}
          >
            <AvatarGradient size={36} preset="default" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TT.text1 }}>
                Fabio Cozza
              </div>
              <div style={{ fontSize: 11, color: TT.text3, marginTop: 1 }}>
                Amministratore
              </div>
            </div>
          </div>
        </aside>

        {/* TOPBAR - placeholder step 1 */}
        <header
          style={{
            gridArea: "topbar",
            background: TT.surface,
            borderBottom: `1px solid ${TT.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: TT.text1,
                letterSpacing: "-0.4px",
              }}
            >
              Buongiorno, Fabio Cozza
            </div>
            <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
              Tablet Preview - STEP 1 fondamenta
            </div>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <AvatarGradient size={36} preset="b" />
          </div>
        </header>

        {/* MAIN */}
        <main
          style={{
            gridArea: "main",
            overflowY: "auto",
            padding: "18px 24px 22px",
          }}
        >
          <DashboardTablet />
        </main>
      </div>
    </div>
  );
}
