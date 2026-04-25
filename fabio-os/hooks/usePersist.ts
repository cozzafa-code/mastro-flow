'use client'
import { useEffect, useRef } from 'react'

const KEY = 'fabios_state_v1'

export function usePersist(state: any, ready: boolean) {
  const firstRun = useRef(true)
  
  useEffect(() => {
    if (!ready) return
    // Salta il primo salvataggio  è lo stato iniziale prima del load
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
      console.log(' Salvato')
    } catch(e) {}
  }, [JSON.stringify(state), ready])
}

export async function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch(e) {
    return null
  }
}
