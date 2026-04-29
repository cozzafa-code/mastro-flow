// components/settings-mobile/sistemi/TabProfili.tsx
// Profili associati al sistema: lista + form add/edit + delete.

'use client'

import React, { useState } from 'react'
import { T } from '../../home-mobile/HomeUI'
import type { SistemaConStats, ProfiloCatalogo } from '@/lib/types/sistemi'

interface Props {
  sistema: SistemaConStats
  sis: any
}

const TIPI_PROFILO = [
  'telaio', 'anta', 'traverso', 'fermavetro', 'finestra', 'porta',
  'rinforzo', 'colonna', 'angolare', 'parclose', 'altro',
]

export default function TabProfili({ sistema, sis }: Props) {
  const [editing, setEditing] = useState<Partial<ProfiloCatalogo> | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('')

  const profili: ProfiloCatalogo[] = sis.profili
  const filtrati = filtroTipo
    ? profili.filter((p) => p.tipo === filtroTipo)
    : profili

  return (
    <div style={{ padding: 12 }}>
      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
        <button
          onClick={() => setFiltroTipo('')}
          style={{
            padding: '6px 11px',
            borderRadius: 8,
            border: `1px solid ${!filtroTipo ? T.acc : T.bdr}`,
            background: !filtroTipo ? T.acc : '#FFF',
            color: !filtroTipo ? '#FFF' : T.text,
            fontSize: 11, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >Tutti</button>
        {TIPI_PROFILO.map((t) => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            style={{
              padding: '6px 11px',
              borderRadius: 8,
              border: `1px solid ${filtroTipo === t ? T.acc : T.bdr}`,
              background: filtroTipo === t ? T.acc : '#FFF',
              color: filtroTipo === t ? '#FFF' : T.text,
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >{t}</button>
        ))}
      </div>

      <button
        onClick={() => setEditing({
          sistema_id: sistema.id,
          marca: sistema.marca,
          materiale: sistema.materiale,
          tipo: 'telaio',
          codice: '',
          nome: '',
          attivo: true,
        })}
        style={{
          width: '100%',
          padding: 11,
          marginBottom: 10,
          borderRadius: 10,
          border: `2px dashed ${T.acc}`,
          background: '#F0FBFB',
          color: T.acc,
          fontSize: 13, fontWeight: 700,
          cursor: 'pointer',
        }}
      >+ NUOVO PROFILO</button>

      {/* LISTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtrati.map((p) => (
          <div
            key={p.id}
            onClick={() => setEditing(p)}
            style={{
              background: '#FFF',
              border: `1px solid ${T.bdr}`,
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              boxShadow: T.shadow,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                    padding: '2px 6px', borderRadius: 4,
                    background: T.acc + '20', color: T.accDeep,
                    textTransform: 'uppercase',
                  }}>{p.tipo ?? 'altro'}</span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.muted }}>{p.codice}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 4 }}>
                  {p.nome}
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 3, fontFamily: 'monospace' }}>
                  {p.profondita_mm != null && `prof ${p.profondita_mm}mm`}
                  {p.camere && ` · ${p.camere} cam`}
                  {p.uf != null && ` · Uf ${p.uf}`}
                  {p.peso_kg_ml != null && ` · ${p.peso_kg_ml}kg/m`}
                </div>
              </div>
              {!p.attivo && (
                <span style={{ fontSize: 9, color: T.muted, opacity: 0.7 }}>OFF</span>
              )}
            </div>
          </div>
        ))}
        {filtrati.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 12 }}>
            Nessun profilo {filtroTipo && `di tipo "${filtroTipo}"`}.
          </div>
        )}
      </div>

      {/* MODAL */}
      {editing && (
        <ProfiloForm
          p={editing}
          onClose={() => setEditing(null)}
          onSave={async (p) => {
            const r = await sis.saveProfilo(p)
            if (r.ok) setEditing(null)
            else alert(r.error)
          }}
          onDelete={editing.id ? async () => {
            if (!confirm('Eliminare questo profilo?')) return
            const r = await sis.deleteProfilo(editing.id!)
            if (r.ok) setEditing(null)
            else alert(r.error)
          } : undefined}
        />
      )}
    </div>
  )
}

function ProfiloForm({ p, onClose, onSave, onDelete }: {
  p: Partial<ProfiloCatalogo>
  onClose: () => void
  onSave: (p: Partial<ProfiloCatalogo>) => void | Promise<void>
  onDelete?: () => void | Promise<void>
}) {
  const [f, setF] = useState<Partial<ProfiloCatalogo>>(p)
  const set = <K extends keyof ProfiloCatalogo>(k: K, v: ProfiloCatalogo[K]) =>
    setF((x) => ({ ...x, [k]: v }))

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(13,31,31,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 8,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          maxHeight: '92vh', overflowY: 'auto',
          background: T.bg, borderRadius: 16,
        }}
      >
        <div style={{
          padding: '12px 14px',
          background: T.accDeep, color: '#FFF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
        }}>
          <div style={{ fontWeight: 700 }}>{p.id ? 'MODIFICA PROFILO' : 'NUOVO PROFILO'}</div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF',
            width: 28, height: 28, borderRadius: 8, fontSize: 16, cursor: 'pointer',
          }}>×</button>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Tx label="Codice" v={f.codice} on={(x) => set('codice', x)} />
            <Sel label="Tipo" v={f.tipo ?? 'telaio'} on={(x) => set('tipo', x)} opts={TIPI_PROFILO.map(t => ({v:t,l:t}))} />
          </div>
          <Tx label="Nome" v={f.nome} on={(x) => set('nome', x)} />
          <Tx label="Utilizzo" v={f.utilizzo ?? ''} on={(x) => set('utilizzo', x)} />

          <Section>Dati tecnici</Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <Nm label="Profondità" v={f.profondita_mm} on={(x) => set('profondita_mm', x)} />
            <Nm label="Camere" v={f.camere} on={(x) => set('camere', x)} />
            <Nm label="Uf" v={f.uf} on={(x) => set('uf', x)} step="0.01" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <Nm label="Peso kg/m" v={f.peso_kg_ml} on={(x) => set('peso_kg_ml', x)} step="0.001" />
            <Nm label="Grammi/m" v={f.gr_ml} on={(x) => set('gr_ml', x)} />
          </div>

          <Section>Quote</Section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <Nm label="Battuta" v={f.battuta} on={(x) => set('battuta', x)} />
            <Nm label="Aria" v={f.aria} on={(x) => set('aria', x)} />
            <Nm label="Frontale" v={f.frontale} on={(x) => set('frontale', x)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <Nm label="Sede ferm." v={f.sede_fermavetro} on={(x) => set('sede_fermavetro', x)} />
            <Nm label="Tubolare" v={f.tubolare} on={(x) => set('tubolare', x)} />
            <Nm label="Sviluppo" v={f.sviluppo} on={(x) => set('sviluppo', x)} />
          </div>

          <Section>Allegati</Section>
          <Tx label="URL Immagine" v={f.immagine_url ?? ''} on={(x) => set('immagine_url', x)} />
          <Tx label="URL DXF" v={f.dxf_url ?? ''} on={(x) => set('dxf_url', x)} />
          <Tx label="URL PDF" v={f.pdf_url ?? ''} on={(x) => set('pdf_url', x)} />
          <Tx label="Note" v={f.note ?? ''} on={(x) => set('note', x)} />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={f.attivo ?? true}
              onChange={(e) => set('attivo', e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Attivo
          </label>
        </div>

        <div style={{
          padding: 12,
          borderTop: `1px solid ${T.bdr}`,
          display: 'flex', gap: 8, background: '#FFF',
          borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        }}>
          {onDelete && (
            <button onClick={onDelete} style={{
              padding: '10px 14px', borderRadius: 8,
              border: 'none', background: '#FFEBEB',
              color: '#D14545', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>ELIMINA</button>
          )}
          <button onClick={() => onSave(f)} style={{
            flex: 1, padding: 10, borderRadius: 8, border: 'none',
            background: T.acc, color: '#FFF',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 3px 0 0 ' + T.accDeep,
          }}>SALVA</button>
        </div>
      </div>
    </div>
  )
}

// ---------- Helpers ----------
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1,
      color: T.muted, marginTop: 6, paddingBottom: 4,
      borderBottom: `1px solid ${T.bdr}`,
    }}>{children}</div>
  )
}
function Tx({ label, v, on }: { label: string; v: string | null | undefined; on: (x: string) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 3 }}>{label}</div>
      <input
        type="text" value={v ?? ''}
        onChange={(e) => on(e.target.value)}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          border: `1px solid ${T.bdr}`, background: '#FFF',
          fontSize: 13, color: T.text,
        }}
      />
    </label>
  )
}
function Nm({ label, v, on, step }: { label: string; v: number | null | undefined; on: (x: number | null) => void; step?: string }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 9, letterSpacing: 0.5, color: T.muted, marginBottom: 3 }}>{label}</div>
      <input
        type="number" inputMode="decimal" step={step ?? '1'}
        value={v ?? ''}
        onChange={(e) => on(e.target.value === '' ? null : Number(e.target.value))}
        style={{
          width: '100%', padding: '7px 8px', borderRadius: 7,
          border: `1px solid ${T.bdr}`, background: '#FFF',
          fontSize: 12, fontFamily: 'monospace', color: T.text,
        }}
      />
    </label>
  )
}
function Sel({ label, v, on, opts }: { label: string; v: string; on: (x: string) => void; opts: { v: string; l: string }[] }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, marginBottom: 3 }}>{label}</div>
      <select
        value={v} onChange={(e) => on(e.target.value)}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          border: `1px solid ${T.bdr}`, background: '#FFF',
          fontSize: 13, color: T.text,
        }}
      >
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  )
}
