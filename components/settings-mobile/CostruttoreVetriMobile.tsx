// components/settings-mobile/CostruttoreVetriMobile.tsx
// Costruttore Vetri mobile - calcoli reali EN 673/410/12758, presets, consigli, zone climatiche

'use client'

import React, { useState, useMemo } from 'react'
import { T, numStyle } from '../home-mobile/HomeUI'
import {
  VetroLayer, LayerType, calcolaVetro, generaSvgSezione,
  PRESETS, ZONE_CLIMATICHE, gid,
} from '@/lib/vetri-engine'

type EditingLayer = { layer: VetroLayer; idx: number } | null

interface Props {
  initialLayers?: VetroLayer[]
  initialNome?: string
  initialCodice?: string
  initialFornitore?: string
  initialPrezzo?: number | null
  onBack: () => void
  onSave: (data: {
    nome: string; codice: string; fornitore: string | null; prezzo: number | null;
    layers: VetroLayer[]; svg: string; calc: any;
  }) => Promise<void> | void
}

export default function CostruttoreVetriMobile({
  initialLayers, initialNome, initialCodice, initialFornitore, initialPrezzo, onBack, onSave,
}: Props) {
  const [layers, setLayers] = useState<VetroLayer[]>(initialLayers || [])
  const [nome, setNome] = useState(initialNome || '')
  const [codice, setCodice] = useState(initialCodice || '')
  const [fornitore, setFornitore] = useState(initialFornitore || '')
  const [prezzo, setPrezzo] = useState(initialPrezzo != null ? String(initialPrezzo) : '')
  const [editing, setEditing] = useState<EditingLayer>(null)
  const [showPresets, setShowPresets] = useState(false)
  const [showTips, setShowTips] = useState(true)
  const [showZone, setShowZone] = useState(false)
  const [saving, setSaving] = useState(false)

  const calc = useMemo(() => calcolaVetro(layers), [layers])
  const svg = useMemo(() => generaSvgSezione(layers, 3), [layers])

  const add = (t: LayerType) => {
    const defaults: Record<LayerType, Partial<VetroLayer>> = {
      vetro: { spessore: 4, vetro_tipo: 'float' },
      pvb: { spessore: 0.76 },
      canalina: { spessore: 16, gas: 'argon', canalina_tipo: 'warm_edge' },
    }
    setLayers(p => [...p, { id: gid(), tipo: t, ...defaults[t] } as VetroLayer])
  }

  const upd = (id: string, u: Partial<VetroLayer>) =>
    setLayers(p => p.map(l => l.id === id ? { ...l, ...u } : l))

  const rm = (id: string) => setLayers(p => p.filter(l => l.id !== id))

  const move = (id: string, dir: -1 | 1) => {
    setLayers(p => {
      const i = p.findIndex(l => l.id === id)
      if (i < 0) return p
      const j = i + dir
      if (j < 0 || j >= p.length) return p
      const out = [...p]
      const [item] = out.splice(i, 1)
      out.splice(j, 0, item)
      return out
    })
  }

  const loadPreset = (pr: typeof PRESETS[0]) => {
    setLayers(pr.l.map(l => ({ ...l, id: gid() } as VetroLayer)))
    setNome(pr.n)
    setShowPresets(false)
  }

  const handleSave = async () => {
    if (!codice.trim()) { alert('Inserisci codice vetro'); return }
    if (!calc) { alert('Aggiungi almeno una lastra'); return }
    setSaving(true)
    try {
      await onSave({
        nome: nome.trim() || calc.comp,
        codice: codice.trim(),
        fornitore: fornitore.trim() || null,
        prezzo: parseFloat(prezzo) || null,
        layers, svg, calc,
      })
    } finally { setSaving(false) }
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, ' + T.acc + ' 0%, ' + T.accDeep + ' 100%)', padding: '14px 16px 22px', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, color: '#FFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', width: 36, height: 36, borderRadius: 10, color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>&lsaquo;</button>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Vetri &rsaquo; Costruttore</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Costruttore Vetri</div>
        {calc && (
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>{calc.comp}</div>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Anteprima sezione */}
        {layers.length > 0 && (
          <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <div dangerouslySetInnerHTML={{ __html: svg }} style={{ maxWidth: '100%', maxHeight: 200 }} />
          </div>
        )}

        {/* Presets toggle */}
        <button onClick={() => setShowPresets(s => !s)} style={accordionBtn(showPresets)}>
          <span>PRESET RAPIDI ({PRESETS.length})</span>
          <span>{showPresets ? '▾' : '▸'}</span>
        </button>
        {showPresets && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PRESETS.map((pr, i) => (
              <button key={i} onClick={() => loadPreset(pr)} style={{
                background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 10,
                padding: '12px 14px', fontSize: 13, fontWeight: 600, color: T.text,
                cursor: 'pointer', textAlign: 'left',
              }}>{pr.n}</button>
            ))}
          </div>
        )}

        {/* Layers list */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 8, letterSpacing: 0.4, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>Strati ({layers.length})</span>
            {layers.length > 0 && <span style={{ color: T.acc }}>tap per modificare</span>}
          </div>
          {layers.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 12, border: '2px dashed ' + T.bdr, borderRadius: 10 }}>
              Scegli un preset o aggiungi strati
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {layers.map((l, i) => (
                <RigaLayer key={l.id} layer={l} idx={i} total={layers.length}
                  onTap={() => setEditing({ layer: l, idx: i })}
                  onUp={() => move(l.id, -1)}
                  onDown={() => move(l.id, 1)}
                  onRm={() => rm(l.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <button onClick={() => add('vetro')} style={addBtn(T.acc)}>+ LASTRA</button>
          <button onClick={() => add('pvb')} style={addBtn(T.numAmber)}>+ PVB</button>
          <button onClick={() => add('canalina')} style={addBtn(T.numBlue)}>+ CAMERA</button>
        </div>

        {/* KPI grid */}
        {calc && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Kpi label="Ug" value={calc.Ug} unit="W/m²K" color={calc.Ug <= 1.1 ? T.numTeal : calc.Ug <= 1.4 ? T.numAmber : T.numRed} />
              <Kpi label="g solare" value={calc.g} unit="" color={calc.g <= 0.35 ? T.numBlue : calc.g <= 0.5 ? T.numTeal : T.numAmber} />
              <Kpi label="TL luce" value={Math.round(calc.TL * 100) + '%'} unit="" color={calc.TL >= 0.7 ? T.numTeal : T.numAmber} isString />
              <Kpi label={'Rw ' + calc.rwC.d} value={calc.Rw + 'dB'} unit="" color={calc.Rw >= 35 ? T.numTeal : calc.Rw >= 32 ? T.numAmber : T.numRed} isString />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Kpi label="Spessore" value={calc.sp + 'mm'} unit="" color={T.text} isString />
              <Kpi label="Peso" value={calc.peso.toFixed(1)} isString unit="kg/m²" color={T.text} />
              <Kpi label="Psi bordo" value={calc.psi} unit="W/mK" color={calc.psi <= 0.04 ? T.numTeal : calc.psi <= 0.06 ? T.numAmber : T.numRed} />
              <Kpi label="Sicurezza" value={calc.hasSic ? 'SI' : 'NO'} unit="" color={calc.hasSic ? T.numTeal : T.numRed} isString />
            </div>

            {calc.detr && (
              <div style={{ background: T.tealSoft, border: '1px solid ' + T.numTeal + '40', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: T.numTeal, fontWeight: 600 }}>
                ✓ Idoneo detrazioni fiscali Ecobonus/Superbonus (Ug ≤ 1.1)
              </div>
            )}

            {/* Zone climatiche */}
            <button onClick={() => setShowZone(s => !s)} style={accordionBtn(showZone)}>
              <span>ZONE CLIMATICHE ITALIA</span>
              <span>{showZone ? '▾' : '▸'}</span>
            </button>
            {showZone && (
              <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, fontWeight: 600 }}>DM 26/06/2015</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ZONE_CLIMATICHE.map(z => {
                    const ok = calc.Ug <= z.ug + 0.3
                    const ottimo = calc.Ug <= z.ug
                    const col = ottimo ? T.numTeal : ok ? T.numAmber : T.numRed
                    return (
                      <div key={z.z} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: col + '12', border: '1px solid ' + col + '30' }}>
                        <div style={{ width: 30, fontSize: 14, fontWeight: 800, color: col }}>{z.z}</div>
                        <div style={{ flex: 1, fontSize: 11, color: T.text }}>{z.c}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: col }}>{ottimo ? 'OK' : ok ? '~' : 'NO'}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Consigli */}
            {calc.tips.length > 0 && (
              <>
                <button onClick={() => setShowTips(s => !s)} style={accordionBtn(showTips)}>
                  <span>CONSIGLI TECNICI ({calc.tips.length})</span>
                  <span>{showTips ? '▾' : '▸'}</span>
                </button>
                {showTips && (
                  <div style={{ background: T.amberSoft, border: '1px solid ' + T.numAmber + '30', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {calc.tips.map((t, i) => (
                      <div key={i} style={{ fontSize: 12, color: T.text, paddingLeft: 10, borderLeft: '3px solid ' + T.numAmber + '60', lineHeight: 1.4 }}>{t}</div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Save form */}
        {calc && (
          <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Salva in catalogo</div>
            <Input placeholder="Codice vetro *" value={codice} onChange={setCodice} mono />
            <Input placeholder="Nome descrittivo" value={nome} onChange={setNome} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Input placeholder="Fornitore" value={fornitore} onChange={setFornitore} />
              <Input placeholder="EUR/m²" value={prezzo} onChange={setPrezzo} type="number" mono />
            </div>
            <button onClick={handleSave} disabled={saving || !codice.trim()}
              style={{ background: codice.trim() ? T.acc : T.bdr, color: '#FFF', border: 'none', borderRadius: 12, padding: 14, fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: codice.trim() ? 'pointer' : 'default' }}>
              {saving ? 'SALVATAGGIO...' : 'SALVA VETRO'}
            </button>
          </div>
        )}

        {/* Normativa */}
        <div style={{ background: T.tealSoft, border: '1px solid ' + T.bdr, borderRadius: 8, padding: '10px 12px', fontSize: 10, color: T.muted, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: T.text }}>NORMATIVA: </span>
          EN 673 (Ug) · EN 410 (g, TL) · EN 12758 (Rw) · UNI 7697 (sicurezza) · DM 26/06/2015
        </div>
      </div>

      {/* Bottom sheet edit layer */}
      {editing && (
        <EditLayerSheet
          layer={editing.layer}
          onClose={() => setEditing(null)}
          onUpdate={(u) => upd(editing.layer.id, u)}
        />
      )}
    </div>
  )
}

// ────────── COMPONENTI ──────────

function RigaLayer({ layer: l, idx, total, onTap, onUp, onDown, onRm }: {
  layer: VetroLayer; idx: number; total: number;
  onTap: () => void; onUp: () => void; onDown: () => void; onRm: () => void;
}) {
  const colore = l.tipo === 'vetro' ? { bg: '#E1F5EE', bdr: T.numTeal } :
                 l.tipo === 'pvb' ? { bg: T.amberSoft, bdr: T.numAmber } :
                 { bg: '#F0F0F0', bdr: '#888' }
  const desc = l.tipo === 'vetro' ? 'Lastra vetro' : l.tipo === 'pvb' ? 'PVB interlayer' : 'Camera + gas'
  const det = l.tipo === 'vetro' ? (l.vetro_tipo || 'float') :
              l.tipo === 'canalina' ? (l.gas + ' · ' + (l.canalina_tipo || 'allum.')) : ''

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 10, padding: 10 }}>
      <div style={{ width: 8, height: 36, borderRadius: 2, background: colore.bg, border: '1.5px solid ' + colore.bdr, flexShrink: 0 }} />
      <button onClick={onTap} style={{ flex: 1, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{l.spessore}mm · {desc}</div>
        {det && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{det}</div>}
      </button>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={onUp} disabled={idx === 0} style={smallIconBtn(idx === 0)}>↑</button>
        <button onClick={onDown} disabled={idx === total - 1} style={smallIconBtn(idx === total - 1)}>↓</button>
        <button onClick={onRm} style={{ ...smallIconBtn(false), color: T.numRed }}>×</button>
      </div>
    </div>
  )
}

function EditLayerSheet({ layer: l, onClose, onUpdate }: {
  layer: VetroLayer; onClose: () => void; onUpdate: (u: Partial<VetroLayer>) => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: '16px 16px 28px', zIndex: 9999, maxHeight: '70vh', overflowY: 'auto',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: T.bdr, margin: '0 auto 14px' }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>
          Modifica {l.tipo === 'vetro' ? 'Lastra' : l.tipo === 'pvb' ? 'PVB' : 'Camera'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label>Spessore mm</Label>
            <input type="number" step={l.tipo === 'pvb' ? 0.38 : 1} value={l.spessore}
              onChange={e => onUpdate({ spessore: parseFloat(e.target.value) || 0 })}
              style={inputStyle} />
          </div>

          {l.tipo === 'vetro' && (
            <div>
              <Label>Tipo vetro</Label>
              <select value={l.vetro_tipo || 'float'} onChange={e => onUpdate({ vetro_tipo: e.target.value as any })} style={inputStyle}>
                <option value="float">Float (standard)</option>
                <option value="temperato">Temperato (sicurezza)</option>
                <option value="basso_emissivo">Basso emissivo (Low-E)</option>
                <option value="selettivo">Selettivo solare</option>
              </select>
            </div>
          )}

          {l.tipo === 'canalina' && (
            <>
              <div>
                <Label>Gas</Label>
                <select value={l.gas || 'aria'} onChange={e => onUpdate({ gas: e.target.value as any })} style={inputStyle}>
                  <option value="aria">Aria (base)</option>
                  <option value="argon">Argon (consigliato)</option>
                  <option value="kripton">Kripton (alta prestazione)</option>
                </select>
              </div>
              <div>
                <Label>Canalina (distanziatore)</Label>
                <select value={l.canalina_tipo || 'alluminio'} onChange={e => onUpdate({ canalina_tipo: e.target.value as any })} style={inputStyle}>
                  <option value="alluminio">Alluminio (ponte termico)</option>
                  <option value="warm_edge">Warm Edge</option>
                  <option value="super_spacer">Super Spacer</option>
                </select>
              </div>
            </>
          )}
        </div>

        <button onClick={onClose} style={{ width: '100%', marginTop: 16, background: T.acc, color: '#FFF', border: 'none', borderRadius: 12, padding: 14, fontSize: 13, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer' }}>FATTO</button>
      </div>
    </>
  )
}

// ────────── HELPERS ──────────

function Kpi({ label, value, unit, color, isString }: { label: string; value: any; unit: string; color: string; isString?: boolean }) {
  return (
    <div style={{ background: '#FFF', border: '1px solid ' + T.bdr, borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: 9, color: T.muted, fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  )
}

function Input({ placeholder, value, onChange, type = 'text', mono }: { placeholder: string; value: string; onChange: (v: string) => void; type?: string; mono?: boolean }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 12px', border: '1px solid ' + T.bdr, borderRadius: 10,
        fontSize: 14, background: '#FFF', outline: 'none', boxSizing: 'border-box',
        fontFamily: mono ? 'monospace' : 'inherit', fontWeight: mono ? 700 : 400,
      }}
    />
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{children}</div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid ' + T.bdr, borderRadius: 10,
  fontSize: 14, background: '#FFF', outline: 'none', boxSizing: 'border-box',
}

const accordionBtn = (open: boolean): React.CSSProperties => ({
  background: open ? T.tealSoft : '#FFF',
  border: '1px solid ' + (open ? T.numTeal + '40' : T.bdr),
  borderRadius: 10, padding: '12px 14px',
  fontSize: 11, fontWeight: 700, color: open ? T.numTeal : T.text,
  letterSpacing: 0.4, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
})

const addBtn = (color: string): React.CSSProperties => ({
  padding: '12px 8px', borderRadius: 10,
  border: '1.5px solid ' + color + '40',
  background: color + '08',
  color, fontSize: 12, fontWeight: 700, letterSpacing: 0.4,
  cursor: 'pointer',
})

const smallIconBtn = (disabled: boolean): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: 6,
  border: '1px solid ' + T.bdr, background: '#FFF',
  color: disabled ? T.bdr : T.muted,
  fontSize: 14, fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.4 : 1,
})
