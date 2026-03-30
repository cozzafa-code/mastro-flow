"use client";
// @ts-nocheck
// MASTRO ERP — CommessePanel v5 — Design System Lumina
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";
import RilieviListPanel from "./RilieviListPanel";
import CMDetailPanel from "./CMDetailPanel";
import VanoSectorRouter from "./VanoSectorRouter";
import RiepilogoPanel from "./RiepilogoPanel";

// ─── Lumina Design Tokens ─────────────────────────────────
const L = {
  // Surfaces
  bg:          "#f9f9fb",
  surface:     "#ffffff",
  surfaceLow:  "#f3f3f5",
  surfaceMid:  "#eeeef0",
  surfaceHigh: "#e8e8ea",

  // Primary navy
  primary:     "#031631",
  primaryCont: "#1a2b47",
  onPrimary:   "#ffffff",
  muted:       "#8293b4",

  // Text
  text:        "#1a1c1d",
  sub:         "#44474d",
  placeholder: "#75777e",

  // Semantic
  green:  "#1a9e73",
  red:    "#dc4444",
  amber:  "#e4c18c",
  amberBg:"#ffdeac",

  // Borders (ghost — max 20% opacity)
  border: "rgba(197,198,206,0.25)",

  // Glass card
  glass:  "rgba(255,255,255,0.85)",
  blur:   "blur(20px)",
} as const;

// Shadow helpers
const SH = {
  ambient: "0 20px 40px rgba(26,28,29,0.04)",
  float:   "0 20px 40px rgba(26,28,29,0.08)",
  sm:      "0 2px 8px rgba(26,28,29,0.05)",
  ceramic: "inset 0 1px 0 0 rgba(255,255,255,0.2), inset 0 -1px 0 0 rgba(0,0,0,0.1), 0 10px 20px -5px rgba(3,22,49,0.28)",
  ceramicSoft: "inset 0 1px 0 0 rgba(255,255,255,0.15), inset 0 -1px 0 0 rgba(0,0,0,0.06), 0 4px 12px rgba(3,22,49,0.06)",
};

// ─── Sub-components ───────────────────────────────────────

// Label uppercase stile Lumina
const MetaLabel = ({ children, style = {} }: any) => (
  <span style={{
    fontSize: 10, fontWeight: 700, letterSpacing: "0.15em",
    textTransform: "uppercase", color: L.sub, ...style
  }}>{children}</span>
);

// Badge stato pill
const StatusBadge = ({ label, color, bgColor }: any) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "3px 10px", borderRadius: 9999,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase",
    background: bgColor || L.amberBg,
    color: color || L.primary,
    flexShrink: 0,
  }}>{label}</span>
);

// Bottone primario ceramic
const BtnPrimary = ({ onClick, children }: any) => (
  <button onClick={onClick} style={{
    height: 52, paddingInline: 24,
    background: L.primary, color: L.onPrimary,
    border: "none", borderRadius: 16,
    boxShadow: SH.ceramic,
    fontFamily: "'Inter', sans-serif",
    fontSize: 13, fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase",
    cursor: "pointer", display: "inline-flex",
    alignItems: "center", gap: 8,
    transition: "opacity 0.15s, transform 0.15s",
  }}
    onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
    onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
    onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
  >{children}</button>
);

