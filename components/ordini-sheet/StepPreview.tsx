"use client"
import React from "react"
const NAVY = "#1E3A5F", TEAL = "#28A0A0", AMBER = "#BA7517", TEXT = "#0F1F33", MUTED = "#5C6B7A"

export default function StepPreview({ ordini, onChange }: any) {
  const attivi = ordini.filter((o: any) => !o.saltato)
  const totale = attivi.reduce((s: number, o: any) => s + Number(o.totale_stimato || 0), 0)
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k\u20ac` : `${Math.round(n)}\u20ac`

  function toggleSalta(i: number) {
    const next = ordini.map((o: any, idx: number) => idx === i ? { ...o, saltato: !o.saltato } : o)
    onChange(next)
  }

  return (
    <>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>REVISIONE PRIMA DELL'INVIO</div>
      <div style={{ fontSize: 20, color: TEXT, fontWeight: 500, marginBottom: 4 }}>{attivi.length} ordini pronti</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 14, lineHeight: 1.4 }}>Tap su "Salta" per escludere un ordine. Modifica le righe se serve.</div>

      <div style={{ background: `linear-gradient(135deg, ${TEAL}, #1B6B6B)`, color: "#FFF", borderRadius: 12, padding: 12, marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
        </div>
        <div style={{ flex: 1, fontSize: 11, lineHeight: 1.4 }}>
          <b>fliwoX:</b> distinta calcolata dai vani. Verifica le righe e procedi all'invio.
        </div>
      </div>

      {ordini.map((o: any, i: number) => (
        <div key={i} style={{ background: "#FFF", borderRadius: 14, marginBottom: 10, overflow: "hidden", border: "1px solid #E5EAF0", opacity: o.saltato ? 0.5 : 1 }}>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, background: "#F2FAFA", borderBottom: "1px solid #C8E4E4" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", color: NAVY, fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
              {String(o.fornitore_nome || "?").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: NAVY, fontWeight: 700, letterSpacing: 0.4 }}>{(o.categoria_materiale || "MATERIALI").replace(/_/g, " ")}</div>
              <div style={{ fontSize: 13, color: TEXT, fontWeight: 600, marginTop: 1 }}>{o.fornitore_nome}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontVariantNumeric: "tabular-nums" }}>{fmt(o.totale_stimato)}</div>
              <div style={{ fontSize: 9, color: MUTED }}>+ IVA</div>
            </div>
          </div>
          <div style={{ padding: "8px 14px" }}>
            {(o.righe || []).map((r: any, ri: number) => (
              <div key={ri} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: ri < o.righe.length - 1 ? "1px dashed #F1F4F7" : "none", fontSize: 11 }}>
                <span style={{ color: TEXT, flex: 1 }}>{r.descrizione}</span>
                <span style={{ color: MUTED, fontWeight: 600 }}>{r.qta_richiesta} pz</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 14px", borderTop: "1px solid #F1F4F7", display: "flex", gap: 6 }}>
            <div style={{ flex: 1, padding: 7, borderRadius: 8, background: "#F1F4F7", color: TEXT, fontSize: 10, fontWeight: 600, textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Modifica
            </div>
            <div style={{ flex: 1, padding: 7, borderRadius: 8, background: "#FEF3C7", color: "#92400E", fontSize: 10, fontWeight: 600, textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>PDF
            </div>
            <div onClick={() => toggleSalta(i)} style={{ flex: 1, padding: 7, borderRadius: 8, background: o.saltato ? "#D1FAE5" : "#FEE2E2", color: o.saltato ? "#065F46" : "#991B1B", fontSize: 10, fontWeight: 600, textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {o.saltato ? "Includi" : "Salta"}
            </div>
          </div>
        </div>
      ))}

      <div style={{ background: NAVY, color: "#FFF", borderRadius: 14, padding: 14, marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, opacity: 0.8 }}>
          <span>Ordini selezionati</span><span>{attivi.length} \u00b7 {ordini.length - attivi.length} saltati</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 6, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
          <span style={{ opacity: 0.85 }}>STIMA TOTALE</span><span style={{ fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{fmt(totale)}</span>
        </div>
      </div>
    </>
  )
}
