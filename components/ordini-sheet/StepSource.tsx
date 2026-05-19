"use client"
import React from "react"
const NAVY = "#1E3A5F", TEAL = "#28A0A0", BG = "#EEF8F8", TEXT = "#0F1F33", MUTED = "#5C6B7A"

export default function StepSource({ source, onChange, commessa }: any) {
  const numVani = commessa?.rilievi?.flatMap((r: any) => r.vani || []).length || (commessa?.vaniCount || 0)
  return (
    <>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>DA DOVE PARTE L'ORDINE?</div>
      <div style={{ fontSize: 20, color: TEXT, fontWeight: 500, lineHeight: 1.2, marginBottom: 4 }}>Cosa stai ordinando?</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 14, lineHeight: 1.4 }}>fliwoX prepara la distinta. Tu confermi.</div>
      <Opt active={source === "commessa"} onClick={() => onChange("commessa")} icon="bag" title="Distinta da commessa" desc={`fliwoX legge i ${numVani} vani della commessa.`} tag="CONSIGLIATO" />
      <Opt active={source === "foto"} onClick={() => onChange("foto")} icon="cam" title="Singolo articolo \u00b7 foto" desc="Foto, fliwoX riconosce, tu aggiungi qty." tag="VISIONE AI" />
      <Opt active={source === "listino"} onClick={() => onChange("listino")} icon="list" title="Manuale dal listino" desc="Cerca articoli dal catalogo fornitore." />
      <Opt active={source === "voce"} onClick={() => onChange("voce")} icon="mic" title="Detta a voce" desc="Parla al telefono, fliwoX scrive l'ordine." tag="VOICE AI" />
    </>
  )
}

function Opt({ active, onClick, icon, title, desc, tag }: any) {
  return (
    <div onClick={onClick} style={{ background: active ? "#F2FAFA" : "#FFF", border: active ? `2px solid ${TEAL}` : "2px solid transparent", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: active ? TEAL : BG, color: active ? "#FFF" : NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ico name={icon} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: TEXT, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
          {tag ? <div style={{ display: "inline-block", fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, marginTop: 6, background: TEAL, color: "#FFF" }}>{tag}</div> : null}
        </div>
        <div style={{ width: 22, height: 22, borderRadius: 50, border: active ? `2px solid ${TEAL}` : "2px solid #C8D2DA", background: active ? TEAL : "transparent", flexShrink: 0, marginTop: 4, position: "relative" }}>
          {active ? <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 8, height: 8, background: "#FFF", borderRadius: 50 }}/> : null}
        </div>
      </div>
    </div>
  )
}

function Ico({ name }: any) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as any
  if (name === "bag") return <svg {...p}><rect x={2} y={7} width={20} height={14} rx={2}/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  if (name === "cam") return <svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx={12} cy={13} r={4}/></svg>
  if (name === "list") return <svg {...p}><line x1={8} y1={6} x2={21} y2={6}/><line x1={8} y1={12} x2={21} y2={12}/><line x1={8} y1={18} x2={21} y2={18}/><line x1={3} y1={6} x2={3.01} y2={6}/><line x1={3} y1={12} x2={3.01} y2={12}/><line x1={3} y1={18} x2={3.01} y2={18}/></svg>
  if (name === "mic") return <svg {...p}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1={12} y1={19} x2={12} y2={23}/></svg>
  return null
}
