// components/nodi/NodiTecniciPanelMobile.tsx
// MASTRO Nodi Tecnici - versione mobile.
// Stessa logica/algoritmi del desktop, UI riprogettata per touch a 380px.

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@supabase/supabase-js'
import type { NodoLayer, NodoTecnico, QuoteRef, ToolMode, RefPoint } from '@/lib/nodi/nodi-types'
import { LAYER_COLORS } from '@/lib/nodi/nodi-types'
import {
  transformPoint, getSnapPoints, findNearestSnap, projectOnSegment,
  resolveQuote, generateCombinedSVG, extractSVGContent, screenToCanvas,
  calcAlignedPosition, getLayerBBox,
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

  // Punti di riferimento (sticky, ancorati ai layer) - per snap e quotatura live durante drag
  const [refPoints, setRefPoints] = useState<RefPoint[]>([])
  // Quotatura LIVE durante drag: distanze dal bordo del layer trascinato a ogni RefPoint
  const [liveQuotes, setLiveQuotes] = useState<{ pointId: string; pointX: number; pointY: number; toX: number; toY: number; mm: number }[]>([])

  // Bottom sheet state
  const [sheetState, setSheetState] = useState<'collapsed' | 'mid' | 'full'>('collapsed')
  const [sheetTab, setSheetTab] = useState<'info' | 'profili' | 'quote' | 'azioni'>('info')

  // Categoria toolbar attiva (mini-menu sopra toolbar)
  const [toolCategory, setToolCategory] = useState<'add' | 'move' | 'measure' | 'view' | 'layer' | null>(null)

  // Mode "align con altro profilo"
  // Quando attivo, l'utente tappa un secondo profilo target → si apre AlignSheet
  const [alignMode, setAlignMode] = useState<{ sourceLayerId: string } | null>(null)
  const [alignSheet, setAlignSheet] = useState<{ sourceId: string; targetId: string } | null>(null)

  // Magic snap durante drag: badge che mostra "↔ 4mm" quando 2 profili si agganciano
  const [snapBadge, setSnapBadge] = useState<{ x: number; y: number; mm: number; dir: string } | null>(null)

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
    setRefPoints([])
    setLiveQuotes([])
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
        lato: p.lato || undefined,
      })),
    })
    setZoom(3); setPanX(0); setPanY(0)
    setSheetState('collapsed')
    // Carica refPoints e quotes salvati
    setRefPoints(Array.isArray(n.ref_points) ? n.ref_points : [])
    setQuotes(Array.isArray(n.quotes) ? n.quotes : [])
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
        lato: l.lato || null,
      })),
      ref_points: refPoints,
      quotes: quotes,
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

  // Applica allineamento: muove il source in modo che sia allineato al target
  const applyAlign = useCallback((sourceId: string, targetId: string, direction: 'left' | 'right' | 'top' | 'bottom', offset: number, align: 'start' | 'center' | 'end') => {
    if (!editingNodo) return
    const source = editingNodo.layers.find(l => l.id === sourceId)
    const target = editingNodo.layers.find(l => l.id === targetId)
    if (!source || !target) return
    const newPos = calcAlignedPosition(source, target, direction, offset, align)
    updateLayer(sourceId, { x: newPos.x, y: newPos.y })
    setAlignSheet(null)
    setSelectedLayer(sourceId)
  }, [editingNodo, updateLayer])

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
      case 'reset':
        // Reset totale: torna come da catalogo (no rotazione, no specchio)
        updateLayer(layerId, { rotation: 0, flipH: false, flipV: false })
        break
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
      case 'lato-INT':
        // INT = etichetta semantica "lato interno camera". Non tocca flipH (spetta a te).
        updateLayer(layerId, { lato: 'INT' })
        break
      case 'lato-EST':
        // EST = etichetta semantica "lato esterno camera". Non tocca flipH (spetta a te).
        updateLayer(layerId, { lato: 'EST' })
        break
      case 'nudge-left':  updateLayer(layerId, { x: layer.x - 1 }); break
      case 'nudge-right': updateLayer(layerId, { x: layer.x + 1 }); break
      case 'nudge-up':    updateLayer(layerId, { y: layer.y - 1 }); break
      case 'nudge-down':  updateLayer(layerId, { y: layer.y + 1 }); break
      case 'align-mode':
        // Entra in modalità "tappa un altro profilo target per allineare"
        setAlignMode({ sourceLayerId: layerId })
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

    // Tool POINTS: tap → crea un punto di riferimento sul layer/posizione più vicina
    if (tool === 'points' && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const raw = screenToCanvas(t.x, t.y, rect, panX, panY, zoom)
      // Snap automatico ai vertici dei profili (precisione)
      const snapped = findNearestSnap(raw.x, raw.y, editingNodo, zoom, 30)
      const pt = snapped || { x: raw.x, y: raw.y, layerId: '' }

      // Trova layer di riferimento (snap o più vicino)
      let bestLayerId = pt.layerId
      if (!bestLayerId && editingNodo) {
        let bestD = Infinity
        editingNodo.layers.filter(l => l.visible).forEach(l => {
          const d = Math.sqrt((raw.x - l.x) ** 2 + (raw.y - l.y) ** 2)
          if (d < bestD) { bestD = d; bestLayerId = l.id }
        })
      }
      if (!bestLayerId) return

      const layer = editingNodo!.layers.find(l => l.id === bestLayerId)
      if (!layer) return
      const offX = pt.x - layer.x
      const offY = pt.y - layer.y

      const newPoint: RefPoint = {
        id: 'rp_' + Date.now() + Math.random().toString(36).slice(2, 6),
        layerId: bestLayerId,
        offX, offY,
        label: 'P' + (refPoints.length + 1),
        color: DS.amber,
      }
      setRefPoints(prev => [...prev, newPoint])
      return
    }

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

    // Modalità ALIGN: tappi target → apri sheet allinea
    if (alignMode && alignMode.sourceLayerId !== layer.id) {
      setAlignSheet({ sourceId: alignMode.sourceLayerId, targetId: layer.id })
      setAlignMode(null)
      return
    }

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
    let newX = (dragRef.current.origLayerX || 0) + dx
    let newY = (dragRef.current.origLayerY || 0) + dy

    // ────── MAGIC SNAP: aggancia ai preset 0/4/6/8/12mm dei profili vicini ──
    const dragLayer = editingNodo.layers.find(l => l.id === dragRef.current.layerId)
    if (!dragLayer) return

    // Bbox del source con la nuova posizione (simulata)
    const simSource: NodoLayer = { ...dragLayer, x: newX, y: newY }
    const sBox = getLayerBBox(simSource)

    // ────── LIVE QUOTES: calcola distanza ai RefPoints + SNAP ai punti se < 3mm ──
    if (sBox && refPoints.length > 0) {
      const liveLines: { pointId: string; pointX: number; pointY: number; toX: number; toY: number; mm: number }[] = []
      let bestPointSnap: { dx: number; dy: number; pointId: string } | null = null
      let bestPointDist = 3 // mm: oltre 3mm dal punto, snap disattivo

      // Per ogni refPoint che NON è ancorato al layer in drag (sennò si muoverebbero insieme)
      refPoints.forEach(rp => {
        if (rp.layerId === dragLayer.id) return
        // Calcola posizione assoluta del punto
        const ancorLayer = editingNodo.layers.find(l => l.id === rp.layerId)
        if (!ancorLayer) return
        const px = ancorLayer.x + rp.offX
        const py = ancorLayer.y + rp.offY

        // Trova bordo del sBox più vicino al punto (per disegnare la linea live)
        const closeX = Math.max(sBox.x, Math.min(sBox.x + sBox.w, px))
        const closeY = Math.max(sBox.y, Math.min(sBox.y + sBox.h, py))
        const distMm = Math.sqrt((closeX - px) ** 2 + (closeY - py) ** 2)
        liveLines.push({ pointId: rp.id, pointX: px, pointY: py, toX: closeX, toY: closeY, mm: distMm })

        // Snap: se il bordo del sBox è < 3mm dal punto, scatta
        if (distMm < bestPointDist) {
          bestPointDist = distMm
          // Calcola dx/dy per portare il punto vicino dentro il sBox
          bestPointSnap = { dx: px - closeX, dy: py - closeY, pointId: rp.id }
        }
      })

      // Applica snap punto se trovato
      if (bestPointSnap) {
        newX += bestPointSnap.dx
        newY += bestPointSnap.dy
        // Aggiorna sBox dopo snap
        sBox.x += bestPointSnap.dx; sBox.y += bestPointSnap.dy
        sBox.cx += bestPointSnap.dx; sBox.cy += bestPointSnap.dy
        // Aggiorna anche le liveLines col nuovo posizionamento
        liveLines.forEach(l => {
          const closeX = Math.max(sBox.x, Math.min(sBox.x + sBox.w, l.pointX))
          const closeY = Math.max(sBox.y, Math.min(sBox.y + sBox.h, l.pointY))
          l.toX = closeX; l.toY = closeY
          l.mm = Math.sqrt((closeX - l.pointX) ** 2 + (closeY - l.pointY) ** 2)
        })
      }

      setLiveQuotes(liveLines)
    }

    if (sBox) {
      const SNAP_THRESHOLD = 25 // mm: oltre questa distanza dal target il snap si disattiva
      const PRESETS = [0, 4, 6, 8, 12]
      let bestSnap: { dx: number; dy: number; mm: number; dir: string; badgeX: number; badgeY: number } | null = null
      let bestDist = SNAP_THRESHOLD

      editingNodo.layers.forEach(other => {
        if (other.id === dragLayer.id || !other.visible) return
        const tBox = getLayerBBox(other)
        if (!tBox) return

        // Verticalmente sovrapposti? (per snap orizzontale)
        const yOverlap = !(sBox.y + sBox.h < tBox.y || sBox.y > tBox.y + tBox.h)
        // Orizzontalmente sovrapposti? (per snap verticale)
        const xOverlap = !(sBox.x + sBox.w < tBox.x || sBox.x > tBox.x + tBox.w)

        if (yOverlap) {
          // Snap a destra del target: bordo sx del source = bordo dx del target + offset
          const gapRight = sBox.x - (tBox.x + tBox.w)
          for (const p of PRESETS) {
            const dist = Math.abs(gapRight - p)
            if (dist < bestDist) {
              bestDist = dist
              bestSnap = {
                dx: p - gapRight, dy: 0, mm: p, dir: '→',
                badgeX: tBox.x + tBox.w + p / 2,
                badgeY: (Math.max(sBox.y, tBox.y) + Math.min(sBox.y + sBox.h, tBox.y + tBox.h)) / 2,
              }
            }
          }
          // Snap a sinistra del target: bordo dx del source = bordo sx del target - offset
          const gapLeft = tBox.x - (sBox.x + sBox.w)
          for (const p of PRESETS) {
            const dist = Math.abs(gapLeft - p)
            if (dist < bestDist) {
              bestDist = dist
              bestSnap = {
                dx: -(p - gapLeft), dy: 0, mm: p, dir: '←',
                badgeX: tBox.x - p / 2,
                badgeY: (Math.max(sBox.y, tBox.y) + Math.min(sBox.y + sBox.h, tBox.y + tBox.h)) / 2,
              }
            }
          }
        }
        if (xOverlap) {
          // Snap sotto il target
          const gapBottom = sBox.y - (tBox.y + tBox.h)
          for (const p of PRESETS) {
            const dist = Math.abs(gapBottom - p)
            if (dist < bestDist) {
              bestDist = dist
              bestSnap = {
                dx: 0, dy: p - gapBottom, mm: p, dir: '↓',
                badgeX: (Math.max(sBox.x, tBox.x) + Math.min(sBox.x + sBox.w, tBox.x + tBox.w)) / 2,
                badgeY: tBox.y + tBox.h + p / 2,
              }
            }
          }
          // Snap sopra il target
          const gapTop = tBox.y - (sBox.y + sBox.h)
          for (const p of PRESETS) {
            const dist = Math.abs(gapTop - p)
            if (dist < bestDist) {
              bestDist = dist
              bestSnap = {
                dx: 0, dy: -(p - gapTop), mm: p, dir: '↑',
                badgeX: (Math.max(sBox.x, tBox.x) + Math.min(sBox.x + sBox.w, tBox.x + tBox.w)) / 2,
                badgeY: tBox.y - p / 2,
              }
            }
          }
        }
      })

      if (bestSnap) {
        newX += bestSnap.dx
        newY += bestSnap.dy
        setSnapBadge({ x: bestSnap.badgeX, y: bestSnap.badgeY, mm: bestSnap.mm, dir: bestSnap.dir })
      } else {
        setSnapBadge(null)
      }
    }

    pendingPosRef.current = { layerId: dragRef.current.layerId, x: newX, y: newY }

    // Applica transform DIRETTAMENTE al DOM (no setState - mantiene touch capture)
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

  // Reset snap badge a touchEnd
  const onLayerTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    setSnapBadge(null)
    setLiveQuotes([])
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

  // ============ RENDER EDITOR VIEW (via Portal a body per uscire da wrapper con transform) ============
  if (typeof window === 'undefined') return null
  return createPortal(
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
      snapBadge={snapBadge}
      refPoints={refPoints} setRefPoints={setRefPoints}
      liveQuotes={liveQuotes}
      sheetState={sheetState} setSheetState={setSheetState}
      sheetTab={sheetTab} setSheetTab={setSheetTab}
      toolCategory={toolCategory} setToolCategory={setToolCategory}
      onCanvasTouchStart={onCanvasTouchStart}
      onCanvasTouchMove={onCanvasTouchMove}
      onCanvasTouchEnd={onCanvasTouchEnd}
      onLayerTouchStart={onLayerTouchStart}
      onLayerTouchMove={onLayerTouchMove}
      onLayerTouchEnd={onLayerTouchEnd}
      handleLayerAction={handleLayerAction}
      alignMode={alignMode} setAlignMode={setAlignMode}
      alignSheet={alignSheet} setAlignSheet={setAlignSheet}
      onApplyAlign={applyAlign}
      onAddProfile={() => setShowCatalog(true)}
      onSave={saveNodo}
      onClose={() => setEditingNodo(null)}
      showCatalog={showCatalog}
      profili={profili}
      onCatalogSelect={addLayerFromProfile}
      onCatalogClose={() => setShowCatalog(false)}
    />,
    document.body
  )
}

