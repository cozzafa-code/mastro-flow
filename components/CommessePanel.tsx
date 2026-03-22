"use client";
// @ts-nocheck
// MASTRO ERP — CommessePanel v4 — Design moderno
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";
import RilieviListPanel from "./RilieviListPanel";
import CMDetailPanel from "./CMDetailPanel";
import VanoSectorRouter from "./VanoSectorRouter";
import RiepilogoPanel from "./RiepilogoPanel";

export default function CommessePanel() {
  const {
    T, isDesktop, isTablet, PIPELINE,
    cantieri, filtered, selectedCM, setSelectedCM, selectedRilievo, selectedVano,
    showRiepilogo, cmView, setCmView, filterFase, setFilterFase,
    searchQ, setSearchQ, setShowModal, setTab,
    getVaniAttivi, giorniFermaCM, sogliaDays,
  } = useMastro();

  const TODAY = new Date().toISOString().split("T")[0];
  const [sortBy, setSortBy] = React.useState("default"); // "default" | "nome" | "data" | "euro"
  const fmtEuro = (n: number) => n > 0 ? "€" + n.toLocaleString("it-IT", { maximumFractionDigits: 0 }) : "";
  const fmtData = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "";
  const initials = (c: any) => ((c.cliente || "?").charAt(0) + (c.cognome || "").charAt(0)).toUpperCase();

  const getFaseInfo = (c: any) => PIPELINE.find(p => p.id === c.fase) || { nome: c.fase, color: T.acc };
  const getProgress = (c: any) => {
    const idx = PIPELINE.findIndex(p => p.id === c.fase);
    return idx >= 0 ? Math.round((idx + 1) / PIPELINE.length * 100) : 0;
  };
  const isFerma = (c: any) => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura";
  const isScaduta = (c: any) => c.scadenza && c.scadenza < TODAY;

  // ── CARD VIEW ──
  const renderCard = (c: any) => {
    const fase = getFaseInfo(c);
    const prog = getProgress(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const vaniA = getVaniAttivi(c);
    const vaniOk = vaniA.filter(v => Object.values(v.misure || {}).filter((x: any) => x > 0).length >= 6).length;
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;

    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{
          background: T.card, borderRadius: 16, padding: "16px 16px 14px",
          border: `1.5px solid ${alert ? T.red + "40" : T.bdr}`,
          cursor: "pointer", position: "relative", overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.15s",
        }}>

        {/* Striscia fase in alto */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: alert ? T.red : fase.color || T.acc, borderRadius: "16px 16px 0 0" }} />

        {/* Header: avatar + codice + alert */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: alert ? T.red + "18" : (fase.color || T.acc) + "18",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: alert ? T.red : fase.color || T.acc,
          }}>{initials(c)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.cliente}{c.cognome ? " " + c.cognome : ""}
            </div>
            <div style={{ fontSize: 11, color: T.sub, fontFamily: FM, marginTop: 2 }}>{c.code}</div>
          </div>
          {alert && (
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.red, flexShrink: 0, marginTop: 4 }} />
          )}
        </div>

        {/* Indirizzo */}
        {c.indirizzo && (
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {c.indirizzo}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: 4, background: T.bg, borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: prog + "%", background: alert ? T.red : fase.color || T.acc, borderRadius: 2, transition: "width 0.3s" }} />
        </div>

        {/* Footer: fase + vani + euro */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ padding: "3px 8px", borderRadius: 6, background: (alert ? T.red : fase.color || T.acc) + "15", fontSize: 10, fontWeight: 700, color: alert ? T.red : fase.color || T.acc }}>
              {ferma ? `Ferma ${giorniFermaCM(c)}gg` : scad ? "Scaduta" : fase.nome}
            </div>
            {vaniA.length > 0 && (
              <div style={{ fontSize: 10, color: T.sub }}>{vaniOk}/{vaniA.length} vani</div>
            )}
          </div>
          {euroVal > 0 && (
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, fontFamily: FM }}>{fmtEuro(euroVal)}</div>
          )}
        </div>
      </div>
    );
  };

  // ── LIST VIEW ──
  const renderRow = (c: any) => {
    const fase = getFaseInfo(c);
    const prog = getProgress(c);
    const ferma = isFerma(c);
    const scad = isScaduta(c);
    const alert = ferma || scad;
    const euroVal = c.euro ? parseFloat(c.euro) : 0;
    const vaniA = getVaniAttivi(c);

    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", borderBottom: `1px solid ${T.bdr}`, position: "relative" }}>

        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: alert ? T.red + "18" : (fase.color || T.acc) + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: alert ? T.red : fase.color || T.acc,
        }}>{initials(c)}</div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
              {c.cliente}{c.cognome ? " " + c.cognome : ""}
            </span>
            <span style={{ fontSize: 10, color: T.sub, fontFamily: FM, flexShrink: 0 }}>{c.code}</span>
            {alert && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, flexShrink: 0 }} />}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: alert ? T.red : fase.color || T.acc }}>
              {ferma ? `Ferma ${giorniFermaCM(c)}gg` : scad ? "Scaduta" : fase.nome}
            </span>
            {vaniA.length > 0 && <span style={{ fontSize: 10, color: T.sub }}>{vaniA.length} vani</span>}
            {c.scadenza && !scad && <span style={{ fontSize: 10, color: T.sub }}>{fmtData(c.scadenza)}</span>}
          </div>
          {/* Mini progress */}
          <div style={{ height: 2, background: T.bg, borderRadius: 1, marginTop: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", width: prog + "%", background: alert ? T.red : fase.color || T.acc, borderRadius: 1 }} />
          </div>
        </div>

        {/* Right */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {euroVal > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: T.text, fontFamily: FM }}>{fmtEuro(euroVal)}</div>}
          <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{prog}%</div>
        </div>
      </div>
    );
  };

  // ── ROUTING ──
  if (showRiepilogo && selectedCM) return <RiepilogoPanel />;
  if (selectedVano) return <VanoSectorRouter />;
  if (selectedRilievo) return <CMDetailPanel />;
  if (selectedCM) return <RilieviListPanel />;

  const fermeCount = cantieri.filter(c => isFerma(c)).length;

  // Totale euro commesse filtrate
  const totaleEuro = filtered.reduce((sum, c) => sum + (c.euro ? parseFloat(c.euro) : 0), 0);

  // Sort
  const filteredSorted = [...filtered].sort((a, b) => {
    if (sortBy === "nome") return (a.cliente || "").localeCompare(b.cliente || "");
    if (sortBy === "euro") return (parseFloat(b.euro) || 0) - (parseFloat(a.euro) || 0);
    if (sortBy === "data") return (b.aggiornato || "").localeCompare(a.aggiornato || "");
    return 0;
  });

  return (
    <div style={{ paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: "-0.03em" }}>Commesse</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
            <span style={{ fontSize: 12, color: T.sub }}>{cantieri.length} totali</span>
            {fermeCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: T.red + "12", padding: "2px 7px", borderRadius: 6 }}>
                {fermeCount} ferme
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Toggle view */}
          <div style={{ display: "flex", background: T.bg, borderRadius: 10, padding: 3, border: `1px solid ${T.bdr}`, gap: 2 }}>
            <div onClick={() => setCmView("list")} style={{ width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: cmView === "list" ? T.card : "transparent", boxShadow: cmView === "list" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cmView === "list" ? T.text : T.sub} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </div>
            <div onClick={() => setCmView("card")} style={{ width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: cmView === "card" ? T.card : "transparent", boxShadow: cmView === "card" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cmView === "card" ? T.text : T.sub} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </div>
          </div>
          {/* Nuova commessa */}
          <div onClick={() => setShowModal("commessa")} style={{ width: 36, height: 36, borderRadius: 10, background: T.acc, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 22, fontWeight: 300, lineHeight: 1 }}>+</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 20px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: T.text, outline: "none", fontFamily: FF }} placeholder="Cerca cliente, codice, indirizzo..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          {searchQ && <div onClick={() => setSearchQ("")} style={{ cursor: "pointer", fontSize: 16, color: T.sub, lineHeight: 1 }}>×</div>}
        </div>
      </div>

      {/* Chips fase */}
      <div style={{ display: "flex", gap: 6, padding: "0 20px 14px", overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
        {[{ id: "tutte", nome: "Tutte", color: T.text, count: cantieri.length },
          ...PIPELINE.filter(p => p.attiva).map(p => ({ ...p, count: cantieri.filter(c => c.fase === p.id).length })).filter(p => p.count > 0)
        ].map(p => {
          const sel = filterFase === p.id;
          return (
            <div key={p.id} onClick={() => setFilterFase(sel && p.id !== "tutte" ? "tutte" : p.id)} style={{
              padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as any,
              background: sel ? (p.color || T.text) + (p.id === "tutte" ? "" : "15") : "transparent",
              color: sel ? (p.id === "tutte" ? "#fff" : p.color || T.acc) : T.sub,
              border: `1.5px solid ${sel ? (p.color || T.text) + (p.id === "tutte" ? "" : "40") : T.bdr}`,
            }}>{p.nome} {p.count}</div>
          );
        })}
      </div>

      {/* Sort + Totale */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 10px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["default","Recenti"],["nome","Nome"],["euro","€"],["data","Data"]].map(([v,l]) => (
            <div key={v} onClick={() => setSortBy(v)} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: sortBy === v ? T.acc : T.bg,
              color: sortBy === v ? "#fff" : T.sub,
              border: `1px solid ${sortBy === v ? T.acc : T.bdr}`
            }}>{l}</div>
          ))}
        </div>
        {totaleEuro > 0 && (
          <div style={{ fontSize: 12, fontWeight: 800, color: T.text, fontFamily: FM }}>
            Tot: €{totaleEuro.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
          </div>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Nessuna commessa</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Modifica i filtri o crea una nuova commessa</div>
          <div onClick={() => setShowModal("commessa")} style={{ marginTop: 16, display: "inline-block", padding: "10px 20px", borderRadius: 10, background: T.acc, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Nuova commessa</div>
        </div>
      ) : cmView === "list" ? (
        <div style={{ margin: "0 20px", borderRadius: 14, border: `1px solid ${T.bdr}`, overflow: "hidden", background: T.card }}>
          {filteredSorted.map(c => renderRow(c))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : isTablet ? "1fr 1fr" : "1fr 1fr",
          gap: 10, padding: "0 20px"
        }}>
          {filteredSorted.map(c => renderCard(c))}
        </div>
      )}
    </div>
  );
}
