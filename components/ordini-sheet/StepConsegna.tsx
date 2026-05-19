"use client"
import React from "react"
const NAVY = "#1E3A5F", TEAL = "#28A0A0", BG = "#EEF8F8", TEXT = "#0F1F33", MUTED = "#5C6B7A"

export default function StepConsegna({ consegnaTipo, onConsegnaTipo, indirizzo, onIndirizzo, canale, onCanale, ordini, commessa }: any) {
  const attivi = ordini.filter((o: any) => !o.saltato)
  const totale = attivi.reduce((s: number, o: any) => s + Number(o.totale_stimato || 0), 0)
  const totaleIva = totale * 1.22
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k\u20ac` : `${Math.round(n)}\u20ac`

  return (
    <>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>DOVE CONSEGNAMO?</div>
      <div style={{ fontSize: 20, color: TEXT, fontWeight: 500, marginBottom: 14 }}>Indirizzo consegna</div>

      <ConsegnaOpt active={consegnaTipo === "magazzino"} onClick={() => onConsegnaTipo("magazzino")} icon="warehouse" title="Magazzino" desc="Sede operativa azienda" tag="DEFAULT" />
      <ConsegnaOpt active={consegnaTipo === "cantiere"} onClick={() => onConsegnaTipo("cantiere")} icon="home" title={`Cantiere \u00b7 ${commessa?.code || ""}`} desc={commessa?.indirizzo || "Indirizzo cliente"} tag="CONSIGLIATO" />
      <ConsegnaOpt active={consegnaTipo === "officina"} onClick={() => onConsegnaTipo("officina")} icon="tool" title="Officina produzione" desc="Solo lavorazioni" />
      <ConsegnaOpt active={consegnaTipo === "custom"} onClick={() => onConsegnaTipo("custom")} icon="pin" title="Indirizzo personalizzato" desc="Inserisci nuovo indirizzo" />

      {consegnaTipo === "custom" ? (
        <input type="text" value={indirizzo} onChange={e => onIndirizzo(e.target.value)} placeholder="Via, numero, citta" style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #C8D2DA", marginTop: -4, marginBottom: 14, fontSize: 12, outline: "none" }} />
      ) : null}

      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1.2, fontWeight: 700, marginTop: 8, marginBottom: 8 }}>CANALE INVIO</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <CanaleOpt active={canale === "email"} onClick={() => onCanale("email")} icon="mail" title="Email" />
        <CanaleOpt active={canale === "whatsapp"} onClick={() => onCanale("whatsapp")} icon="wa" title="WhatsApp" />
      </div>

      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1.2, fontWeight: 700, marginBottom: 8 }}>RIEPILOGO ORDINI</div>
      <div style={{ background: "#FFF", borderRadius: 14, padding: 14 }}>
        <RowKv k="Ordini da creare" v={`${attivi.length} \u00b7 uno per fornitore`} />
        <RowKv k="Articoli totali" v={`${attivi.reduce((s: number, o: any) => s + (o.righe?.length || 0), 0)} righe`} />
        <RowKv k="Consegna" v={consegnaTipo === "cantiere" ? `Cantiere ${commessa?.code}` : consegnaTipo === "magazzino" ? "Magazzino" : consegnaTipo === "officina" ? "Officina" : "Custom"} />
        <RowKv k="Imponibile" v={fmt(totale)} />
        <RowKv k="IVA 22%" v={fmt(totaleIva - totale)} />
        <div style={{ background: NAVY, color: "#FFF", padding: "12px 14px", borderRadius: "0 0 12px 12px", margin: "8px -14px -14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, opacity: 0.7, letterSpacing: 0.5, fontWeight: 700 }}>DA INVIARE</span>
          <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(totaleIva)}</span>
        </div>
      </div>
    </>
  )
}

function ConsegnaOpt({ active, onClick, icon, title, desc, tag }: any) {
  return (
    <div onClick={onClick} style={{ background: active ? "#F2FAFA" : "#FFF", border: active ? `2px solid ${TEAL}` : "2px solid transparent", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: active ? TEAL : BG, color: active ? "#FFF" : NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ico name={icon} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</div>
          {tag ? <div style={{ display: "inline-block", fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, marginTop: 4, background: TEAL, color: "#FFF" }}>{tag}</div> : null}
        </div>
        <div style={{ width: 20, height: 20, borderRadius: 50, border: active ? `2px solid ${TEAL}` : "2px solid #C8D2DA", background: active ? TEAL : "transparent", flexShrink: 0, marginTop: 6, position: "relative" }}>
          {active ? <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 6, height: 6, background: "#FFF", borderRadius: 50 }}/> : null}
        </div>
      </div>
    </div>
  )
}

function CanaleOpt({ active, onClick, icon, title }: any) {
  return (
    <div onClick={onClick} style={{ padding: 12, borderRadius: 10, background: active ? "#FFF" : "#F2FAFA", border: active ? `2px solid ${TEAL}` : "2px solid transparent", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: active ? TEAL : "#FFF", color: active ? "#FFF" : NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ico name={icon} /></div>
      <div style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{title}</div>
    </div>
  )
}

function RowKv({ k, v }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F4F7", fontSize: 11 }}>
      <span style={{ color: MUTED }}>{k}</span>
      <span style={{ color: TEXT, fontWeight: 600 }}>{v}</span>
    </div>
  )
}

function Ico({ name }: any) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as any
  if (name === "warehouse") return <svg {...p}><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35l10-7 10 7z"/></svg>
  if (name === "home") return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  if (name === "tool") return <svg {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  if (name === "pin") return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx={12} cy={10} r={3}/></svg>
  if (name === "mail") return <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  if (name === "wa") return <svg {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
  return null
}
