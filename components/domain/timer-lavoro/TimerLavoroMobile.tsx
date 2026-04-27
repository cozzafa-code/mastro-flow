'use client';

// ============================================================
// MASTRO — TimerLavoroMobile (light Google-style)
// Operaio in officina/cantiere — un pollice — bottone enorme
// ============================================================

import { useState, type CSSProperties } from 'react';
import { useTimerLavoro, formatHMS } from '@/hooks/useTimerLavoro';
import { C, FONT, SHADOW, RADIUS } from '@/lib/timer-lavoro-ui';
import {
  FASI_LAVORO_LABEL,
  type FaseLavoro,
  type CommessaMinima,
} from '@/lib/timer-lavoro-types';

const FASI: FaseLavoro[] = [
  'rilievo','taglio','saldatura','assemblaggio','ferratura',
  'imballaggio','carico','trasporto','posa','collaudo','altro',
];

interface Props {
  operatoreId: string;
  aziendaId: string;
  commesseDisponibili: CommessaMinima[];
}

const S = {
  root: {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    fontFamily: FONT.ui,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  } as CSSProperties,
  header: {
    padding: '20px 20px 16px',
    background: C.card,
    borderBottom: `1px solid ${C.border}`,
  } as CSSProperties,
  hLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: C.muted,
    fontWeight: 600,
  } as CSSProperties,
  hTitle: { fontSize: 20, fontWeight: 600, marginTop: 4, color: C.text } as CSSProperties,
  body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 20 } as CSSProperties,
  field: { marginBottom: 16 } as CSSProperties,
  label: {
    fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
    color: C.muted, display: 'block', marginBottom: 8, fontWeight: 600,
  } as CSSProperties,
  select: {
    width: '100%', padding: '14px 16px', fontSize: 16,
    background: C.card, color: C.text,
    border: `1px solid ${C.border}`, borderRadius: RADIUS.lg,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: FONT.ui, boxShadow: SHADOW.button,
  } as CSSProperties,
  ctaWrap: { marginTop: 'auto', paddingTop: 24 } as CSSProperties,
  bigBtn: {
    width: '100%', padding: '32px 0', fontSize: 28,
    fontWeight: 700, letterSpacing: 1, color: '#fff',
    border: 'none', borderRadius: RADIUS.xl, cursor: 'pointer',
    fontFamily: FONT.ui, boxShadow: SHADOW.buttonPrimary,
    transition: 'transform 0.05s, background 0.15s',
  } as CSSProperties,
  secBtn: {
    width: '100%', padding: '14px 0', fontSize: 15, fontWeight: 600,
    background: C.card, border: `1px solid ${C.border}`, color: C.text,
    borderRadius: RADIUS.lg, cursor: 'pointer', marginTop: 12,
    fontFamily: FONT.ui, boxShadow: SHADOW.button,
  } as CSSProperties,
  err: {
    margin: '12px 20px 0', padding: 12,
    background: C.dangerSoft, color: C.danger,
    border: `1px solid ${C.danger}`, borderRadius: RADIUS.md, fontSize: 14,
  } as CSSProperties,
  activeWrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '24px 0',
  } as CSSProperties,
  activeMeta: {
    fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
    color: C.muted, fontWeight: 600, marginBottom: 6,
  } as CSSProperties,
  activeName: { fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 4, textAlign: 'center', padding: '0 16px' } as CSSProperties,
  activeFase: { fontSize: 14, color: C.tealDark, fontWeight: 500, marginBottom: 32 } as CSSProperties,
  timer: { fontFamily: FONT.mono, fontSize: 64, letterSpacing: -2, fontWeight: 600 } as CSSProperties,
  pillStato: {
    marginTop: 16, padding: '6px 14px', fontSize: 12, fontWeight: 600,
    letterSpacing: 0.5, borderRadius: RADIUS.full, textTransform: 'uppercase',
  } as CSSProperties,
  loading: {
    minHeight: '100vh', background: C.bg, fontFamily: FONT.ui,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as CSSProperties,
};

export default function TimerLavoroMobile({ operatoreId, aziendaId, commesseDisponibili }: Props) {
  const { snapshot, loading, error, start, pause, resume, stop } =
    useTimerLavoro({ operatoreId, aziendaId });
  const [commessaId, setCommessaId] = useState('');
  const [fase, setFase] = useState<FaseLavoro>('posa');

  const stato = snapshot.stato;
  const isIdle = stato === 'idle';
  const isRunning = stato === 'running';
  const isPaused = stato === 'paused';
  const sessione = snapshot.sessione;
  const commessaAttiva = sessione
    ? commesseDisponibili.find(c => c.id === sessione.commessa_id)
    : null;

  if (loading) {
    return <div style={S.loading}><div style={{ fontSize: 14, color: C.muted }}>Caricamento timer…</div></div>;
  }

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.hLabel}>Timer Lavoro</div>
        <div style={S.hTitle}>{isIdle ? 'Pronto' : isPaused ? 'In pausa' : 'In esecuzione'}</div>
      </div>

      {error && <div style={S.err}>{error}</div>}

      <div style={S.body}>
        {isIdle ? (
          <>
            <div style={S.field}>
              <label style={S.label}>Commessa</label>
              <select style={S.select} value={commessaId} onChange={e => setCommessaId(e.target.value)}>
                <option value="">— Seleziona —</option>
                {commesseDisponibili.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.numero ?? '—'} · {c.cliente_nome ?? 'Cliente'}
                  </option>
                ))}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Fase</label>
              <select style={S.select} value={fase} onChange={e => setFase(e.target.value as FaseLavoro)}>
                {FASI.map(f => <option key={f} value={f}>{FASI_LAVORO_LABEL[f]}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div style={S.activeWrap}>
            <div style={S.activeMeta}>
              {commessaAttiva ? commessaAttiva.numero ?? 'Commessa' : 'Commessa'}
            </div>
            <div style={S.activeName}>
              {commessaAttiva?.cliente_nome ?? '—'}
            </div>
            <div style={S.activeFase}>
              {FASI_LAVORO_LABEL[(sessione?.fase as FaseLavoro) ?? 'altro'] ?? sessione?.fase}
            </div>
            <div style={{ ...S.timer, color: isPaused ? C.warn : C.tealDark }}>
              {formatHMS(snapshot.elapsedSeconds)}
            </div>
            <div style={{
              ...S.pillStato,
              background: isPaused ? C.warnSoft : C.tealSoft,
              color: isPaused ? C.warn : C.tealDark,
            }}>
              {isPaused ? '❚❚ in pausa' : '● in corso'}
            </div>
          </div>
        )}

        <div style={S.ctaWrap}>
          {isIdle && (
            <button
              onClick={() => commessaId && start({ commessaId, fase })}
              disabled={!commessaId}
              style={{
                ...S.bigBtn,
                background: commessaId ? C.tealDark : C.borderStrong,
                cursor: commessaId ? 'pointer' : 'not-allowed',
              }}
            >▶  AVVIA</button>
          )}
          {isRunning && (
            <>
              <button onClick={() => stop()} style={{ ...S.bigBtn, background: C.danger }}>
                ■  STOP
              </button>
              <button onClick={pause} style={S.secBtn}>❚❚  Pausa</button>
            </>
          )}
          {isPaused && (
            <>
              <button onClick={resume} style={{ ...S.bigBtn, background: C.warn }}>
                ▶  RIPRENDI
              </button>
              <button onClick={() => stop()} style={{ ...S.secBtn, color: C.danger, borderColor: C.danger }}>
                ■  STOP
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
