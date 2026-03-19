// ============================================================
// MASTRO — app/ordini/page.tsx  +  components/OrdiniPanel.tsx
// Trasformatore Universale: commessa → ordine fornitore
// ============================================================
'use client'
import { useState, useEffect } from 'react'
import { trasformaCommessaInOrdine, OrdineFornitore } from '@/lib/calcoloVano'

// ---- TIPI --------------------------------------------------
interface Commessa {
  id: string; code: string; cliente: string; cognome?: string
  stato: string; sistema?: string; rilievi?: any[]
}

// ---- COLORI ------------------------------------------------
const T = {
  bg:    '#F2F1EC', surface: '#FFFFFF', border: '#E5E3DC',
  text:  '#1A1A1C', sub: '#6B7280',
  acc:   '#D08008', accLt: '#FEF3C7',
  grn:   '#1A9E73', grnLt: '#D1FAE5',
  red:   '#DC4444', redLt: '#FEE2E2',
  blu:   '#3B7FE0', bluLt: '#DBEAFE',
}

const S = {
  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' as const },
  btn: (primary=true) => ({
    background: primary ? T.acc : T.surface,
    color: primary ? '#fff' : T.text,
    border: primary ? 'none' : `1px solid ${T.border}`,
    borderRadius: 6, padding: '8px 16px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  }),
  badge: (bg: string, col: string) => ({
    background: bg, color: col,
    borderRadius: 4, padding: '2px 8px',
    fontSize: 11, fontWeight: 600,
  }),
  input: {
    width: '100%', padding: '8px 12px',
    border: `1px solid ${T.border}`, borderRadius: 6,
    fontSize: 13, background: T.bg, color: T.text,
    outline: 'none', boxSizing: 'border-box' as const,
  },
  label: { fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase' as const, letterSpacing: 0.7, marginBottom: 4, display: 'block' as const },
}

// ---- CATEGORIE COLORI --------------------------------------
const catColor: Record<string, [string, string]> = {
  serramento: [T.bluLt, T.blu],
  vetro:      ['#E0F2FE', '#0284C7'],
  ferramenta: [T.accLt, T.acc],
  persiana:   ['#F3E8FF', '#7C3AED'],
  tapparella: ['#FEF9C3', '#A16207'],
  zanzariera: [T.grnLt, T.grn],
}

// ---- COMPONENTE PRINCIPALE ---------------------------------
export default function OrdiniPage() {
  const [commesse, setCommesse] = useState<Commessa[]>([])
  const [selCm, setSelCm] = useState<Commessa | null>(null)
  const [fornitore, setFornitore] = useState('')
  const [ordine, setOrdine] = useState<OrdineFornitore | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [tabOrdine, setTabOrdine] = useState<'riepilogo'|'dettaglio'|'avvisi'>('riepilogo')

  // Carica commesse con vani misurati
  useEffect(() => {
    fetch('/api/commesse?stato=attiva&hasMisure=true')
      .then(r => r.json())
      .then(d => setCommesse(d.commesse || []))
      .catch(() => {})
  }, [])

  async function generaOrdine() {
    if (!selCm || !fornitore.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/vani/${selCm.id}?ordine=true&calcola=true`)
      const data = await res.json()
      if (data.ordine) setOrdine(data.ordine)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function salvaOrdine() {
    if (!ordine) return
    const res = await fetch('/api/ordini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ordine, fornitore }),
    })
    if (res.ok) alert('Ordine salvato!')
  }

  const cmFiltrate = commesse.filter(c =>
    `${c.cliente} ${c.cognome || ''} ${c.code}`.toLowerCase().includes(filter.toLowerCase())
  )

  // Raggruppa righe ordine per categoria
  const righePerCat = ordine
    ? ordine.righe.reduce((acc, r) => {
        const k = r.categoria
        if (!acc[k]) acc[k] = []
        acc[k].push(r)
        return acc
      }, {} as Record<string, typeof ordine.righe>)
    : {}

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 16, fontFamily: 'Inter, sans-serif' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>Ordini Fornitore</div>
        <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>Trasformatore Universale — da commessa a ordine strutturato</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>

        {/* COLONNA SX — selezione commessa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Ricerca */}
          <input
            style={S.input}
            placeholder="Cerca commessa o cliente..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />

          {/* Lista commesse */}
          <div style={S.card}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              {cmFiltrate.length} commesse disponibili
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {cmFiltrate.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: T.sub, fontSize: 13 }}>
                  Nessuna commessa con misure complete
                </div>
              )}
              {cmFiltrate.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setSelCm(c); setOrdine(null) }}
                  style={{
                    padding: '12px 14px',
                    borderBottom: `1px solid ${T.border}`,
                    cursor: 'pointer',
                    background: selCm?.id === c.id ? T.accLt : 'transparent',
                    borderLeft: selCm?.id === c.id ? `3px solid ${T.acc}` : '3px solid transparent',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.cliente} {c.cognome || ''}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{c.code} · {c.sistema || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fornitore + genera */}
          {selCm && (
            <div style={{ ...S.card, padding: 14 }}>
              <label style={S.label}>Fornitore</label>
              <input
                style={{ ...S.input, marginBottom: 12 }}
                placeholder="Es. Schüco Italia, Aluscalae..."
                value={fornitore}
                onChange={e => setFornitore(e.target.value)}
              />
              <button
                style={{ ...S.btn(true), width: '100%', opacity: !fornitore.trim() || loading ? 0.5 : 1 }}
                onClick={generaOrdine}
                disabled={!fornitore.trim() || loading}
              >
                {loading ? 'Calcolo in corso...' : 'Genera Ordine'}
              </button>
            </div>
          )}
        </div>

        {/* COLONNA DX — ordine generato */}
        <div>
          {!ordine && !loading && (
            <div style={{ ...S.card, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Seleziona una commessa</div>
              <div style={{ fontSize: 13, color: T.sub }}>Scegli la commessa e inserisci il fornitore per generare l'ordine strutturato</div>
            </div>
          )}

          {loading && (
            <div style={{ ...S.card, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: T.sub }}>Calcolo liste taglio e accessori in corso...</div>
            </div>
          )}

          {ordine && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Header ordine */}
              <div style={{ ...S.card, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{ordine.cliente}</div>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                      {ordine.commessa_code} · {fornitore} · {ordine.totale_vani} vani · {ordine.totale_pezzi} pz
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={S.btn(false)} onClick={() => window.print()}>Stampa</button>
                    <button style={S.btn(true)} onClick={salvaOrdine}>Salva Ordine</button>
                  </div>
                </div>

                {/* Avvisi */}
                {ordine.avvisi.length > 0 && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: T.accLt, borderRadius: 6, fontSize: 12, color: T.acc }}>
                    ⚠️ {ordine.avvisi.length} avvisi — controlla prima di inviare
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, background: T.surface, borderRadius: 8, padding: 4, border: `1px solid ${T.border}` }}>
                {(['riepilogo', 'dettaglio', 'avvisi'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTabOrdine(t)}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 6,
                      border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: tabOrdine === t ? T.acc : 'transparent',
                      color: tabOrdine === t ? '#fff' : T.sub,
                    }}
                  >
                    {t === 'riepilogo' ? 'Riepilogo' : t === 'dettaglio' ? 'Dettaglio righe' : `Avvisi (${ordine.avvisi.length})`}
                  </button>
                ))}
              </div>

              {/* TAB RIEPILOGO — per categoria */}
              {tabOrdine === 'riepilogo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(righePerCat).map(([cat, righe]) => {
                    const [bg, col] = catColor[cat] || [T.border, T.sub]
                    return (
                      <div key={cat} style={S.card}>
                        <div style={{ padding: '10px 14px', background: bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                            {cat}
                          </span>
                          <span style={{ ...S.badge(col, '#fff'), fontSize: 10 }}>{righe.length} righe</span>
                        </div>
                        {righe.map((r, i) => (
                          <div key={i} style={{ padding: '10px 14px', borderBottom: i < righe.length - 1 ? `1px solid ${T.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.descrizione}</div>
                              {r.note && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{r.note}</div>}
                              <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>Vano: {r.vano_nome}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: T.acc }}>{r.qta}</span>
                              <span style={{ fontSize: 11, color: T.sub, marginLeft: 3 }}>{r.unita}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* TAB DETTAGLIO — tabella completa */}
              {tabOrdine === 'dettaglio' && (
                <div style={S.card}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: T.bg }}>
                        {['Categoria', 'Vano', 'Descrizione', 'Qta', 'Um'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ordine.righe.map((r, i) => {
                        const [bg, col] = catColor[r.categoria] || [T.border, T.sub]
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ ...S.badge(bg, col), fontSize: 10 }}>{r.categoria}</span>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: 12, color: T.sub }}>{r.vano_nome}</td>
                            <td style={{ padding: '8px 12px' }}>{r.descrizione}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: T.acc }}>{r.qta}</td>
                            <td style={{ padding: '8px 12px', color: T.sub }}>{r.unita}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB AVVISI */}
              {tabOrdine === 'avvisi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ordine.avvisi.length === 0
                    ? <div style={{ ...S.card, padding: 24, textAlign: 'center', color: T.grn, fontWeight: 700 }}>✅ Nessun avviso — ordine pulito</div>
                    : ordine.avvisi.map((a, i) => (
                        <div key={i} style={{ ...S.card, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ color: T.acc, fontSize: 16, flexShrink: 0 }}>⚠️</span>
                          <span style={{ fontSize: 13 }}>{a}</span>
                        </div>
                      ))
                  }
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
