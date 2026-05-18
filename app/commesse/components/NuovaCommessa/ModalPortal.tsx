'use client'
import { useEffect, useRef, FC } from 'react'
import { createPortal } from 'react-dom'

export const ModalPortal: FC<{ children: React.ReactNode }> = ({ children }) => {
  const elRef = useRef<HTMLDivElement | null>(null)

  if (!elRef.current) {
    const div = document.createElement('div')
    div.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
    `
    elRef.current = div
  }

  useEffect(() => {
    const el = elRef.current!
    document.body.appendChild(el)
    return () => { document.body.removeChild(el) }
  }, [])

  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>{children}</div>,
    elRef.current
  )
}
