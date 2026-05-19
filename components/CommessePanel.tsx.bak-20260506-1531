"use client";
// @ts-nocheck
// MASTRO ERP — CommessePanel v6 — fliwoX Sistema Operativo
import React, { useState, useRef } from "react";
import { useMastro } from "./MastroContext";
import { supabase } from "../lib/supabase";
import { mastroStore } from "../lib/mastro-store";
import MergeCommesseModal from "./MergeCommesseModal";

// UUID check (per escludere ID locali da azioni bulk server-side)
const _UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
  sopralluogo: { bg: "#EEEDFE", fg: "#26215C", solid: "#3C3489" },
  rilievo:     { bg: "#EEEDFE", fg: "#26215C", solid: "#3C3489" },
  preventivo:  { bg: "#E1F5EE", fg: "#04342C", solid: "#0F6E56" },
  conferma:    { bg: "#FAEEDA", fg: "#412402", solid: "#854F0B" },
  ordini:      { bg: "#FAEEDA", fg: "#412402", solid: "#854F0B" },
  produzione:  { bg: "#B5D4F4", fg: "#042C53", solid: "#185FA5" },
  posa:        { bg: "#F4C0D1", fg: "#4B1528", solid: "#993556" },
  collaudo:    { bg: "#F4C0D1", fg: "#4B1528", solid: "#993556" },
  fattura:     { bg: "#EAF3DE", fg: "#173404", solid: "#3B6D11" },
  chiusura:    { bg: "#F1EFE8", fg: "#2C2C2A", solid: "#5F5E5A" },
};


