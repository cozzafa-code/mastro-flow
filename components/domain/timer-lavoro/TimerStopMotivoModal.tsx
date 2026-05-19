'use client';

// ============================================================
// MASTRO — TimerStopMotivoModal
// Bottom sheet mobile + dialog desktop
// ============================================================

import { useEffect, useState, type CSSProperties } from 'react';
import { MC, MF, MS, MR, MP, sectionLabel } from '@/constants/design-system';
import {
  MOTIVO_STOP_LABEL,
  type MotivoStop,
  type StopArgs,
} from '@/lib/timer-lavoro-types';

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: (args: StopArgs) => void;
}

const MOTIVI: MotivoStop[] = [
  'completato', 'pausa_pranzo', 'cambio_commessa',
  'problema', 'fine_giornata', 'altro',
];

export default function TimerStopMotivoModal({ open, onCancel, onConfirm }: Props) {
  const [motivo, setMotivo] = useState<MotivoStop | null>(null);
  const [dettaglio, setDettaglio] = useState('');
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMotivo(null);
      setDettaglio('');
      setErrore(null);
    }
  }, [open]);

  if (!open) return null;

  const richiedeDettaglio = motivo === 'problema';
  const conferma = () => {
    if (!motivo) {
      setErrore('Seleziona un motivo');
      return;
    }
    if (richiedeDettaglio && dettaglio.trim().length < 3) {
      setErrore('Spiega cosa è successo (almeno 3 caratteri)');
      return;
    }
    onConfirm({ motivo, dettaglio: dettaglio.trim() || undefined });
  };

  return (
    <div style={S.backdrop} onClick={onCancel}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.handle} />
        <div style={sectionLabel}>Stop timer</div>
        <div style={S.title}>Perché stai fermando?</div>

        <div style={S.grid}>
          {MOTIVI.map(m => {
            const sel = motivo === m;
            const isProblema = m === 'problema';
            return (
              <button
                key={m}
                onClick={() => { setMotivo(m); setErrore(null); }}
                style={{
                  ...S.chip,
                  background: sel
                    ? (isProblema ? MC.dangerSoft : MC.tealSoft)
                    : MC.card,
                  color: sel
                    ? (isProblema ? MC.danger : MC.tealDark)
                    : MC.text,
                  border: `1.5px solid ${sel
                    ? (isProblema ? MC.danger : MC.tealDark)
                    : MC.border}`,
                  fontWeight: sel ? 600 : 500,
                }}
              >
                {MOTIVO_STOP_LABEL[m]}
              </button>
            );
          })}
        </div>

        {richiedeDettaglio && (
          <div style={S.detailWrap}>
            <label style={S.detailLabel}>
              Spiega cosa è successo
              <span style={{ color: MC.danger, marginLeft: 4 }}>*</span>
            </label>
            <textarea
              value={dettaglio}
              onChange={e => setDettaglio(e.target.value)}
              placeholder="Es. profilo difettoso, manca materiale, vetro rotto..."
              rows={3}
              style={S.textarea}
              autoFocus
            />
            <div style={S.hint}>
              Il responsabile riceverà una notifica con questo messaggio.
            </div>
          </div>
        )}

        {errore && <div style={S.error}>{errore}</div>}

        <div style={S.actions}>
          <button onClick={onCancel} style={S.btnCancel}>Annulla</button>
          <button
            onClick={conferma}
            style={{
              ...S.btnConfirm,
              background: motivo === 'problema' ? MC.danger : MC.tealDark,
            }}
          >
            Conferma stop
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(15,23,42,0.40)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    fontFamily: MF.ui,
  } as CSSProperties,
  sheet: {
    width: '100%', maxWidth: 560,
    background: MC.card, color: MC.text,
    borderRadius: `${MR['2xl']}px ${MR['2xl']}px 0 0`,
    padding: `${MP.s4}px ${MP.s5}px ${MP.s6}px`,
    boxShadow: MS.modal,
    display: 'flex', flexDirection: 'column', gap: MP.s3,
    maxHeight: '90vh', overflowY: 'auto',
  } as CSSProperties,
  handle: {
    width: 40, height: 4, borderRadius: MR.full,
    background: MC.borderStrong, alignSelf: 'center', marginBottom: MP.s2,
  } as CSSProperties,
  title: {
    fontSize: 20, fontWeight: 700, color: MC.text,
    marginTop: 2, marginBottom: MP.s2,
  } as CSSProperties,
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: MP.s2,
  } as CSSProperties,
  chip: {
    padding: '14px 12px',
    fontSize: 14,
    borderRadius: MR.lg,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    textAlign: 'center' as const,
  } as CSSProperties,
  detailWrap: { marginTop: MP.s3 } as CSSProperties,
  detailLabel: {
    ...sectionLabel,
    display: 'block', marginBottom: 6,
  } as CSSProperties,
  textarea: {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    background: MC.card, color: MC.text,
    border: `1.5px solid ${MC.danger}`,
    borderRadius: MR.md,
    outline: 'none', resize: 'vertical',
    fontFamily: 'inherit', boxSizing: 'border-box',
  } as CSSProperties,
  hint: {
    fontSize: 12, color: MC.muted, marginTop: 6,
  } as CSSProperties,
  error: {
    padding: 10, background: MC.dangerSoft, color: MC.danger,
    border: `1px solid ${MC.danger}`, borderRadius: MR.md,
    fontSize: 13, fontWeight: 500,
  } as CSSProperties,
  actions: {
    display: 'grid', gridTemplateColumns: '1fr 2fr', gap: MP.s3,
    marginTop: MP.s3,
  } as CSSProperties,
  btnCancel: {
    padding: '14px 0', fontSize: 15, fontWeight: 600,
    background: MC.card, color: MC.textSoft,
    border: `1px solid ${MC.border}`, borderRadius: MR.lg,
    cursor: 'pointer', fontFamily: 'inherit',
  } as CSSProperties,
  btnConfirm: {
    padding: '14px 0', fontSize: 15, fontWeight: 700,
    color: '#fff', border: 'none', borderRadius: MR.lg,
    cursor: 'pointer', fontFamily: 'inherit', boxShadow: MS.button,
  } as CSSProperties,
};
