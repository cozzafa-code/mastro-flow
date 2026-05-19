// components/settings-mobile/DxfViewer.tsx
// Viewer DXF mobile: fetch + parse + pinch-zoom + pan + fullscreen.

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { parseDXFtoSVG } from '@/lib/dxf-to-svg'
import { T } from '../home-mobile/HomeUI'

interface Props {
  url: string
  filename?: string
  height?: number
}

export default function DxfViewer({ url, filename, height = 240 }: Props) {
  const [svg, setSvg] = useState<string | null>(null)
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true); setError(null); setSvg(null)
    ;(async () => {
      try {
        const r = await fetch(url)
        if (!r.ok) throw new Error('Download fallito (HTTP ' + r.status + ')')
        const txt = await r.text()
        const parsed = parseDXFtoSVG(txt, filename || 'profilo.dxf')
        if (!mounted) return
        setSvg(parsed.svg)
        setDim({ w: parsed.width, h: parsed.height })
      } catch (e: any) {
        if (mounted) setError(e?.message || String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [url, filename])

  if (loading) {
    return (
      <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>
        Carico anteprima DXF...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: T.redSoft, border: '1px solid #F5C8C8', borderRadius: 12, padding: 14, fontSize: 12, color: T.numRed }}>
        DXF non leggibile: {error}
        <br />
        <a href={url} target="_blank" rel="noopener" style={{ color: T.numRed, fontWeight: 700 }}>Scarica file</a>
      </div>
    )
  }

  if (!svg) return null

  return (
    <>
      <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 8, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            Anteprima sezione DXF
          </div>
          {dim && (
            <div style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>
              {dim.w} x {dim.h} mm
            </div>
          )}
        </div>
        <PanZoomSvg svg={svg} height={height} onFullscreen={() => setFullscreen(true)} />
      </div>

      {fullscreen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,42,42,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFF' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Anteprima DXF</div>
              {dim && <div style={{ fontSize: 11, opacity: 0.7 }}>{dim.w} x {dim.h} mm</div>}
            </div>
            <button onClick={() => setFullscreen(false)} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#FFF', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>CHIUDI</button>
          </div>
          <div style={{ flex: 1, padding: 16 }}>
            <div style={{ background: '#FFF', borderRadius: 12, height: '100%' }}>
              <PanZoomSvg svg={svg} height={undefined} fullHeight />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ──────────── Pan/Zoom container ────────────

function PanZoomSvg({ svg, height, fullHeight, onFullscreen }: {
  svg: string; height?: number; fullHeight?: boolean; onFullscreen?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const [scale, setScale] = useState(1)

  // Touch tracking
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const pinchRef = useRef<{ d: number; scale: number } | null>(null)

  const dist = (a: Touch, b: Touch) => {
    const dx = a.clientX - b.clientX, dy = a.clientY - b.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty }
    } else if (e.touches.length === 2) {
      pinchRef.current = { d: dist(e.touches[0] as any, e.touches[1] as any), scale }
      dragRef.current = null
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragRef.current) {
      const dx = e.touches[0].clientX - dragRef.current.x
      const dy = e.touches[0].clientY - dragRef.current.y
      setTx(dragRef.current.tx + dx)
      setTy(dragRef.current.ty + dy)
    } else if (e.touches.length === 2 && pinchRef.current) {
      const d = dist(e.touches[0] as any, e.touches[1] as any)
      const ns = Math.max(0.3, Math.min(8, pinchRef.current.scale * (d / pinchRef.current.d)))
      setScale(ns)
    }
  }

  const onTouchEnd = () => {
    dragRef.current = null
    pinchRef.current = null
  }

  // Mouse pan/zoom (desktop)
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.max(0.3, Math.min(8, s * delta)))
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || e.buttons !== 1) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    setTx(dragRef.current.tx + dx)
    setTy(dragRef.current.ty + dy)
  }
  const onMouseUp = () => { dragRef.current = null }

  const reset = () => { setTx(0); setTy(0); setScale(1) }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: fullHeight ? '100%' : (height ? height + 'px' : '240px'),
      overflow: 'hidden',
      borderRadius: 8,
      background: 'repeating-conic-gradient(#F4F1EA 0% 25%, #FFF 0% 50%) 50% / 14px 14px',
      cursor: 'grab',
      touchAction: 'none',
    }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        ref={ref}
        style={{
          width: '100%', height: '100%',
          transform: 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')',
          transformOrigin: 'center',
          transition: dragRef.current || pinchRef.current ? 'none' : 'transform 0.1s ease-out',
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
        <button onClick={reset} style={ctrlBtnStyle}>↺</button>
        <button onClick={() => setScale(s => Math.min(8, s * 1.2))} style={ctrlBtnStyle}>+</button>
        <button onClick={() => setScale(s => Math.max(0.3, s * 0.8))} style={ctrlBtnStyle}>−</button>
        {onFullscreen && (
          <button onClick={onFullscreen} style={{ ...ctrlBtnStyle, width: 'auto', padding: '0 10px', fontSize: 11 }}>FULLSCREEN</button>
        )}
      </div>
    </div>
  )
}

const ctrlBtnStyle: React.CSSProperties = {
  background: 'rgba(15,118,110,0.92)',
  color: '#FFF',
  border: 'none',
  borderRadius: 8,
  width: 32,
  height: 32,
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
}
