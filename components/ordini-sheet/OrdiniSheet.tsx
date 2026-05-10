"use client"
import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import StepSource from "./StepSource"
import StepTipo from "./StepTipo"
import StepPreview from "./StepPreview"
import StepConsegna from "./StepConsegna"

const NAVY = "#1E3A5F", BG = "#EEF8F8", TEAL = "#28A0A0"

export type OrdineDraft = {
  id?: string
  fornitore_id: string
  fornitore_nome: string
  categoria_materiale: string
  tipo_acquisto: "prodotto_finito" | "componenti"
  righe: any[]
  totale_stimato: number
  saltato?: boolean
  vani_inclusi?: any[]
}

type Props = { commessa: any; onClose: () => void; onCompletato: () => void }

export default function OrdiniSheet({ commessa, onClose, onCompletato }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [source, setSource] = useState<"commessa" | "foto" | "listino" | "voce">("commessa")
  const [tipo, setTipo] = useState<"prodotto_finito" | "componenti">("componenti")
  const [categorieAttive, setCategorieAttive] = useState<string[]>(["BARRE_ALLUMINIO", "VETRI", "FERRAMENTA", "MINUTERIE", "LAMIERE"])
  const [bozzaOrdini, setBozzaOrdini] = useState<OrdineDraft[]>([])
  const [consegnaTipo, setConsegnaTipo] = useState<"magazzino" | "cantiere" | "cliente" | "officina" | "custom">("cantiere")
  const [consegnaIndirizzo, setConsegnaIndirizzo] = useState("")
  const [canaleInvio, setCanaleInvio] = useState<"email" | "whatsapp">("email")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!consegnaIndirizzo && commessa?.indirizzo) setConsegnaIndirizzo(commessa.indirizzo)
  }, [commessa, consegnaIndirizzo])

  function avanti() { if (step < 4) setStep((step + 1) as any) }
  function indietro() { if (step > 1) setStep((step - 1) as any); else onClose() }

  async function inviaTutti(soloBozza: boolean) {
    setSubmitting(true)
    try {
      const aziendaId = sessionStorage.getItem("mastro:aziendaId") || localStorage.getItem("mastro:aziendaId")
      if (!aziendaId) { alert("Azienda non identificata"); return }
      const r = await fetch("/api/ordini/crea-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aziendaId, commessaId: commessa.id,
          ordini: bozzaOrdini.filter(o => !o.saltato),
          consegna: { tipo: consegnaTipo, indirizzo: consegnaIndirizzo, riferimento: commessa.cliente || null },
          canaleInvio, bozza: soloBozza,
        }),
      })
      const j = await r.json()
      if (!r.ok) { alert(`Errore: ${j.error || "sconosciuto"}`); return }
      const n = bozzaOrdini.filter(o => !o.saltato).length
      alert(soloBozza ? `${n} bozze salvate` : `${n} ordini inviati ai fornitori`)
      onCompletato()
    } catch (e: any) {
      alert(`Errore: ${e?.message || e}`)
    } finally { setSubmitting(false) }
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", background: "rgba(15,31,51,0.65)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: BG, borderRadius: "22px 22px 0 0", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUpSheet 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div style={{ width: 38, height: 4, background: "#C8D2DA", borderRadius: 2, margin: "8px auto 4px", flexShrink: 0 }} />
        <div style={{ background: "#FFF", padding: "8px 16px 14px", borderBottom: "1px solid #E5EAF0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 50, background: "#F1F4F7", color: "#0F1F33", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>
            </button>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#0F1F33" }}>Crea ordini</div>
            <div style={{ fontSize: 10, color: "#5C6B7A", fontWeight: 600 }}>{step} / 4</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ flex: 1, height: 3, background: n < step ? TEAL : (n === step ? "#BA7517" : "#E5EAF0"), borderRadius: 2 }}/>
            ))}
          </div>
        </div>

        <div style={{ background: "#F2FAFA", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #C8E4E4", flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: TEAL, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={7} width={20} height={14} rx={2}/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: "#1E3A5F", fontWeight: 700, letterSpacing: 0.5 }}>DA COMMESSA · {commessa?.code || commessa?.codice || "?"}</div>
            <div style={{ fontSize: 11, color: "#0F1F33", fontWeight: 500, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{commessa?.cliente || "?"} · {bozzaOrdini.filter(o => !o.saltato).length} ordini</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {step === 1 && <StepSource source={source} onChange={setSource} commessa={commessa} />}
          {step === 2 && <StepTipo tipo={tipo} onTipoChange={setTipo} categorieAttive={categorieAttive} onCategorieChange={setCategorieAttive} commessa={commessa} onPrepara={setBozzaOrdini} />}
          {step === 3 && <StepPreview ordini={bozzaOrdini} onChange={setBozzaOrdini} />}
          {step === 4 && <StepConsegna consegnaTipo={consegnaTipo} onConsegnaTipo={setConsegnaTipo} indirizzo={consegnaIndirizzo} onIndirizzo={setConsegnaIndirizzo} canale={canaleInvio} onCanale={setCanaleInvio} ordini={bozzaOrdini} commessa={commessa} />}
        </div>

        <div style={{ background: "#FFF", padding: 14, borderTop: "1px solid #E5EAF0", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={indietro} disabled={submitting} style={{ flex: "0 0 70px", padding: 14, background: "#F1F4F7", color: "#0F1F33", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          {step === 4 ? (
            <>
              <button onClick={() => inviaTutti(true)} disabled={submitting || bozzaOrdini.filter(o => !o.saltato).length === 0} style={{ flex: 1, padding: 14, background: TEAL, color: "#FFF", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: submitting ? 0.5 : 1 }}>SALVA BOZZA</button>
              <button onClick={() => inviaTutti(false)} disabled={submitting || bozzaOrdini.filter(o => !o.saltato).length === 0} style={{ flex: 1, padding: 14, background: NAVY, color: "#FFF", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: submitting ? 0.5 : 1, boxShadow: "0 4px 12px rgba(30,58,95,0.3)" }}>INVIA TUTTI</button>
            </>
          ) : (
            <button onClick={avanti} style={{ flex: 1, padding: 14, background: NAVY, color: "#FFF", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              AVANTI
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>,
    document.body
  )
}