// ============ EDITOR VIEW ============
function EditorView(p: any) {
  // Al mount: nasconde TUTTI gli elementi fixed in fondo che non siano nostri (navbar mastro)
  React.useEffect(() => {
    const styleId = 'nodi-mobile-hide-shell'
    const existing = document.getElementById(styleId)
    if (!existing) {
      const style = document.createElement('style')
      style.id = styleId
      // Nasconde la bottom nav MASTRO durante editing nodi
      style.textContent = `
        body.nodi-editor-open *:not(.nodi-editor-portal):not(.nodi-editor-portal *) {
          /* niente */
        }
        /* Nasconde la BottomToolbar MASTRO durante editing */
        body.nodi-editor-open > div [style*="position:fixed"][style*="bottom:0"]:not(.nodi-editor-portal):not(.nodi-editor-portal *),
        body.nodi-editor-open > div [style*="position: fixed"][style*="bottom: 0"]:not(.nodi-editor-portal):not(.nodi-editor-portal *),
        body.nodi-editor-open [class*="bottom-nav" i]:not(.nodi-editor-portal):not(.nodi-editor-portal *),
        body.nodi-editor-open [class*="BottomNav" i]:not(.nodi-editor-portal):not(.nodi-editor-portal *),
        body.nodi-editor-open [class*="BottomToolbar" i]:not(.nodi-editor-portal):not(.nodi-editor-portal *) {
          display: none !important;
          visibility: hidden !important;
        }
        body.nodi-editor-open { overflow: hidden !important; }
      `
      document.head.appendChild(style)
    }
    document.body.classList.add('nodi-editor-open')
    return () => {
      document.body.classList.remove('nodi-editor-open')
    }
  }, [])

  const {
    editingNodo, setEditingNodo, zoom, setZoom, panX, setPanX, panY, setPanY,
    tool, setTool, selectedLayer, setSelectedLayer, svgRef,
    quotes, setQuotes, quotePt1, hoverPt, snapBadge,
    refPoints, setRefPoints, liveQuotes,
    sheetState, setSheetState, sheetTab, setSheetTab,
    toolCategory, setToolCategory,
    onCanvasTouchStart, onCanvasTouchMove, onCanvasTouchEnd,
    onLayerTouchStart, onLayerTouchMove, onLayerTouchEnd,
    handleLayerAction,
    alignMode, setAlignMode, alignSheet, setAlignSheet, onApplyAlign,
    onAddProfile, onSave, onClose,
    showCatalog, profili, onCatalogSelect, onCatalogClose,
  } = p

  // Canvas occupa lo spazio disponibile (toolbar + sheet sono fixed sopra)
  return (
    <div className="nodi-editor-portal" style={{
      position: 'fixed',
      inset: 0,
      background: DS.light,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 9999,
      paddingBottom: sheetState === 'collapsed' ? 64 + 52
                    : sheetState === 'mid' ? `calc(64px + 55vh)`
                    : `calc(64px + 92vh)`,
      transition: 'padding-bottom 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
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
      {(tool === 'quota' || tool === 'link' || tool === 'points' || alignMode) && (
        <div style={{
          padding: '6px 12px',
          background: alignMode ? DS.teal + '15' : tool === 'quota' ? DS.red + '15' : tool === 'points' ? DS.amber + '15' : DS.blue + '15',
          color: alignMode ? DS.teal : tool === 'quota' ? DS.red : tool === 'points' ? DS.amber : DS.blue,
          fontSize: 11, fontWeight: 700, textAlign: 'center',
          flexShrink: 0,
        }}>
          {alignMode
            ? '➡ Tappa il profilo target per allineare'
            : tool === 'points'
            ? `🎯 Tappa sul canvas per piazzare punti (${refPoints.length} attivi) · I profili si aggancieranno entro 3mm`
            : tool === 'quota'
            ? (quotePt1 ? '➡ Tappa il SECONDO punto' : '➡ Tappa il PRIMO punto da quotare')
            : selectedLayer ? '➡ Tappa un altro profilo per legarlo' : '➡ Seleziona il primo profilo'}
          <button onClick={() => { setTool('select'); setAlignMode(null); }} style={{
            marginLeft: 12, padding: '2px 8px', borderRadius: 4, border: 'none',
            background: '#FFF', color: DS.ink, fontSize: 10, fontWeight: 700, cursor: 'pointer',
          }}>×</button>
        </div>
      )}

      {/* CANVAS */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
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
                  {/* Etichetta lato INT/EST in angolo basso destra del bbox */}
                  {layer.lato && (
                    <g pointerEvents="none">
                      <rect x={hitX + hitW - 30 / zoom} y={hitY + hitH - 16 / zoom}
                        width={28 / zoom} height={14 / zoom} rx={2 / zoom}
                        fill={layer.lato === 'INT' ? DS.blue : DS.amber}
                        opacity={0.85}
                      />
                      <text x={hitX + hitW - 16 / zoom} y={hitY + hitH - 6 / zoom}
                        textAnchor="middle" fontSize={9 / zoom}
                        fill="#FFF" fontFamily={M} fontWeight="800">
                        {layer.lato}
                      </text>
                    </g>
                  )}
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

            {/* REF POINTS - marker permanenti ancorati ai layer */}
            {refPoints.map((rp: RefPoint) => {
              const layer = editingNodo.layers.find((l: NodoLayer) => l.id === rp.layerId)
              if (!layer) return null
              const px = layer.x + rp.offX
              const py = layer.y + rp.offY
              return (
                <g key={rp.id} pointerEvents="none">
                  <circle cx={px} cy={py} r={4 / zoom} fill={rp.color || DS.amber} stroke="#FFF" strokeWidth={1 / zoom} />
                  <circle cx={px} cy={py} r={9 / zoom} fill="none" stroke={rp.color || DS.amber} strokeWidth={0.6 / zoom} opacity={0.6} />
                  <rect x={px + 6 / zoom} y={py - 8 / zoom} width={(rp.label.length * 7 + 6) / zoom} height={14 / zoom} rx={2 / zoom}
                    fill={rp.color || DS.amber} opacity={0.95} />
                  <text x={px + 9 / zoom} y={py + 2 / zoom} fontSize={10 / zoom} fontFamily={M} fontWeight="800" fill="#FFF">
                    {rp.label}
                  </text>
                </g>
              )
            })}

            {/* LIVE QUOTES - linee tratteggiate dai bordi del layer in drag ai RefPoints */}
            {liveQuotes.map((lq: any) => {
              const isSnapped = lq.mm < 0.5
              const col = isSnapped ? DS.green : DS.teal
              return (
                <g key={'lq-' + lq.pointId} pointerEvents="none">
                  <line x1={lq.pointX} y1={lq.pointY} x2={lq.toX} y2={lq.toY}
                    stroke={col} strokeWidth={1 / zoom}
                    strokeDasharray={isSnapped ? undefined : `${4 / zoom},${2 / zoom}`}
                  />
                  <rect
                    x={(lq.pointX + lq.toX) / 2 - 22 / zoom}
                    y={(lq.pointY + lq.toY) / 2 - 8 / zoom}
                    width={44 / zoom} height={16 / zoom}
                    rx={3 / zoom}
                    fill={col} opacity={0.95}
                  />
                  <text
                    x={(lq.pointX + lq.toX) / 2}
                    y={(lq.pointY + lq.toY) / 2 + 3 / zoom}
                    textAnchor="middle"
                    fontSize={10 / zoom} fontFamily={M} fontWeight="800" fill="#FFF"
                  >{lq.mm.toFixed(1)}mm</text>
                </g>
              )
            })}

            {/* MAGIC SNAP BADGE durante drag - mostra distanza agganciata */}
            {snapBadge && (
              <g pointerEvents="none">
                <rect
                  x={snapBadge.x - 22 / zoom} y={snapBadge.y - 12 / zoom}
                  width={44 / zoom} height={20 / zoom}
                  rx={4 / zoom}
                  fill={DS.amber} opacity={0.95}
                />
                <text
                  x={snapBadge.x} y={snapBadge.y + 4 / zoom}
                  textAnchor="middle"
                  fontSize={12 / zoom} fontFamily={M} fontWeight="800" fill="#FFF"
                >{snapBadge.dir} {snapBadge.mm}mm</text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* MINI-MENU CATEGORIA SOPRA TOOLBAR */}
      {toolCategory && (
        <div
          onClick={() => setToolCategory(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,31,31,0.5)',
            zIndex: 10500,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: 8, right: 8,
              bottom: 76,
              background: DS.white,
              borderRadius: 16,
              padding: 14,
              boxShadow: '0 -10px 30px rgba(0,0,0,0.25)',
              maxHeight: '70vh',
              overflowY: 'auto',
              zIndex: 10501,
            }}
          >
            <ToolMenu
              category={toolCategory}
              tool={tool}
              setTool={setTool}
              selectedLayer={selectedLayer}
              editingNodo={editingNodo}
              onAddProfile={() => { setToolCategory(null); onAddProfile() }}
              onClose={() => setToolCategory(null)}
              setZoom={setZoom}
              setPanX={setPanX}
              setPanY={setPanY}
              zoom={zoom}
              setQuotes={setQuotes}
              quotes={quotes}
              refPoints={refPoints}
              setRefPoints={setRefPoints}
              handleLayerAction={(a: string) => {
                if (selectedLayer) handleLayerAction(selectedLayer, a)
                setToolCategory(null)
              }}
            />
          </div>
        </div>
      )}

      {/* BOTTOM TOOLBAR — 5 categorie */}
      <div style={{
        height: 64,
        background: DS.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '0 8px',
        flexShrink: 0,
        position: 'fixed',
        bottom: sheetState === 'collapsed' ? 52
              : sheetState === 'mid' ? '55vh'
              : '92vh',
        left: 0, right: 0,
        transition: 'bottom 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        zIndex: 10200,
        borderTop: `1px solid ${DS.dark}`,
      }}>
        <CatBtn
          icon="+"
          label="Aggiungi"
          color={DS.teal}
          active={toolCategory === 'add'}
          onClick={() => { setSheetState('collapsed'); setToolCategory(toolCategory === 'add' ? null : 'add') }}
        />
        <CatBtn
          icon="✥"
          label="Sposta"
          active={toolCategory === 'move' || tool === 'select'}
          onClick={() => { setSheetState('collapsed'); setToolCategory(toolCategory === 'move' ? null : 'move') }}
        />
        <CatBtn
          icon="📏"
          label="Misure"
          active={toolCategory === 'measure' || tool === 'quota'}
          color={tool === 'quota' ? DS.red : undefined}
          onClick={() => { setSheetState('collapsed'); setToolCategory(toolCategory === 'measure' ? null : 'measure') }}
        />
        <CatBtn
          icon="🔍"
          label="Vista"
          active={toolCategory === 'view'}
          onClick={() => { setSheetState('collapsed'); setToolCategory(toolCategory === 'view' ? null : 'view') }}
        />
        <CatBtn
          icon="☰"
          label="Layer"
          active={toolCategory === 'layer'}
          color={selectedLayer ? DS.blue : undefined}
          onClick={() => { setSheetState('collapsed'); setToolCategory(toolCategory === 'layer' ? null : 'layer') }}
        />
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
        setState={(s: any) => { if (s !== 'collapsed') setToolCategory(null); setSheetState(s) }}
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

      {/* ALIGN SHEET - mostra controlli direzione/offset quando hai scelto source+target */}
      {alignSheet && (
        <AlignSheet
          source={editingNodo.layers.find((l: NodoLayer) => l.id === alignSheet.sourceId)}
          target={editingNodo.layers.find((l: NodoLayer) => l.id === alignSheet.targetId)}
          onApply={(dir: any, offset: number, align: any) =>
            onApplyAlign(alignSheet.sourceId, alignSheet.targetId, dir, offset, align)
          }
          onClose={() => setAlignSheet(null)}
        />
      )}
    </div>
  )
}

// ============ ALIGN SHEET (mini-pannello allineamento) ============
function AlignSheet({ source, target, onApply, onClose }: {
  source: NodoLayer; target: NodoLayer;
  onApply: (dir: 'left' | 'right' | 'top' | 'bottom', offset: number, align: 'start' | 'center' | 'end') => void;
  onClose: () => void;
}) {
  const [direction, setDirection] = useState<'left' | 'right' | 'top' | 'bottom'>('right')
  const [offset, setOffset] = useState<number>(0)
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('center')

  // Preset offset comuni nei serramenti
  const PRESETS = [
    { v: 0,  label: 'Combaciante',     sub: 'Bordo a bordo' },
    { v: 4,  label: 'Guarn. PVC 4mm',  sub: 'Guarnizione battuta standard' },
    { v: 6,  label: 'Guarn. PVC 6mm',  sub: 'Guarnizione battuta maggiorata' },
    { v: 8,  label: 'EPDM 8mm',        sub: 'Gomma battuta esterna' },
    { v: 12, label: 'Canalina 12mm',   sub: 'Canalina vetrocamera' },
  ]

  // Preview SVG: 2 quadrati che mostrano la disposizione direzione/align
  const previewW = 200
  const previewH = 100
  const targetSize = 32
  const sourceSize = 24
  let sx = 0, sy = 0
  const tx = previewW / 2 - targetSize / 2
  const ty = previewH / 2 - targetSize / 2
  const offsetVisual = Math.min(20, offset / 2 + 6) // visualizziamo offset proporzionalmente
  switch (direction) {
    case 'left':   sx = tx - sourceSize - offsetVisual; sy = align === 'start' ? ty : align === 'end' ? ty + targetSize - sourceSize : ty + (targetSize - sourceSize) / 2; break
    case 'right':  sx = tx + targetSize + offsetVisual; sy = align === 'start' ? ty : align === 'end' ? ty + targetSize - sourceSize : ty + (targetSize - sourceSize) / 2; break
    case 'top':    sy = ty - sourceSize - offsetVisual; sx = align === 'start' ? tx : align === 'end' ? tx + targetSize - sourceSize : tx + (targetSize - sourceSize) / 2; break
    case 'bottom': sy = ty + targetSize + offsetVisual; sx = align === 'start' ? tx : align === 'end' ? tx + targetSize - sourceSize : tx + (targetSize - sourceSize) / 2; break
  }

  const DirBtn = ({ d, icon, label }: { d: 'left' | 'right' | 'top' | 'bottom'; icon: string; label: string }) => (
    <button
      onClick={() => setDirection(d)}
      style={{
        padding: '14px 8px', borderRadius: 10,
        border: `2px solid ${direction === d ? DS.teal : DS.border}`,
        background: direction === d ? DS.teal + '15' : DS.white,
        color: direction === d ? DS.teal : DS.ink,
        fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 4 }}>{icon}</div>
      {label}
    </button>
  )

  const AlignBtn = ({ a, label }: { a: 'start' | 'center' | 'end'; label: string }) => (
    <button
      onClick={() => setAlign(a)}
      style={{
        padding: '10px 6px', borderRadius: 8,
        border: `1.5px solid ${align === a ? DS.teal : DS.border}`,
        background: align === a ? DS.teal + '15' : DS.white,
        color: align === a ? DS.teal : DS.ink,
        fontSize: 11, fontWeight: 700, cursor: 'pointer',
      }}
    >{label}</button>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(13,31,31,0.55)',
      zIndex: 10500,
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: DS.white,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 16, paddingBottom: 28,
        maxHeight: '92vh', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: DS.ink }}>Allinea profili</div>
            <div style={{ fontSize: 11, color: DS.muted, fontFamily: M, marginTop: 2 }}>
              Sposto <span style={{ color: DS.teal, fontWeight: 800 }}>{source.codice}</span>
              {' '}rispetto a <span style={{ color: DS.blue, fontWeight: 800 }}>{target.codice}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: DS.light, border: 'none',
            width: 38, height: 38, borderRadius: 10,
            color: DS.ink, fontSize: 20, cursor: 'pointer', fontWeight: 700,
          }}>×</button>
        </div>

        {/* PREVIEW */}
        <div style={{
          background: DS.light, borderRadius: 12, padding: 10,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          marginBottom: 16, height: 120,
        }}>
          <svg width={previewW} height={previewH} viewBox={`0 0 ${previewW} ${previewH}`}>
            {/* Target (riferimento) */}
            <rect x={tx} y={ty} width={targetSize} height={targetSize}
              fill={DS.blue + '20'} stroke={DS.blue} strokeWidth="1.5" rx="2" />
            <text x={tx + targetSize / 2} y={ty + targetSize / 2 + 3} textAnchor="middle"
              fontSize="9" fill={DS.blue} fontWeight="800" fontFamily={M}>TARGET</text>

            {/* Source (da spostare) */}
            <rect x={sx} y={sy} width={sourceSize} height={sourceSize}
              fill={DS.teal + '30'} stroke={DS.teal} strokeWidth="1.5" rx="2" />
            <text x={sx + sourceSize / 2} y={sy + sourceSize / 2 + 3} textAnchor="middle"
              fontSize="9" fill={DS.teal} fontWeight="800" fontFamily={M}>{source.codice.substring(0, 6)}</text>

            {/* Linea offset se offset > 0 */}
            {offset > 0 && offsetVisual > 4 && (() => {
              let lx1 = 0, ly1 = 0, lx2 = 0, ly2 = 0
              switch (direction) {
                case 'right': lx1 = tx + targetSize; lx2 = sx; ly1 = ly2 = ty + targetSize / 2; break
                case 'left':  lx1 = sx + sourceSize; lx2 = tx; ly1 = ly2 = ty + targetSize / 2; break
                case 'bottom':ly1 = ty + targetSize; ly2 = sy; lx1 = lx2 = tx + targetSize / 2; break
                case 'top':   ly1 = sy + sourceSize; ly2 = ty; lx1 = lx2 = tx + targetSize / 2; break
              }
              return (
                <g>
                  <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={DS.amber} strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x={(lx1 + lx2) / 2} y={(ly1 + ly2) / 2 - 6} textAnchor="middle"
                    fontSize="10" fill={DS.amber} fontWeight="800" fontFamily={M}>{offset}mm</text>
                </g>
              )
            })()}
          </svg>
        </div>

        {/* DIREZIONE */}
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: DS.muted, marginBottom: 8 }}>
          DOVE METTERE <span style={{ color: DS.teal }}>{source.codice}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
          <DirBtn d="top"    icon="↑" label="Sopra" />
          <DirBtn d="bottom" icon="↓" label="Sotto" />
          <DirBtn d="left"   icon="←" label="Sinistra" />
          <DirBtn d="right"  icon="→" label="Destra" />
        </div>

        {/* ALLINEAMENTO PERPENDICOLARE */}
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: DS.muted, marginBottom: 8 }}>
          ALLINEAMENTO {direction === 'left' || direction === 'right' ? 'VERTICALE' : 'ORIZZONTALE'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
          <AlignBtn a="start"  label={direction === 'left' || direction === 'right' ? '⤒ Alto' : '⇤ Sx'} />
          <AlignBtn a="center" label="┼ Centro" />
          <AlignBtn a="end"    label={direction === 'left' || direction === 'right' ? '⤓ Basso' : '⇥ Dx'} />
        </div>

        {/* OFFSET PRESETS */}
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: DS.muted, marginBottom: 8 }}>
          DISTANZA TRA I PROFILI
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {PRESETS.map(p => (
            <button
              key={p.v}
              onClick={() => setOffset(p.v)}
              style={{
                padding: '12px 14px', borderRadius: 10,
                border: `2px solid ${offset === p.v ? DS.teal : DS.border}`,
                background: offset === p.v ? DS.teal + '12' : DS.white,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                textAlign: 'left',
              }}
            >
              <div style={{
                fontSize: 16, fontWeight: 800,
                color: offset === p.v ? DS.teal : DS.ink,
                fontFamily: M,
                width: 56, textAlign: 'center',
              }}>{p.v} mm</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: DS.ink }}>{p.label}</div>
                <div style={{ fontSize: 10, color: DS.muted, marginTop: 1 }}>{p.sub}</div>
              </div>
              {offset === p.v && <span style={{ color: DS.teal, fontSize: 18, fontWeight: 800 }}>✓</span>}
            </button>
          ))}
        </div>

        {/* OFFSET CUSTOM */}
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: DS.muted, marginBottom: 6 }}>
          OPPURE INSERISCI MM ESATTI
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <input
            type="number" inputMode="decimal"
            value={offset}
            onChange={e => setOffset(parseFloat(e.target.value) || 0)}
            style={{
              flex: 1, padding: '14px', borderRadius: 10,
              border: `2px solid ${DS.border}`, background: DS.light,
              fontSize: 18, fontFamily: M, fontWeight: 800,
              textAlign: 'center', color: DS.ink, boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <button
            onClick={() => setOffset(Math.max(0, offset - 1))}
            style={{
              width: 50, borderRadius: 10, border: `2px solid ${DS.border}`,
              background: DS.white, fontSize: 22, cursor: 'pointer', fontWeight: 800,
            }}
          >−</button>
          <button
            onClick={() => setOffset(offset + 1)}
            style={{
              width: 50, borderRadius: 10, border: `2px solid ${DS.border}`,
              background: DS.white, fontSize: 22, cursor: 'pointer', fontWeight: 800,
            }}
          >+</button>
        </div>

        {/* APPLY */}
        <button
          onClick={() => onApply(direction, offset, align)}
          style={{
            width: '100%', padding: 16, borderRadius: 14,
            border: 'none', background: DS.teal, color: '#FFF',
            fontSize: 15, fontWeight: 800, letterSpacing: 0.8,
            cursor: 'pointer',
            boxShadow: `0 4px 0 0 ${DS.dark}`,
          }}
        >✓ ALLINEA ORA</button>
      </div>
    </div>
  )
}

