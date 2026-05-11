"use client"
import React, { useState, useEffect } from "react"
import OrdiniSheet from "./ordini-sheet/OrdiniSheet"

export default function OrdiniSheetGlobalMount() {
  const [open, setOpen] = useState(false)
  const [commessa, setCommessa] = useState<any>(null)

  useEffect(() => {
    const onOpen = (e: any) => {
      console.log("[OrdiniGlobal] evento ricevuto", e?.detail)
      setCommessa(e?.detail?.commessa || null)
      setOpen(true)
    }
    const onClose = () => { setOpen(false); setCommessa(null) }
    window.addEventListener("mastro:open-ordini", onOpen)
    window.addEventListener("mastro:close-ordini", onClose)
    return () => {
      window.removeEventListener("mastro:open-ordini", onOpen)
      window.removeEventListener("mastro:close-ordini", onClose)
    }
  }, [])

  if (!open || !commessa) return null
  return (
    <OrdiniSheet
      commessa={commessa}
      onClose={() => { setOpen(false); setCommessa(null) }}
      onCompletato={() => { setOpen(false); setCommessa(null) }}
    />
  )
}
