'use client';

// ============================================================
// MASTRO - TimerLavoroMobile
// fliwoX dark - 100% inline CSS (no Tailwind)
// ============================================================

import { useState, type CSSProperties } from 'react';
import { useTimerLavoro, formatHMS } from '@/hooks/useTimerLavoro';
import {
  FASI_LAVORO_LABEL,
  type FaseLavoro,
  type CommessaMinima,
} from '@/lib/timer-lavoro-types';

const T = {
  bg: '#0D1F1F',
  card: '#13302F',
  bdr: '#1F4644',
  acc: '#28A0A0',
  accDim: '#1E7A7A',
  text: '#EEF8F8',
  muted: '#7FB5B5',
  warn: '#E8B33A',
  danger: '#E36D6D',
};

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
    background: T.bg,
    color: T.text,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
    boxSizing: 'border-box',
  } as CSSProperties,
  header: {
    padding: '24px 20px 16px',
    borderBottom: `1px solid ${T.bdr}`,
  } as CSSProperties,
  hLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.muted,
  } as CSSProperties,
  hTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginTop: 4,
  } as CSSProperties,
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 20px 24px',
  } as CSSProperties,
  field: { marginBottom: 16 } as CSSProperties,
  label: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.muted,
    display: 'block',
  } as CSSProperties,
  select: {
    width: '100%',
    marginTop: 8,
    padding: '14px 16px',
    fontSize: 16,
    background: T.card,
    color: T.text,
    border: `1px solid ${T.bdr}`,
    borderRadius: 10,
    outline: 'none',
    boxSizing: 'border-box',
  } as CSSProperties,
  ctaWrap: { marginTop: 'auto', paddingTop: 24 } as CSSProperties,
  bigBtn: {
    width: '100%',
    padding: '28px 0',
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: 1.5,
    border: 'none',
    borderRadius: 18,
    cursor: 'pointer',
    boxShadow: '0 6px 0 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
    transition: 'transform 0.05s',
  } as CSSProperties,
  secBtn: {
    width: '100%',
    padding: '14px 0',
    fontSize: 15,
    fontWeight: 600,
    background: 'transparent',
    border: `1px solid ${T.bdr}`,
    color: T.text,
    borderRadius: 12,
    cursor: 'pointer',
    marginTop: 12,
  } as CSSProperties,
  err: {
    margin: '12px 20px 0',
    padding: 12,
    background: '#3a1d1d',
    color: T.danger,
    border: `1px solid ${T.danger}`,
    borderRadius: 8,
    fontSize: 14,
  } as CSSProperties,
  activeWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 0',
  } as CSSProperties,
  activeMeta: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.muted, marginBottom: 6 } as CSSProperties,
  activeFase: { fontSize: 14, color: T.acc, marginBottom: 24 } as CSSProperties,
  timer: {
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    fontSize: 64,
    letterSpacing: -1,
  } as CSSProperties,
  activeStato: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.muted, marginTop: 12 } as CSSProperties,
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
  const commessaAttiva = snapshot.sessione
    ? commesseDisponibili.find(c => c.id === snapshot.sessione!.commessa_id)
    : null;

  if (loading) {
    return (
      <div style={{ ...S.root, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: T.muted }}>Caricamento timer...</div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.hLabel}>Timer Lavoro</div>
        <div style={S.hTitle}>{isIdle ? 'Pronto' : isPaused ? 'In pausa' : 'In corso'}</div>
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
              {commessaAttiva ? `${commessaAttiva.numero ?? '—'} · ${commessaAttiva.cliente_nome ?? ''}` : 'Commessa'}
            </div>
            <div style={S.activeFase}>
              {FASI_LAVORO_LABEL[(snapshot.sessione?.fase as FaseLavoro) ?? 'altro'] ?? snapshot.sessione?.fase}
            </div>
            <div style={{ ...S.timer, color: isPaused ? T.warn : T.acc }}>
              {formatHMS(snapshot.elapsedSeconds)}
            </div>
            <div style={S.activeStato}>{isPaused ? 'In pausa' : 'In esecuzione'}</div>
          </div>
        )}

        <div style={S.ctaWrap}>
          {isIdle && (
            <button
              onClick={() => commessaId && start({ commessaId, fase })}
              disabled={!commessaId}
              style={{
                ...S.bigBtn,
                background: commessaId ? T.acc : T.accDim,
                color: '#0D1F1F',
                opacity: commessaId ? 1 : 0.5,
                cursor: commessaId ? 'pointer' : 'not-allowed',
              }}
            >START</button>
          )}
          {isRunning && (
            <>
              <button
                onClick={() => stop()}
                style={{ ...S.bigBtn, background: T.danger, color: '#0D1F1F' }}
              >STOP</button>
              <button onClick={pause} style={S.secBtn}>❚❚  Pausa</button>
            </>
          )}
          {isPaused && (
            <>
              <button
                onClick={resume}
                style={{ ...S.bigBtn, background: T.warn, color: '#0D1F1F' }}
              >RIPRENDI</button>
              <button onClick={() => stop()} style={{ ...S.secBtn, color: T.danger, borderColor: T.danger }}>STOP</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