// Toggle view pill (list / card)
const ViewToggle = ({ cmView, setCmView }: any) => (
  <div style={{
    display: "flex", background: L.surfaceMid,
    borderRadius: 12, padding: 3, gap: 2,
  }}>
    {[
      { v: "list", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
      { v: "card", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
    ].map(({ v, icon }) => (
      <div key={v} onClick={() => setCmView(v)} style={{
        width: 30, height: 30, borderRadius: 9,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        background: cmView === v ? L.surface : "transparent",
        color: cmView === v ? L.primary : L.placeholder,
        boxShadow: cmView === v ? SH.sm : "none",
        transition: "all 0.15s",
      }}>{icon}</div>
    ))}
  </div>
);

// ─── Card commessa — stile Lumina ─────────────────────────
const CommessaCard = ({ c, onClick, fase, prog, ferma, scad, vaniA, vaniOk, euroVal, giorniFermaCM, fmtEuro, T }: any) => {
  const alert = ferma || scad;
  const accentColor = alert ? L.red : (fase?.color || L.primaryCont);
  const initials = ((c.cliente || "?").charAt(0) + (c.cognome || "").charAt(0)).toUpperCase();
  const badgeLabel = ferma ? `Ferma ${giorniFermaCM(c)}gg` : scad ? "Scaduta" : fase?.nome;
  const badgeBg = alert ? L.red + "18" : L.amberBg;
  const badgeColor = alert ? L.red : L.primary;

  return (
    <div onClick={onClick} style={{
      background: L.glass,
      backdropFilter: L.blur,
      WebkitBackdropFilter: L.blur,
      borderRadius: 20,
      border: `1px solid ${alert ? L.red + "30" : L.border}`,
      padding: "18px 18px 14px",
      cursor: "pointer", position: "relative", overflow: "hidden",
      boxShadow: alert ? `0 0 0 1px ${L.red}20, ${SH.ambient}` : SH.ambient,
      transition: "box-shadow 0.2s, transform 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = SH.float; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = alert ? `0 0 0 1px ${L.red}20, ${SH.ambient}` : SH.ambient; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Accent strip top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: accentColor, borderRadius: "20px 20px 0 0",
        opacity: alert ? 1 : 0.7,
      }} />

      {/* Avatar + nome */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: accentColor + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800,
          color: accentColor,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: L.text,
            lineHeight: 1.25, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}>
            {c.cliente}{c.cognome ? " " + c.cognome : ""}
          </div>
          <div style={{
            fontSize: 10, color: L.muted, marginTop: 2,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
          }}>{c.code}</div>
        </div>
        {alert && (
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: L.red, flexShrink: 0, marginTop: 5 }} />
        )}
      </div>

      {/* Indirizzo */}
      {c.indirizzo && (
        <div style={{
          fontSize: 11, color: L.sub, marginBottom: 10,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          letterSpacing: "0.01em",
        }}>{c.indirizzo}</div>
      )}

      {/* Progress bar */}
      <div style={{ height: 3, background: L.surfaceMid, borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: prog + "%",
          background: accentColor, borderRadius: 2,
          transition: "width 0.4s ease",
        }} />
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StatusBadge label={badgeLabel} color={badgeColor} bgColor={badgeBg} />
          {vaniA.length > 0 && (
            <MetaLabel>{vaniOk}/{vaniA.length} vani</MetaLabel>
          )}
        </div>
        {euroVal > 0 && (
          <span style={{
            fontSize: 13, fontWeight: 800, color: L.text,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "-0.02em",
          }}>{fmtEuro(euroVal)}</span>
        )}
      </div>
    </div>
  );
};

