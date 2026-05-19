"use client"
// components/materiali/OrdineDetailMobile.tsx
// Dettaglio ordine con righe + check arrivo + foto bolla + timeline
import React, { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1F33", BG = "#EEF8F8"
const TEAL = "#28A0A0", AMBER = "#BA7517", GREEN = "#0F6E56", RED = "#C73E1D"
const TEXT = "#0F1F33", MUTED = "#5C6B7A", BORDER = "#E5EAF0"

export default function OrdineDetailMobile({ ordine, onBack, onReload }: any) {
  const [righe, setRighe] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"righe" | "tracking" | "foto" | "note">("righe")

  useEffect(() => { caricaRighe() }, [ordine?.id])

  async function caricaRighe() {
    if (!ordine?.id) return
    setLoading(true)
    const { data } = await supabase.from("righe_ordine").select("*").eq("ordine_id", ordine.id).order("riga_numero")
    setRighe(data || [])
    setLoading(false)
  }

  async function toggleRicevuta(riga: any) {
    const nuova = riga.qta_ricevuta && riga.qta_ricevuta > 0 ? 0 : (riga.qta_richiesta || riga.qta_confermata || 1)
    await supabase.from("righe_ordine").update({ qta_ricevuta: nuova, data_ricevuta: nuova > 0 ? new Date().toISOString() : null, stato: nuova > 0 ? "ricevuto" : "in_attesa" }).eq("id", riga.id)
    caricaRighe()
  }

  async function confermaCompleto() {
    if (!confirm(`Confermi che l'ordine ${ordine.numero || ordine.id} è arrivato completo?\n\nIl magazzino verrà caricato automaticamente.`)) return
    await supabase.from("ordini_fornitore").update({ stato: "arrivato", data_ricezione: new Date().toISOString() }).eq("id", ordine.id)
    alert("Ordine confermato. Magazzino aggiornato.")
    onReload?.()
    onBack()
  }

  if (!ordine) return null

  const totale = Number(ordine.totale_euro || ordine.totale_stimato || 0)
  const righeOk = righe.filter(r => r.qta_ricevuta && r.qta_ricevuta > 0).length
  const righeTot = righe.length

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, padding: "14px 16px 22px", borderRadius: "0 0 22px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.12)", color: "#FFF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1, color: "#FFF", fontSize: 13, fontWeight: 500 }}>Dettaglio ordine</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: 1, fontWeight: 600 }}>#{ordine.numero || ordine.id?.slice(0, 8)} \u00b7 {String(ordine.tipo_acquisto || "componenti").toUpperCase()}</div>
        <div style={{ color: "#FFF", fontSize: 22, fontWeight: 500, marginTop: 4 }}>{ordine.fornitore || "Fornitore"}</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 }}>{ordine.categoria_materiale || ordine.tipo_ordine || "Materiali"} \u00b7 {totale >= 1000 ? `${(totale/1000).toFixed(1)}k\u20ac` : `${Math.round(totale)}\u20ac`}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
          <Stat label="RIGHE" val={`${righeTot} / ${righeTot}`} />
          <Stat label="ARRIVATE" val={`${righeOk} / ${righeTot}`} warn={righeOk < righeTot} />
          <Stat label="STATO" val={(ordine.stato || "bozza").toUpperCase().slice(0, 8)} />
        </div>
      </div>

      {/* Sub-tab */}
      <div style={{ background: "#FFF", margin: "-14px 14px 0", padding: 4, borderRadius: 12, display: "flex", gap: 2, boxShadow: "0 4px 14px rgba(15,31,51,0.1)", position: "relative", zIndex: 5 }}>
        {(["righe", "tracking", "foto", "note"] as const).map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ flex: 1, textAlign: "center", padding: "8px 0", fontSize: 11, fontWeight: 600, color: tab === t ? "#FFF" : MUTED, background: tab === t ? NAVY : "transparent", borderRadius: 8, cursor: "pointer", textTransform: "capitalize" }}>{t}</div>
        ))}
      </div>

      {/* Content */}
      {tab === "righe" && (
        <div style={{ margin: "14px", background: "#FFF", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, letterSpacing: 0.5 }}>CONTROLLO ARRIVO \u00b7 {righeOk}/{righeTot}</span>
          </div>
          {loading ? <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 12 }}>Caricamento...</div> : null}
          {!loading && righe.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 12 }}>Nessuna riga</div> : null}
          {righe.map((r, i) => (
            <RigaCheck key={r.id} riga={r} ultimo={i === righe.length - 1} onToggle={() => toggleRicevuta(r)} />
          ))}
        </div>
      )}

      {tab === "tracking" && (
        <div style={{ margin: "14px", background: "#FFF", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 10 }}>TIMELINE</div>
          <Timeline ordine={ordine} />
        </div>
      )}

      {tab === "foto" && (
        <div style={{ margin: "14px", background: "#FFF", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 10 }}>FOTO BOLLA</div>
          <div style={{ aspectRatio: "1", background: BG, border: `2px dashed #C8E4E4`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: TEAL, cursor: "pointer", maxWidth: 200, margin: "0 auto" }}>
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx={12} cy={13} r={4}/></svg>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8, color: TEXT }}>Scatta foto bolla</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>fliwoX legge e flagga</div>
          </div>
        </div>
      )}

      {tab === "note" && (
        <div style={{ margin: "14px", background: "#FFF", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 10 }}>NOTE</div>
          <div style={{ fontSize: 12, color: ordine.note ? TEXT : MUTED, lineHeight: 1.5, fontStyle: ordine.note ? "normal" : "italic" }}>{ordine.note || "Nessuna nota"}</div>
        </div>
      )}

      {/* CTA fondo */}
      {righeOk === righeTot && righeTot > 0 && ordine.stato !== "arrivato" && ordine.stato !== "completato" ? (
        <button onClick={confermaCompleto} style={{ position: "fixed", bottom: 80, left: 14, right: 14, padding: 14, background: TEAL, color: "#FFF", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(40,160,160,0.3)", zIndex: 100 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
          CONFERMA ORDINE COMPLETO
        </button>
      ) : null}
    </div>
  )
}

