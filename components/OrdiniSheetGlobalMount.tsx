"use client"
import React, { useState, useEffect, Component } from "react"
import OrdiniSheet from "./ordini-sheet/OrdiniSheet"

// ErrorBoundary inline per catturare crash di OrdiniSheet
class OrdiniErrorBoundary extends Component<{ children: React.ReactNode; onClose: () => void }, { error: any }> {
  constructor(props: any) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error: any) { return { error } }
  componentDidCatch(error: any, info: any) {
    console.error("[OrdiniGlobal] CRASH OrdiniSheet:", error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,31,51,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#DC2626", marginBottom: 12 }}>⚠️ Errore apertura ordini</div>
            <div style={{ fontSize: 12, color: "#0F1F33", marginBottom: 16, fontFamily: "monospace", background: "#F5F5F5", padding: 10, borderRadius: 8, maxHeight: 200, overflow: "auto" }}>
              {String(this.state.error?.message || this.state.error)}
            </div>
            <button onClick={() => { this.setState({ error: null }); this.props.onClose() }} style={{ width: "100%", padding: 14, background: "#1E3A5F", color: "#FFF", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Chiudi
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function OrdiniSheetGlobalMount() {
  const [open, setOpen] = useState(false)
  const [commessa, setCommessa] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log("[OrdiniGlobal] mount listener attivo")
    const onOpen = (e: any) => {
      const c = e?.detail?.commessa
      console.log("[OrdiniGlobal] evento ricevuto", {
        hasDetail: !!e?.detail,
        hasCommessa: !!c,
        commessaId: c?.id,
        commessaCode: c?.code || c?.codice,
        fase: c?.fase,
        vaniCount: c?.misure?.vani?.length || c?.vani?.length || 0
      })
      if (!c) {
        console.error("[OrdiniGlobal] ERRORE: detail.commessa mancante")
        alert("Errore: commessa non disponibile. Riprova.")
        return
      }
      setCommessa(c)
      setOpen(true)
    }
    const onClose = () => {
      console.log("[OrdiniGlobal] evento close ricevuto")
      setOpen(false)
      setCommessa(null)
    }
    window.addEventListener("mastro:open-ordini", onOpen)
    window.addEventListener("mastro:close-ordini", onClose)
    return () => {
      window.removeEventListener("mastro:open-ordini", onOpen)
      window.removeEventListener("mastro:close-ordini", onClose)
    }
  }, [])

  if (!mounted || !open || !commessa) return null

  const handleClose = () => { setOpen(false); setCommessa(null) }

  return (
    <OrdiniErrorBoundary onClose={handleClose}>
      <OrdiniSheet
        commessa={commessa}
        onClose={handleClose}
        onCompletato={handleClose}
      />
    </OrdiniErrorBoundary>
  )
}
