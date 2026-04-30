// components/nodi/NodiTecniciPanelMobile.tsx
// MASTRO Nodi Tecnici - versione mobile.
// Stessa logica/algoritmi del desktop, UI riprogettata per touch a 380px.

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { NodoLayer, NodoTecnico, QuoteRef, ToolMode } from '@/lib/nodi/nodi-types'
import { LAYER_COLORS } from '@/lib/nodi/nodi-types'
import {
  transformPoint, getSnapPoints, findNearestSnap, projectOnSegment,
  resolveQuote, generateCombinedSVG, extractSVGContent, screenToCanvas,
} from '@/lib/nodi/nodi-geometry'
import NodiBottomSheet from './NodiBottomSheet'
import NodiCatalogModal from './NodiCatalogModal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DS = {
  teal: '#28A0A0', dark: '#156060', ink: '#0D1F1F',
  light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF',
  red: '#DC4444', green: '#1A9E73', amber: '#D08008', blue: '#3B7FE0',
  muted: '#888',
}
const M = "'JetBrains Mono', monospace"

interface Props {
  onBack?: () => void
  fornitore?: string
  serie?: string
}

export default function NodiTecniciPanelMobile({ onBack, fornitore: initFornitore, serie: initSerie }: Props) {
  const [nodi, setNodi] = useState<any[]>([])
  const [profili, setProfili] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNodo, setEditingNodo] = useState<NodoTecnico | null>(null)
  const [showCatalog, setShowCatalog] = useState(false)

  // Canvas state
  const [zoom, setZoom] = useState(3)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [tool, setTool] = useState<ToolMode>('select')
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Touch / drag state
  const dragRef = useRef<{
    type: 'canvas' | 'layer' | 'pinch' | null
    layerId?: string
    startX: number; startY: number
    origPanX: number; origPanY: number
    origLayerX?: number; origLayerY?: number
    pinchDist?: number
    pinchZoom?: number
  }>({ type: null, startX: 0, startY: 0, origPanX: 0, origPanY: 0 })

  // Quote
  const [quotes, setQuotes] = useState<QuoteRef[]>([])
  const [quotePt1, setQuotePt1] = useState<{ x: number; y: number; layerId: string; offX: number; offY: number } | null>(null)
  const [hoverPt, setHoverPt] = useState<{ x: number; y: number; layerId: string } | null>(null)

  // Bottom sheet state
  const [sheetState, setSheetState] = useState<'collapsed' | 'mid' | 'full'>('collapsed')
  const [sheetTab, setSheetTab] = useState<'info' | 'profili' | 'quote' | 'azioni'>('info')

  // Double tap detection
  const lastTapRef = useRef<{ time: number; layerId: string | null }>({ time: 0, layerId: null })

  // Drag soglia: se sposti < 4px è un tap, oltre è drag
  const dragMovedRef = useRef<boolean>(false)

  // RAF batching per drag fluido (evita re-render 60fps)
  const rafRef = useRef<number | null>(null)
  const pendingPosRef = useRef<{ layerId: string; x: number; y: number } | null>(null)

  // ─── BOOT: carica nodi + profili + vetri + pannelli ──
  useEffect(() => {
    (async () => {
      const [
        { data: nodiData },
        { data: profData },
        { data: vetriData },
        { data: pannData },
      ] = await Promise.all([
        supabase.from('nodi_tecnici').select('*').order('serie').order('tipo_nodo'),
        supabase.from('catalogo_profili').select('id,codice,fornitore,serie,tipo,sezione_svg').not('sezione_svg', 'is', null),
        supabase.from('catalogo_vetri').select('id,codice,composizione,fornitore,sezione_svg,ug,spessore').not('sezione_svg', 'is', null),
        supabase.from('catalogo_pannelli').select('id,codice,nome,fornitore,sezione_svg,up,spessore').not('sezione_svg', 'is', null),
      ])
      setNodi(nodiData || [])
      const all = [
        ...(profData || []).map((p: any) => ({ ...p, _source: 'profilo' })),
        ...(vetriData || []).map((v: any) => ({ ...v, tipo: 'vetro', serie: 'Vetri', _source: 'vetro' })),
        ...(pannData || []).map((p: any) => ({ ...p, tipo: 'pannello', serie: 'Pannelli', _source: 'pannello' })),
      ]
      setProfili(all)
      setLoading(false)
    })()
  }, [])

  // ─── HELPER ──────
  const updateLayer = useCallback((layerId: string, updates: Partial<NodoLayer>) => {
    setEditingNodo(prev => {
      if (!prev) return null
      return { ...prev, layers: prev.layers.map(l => l.id === layerId ? { ...l, ...updates } : l) }
    })
  }, [])

  const deleteLayer = useCallback((layerId: string) => {
    setEditingNodo(prev => {
      if (!prev) return null
      return { ...prev, layers: prev.layers.filter(l => l.id !== layerId) }
    })
    if (selectedLayer === layerId) setSelectedLayer(null)
  }, [selectedLayer])

  const createNewNodo = () => {
    setEditingNodo({
      codice: '', nome: '',
      fornitore: initFornitore || '',
      serie: initSerie || '',
      tipo_nodo: 'orizzontale_alto',
      layers: [],
    })
    setZoom(3); setPanX(0); setPanY(0)
    setQuotes([]); setQuotePt1(null)
    setSelectedLayer(null)
    setSheetState('mid'); setSheetTab('info')
  }

  const openExistingNodo = (n: any) => {
    setEditingNodo({
      id: n.id, codice: n.codice, nome: n.nome,
      fornitore: n.fornitore || '', serie: n.serie, tipo_nodo: n.tipo_nodo,
      layers: (n.profili || []).map((p: any, i: number) => ({
        id: Date.now().toString() + i,
        profiloId: null, codice: p.codice,
        svg: p.svg || '',
        x: p.x || 0, y: p.y || 0,
        rotation: p.rotation || 0,
        flipH: p.flipH || false, flipV: p.flipV || false,
        color: LAYER_COLORS[i % LAYER_COLORS.length],
        label: p.ruolo || p.codice,
        visible: true,
        groupId: null,
      })),
    })
    setZoom(3); setPanX(0); setPanY(0)
    setSheetState('collapsed')
  }

  const addLayerFromProfile = (profilo: any) => {
    if (!editingNodo) return
    const newLayer: NodoLayer = {
      id: Date.now().toString(),
      profiloId: profilo.id,
      codice: profilo.codice,
      svg: profilo.sezione_svg,
      x: 0, y: 0,
      rotation: 0,
      flipH: false, flipV: false,
      color: LAYER_COLORS[editingNodo.layers.length % LAYER_COLORS.length],
      label: `${profilo.codice} (${profilo.tipo || ''})`,
      visible: true,
      groupId: null,
    }
    setEditingNodo(prev => prev ? { ...prev, layers: [...prev.layers, newLayer] } : null)
    setSelectedLayer(newLayer.id)
    setShowCatalog(false)
  }

  const saveNodo = async () => {
    if (!editingNodo || !editingNodo.codice) {
      alert('Inserisci almeno il codice del nodo.')
      setSheetState('mid'); setSheetTab('info')
      return
    }
    const saveData = {
      codice: editingNodo.codice,
      nome: editingNodo.nome,
      fornitore: editingNodo.fornitore || initFornitore || '',
      serie: editingNodo.serie,
      tipo_nodo: editingNodo.tipo_nodo,
      profili: editingNodo.layers.map(l => ({
        ruolo: l.label, codice: l.codice, profiloId: l.profiloId,
        x: l.x, y: l.y, rotation: l.rotation, flipH: l.flipH, flipV: l.flipV,
      })),
      sezione_svg: generateCombinedSVG(editingNodo),
    }
    try {
      if (editingNodo.id) {
        await supabase.from('nodi_tecnici').update(saveData).eq('id', editingNodo.id)
      } else {
        const { data } = await supabase.from('nodi_tecnici').insert(saveData).select().single()
        if (data) setEditingNodo(prev => prev ? { ...prev, id: data.id } : null)
      }
      const { data } = await supabase.from('nodi_tecnici').select('*').order('serie').order('tipo_nodo')
      setNodi(data || [])
      alert('Nodo salvato!')
    } catch (e: any) {
      alert('Errore: ' + e.message)
    }
  }

  // ─── AZIONI LAYER (dal bottom sheet "Azioni") ──
  const handleLayerAction = useCallback((layerId: string, action: string) => {
    const layer = editingNodo?.layers.find(l => l.id === layerId)
    if (!layer) return
    switch (action) {
      case 'rot+90':  updateLayer(layerId, { rotation: (layer.rotation + 90) % 360 }); break
      case 'rot-90':  updateLayer(layerId, { rotation: (layer.rotation - 90 + 360) % 360 }); break
      case 'rot+45':  updateLayer(layerId, { rotation: (layer.rotation + 45) % 360 }); break
      case 'rot+1':   updateLayer(layerId, { rotation: (layer.rotation + 1) % 360 }); break
      case 'rot-1':   updateLayer(layerId, { rotation: (layer.rotation - 1 + 360) % 360 }); break
      case 'flipH':   updateLayer(layerId, { flipH: !layer.flipH }); break
      case 'flipV':   updateLayer(layerId, { flipV: !layer.flipV }); break
      case 'reset':   updateLayer(layerId, { x: 0, y: 0, rotation: 0, flipH: false, flipV: false }); break
      case 'front':
        setEditingNodo(prev => {
          if (!prev) return null
          const ls = [...prev.layers]
          const idx = ls.findIndex(l => l.id === layerId)
          if (idx >= 0) { const [m] = ls.splice(idx, 1); ls.push(m) }
          return { ...prev, layers: ls }
        })
        break
      case 'back':
        setEditingNodo(prev => {
          if (!prev) return null
          const ls = [...prev.layers]
          const idx = ls.findIndex(l => l.id === layerId)
          if (idx >= 0) { const [m] = ls.splice(idx, 1); ls.unshift(m) }
          return { ...prev, layers: ls }
        })
        break
      case 'unlink':  updateLayer(layerId, { groupId: null }); break
      case 'link':
        setSelectedLayer(layerId); setTool('link')
        setSheetState('collapsed')
        break
      case 'delete':
        if (confirm('Eliminare questo profilo dal nodo?')) {
          deleteLayer(layerId)
          setSheetTab('profili')
        }
        break
      case 'move':
        // su mobile uso direttamente i campi X/Y nel tab profili
        setSheetTab('profili')
        break
    }
  }, [editingNodo, updateLayer, deleteLayer])

  // ─── TOUCH HANDLERS ──
  const getTouchPos = (e: React.TouchEvent | TouchEvent, idx = 0) => {
    const t = e.touches[idx] || e.changedTouches[idx]
    return { x: t.clientX, y: t.clientY }
  }

  const onCanvasTouchStart = (e: React.TouchEvent) => {
    setHoverPt(null)
    if (e.touches.length === 2) {
      // Pinch zoom
      const t1 = e.touches[0], t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      dragRef.current = {
        type: 'pinch', startX: 0, startY: 0,
        origPanX: panX, origPanY: panY,
        pinchDist: dist, pinchZoom: zoom,
      }
      return
    }
    const t = getTouchPos(e)

    // Tool quota: snap & posiziona punto
    if (tool === 'quota' && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const raw = screenToCanvas(t.x, t.y, rect, panX, panY, zoom)
      const snapped = findNearestSnap(raw.x, raw.y, editingNodo, zoom)
      const pt = snapped || { x: raw.x, y: raw.y, layerId: '__canvas__' }
      let bestLayerId = pt.layerId
      if (!snapped && editingNodo) {
        let bestD = Infinity
        editingNodo.layers.filter(l => l.visible).forEach(l => {
          const d = Math.sqrt((raw.x - l.x) ** 2 + (raw.y - l.y) ** 2)
          if (d < bestD) { bestD = d; bestLayerId = l.id }
        })
      }
      const layer = editingNodo?.layers.find(l => l.id === bestLayerId)
      const offX = pt.x - (layer?.x || 0)
      const offY = pt.y - (layer?.y || 0)

      if (!quotePt1) {
        setQuotePt1({ x: pt.x, y: pt.y, layerId: bestLayerId, offX, offY })
      } else {
        setQuotes([...quotes, {
          layerId1: quotePt1.layerId, offX1: quotePt1.offX, offY1: quotePt1.offY,
          layerId2: bestLayerId, offX2: offX, offY2: offY,
        }])
        setQuotePt1(null)
      }
      return
    }

    // Pan canvas (default)
    dragRef.current = {
      type: 'canvas',
      startX: t.x, startY: t.y,
      origPanX: panX, origPanY: panY,
    }
  }

  const onCanvasTouchMove = (e: React.TouchEvent) => {
    // Se è in corso un drag di layer, NON gestire qui (gestito da onLayerTouchMove)
    if (dragRef.current.type === 'layer') return

    if (e.touches.length === 2 && dragRef.current.type === 'pinch') {
      const t1 = e.touches[0], t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const ratio = dist / (dragRef.current.pinchDist || 1)
      const newZoom = Math.max(0.3, Math.min(50, (dragRef.current.pinchZoom || 1) * ratio))
      setZoom(newZoom)
      return
    }
    const t = getTouchPos(e)

    if (dragRef.current.type === 'canvas') {
      setPanX(dragRef.current.origPanX + (t.x - dragRef.current.startX))
      setPanY(dragRef.current.origPanY + (t.y - dragRef.current.startY))
    } else if (dragRef.current.type === 'layer' && dragRef.current.layerId && editingNodo) {
      const dx = (t.x - dragRef.current.startX) / zoom
      const dy = (t.y - dragRef.current.startY) / zoom
      const newX = (dragRef.current.origLayerX || 0) + dx
      const newY = (dragRef.current.origLayerY || 0) + dy

      // Aggiorna posizione live in ref (per render non-React)
      pendingPosRef.current = { layerId: dragRef.current.layerId, x: newX, y: newY }

      // Schedula update via RAF (1 update per frame, no spam state)
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          const pending = pendingPosRef.current
          if (!pending) return

          const dragLayer = editingNodo.layers.find(l => l.id === pending.layerId)
          if (!dragLayer) return

          if (dragLayer.groupId) {
            const deltaX = pending.x - dragLayer.x
            const deltaY = pending.y - dragLayer.y
            setEditingNodo(prev => {
              if (!prev) return null
              return { ...prev, layers: prev.layers.map(l => {
                if (l.id === pending.layerId) return { ...l, x: pending.x, y: pending.y }
                if (l.groupId === dragLayer.groupId) return { ...l, x: l.x + deltaX, y: l.y + deltaY }
                return l
              })}
            })
          } else {
            updateLayer(pending.layerId, { x: pending.x, y: pending.y })
          }
        })
      }
    }
  }

  const onCanvasTouchEnd = () => {
    // Cancella RAF pendente e applica ultima posizione
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const pending = pendingPosRef.current
    if (pending && editingNodo) {
      const dragLayer = editingNodo.layers.find(l => l.id === pending.layerId)
      if (dragLayer) {
        if (dragLayer.groupId) {
          const deltaX = pending.x - dragLayer.x
          const deltaY = pending.y - dragLayer.y
          setEditingNodo(prev => {
            if (!prev) return null
            return { ...prev, layers: prev.layers.map(l => {
              if (l.id === pending.layerId) return { ...l, x: pending.x, y: pending.y }
              if (l.groupId === dragLayer.groupId) return { ...l, x: l.x + deltaX, y: l.y + deltaY }
              return l
            })}
          })
        } else {
          updateLayer(pending.layerId, { x: pending.x, y: pending.y })
        }
      }
    }
    pendingPosRef.current = null
    dragMovedRef.current = false
    dragRef.current = { type: null, startX: 0, startY: 0, origPanX: 0, origPanY: 0 }
  }

  // Layer touch (start drag layer + double-tap detection)
  const onLayerTouchStart = (e: React.TouchEvent, layer: NodoLayer) => {
    e.stopPropagation()

    if (tool === 'link' && selectedLayer && selectedLayer !== layer.id) {
      const selLayer = editingNodo?.layers.find(l => l.id === selectedLayer)
      if (selLayer) {
        const groupId = selLayer.groupId || 'grp_' + Date.now()
        setEditingNodo(prev => {
          if (!prev) return null
          return { ...prev, layers: prev.layers.map(l => {
            if (l.id === selectedLayer || l.id === layer.id) return { ...l, groupId }
            return l
          })}
        })
      }
      setTool('select')
      return
    }

    setSelectedLayer(layer.id)
    if (tool !== 'select') return

    // Double tap detection (entro 350ms sullo stesso layer)
    const now = Date.now()
    const isDouble = lastTapRef.current.layerId === layer.id && (now - lastTapRef.current.time) < 350
    if (isDouble) {
      // Apri azioni
      setSheetTab('azioni')
      setSheetState('mid')
      lastTapRef.current = { time: 0, layerId: null }
      return
    }
    lastTapRef.current = { time: now, layerId: layer.id }

    // Setup drag
    const t = getTouchPos(e)
    dragMovedRef.current = false
    dragRef.current = {
      type: 'layer', layerId: layer.id,
      startX: t.x, startY: t.y,
      origPanX: panX, origPanY: panY,
      origLayerX: layer.x, origLayerY: layer.y,
    }
  }

  // Touch move su layer - applica transform DIRETTAMENTE al DOM per mantenere touch capture
  const onLayerTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (dragRef.current.type !== 'layer' || !dragRef.current.layerId || !editingNodo) return
    if (e.touches.length !== 1) return

    const t = getTouchPos(e)
    const dx_screen = t.x - dragRef.current.startX
    const dy_screen = t.y - dragRef.current.startY

    // Soglia: serve almeno 4px per considerarlo drag
    if (!dragMovedRef.current && Math.abs(dx_screen) < 4 && Math.abs(dy_screen) < 4) return
    dragMovedRef.current = true

    const dx = dx_screen / zoom
    const dy = dy_screen / zoom
    const newX = (dragRef.current.origLayerX || 0) + dx
    const newY = (dragRef.current.origLayerY || 0) + dy

    pendingPosRef.current = { layerId: dragRef.current.layerId, x: newX, y: newY }

    // Applica transform DIRETTAMENTE al DOM (no setState - mantiene touch capture)
    const dragLayer = editingNodo.layers.find(l => l.id === dragRef.current.layerId)
    if (!dragLayer) return

    const updateLayerDOM = (layerId: string, x: number, y: number, layerObj: NodoLayer) => {
      const el = document.getElementById('nodo-layer-' + layerId)
      if (el) {
        el.setAttribute('transform',
          `translate(${x},${y}) rotate(${layerObj.rotation}) scale(${layerObj.flipH ? -1 : 1},${layerObj.flipV ? -1 : 1})`
        )
      }
    }

    if (dragLayer.groupId) {
      const deltaX = newX - dragLayer.x
      const deltaY = newY - dragLayer.y
      editingNodo.layers.forEach(l => {
        if (l.id === dragLayer.id) {
          updateLayerDOM(l.id, newX, newY, l)
        } else if (l.groupId === dragLayer.groupId) {
          updateLayerDOM(l.id, l.x + deltaX, l.y + deltaY, l)
        }
      })
    } else {
      updateLayerDOM(dragLayer.id, newX, newY, dragLayer)
    }
  }

  const onLayerTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    onCanvasTouchEnd()
  }

  // ============ RENDER LIST VIEW ============
  if (!editingNodo) {
    return (
      <div style={{ background: DS.light, minHeight: '100vh', paddingBottom: 120 }}>
        {/* HEADER */}
        <div style={{
          background: `linear-gradient(160deg, ${DS.teal} 0%, ${DS.dark} 100%)`,
          padding: '14px 16px 22px',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          color: '#FFF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            {onBack && (
              <button onClick={onBack} style={{
                background: 'rgba(255,255,255,0.18)', border: 'none',
                width: 36, height: 36, borderRadius: 10,
                color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer',
              }}>‹</button>
            )}
            <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: 0.3, opacity: 0.85 }}>filwoX</div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>Nodi tecnici</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>{nodi.length} nodi · {profili.length} profili disponibili</div>
        </div>

        {/* AZIONI */}
        <div style={{ padding: 12 }}>
          <button
            onClick={createNewNodo}
            style={{
              width: '100%', padding: 14, borderRadius: 12,
              border: 'none', background: DS.teal, color: '#FFF',
              fontSize: 14, fontWeight: 700, letterSpacing: 0.5,
              cursor: 'pointer',
              boxShadow: `0 3px 0 0 ${DS.dark}`,
            }}
          >+ NUOVO NODO</button>
        </div>

        {/* LISTA */}
        <div style={{ padding: '0 12px' }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: DS.muted, fontSize: 12 }}>
              Caricamento...
            </div>
          ) : nodi.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: DS.muted }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: DS.ink, marginBottom: 6 }}>
                Nessun nodo
              </div>
              <div style={{ fontSize: 12 }}>
                Crea il primo nodo assemblando profili dal catalogo.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {nodi.map(n => (
                <div
                  key={n.id}
                  onClick={() => openExistingNodo(n)}
                  style={{
                    padding: 10, borderRadius: 12,
                    background: DS.white, border: `1.5px solid ${DS.border}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    height: 80, borderRadius: 8,
                    background: DS.light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', marginBottom: 6,
                  }}>
                    {n.sezione_svg ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: n.sezione_svg }}
                        style={{ maxWidth: '90%', maxHeight: '90%' }}
                      />
                    ) : (
                      <span style={{ color: DS.border, fontSize: 9 }}>no preview</span>
                    )}
                  </div>
                  <div style={{ fontFamily: M, fontSize: 11, fontWeight: 800, color: DS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.codice}
                  </div>
                  <div style={{ fontSize: 10, color: DS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.nome || '—'}
                  </div>
                  <div style={{ fontSize: 9, color: DS.teal, marginTop: 2 }}>
                    {n.serie} · {(n.tipo_nodo || '').replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============ RENDER EDITOR VIEW ============
  return (
    <EditorView
      editingNodo={editingNodo}
      setEditingNodo={setEditingNodo}
      zoom={zoom} setZoom={setZoom}
      panX={panX} setPanX={setPanX}
      panY={panY} setPanY={setPanY}
      tool={tool} setTool={setTool}
      selectedLayer={selectedLayer} setSelectedLayer={setSelectedLayer}
      svgRef={svgRef}
      quotes={quotes} setQuotes={setQuotes}
      quotePt1={quotePt1} setQuotePt1={setQuotePt1}
      hoverPt={hoverPt}
      sheetState={sheetState} setSheetState={setSheetState}
      sheetTab={sheetTab} setSheetTab={setSheetTab}
      onCanvasTouchStart={onCanvasTouchStart}
      onCanvasTouchMove={onCanvasTouchMove}
      onCanvasTouchEnd={onCanvasTouchEnd}
      onLayerTouchStart={onLayerTouchStart}
      onLayerTouchMove={onLayerTouchMove}
      onLayerTouchEnd={onLayerTouchEnd}
      handleLayerAction={handleLayerAction}
      onAddProfile={() => setShowCatalog(true)}
      onSave={saveNodo}
      onClose={() => setEditingNodo(null)}
      showCatalog={showCatalog}
      profili={profili}
      onCatalogSelect={addLayerFromProfile}
      onCatalogClose={() => setShowCatalog(false)}
    />
  )
}

// ============ EDITOR VIEW ============
function EditorView(p: any) {
  const {
    editingNodo, setEditingNodo, zoom, setZoom, panX, setPanX, panY, setPanY,
    tool, setTool, selectedLayer, setSelectedLayer, svgRef,
    quotes, setQuotes, quotePt1, hoverPt,
    sheetState, setSheetState, sheetTab, setSheetTab,
    onCanvasTouchStart, onCanvasTouchMove, onCanvasTouchEnd,
    onLayerTouchStart, onLayerTouchMove, onLayerTouchEnd,
    handleLayerAction,
    onAddProfile, onSave, onClose,
    showCatalog, profili, onCatalogSelect, onCatalogClose,
  } = p

  const canvasH = sheetState === 'collapsed' ? 'calc(100vh - 110px - 52px)'
                : sheetState === 'mid' ? 'calc(100vh - 110px - 38vh)'
                : 'calc(100vh - 110px - 78vh)'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: DS.light,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 100,
    }}>
      {/* TOP BAR */}
      <div style={{
        padding: '10px 12px',
        background: DS.ink, color: '#FFF',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.18)', border: 'none',
          width: 36, height: 36, borderRadius: 10,
          color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer',
        }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: M, fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {editingNodo.codice || 'Nuovo nodo'}
          </div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>
            {editingNodo.layers.length} profili · {quotes.length} quote · {Math.round(zoom * 100)}%
          </div>
        </div>
        <button onClick={onSave} style={{
          padding: '8px 14px', borderRadius: 8, border: 'none',
          background: DS.green, color: '#FFF',
          fontSize: 12, fontWeight: 800, cursor: 'pointer',
        }}>SALVA</button>
      </div>

      {/* TOOL HINT */}
      {(tool === 'quota' || tool === 'link') && (
        <div style={{
          padding: '6px 12px',
          background: tool === 'quota' ? DS.red + '15' : DS.blue + '15',
          color: tool === 'quota' ? DS.red : DS.blue,
          fontSize: 11, fontWeight: 700, textAlign: 'center',
          flexShrink: 0,
        }}>
          {tool === 'quota'
            ? (quotePt1 ? '➡ Tappa il SECONDO punto' : '➡ Tappa il PRIMO punto da quotare')
            : selectedLayer ? '➡ Tappa un altro profilo per legarlo' : '➡ Seleziona il primo profilo'}
          <button onClick={() => { setTool('select'); }} style={{
            marginLeft: 12, padding: '2px 8px', borderRadius: 4, border: 'none',
            background: '#FFF', color: DS.ink, fontSize: 10, fontWeight: 700, cursor: 'pointer',
          }}>×</button>
        </div>
      )}

      {/* CANVAS */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', height: canvasH }}>
        <svg ref={svgRef}
          width="100%" height="100%"
          style={{ display: 'block', background: '#F5F5F0', touchAction: 'none' }}
          onTouchStart={onCanvasTouchStart}
          onTouchMove={onCanvasTouchMove}
          onTouchEnd={onCanvasTouchEnd}
          onTouchCancel={onCanvasTouchEnd}
        >
          <defs>
            <pattern id="nodoGridM" width={10 * zoom} height={10 * zoom} patternUnits="userSpaceOnUse" x={panX % (10 * zoom)} y={panY % (10 * zoom)}>
              <line x1="0" y1="0" x2={10 * zoom} y2="0" stroke="#ddd" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="0" y2={10 * zoom} stroke="#ddd" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nodoGridM)" />

          <g transform={`translate(${panX + (svgRef.current?.clientWidth || 380) / 2}, ${panY + (svgRef.current?.clientHeight || 600) / 2})`}>
            <line x1={-15} y1={0} x2={15} y2={0} stroke="#bbb" strokeWidth="0.5" strokeDasharray="3,2" />
            <line x1={0} y1={-15} x2={0} y2={15} stroke="#bbb" strokeWidth="0.5" strokeDasharray="3,2" />
          </g>

          <g transform={`translate(${panX + (svgRef.current?.clientWidth || 380) / 2}, ${panY + (svgRef.current?.clientHeight || 600) / 2}) scale(${zoom})`}>
            {editingNodo.layers
              .filter((l: NodoLayer) => l.visible)
              .slice()
              .sort((a: NodoLayer, b: NodoLayer) => {
                // Layer selezionato sempre in cima (renderato per ultimo)
                if (a.id === selectedLayer) return 1
                if (b.id === selectedLayer) return -1
                return 0
              })
              .map((layer: NodoLayer) => {
                // Estrai bounding box dalla viewBox del SVG per hit-area dinamica
                let hitX = -100, hitY = -100, hitW = 200, hitH = 200
                if (layer.svg) {
                  const vbMatch = layer.svg.match(/viewBox="([\d.\s-]+)"/)
                  if (vbMatch) {
                    const [vx, vy, vw, vh] = vbMatch[1].split(/\s+/).map(Number)
                    if (isFinite(vx) && isFinite(vw)) {
                      // Padding 10% per assicurarsi che tutto il profilo sia tappabile
                      const padW = vw * 0.1, padH = vh * 0.1
                      hitX = vx - padW; hitY = vy - padH
                      hitW = vw + padW * 2; hitH = vh + padH * 2
                    }
                  }
                }
                return (
                <g key={layer.id}
                  id={'nodo-layer-' + layer.id}
                  transform={`translate(${layer.x},${layer.y}) rotate(${layer.rotation}) scale(${layer.flipH ? -1 : 1},${layer.flipV ? -1 : 1})`}
                  onTouchStart={(e) => onLayerTouchStart(e, layer)}
                  onTouchMove={onLayerTouchMove}
                  onTouchEnd={onLayerTouchEnd}
                  onTouchCancel={onLayerTouchEnd}
                  style={{ cursor: 'pointer', touchAction: 'none' }}
                  opacity={selectedLayer === layer.id ? 1 : 0.7}
                >
                  {/* Rect invisibile dinamico: cattura touch su tutto il profilo */}
                  <rect x={hitX} y={hitY} width={hitW} height={hitH} fill="transparent" pointerEvents="all" />
                  <g dangerouslySetInnerHTML={{ __html: extractSVGContent(layer.svg) }} pointerEvents="none" />
                  {selectedLayer === layer.id && (
                    <rect x={hitX} y={hitY} width={hitW} height={hitH} fill="none"
                      stroke={DS.teal} strokeWidth={1.5 / zoom}
                      strokeDasharray={`${4 / zoom},${3 / zoom}`}
                      pointerEvents="none" />
                  )}
                </g>
                )
              })}

            {quotes.map((q: QuoteRef, i: number) => {
              const r = resolveQuote(q, editingNodo)
              const mx = (r.x1 + r.x2) / 2, my = (r.y1 + r.y2) / 2
              const fs = 14 / zoom
              return (
                <g key={`q${i}`}>
                  <circle cx={r.x1} cy={r.y1} r={2 / zoom} fill={DS.ink} />
                  <circle cx={r.x2} cy={r.y2} r={2 / zoom} fill={DS.ink} />
                  <line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={DS.ink} strokeWidth={0.7 / zoom} />
                  <rect x={mx - 32 / zoom} y={my - fs * 0.9} width={64 / zoom} height={fs * 1.6}
                    fill="rgba(255,255,255,.95)" rx={2 / zoom}
                    stroke={DS.ink} strokeWidth={0.3 / zoom} />
                  <text x={mx} y={my + fs * 0.3} textAnchor="middle"
                    fontSize={fs} fill={DS.ink} fontFamily={M} fontWeight="800">
                    {r.dist.toFixed(1)}
                  </text>
                </g>
              )
            })}

            {tool === 'quota' && hoverPt && (
              <g>
                <circle cx={hoverPt.x} cy={hoverPt.y} r={6 / zoom} fill={DS.red} opacity={0.9} />
                <circle cx={hoverPt.x} cy={hoverPt.y} r={12 / zoom} fill="none"
                  stroke={DS.red} strokeWidth={1 / zoom} opacity={0.5} />
              </g>
            )}
            {quotePt1 && (
              <circle cx={quotePt1.x} cy={quotePt1.y} r={6 / zoom} fill={DS.green} opacity={0.9} />
            )}
          </g>
        </svg>
      </div>

      {/* BOTTOM TOOLBAR */}
      <div style={{
        height: 58,
        background: DS.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '0 8px',
        flexShrink: 0,
        position: 'fixed',
        bottom: sheetState === 'collapsed' ? 52
              : sheetState === 'mid' ? '38vh'
              : '78vh',
        left: 0, right: 0,
        transition: 'bottom 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        zIndex: 105,
        borderTop: `1px solid ${DS.dark}`,
      }}>
        <ToolBtn icon="+" label="Profilo" onClick={onAddProfile} color={DS.teal} />
        <ToolBtn icon="✥" label="Sposta" active={tool === 'select'} onClick={() => setTool('select')} />
        <ToolBtn icon="📏" label="Quota" active={tool === 'quota'} onClick={() => { setTool('quota'); }} />
        <ToolBtn icon="🔍+" label="Zoom+" onClick={() => setZoom((z: number) => Math.min(50, z * 1.4))} />
        <ToolBtn icon="🔍−" label="Zoom−" onClick={() => setZoom((z: number) => Math.max(0.3, z / 1.4))} />
        <ToolBtn icon="⊕" label="Fit" onClick={() => { setZoom(3); setPanX(0); setPanY(0); }} />
        <ToolBtn icon="🔗" label="Lega" active={tool === 'link'} onClick={() => setTool('link')} />
      </div>

      {/* BOTTOM SHEET */}
      <NodiBottomSheet
        nodo={editingNodo}
        setNodo={setEditingNodo}
        selectedLayer={selectedLayer}
        setSelectedLayer={setSelectedLayer}
        quotes={quotes}
        setQuotes={setQuotes}
        onLayerAction={handleLayerAction}
        state={sheetState}
        setState={setSheetState}
        initialTab={sheetTab}
      />

      {/* CATALOG MODAL */}
      {showCatalog && (
        <NodiCatalogModal
          profili={profili}
          onSelect={onCatalogSelect}
          onClose={onCatalogClose}
        />
      )}
    </div>
  )
}

// ============ TOOL BUTTON BOTTOM BAR ============
function ToolBtn({ icon, label, onClick, active, color }: {
  icon: string; label: string; onClick: () => void; active?: boolean; color?: string
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, height: 46, borderRadius: 10, border: 'none',
      background: active ? (color || DS.teal) : 'transparent',
      color: active ? '#FFF' : (color || '#FFF'),
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 2,
    }}>
      <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3 }}>{label}</span>
    </button>
  )
}
