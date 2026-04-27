'use client';

// ============================================================
// MASTRO — TimerLavoroMobile v5
// + modal STOP motivi
// + fix scatti: min-height costante, pill min-width, transizioni
// ============================================================

import { useState, type CSSProperties } from 'react';
import { useTimerLavoro, formatHMS } from '@/hooks/useTimerLavoro';
import { MC, MF, MS, MR, MP, sectionLabel } from '@/constants/design-system';
import { OperatoreAvatar } from './_ui';
import TimerStopMotivoModal from './TimerStopMotivoModal';
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
  operatoreNome?: string | null;
  commesseDisponibili: CommessaMinima[];
}

const S = {
  root: {
    minHeight: '100vh', background: MC.bg, color: MC.text,
    fontFamily: MF.ui, display: 'flex', flexDirection: 'column',
    boxSizing: 'border-box',
  } as CSSProperties,
  hero: {
    padding: '20px 20px 24px', background: MC.card,
    borderBottom: `1px solid ${MC.border}`,
    display: 'flex', alignItems: 'center', gap: 14,
  } as CSSProperties,
  heroText: { flex: 1, minWidth: 0 } as CSSProperties,
  heroLabel: { ...sectionLabel, marginBottom: 2 } as CSSProperties,
  heroName: { fontSize: 18, fontWeight: 600, color: MC.text } as CSSProperties,
  // pill min-width fisso → niente scatto orizzontale
  heroPill: {
    fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
    padding: '5px 12px', borderRadius: MR.full,
    minWidth: 110, textAlign: 'center' as const,
    transition: 'background 0.2s, color 0.2s',
  } as CSSProperties,

  body: {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: '20px 20px 24px',
    // min-height costante → niente scatto verticale
    minHeight: 480,
  } as CSSProperties,

  // Wrapper contenuto principale (idle vs active) con altezza minima
  contentSlot: { minHeight: 320 } as CSSProperties,

  field: { marginBottom: MP.s4 } as CSSProperties,
  label: { ...sectionLabel, display: 'block', marginBottom: 8 } as CSSProperties,
  select: {
    width: '100%', padding: '14px 16px', fontSize: 16,
    background: MC.card, color: MC.text,
    border: `1px solid ${MC.border}`, borderRadius: MR.lg,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: MF.ui, boxShadow: MS.button,
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'><path fill=\'%2364748B\' d=\'M6 8L0 0h12z\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    paddingRight: 40,
  } as CSSProperties,

  activeCard: {
    background: MC.card, border: `1px solid ${MC.border}`,
    borderRadius: MR.xl, padding: '28px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: MS.card,
    minHeight: 280,
    justifyContent: 'center',
  } as CSSProperties,
  activeCmNum: { ...sectionLabel, marginBottom: 4 } as CSSProperties,
  activeCmName: {
    fontSize: 17, fontWeight: 600, color: MC.text,
    textAlign: 'center' as const, marginBottom: 8,
  } as CSSProperties,
  activeFasePill: {
    display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
    color: MC.tealDark, background: MC.tealSoft,
    padding: '4px 12px', borderRadius: MR.full, marginBottom: 24,
  } as CSSProperties,
  timer: {
    fontFamily: MF.mono, fontSize: 56, fontWeight: 600,
    letterSpacing: -2, lineHeight: 1, transition: 'color 0.2s',
  } as CSSProperties,

  ctaWrap: { marginTop: MP.s5 } as CSSProperties,
  bigBtn: {
    width: '100%', padding: '24px 0', fontSize: 22,
    fontWeight: 700, letterSpacing: 1, color: '#fff',
    border: 'none', borderRadius: MR.xl, cursor: 'pointer',
    fontFamily: MF.ui, boxShadow: MS.buttonPrimary,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    transition: 'background 0.2s, transform 0.05s',
  } as CSSProperties,
  secBtn: {
    width: '100%', padding: '14px 0', fontSize: 15, fontWeight: 600,
    background: MC.card, border: `1px solid ${MC.border}`, color: MC.text,
    borderRadius: MR.lg, cursor: 'pointer', marginTop: MP.s3,
    fontFamily: MF.ui, boxShadow: MS.button,
  } as CSSProperties,

  err: {
    margin: `${MP.s3}px ${MP.s5}px 0`, padding: MP.s3,
    background: MC.dangerSoft, color: MC.danger,
    border: `1px solid ${MC.danger}`, borderRadius: MR.md, fontSize: 14,
  } as CSSProperties,
  loading: {
    minHeight: '100vh', background: MC.bg, fontFamily: MF.ui,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: MC.muted, fontSize: 14,
  } as CSSProperties,
};

