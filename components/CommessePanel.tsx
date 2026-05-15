"use client";
// @ts-nocheck
// MASTRO ERP — CommessePanel v7 — Mockup Navy 50/20
import React, { useState, useRef } from "react";
import { useMastro } from "./MastroContext";
import { supabase } from "../lib/supabase";
import { mastroStore } from "../lib/mastro-store";
import MergeCommesseModal from "./MergeCommesseModal";

const _UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
import { FF, FM } from "./mastro-constants";
import RilieviListPanel from "./RilieviListPanel";
import CMDetailPanel from "./CMDetailPanel";
import VanoSectorRouter from "./VanoSectorRouter";
import RiepilogoPanel from "./RiepilogoPanel";

// ─── PALETTE NAVY 50/20 ──────────────────────────────────────────
const TH = {
  bgPage: "#94A3B8",      // grigio acciaio body
  bgCard: "#FFFFFF",
  bgCardAlt: "#F8FAFC",
  navy: "#1E3A5F",
  navyDark: "#0F1B2D",
  navyLight: "#2D5A87",
  navyMuted: "#475A75",
  ink: "#0A1628",
  sub: "#475A75",
  subLight: "#94A3B8",
  border: "#CBD5E1",
  borderSoft: "#E2E8F0",
  bgPill: "#DBE6F1",
  ambra: "#92400E",
  ambraBg: "#FEF3C7",
  red: "#991B1B",
  redBg: "#FEE2E2",
  green: "#065F46",
  greenBg: "#ECFDF5",
};

// Colore stato per banner/bordi/pill
const FASE_COLOR_MAP: any = {
  sopralluogo:  { dark: TH.navy,      light: TH.bgPill,  text: TH.navy },
  rilievo:      { dark: TH.navy,      light: TH.bgPill,  text: TH.navy },
  preventivo:   { dark: TH.ambra,     light: TH.ambraBg, text: TH.ambra },
  conferma:     { dark: TH.ambra,     light: TH.ambraBg, text: TH.ambra },
  ordini:       { dark: TH.navyLight, light: TH.bgPill,  text: TH.navy },
  produzione:   { dark: TH.navyLight, light: TH.bgPill,  text: TH.navy },
  posa:         { dark: TH.navyMuted, light: TH.bgPill,  text: TH.navy },
  collaudo:     { dark: TH.navyMuted, light: TH.bgPill,  text: TH.navy },
  fattura:      { dark: TH.green,     light: TH.greenBg, text: TH.green },
  chiusura:     { dark: TH.navyMuted, light: TH.bgPill,  text: TH.navyMuted },
};

// Step ordinati del workflow (7 step)
const WORKFLOW_STEPS = [
  { id: "sopralluogo", short: "RIL" },
  { id: "preventivo",  short: "PRV" },
  { id: "conferma",    short: "CNF" },
  { id: "ordini",      short: "ORD" },
  { id: "produzione",  short: "PRD" },
  { id: "fattura",     short: "FAT" },
  { id: "chiusura",    short: "PGT" },
];
const stepIndex = (faseId: string) => {
  const i = WORKFLOW_STEPS.findIndex(s => s.id === faseId);
  return i < 0 ? 0 : i;
};

