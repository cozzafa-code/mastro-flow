"use client"
// components/materiali/MagazzinoMobile.tsx
// Lista magazzino + sotto-scorta + ultimi movimenti
import React from "react"

const NAVY = "#1E3A5F", TEAL = "#28A0A0", BG = "#EEF8F8"
const AMBER = "#BA7517", GREEN = "#0F6E56", RED = "#C73E1D"
const TEXT = "#0F1F33", MUTED = "#5C6B7A", BORDER = "#E5EAF0"

export default function MagazzinoMobile({ magazzino, movimenti, stats, onReload }: any) {
  const sottoScorta = magazzino.filter((a: any) => Number(a.qta_disponibile || 0) < Number(a.qta_minima || 0))
  const ok = magazzino.filter((a: any) => Number(a.qta_disponibile || 0) >= Number(a.qta_minima || 0))
  const valLabel = stats.valoreMagazzino >= 1000 ? `${(stats.valoreMagazzino/1000).toFixed(1)}k\u20ac` : `${Math.round(stats.valoreMagazzino)}\u20ac`

  return (
    <div style={{ padding: "14px 0 0" }}>

      {/* AI Riordino */}
      {sottoScorta.length > 0 ? (
        <div style={{ margin: "0 14px 12px", background: `linear-gradient(135deg, ${TEAL} 0%, #1B6B6B 100%)`, color: "#FFF", borderRadius: 12, padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, opacity: 0.85, letterSpacing: 1, fontWeight: 700 }}>RIORDINO CONSIGLIATO</div>
            <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>{sottoScorta.length} articoli sotto-scorta. Auto-ordine ai fornitori?</div>
          </div>
        </div>
      ) : null}

      {/* Sotto-scorta */}
      {sottoScorta.length > 0 ? (
        <div style={{ margin: "0 14px 14px", background: "#FFF", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, letterSpacing: 0.5 }}>SOTTO-SCORTA \u00b7 {sottoScorta.length}</span>
            <span style={{ fontSize: 10, color: TEAL, fontWeight: 600, cursor: "pointer" }}>RIORDINA TUTTI</span>
          </div>
          {sottoScorta.map((a: any, i: number) => <ArticoloSotto key={a.id} art={a} ultimo={i === sottoScorta.length - 1} />)}
        </div>
      ) : null}

      {/* Ultimi movimenti */}
      {movimenti.length > 0 ? (
        <div style={{ margin: "0 14px 14px", background: "#FFF", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, letterSpacing: 0.5 }}>ULTIMI MOVIMENTI</span>
            <span style={{ fontSize: 10, color: TEAL, fontWeight: 600 }}>STORICO</span>
          </div>
          {movimenti.slice(0, 6).map((m: any, i: number) => <MovimentoRow key={m.id} mov={m} ultimo={i === Math.min(5, movimenti.length - 1)} />)}
        </div>
      ) : null}

      {/* Articoli OK */}
      {ok.length > 0 ? (
        <div style={{ margin: "0 14px 14px", background: "#FFF", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, letterSpacing: 0.5 }}>DISPONIBILI \u00b7 {ok.length}</span>
            <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>val. {valLabel}</span>
          </div>
          {ok.slice(0, 8).map((a: any, i: number) => <ArticoloOk key={a.id} art={a} ultimo={i === Math.min(7, ok.length - 1)} />)}
        </div>
      ) : null}

    </div>
  )
}

function ArticoloSotto({ art, ultimo }: any) {
  const qta = Number(art.qta_disponibile || 0)
  const min = Number(art.qta_minima || 0)
  const pct = min > 0 ? Math.min(100, (qta / min) * 100) : 0
  const colore = pct < 30 ? RED : AMBER

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: ultimo ? "none" : `1px solid #F1F4F7` }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: BG, color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{art.nome}</div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Min: {min} \u00b7 {art.fornitore_principale || "fornitore"}</div>
        <div style={{ height: 3, background: "#F1F4F7", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: colore, borderRadius: 2 }}/>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colore, fontVariantNumeric: "tabular-nums" }}>{qta}</div>
        <div style={{ fontSize: 9, color: MUTED }}>{art.unita || "pz"}</div>
      </div>
    </div>
  )
}

function ArticoloOk({ art, ultimo }: any) {
  const qta = Number(art.qta_disponibile || 0)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: ultimo ? "none" : `1px solid #F1F4F7` }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: BG, color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: TEXT, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{art.nome}</div>
        <div style={{ fontSize: 9, color: MUTED }}>{art.fornitore_principale || "—"}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{qta} <span style={{ fontSize: 9, color: MUTED, fontWeight: 400 }}>{art.unita || "pz"}</span></div>
    </div>
  )
}

function MovimentoRow({ mov, ultimo }: any) {
  const carico = mov.tipo === "carico"
  const tsfmt = mov.created_at ? new Date(mov.created_at).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: ultimo ? "none" : `1px solid #F1F4F7` }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: carico ? "#D1FAE5" : "#FEE2E2", color: carico ? GREEN : "#991B1B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>{carico ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></> : <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>}</svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>{carico ? "+" : "−"}{Math.abs(Number(mov.quantita || 0))} \u00b7 {mov.causale || mov.tipo}</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{tsfmt}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: carico ? GREEN : "#991B1B", fontVariantNumeric: "tabular-nums" }}>{carico ? "+" : "−"}{Math.abs(Number(mov.quantita || 0))}</div>
    </div>
  )
}