// ============ CAT BUTTON (toolbar bottom 5 categorie) ============
function CatBtn({ icon, label, onClick, active, color }: {
  icon: string; label: string; onClick: () => void; active?: boolean; color?: string
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, height: 52, borderRadius: 12, border: 'none',
      background: active ? (color || DS.teal) : 'transparent',
      color: active ? '#FFF' : (color || '#FFF'),
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 2,
      transition: 'background 0.15s',
    }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3 }}>{label}</span>
    </button>
  )
}

// ============ TOOL MENU (mini-menu per categoria) ============
function ToolMenu({ category, tool, setTool, selectedLayer, editingNodo, onAddProfile, onClose, setZoom, setPanX, setPanY, zoom, setQuotes, quotes, refPoints, setRefPoints, handleLayerAction }: any) {
  const Item = ({ icon, label, sub, onClick, color, disabled }: { icon: string; label: string; sub?: string; onClick: () => void; color?: string; disabled?: boolean }) => (
    <button
      onClick={() => { if (!disabled) onClick() }}
      disabled={disabled}
      style={{
        width: '100%', padding: '12px 14px', borderRadius: 10,
        border: `1.5px solid ${color || DS.border}`,
        background: disabled ? DS.light : (color ? color + '10' : DS.white),
        color: disabled ? DS.muted : (color || DS.ink),
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 6, textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1, width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: DS.muted, marginTop: 1 }}>{sub}</div>}
      </div>
    </button>
  )

  const layer = selectedLayer ? editingNodo?.layers.find((l: NodoLayer) => l.id === selectedLayer) : null
  const sectionTitle = (text: string, color = DS.muted) => (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color, marginTop: 8, marginBottom: 6, padding: '0 4px' }}>{text}</div>
  )

  if (category === 'add') {
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: DS.ink, marginBottom: 10 }}>+ AGGIUNGI AL NODO</div>
        <Item icon="🪟" label="Profilo / Vetro / Pannello" sub="Dal catalogo aziendale" onClick={onAddProfile} color={DS.teal} />
      </div>
    )
  }

  if (category === 'move') {
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: DS.ink, marginBottom: 10 }}>✥ SPOSTA</div>
        {sectionTitle('MODALITÀ ATTIVA')}
        <Item icon="✥" label="Trascina libero"   sub="Tocca e sposta i profili nel canvas" onClick={() => { setTool('select'); onClose() }} color={tool === 'select' ? DS.teal : undefined} />
        {sectionTitle('SUL PROFILO SELEZIONATO', layer ? DS.teal : DS.muted)}
        <Item icon="↔↕" label="Allinea con altro profilo" sub={layer ? `Sposta ${layer.codice} accanto a un target` : 'Seleziona prima un profilo'} onClick={() => handleLayerAction('align-mode')} disabled={!layer} color={DS.teal} />
        {layer && (
          <>
            {sectionTitle('SPOSTAMENTO PRECISO')}
            <Item icon="←" label="-1 mm orizzontale" sub={`X = ${layer.x.toFixed(1)} → ${(layer.x - 1).toFixed(1)}`} onClick={() => { handleLayerAction('nudge-left') }} />
            <Item icon="→" label="+1 mm orizzontale" sub={`X = ${layer.x.toFixed(1)} → ${(layer.x + 1).toFixed(1)}`} onClick={() => { handleLayerAction('nudge-right') }} />
            <Item icon="↑" label="-1 mm verticale"   sub={`Y = ${layer.y.toFixed(1)} → ${(layer.y - 1).toFixed(1)}`} onClick={() => { handleLayerAction('nudge-up') }} />
            <Item icon="↓" label="+1 mm verticale"   sub={`Y = ${layer.y.toFixed(1)} → ${(layer.y + 1).toFixed(1)}`} onClick={() => { handleLayerAction('nudge-down') }} />
          </>
        )}
      </div>
    )
  }

  if (category === 'measure') {
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: DS.ink, marginBottom: 10 }}>📏 MISURE & PUNTI</div>
        {sectionTitle('PUNTI DI RIFERIMENTO', DS.amber)}
        <Item icon="🎯" label={tool === 'points' ? 'Disattiva punti' : 'Aggiungi punti X/Y'}
          sub="Tappa il canvas per posizionare punti sticky · Snap automatico ai vertici · I punti seguono i profili"
          onClick={() => { setTool(tool === 'points' ? 'select' : 'points'); onClose() }}
          color={tool === 'points' ? DS.amber : DS.teal} />
        {refPoints && refPoints.length > 0 && (
          <Item icon="🗑" label={`Cancella tutti i punti (${refPoints.length})`}
            sub="Rimuove tutti i punti di riferimento"
            onClick={() => { if (confirm(`Cancellare ${refPoints.length} punti?`)) { setRefPoints([]); onClose() } }}
            color={DS.red} />
        )}
        {sectionTitle('STRUMENTO QUOTA')}
        <Item icon="📏" label={tool === 'quota' ? 'Disattiva quota' : 'Attiva quota'} sub="Tappa 2 punti sul canvas per misurarli" onClick={() => { setTool(tool === 'quota' ? 'select' : 'quota'); onClose() }} color={tool === 'quota' ? DS.red : DS.teal} />
        {quotes.length > 0 && (
          <>
            {sectionTitle('GESTIONE QUOTE')}
            <Item icon="🗑" label={`Cancella tutte le quote (${quotes.length})`} sub="Operazione non reversibile" onClick={() => { if (confirm('Cancellare tutte le quote?')) { setQuotes([]); onClose() } }} color={DS.red} />
          </>
        )}
      </div>
    )
  }

  if (category === 'view') {
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: DS.ink, marginBottom: 10 }}>🔍 VISTA</div>
        {sectionTitle('ZOOM')}
        <Item icon="🔍+" label="Zoom in (+40%)" sub={`${Math.round(zoom * 100)}% → ${Math.round(zoom * 1.4 * 100)}%`} onClick={() => setZoom((z: number) => Math.min(50, z * 1.4))} />
        <Item icon="🔍−" label="Zoom out (-40%)" sub={`${Math.round(zoom * 100)}% → ${Math.round(zoom / 1.4 * 100)}%`} onClick={() => setZoom((z: number) => Math.max(0.3, z / 1.4))} />
        {sectionTitle('PRESET')}
        <Item icon="⊕" label="Centra e adatta vista" sub="Reset zoom 300% e posizione canvas" onClick={() => { setZoom(3); setPanX(0); setPanY(0); onClose() }} />
        <Item icon="🔎" label="Zoom 100%" sub="Vista 1:1 (mm reali)" onClick={() => { setZoom(1); onClose() }} />
        <Item icon="🔍" label="Zoom 1000%" sub="Massimo dettaglio per snap precisi" onClick={() => { setZoom(10); onClose() }} />
      </div>
    )
  }

  if (category === 'layer') {
    if (!layer) {
      return (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: DS.ink, marginBottom: 10 }}>☰ AZIONI LAYER</div>
          <div style={{ padding: 30, textAlign: 'center', color: DS.muted, fontSize: 12 }}>
            Seleziona prima un profilo nel canvas o nel pannello “Profili”.
          </div>
        </div>
      )
    }
    const lato = layer.lato || 'INT'
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: DS.ink, marginBottom: 4 }}>☰ AZIONI · {layer.codice}</div>
        <div style={{ fontSize: 10, color: DS.muted, fontFamily: M, marginBottom: 8 }}>
          X={layer.x.toFixed(1)} · Y={layer.y.toFixed(1)} · Rot={layer.rotation}° · Lato={lato}
        </div>
        {sectionTitle('LATO PROFILO (interno/esterno)', DS.blue)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          <button
            onClick={() => handleLayerAction('lato-INT')}
            style={{
              padding: 14, borderRadius: 10,
              border: `2px solid ${lato === 'INT' ? DS.blue : DS.border}`,
              background: lato === 'INT' ? DS.blue + '15' : DS.white,
              color: lato === 'INT' ? DS.blue : DS.ink,
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}>🏠 INT</button>
          <button
            onClick={() => handleLayerAction('lato-EST')}
            style={{
              padding: 14, borderRadius: 10,
              border: `2px solid ${lato === 'EST' ? DS.amber : DS.border}`,
              background: lato === 'EST' ? DS.amber + '15' : DS.white,
              color: lato === 'EST' ? DS.amber : DS.ink,
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
            }}>🌤️ EST</button>
        </div>
        {sectionTitle('ALLINEA CON ALTRO PROFILO', DS.teal)}
        <Item icon="↔↕" label="Tappa target → allinea" sub="Allineamento preciso con offset mm" onClick={() => handleLayerAction('align-mode')} color={DS.teal} />
        {sectionTitle('ROTAZIONE')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
          <SmallActionBtn label="↻ +90°" onClick={() => handleLayerAction('rot+90')} />
          <SmallActionBtn label="↺ -90°" onClick={() => handleLayerAction('rot-90')} />
          <SmallActionBtn label="↻ +45°" onClick={() => handleLayerAction('rot+45')} />
          <SmallActionBtn label="↻ +1°"  onClick={() => handleLayerAction('rot+1')} />
          <SmallActionBtn label="↺ -1°"  onClick={() => handleLayerAction('rot-1')} />
          <SmallActionBtn label="Reset"   onClick={() => handleLayerAction('reset')} />
        </div>
        {sectionTitle('SPECCHIO')}
        <div style={{ fontSize: 9, color: DS.muted, marginBottom: 6, fontStyle: 'italic' }}>
          Specchia il profilo se vuoi vederlo dall'altro lato. INT/EST sono solo etichette, non specchiano.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          <SmallActionBtn label={`↔ Orizz${layer.flipH ? ' ✓' : ''}`} onClick={() => handleLayerAction('flipH')} active={layer.flipH} />
          <SmallActionBtn label={`↕ Vert${layer.flipV ? ' ✓' : ''}`}  onClick={() => handleLayerAction('flipV')} active={layer.flipV} />
        </div>
        {sectionTitle('Z-ORDER')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          <SmallActionBtn label="↑ Primo piano" onClick={() => handleLayerAction('front')} />
          <SmallActionBtn label="↓ In fondo"    onClick={() => handleLayerAction('back')} />
        </div>
        {sectionTitle('GRUPPO')}
        <Item
          icon="🔗" label={layer.groupId ? 'Slega dal gruppo' : 'Lega con altro profilo'}
          sub={layer.groupId ? 'Si muoveranno separatamente' : 'Si muoveranno insieme'}
          onClick={() => handleLayerAction(layer.groupId ? 'unlink' : 'link')}
          color={layer.groupId ? DS.red : DS.blue}
        />
        <Item icon="🗑" label="Elimina dal nodo" sub="Rimuove questo profilo" onClick={() => handleLayerAction('delete')} color={DS.red} />
      </div>
    )
  }

  return null
}

// ============ Small action button ============
function SmallActionBtn({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: '12px 8px', borderRadius: 10,
      border: `1.5px solid ${active ? DS.teal : DS.border}`,
      background: active ? DS.teal + '15' : DS.white,
      color: active ? DS.teal : DS.ink,
      fontSize: 12, fontWeight: 700, cursor: 'pointer',
    }}>{label}</button>
  )
}