export default function CommessePanel() {
  // FIX v10: ascolta evento dello store per ricaricare commesse dopo soft delete
  React.useEffect(() => {
    const handler = () => {
      try {
        // Forza re-render. Se esiste un setter setCommesse, viene aggiornato dalla list()
        if (typeof window !== "undefined" && (window as any).__mastroForceReload) {
          (window as any).__mastroForceReload();
        }
        // Trigger generico via reload del'app
        setTimeout(() => {
          try { window.location.reload(); } catch {}
        }, 100);
      } catch {}
    };
    window.addEventListener("mastro:commesse-changed", handler);
    return () => window.removeEventListener("mastro:commesse-changed", handler);
  }, []);

  const {
    T, isDesktop, isTablet, PIPELINE,
    cantieri, filtered, selectedCM, setSelectedCM, selectedRilievo, selectedVano,
    showRiepilogo, cmView, setCmView, filterFase, setFilterFase,
    searchQ, setSearchQ, setShowModal, setTab,
    getVaniAttivi, giorniFermaCM, sogliaDays, fattureDB,
  } = useMastro();

  // FIX v10: cantieri attivi (esclude cestinate/archiviate) per contatori
  const cantieriAttivi = (cantieri || []).filter((c: any) => !c?.deleted_at && !c?.archived_at);

  const TODAY = new Date().toISOString().split("T")[0];
  const [sortBy, setSortBy] = useState("default");
  const [expandedCmId, setExpandedCmId] = useState<any>(null);

  // ─── Selezione multipla ────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const longPressTimer = useRef<any>(null);
  const longPressTriggered = useRef(false);

  const enterSelection = (id: string) => {
    longPressTriggered.current = true;
    if (navigator.vibrate) navigator.vibrate(40);
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleTouchStart = (id: string) => {
    longPressTriggered.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => enterSelection(id), 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCardClick = (c: any, originalAction: () => void) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (selectionMode) {
      toggleSelected(c.id);
      return;
    }
    originalAction();
  };

  const bulkSoftDelete = async () => {
    if (selectedIds.size === 0 || bulkBusy) return;
    const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const ids = Array.from(selectedIds);
    const validIds = ids.filter(id => UUID_RX.test(id));
    const invalidCount = ids.length - validIds.length;

    if (validIds.length === 0) {
      alert(`Impossibile eliminare: le ${ids.length} commess${ids.length === 1 ? "a" : "e"} selezionate non sono sincronizzate con il server.`);
      exitSelection();
      return;
    }

    const confirmMsg = invalidCount > 0
      ? `Spostare ${validIds.length} commess${validIds.length === 1 ? "a" : "e"} nel cestino?\n\n⚠ ${invalidCount} non sincronizzat${invalidCount === 1 ? "o" : "i"} sarà ignorato.\n\nEliminazione definitiva dopo 30 giorni.`
      : `Spostare ${validIds.length} commess${validIds.length === 1 ? "a" : "e"} nel cestino?\n\nEliminazione definitiva dopo 30 giorni.`;
    if (!window.confirm(confirmMsg)) return;

    setBulkBusy(true);
    try {
      const result = await mastroStore.bulkSoftDelete("commesse", validIds);
      // FIX BRUTAL v10: ricarica pagina dopo successo, niente cache puo fermarci
      console.log("[CommessePanel] bulkSoftDelete result:", result);
      if (result?.ok > 0) {
        console.log("[CommessePanel] FORCING window.location.reload");
        try {
          // Cancella tutta la cache prima del reload
          if (typeof window !== "undefined") {
            try {
              if (window.caches) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
              }
            } catch {}
            try {
              if (window.indexedDB) {
                indexedDB.deleteDatabase("mastro_offline");
              }
            } catch {}
            setTimeout(() => { window.location.href = window.location.pathname + "?t=" + Date.now(); }, 200);
          }
        } catch (err) {
          console.error("[CommessePanel] reload error", err);
        }
      }
      // FIX v10: rimuovi localmente dopo successo
      if (result?.ok > 0 && typeof setCantieri === "function") {
        try {
          setCantieri((prev: any[]) => prev.filter((c: any) => !validIds.includes(c.id)));
        } catch {}
      }
      // Forza un reload dell'app
      try {
        if (typeof window !== "undefined" && (window as any).location) {
          setTimeout(() => { (window as any).location.reload(); }, 600);
        }
      } catch {}
      if (result.ok === 0) throw new Error("Nessuna commessa eliminata");
      exitSelection();
      window.location.reload();
    } catch (e: any) {
      alert("Errore eliminazione: " + (e?.message || e));
      setBulkBusy(false);
    }
  };

  const bulkArchivia = async () => {
    if (selectedIds.size === 0 || bulkBusy) return;
    const ids = Array.from(selectedIds);
    const validIds = ids.filter(id => _UUID_RX.test(id));
    if (validIds.length === 0) {
      alert(`Impossibile archiviare: nessuna delle ${ids.length} commesse è sincronizzata.`);
      return;
    }
    const n = validIds.length;
    if (!window.confirm(`Archiviare ${n} commess${n === 1 ? "a" : "e"}?\n\nVerranno nascoste ma restano recuperabili.`)) return;
    setBulkBusy(true);
    try {
      const result = await mastroStore.bulkArchivia(validIds);
      if (result.ok === 0) throw new Error("Nessuna commessa archiviata");
      exitSelection();
      window.location.reload();
    } catch (e: any) {
      alert("Errore archiviazione: " + (e?.message || e));
      setBulkBusy(false);
    }
  };

  const openMergeModal = () => {
    if (selectedIds.size < 2) {
      alert("Seleziona almeno 2 commesse per unirle.");
      return;
    }
    const ids = Array.from(selectedIds);
    const uuidIds = ids.filter(id => _UUID_RX.test(id));
    if (uuidIds.length < 2) {
      alert(`Impossibile unire: servono almeno 2 commesse sincronizzate. Selezionate: ${ids.length}, valide: ${uuidIds.length}`);
      return;
    }
    setShowMergeModal(true);
  };

  const handleMergeDone = (result: any) => {
    setShowMergeModal(false);
    exitSelection();
    window.location.reload();
  };

  const fmtEuro = (n: number) => n > 0 ? "€" + n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) : "";
  const fmtData = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";
  const initials = (c: any) => ((c.cliente || "?").charAt(0) + (c.cognome || "").charAt(0)).toUpperCase();

  const getFaseInfo = (c: any) => PIPELINE.find(p => p.id === c.fase) || { nome: c.fase, color: TH.navy };
  const isFerma = (c: any) => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura";
  const isScaduta = (c: any) => c.scadenza && c.scadenza < TODAY;

  const getFaseColor = (faseId: string, alert: boolean) => {
    if (alert) return { dark: TH.red, light: TH.redBg, text: TH.red };
    return FASE_COLOR_MAP[faseId] || FASE_COLOR_MAP.sopralluogo;
  };

  // ─── Routing ───────────────────────────────────────────────
  if (showRiepilogo && selectedCM) return <RiepilogoPanel />;
  if (selectedVano) return <VanoSectorRouter />;
  if (selectedRilievo && selectedCM) return <CMDetailPanel />;
  if (selectedCM) return <CMDetailPanel />;

  const fermeCount = cantieriAttivi.filter(c => isFerma(c)).length;
  const totaleEuro = filtered.reduce((sum, c) => sum + (c.euro ? parseFloat(c.euro) : 0), 0);
  const filteredSorted = [...filtered].sort((a, b) => {
    if (!a || !b) return 0;
    if (sortBy === "nome") return (a.cliente || "").localeCompare(b.cliente || "");
    if (sortBy === "euro") return (parseFloat(b.euro) || 0) - (parseFloat(a.euro) || 0);
    if (sortBy === "data") return (b.aggiornato || b.creato || "").localeCompare(a.aggiornato || a.creato || "");
    return 0;
  });

  // ============================================================
  // RENDER ROW (LISTA COMPATTA mockup)
  // ============================================================
  const renderRow = (c: any, idx: number) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const fc = getFaseColor(c.fase, alert);
    const isLast = idx === filteredSorted.length - 1;

    const fatt = (fattureDB || []).filter((f: any) => f.cmId === c.id);
    const fattTutte = fatt.length > 0 && fatt.every((f: any) => f.pagata);
    const infoParts: string[] = [];
    if (vaniA.length > 0) infoParts.push(`${vaniA.length} van${vaniA.length === 1 ? "o" : "i"}`);
    if (euroVal > 0) infoParts.push(fmtEuro(euroVal));
    if (fattTutte) infoParts.push("pagata");
    const infoText = ferma
      ? `${giorniFermaCM(c)}gg ferma`
      : (scad ? "scadenza superata" : (infoParts.length > 0 ? infoParts.join(" · ") : (c.indirizzo || "")));

    return (
      <div key={c.id}
        onClick={() => handleCardClick(c, () => { setSelectedCM(c); setTab("commesse"); })}
        onTouchStart={() => handleTouchStart(c.id)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); enterSelection(c.id); }}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px",
          background: TH.bgCard,
          borderBottom: isLast ? "none" : `1px solid ${TH.borderSoft}`,
          cursor: "pointer",
          position: "relative",
          opacity: selectionMode && !selectedIds.has(c.id) ? 0.55 : 1,
        }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: 4, background: fc.dark,
        }} />

        {selectionMode && (
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: `2px solid ${selectedIds.has(c.id) ? TH.navy : TH.subLight}`,
            background: selectedIds.has(c.id) ? TH.navy : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 4,
          }}>
            {selectedIds.has(c.id) && <span style={{ color: "#FFF", fontSize: 12, fontWeight: 900 }}>✓</span>}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: fc.text,
              background: fc.light, padding: "2px 6px", borderRadius: 4,
              letterSpacing: 0.5, flexShrink: 0,
            }}>{c.code}</span>
            <span style={{
              fontSize: 13, fontWeight: 800, color: TH.ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flex: 1, minWidth: 0,
            }}>{(c.cliente || "").toUpperCase()}{c.cognome ? " " + c.cognome.toUpperCase() : ""}</span>
          </div>
          <div style={{
            fontSize: 11, color: TH.sub,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{infoText}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{
            background: fc.light, color: fc.text,
            padding: "3px 8px", borderRadius: 999,
            fontSize: 9, fontWeight: 800,
            textTransform: "uppercase" as any,
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
          }}>{(fase.nome || "").substring(0, 4)}.</span>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={TH.subLight} strokeWidth={2.5} strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER CARD (mockup approvato — banner top + workflow 7-step)
  // ============================================================
  const renderCard = (c: any, idx: number, heroMode = false) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const fc = getFaseColor(c.fase, alert);
    const stepN = stepIndex(c.fase);
    const isExpanded = expandedCmId === c.id;

    return (
      <div key={c.id}
        onClick={() => handleCardClick(c, () => { if (!isExpanded) { setSelectedCM(c); setTab("commesse"); } })}
        onTouchStart={() => handleTouchStart(c.id)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); enterSelection(c.id); }}
        style={{
          background: TH.bgCard,
          borderRadius: 16,
          marginBottom: 14,
          boxShadow: isExpanded
            ? `0 8px 22px rgba(15,23,42,0.25), 0 0 0 2px ${fc.dark}`
            : "0 4px 14px rgba(15,23,42,0.12)",
          overflow: "hidden",
          position: "relative",
          opacity: selectionMode && !selectedIds.has(c.id) ? 0.55 : 1,
          cursor: "pointer",
        }}>
        {/* Banner stato top 6px */}
        <div style={{
          height: 6,
          background: `linear-gradient(90deg, ${fc.dark} 0%, ${fc.text} 100%)`,
        }} />

        {selectionMode && (
          <div style={{
            position: "absolute", top: 14, left: 14,
            width: 22, height: 22, borderRadius: 6,
            border: `2px solid ${selectedIds.has(c.id) ? TH.navy : TH.subLight}`,
            background: selectedIds.has(c.id) ? TH.navy : "rgba(255,255,255,0.95)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 5,
          }}>
            {selectedIds.has(c.id) && <span style={{ color: "#FFF", fontSize: 12, fontWeight: 900 }}>✓</span>}
          </div>
        )}

        {/* Head: avatar + info + stato */}
        <div style={{ padding: "14px 14px 8px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 48, height: 48,
            background: `linear-gradient(135deg, ${fc.dark}, ${fc.text})`,
            color: "#FFFFFF",
            borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800,
            flexShrink: 0,
            boxShadow: `0 3px 8px ${fc.dark}55`,
            letterSpacing: 0.5,
          }}>{initials(c)}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 800,
              color: TH.ink, letterSpacing: -0.01,
              marginBottom: 3, lineHeight: 1.2,
            }}>{(c.cliente || "").toUpperCase()}{c.cognome ? " " + c.cognome.toUpperCase() : ""}</div>
            <div style={{
              fontSize: 12, color: TH.sub,
              lineHeight: 1.4,
              display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as any,
            }}>
              <span style={{
                fontWeight: 800, color: fc.text,
                background: fc.light,
                padding: "2px 7px", borderRadius: 5,
                fontSize: 10, letterSpacing: 0.5,
              }}>{c.code}</span>
              {c.indirizzo && <span style={{ color: TH.sub, fontSize: 12 }}>{c.indirizzo}</span>}
            </div>
          </div>

          <span style={{
            background: fc.light,
            color: fc.text,
            padding: "5px 11px",
            borderRadius: 999,
            fontSize: 10, fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: "uppercase" as any,
            flexShrink: 0,
            border: `1px solid ${fc.text}33`,
            whiteSpace: "nowrap",
          }}>{ferma ? `Ferma ${giorniFermaCM(c)}gg` : (scad ? "Scaduta" : fase.nome)}</span>
        </div>

        {/* Workflow 7-step */}
        <div style={{ padding: "0 14px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            {WORKFLOW_STEPS.map((s, i) => (
              <div key={s.id} style={{
                flex: 1, height: 6,
                background: i < stepN ? fc.dark : (i === stepN ? fc.dark : TH.borderSoft),
                opacity: i === stepN ? 0.5 : 1,
                borderRadius: 3,
                position: "relative",
              }}>
                {i === stepN && (
                  <div style={{
                    position: "absolute", top: "50%", left: "100%",
                    width: 12, height: 12,
                    background: "#FFFFFF",
                    border: `2px solid ${fc.dark}`,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    boxShadow: `0 0 0 3px ${fc.dark}26`,
                  }} />
                )}
              </div>
            ))}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 9, fontWeight: 700, color: TH.subLight,
            textTransform: "uppercase" as any, letterSpacing: 0.4,
            padding: "0 2px",
          }}>
            {WORKFLOW_STEPS.map((s, i) => (
              <span key={s.id} style={{ color: i <= stepN ? fc.text : TH.subLight }}>{s.short}</span>
            ))}
          </div>
        </div>

        {/* Info row */}
        <div style={{
          padding: "10px 14px 4px",
          display: "flex", alignItems: "center", gap: 12,
          borderTop: `1px solid ${TH.borderSoft}`,
          flexWrap: "wrap" as any,
        }}>
          {vaniA.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TH.sub, fontWeight: 700 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={fc.dark} strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              {vaniA.length} van{vaniA.length === 1 ? "o" : "i"}
            </div>
          )}
          {c.aggiornato && (
            <>
              <div style={{ width: 1, height: 14, background: TH.border }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TH.sub, fontWeight: 700 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={fc.dark} strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/></svg>
                {c.aggiornato}
              </div>
            </>
          )}
          {euroVal > 0 && (
            <>
              <div style={{ width: 1, height: 14, background: TH.border }} />
              <div style={{ fontSize: 12, color: fc.text, fontWeight: 800 }}>{fmtEuro(euroVal)}</div>
            </>
          )}
        </div>

        {/* Bottone Apri Centro */}
        <div style={{
          margin: "8px 12px 12px",
          background: fc.dark,
          borderRadius: 10,
          padding: "12px 14px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 12, fontWeight: 800,
          color: "#FFFFFF",
          letterSpacing: 0.4,
          textTransform: "uppercase" as any,
          boxShadow: `0 2px 6px ${fc.dark}40`,
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}><polyline points="6 9 12 15 18 9"/></svg>
          Apri Centro Operativo
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER TABLE (variante B mockup — con avanzamento)
  // ============================================================
  const renderTableHead = () => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "54px 1fr 56px 64px 60px",
      gap: 6,
      padding: "9px 10px",
      background: TH.navy,
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: 0.5,
      textTransform: "uppercase" as any,
      alignItems: "center",
    }}>
      <div>Cod</div><div>Cliente</div><div>Stato</div>
      <div style={{ textAlign: "center" }}>Avanz.</div>
      <div style={{ textAlign: "center" }}>Scad.</div>
    </div>
  );

  const renderTableRow = (c: any, idx: number) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const fc = getFaseColor(c.fase, alert);
    const stepN = stepIndex(c.fase);
    const pct = Math.round(((stepN + 1) / WORKFLOW_STEPS.length) * 100);
    const isLast = idx === filteredSorted.length - 1;

    const subInfo: string[] = [];
    if (vaniA.length > 0) subInfo.push(`${vaniA.length} vano`);
    if (euroVal > 0) subInfo.push(fmtEuro(euroVal));

    return (
      <div key={c.id}
        onClick={() => handleCardClick(c, () => { setSelectedCM(c); setTab("commesse"); })}
        onTouchStart={() => handleTouchStart(c.id)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); enterSelection(c.id); }}
        style={{
          display: "grid",
          gridTemplateColumns: "54px 1fr 56px 64px 60px",
          gap: 6,
          padding: 10,
          borderBottom: isLast ? "none" : `1px solid ${TH.borderSoft}`,
          alignItems: "center",
          position: "relative",
          cursor: "pointer",
          opacity: selectionMode && !selectedIds.has(c.id) ? 0.55 : 1,
        }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: fc.dark,
        }} />
        <div style={{
          fontSize: 9.5, fontWeight: 800,
          color: fc.text, background: fc.light,
          padding: "3px 5px", borderRadius: 4,
          textAlign: "center", letterSpacing: 0.4,
        }}>{c.code}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: TH.ink, lineHeight: 1.15 }}>
          {(c.cliente || "").toUpperCase()}
          {subInfo.length > 0 && <div style={{ fontSize: 9.5, color: TH.sub, fontWeight: 600, marginTop: 1 }}>{subInfo.join(" · ")}</div>}
        </div>
        <div style={{
          background: fc.light, color: fc.text,
          padding: "3px 4px", borderRadius: 999,
          fontSize: 8, fontWeight: 800,
          textAlign: "center",
          textTransform: "uppercase" as any, letterSpacing: 0.3,
        }}>{(fase.nome || "").substring(0, 4)}.</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ height: 4, background: TH.borderSoft, borderRadius: 2, overflow: "hidden", marginBottom: 2 }}>
            <div style={{ height: "100%", background: fc.dark, width: `${pct}%`, borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: TH.sub }}>{pct}%</div>
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: alert ? TH.red : TH.sub, textAlign: "center", lineHeight: 1.1 }}>
          {c.scadenza ? fmtData(c.scadenza) : "—"}
          {ferma && <div style={{ fontSize: 8.5, color: TH.red, fontWeight: 800, marginTop: 1 }}>+{giorniFermaCM(c)}g</div>}
        </div>
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div style={{
      fontFamily: "'Manrope', -apple-system, 'SF Pro Display', system-ui, sans-serif",
      background: TH.bgPage,
      minHeight: "100%",
      padding: "calc(env(safe-area-inset-top, 0px) + 0px) 0 110px",
      overflowX: "hidden" as any,
    }}>

      {/* HEADER NAVY MOCKUP */}
      <div style={{
        background: `linear-gradient(160deg, ${TH.navy} 0%, ${TH.navyDark} 100%)`,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        padding: "16px 18px 24px",
        position: "relative" as any,
        overflow: "hidden" as any,
        boxShadow: "0 8px 22px rgba(15,23,42,0.25)",
        color: "#FFFFFF",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "#93B0CF", textTransform: "uppercase" as any }}>Lavori</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.02, lineHeight: 1.1, marginTop: 2 }}>Commesse</div>
            <div style={{ fontSize: 13, color: "#B5C8DD", fontWeight: 600, marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
              <span>{cantieriAttivi.length} totali</span>
              {fermeCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, color: "#FFFFFF",
                  background: "#991B1B",
                  padding: "3px 9px", borderRadius: 9,
                  letterSpacing: 0.3,
                }}>{fermeCount} FERM{fermeCount === 1 ? "A" : "E"}</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              display: "flex", gap: 2, padding: 3,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 10,
            }}>
              {[
                { v: "list", icon: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></> },
                { v: "card", icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
                { v: "table", icon: <><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/></> },
              ].map(({ v, icon }) => {
                const sel = cmView === v;
                return (
                  <div key={v} onClick={() => setCmView(v as any)} style={{
                    width: 32, height: 28,
                    borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    background: sel ? "#FFFFFF" : "transparent",
                    color: sel ? TH.navy : "rgba(255,255,255,0.6)",
                    transition: "all 0.15s",
                  }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">{icon}</svg>
                  </div>
                );
              })}
            </div>

            <div onClick={() => setShowModal("commessa")} style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#FFFFFF", color: TH.navy,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(15,23,42,0.25)",
              marginLeft: 6,
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px",
          background: "rgba(255,255,255,0.14)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 12,
          color: "rgba(255,255,255,0.85)",
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 14, fontWeight: 600, color: "#FFFFFF",
              outline: "none", fontFamily: "inherit",
            }}
            placeholder="Cerca cliente, codice..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {searchQ && (
            <div onClick={() => setSearchQ("")} style={{ cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: 18, padding: "0 2px" }}>×</div>
          )}
        </div>
      </div>

      {/* CHIPS FILTRI - mockup navy/bianco */}
      <div style={{
        display: "flex", gap: 8,
        padding: "0 16px 4px",
        marginBottom: 10,
        overflowX: "auto",
        scrollbarWidth: "none" as any,
        WebkitOverflowScrolling: "touch" as any,
      }} className="hide-scrollbar">
        {[
          { id: "tutte", nome: "Tutte", count: cantieriAttivi.length },
          ...PIPELINE.filter(p => p.attiva)
            .map(p => ({ ...p, count: cantieriAttivi.filter(c => c.fase === p.id).length }))
            .filter(p => p.count > 0),
        ].map(p => {
          const sel = filterFase === p.id;
          return (
            <div key={p.id}
              onClick={() => setFilterFase(sel && p.id !== "tutte" ? "tutte" : p.id)}
              style={{
                background: sel ? TH.navy : "#FFFFFF",
                border: `1px solid ${sel ? TH.navy : TH.subLight}`,
                color: sel ? "#FFFFFF" : TH.sub,
                borderRadius: 999,
                padding: "8px 14px",
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 12, fontWeight: 700,
                whiteSpace: "nowrap" as any,
                flexShrink: 0,
                cursor: "pointer",
              }}>
              <span>{p.nome}</span>
              <span style={{
                background: sel ? "rgba(15,27,45,0.9)" : TH.navyMuted,
                color: "#FFFFFF",
                fontSize: 10, fontWeight: 800,
                padding: "2px 7px", borderRadius: 999,
                minWidth: 20, textAlign: "center" as any,
              }}>{p.count}</span>
            </div>
          );
        })}
      </div>

      {/* SORT TABS */}
      <div style={{
        background: "#FFFFFF",
        margin: "0 16px 14px",
        borderRadius: 10,
        padding: 4,
        display: "flex", gap: 2,
        border: `1px solid ${TH.border}`,
      }}>
        {[["default", "Recenti"], ["nome", "A-Z"], ["euro", "€"], ["data", "Data"]].map(([v, l]) => {
          const sel = sortBy === v;
          return (
            <div key={v} onClick={() => setSortBy(v as any)} style={{
              flex: 1, textAlign: "center" as any,
              padding: "8px 6px",
              borderRadius: 7,
              fontSize: 12, fontWeight: 700,
              background: sel ? TH.navy : "transparent",
              color: sel ? "#FFFFFF" : TH.sub,
              cursor: "pointer",
            }}>{l}</div>
          );
        })}
        {totaleEuro > 0 && (
          <div style={{
            marginLeft: 4,
            padding: "8px 11px", borderRadius: 7,
            background: TH.navyDark,
            fontSize: 11, fontWeight: 800, color: "#FFFFFF",
            fontFamily: FM,
          }}>{filtered.length} · {fmtEuro(totaleEuro)}</div>
        )}
      </div>

      {/* CONTENT */}
      {filtered.length === 0 ? (
        <div style={{
          background: TH.bgCard,
          margin: "0 16px",
          borderRadius: 16, padding: "48px 20px",
          textAlign: "center" as any,
          boxShadow: "0 4px 14px rgba(15,23,42,0.12)",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: TH.bgPill,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={TH.navy} strokeWidth={1.8}>
              <rect x="5" y="3" width="14" height="18" rx="2"/>
              <line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: TH.ink }}>Nessuna commessa</div>
          <div style={{ fontSize: 12, color: TH.sub, marginTop: 5, fontWeight: 500 }}>Modifica i filtri o creane una nuova</div>
          <div onClick={() => setShowModal("commessa")} style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 22px", borderRadius: 13,
            background: TH.navy,
            color: "#FFFFFF", fontSize: 14, fontWeight: 800,
            cursor: "pointer",
            boxShadow: `0 4px 10px ${TH.navy}55`,
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuova commessa
          </div>
        </div>
      ) : cmView === "list" ? (
        <div style={{
          background: TH.bgCard,
          margin: "0 14px",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 4px 14px rgba(15,23,42,0.18)",
        }}>
          {filteredSorted.map((c, i) => renderRow(c, i))}
        </div>
      ) : cmView === "card" ? (
        <div style={{
          padding: "0 14px",
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : isTablet ? "1fr 1fr" : "1fr",
          gap: 0,
        }}>
          {filteredSorted.map((c, i) => renderCard(c, i))}
        </div>
      ) : cmView === "table" ? (
        <div style={{
          margin: "0 14px",
          background: TH.bgCard,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 4px 14px rgba(15,23,42,0.18)",
        }}>
          {renderTableHead()}
          {filteredSorted.map((c, i) => renderTableRow(c, i))}
        </div>
      ) : (
        // hero/default fallback -> card mockup
        <div style={{
          padding: "0 14px",
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : isTablet ? "1fr 1fr" : "1fr",
          gap: 0,
        }}>
          {filteredSorted.map((c, i) => renderCard(c, i, true))}
        </div>
      )}

      {/* MERGE MODAL */}
      {showMergeModal && (() => {
        const selected = filteredSorted.filter((c: any) => selectedIds.has(c.id));
        return (
          <MergeCommesseModal
            commesse={selected}
            onClose={() => setShowMergeModal(false)}
            onDone={handleMergeDone}
          />
        );
      })()}

      {/* BULK TOOLBAR */}
      {selectionMode && (() => {
        const allSel = selectedIds.size === filteredSorted.length && filteredSorted.length > 0;
        const nSel = selectedIds.size;
        const canAction = nSel > 0 && !bulkBusy;
        const canMerge = nSel >= 2 && !bulkBusy;
        return (
          <div style={{
            position: "fixed" as any,
            left: 10, right: 10,
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
            zIndex: 100,
            background: `linear-gradient(145deg, ${TH.navy} 0%, ${TH.navyDark} 100%)`,
            borderRadius: 22,
            padding: 12,
            boxShadow: "0 18px 40px rgba(15,23,42,0.45)",
            border: `1px solid ${TH.navyMuted}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <button onClick={exitSelection} style={{
                padding: "8px 11px", borderRadius: 11,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#F1F5F9", fontSize: 10, fontWeight: 900,
                cursor: "pointer", letterSpacing: 0.5,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#F1F5F9" strokeWidth={2.6}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                ESCI
              </button>
              <div style={{ flex: 1, textAlign: "center" as any }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, color: "rgba(200,228,228,0.75)", letterSpacing: 1.4 }}>SELEZIONATE</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "#FFFFFF" }}>
                  <span>{nSel}</span>
                  <span style={{ opacity: 0.5, margin: "0 6px", fontSize: 13 }}>di</span>
                  <span style={{ opacity: 0.9 }}>{filteredSorted.length}</span>
                </div>
              </div>
              <button onClick={() => {
                if (allSel) setSelectedIds(new Set());
                else setSelectedIds(new Set(filteredSorted.map((c: any) => c.id)));
              }} style={{
                padding: "8px 11px", borderRadius: 11,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#F1F5F9", fontSize: 10, fontWeight: 900,
                cursor: "pointer", letterSpacing: 0.5,
              }}>{allSel ? "NESSUNA" : "TUTTE"}</button>
            </div>

            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={openMergeModal} disabled={!canMerge} style={{
                flex: 1, height: 44, borderRadius: 14, border: "none",
                background: canMerge ? TH.navyLight : "rgba(45,90,135,0.3)",
                color: "#FFFFFF", fontSize: 11, fontWeight: 900,
                cursor: canMerge ? "pointer" : "not-allowed",
                opacity: canMerge ? 1 : 0.55,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>UNISCI</button>
              <button onClick={bulkArchivia} disabled={!canAction} style={{
                flex: 1, height: 44, borderRadius: 14, border: "none",
                background: canAction ? TH.ambra : "rgba(146,64,14,0.3)",
                color: "#FFFFFF", fontSize: 11, fontWeight: 900,
                cursor: canAction ? "pointer" : "not-allowed",
                opacity: canAction ? 1 : 0.55,
              }}>ARCHIVIA</button>
              <button onClick={bulkSoftDelete} disabled={!canAction} style={{
                flex: 1, height: 44, borderRadius: 14, border: "none",
                background: canAction ? TH.red : "rgba(153,27,27,0.3)",
                color: "#FFFFFF", fontSize: 11, fontWeight: 900,
                cursor: canAction ? "pointer" : "not-allowed",
                opacity: canAction ? 1 : 0.55,
              }}>{bulkBusy ? "..." : "CESTINO"}</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