// ─── Row commessa — stile Lumina ──────────────────────────
const CommessaRow = ({ c, onClick, fase, prog, ferma, scad, vaniA, euroVal, giorniFermaCM, fmtEuro, fmtData, isLast }: any) => {
  const alert = ferma || scad;
  const accentColor = alert ? L.red : (fase?.color || L.primaryCont);
  const initials = ((c.cliente || "?").charAt(0) + (c.cognome || "").charAt(0)).toUpperCase();
  const badgeLabel = ferma ? `Ferma ${giorniFermaCM(c)}gg` : scad ? "Scaduta" : fase?.nome;

  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px",
      cursor: "pointer",
      borderBottom: isLast ? "none" : `1px solid ${L.border}`,
      position: "relative",
      transition: "background 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = L.surfaceLow)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* Left accent */}
      <div style={{
        position: "absolute", left: 0, top: "20%", bottom: "20%",
        width: 2.5, borderRadius: 2,
        background: alert ? L.red : accentColor,
        opacity: 0.6,
      }} />

      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: accentColor + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: accentColor,
        fontFamily: "'JetBrains Mono', monospace",
      }}>{initials}</div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: L.text,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: 180, letterSpacing: "-0.01em",
          }}>{c.cliente}{c.cognome ? " " + c.cognome : ""}</span>
          <span style={{
            fontSize: 9, color: L.muted, flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
          }}>{c.code}</span>
          {alert && <div style={{ width: 5, height: 5, borderRadius: "50%", background: L.red, flexShrink: 0 }} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <StatusBadge
            label={badgeLabel}
            color={alert ? L.red : L.primary}
            bgColor={alert ? L.red + "18" : L.amberBg}
          />
          {vaniA.length > 0 && <MetaLabel>{vaniA.length} vani</MetaLabel>}
          {c.scadenza && !scad && <MetaLabel>{fmtData(c.scadenza)}</MetaLabel>}
        </div>
        {/* Mini progress */}
        <div style={{ height: 2, background: L.surfaceMid, borderRadius: 1, marginTop: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: prog + "%", background: accentColor, borderRadius: 1 }} />
        </div>
      </div>

      {/* Right */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {euroVal > 0 && (
          <div style={{
            fontSize: 13, fontWeight: 800, color: L.text,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em",
          }}>{fmtEuro(euroVal)}</div>
        )}
        <MetaLabel style={{ marginTop: 2 }}>{prog}%</MetaLabel>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────
export default function CommessePanel() {
  const {
    T, isDesktop, isTablet, PIPELINE,
    cantieri, filtered, selectedCM, setSelectedCM, selectedRilievo, selectedVano,
    showRiepilogo, cmView, setCmView, filterFase, setFilterFase,
    searchQ, setSearchQ, setShowModal, setTab,
    getVaniAttivi, giorniFermaCM, sogliaDays,
  } = useMastro();

  const TODAY = new Date().toISOString().split("T")[0];
  const [sortBy, setSortBy] = useState("default");

  const fmtEuro = (n: number) => n > 0 ? "€" + n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) : "";
  const fmtData = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";

  const getFaseInfo = (c: any) => PIPELINE.find(p => p.id === c.fase) || { nome: c.fase, color: L.primaryCont };
  const getProgress = (c: any) => {
    const idx = PIPELINE.findIndex(p => p.id === c.fase);
    return idx >= 0 ? Math.round((idx + 1) / PIPELINE.length * 100) : 0;
  };
  const isFerma = (c: any) => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura";
  const isScaduta = (c: any) => c.scadenza && c.scadenza < TODAY;

  // ── Routing ──
  if (showRiepilogo && selectedCM) return <RiepilogoPanel />;
  if (selectedVano) return <VanoSectorRouter />;
  if (selectedRilievo) return <CMDetailPanel />;
  if (selectedCM) return <RilieviListPanel />;

  const fermeCount = cantieri.filter(c => isFerma(c)).length;
  const totaleEuro = filtered.reduce((sum, c) => sum + (c.euro ? parseFloat(c.euro) : 0), 0);
  const filteredSorted = [...filtered].sort((a, b) => {
    if (sortBy === "nome") return (a.cliente || "").localeCompare(b.cliente || "");
    if (sortBy === "euro") return (parseFloat(b.euro) || 0) - (parseFloat(a.euro) || 0);
    if (sortBy === "data") return (b.aggiornato || b.creato || "").localeCompare(a.aggiornato || a.creato || "");
    return 0;
  });

  return (
    <div style={{ background: L.bg, minHeight: "100%", paddingBottom: 96 }}>

      {/* ── HERO HEADER ─────────────────────────────── */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>

          {/* KPI Hero */}
          <div>
            <MetaLabel style={{ display: "block", marginBottom: 6 }}>Stato Operativo</MetaLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{
                fontSize: 72, fontWeight: 800, color: L.primary,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1, letterSpacing: "-0.04em",
              }}>{cantieri.length}</span>
              <div style={{ paddingBottom: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 300, color: L.text, lineHeight: 1.3, letterSpacing: "-0.01em", display: "block" }}>
                  Commesse<br />Attive
                </span>
              </div>
            </div>
            {fermeCount > 0 && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 8, padding: "4px 10px",
                borderRadius: 9999, background: L.red + "15",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: L.red }} />
                <MetaLabel style={{ color: L.red }}>{fermeCount} ferme</MetaLabel>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ paddingBottom: 6 }}>
            <BtnPrimary onClick={() => setShowModal("commessa")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuova
            </BtnPrimary>
          </div>
        </div>

        {/* Totale valore */}
        {totaleEuro > 0 && (
          <div style={{
            background: L.primaryCont, borderRadius: 16,
            padding: "14px 18px", marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <MetaLabel style={{ color: L.muted }}>Valore portafoglio</MetaLabel>
            <span style={{
              fontSize: 20, fontWeight: 800, color: L.onPrimary,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em",
            }}>{fmtEuro(totaleEuro)}</span>
          </div>
        )}
      </div>

      {/* ── SEARCH ──────────────────────────────────── */}
      <div style={{ padding: "0 20px 14px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px",
          background: L.surface, borderRadius: 14,
          border: `1px solid ${L.border}`,
          boxShadow: SH.sm,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={L.placeholder} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 14, color: L.text, outline: "none",
              fontFamily: "'Inter', sans-serif", letterSpacing: "0.01em",
            }}
            placeholder="Cerca cliente, codice, indirizzo..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {searchQ && (
            <div onClick={() => setSearchQ("")} style={{ cursor: "pointer", fontSize: 18, color: L.placeholder, lineHeight: 1 }}>×</div>
          )}
        </div>
      </div>

      {/* ── FILTERS + CONTROLS ──────────────────────── */}
      <div style={{ padding: "0 20px 8px" }}>

        {/* Chips fase */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto",
          WebkitOverflowScrolling: "touch" as any,
          marginBottom: 12,
          scrollbarWidth: "none" as any,
        }}>
          {[
            { id: "tutte", nome: "Tutte", color: L.primary, count: cantieri.length },
            ...PIPELINE
              .filter(p => p.attiva)
              .map(p => ({ ...p, count: cantieri.filter(c => c.fase === p.id).length }))
              .filter(p => p.count > 0)
          ].map(p => {
            const sel = filterFase === p.id;
            return (
              <div key={p.id} onClick={() => setFilterFase(sel && p.id !== "tutte" ? "tutte" : p.id)} style={{
                padding: "7px 14px", borderRadius: 9999,
                fontSize: 11, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as any,
                background: sel
                  ? (p.id === "tutte" ? L.primary : (p.color || L.primaryCont) + "18")
                  : L.surface,
                color: sel
                  ? (p.id === "tutte" ? L.onPrimary : (p.color || L.primaryCont))
                  : L.sub,
                border: `1.5px solid ${sel
                  ? (p.id === "tutte" ? L.primary : (p.color || L.primaryCont) + "50")
                  : L.border}`,
                boxShadow: sel ? SH.sm : "none",
                transition: "all 0.15s",
              }}>
                {p.nome}&nbsp;
                <span style={{ opacity: 0.7 }}>{p.count}</span>
              </div>
            );
          })}
        </div>

        {/* Sort + View toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none" as any }}>
            {[["default","Recenti"], ["nome","A–Z"], ["euro","€"], ["data","Data"]].map(([v, l]) => (
              <div key={v} onClick={() => setSortBy(v as any)} style={{
                padding: "6px 12px", borderRadius: 9999,
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", cursor: "pointer", flexShrink: 0,
                background: sortBy === v ? L.primary : L.surface,
                color: sortBy === v ? L.onPrimary : L.sub,
                border: `1.5px solid ${sortBy === v ? L.primary : L.border}`,
                boxShadow: sortBy === v ? SH.sm : "none",
                transition: "all 0.15s",
              }}>{l}</div>
            ))}
          </div>
          <ViewToggle cmView={cmView} setCmView={setCmView} />
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────── */}
      <div style={{ padding: "12px 20px 0" }}>
        {filteredSorted.length === 0 ? (

          // Empty state
          <div style={{
            padding: "64px 20px", textAlign: "center",
            background: L.glass, backdropFilter: L.blur,
            borderRadius: 24, border: `1px solid ${L.border}`,
            boxShadow: SH.ambient,
          }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: L.text, marginBottom: 6, letterSpacing: "-0.01em" }}>Nessuna commessa</div>
            <div style={{ fontSize: 13, color: L.sub, marginBottom: 20 }}>Modifica i filtri o crea una nuova commessa</div>
            <BtnPrimary onClick={() => setShowModal("commessa")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuova commessa
            </BtnPrimary>
          </div>

        ) : cmView === "list" ? (

          // List view
          <div style={{
            background: L.glass, backdropFilter: L.blur,
            WebkitBackdropFilter: L.blur,
            borderRadius: 20, border: `1px solid ${L.border}`,
            boxShadow: SH.ambient, overflow: "hidden",
          }}>
            {filteredSorted.map((c, idx) => (
              <CommessaRow
                key={c.id}
                c={c}
                isLast={idx === filteredSorted.length - 1}
                onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                fase={getFaseInfo(c)}
                prog={getProgress(c)}
                ferma={isFerma(c)}
                scad={isScaduta(c)}
                vaniA={getVaniAttivi(c)}
                euroVal={c.euro ? parseFloat(c.euro) : 0}
                giorniFermaCM={giorniFermaCM}
                fmtEuro={fmtEuro}
                fmtData={fmtData}
              />
            ))}
          </div>

        ) : (

          // Card grid view
          <div style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : isTablet ? "1fr 1fr" : "1fr 1fr",
            gap: 12,
          }}>
            {filteredSorted.map(c => {
              const vaniA = getVaniAttivi(c);
              const vaniOk = vaniA.filter(v => Object.values(v.misure || {}).filter((x: any) => x > 0).length >= 6).length;
              return (
                <CommessaCard
                  key={c.id}
                  c={c}
                  onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                  fase={getFaseInfo(c)}
                  prog={getProgress(c)}
                  ferma={isFerma(c)}
                  scad={isScaduta(c)}
                  vaniA={vaniA}
                  vaniOk={vaniOk}
                  euroVal={c.euro ? parseFloat(c.euro) : 0}
                  giorniFermaCM={giorniFermaCM}
                  fmtEuro={fmtEuro}
                  T={T}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
