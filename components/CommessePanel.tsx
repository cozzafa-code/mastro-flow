"use client";
// @ts-nocheck
// MASTRO ERP — CommessePanel v6 — fliwoX Sistema Operativo
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";
import RilieviListPanel from "./RilieviListPanel";
import CMDetailPanel from "./CMDetailPanel";
import VanoSectorRouter from "./VanoSectorRouter";
import RiepilogoPanel from "./RiepilogoPanel";

// ─── fliwoX THEME ──────────────────────────────────────────────
const TH = {
  bgPage: "#E4F2F2",
  bgCard: "#FFFFFF",
  bgCardAlt: "#F5FBFB",
  tealBright: "#5FD0D0",
  teal: "#28A0A0",
  tealDark: "#1A7A7A",
  tealDeep: "#0D4040",
  tealMuted: "#8FA8A8",
  ink: "#0D1F1F",
  sub: "#5A7878",
  subLight: "#8FA8A8",
  border: "rgba(40,160,160,0.08)",
  borderSolid: "#C8E4E4",
  red: "#E24B4A",
  redBright: "#FF7B4D",
  amber: "#F5A030",
  amberDeep: "#C97716",
  green: "#8BC443",
  greenDeep: "#6A9A26",
  greenDark: "#1A9E73",
};

const AV_GRADS = [
  "linear-gradient(145deg, #42D0DC, #1A7A7A)",
  "linear-gradient(145deg, #5FD0D0, #28A0A0)",
  "linear-gradient(145deg, #FFA94D, #C97716)",
  "linear-gradient(145deg, #A3DC5E, #6A9A26)",
  "linear-gradient(145deg, #7B6BA5, #5A4D85)",
  "linear-gradient(145deg, #1A3535, #0D1F1F)",
];

// Colori fase fliwoX
const PIPELINE_FLIWOX: Record<string, { bg: string; fg: string; solid: string }> = {
  sopralluogo: { bg: "rgba(40,160,160,0.12)", fg: "#1A7A7A", solid: "#28A0A0" },
  rilievo:     { bg: "rgba(40,160,160,0.12)", fg: "#1A7A7A", solid: "#28A0A0" },
  preventivo:  { bg: "rgba(139,196,67,0.18)", fg: "#5F8D20", solid: "#8BC443" },
  conferma:    { bg: "rgba(59,127,224,0.15)", fg: "#2563EB", solid: "#3B7FE0" },
  ordini:      { bg: "rgba(245,160,48,0.18)", fg: "#C97716", solid: "#F5A030" },
  produzione:  { bg: "rgba(245,160,48,0.18)", fg: "#C97716", solid: "#F5A030" },
  posa:        { bg: "rgba(123,107,165,0.18)", fg: "#5A4D85", solid: "#7B6BA5" },
  collaudo:    { bg: "rgba(123,107,165,0.18)", fg: "#5A4D85", solid: "#7B6BA5" },
  fattura:     { bg: "rgba(26,158,115,0.15)", fg: "#147A55", solid: "#1A9E73" },
  chiusura:    { bg: "rgba(90,120,120,0.15)", fg: "#5A7878", solid: "#8FA8A8" },
};

