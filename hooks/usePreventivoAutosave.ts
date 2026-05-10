// hooks/usePreventivoAutosave.ts
// Autosave debounced del preventivo. Scrive su DB quando vani/totali cambiano.
// Debounce 1500ms per evitare flood durante typing.

'use client'
import { useEffect, useRef, useState } from 'react'
import { salvaPreventivo, type SalvaPreventivoInput } from '@/lib/preventivi/save'

export type AutosaveStato = 'idle' | 'saving' | 'saved' | 'error'

export function usePreventivoAutosave(
  input: SalvaPreventivoInput | null,
  enabled: boolean = true,
  debounceMs: number = 1500,
) {
  const [stato, setStato] = useState<AutosaveStato>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPayloadRef = useRef<string>('')

  useEffect(() => {
    if (!enabled || !input || !input.commessaId) return
    // Salta se nessun vano (preventivo vuoto = niente da salvare)
    if (!input.vani || input.vani.length === 0) return

    const payload = JSON.stringify({
      c: input.commessaId,
      v: input.vani.length,
      t: input.totali,
    })
    // Evita save inutili se nulla è cambiato
    if (payload === lastPayloadRef.current) return
    lastPayloadRef.current = payload

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setStato('saving')
      setErrorMsg(null)
      try {
        const res = await salvaPreventivo(input)
        if (res.ok) {
          setStato('saved')
          setLastSavedAt(new Date())
          if (res.warning) console.warn('[autosave]', res.warning)
        } else {
          setStato('error')
          setErrorMsg(res.error || 'errore sconosciuto')
          console.error('[autosave] FAIL:', res.error)
        }
      } catch (e: any) {
        setStato('error')
        setErrorMsg(e?.message || String(e))
        console.error('[autosave] exception:', e)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [JSON.stringify(input), enabled, debounceMs])

  // Save manuale forzato (per bottone esplicito)
  const salvaOra = async (): Promise<boolean> => {
    if (!input || !input.commessaId) return false
    setStato('saving')
    setErrorMsg(null)
    try {
      const res = await salvaPreventivo(input)
      if (res.ok) {
        setStato('saved')
        setLastSavedAt(new Date())
        return true
      } else {
        setStato('error')
        setErrorMsg(res.error || 'errore sconosciuto')
        return false
      }
    } catch (e: any) {
      setStato('error')
      setErrorMsg(e?.message || String(e))
      return false
    }
  }

  return { stato, lastSavedAt, errorMsg, salvaOra }
}
