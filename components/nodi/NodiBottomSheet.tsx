// components/nodi/NodiBottomSheet.tsx
// Bottom sheet a 3 stati (chiuso/medio/full) con 3 tab.

'use client'

import React, { useState } from 'react'
import type { NodoLayer, NodoTecnico, QuoteRef } from '@/lib/nodi/nodi-types'
import { NODO_TIPI, GROUP_COLORS } from '@/lib/nodi/nodi-types'
import { resolveQuote } from '@/lib/nodi/nodi-geometry'

const DS = {
  teal: '#28A0A0', dark: '#156060', ink: '#0D1F1F',
  light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF',
  red: '#DC4444', green: '#1A9E73', blue: '#3B7FE0', muted: '#888',
}
const M = "'JetBrains Mono', monospace"

type SheetState = 'collapsed' | 'mid' | 'full'
type SheetTab = 'info' | 'profili' | 'quote' | 'azioni'

interface Props {
  nodo: NodoTecnico
  setNodo: (updater: (prev: NodoTecnico | null) => NodoTecnico | null) => void
  selectedLayer: string | null
  setSelectedLayer: (id: string | null) => void
  quotes: QuoteRef[]
  setQuotes: (q: QuoteRef[]) => void
  onLayerAction?: (layerId: string, action: string) => void
  // Stato sheet (controlled dal padre per evitare conflitti)
  state: SheetState
  setState: (s: SheetState) => void
  initialTab?: SheetTab
}

export default function NodiBottomSheet({
  nodo, setNodo, selectedLayer, setSelectedLayer,
  quotes, setQuotes, onLayerAction,
  state, setState, initialTab = 'info',
}: Props) {
  const [tab, setTab] = useState<SheetTab>(initialTab)

  React.useEffect(() => {
    if (state !== 'collapsed' && initialTab) setTab(initialTab)
  }, [initialTab, state])

  // Heights per stato
  const heights: Record<SheetState, string> = {
    collapsed: '52px',
    mid: '45vh',
    full: '88vh',
  }

  const layer = selectedLayer ? nodo.layers.find(l => l.id === selectedLayer) : null

  return (
    <div style={{
      position: 'fixed',
      left: 0, right: 0, bottom: 0,
      height: heights[state],
      background: DS.white,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderTop: `1px solid ${DS.border}`,
      boxShadow: '0 -6px 20px rgba(0,0,0,.12)',
      transition: 'height 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
      zIndex: 10002,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Drag handle - tap per espandere/chiudere */}
      <div
        onClick={() => setState(state === 'collapsed' ? 'mid' : state === 'mid' ? 'full' : 'collapsed')}
        style={{
          padding: '8px 0 6px',
          cursor: 'pointer',
          touchAction: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: DS.border, margin: '0 auto',
        }} />
      </div>

      {/* Header con tabs (sempre visibili) */}
      <div style={{
        display: 'flex', gap: 4,
        padding: '0 12px 8px',
        borderBottom: state !== 'collapsed' ? `1px solid ${DS.border}` : 'none',
        flexShrink: 0,
      }}>
        <SheetTabBtn label="Info"        active={tab === 'info'}    onClick={() => { setTab('info'); if (state === 'collapsed') setState('mid') }} />
        <SheetTabBtn label={`Profili (${nodo.layers.length})`} active={tab === 'profili'} onClick={() => { setTab('profili'); if (state === 'collapsed') setState('mid') }} />
        <SheetTabBtn label={`Quote (${quotes.length})`}        active={tab === 'quote'}   onClick={() => { setTab('quote'); if (state === 'collapsed') setState('mid') }} />
        {layer && (
          <SheetTabBtn label="Azioni" active={tab === 'azioni'} onClick={() => { setTab('azioni'); setState('mid') }} color={DS.blue} />
        )}
      </div>

      {/* Content scrollable */}
      {state !== 'collapsed' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 14,
          paddingBottom: 100,
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}>
          {tab === 'info'    && <TabInfo nodo={nodo} setNodo={setNodo} />}
          {tab === 'profili' && <TabProfili nodo={nodo} setNodo={setNodo} selectedLayer={selectedLayer} setSelectedLayer={setSelectedLayer} />}
          {tab === 'quote'   && <TabQuote nodo={nodo} quotes={quotes} setQuotes={setQuotes} />}
          {tab === 'azioni' && layer && <TabAzioni layer={layer} onAction={(a) => onLayerAction?.(layer.id, a)} />}
        </div>
      )}
    </div>
  )
}

