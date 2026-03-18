"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — CommessePanel v3 — Linear/Notion minimal
// Removed pipeline bar (noise), cleaner cards, more air
// ═══════════════════════════════════════════════════════════
import React from "react";
import { useMastro } from "./MastroContext";
import { AFASE, FM, FF, ICO, Ico } from "./mastro-constants";
import RilieviListPanel from "./RilieviListPanel";
import CommessaCard, { CommessaCardProps } from "./CommessaCard";
import CMDetailPanel from "./CMDetailPanel";
import VanoSectorRouter from "./VanoSectorRouter";
import RiepilogoPanel from "./RiepilogoPanel";

export default function CommessePanel() {
  const {
    T, S, isDesktop, isTablet, fs, PIPELINE,
    cantieri, filtered, selectedCM, setSelectedCM, selectedRilievo, selectedVano,
    showRiepilogo, cmView, setCmView, filterFase, setFilterFase,
    searchQ, setSearchQ, setShowModal, setTab,
    faseIndex, getVaniAttivi, giorniFermaCM, sogliaDays,
    apriInboxDocumento,
  } = useMastro();

  // ═══ CARD VIEW ═══
  const renderCard = (c: any, inGrid: boolean) => {
    const TODAY_ISO = new Date().toISOString().split("T")[0];
    const isScad = c.scadenza && c.scadenza < TODAY_ISO;
    const isFerma = (giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura") || isScad;

    // Mappa fase → stato CommessaCard
    const statoMap: Record<string, CommessaCardProps['stato']> = {
      chiusura:    'completata',
      annullata:   'annullata',
      sopralluogo: 'in_attesa',
    };
    const stato = isFerma ? 'annullata' : (statoMap[c.fase] ?? 'in_lavorazione');

    const scadenzaFmt = c.scadenza
      ? new Date(c.scadenza + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })
      : "—";

    return (
      <div key={c.id} style={{ margin: inGrid ? 0 : "0 20px 10px" }}>
        <CommessaCard
          id={c.id}
          numero={c.code || ""}
          cliente={`${c.cliente || ""}${c.cognome ? " " + c.cognome : ""}`}
          descrizione={c.indirizzo || ""}
          stato={stato}
          importo={c.euro ? parseFloat(c.euro) : 0}
          cantiere={c.indirizzo || "—"}
          scadenza={scadenzaFmt}
          onApri={() => { setSelectedCM(c); setTab("commesse"); }}
        />
      </div>
    );
  };

  // ═══ LIST VIEW ═══
  const renderRow = (c: any) => {
    const fase = PIPELINE.find(p => p.id === c.fase);
    const TODAY_ISO = new Date().toISOString().split("T")[0];
    const isScad = c.scadenza && c.scadenza < TODAY_ISO;
    const isFerma = giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura";
    const vaniA = getVaniAttivi(c);
    const vaniOk = vaniA.filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length >= 6).length;
    const faseIdx = PIPELINE.findIndex(x => x.id === c.fase);
    const prog = faseIdx >= 0 ? Math.round((faseIdx + 1) / PIPELINE.length * 100) : 0;

    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 16px", cursor: "pointer",
          borderBottom: `1px solid ${T.bdr}`,
        }}>
        <div style={{ width: 3, height: 32, borderRadius: 2, background: isFerma ? T.red : fase?.color || T.acc, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.cliente}</span>
            <span style={{ fontSize: 10, color: T.sub, fontFamily: FM }}>{c.code}</span>
            {isFerma && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, flexShrink: 0 }} />}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: fase?.color || T.acc }}>{fase?.nome}</span>
            {vaniA.length > 0 && <span style={{ fontSize: 10, color: T.sub }}>{vaniOk}/{vaniA.length} vani</span>}
            {c.euro && <span style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: FM }}>€{parseFloat(c.euro).toLocaleString("it-IT")}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, fontFamily: FM }}>{prog}%</div>
        </div>
        <span style={{ color: T.sub + "50", fontSize: 16 }}>›</span>
      </div>
    );
  };

  // ═══ ROUTING ═══
  if (showRiepilogo && selectedCM) return <RiepilogoPanel />;
  if (selectedVano) return <VanoSectorRouter />;
  if (selectedRilievo) return <CMDetailPanel />;
  if (selectedCM) return <RilieviListPanel />;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Commesse</div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{cantieri.length} totali · {filtered.length} visibili</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: T.bg, borderRadius: 8, padding: 2, border: `1px solid ${T.bdr}` }}>
            <div onClick={() => setCmView("list")} style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, background: cmView === "list" ? T.card : "transparent", color: cmView === "list" ? T.text : T.sub, boxShadow: cmView === "list" ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}>☰</div>
            <div onClick={() => setCmView("card")} style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, background: cmView === "card" ? T.card : "transparent", color: cmView === "card" ? T.text : T.sub, boxShadow: cmView === "card" ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}>▦</div>
          </div>
          <div onClick={() => setShowModal("commessa")} style={{ width: 36, height: 36, borderRadius: 10, background: T.text, color: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 20, fontWeight: 300 }}>+</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 20px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: 14, color: T.sub }}>🔍</span>
          <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: FF }} placeholder="Cerca cliente, codice, indirizzo..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          {searchQ && <div onClick={() => setSearchQ("")} style={{ cursor: "pointer", fontSize: 13, color: T.sub, padding: 2 }}>✕</div>}
        </div>
      </div>

      {/* Chips */}
      <div style={{ display: "flex", gap: 6, padding: "0 20px 12px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div onClick={() => setFilterFase("tutte")} style={{
          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
          background: filterFase === "tutte" ? T.text : "transparent", color: filterFase === "tutte" ? "#fff" : T.sub,
          border: `1px solid ${filterFase === "tutte" ? T.text : T.bdr}`,
        }}>Tutte {cantieri.length}</div>
        {PIPELINE.filter(p => p.attiva).map(p => {
          const n = cantieri.filter(c => c.fase === p.id).length;
          if (n === 0) return null;
          const sel = filterFase === p.id;
          return (
            <div key={p.id} onClick={() => setFilterFase(sel ? "tutte" : p.id)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
              background: sel ? (p.color || T.acc) + "12" : "transparent", color: sel ? p.color || T.acc : T.sub,
              border: `1px solid ${sel ? (p.color || T.acc) + "30" : T.bdr}`,
            }}>{p.nome} · {n}</div>
          );
        })}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Nessuna commessa</div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Modifica i filtri o crea una nuova commessa</div>
        </div>
      ) : cmView === "list" ? (
        <div style={{ margin: "0 20px", borderRadius: 12, border: `1px solid ${T.bdr}`, overflow: "hidden", background: T.card }}>
          {filtered.map(c => renderRow(c))}
        </div>
      ) : (
        <div style={isDesktop ? { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 20px" } : isTablet ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px" } : { padding: "0 0px" }}>
          {filtered.map(c => renderCard(c, isTablet || isDesktop))}
        </div>
      )}
    </div>
  );
}
