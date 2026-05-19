"use client"
// components/materiali/OrdiniListMobile.tsx
// Lista ordini con filtri + AI banner + card per stato
import React, { useState, useMemo } from "react"

const NAVY = "#1E3A5F", TEAL = "#28A0A0", RED = "#C73E1D", AMBER = "#BA7517", GREEN = "#0F6E56"
const TEXT = "#0F1F33", MUTED = "#5C6B7A", BORDER = "#E5EAF0"

type Filter = "tutti" | "bozza" | "inviato" | "transito" | "arrivato"

const STATO_LABEL: Record<string, string> = {
  bozza: "Bozza", inviato: "Inviato", confermato: "Confermato",
  in_transito: "In transito", spedito: "Spedito",
  arrivato: "Arrivato", completato: "Completato",
  annullato: "Annullato",
}

const STATO_COLORE: Record<string, string> = {
  bozza: "#5C6B7A", inviato: "#1E3A5F", confermato: "#28A0A0",
  in_transito: "#BA7517", spedito: "#BA7517",
  arrivato: "#0F6E56", completato: "#0F6E56",
  annullato: "#991B1B",
}

export default function OrdiniListMobile({ ordini, stats, onTapOrdine, onReload }: any) {
  const [filter, setFilter] = useState<Filter>("tutti")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    let out = ordini
    if (filter === "bozza") out = out.filter((o: any) => o.stato === "bozza" || (!o.data_invio && o.stato !== "annullato"))
    else if (filter === "inviato") out = out.filter((o: any) => o.data_invio && !o.data_ricezione && o.stato !== "annullato" && o.stato !== "in_transito" && o.stato !== "spedito")
    else if (filter === "transito") out = out.filter((o: any) => o.stato === "in_transito" || o.stato === "spedito")
    else if (filter === "arrivato") out = out.filter((o: any) => o.stato === "arrivato" || o.stato === "completato")
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      out = out.filter((o: any) => 
        String(o.fornitore || "").toLowerCase().includes(q) ||
        String(o.numero || "").toLowerCase().includes(q) ||
        String(o.tipo_ordine || "").toLowerCase().includes(q)
      )
    }
    return out
  }, [ordini, filter, search])

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k\u20ac` : `${Math.round(n)}\u20ac`

  return (
    <div style={{ padding: "14px 0 0" }}>

      {/* AI Banner */}
      {stats.inRitardo > 0 ? (
        <div style={{ margin: "0 14px 12px", background: `linear-gradient(135deg, ${TEAL} 0%, #1B6B6B 100%)`, color: "#FFF", borderRadius: 12, padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, opacity: 0.85, letterSpacing: 1, fontWeight: 700 }}>fliwoX SUGGERISCE</div>
            <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2, lineHeight: 1.3 }}>{stats.inRitardo} ordini in ritardo. Sollecita i fornitori.</div>
          </div>
        </div>
      ) : null}

      {/* Search bar */}
      <div style={{ margin: "0 14px 10px", background: "#FFF", borderRadius: 11, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><circle cx={11} cy={11} r={8}/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca fornitore, numero..." style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: TEXT, background: "transparent" }} />
      </div>

      {/* Filtri tab */}
      <div style={{ margin: "0 14px 10px", display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
        {([
          ["tutti", "Tutti", stats.totali],
          ["bozza", "Bozza", stats.daInviare],
          ["inviato", "Inviati", stats.inviati],
          ["transito", "Transito", stats.inTransito],
          ["arrivato", "Arrivati", stats.arrivati],
        ] as [Filter, string, number][]).map(([k, lbl, n]) => (
          <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)} count={n}>{lbl}</FilterChip>
        ))}
      </div>

      {/* Lista ordini */}
      <div style={{ padding: "0 14px" }}>
        {filtered.length === 0 ? (
          <div style={{ background: "#FFF", borderRadius: 12, padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>Nessun ordine</div>
        ) : (
          filtered.map((o: any) => <OrdineCard key={o.id} ordine={o} onClick={() => onTapOrdine(o.id)} fmt={fmt} />)
        )}
      </div>

    </div>
  )
}

function FilterChip({ active, onClick, count, children }: any) {
  return (
    <div onClick={onClick} style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 16, background: active ? NAVY : "#FFF", color: active ? "#FFF" : MUTED, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, border: active ? "none" : `1px solid ${BORDER}` }}>
      <span>{children}</span>
      {count != null ? <span style={{ background: active ? "rgba(255,255,255,0.2)" : "#F1F4F7", fontSize: 9, padding: "1px 5px", borderRadius: 5, fontWeight: 700 }}>{count}</span> : null}
    </div>
  )
}

function OrdineCard({ ordine, onClick, fmt }: any) {
  const stato = ordine.stato || "bozza"
  const colore = STATO_COLORE[stato] || MUTED
  const lbl = STATO_LABEL[stato] || stato
  const fornInit = String(ordine.fornitore || "?").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()
  const totale = Number(ordine.totale_euro || ordine.totale_stimato || 0)
  const cp = ordine.consegna_prevista ? new Date(ordine.consegna_prevista) : null
  const inRitardo = cp && cp.getTime() < Date.now() && stato !== "completato" && stato !== "annullato"

  return (
    <div onClick={onClick} style={{ background: "#FFF", borderRadius: 12, padding: 12, marginBottom: 8, cursor: "pointer", borderLeft: `3px solid ${colore}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#F1F4F7", color: NAVY, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{fornInit}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>#{ordine.numero || ordine.id?.slice(0, 8)}</span>
            <span style={{ fontSize: 8, color: "#FFF", background: ordine.tipo_acquisto === "prodotto_finito" ? NAVY : AMBER, padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: 0.4 }}>{ordine.tipo_acquisto === "prodotto_finito" ? "FINITO" : (ordine.categoria_materiale || ordine.tipo_ordine || "MATERIALI").toString().toUpperCase().slice(0, 12)}</span>
          </div>
          <div style={{ fontSize: 12, color: TEXT, fontWeight: 500, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ordine.fornitore || "Fornitore"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, color: colore, fontWeight: 700, letterSpacing: 0.3 }}>{lbl.toUpperCase()}</span>
            {cp ? <span style={{ fontSize: 9, color: inRitardo ? "#991B1B" : MUTED, fontWeight: 600 }}>\u00b7 {inRitardo ? "RITARDO" : `consegna ${cp.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`}</span> : null}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontVariantNumeric: "tabular-nums" }}>{fmt(totale)}</div>
          {ordine.urgente ? <span style={{ fontSize: 8, color: "#FFF", background: RED, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>URG</span> : null}
        </div>
      </div>
    </div>
  )
}