// ============ TAB INFO ============
function TabInfo({ nodo, setNodo }: { nodo: NodoTecnico; setNodo: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Field label="Codice *" value={nodo.codice}     onChange={v => setNodo((p: any) => p ? { ...p, codice: v } : null)} />
      <Field label="Nome"     value={nodo.nome}        onChange={v => setNodo((p: any) => p ? { ...p, nome: v } : null)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Fornitore" value={nodo.fornitore} onChange={v => setNodo((p: any) => p ? { ...p, fornitore: v } : null)} />
        <Field label="Serie"     value={nodo.serie}     onChange={v => setNodo((p: any) => p ? { ...p, serie: v } : null)} />
      </div>
      <SelectField
        label="Tipo nodo"
        value={nodo.tipo_nodo}
        onChange={v => setNodo((p: any) => p ? { ...p, tipo_nodo: v } : null)}
        opts={NODO_TIPI.map(t => ({ v: t, l: t.replace(/_/g, ' ') }))}
      />
    </div>
  )
}

// ============ TAB PROFILI ============
function TabProfili({ nodo, setNodo, selectedLayer, setSelectedLayer }: any) {
  if (nodo.layers.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: DS.muted, fontSize: 12 }}>
        Nessun profilo. Tap “+” nella toolbar per aggiungere.
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {nodo.layers.map((l: NodoLayer) => {
        const isSel = selectedLayer === l.id
        const groupColor = l.groupId
          ? GROUP_COLORS[Math.abs(l.groupId.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)) % GROUP_COLORS.length]
          : null
        return (
          <div
            key={l.id}
            style={{
              borderRadius: 12,
              background: isSel ? DS.teal + '12' : DS.white,
              border: `1.5px solid ${isSel ? DS.teal : DS.border}`,
              overflow: 'hidden',
            }}
          >
            {/* Header card grande, tap per selezionare */}
            <div
              onClick={() => setSelectedLayer(isSel ? null : l.id)}
              style={{
                padding: 14,
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: 4, background: l.color, flexShrink: 0 }} />
              {groupColor && (
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: groupColor, border: '1px solid rgba(0,0,0,.15)' }} title="Legato" />
              )}
              <span style={{
                flex: 1, fontFamily: M, fontSize: 14, fontWeight: 700, color: DS.ink,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {l.codice}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setNodo((p: any) => p ? ({ ...p, layers: p.layers.map((x: NodoLayer) => x.id === l.id ? { ...x, visible: !x.visible } : x) }) : null)
                }}
                style={{
                  width: 38, height: 38, borderRadius: 8,
                  border: 'none', background: l.visible ? DS.teal + '15' : DS.light,
                  color: l.visible ? DS.teal : DS.muted,
                  fontSize: 20, cursor: 'pointer',
                }}
              >{l.visible ? '◉' : '◯'}</button>
            </div>

            {/* Area edit valori - solo se selezionato */}
            {isSel && (
              <div style={{
                padding: '0 14px 14px',
                borderTop: `1px solid ${DS.border}`,
                paddingTop: 12,
              }}>
                <div style={{ fontSize: 10, color: DS.muted, marginBottom: 8, letterSpacing: 0.5 }}>POSIZIONE E ROTAZIONE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <NumField label="X (mm)"   value={l.x}        onChange={v => setNodo((p: any) => p ? ({ ...p, layers: p.layers.map((x: NodoLayer) => x.id === l.id ? { ...x, x: v } : x) }) : null)} />
                  <NumField label="Y (mm)"   value={l.y}        onChange={v => setNodo((p: any) => p ? ({ ...p, layers: p.layers.map((x: NodoLayer) => x.id === l.id ? { ...x, y: v } : x) }) : null)} />
                  <NumField label="Rot (°)" value={l.rotation} onChange={v => setNodo((p: any) => p ? ({ ...p, layers: p.layers.map((x: NodoLayer) => x.id === l.id ? { ...x, rotation: v } : x) }) : null)} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============ TAB QUOTE ============
function TabQuote({ nodo, quotes, setQuotes }: { nodo: NodoTecnico; quotes: QuoteRef[]; setQuotes: (q: QuoteRef[]) => void }) {
  if (quotes.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: DS.muted, fontSize: 12 }}>
        Nessuna quota. Attiva strumento “quota” nella toolbar e tappa due punti sul canvas.
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={() => setQuotes([])}
        style={{
          alignSelf: 'flex-end', padding: '4px 10px', borderRadius: 6,
          border: `1px solid ${DS.red}40`, background: DS.red + '10',
          color: DS.red, fontSize: 10, fontWeight: 700, cursor: 'pointer',
        }}
      >Cancella tutte</button>
      {quotes.map((q, i) => {
        const r = resolveQuote(q, nodo)
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8,
            background: DS.light,
          }}>
            <span style={{ color: DS.red, fontFamily: M, fontWeight: 800, fontSize: 14 }}>{r.dist.toFixed(1)}</span>
            <span style={{ color: DS.muted, fontSize: 10 }}>mm</span>
            <span style={{ flex: 1, fontSize: 9, color: DS.muted }}>#{i + 1}</span>
            <button
              onClick={() => setQuotes(quotes.filter((_, j) => j !== i))}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: 'none', background: DS.red + '15', color: DS.red,
                fontSize: 16, cursor: 'pointer',
              }}
            >×</button>
          </div>
        )
      })}
    </div>
  )
}