function Stat({ label, val, warn }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px" }}>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
      <div style={{ color: warn ? "#FBBF24" : "#FFF", fontSize: 13, fontWeight: 600, marginTop: 3 }}>{val}</div>
    </div>
  )
}

function RigaCheck({ riga, ultimo, onToggle }: any) {
  const ricevuta = riga.qta_ricevuta && riga.qta_ricevuta > 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: ultimo ? "none" : `1px solid #F1F4F7` }}>
      <button onClick={onToggle} style={{ width: 26, height: 26, borderRadius: 6, border: ricevuta ? `2px solid ${GREEN}` : "2px solid #C8D2DA", background: ricevuta ? GREEN : "#FFF", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
        {ricevuta ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg> : null}
      </button>
      <div style={{ flex: 1, minWidth: 0, opacity: ricevuta ? 0.5 : 1 }}>
        <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, textDecoration: ricevuta ? "line-through" : "none" }}>{riga.descrizione || riga.codice_interno || "Articolo"}</div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
          {riga.vano_nome ? <span style={{ background: "#EEF8F8", color: "#0F4F4F", fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 600, marginRight: 4 }}>{riga.vano_nome}</span> : null}
          {riga.lunghezza_mm ? `${riga.lunghezza_mm}\u00d7${riga.altezza_mm || "?"} mm` : null}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, fontVariantNumeric: "tabular-nums" }}>{riga.qta_richiesta || 1} {riga.codice_fornitore?.includes("mq") ? "mq" : "pz"}</div>
    </div>
  )
}

function Timeline({ ordine }: any) {
  const eventi = [
    { lbl: "Creato", ts: ordine.created_at, done: true },
    { lbl: "Inviato al fornitore", ts: ordine.data_invio, done: !!ordine.data_invio },
    { lbl: "Confermato fornitore", ts: ordine.consegna_confermata, done: !!ordine.consegna_confermata },
    { lbl: "Consegna prevista", ts: ordine.consegna_prevista, done: false, eta: true },
    { lbl: "Arrivato", ts: ordine.data_ricezione, done: !!ordine.data_ricezione },
  ]
  return (
    <>
      {eventi.map((e, i) => {
        const tsfmt = e.ts ? new Date(e.ts).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null
        return (
          <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: e.done ? GREEN : (e.eta ? AMBER : "#C8D2DA"), border: "2px solid #FFF", boxShadow: e.done ? `0 0 0 1px ${GREEN}` : (e.eta ? `0 0 0 1px ${AMBER}` : "0 0 0 1px #C8D2DA") }}/>
              {i < eventi.length - 1 ? <div style={{ width: 2, flex: 1, background: e.done ? GREEN : "#E5EAF0", marginTop: 2, minHeight: 14 }}/> : null}
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{e.lbl}</div>
              {tsfmt ? <div style={{ fontSize: 10, color: e.eta ? AMBER : MUTED, marginTop: 2, fontWeight: e.eta ? 600 : 400 }}>{tsfmt}</div> : null}
            </div>
          </div>
        )
      })}
    </>
  )
}
