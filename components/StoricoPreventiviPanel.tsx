// components/StoricoPreventiviPanel.tsx
// Pannello storico preventivi con versioning, diff, confronto.
// NON tocca firma/token/calcoli/condivisione - solo visualizza e crea nuova versione.

'use client'

import React, { useEffect, useState } from 'react'
import {
  caricaVersioni,
  caricaSnapshot,
  caricaModifiche,
  duplicaPerNuovaVersione,
  calcolaDiff,
  type PreventivoVersione,
  type PreventivoVanoSnapshot,
  type PreventivoModifica,
  type DiffVano,
} from '@/lib/preventivi/snapshot'

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════

interface StoricoPreventiviPanelProps {
  commessaId: string
  numero: number
  aziendaId: string
  commessaCode?: string
  clienteNome?: string
  onClose?: () => void
  onApriPdf?: (preventivoId: string, pdfUrl: string | null) => void
  onInviaLink?: (preventivoId: string) => void
  onApriEdit?: (preventivoId: string) => void
}

// ═══════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════

const fmtEur = (n: number | null | undefined) => {
  const v = Number(n || 0)
  return '€ ' + v.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const fmtData = (s: string | null | undefined) => {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

const fmtDataLunga = (s: string | null | undefined) => {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

const tagStato = (stato: string): { label: string; bg: string; fg: string } => {
  const s = (stato || '').toLowerCase()
  if (s.includes('firma')) return { label: 'Firmato', bg: '#065F46', fg: '#fff' }
  if (s.includes('accet')) return { label: 'Accettato', bg: '#D1FAE5', fg: '#065F46' }
  if (s.includes('rifiut')) return { label: 'Rifiutato', bg: '#FEE2E2', fg: '#991B1B' }
  if (s.includes('modif')) return { label: 'Modifiche', bg: '#FED7AA', fg: '#9A3412' }
  if (s.includes('vist')) return { label: 'Visto', bg: '#DBEAFE', fg: '#1E40AF' }
  if (s.includes('inviat')) return { label: 'Inviato', bg: '#DBEAFE', fg: '#1E40AF' }
  if (s.includes('bozz')) return { label: 'Bozza', bg: '#F1F5F9', fg: '#475569' }
  return { label: stato || 'Bozza', bg: '#F1F5F9', fg: '#475569' }
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function StoricoPreventiviPanel({
  commessaId,
  numero,
  aziendaId,
  commessaCode = '',
  clienteNome = '',
  onClose,
  onApriPdf,
  onInviaLink,
  onApriEdit,
}: StoricoPreventiviPanelProps) {
  const [loading, setLoading] = useState(true)
  const [versioni, setVersioni] = useState<PreventivoVersione[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [diffById, setDiffById] = useState<Record<string, DiffVano[]>>({})
  const [modificheById, setModificheById] = useState<Record<string, PreventivoModifica[]>>({})
  const [showModalNuova, setShowModalNuova] = useState(false)
  const [motivoCliente, setMotivoCliente] = useState('')
  const [creatingNuova, setCreatingNuova] = useState(false)

  // Carico versioni al mount
  useEffect(() => {
    let mounted = true
    setLoading(true)
    caricaVersioni(commessaId, numero)
      .then((vs) => {
        if (!mounted) return
        setVersioni(vs)
        // Espando la più recente
        if (vs.length > 0) setExpandedId(vs[0].id)
      })
      .catch((e) => console.error('[storico] caricaVersioni', e))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [commessaId, numero])

  // Carica diff e modifiche quando si espande una versione
  useEffect(() => {
    if (!expandedId) return
    if (diffById[expandedId]) return
    const ver = versioni.find((v) => v.id === expandedId)
    if (!ver) return
    ;(async () => {
      try {
        const snapDopo = await caricaSnapshot(expandedId)
        let diff: DiffVano[] = []
        if (ver.padre_id) {
          const snapPrima = await caricaSnapshot(ver.padre_id)
          diff = calcolaDiff(snapPrima, snapDopo)
        }
        const mods = await caricaModifiche(expandedId)
        setDiffById((s) => ({ ...s, [expandedId]: diff }))
        setModificheById((s) => ({ ...s, [expandedId]: mods }))
      } catch (e) {
        console.error('[storico] diff load', e)
      }
    })()
  }, [expandedId, versioni, diffById])

  const versioneCorrente = versioni[0] || null

  // Crea nuova versione
  const onCreaNuovaVersione = async () => {
    if (!versioneCorrente) return
    setCreatingNuova(true)
    try {
      const nuova = await duplicaPerNuovaVersione(
        versioneCorrente.id,
        motivoCliente.trim() || null,
        'Fabio',
      )
      // Ricarico
      const vs = await caricaVersioni(commessaId, numero)
      setVersioni(vs)
      setExpandedId(nuova.id)
      setShowModalNuova(false)
      setMotivoCliente('')
      // Apre subito edit
      onApriEdit?.(nuova.id)
    } catch (e: any) {
      alert('Errore creazione nuova versione: ' + (e?.message || e))
    } finally {
      setCreatingNuova(false)
    }
  }

  // ─── RENDER ───
  return (
    <div style={{
      background: '#F7F7F5',
      minHeight: '100%',
      WebkitFontSmoothing: 'antialiased',
      paddingBottom: 24,
    }}>
      {/* Header navy */}
      <div style={{
        background: 'linear-gradient(145deg, #2D5A87 0%, #1E3A5F 50%, #0F1B2D 100%)',
        padding: '14px 16px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        borderRadius: 0,
      }}>
        {onClose && (
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'rgba(255,255,255,0.18)',
            border: 'none', color: '#fff',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.85, letterSpacing: 1, textTransform: 'uppercase' }}>
            {commessaCode} · Storico preventivi
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.1, marginTop: 2 }}>
            {clienteNome || '—'}
          </div>
          <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2, fontWeight: 600 }}>
            {versioni.length} version{versioni.length === 1 ? 'e' : 'i'}
            {versioneCorrente ? ` · v${versioneCorrente.versione} corrente` : ''}
          </div>
        </div>
        {versioneCorrente && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.3px', lineHeight: 1 }}>
              {fmtEur(versioneCorrente.totale_lordo)}
            </div>
            <div style={{ fontSize: 8, opacity: 0.85, marginTop: 2, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              v{versioneCorrente.versione}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 14 }}>

        {/* Banner snapshot info */}
        <div style={{
          background: '#fff',
          border: '1px solid #93C5FD',
          borderRadius: 11,
          padding: '11px 13px',
          marginBottom: 12,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#1E40AF', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontSize: 11, fontWeight: 800, letterSpacing: '0.5px',
          }}>PV</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1E3A8A', lineHeight: 1.2 }}>
              Snapshot dei dati
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 3, lineHeight: 1.4 }}>
              Ogni preventivo è una <b style={{ color: '#0F1B2D', fontWeight: 700 }}>copia immutabile</b> del rilievo. Modifiche del cliente creano una <b style={{ color: '#0F1B2D', fontWeight: 700 }}>nuova versione</b>.
            </div>
          </div>
        </div>

        {/* Header sezione */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 10px', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              background: '#1E3A5F', color: '#fff',
              fontSize: 10, fontWeight: 800,
              padding: '2px 7px', borderRadius: 5,
              minWidth: 22, textAlign: 'center',
            }}>{versioni.length}</span>
            <span style={{
              fontSize: 11, fontWeight: 800, color: '#0F1B2D',
              letterSpacing: '1px', textTransform: 'uppercase',
            }}>Versioni</span>
          </div>
        </div>

        {/* Bottone nuova versione */}
        {versioneCorrente && (
          <button
            onClick={() => setShowModalNuova(true)}
            style={{
              width: '100%',
              background: '#1E3A5F',
              color: '#fff',
              border: 'none',
              padding: '13px 14px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              boxShadow: '0 3px 0 0 #0F1B2D',
              fontFamily: 'inherit',
              marginBottom: 10,
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1={12} y1={5} x2={12} y2={19}/>
              <line x1={5} y1={12} x2={19} y2={12}/>
            </svg>
            Nuova versione
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: 30, textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
            Caricamento versioni…
          </div>
        )}

        {/* Empty */}
        {!loading && versioni.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: '#94A3B8', fontSize: 12, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            Nessuna versione del preventivo ancora.
          </div>
        )}

        {/* Lista versioni */}
        {!loading && versioni.map((v, idx) => {
          const isCurr = idx === 0
          const tag = tagStato(v.stato)
          const padre = versioni.find((p) => p.id === v.padre_id)
          const delta = padre ? Number(v.totale_lordo || 0) - Number(padre.totale_lordo || 0) : 0
          const modCount = (modificheById[v.id] || []).length
          const expanded = expandedId === v.id

          return (
            <VersioneCard
              key={v.id}
              versione={v}
              isCurrente={isCurr}
              padre={padre || null}
              delta={delta}
              modCount={modCount}
              tag={tag}
              expanded={expanded}
              diff={diffById[v.id] || []}
              modifiche={modificheById[v.id] || []}
              onToggle={() => setExpandedId(expanded ? null : v.id)}
              onApriPdf={() => onApriPdf?.(v.id, v.pdf_url)}
              onInviaLink={() => onInviaLink?.(v.id)}
              onApriEdit={() => onApriEdit?.(v.id)}
            />
          )
        })}

      </div>

      {/* Modale crea nuova versione */}
      {showModalNuova && versioneCorrente && (
        <ModaleCreaNuovaVersione
          versioneCorrente={versioneCorrente}
          motivo={motivoCliente}
          onMotivoChange={setMotivoCliente}
          creating={creatingNuova}
          onCancel={() => { setShowModalNuova(false); setMotivoCliente('') }}
          onConferma={onCreaNuovaVersione}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB: Card singola versione
// ═══════════════════════════════════════════════════════════════

function VersioneCard({
  versione: v, isCurrente, padre, delta, modCount, tag, expanded, diff, modifiche,
  onToggle, onApriPdf, onInviaLink, onApriEdit,
}: {
  versione: PreventivoVersione
  isCurrente: boolean
  padre: PreventivoVersione | null
  delta: number
  modCount: number
  tag: { label: string; bg: string; fg: string }
  expanded: boolean
  diff: DiffVano[]
  modifiche: PreventivoModifica[]
  onToggle: () => void
  onApriPdf: () => void
  onInviaLink: () => void
  onApriEdit: () => void
}) {
  const isFirmato = (v.stato || '').toLowerCase().includes('firma')
  const borderColor = isFirmato ? '#065F46' : isCurrente ? '#1E3A5F' : '#E2E8F0'

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 13,
      marginBottom: 8,
      overflow: 'hidden',
      boxShadow: isCurrente ? '0 4px 14px rgba(30,58,95,0.10)' : 'none',
    }}>
      {/* Header card */}
      <div onClick={onToggle} style={{
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        cursor: 'pointer',
      }}>
        {/* Numero versione */}
        <div style={{
          width: 46, height: 46, borderRadius: 11,
          background: isFirmato ? '#065F46' : isCurrente ? '#1E3A5F' : '#F1F5F9',
          color: isFirmato || isCurrente ? '#fff' : '#475569',
          border: `1.5px solid ${isFirmato ? '#064E3B' : isCurrente ? '#0F1B2D' : '#E2E8F0'}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontWeight: 800,
        }}>
          <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 0.4, lineHeight: 1 }}>VER.</div>
          <div style={{ fontSize: 14, lineHeight: 1, letterSpacing: '-0.3px', marginTop: 2 }}>{v.versione}</div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1B2D', letterSpacing: '-0.2px' }}>
              PV-{String(v.numero).padStart(3, '0')}
            </span>
            {isCurrente && (
              <span style={{
                fontSize: 8.5, fontWeight: 800,
                padding: '2px 6px', borderRadius: 5,
                background: '#1E3A5F', color: '#fff',
                letterSpacing: '0.3px', textTransform: 'uppercase',
              }}>Corrente</span>
            )}
            <span style={{
              fontSize: 8.5, fontWeight: 800,
              padding: '2px 6px', borderRadius: 5,
              background: tag.bg, color: tag.fg,
              letterSpacing: '0.3px', textTransform: 'uppercase',
            }}>{tag.label}</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.4, fontWeight: 500 }}>
            {fmtData(v.data_emissione || v.created_at)}
            {' · '}
            {padre ? (
              <span><b style={{ color: '#0F1B2D' }}>{modCount} modifiche</b> da v{padre.versione}</span>
            ) : (
              <span><b style={{ color: '#0F1B2D' }}>Versione iniziale</b></span>
            )}
          </div>
        </div>

        {/* Totale */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', lineHeight: 1, letterSpacing: '-0.3px' }}>
            {fmtEur(v.totale_lordo)}
          </div>
          <div style={{ fontSize: 8.5, color: '#475569', fontWeight: 700, marginTop: 2, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Iva incl.
          </div>
          {padre && delta !== 0 && (
            <div style={{
              fontSize: 9.5, fontWeight: 800,
              marginTop: 3, letterSpacing: 0.3,
              color: delta < 0 ? '#065F46' : '#991B1B',
            }}>
              {delta < 0 ? '−' : '+'}{fmtEur(Math.abs(delta)).replace('€ ', '')}
            </div>
          )}
        </div>

        {/* Chevron */}
        <div style={{
          marginLeft: 5,
          color: expanded ? '#1E3A5F' : '#94A3B8',
          flexShrink: 0,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Body espanso */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #F1F5F9' }}>

          {/* Diff modifiche */}
          {diff.length > 0 && diff.some((d) => d.stato !== 'invariato') && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 800, color: '#475569',
                letterSpacing: 1, textTransform: 'uppercase',
                margin: '12px 0 6px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>Modifiche da v{padre?.versione} → v{v.versione}</span>
                <span style={{
                  background: '#1E3A5F', color: '#fff',
                  fontSize: 9, padding: '2px 6px', borderRadius: 5, fontWeight: 800,
                }}>{diff.filter((d) => d.stato !== 'invariato').length}</span>
              </div>
              {diff.filter((d) => d.stato !== 'invariato').map((d, i) => (
                <DiffRow key={i} d={d} />
              ))}
            </>
          )}

          {/* Versione iniziale */}
          {!padre && (
            <div style={{
              padding: '14px 12px', textAlign: 'center',
              fontSize: 11, color: '#475569', fontStyle: 'italic',
              background: '#F8FAFC', borderRadius: 9, marginTop: 10,
            }}>
              Versione iniziale del preventivo. Nessun confronto disponibile.
            </div>
          )}

          {/* Azioni */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 11 }}>
            <button onClick={onApriPdf} style={btnAct('primary')}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Apri PDF
            </button>
            <button onClick={onInviaLink} style={btnAct()}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1={22} y1={2} x2={11} y2={13}/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Invia link
            </button>
            {(v.stato || '').toLowerCase() === 'bozza' && (
              <button onClick={onApriEdit} style={btnAct()}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Modifica
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB: Riga diff modifica
// ═══════════════════════════════════════════════════════════════

function DiffRow({ d }: { d: DiffVano }) {
  let icoBg = '#FEF3C7', icoFg = '#92400E', icoLbl = 'M', titolo = ''
  if (d.stato === 'aggiunto') {
    icoBg = '#D1FAE5'; icoFg = '#065F46'; icoLbl = '+'
    titolo = 'Vano aggiunto'
  } else if (d.stato === 'rimosso') {
    icoBg = '#FEE2E2'; icoFg = '#991B1B'; icoLbl = '−'
    titolo = 'Vano rimosso'
  } else {
    titolo = d.modifiche.length > 0
      ? d.modifiche.map((m) => labelCampo(m.campo)).slice(0, 2).join(', ')
      : 'Modificato'
  }

  return (
    <div style={{
      background: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: 9,
      padding: '10px 11px',
      marginBottom: 5,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6,
        background: icoBg, color: icoFg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: 11, fontWeight: 800, letterSpacing: '-0.3px',
      }}>{icoLbl}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F1B2D', lineHeight: 1.2 }}>
          {titolo}
        </div>
        {d.modifiche.length > 0 && d.modifiche.slice(0, 3).map((m, i) => (
          <div key={i} style={{
            fontSize: 10.5, color: '#475569',
            marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{ fontWeight: 600 }}>{labelCampo(m.campo)}:</span>
            <span style={{ color: '#991B1B', textDecoration: 'line-through', fontWeight: 600 }}>
              {valoreFormat(m.prima)}
            </span>
            <span style={{ color: '#94A3B8', fontWeight: 700 }}>→</span>
            <span style={{ color: '#065F46', fontWeight: 700 }}>
              {valoreFormat(m.dopo)}
            </span>
          </div>
        ))}
        <span style={{
          fontSize: 9.5, color: '#475569',
          background: '#fff', border: '1px solid #E2E8F0',
          padding: '1px 6px', borderRadius: 4, fontWeight: 700,
          letterSpacing: '0.3px', display: 'inline-block', marginTop: 4,
        }}>{d.nome}</span>
        {d.delta !== 0 && (
          <span style={{
            fontSize: 9.5, fontWeight: 800,
            color: d.delta < 0 ? '#065F46' : '#991B1B',
            marginLeft: 6,
          }}>
            {d.delta < 0 ? '−' : '+'}{fmtEur(Math.abs(d.delta)).replace('€ ', '€')}
          </span>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB: Modale "crea nuova versione"
// ═══════════════════════════════════════════════════════════════

function ModaleCreaNuovaVersione({
  versioneCorrente, motivo, onMotivoChange, creating, onCancel, onConferma,
}: {
  versioneCorrente: PreventivoVersione
  motivo: string
  onMotivoChange: (s: string) => void
  creating: boolean
  onCancel: () => void
  onConferma: () => void
}) {
  return (
    <div onClick={onCancel} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9700,
      background: 'rgba(15,27,45,0.55)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff',
        borderRadius: '18px 18px 0 0',
        width: '100%',
        maxWidth: 520,
        padding: '18px 16px 14px',
        maxHeight: '80%',
        overflowY: 'auto',
      }}>
        {/* Header modale */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 11 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#1E3A5F', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontSize: 11, fontWeight: 800, letterSpacing: '0.4px',
          }}>+v</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              Crea nuova versione
            </div>
            <div style={{ fontSize: 10.5, color: '#475569', marginTop: 3, lineHeight: 1.4 }}>
              v{versioneCorrente.versione} resta intatta come storia · v{versioneCorrente.versione + 1} sarà la copia da modificare
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #CBD5E1',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 10.5,
          color: '#475569',
          lineHeight: 1.5,
          marginBottom: 10,
        }}>
          <b style={{ color: '#0F1B2D', fontWeight: 700 }}>Funziona così:</b>
          <ul style={{ margin: '5px 0 0', paddingLeft: 16 }}>
            <li>v{versioneCorrente.versione} ({fmtEur(versioneCorrente.totale_lordo)}) <b style={{ color: '#0F1B2D' }}>non viene toccata</b></li>
            <li>v{versioneCorrente.versione + 1} nasce come <b style={{ color: '#0F1B2D' }}>copia esatta</b></li>
            <li>Modifiche su v{versioneCorrente.versione + 1} sono <b style={{ color: '#0F1B2D' }}>tracciate</b> nel diff</li>
            <li>Cliente vede solo <b style={{ color: '#0F1B2D' }}>l'ultima versione</b> attiva</li>
          </ul>
        </div>

        {/* Note cliente */}
        <div style={{ marginBottom: 11 }}>
          <div style={{
            fontSize: 9.5, fontWeight: 800,
            color: '#475569',
            letterSpacing: '0.8px', textTransform: 'uppercase',
            marginBottom: 6,
          }}>Note del cliente <span style={{ fontWeight: 600, opacity: 0.7 }}>(opzionale)</span></div>
          <textarea
            value={motivo}
            onChange={(e) => onMotivoChange(e.target.value)}
            placeholder="Es. Cambia colore soggiorno con antracite, togliere zanzariera bagno…"
            rows={3}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 10,
              border: '1.5px solid #CBD5E1',
              fontSize: 11,
              color: '#0F1B2D',
              fontFamily: 'inherit',
              resize: 'vertical',
              background: '#FEF3C7',
              outline: 'none',
            }}
          />
        </div>

        {/* Azioni */}
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={onCancel} disabled={creating} style={{
            flex: 1,
            padding: 11,
            borderRadius: 10,
            border: '1.5px solid #CBD5E1',
            background: '#fff',
            color: '#0F1B2D',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}>Annulla</button>
          <button onClick={onConferma} disabled={creating} style={{
            flex: 1,
            padding: 11,
            borderRadius: 10,
            border: '1.5px solid #0F1B2D',
            background: '#1E3A5F',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            cursor: creating ? 'wait' : 'pointer',
            boxShadow: '0 3px 0 0 #0F1B2D',
            fontFamily: 'inherit',
            opacity: creating ? 0.7 : 1,
          }}>
            {creating ? 'Creo...' : `Crea v${versioneCorrente.versione + 1} e modifica`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const btnAct = (variant?: 'primary'): React.CSSProperties => ({
  flex: 1,
  minWidth: 90,
  background: variant === 'primary' ? '#1E3A5F' : '#fff',
  color: variant === 'primary' ? '#fff' : '#1E3A5F',
  border: `1px solid ${variant === 'primary' ? '#0F1B2D' : '#CBD5E1'}`,
  padding: '9px 12px',
  borderRadius: 9,
  fontSize: 10.5,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  letterSpacing: '0.3px',
  fontFamily: 'inherit',
})

function labelCampo(campo: string): string {
  const map: Record<string, string> = {
    tipo: 'Tipo',
    pezzi: 'Pezzi',
    sistema: 'Sistema',
    sottosistema: 'Sottosistema',
    vetro: 'Vetro',
    colore_int: 'Colore int.',
    colore_est: 'Colore est.',
    bicolore: 'Bicolore',
    colore_acc: 'Colore acc.',
    telaio: 'Telaio',
    rifilato: 'Rifilato',
    cassonetto: 'Cassonetto',
    cassonetto_tipo: 'Tipo cassonetto',
    prezzo_unitario_calcolato: 'Prezzo',
    prezzo_unitario_override: 'Prezzo (man.)',
    posa_prezzo: 'Posa',
    note: 'Note',
  }
  return map[campo] || campo
}

function valoreFormat(v: any): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Sì' : 'No'
  if (typeof v === 'number') return v.toLocaleString('it-IT')
  if (typeof v === 'string') return v.length > 20 ? v.slice(0, 18) + '…' : v
  return JSON.stringify(v).slice(0, 20)
}