// ============ TAB AZIONI (per layer selezionato) ============
function TabAzioni({ layer, onAction }: { layer: NodoLayer; onAction: (a: string) => void }) {
  const Btn = ({ a, label, color }: { a: string; label: string; color?: string }) => (
    <button
      onClick={() => onAction(a)}
      style={{
        padding: '12px 10px', borderRadius: 10, border: `1.5px solid ${color || DS.border}`,
        background: color ? color + '10' : DS.white,
        color: color || DS.ink,
        fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
      }}
    >{label}</button>
  )
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: DS.muted, letterSpacing: 1, marginBottom: 8 }}>
        AZIONI · {layer.codice}
      </div>
      <div style={{ fontSize: 10, color: DS.muted, fontFamily: M, marginBottom: 10 }}>
        X={layer.x.toFixed(1)} · Y={layer.y.toFixed(1)} · Rot={layer.rotation}°
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
        <Btn a="rot+90" label="↻ +90°" />
        <Btn a="rot-90" label="↺ -90°" />
        <Btn a="rot+45" label="↻ +45°" />
        <Btn a="rot+1"  label="↻ +1°" />
        <Btn a="rot-1"  label="↺ -1°" />
        <Btn a="reset"  label="Reset" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <Btn a="flipH" label={`Specchia ↔${layer.flipH ? ' ✓' : ''}`} color={layer.flipH ? DS.teal : undefined} />
        <Btn a="flipV" label={`Specchia ↕${layer.flipV ? ' ✓' : ''}`} color={layer.flipV ? DS.teal : undefined} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <Btn a="front" label="In primo piano" />
        <Btn a="back"  label="In fondo" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <Btn a="move"  label="Sposta di…" color={DS.blue} />
        <Btn a={layer.groupId ? 'unlink' : 'link'} label={layer.groupId ? 'Slega gruppo' : 'Lega con…'} color={layer.groupId ? DS.red : DS.blue} />
      </div>
      <Btn a="delete" label="Elimina" color={DS.red} />
    </div>
  )
}

// ============ helpers ============
function SheetTabBtn({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 4px', borderRadius: 8,
      border: 'none',
      background: active ? (color || DS.teal) : DS.light,
      color: active ? '#FFF' : DS.muted,
      fontSize: 11, fontWeight: 700, cursor: 'pointer',
    }}>{label}</button>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: DS.muted, marginBottom: 3 }}>{label}</div>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: `1.5px solid ${DS.border}`, background: DS.white,
          fontSize: 14, color: DS.ink, boxSizing: 'border-box',
        }}
      />
    </label>
  )
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9, color: DS.muted, marginBottom: 2 }}>{label}</div>
      <input
        type="number" inputMode="decimal"
        value={Math.round(value * 10) / 10}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{
          width: '100%', padding: '6px 4px', borderRadius: 6,
          border: `1px solid ${DS.border}`, background: DS.white,
          fontSize: 12, fontFamily: M, textAlign: 'center', boxSizing: 'border-box',
        }}
      />
    </label>
  )
}

function SelectField({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: { v: string; l: string }[] }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: DS.muted, marginBottom: 3 }}>{label}</div>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: `1.5px solid ${DS.border}`, background: DS.white,
          fontSize: 13, color: DS.ink, boxSizing: 'border-box',
        }}
      >
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  )
}