export default function TimerLavoroMobile({
  operatoreId, aziendaId, operatoreNome, commesseDisponibili,
}: Props) {
  const { snapshot, loading, error, start, pause, resume, stop } =
    useTimerLavoro({ operatoreId, aziendaId });
  const [commessaId, setCommessaId] = useState('');
  const [fase, setFase] = useState<FaseLavoro>('posa');
  const [showStopModal, setShowStopModal] = useState(false);

  const stato = snapshot.stato;
  const isIdle = stato === 'idle';
  const isRunning = stato === 'running';
  const isPaused = stato === 'paused';
  const sessione = snapshot.sessione;
  const commessaAttiva = sessione
    ? commesseDisponibili.find(c => c.id === sessione.commessa_id)
    : null;

  if (loading) return <div style={S.loading}>Caricamento timer…</div>;

  let pillBg = MC.bgSubtle, pillFg = MC.muted, pillTxt = '● Pronto';
  if (isRunning) { pillBg = MC.tealSoft; pillFg = MC.tealDark; pillTxt = '● In corso'; }
  if (isPaused)  { pillBg = MC.warnSoft; pillFg = MC.warn;     pillTxt = '❚❚ In pausa'; }

  return (
    <>
      <div style={S.root}>
        <div style={S.hero}>
          <OperatoreAvatar nome={operatoreNome ?? 'Operatore'} size={48} />
          <div style={S.heroText}>
            <div style={S.heroLabel}>Timer Lavoro</div>
            <div style={S.heroName}>{operatoreNome ?? 'Operatore'}</div>
          </div>
          <div style={{ ...S.heroPill, background: pillBg, color: pillFg }}>{pillTxt}</div>
        </div>

        {error && <div style={S.err}>{error}</div>}

        <div style={S.body}>
          <div style={S.contentSlot}>
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
              <div style={S.activeCard}>
                <div style={S.activeCmNum}>{commessaAttiva?.numero ?? 'Commessa'}</div>
                <div style={S.activeCmName}>{commessaAttiva?.cliente_nome ?? '—'}</div>
                <div style={S.activeFasePill}>
                  {FASI_LAVORO_LABEL[(sessione?.fase as FaseLavoro) ?? 'altro'] ?? sessione?.fase}
                </div>
                <div style={{ ...S.timer, color: isPaused ? MC.warn : MC.tealDark }}>
                  {formatHMS(snapshot.elapsedSeconds)}
                </div>
              </div>
            )}
          </div>

          <div style={S.ctaWrap}>
            {isIdle && (
              <button
                onClick={() => commessaId && start({ commessaId, fase })}
                disabled={!commessaId}
                style={{
                  ...S.bigBtn,
                  background: commessaId ? MC.tealDark : MC.borderStrong,
                  cursor: commessaId ? 'pointer' : 'not-allowed',
                  opacity: commessaId ? 1 : 0.6,
                }}
              >▶  AVVIA</button>
            )}
            {isRunning && (
              <>
                <button onClick={() => setShowStopModal(true)} style={{ ...S.bigBtn, background: MC.danger }}>
                  ■  STOP
                </button>
                <button onClick={pause} style={S.secBtn}>❚❚  Pausa</button>
              </>
            )}
            {isPaused && (
              <>
                <button onClick={resume} style={{ ...S.bigBtn, background: MC.warn }}>
                  ▶  RIPRENDI
                </button>
                <button onClick={() => setShowStopModal(true)} style={{ ...S.secBtn, color: MC.danger, borderColor: MC.danger }}>
                  ■  STOP
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <TimerStopMotivoModal
        open={showStopModal}
        onCancel={() => setShowStopModal(false)}
        onConfirm={async (args) => {
          setShowStopModal(false);
          await stop(args);
        }}
      />
    </>
  );
}
