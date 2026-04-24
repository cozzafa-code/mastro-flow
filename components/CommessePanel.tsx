"use client";
// @ts-nocheck
// MASTRO ERP — CommessePanel v6 — fliwoX Sistema Operativo
import React, { useState, useRef } from "react";
import { useMastro } from "./MastroContext";
import { supabase } from "../lib/supabase";
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
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("commesse")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id || null,
        })
        .in("id", validIds);
      if (error) throw error;
      exitSelection();
      window.location.reload();
    } catch (e: any) {
      alert("Errore eliminazione: " + (e?.message || e));
      setBulkBusy(false);
    }
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
  if (selectedRilievo) return <CMDetailPanel />;
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
  const renderCard = (c: any, idx: number) => {
    const fase = getFaseInfo(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const fs = faseStyle(c.fase, alert, ferma, giorniFermaCM(c), fase.nome);

    const isExpanded = expandedCmId === c.id;
    return (
      <div key={c.id}
        style={{
          background: (PIPELINE_FLIWOX[c.fase] || PIPELINE_FLIWOX.sopralluogo).bg,
          borderRadius: 18,
          padding: "14px 16px",
          marginBottom: 12,
          position: "relative" as any,
          opacity: selectionMode && !selectedIds.has(c.id) ? 0.6 : 1,
          boxShadow: alert
            ? `0 6px 20px rgba(226,75,74,0.15), inset 3px 0 0 ${TH.red}`
            : isExpanded
              ? `0 10px 28px rgba(40,160,160,0.18), 0 0 0 2px ${TH.teal}`
              : "0 6px 20px rgba(31,120,120,0.1), inset 0 1px 1px rgba(255,255,255,0.8)",
          border: "1px solid rgba(200,228,228,0.5)",
          transition: "box-shadow 0.2s",
        }}
        onClick={() => handleCardClick(c, () => { if (!isExpanded) { setSelectedCM(c); setTab("commesse"); } })}
        onTouchStart={() => handleTouchStart(c.id)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); enterSelection(c.id); }}>

        {/* Checkbox selezione */}
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

        {/* ═══ BOTTONE ESPANDI ═══ */}
        <div
          onClick={(e) => { e.stopPropagation(); setExpandedCmId(isExpanded ? null : c.id); }}
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 10,
            background: isExpanded ? "linear-gradient(145deg, #0D1F1F, #1A3535)" : (PIPELINE_FLIWOX[c.fase] || PIPELINE_FLIWOX.sopralluogo).bg,
            border: isExpanded ? "none" : "1px solid #C8E4E4",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            cursor: "pointer",
            color: isExpanded ? "#5FD0D0" : TH.tealDark,
            fontSize: 11, fontWeight: 800, letterSpacing: "0.3px",
            boxShadow: isExpanded ? "0 4px 10px rgba(13,31,31,0.25)" : "0 2px 6px rgba(31,120,120,0.08)",
            transition: "all 0.15s",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? "#5FD0D0" : TH.tealDark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          {isExpanded ? "CHIUDI DETTAGLIO" : "APRI CENTRO OPERATIVO"}
        </div>

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
                marginTop: 12, padding: "12px 0 0",
                borderTop: "1px dashed rgba(40,160,160,0.25)",
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
                    background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
                    color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer",
                    boxShadow: "0 5px 12px rgba(31,120,120,0.35), inset 0 1px 2px rgba(255,255,255,0.3)",
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

              {/* Apri centro completo */}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedCM(c); setTab("commesse"); }}
                style={{
                  width: "100%", padding: "11px", borderRadius: 11, border: "none",
                  background: "linear-gradient(145deg, #0D1F1F, #1A3535)",
                  color: "#5FD0D0", fontSize: 11, fontWeight: 900, cursor: "pointer",
                  letterSpacing: "0.4px",
                  boxShadow: "0 5px 14px rgba(13,31,31,0.3), inset 0 1px 2px rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                APRI CENTRO COMPLETO
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5FD0D0" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          );
        })()}
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
      <div key={c.id}
        onClick={() => handleCardClick(c, () => { setSelectedCM(c); setTab("commesse"); })}
        onTouchStart={() => handleTouchStart(c.id)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); enterSelection(c.id); }}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 14px", cursor: "pointer",
          borderBottom: isLast ? "none" : `1px solid ${TH.border}`,
          background: selectionMode && selectedIds.has(c.id) ? "rgba(40,160,160,0.08)" : "transparent",
          opacity: selectionMode && !selectedIds.has(c.id) ? 0.6 : 1,
        }}>

        {selectionMode && (
          <div style={{
            width: 22, height: 22, borderRadius: 11, flexShrink: 0,
            background: selectedIds.has(c.id) ? TH.teal : "#fff",
            border: `2px solid ${selectedIds.has(c.id) ? TH.tealDark : TH.borderSolid}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}>
            {selectedIds.has(c.id) && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
        )}
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

      {/* ═══ BULK TOOLBAR FLOTTANTE ═══ */}
      {selectionMode && (
        <div style={{
          position: "fixed" as any,
          left: 12, right: 12,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
          zIndex: 100,
          background: "linear-gradient(145deg, #0D1F1F, #1A3535)",
          borderRadius: 18,
          padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 10px 28px rgba(13,31,31,0.45), inset 0 1px 2px rgba(255,255,255,0.08)",
          border: "1px solid rgba(95,208,208,0.2)",
        }}>
          {/* Conteggio */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" as any, gap: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(95,208,208,0.7)", letterSpacing: "1px" }}>SELEZIONATE</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#5FD0D0", fontFamily: FM, letterSpacing: "-0.3px" }}>
              {selectedIds.size} · di {filteredSorted.length}
            </div>
          </div>

          {/* Seleziona tutto */}
          <button
            onClick={() => {
              if (selectedIds.size === filteredSorted.length) {
                setSelectedIds(new Set());
              } else {
                setSelectedIds(new Set(filteredSorted.map((c: any) => c.id)));
              }
            }}
            style={{
              padding: "10px 12px", borderRadius: 11, border: "none",
              background: "rgba(95,208,208,0.15)",
              color: "#5FD0D0", fontSize: 10, fontWeight: 800, cursor: "pointer",
              letterSpacing: "0.3px",
            }}
          >
            {selectedIds.size === filteredSorted.length ? "NESSUNA" : "TUTTE"}
          </button>

          {/* Cestino */}
          <button
            onClick={bulkSoftDelete}
            disabled={selectedIds.size === 0 || bulkBusy}
            style={{
              padding: "10px 14px", borderRadius: 11, border: "none",
              background: selectedIds.size === 0
                ? "rgba(226,75,74,0.3)"
                : "linear-gradient(145deg, #FF7B4D, #E24B4A)",
              color: "#fff", fontSize: 11, fontWeight: 900,
              cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
              letterSpacing: "0.3px",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: selectedIds.size > 0 ? "0 4px 10px rgba(226,75,74,0.4)" : "none",
              opacity: bulkBusy ? 0.6 : 1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
            {bulkBusy ? "..." : "CESTINO"}
          </button>

          {/* Annulla */}
          <button
            onClick={exitSelection}
            style={{
              width: 38, height: 38, borderRadius: 11, border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