export default function CommessePanel() {
  const {
    T, isDesktop, isTablet, PIPELINE,
    cantieri, filtered, selectedCM, setSelectedCM, selectedRilievo, selectedVano,
    showRiepilogo, cmView, setCmView, filterFase, setFilterFase,
    searchQ, setSearchQ, setShowModal, setTab,
    getVaniAttivi, giorniFermaCM, sogliaDays, fattureDB,
  } = useMastro();

  const TODAY = new Date().toISOString().split("T")[0];
  const [sortBy, setSortBy] = useState("default");
  const fmtEuro = (n: number) => n > 0 ? "€" + n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) : "";
  const fmtData = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";
  const initials = (c: any) => ((c.cliente || "?").charAt(0) + (c.cognome || "").charAt(0)).toUpperCase();

  const getFaseInfo = (c: any) => PIPELINE.find(p => p.id === c.fase) || { nome: c.fase, color: TH.teal };
  const isFerma = (c: any) => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura";
  const isScaduta = (c: any) => c.scadenza && c.scadenza < TODAY;

  const faseStyle = (fase: string, alert: boolean, ferma: boolean, gg: number, nome: string) => {
    if (alert) return { bg: "rgba(226,75,74,0.12)", fg: TH.red, text: ferma ? `Ferma ${gg}gg` : "Scaduta" };
    const fx = PIPELINE_FLIWOX[fase] || PIPELINE_FLIWOX.sopralluogo;
    return { bg: fx.bg, fg: fx.fg, text: nome };
  };

  // ─── Routing (invariato) ─────────────────────────────────────
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

  // ─── CARD VIEW ───────────────────────────────────────────────
  const renderCard = (c: any, idx: number) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const fs = faseStyle(c.fase, alert, ferma, giorniFermaCM(c), fase.nome);

    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{
          background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
          borderRadius: 18,
          padding: "14px 16px",
          marginBottom: 12,
          boxShadow: alert
            ? `0 6px 20px rgba(226,75,74,0.15), inset 3px 0 0 ${TH.red}`
            : "0 6px 20px rgba(31,120,120,0.1), inset 0 1px 1px rgba(255,255,255,0.8)",
          border: "1px solid rgba(200,228,228,0.5)",
          cursor: "pointer",
        }}>

        {/* Header: avatar + nome + pill fase */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: AV_GRADS[idx % AV_GRADS.length],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff",
            boxShadow: "0 4px 10px rgba(13,31,31,0.25), inset 0 1px 1px rgba(255,255,255,0.3)",
            letterSpacing: "-0.2px",
          }}>{initials(c)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: TH.ink, letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.cliente}{c.cognome ? " " + c.cognome : ""}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: TH.sub, marginTop: 2 }}>
              {c.code}{c.indirizzo ? " · " + c.indirizzo : ""}
            </div>
          </div>
          <span style={{
            background: fs.bg, color: fs.fg,
            fontSize: 10, padding: "4px 9px", borderRadius: 8, fontWeight: 800,
            letterSpacing: "0.3px", textTransform: "uppercase" as any,
            whiteSpace: "nowrap" as any,
          }}>{fs.text}</span>
        </div>

        {/* Pipeline barra */}
        <div style={{ display: "flex", gap: 3, marginBottom: 11 }}>
          {PIPELINE.filter(p => p.attiva).map(p => {
            const isActive = p.id === c.fase;
            const isDone = PIPELINE.findIndex(pp => pp.id === p.id) < PIPELINE.findIndex(pp => pp.id === c.fase);
            const dc = (PIPELINE_FLIWOX[p.id] || PIPELINE_FLIWOX.sopralluogo).solid;
            return (
              <div key={p.id} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: isActive ? dc : isDone ? dc + "80" : "rgba(200,228,228,0.6)",
                boxShadow: isActive ? `0 0 8px ${dc}80` : "none",
              }} />
            );
          })}
        </div>

        {/* Footer: vani, data, euro, fattura */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as any }}>
            {vaniA.length > 0 && (
              <span style={{ fontSize: 11, color: TH.sub, fontWeight: 700 }}>
                {vaniA.length} van{vaniA.length === 1 ? "o" : "i"}
              </span>
            )}
            {c.scadenza && !scad && (
              <span style={{ fontSize: 11, color: TH.sub, fontWeight: 600 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={TH.tealMuted} strokeWidth="2" style={{ display: "inline", verticalAlign: "-1px", marginRight: 3 }}>
                  <rect x="3" y="4" width="18" height="17" rx="2"/>
                </svg>
                {fmtData(c.scadenza)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {euroVal > 0 && (
              <span style={{ fontSize: 14, fontWeight: 900, color: TH.ink, fontFamily: FM, letterSpacing: "-0.3px" }}>
                {fmtEuro(euroVal)}
              </span>
            )}
            {(() => {
              const fatture = (fattureDB || []).filter((f: any) => f.cmId === c.id);
              if (fatture.length === 0) return null;
              const tutte = fatture.every((f: any) => f.pagata);
              return (
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                  background: tutte ? "rgba(26,158,115,0.15)" : "rgba(245,160,48,0.18)",
                  color: tutte ? TH.greenDark : TH.amberDeep,
                  letterSpacing: "0.3px", textTransform: "uppercase" as any,
                }}>{tutte ? "Pagata" : "Fattura"}</span>
              );
            })()}
          </div>
        </div>

        {/* Alert sotto */}
        {alert && (
          <div style={{
            marginTop: 9, padding: "6px 10px",
            background: "rgba(226,75,74,0.08)",
            borderRadius: 8,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: TH.red, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: TH.red, fontWeight: 700, letterSpacing: "0.3px" }}>
              {ferma ? `FERMA DA ${giorniFermaCM(c)} GIORNI` : "SCADENZA SUPERATA"}
            </span>
          </div>
        )}
      </div>
    );
  };

  // ─── LIST VIEW ────────────────────────────────────────────────
  const renderRow = (c: any, idx: number) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const fs = faseStyle(c.fase, alert, ferma, giorniFermaCM(c), fase.nome);
    const isLast = idx === filteredSorted.length - 1;

    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 14px", cursor: "pointer",
          borderBottom: isLast ? "none" : `1px solid ${TH.border}`,
        }}>

        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: AV_GRADS[idx % AV_GRADS.length],
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "#fff",
          boxShadow: "0 3px 8px rgba(13,31,31,0.2)",
        }}>{initials(c)}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: TH.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.cliente}{c.cognome ? " " + c.cognome : ""}
            </span>
            {alert && <div style={{ width: 6, height: 6, borderRadius: "50%", background: TH.red, flexShrink: 0 }} />}
          </div>
          <div style={{ fontSize: 11, color: TH.sub, fontWeight: 500 }}>
            {c.code}{c.indirizzo ? " · " + c.indirizzo : ""}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" as any, alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{
            background: fs.bg, color: fs.fg,
            fontSize: 9, padding: "3px 8px", borderRadius: 6, fontWeight: 800,
            letterSpacing: "0.3px", textTransform: "uppercase" as any,
            whiteSpace: "nowrap" as any,
          }}>{fs.text}</span>
          {euroVal > 0 && (
            <span style={{ fontSize: 13, fontWeight: 900, color: TH.ink, fontFamily: FM }}>{fmtEuro(euroVal)}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      fontFamily: "'Manrope', -apple-system, 'SF Pro Display', system-ui, sans-serif",
      background: TH.bgPage, minHeight: "100%",
      padding: "calc(env(safe-area-inset-top, 0px) + 8px) 12px 110px",
      overflowX: "hidden" as any,
    }}>

      {/* ═══ HERO TEAL fliwoX ═══ */}
      <div style={{
        background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
        borderRadius: 22,
        padding: "14px 16px 16px",
        position: "relative" as any,
        overflow: "hidden" as any,
        boxShadow: "0 10px 26px rgba(31,120,120,0.35), inset 0 2px 3px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.12)",
        marginBottom: 14,
      }}>
        <div style={{ position: "absolute", top: -40, right: -30, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.2), transparent)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" as any, zIndex: 2, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "1px", textTransform: "uppercase" as any }}>Lavori</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginTop: 2, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>Commesse</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
              <span>{cantieri.length} totali</span>
              {fermeCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, color: "#fff",
                  background: "linear-gradient(145deg, #FF7B4D, #E24B4A)",
                  padding: "3px 9px", borderRadius: 9,
                  letterSpacing: "0.3px",
                  boxShadow: "0 2px 6px rgba(226,75,74,0.45)",
                }}>
                  {fermeCount} FERM{fermeCount === 1 ? "A" : "E"}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Toggle vista */}
            <div style={{
              display: "flex", gap: 2, padding: 3,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 10,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.15)",
            }}>
              <div onClick={() => setCmView("list")} style={{
                width: 30, height: 30, borderRadius: 7,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                background: cmView === "list" ? "#fff" : "transparent",
                boxShadow: cmView === "list" ? "0 2px 4px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cmView === "list" ? TH.tealDark : "rgba(255,255,255,0.85)"} strokeWidth="2.2" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>
                </svg>
              </div>
              <div onClick={() => setCmView("card")} style={{
                width: 30, height: 30, borderRadius: 7,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                background: cmView === "card" ? "#fff" : "transparent",
                boxShadow: cmView === "card" ? "0 2px 4px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cmView === "card" ? TH.tealDark : "rgba(255,255,255,0.85)"} strokeWidth="2.2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
            </div>

            {/* Nuova commessa */}
            <div onClick={() => setShowModal("commessa")} style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(145deg, #FFF, #D8EEEE)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2), 0 0 0 2px rgba(255,255,255,0.25)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TH.tealDark} strokeWidth="3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Search bar dentro hero */}
        <div style={{
          position: "relative" as any, zIndex: 2,
          display: "flex", alignItems: "center", gap: 10,
          padding: "11px 14px",
          background: "rgba(255,255,255,0.2)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 14, fontWeight: 600, color: "#fff",
              outline: "none", fontFamily: "inherit",
            }}
            placeholder="Cerca cliente, codice..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {searchQ && (
            <div onClick={() => setSearchQ("")} style={{ cursor: "pointer", color: "rgba(255,255,255,0.85)", lineHeight: 1, fontSize: 18, padding: "0 2px" }}>×</div>
          )}
        </div>
      </div>

      {/* ═══ CHIP FASE ═══ */}
      <div style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 10, paddingBottom: 4 }}>
        {[
          { id: "tutte", nome: "Tutte", count: cantieri.length },
          ...PIPELINE.filter(p => p.attiva)
            .map(p => ({ ...p, count: cantieri.filter(c => c.fase === p.id).length }))
            .filter(p => p.count > 0),
        ].map(p => {
          const sel = filterFase === p.id;
          const fx = PIPELINE_FLIWOX[p.id] || PIPELINE_FLIWOX.sopralluogo;
          return (
            <div key={p.id}
              onClick={() => setFilterFase(sel && p.id !== "tutte" ? "tutte" : p.id)}
              style={{
                padding: "7px 13px", borderRadius: 18,
                fontSize: 11, fontWeight: 800, cursor: "pointer",
                whiteSpace: "nowrap" as any, flexShrink: 0,
                letterSpacing: "0.3px",
                background: sel
                  ? (p.id === "tutte" ? "linear-gradient(145deg, #1A3535, #0D1F1F)" : `linear-gradient(145deg, ${fx.solid}, ${fx.fg})`)
                  : TH.bgCard,
                color: sel ? "#fff" : TH.sub,
                boxShadow: sel
                  ? "0 4px 10px rgba(13,31,31,0.25), inset 0 1px 1px rgba(255,255,255,0.2)"
                  : "0 2px 6px rgba(31,120,120,0.08)",
                border: sel ? "none" : `1px solid ${TH.borderSolid}`,
              }}>
              {p.nome} · {p.count}
            </div>
          );
        })}
      </div>

      {/* ═══ SORT + TOTALE ═══ */}
      <div style={{
        display: "flex", gap: 6, alignItems: "center",
        marginBottom: 12, padding: "4px 2px",
      }}>
        {[["default", "Recenti"], ["nome", "A-Z"], ["euro", "€"], ["data", "Data"]].map(([v, l]) => {
          const sel = sortBy === v;
          return (
            <div key={v} onClick={() => setSortBy(v as any)} style={{
              padding: "5px 11px", borderRadius: 14,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              whiteSpace: "nowrap" as any,
              background: sel ? TH.ink : "transparent",
              color: sel ? TH.tealBright : TH.sub,
              letterSpacing: "0.2px",
            }}>{l}</div>
          );
        })}
        {totaleEuro > 0 && (
          <div style={{
            marginLeft: "auto",
            padding: "5px 11px", borderRadius: 10,
            background: "rgba(40,160,160,0.1)",
            fontSize: 11, fontWeight: 800, color: TH.tealDark,
            fontFamily: FM, letterSpacing: "-0.2px",
          }}>
            {filtered.length} · {fmtEuro(totaleEuro)}
          </div>
        )}
      </div>

      {/* ═══ CONTENT ═══ */}
      {filtered.length === 0 ? (
        <div style={{
          background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
          borderRadius: 18, padding: "48px 20px", textAlign: "center" as any,
          boxShadow: "0 6px 20px rgba(31,120,120,0.1)",
          border: "1px solid rgba(200,228,228,0.5)",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: "linear-gradient(145deg, #DDEFEF, #BDE0E0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "inset 1.5px 1.5px 3px rgba(26,122,122,0.12), inset -1.5px -1.5px 3px rgba(255,255,255,0.95)",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TH.tealDark} strokeWidth="1.8" strokeLinecap="round">
              <rect x="5" y="3" width="14" height="18" rx="2"/>
              <line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: TH.ink, letterSpacing: "-0.2px" }}>Nessuna commessa</div>
          <div style={{ fontSize: 12, color: TH.sub, marginTop: 5, fontWeight: 500 }}>Modifica i filtri o creane una nuova</div>
          <div onClick={() => setShowModal("commessa")} style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 22px", borderRadius: 13,
            background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
            color: "#fff", fontSize: 14, fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 6px 14px rgba(31,120,120,0.35), inset 0 1px 2px rgba(255,255,255,0.3)",
            letterSpacing: "0.2px",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuova commessa
          </div>
        </div>
      ) : cmView === "list" ? (
        <div style={{
          background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0 6px 20px rgba(31,120,120,0.1)",
          border: "1px solid rgba(200,228,228,0.5)",
        }}>
          {filteredSorted.map((c, i) => renderRow(c, i))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : isTablet ? "1fr 1fr" : "1fr",
          gap: 10,
        }}>
          {filteredSorted.map((c, i) => renderCard(c, i))}
        </div>
      )}
    </div>
  );
}