const __styleInject = typeof document !== "undefined" && !document.getElementById("mastro-cm-slide")
  ? (() => { const el = document.createElement("style"); el.id = "mastro-cm-slide"; el.textContent = "@keyframes slideDown { from { opacity: 0; max-height: 0 } to { opacity: 1; max-height: 800px } }"; document.head.appendChild(el); return true; })()
  : true;

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
    // Se long-press appena scattato, ignora il click
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

    // Filtra solo UUID validi (escludi ID locali/offline tipo Date.now())
    const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const ids = Array.from(selectedIds);
    const validIds = ids.filter(id => UUID_RX.test(id));
    const invalidCount = ids.length - validIds.length;

    if (validIds.length === 0) {
      alert(
        `Impossibile eliminare: le ${ids.length} commess${ids.length === 1 ? "a" : "e"} selezionate ` +
        `non sono sincronizzate con il server (ID locali offline).\n\n` +
        `Apri una commessa e salvala per forzare la sync, poi riprova.`
      );
      exitSelection();
      return;
    }

    const confirmMsg = invalidCount > 0
      ? `Spostare ${validIds.length} commess${validIds.length === 1 ? "a" : "e"} nel cestino?\n\n` +
        `⚠ ${invalidCount} element${invalidCount === 1 ? "o" : "i"} non sincronizzat${invalidCount === 1 ? "o" : "i"} sarà ignorato.\n\n` +
        `Eliminazione definitiva dopo 30 giorni.`
      : `Spostare ${validIds.length} commess${validIds.length === 1 ? "a" : "e"} nel cestino?\n\n` +
        `Eliminazione definitiva dopo 30 giorni.`;

    if (!window.confirm(confirmMsg)) return;

    setBulkBusy(true);
    try {
      // v49 — Delega al Sync Engine: scrittura locale istantanea + outbox
      const result = await mastroStore.bulkSoftDelete("commesse", validIds);
      console.log(`[CommessePanel] bulkSoftDelete → ok=${result.ok} skipped=${result.skipped}`);
      if (result.ok === 0) throw new Error("Nessuna commessa eliminata");
      exitSelection();
      // NOTA: niente piu' window.location.reload()
      // Il sync-engine aggiorna la cache IDB: al prossimo render
      // le commesse soft-deleted saranno filtrate out.
      // Per ora forziamo reload perche' MastroContext legge da altra fonte.
      window.location.reload();
    } catch (e: any) {
      console.error("[CommessePanel] bulkSoftDelete error:", e);
      alert("Errore eliminazione: " + (e?.message || e));
      setBulkBusy(false);
    }
  };

  // ─── ARCHIVIA bulk ────────────────────────────────────────
  const bulkArchivia = async () => {
    if (selectedIds.size === 0 || bulkBusy) return;
    const ids = Array.from(selectedIds);
    const validIds = ids.filter(id => _UUID_RX.test(id));
    if (validIds.length === 0) {
      alert(`Impossibile archiviare: nessuna delle ${ids.length} commesse selezionate è sincronizzata sul server.`);
      return;
    }
    const n = validIds.length;
    const ok = window.confirm(
      `Archiviare ${n} commess${n === 1 ? "a" : "e"}?\n\n` +
      `Verranno nascoste dalla lista ma restano recuperabili in qualsiasi momento.`
    );
    if (!ok) return;
    setBulkBusy(true);
    try {
      const result = await mastroStore.bulkArchivia(validIds);
      console.log(`[CommessePanel] bulkArchivia → ok=${result.ok} skipped=${result.skipped}`);
      if (result.ok === 0) throw new Error("Nessuna commessa archiviata");
      exitSelection();
      window.location.reload();
    } catch (e: any) {
      console.error("[CommessePanel] bulkArchivia error:", e);
      alert("Errore archiviazione: " + (e?.message || e));
      setBulkBusy(false);
    }
  };

  // ─── UNISCI bulk (apre modal) ─────────────────────────────
  const openMergeModal = () => {
    if (selectedIds.size < 2) {
      alert("Seleziona almeno 2 commesse per unirle.");
      return;
    }
    const ids = Array.from(selectedIds);
    const uuidIds = ids.filter(id => _UUID_RX.test(id));
    if (uuidIds.length < 2) {
      alert(
        `Impossibile unire: servono almeno 2 commesse sincronizzate sul server.\n` +
        `Selezionate: ${ids.length}, valide: ${uuidIds.length}`
      );
      return;
    }
    setShowMergeModal(true);
  };

  const handleMergeDone = (result: any) => {
    console.log(`[CommessePanel] merge OK:`, result);
    setShowMergeModal(false);
    exitSelection();
    window.location.reload();
  };
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
  if (selectedRilievo && selectedCM) return <CMDetailPanel />;
  if (selectedCM) return <CMDetailPanel />;

  const fermeCount = cantieri.filter(c => isFerma(c)).length;
  const totaleEuro = filtered.reduce((sum, c) => sum + (c.euro ? parseFloat(c.euro) : 0), 0);
  const filteredSorted = [...filtered].sort((a, b) => {
    if (sortBy === "nome") return (a.cliente || "").localeCompare(b.cliente || "");
    if (sortBy === "euro") return (parseFloat(b.euro) || 0) - (parseFloat(a.euro) || 0);
    if (sortBy === "data") return (b.aggiornato || b.creato || "").localeCompare(a.aggiornato || a.creato || "");
    return 0;
  });

  // ─── CARD VIEW ───────────────────────────────────────────────
  const renderCard = (c: any, idx: number, heroMode = false) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const fs = faseStyle(c.fase, alert, ferma, giorniFermaCM(c), fase.nome);
    const faseStyleFliwox = PIPELINE_FLIWOX[c.fase] || PIPELINE_FLIWOX.sopralluogo;

    const isExpanded = expandedCmId === c.id;
    return (
      <div key={c.id}
        style={(() => {
          // Colori FASE (dal mockup v3 scelto da Fabio)
          const FASE_GRAD: any = {
            sopralluogo:  { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", dark: "#26215C", solid: "#7F77DD" },
            rilievo:      { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", dark: "#26215C", solid: "#7F77DD" },
            preventivo:   { grad: "linear-gradient(155deg, #5DCAA5 0%, #1D9E75 100%)", dark: "#04342C", solid: "#1D9E75" },
            conferma:     { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", dark: "#412402", solid: "#EF9F27" },
            ordini:       { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", dark: "#412402", solid: "#EF9F27" },
            produzione:   { grad: "linear-gradient(155deg, #85B7EB 0%, #378ADD 100%)", dark: "#042C53", solid: "#378ADD" },
            posa:         { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", dark: "#4B1528", solid: "#D4537E" },
            collaudo:     { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", dark: "#4B1528", solid: "#D4537E" },
            fattura:      { grad: "linear-gradient(155deg, #97C459 0%, #639922 100%)", dark: "#173404", solid: "#639922" },
            chiusura:     { grad: "linear-gradient(155deg, #888780 0%, #5F5E5A 100%)", dark: "#2C2C2A", solid: "#5F5E5A" },
          };
          const fg = alert
            ? { grad: "linear-gradient(155deg, #F09595 0%, #E24B4A 100%)", dark: "#501313", solid: "#E24B4A" }
            : (FASE_GRAD[c.fase] || FASE_GRAD.sopralluogo);
          return {
            background: heroMode ? fg.grad : "#FFFFFF",
            borderRadius: 18,
            padding: 0,
            marginBottom: 12,
            overflow: "hidden" as const,
            position: "relative" as any,
            opacity: selectionMode && !selectedIds.has(c.id) ? 0.6 : 1,
            boxShadow: isExpanded
              ? "0 10px 28px rgba(13,31,31,0.2), 0 0 0 2px #0D1F1F"
              : heroMode ? "0 8px 22px rgba(13,31,31,0.15)" : "0 6px 16px rgba(13,31,31,0.08)",
            border: heroMode ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(200,228,228,0.6)",
            borderLeft: heroMode ? undefined : `4px solid ${fg.solid}`,
            transition: "box-shadow 0.2s",
          };
        })()}
        onClick={() => handleCardClick(c, () => { if (!isExpanded) { setSelectedCM(c); setTab("commesse"); } })}
        onTouchStart={() => handleTouchStart(c.id)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); enterSelection(c.id); }}>

        {/* Checkbox selezione (posizione absoluta) */}
        {selectionMode && (
          <div style={{
            position: "absolute", top: 10, right: 10, zIndex: 5,
            width: 26, height: 26, borderRadius: 13,
            background: selectedIds.has(c.id) ? TH.teal : "rgba(255,255,255,0.9)",
            border: `2px solid ${selectedIds.has(c.id) ? TH.tealDark : TH.borderSolid}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 3px 8px rgba(13,31,31,0.2)",
            transition: "all 0.15s",
          }}>
            {selectedIds.has(c.id) && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
        )}

        <div style={{ padding: heroMode ? 0 : "14px 16px" }}>

        {/* ═══ HERO v57 · MOCKUP v3 ═══ */}
        {heroMode ? (
          <>
            {/* ZONA ALTA COLORATA */}
            <div
              onClick={(e) => { e.stopPropagation(); setExpandedCmId(isExpanded ? null : c.id); }}
              style={{ padding: "14px 16px 12px", cursor: "pointer", color: "#fff" }}
            >
              {/* Riga top: avatar + nome + pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "rgba(255,255,255,0.25)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff", fontSize: 14, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  letterSpacing: "-0.2px",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                }}>{initials(c)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 900, color: "#fff",
                    letterSpacing: "-0.2px",
                    whiteSpace: "nowrap" as any, overflow: "hidden", textOverflow: "ellipsis",
                    textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                  }}>{c.cliente}{c.cognome ? " " + c.cognome : ""}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    color: "rgba(255,255,255,0.85)",
                    letterSpacing: "0.2px", marginTop: 2,
                    whiteSpace: "nowrap" as any, overflow: "hidden", textOverflow: "ellipsis",
                  }}>{c.code}{c.indirizzo ? " · " + c.indirizzo : ""}</div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 900,
                  padding: "4px 9px", borderRadius: 7,
                  background: "rgba(255,255,255,0.95)",
                  color: "#0D1F1F",
                  letterSpacing: "0.4px", textTransform: "uppercase" as any,
                  whiteSpace: "nowrap" as any, flexShrink: 0,
                }}>{fs.text}</span>
              </div>

              {/* Barra 8 fasi */}
              <div style={{ display: "flex", gap: 2, marginTop: 10 }}>
                {PIPELINE.filter(p => p.attiva).map(p => {
                  const isActive = p.id === c.fase;
                  const isDone = PIPELINE.findIndex(pp => pp.id === p.id) < PIPELINE.findIndex(pp => pp.id === c.fase);
                  return (
                    <div key={p.id} style={{
                      flex: 1, height: 3, borderRadius: 1.5,
                      background: isActive ? "#fff" : isDone ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                      boxShadow: isActive ? "0 0 6px rgba(255,255,255,0.6)" : "none",
                    }} />
                  );
                })}
              </div>
            </div>

            {/* ZONA BASSA BIANCA */}
            <div
              onClick={(e) => { e.stopPropagation(); setExpandedCmId(isExpanded ? null : c.id); }}
              style={{
                background: "rgba(255,255,255,0.95)",
                padding: "10px 14px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: alert ? TH.red : TH.sub }}>
                {alert
                  ? (ferma ? `• ferma da ${giorniFermaCM(c)} giorni` : "• scadenza superata")
                  : (() => {
                      const parts: string[] = [];
                      if (vaniA.length > 0) parts.push(`${vaniA.length} van${vaniA.length === 1 ? "o" : "i"}`);
                      if (euroVal > 0) parts.push(fmtEuro(euroVal));
                      const fatt = (fattureDB || []).filter((f: any) => f.cmId === c.id);
                      if (fatt.length > 0) {
                        const tutte = fatt.every((f: any) => f.pagata);
                        parts.push(tutte ? "pagata ✓" : "fatturata");
                      }
                      return parts.length > 0 ? parts.join(" · ") : "nessun vano";
                    })()}
              </span>
              <span style={{
                color: "#8FA8A8", fontSize: 16, fontWeight: 900,
                transform: isExpanded ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}>▼</span>
            </div>
          </>
        ) : (
          // ───────────────── LAYOUT ORIGINALE (list/griglia) ─────────────────
          <>
            {/* Header: avatar + nome + pill fase */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={(() => {
                const FG: any = {
                  sopralluogo:  "linear-gradient(145deg, #AFA9EC, #7F77DD)",
                  rilievo:      "linear-gradient(145deg, #AFA9EC, #7F77DD)",
                  preventivo:   "linear-gradient(145deg, #5DCAA5, #1D9E75)",
                  conferma:     "linear-gradient(145deg, #FAC775, #EF9F27)",
                  ordini:       "linear-gradient(145deg, #FAC775, #EF9F27)",
                  produzione:   "linear-gradient(145deg, #85B7EB, #378ADD)",
                  posa:         "linear-gradient(145deg, #ED93B1, #D4537E)",
                  collaudo:     "linear-gradient(145deg, #ED93B1, #D4537E)",
                  fattura:      "linear-gradient(145deg, #97C459, #639922)",
                  chiusura:     "linear-gradient(145deg, #888780, #5F5E5A)",
                };
                const bg = alert
                  ? "linear-gradient(145deg, #F09595, #E24B4A)"
                  : (FG[c.fase] || FG.sopralluogo);
                return {
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: "#fff",
                  boxShadow: "0 4px 10px rgba(13,31,31,0.2), inset 0 1px 1px rgba(255,255,255,0.3)",
                  letterSpacing: "-0.2px",
                  textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                };
              })()}>{initials(c)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: TH.ink, letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.cliente}{c.cognome ? " " + c.cognome : ""}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: TH.sub, marginTop: 2 }}>
                  {c.code}{c.indirizzo ? " · " + c.indirizzo : ""}
                </div>
              </div>
              <span style={(() => {
                const FPILL: any = {
                  sopralluogo:  { bg: "rgba(127,119,221,0.12)",  fg: "#3C3489" },
                  rilievo:      { bg: "rgba(127,119,221,0.12)",  fg: "#3C3489" },
                  preventivo:   { bg: "rgba(29,158,117,0.12)",   fg: "#04342C" },
                  conferma:     { bg: "rgba(239,159,39,0.15)",   fg: "#854F0B" },
                  ordini:       { bg: "rgba(239,159,39,0.15)",   fg: "#854F0B" },
                  produzione:   { bg: "rgba(55,138,221,0.12)",   fg: "#042C53" },
                  posa:         { bg: "rgba(212,83,126,0.14)",   fg: "#4B1528" },
                  collaudo:     { bg: "rgba(212,83,126,0.14)",   fg: "#4B1528" },
                  fattura:      { bg: "rgba(99,153,34,0.14)",    fg: "#173404" },
                  chiusura:     { bg: "rgba(95,94,90,0.14)",     fg: "#2C2C2A" },
                };
                const p = alert
                  ? { bg: "rgba(226,75,74,0.14)", fg: "#8B1A1A" }
                  : (FPILL[c.fase] || FPILL.sopralluogo);
                return {
                  background: p.bg, color: p.fg,
                  fontSize: 10, padding: "4px 9px", borderRadius: 8, fontWeight: 900,
                  letterSpacing: "0.3px", textTransform: "uppercase" as any,
                  whiteSpace: "nowrap" as any,
                };
              })()}>{fs.text}</span>
            </div>

            {/* Pipeline barra (colori mockup v3) */}
            <div style={{ display: "flex", gap: 3, marginBottom: 11 }}>
              {(() => {
                const PBAR: any = {
                  sopralluogo: "#7F77DD", rilievo: "#7F77DD",
                  preventivo: "#1D9E75", conferma: "#EF9F27", ordini: "#EF9F27",
                  produzione: "#378ADD", posa: "#D4537E", collaudo: "#D4537E",
                  fattura: "#639922", chiusura: "#5F5E5A",
                };
                const currentIdx = PIPELINE.findIndex(pp => pp.id === c.fase);
                return PIPELINE.filter(p => p.attiva).map((p, i) => {
                  const pIdx = PIPELINE.findIndex(pp => pp.id === p.id);
                  const isActive = pIdx === currentIdx;
                  const isDone = pIdx < currentIdx;
                  const dc = alert && isActive ? "#E24B4A" : (PBAR[p.id] || "#7F77DD");
                  return (
                    <div key={p.id} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: isActive ? dc : isDone ? dc + "55" : "rgba(200,228,228,0.7)",
                      boxShadow: isActive ? `0 0 8px ${dc}70` : "none",
                    }} />
                  );
                });
              })()}
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

            {/* Bottone espandi (v62 colori mockup v3) */}
            {(() => {
              const FG2: any = {
                sopralluogo:  { solid: "#7F77DD", dark: "#3C3489", bg: "rgba(127,119,221,0.08)" },
                rilievo:      { solid: "#7F77DD", dark: "#3C3489", bg: "rgba(127,119,221,0.08)" },
                preventivo:   { solid: "#1D9E75", dark: "#04342C", bg: "rgba(29,158,117,0.08)" },
                conferma:     { solid: "#EF9F27", dark: "#854F0B", bg: "rgba(239,159,39,0.1)" },
                ordini:       { solid: "#EF9F27", dark: "#854F0B", bg: "rgba(239,159,39,0.1)" },
                produzione:   { solid: "#378ADD", dark: "#042C53", bg: "rgba(55,138,221,0.08)" },
                posa:         { solid: "#D4537E", dark: "#4B1528", bg: "rgba(212,83,126,0.1)" },
                collaudo:     { solid: "#D4537E", dark: "#4B1528", bg: "rgba(212,83,126,0.1)" },
                fattura:      { solid: "#639922", dark: "#173404", bg: "rgba(99,153,34,0.1)" },
                chiusura:     { solid: "#5F5E5A", dark: "#2C2C2A", bg: "rgba(95,94,90,0.1)" },
              };
              const fb = alert
                ? { solid: "#E24B4A", dark: "#8B1A1A", bg: "rgba(226,75,74,0.1)" }
                : (FG2[c.fase] || FG2.sopralluogo);
              return (
                <div
                  onClick={(e) => { e.stopPropagation(); setExpandedCmId(isExpanded ? null : c.id); }}
                  style={{
                    marginTop: 10,
                    padding: "9px 12px",
                    borderRadius: 10,
                    background: isExpanded
                      ? `linear-gradient(145deg, ${fb.solid}, ${fb.dark})`
                      : fb.bg,
                    border: isExpanded ? "none" : `1px solid ${fb.solid}40`,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    cursor: "pointer",
                    color: isExpanded ? "#fff" : fb.dark,
                    fontSize: 11, fontWeight: 900, letterSpacing: "0.3px",
                    boxShadow: isExpanded
                      ? `0 4px 10px ${fb.solid}50, inset 0 1px 2px rgba(255,255,255,0.2)`
                      : "0 2px 6px rgba(13,31,31,0.05)",
                    textShadow: isExpanded ? "0 1px 2px rgba(0,0,0,0.15)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? "#fff" : fb.dark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  {isExpanded ? "CHIUDI DETTAGLIO" : "APRI CENTRO OPERATIVO"}
                </div>
              );
            })()}
          </>
        )}

        {/* ═══ PANNELLO ESPANSO ═══ */}
        {isExpanded && (() => {
          const rilievi = c.rilievi || [];
          const vani = getVaniAttivi(c);
          const fattCm = (fattureDB || []).filter((f: any) => f.cmId === c.id);
          const fattPagate = fattCm.filter((f: any) => f.pagata);
          const incassato = fattPagate.reduce((t: number, f: any) => t + (f.importo || 0), 0);
          const hasFirma = !!c.firmaCliente;
          const hasRilievi = rilievi.length > 0;
          const hasVani = vani.length > 0;

          // Calcolo prossima azione (semplificato)
          let nextAction = "";
          let nextBtn = "";
          let nextTarget = "";
          if (!hasRilievi) { nextAction = "Esegui il primo rilievo"; nextBtn = "CREA RILIEVO"; nextTarget = "rilievo"; }
          else if (!hasVani) { nextAction = "Aggiungi vani al rilievo"; nextBtn = "APRI RILIEVO"; nextTarget = "rilievo"; }
          else if (!hasFirma) { nextAction = "Invia il preventivo al cliente per firma"; nextBtn = "APRI PREVENTIVO"; nextTarget = "preventivo"; }
          else if (fattCm.length === 0) { nextAction = "Emetti la fattura di acconto"; nextBtn = "CREA FATTURA"; nextTarget = "fattura"; }
          else if (!fattPagate.length) { nextAction = "Acconto non ancora incassato"; nextBtn = "SOLLECITA"; nextTarget = "fattura"; }
          else { nextAction = "Procedi con ordine fornitore"; nextBtn = "CREA ORDINE"; nextTarget = "ordini"; }

          // Alert automatici
          const alerts: string[] = [];
          if (ferma) alerts.push(`Commessa ferma da ${giorniFermaCM(c)} giorni`);
          if (scad) alerts.push("Scadenza superata");
          if (hasRilievi && !hasFirma && rilievi[0]?.data) {
            const gg = Math.floor((Date.now() - new Date(rilievi[0].data).getTime()) / 86400000);
            if (gg > 5) alerts.push(`Preventivo fermo da ${gg}gg — solleciti firma`);
          }

          return (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                margin: heroMode ? 0 : "12px -16px -14px",
                padding: heroMode ? "14px" : "14px 16px",
                background: "#FFFFFF",
                borderTop: heroMode ? "none" : "1px solid rgba(200,228,228,0.5)",
                borderBottomLeftRadius: heroMode ? 0 : 18,
                borderBottomRightRadius: heroMode ? 0 : 18,
                animation: "slideDown 0.25s ease-out",
              }}
            >
              {/* Prossima azione */}
              <div style={{
                background: "linear-gradient(145deg, rgba(95,208,208,0.15), rgba(40,160,160,0.08))",
                borderRadius: 12, padding: "10px 12px", marginBottom: 10,
                border: "1px solid rgba(40,160,160,0.25)",
              }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: TH.tealDark, letterSpacing: "1px", marginBottom: 4 }}>PROSSIMA AZIONE</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TH.ink, marginBottom: 8 }}>{nextAction}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCM(c); setTab("commesse"); }}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 10, border: "none",
                    background: alert
                      ? "linear-gradient(145deg, #F0997B 0%, #D85A30 50%, #993C1D 100%)"
                      : `linear-gradient(145deg, ${faseStyleFliwox.solid} 0%, ${faseStyleFliwox.fg} 100%)`,
                    color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer",
                    boxShadow: alert
                      ? "0 5px 12px rgba(216,90,48,0.35), inset 0 1px 2px rgba(255,255,255,0.3)"
                      : `0 5px 12px ${faseStyleFliwox.solid}50, inset 0 1px 2px rgba(255,255,255,0.3)`,
                    letterSpacing: "0.4px",
                  }}
                >{nextBtn} →</button>
              </div>

              {/* Alert */}
              {alerts.length > 0 && (
                <div style={{
                  background: "linear-gradient(145deg, rgba(226,75,74,0.12), rgba(226,75,74,0.05))",
                  borderRadius: 12, padding: "10px 12px", marginBottom: 10,
                  border: "1px solid rgba(226,75,74,0.3)",
                }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: TH.red, letterSpacing: "1px", marginBottom: 5 }}>⚠ ATTENZIONE</div>
                  {alerts.map((a, i) => (
                    <div key={i} style={{ fontSize: 11, fontWeight: 600, color: TH.red, marginBottom: 2 }}>· {a}</div>
                  ))}
                </div>
              )}

              {/* Quick stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
                {[
                  { l: "VANI", v: vani.length || "—", c: TH.tealDark },
                  { l: "INCASSATO", v: incassato > 0 ? "€" + (incassato/1000).toFixed(1) + "k" : "€0", c: TH.greenDark },
                  { l: "PROG", v: Math.round(((PIPELINE.findIndex(p => p.id === c.fase) + 1) / PIPELINE.length) * 100) + "%", c: "#1A3535" },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: "8px 6px", borderRadius: 10,
                    background: "linear-gradient(155deg, #FFFFFF, #F5FBFB)",
                    border: "1px solid rgba(200,228,228,0.5)",
                    textAlign: "center" as const,
                  }}>
                    <div style={{ fontSize: 8, fontWeight: 900, color: TH.sub, letterSpacing: "0.5px" }}>{s.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: s.c, marginTop: 2, fontFamily: FM, letterSpacing: "-0.3px" }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                {[
                  { l: "Misure", ico: <path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3z"/>, c: TH.teal },
                  { l: "Fatture", ico: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>, c: TH.greenDark },
                  { l: "Ordini", ico: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>, c: TH.amberDeep },
                  { l: "Montaggio", ico: <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>, c: "#7B6BA5" },
                ].map((a, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setSelectedCM(c); setTab("commesse"); }}
                    style={{
                      padding: "10px 4px", borderRadius: 11, border: "none",
                      background: "linear-gradient(155deg, #FFFFFF, #F5FBFB)",
                      border: "1px solid rgba(200,228,228,0.6)",
                      cursor: "pointer",
                      display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4,
                      boxShadow: "0 2px 6px rgba(31,120,120,0.06)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={a.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{a.ico}</svg>
                    <span style={{ fontSize: 9, fontWeight: 800, color: TH.ink, letterSpacing: "0.2px" }}>{a.l}</span>
                  </button>
                ))}
              </div>

              {/* Apri centro completo - colorato per fase */}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedCM(c); setTab("commesse"); }}
                style={{
                  width: "100%", padding: "11px", borderRadius: 11, border: "none",
                  background: alert
                    ? "linear-gradient(145deg, #993C1D, #4A1B0C)"
                    : `linear-gradient(145deg, ${faseStyleFliwox.fg}, ${faseStyleFliwox.solid})`,
                  color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer",
                  letterSpacing: "0.4px",
                  boxShadow: alert
                    ? "0 5px 14px rgba(153,60,29,0.4), inset 0 1px 2px rgba(255,255,255,0.15)"
                    : `0 5px 14px ${faseStyleFliwox.solid}60, inset 0 1px 2px rgba(255,255,255,0.15)`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                APRI CENTRO COMPLETO
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          );
        })()}
        </div>
      </div>
    );
  };

  // ─── LIST VIEW ────────────────────────────────────────────────
  const renderRow = (c: any, idx: number) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const fs = faseStyle(c.fase, alert, ferma, giorniFermaCM(c), fase.nome);
    const isLast = idx === filteredSorted.length - 1;

    // ── v58: Lista colorata piena fase (mockup v3) ──
    const FASE_GRAD_ROW: any = {
      sopralluogo:  "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)",
      rilievo:      "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)",
      preventivo:   "linear-gradient(155deg, #5DCAA5 0%, #1D9E75 100%)",
      conferma:     "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)",
      ordini:       "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)",
      produzione:   "linear-gradient(155deg, #85B7EB 0%, #378ADD 100%)",
      posa:         "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)",
      collaudo:     "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)",
      fattura:      "linear-gradient(155deg, #97C459 0%, #639922 100%)",
      chiusura:     "linear-gradient(155deg, #888780 0%, #5F5E5A 100%)",
    };
    const rowGrad = alert
      ? "linear-gradient(155deg, #F09595 0%, #E24B4A 100%)"
      : (FASE_GRAD_ROW[c.fase] || FASE_GRAD_ROW.sopralluogo);

    // Info compatta sotto nome
    const fatt = (fattureDB || []).filter((f: any) => f.cmId === c.id);
    const fattTutte = fatt.length > 0 && fatt.every((f: any) => f.pagata);
    const infoParts: string[] = [];
    if (vaniA.length > 0) infoParts.push(`${vaniA.length} van${vaniA.length === 1 ? "o" : "i"}`);
    if (euroVal > 0) infoParts.push(fmtEuro(euroVal));
    if (fattTutte) infoParts.push("pagata ✓");
    else if (fatt.length > 0) infoParts.push("fatturata");
    const infoText = ferma
      ? `${giorniFermaCM(c)} gg ferma •`
      : (scad ? "scadenza superata" : (infoParts.length > 0 ? infoParts.join(" · ") : c.indirizzo || ""));

    return (
      <div key={c.id}
        onClick={() => handleCardClick(c, () => { setSelectedCM(c); setTab("commesse"); })}
        onTouchStart={() => handleTouchStart(c.id)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); enterSelection(c.id); }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px",
          borderRadius: 12,
          marginBottom: 6,
          cursor: "pointer",
          background: rowGrad,
          color: "#fff",
          boxShadow: "0 3px 8px rgba(13,31,31,0.12)",
          border: "1px solid rgba(255,255,255,0.25)",
          opacity: selectionMode && !selectedIds.has(c.id) ? 0.6 : 1,
        }}>

        {selectionMode && (
          <div style={{
            width: 22, height: 22, borderRadius: 11, flexShrink: 0,
            background: selectedIds.has(c.id) ? "#fff" : "rgba(255,255,255,0.25)",
            border: `2px solid rgba(255,255,255,0.6)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {selectedIds.has(c.id) && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TH.tealDark} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
        )}

        {/* Avatar bianco traslucido */}
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 900, color: "#fff",
          letterSpacing: "-0.2px",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
        }}>{initials(c)}</div>

        {/* Nome + info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 900, color: "#fff",
            letterSpacing: "-0.1px",
            whiteSpace: "nowrap" as any, overflow: "hidden", textOverflow: "ellipsis",
            textShadow: "0 1px 2px rgba(0,0,0,0.15)",
            textTransform: "uppercase" as any,
          }}>
            {c.cliente}{c.cognome ? " " + c.cognome : ""}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            marginTop: 1,
            letterSpacing: "0.2px",
            whiteSpace: "nowrap" as any, overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {c.code}{infoText ? " · " + infoText : ""}
          </div>
        </div>

        {/* Pill stato bianca 95% */}
        <span style={{
          fontSize: 9, fontWeight: 900,
          padding: "3px 8px", borderRadius: 6,
          background: "rgba(255,255,255,0.95)",
          color: "#0D1F1F",
          letterSpacing: "0.4px", textTransform: "uppercase" as any,
          whiteSpace: "nowrap" as any, flexShrink: 0,
        }}>{fs.text}</span>

        {/* Chevron > */}
        <span style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: 16, fontWeight: 900,
          flexShrink: 0,
          textShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}>{"›"}</span>
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
              <div onClick={() => setCmView("hero")} style={{
                width: 30, height: 30, borderRadius: 7,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                background: cmView === "hero" ? "#fff" : "transparent",
                boxShadow: cmView === "hero" ? "0 2px 4px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cmView === "hero" ? TH.tealDark : "rgba(255,255,255,0.85)"} strokeWidth="2.2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/>
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

      {/* ═══ CHIP FASE v61 (mockup v3 stile) ═══ */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 4, WebkitOverflowScrolling: "touch" as any }}>
        {(() => {
          const FASE_CHIP: any = {
            sopralluogo:  { grad: "linear-gradient(145deg, #AFA9EC 0%, #7F77DD 100%)", shadow: "rgba(127,119,221,0.35)" },
            rilievo:      { grad: "linear-gradient(145deg, #AFA9EC 0%, #7F77DD 100%)", shadow: "rgba(127,119,221,0.35)" },
            preventivo:   { grad: "linear-gradient(145deg, #5DCAA5 0%, #1D9E75 100%)", shadow: "rgba(29,158,117,0.35)" },
            conferma:     { grad: "linear-gradient(145deg, #FAC775 0%, #EF9F27 100%)", shadow: "rgba(239,159,39,0.35)" },
            ordini:       { grad: "linear-gradient(145deg, #FAC775 0%, #EF9F27 100%)", shadow: "rgba(239,159,39,0.35)" },
            produzione:   { grad: "linear-gradient(145deg, #85B7EB 0%, #378ADD 100%)", shadow: "rgba(55,138,221,0.35)" },
            posa:         { grad: "linear-gradient(145deg, #ED93B1 0%, #D4537E 100%)", shadow: "rgba(212,83,126,0.35)" },
            collaudo:     { grad: "linear-gradient(145deg, #ED93B1 0%, #D4537E 100%)", shadow: "rgba(212,83,126,0.35)" },
            fattura:      { grad: "linear-gradient(145deg, #97C459 0%, #639922 100%)", shadow: "rgba(99,153,34,0.35)" },
            chiusura:     { grad: "linear-gradient(145deg, #888780 0%, #5F5E5A 100%)", shadow: "rgba(95,94,90,0.35)" },
          };
          return [
            { id: "tutte", nome: "Tutte", count: cantieri.length },
            ...PIPELINE.filter(p => p.attiva)
              .map(p => ({ ...p, count: cantieri.filter(c => c.fase === p.id).length }))
              .filter(p => p.count > 0),
          ].map(p => {
            const sel = filterFase === p.id;
            const style = p.id === "tutte"
              ? { grad: "linear-gradient(145deg, #1A3535 0%, #0D1F1F 100%)", shadow: "rgba(13,31,31,0.35)" }
              : (FASE_CHIP[p.id] || FASE_CHIP.sopralluogo);
            return (
              <div key={p.id}
                onClick={() => setFilterFase(sel && p.id !== "tutte" ? "tutte" : p.id)}
                style={{
                  padding: "8px 14px", borderRadius: 20,
                  fontSize: 11, fontWeight: 900, cursor: "pointer",
                  whiteSpace: "nowrap" as any, flexShrink: 0,
                  letterSpacing: "0.3px",
                  background: sel ? style.grad : "#fff",
                  color: sel ? "#fff" : "#0D1F1F",
                  boxShadow: sel
                    ? `0 4px 12px ${style.shadow}, inset 0 1px 1px rgba(255,255,255,0.25)`
                    : "0 2px 6px rgba(13,31,31,0.08)",
                  border: sel ? "none" : "1px solid rgba(200,228,228,0.6)",
                  textShadow: sel ? "0 1px 2px rgba(0,0,0,0.15)" : "none",
                  transition: "all 0.15s",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                <span>{p.nome}</span>
                <span style={{
                  fontSize: 10, fontWeight: 900,
                  padding: "1px 6px", borderRadius: 8,
                  background: sel ? "rgba(255,255,255,0.25)" : "rgba(40,160,160,0.12)",
                  color: sel ? "#fff" : "#1A7A7A",
                  border: sel ? "1px solid rgba(255,255,255,0.25)" : "none",
                  minWidth: 18, textAlign: "center" as any,
                }}>{p.count}</span>
              </div>
            );
          });
        })()}
      </div>

      {/* ═══ SORT + TOTALE v61 ═══ */}
      <div style={{
        display: "flex", gap: 4, alignItems: "center",
        marginBottom: 12, padding: 4,
        background: "linear-gradient(145deg, rgba(40,160,160,0.08), rgba(40,160,160,0.04))",
        borderRadius: 14,
        border: "1px solid rgba(200,228,228,0.5)",
        boxShadow: "inset 0 1px 2px rgba(13,31,31,0.04)",
      }}>
        {[["default", "Recenti"], ["nome", "A-Z"], ["euro", "€"], ["data", "Data"]].map(([v, l]) => {
          const sel = sortBy === v;
          return (
            <div key={v} onClick={() => setSortBy(v as any)} style={{
              padding: "7px 13px", borderRadius: 10,
              fontSize: 11, fontWeight: 900, cursor: "pointer",
              whiteSpace: "nowrap" as any,
              background: sel ? "#fff" : "transparent",
              color: sel ? "#0D1F1F" : "#5A7878",
              boxShadow: sel ? "0 2px 6px rgba(13,31,31,0.1), 0 0 0 1px rgba(200,228,228,0.4)" : "none",
              letterSpacing: "0.2px",
              transition: "all 0.15s",
            }}>{l}</div>
          );
        })}
        {totaleEuro > 0 && (
          <div style={{
            marginLeft: "auto",
            padding: "6px 11px", borderRadius: 10,
            background: "linear-gradient(145deg, #1A7A7A 0%, #0F5454 100%)",
            fontSize: 10, fontWeight: 900, color: "#fff",
            fontFamily: FM, letterSpacing: "-0.1px",
            boxShadow: "0 2px 6px rgba(26,122,122,0.3)",
            textShadow: "0 1px 2px rgba(0,0,0,0.15)",
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
        <div>
          {filteredSorted.map((c, i) => renderRow(c, i))}
        </div>
      ) : cmView === "card" ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : isTablet ? "1fr 1fr" : "1fr",
          gap: 10,
        }}>
          {filteredSorted.map((c, i) => renderCard(c, i))}
        </div>
      ) : (
        // default: hero
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : isTablet ? "1fr 1fr" : "1fr",
          gap: 10,
        }}>
          {filteredSorted.map((c, i) => renderCard(c, i, true))}
        </div>
      )}

      {/* ═══ MERGE MODAL ═══ */}
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

      {/* v76 · BULK TOOLBAR FLOTTANTE - RIDESIGN palette fliwoX */}
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
            background: "linear-gradient(145deg, #1E8080 0%, #155A5A 55%, #0F4444 100%)",
            borderRadius: 22,
            padding: "12px 12px 12px",
            boxShadow: "0 18px 40px rgba(15,68,68,0.45), 0 6px 14px rgba(15,68,68,0.25), inset 0 1px 1px rgba(255,255,255,0.12)",
            border: "1px solid rgba(95,208,208,0.25)",
            overflow: "hidden" as any,
          }}>
            {/* Glow decorativo */}
            <div style={{
              position: "absolute" as any, top: -30, right: -30,
              width: 120, height: 120, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(95,208,208,0.2), transparent 70%)",
              pointerEvents: "none" as any,
            }} />

            {/* ROW 1: DESELEZIONA | CONTEGGIO | TUTTE */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, position: "relative" as any }}>
              {/* DESELEZIONA */}
              <button
                onClick={exitSelection}
                style={{
                  padding: "8px 11px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#E8F8F8", fontSize: 10, fontWeight: 900, cursor: "pointer",
                  letterSpacing: "0.5px", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 5,
                  flexShrink: 0,
                }}
                title="Esci dalla modalità selezione"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8F8F8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                ESCI
              </button>

              {/* Conteggio */}
              <div style={{ flex: 1, textAlign: "center" as any, display: "flex", flexDirection: "column" as any, gap: 1 }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, color: "rgba(200,228,228,0.75)", letterSpacing: "1.4px" }}>SELEZIONATE</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px", fontFamily: FM }}>
                  <span style={{ color: "#AEE9E9" }}>{nSel}</span>
                  <span style={{ opacity: 0.5, margin: "0 6px", fontSize: 13, fontWeight: 600 }}>di</span>
                  <span style={{ opacity: 0.9 }}>{filteredSorted.length}</span>
                </div>
              </div>

              {/* TUTTE / NESSUNA */}
              <button
                onClick={() => {
                  if (allSel) setSelectedIds(new Set());
                  else setSelectedIds(new Set(filteredSorted.map((c: any) => c.id)));
                }}
                style={{
                  padding: "8px 11px", borderRadius: 11,
                  border: `1px solid ${allSel ? "rgba(174,233,233,0.5)" : "rgba(255,255,255,0.2)"}`,
                  background: allSel ? "rgba(174,233,233,0.25)" : "rgba(255,255,255,0.1)",
                  color: "#E8F8F8", fontSize: 10, fontWeight: 900, cursor: "pointer",
                  letterSpacing: "0.5px", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 5,
                  flexShrink: 0,
                }}
                title={allSel ? "Deseleziona tutto" : "Seleziona tutto"}
              >
                {allSel ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8F8F8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8F8F8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                )}
                {allSel ? "NESSUNA" : "TUTTE"}
              </button>
            </div>

            {/* ROW 2: UNISCI | ARCHIVIA | CESTINO */}
            <div style={{ display: "flex", gap: 7, position: "relative" as any }}>
              {/* UNISCI - viola */}
              <button
                onClick={openMergeModal}
                disabled={!canMerge}
                style={{
                  flex: 1, height: 44, borderRadius: 14, border: "none",
                  background: canMerge
                    ? "linear-gradient(145deg, #AFA9EC 0%, #7F77DD 50%, #6961CB 100%)"
                    : "rgba(127,119,221,0.22)",
                  color: "#fff", fontSize: 11, fontWeight: 900,
                  cursor: canMerge ? "pointer" : "not-allowed",
                  letterSpacing: "0.4px", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: canMerge
                    ? "0 5px 12px rgba(127,119,221,0.45), inset 0 -2px 0 rgba(60,52,137,0.25)"
                    : "none",
                  opacity: canMerge ? 1 : 0.55,
                }}
                title={canMerge ? "Unisci commesse selezionate" : "Seleziona almeno 2 commesse"}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
                UNISCI
              </button>

              {/* ARCHIVIA - ambra */}
              <button
                onClick={bulkArchivia}
                disabled={!canAction}
                style={{
                  flex: 1, height: 44, borderRadius: 14, border: "none",
                  background: canAction
                    ? "linear-gradient(145deg, #FAC775 0%, #EF9F27 50%, #D48613 100%)"
                    : "rgba(239,159,39,0.22)",
                  color: "#fff", fontSize: 11, fontWeight: 900,
                  cursor: canAction ? "pointer" : "not-allowed",
                  letterSpacing: "0.4px", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: canAction
                    ? "0 5px 12px rgba(239,159,39,0.45), inset 0 -2px 0 rgba(133,79,11,0.25)"
                    : "none",
                  opacity: canAction ? 1 : 0.55,
                }}
                title="Archivia commesse selezionate"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                ARCHIVIA
              </button>

              {/* CESTINO - rosso */}
              <button
                onClick={bulkSoftDelete}
                disabled={!canAction}
                style={{
                  flex: 1, height: 44, borderRadius: 14, border: "none",
                  background: canAction
                    ? "linear-gradient(145deg, #F09595 0%, #E24B4A 50%, #C13030 100%)"
                    : "rgba(226,75,74,0.22)",
                  color: "#fff", fontSize: 11, fontWeight: 900,
                  cursor: canAction ? "pointer" : "not-allowed",
                  letterSpacing: "0.4px", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: canAction
                    ? "0 5px 12px rgba(226,75,74,0.45), inset 0 -2px 0 rgba(139,26,26,0.25)"
                    : "none",
                  opacity: canAction ? 1 : 0.55,
                }}
                title="Sposta nel cestino"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                {bulkBusy ? "..." : "CESTINO"}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
