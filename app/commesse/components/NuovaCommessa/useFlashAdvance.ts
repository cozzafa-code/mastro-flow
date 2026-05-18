'use client'
import { useCallback, useRef } from 'react'

const FLASH_DELAY = 350 // ms - sweet spot smartphone

export function useFlashAdvance() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback((toId: string, delay = FLASH_DELAY) => {
    // Cancella timer precedente se esiste
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const el = document.getElementById(toId)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Focus sul primo input dentro l'elemento
      const input = el.querySelector<HTMLElement>('input, textarea, select')
      if (input) input.focus()
    }, delay)
  }, [])

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { flash, cancel }
}
