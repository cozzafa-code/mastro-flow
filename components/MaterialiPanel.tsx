"use client"
// components/MaterialiPanel.tsx
// Container sezione MATERIALI con 2 sub-tab Ordini + Magazzino
import React, { useState } from "react"
import { useMateriali } from "../hooks/useMateriali"
import OrdiniListMobile from "./materiali/OrdiniListMobile"
import MagazzinoMobile from "./materiali/MagazzinoMobile"
import OrdineDetailMobile from "./materiali/OrdineDetailMobile"

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1F33", BG = "#EEF8F8"
const TEAL = "#28A0A0", TEXT = "#0F1F33", MUTED = "#5C6B7A"

type SubTab = "ordini" | "magazzino"

export default function MaterialiPanel({ onBack }: any) {
  const [subTab, setSubTab] = useState<SubTab>("ordini")
  const [ordineDetailId, setOrdineDetailId] = useState<string | null>(null)
  const { ordini, magazzino, movimenti, stats, loading, error, reload } = useMateriali()

  // Vista dettaglio ordine
  if (ordineDetailId) {
    const ord = ordini.find(o => o.id === ordineDetailId)
    return (
      <OrdineDetailMobile
        ordine={ord}
        onBack={() => setOrdineDetailId(null)}
        onReload={reload}
      />
    )
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 110 }}>

      {/* Header navy fliwoX */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, padding: "14px 16px 22px", borderRadius: "0 0 22px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.12)", color: "#FFF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, letterSpacing: 1.2, fontWeight: 600 }}>GESTIONE MATERIALI</div>
            <div style={{ color: "#FFF", fontSize: 18, fontWeight: 600, marginTop: 2 }}>Ordini & Magazzino</div>
          </div>
        </div>

        {/* Stats riepilogo */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <Stat label="ATTIVI" val={stats.totali} sub={`${stats.daInviare} bozze`} />
          <Stat label="IN TRANSITO" val={stats.inTransito} sub={stats.inRitardo > 0 ? `${stats.inRitardo} in ritardo` : "tutto ok"} warn={stats.inRitardo > 0} />
          <Stat label="SOTTO-SCORTA" val={stats.sottoScorta} sub={stats.sottoScorta > 0 ? "riordina" : "ok"} warn={stats.sottoScorta > 0} />
        </div>
      </div>

      {/* Sub-tab Ordini / Magazzino */}
      <div style={{ background: "#FFF", margin: "-14px 14px 0", padding: 4, borderRadius: 12, display: "flex", gap: 2, boxShadow: "0 4px 14px rgba(15,31,51,0.1)", position: "relative", zIndex: 5 }}>
        <Tab active={subTab === "ordini"} onClick={() => setSubTab("ordini")} count={stats.totali}>Ordini</Tab>
        <Tab active={subTab === "magazzino"} onClick={() => setSubTab("magazzino")} count={magazzino.length}>Magazzino</Tab>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 12 }}>Caricamento...</div>
      ) : error ? (
        <div style={{ margin: 14, padding: 14, background: "#FEE2E2", color: "#991B1B", borderRadius: 10, fontSize: 12 }}>{error}</div>
      ) : subTab === "ordini" ? (
        <OrdiniListMobile ordini={ordini} stats={stats} onTapOrdine={(id: string) => setOrdineDetailId(id)} onReload={reload} />
      ) : (
        <MagazzinoMobile magazzino={magazzino} movimenti={movimenti} stats={stats} onReload={reload} />
      )}
    </div>
  )
}

function Stat({ label, val, sub, warn }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px" }}>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
      <div style={{ color: warn ? "#FBBF24" : "#FFF", fontSize: 18, fontWeight: 700, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{val}</div>
      <div style={{ color: warn ? "#FBBF24" : "rgba(255,255,255,0.6)", fontSize: 9, marginTop: 1 }}>{sub}</div>
    </div>
  )
}

function Tab({ active, onClick, count, children }: any) {
  return (
    <div onClick={onClick} style={{ flex: 1, textAlign: "center", padding: "9px 0", fontSize: 12, fontWeight: 600, color: active ? "#FFF" : MUTED, background: active ? NAVY : "transparent", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <span>{children}</span>
      {count != null ? <span style={{ background: active ? "rgba(255,255,255,0.2)" : "#F1F4F7", color: active ? "#FFF" : MUTED, fontSize: 9, padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>{count}</span> : null}
    </div>
  )
}
