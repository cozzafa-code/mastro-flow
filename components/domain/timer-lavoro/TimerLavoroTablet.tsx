'use client';

// ============================================================
// MASTRO — TimerLavoroTablet (light Google-style)
// Sopralluogo / posa / squadra: sidebar collassabile + split
// ============================================================

import { useState, type CSSProperties } from 'react';
import { useTimerLavoro, formatHMS, formatDuration } from '@/hooks/useTimerLavoro';
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
  root: { minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONT.ui, boxSizing: 'border-box' } as CSSProperties,
  container: { maxWidth: 1100, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 } as CSSProperties,
  smallLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C.muted, marginBottom: 12, fontWeight: 600 } as CSSProperties,
  cardList: { background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, overflow: 'hidden', boxShadow: SHADOW.card } as CSSProperties,
  rowEmpty: { padding: 24, fontSize: 14, color: C.muted } as CSSProperties,
  cmRow: {
    width: '100%', textAlign: 'left', padding: '14px 18px',
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 14, color: C.text,
  } as CSSProperties,
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 } as CSSProperties,
  cmTitle: { fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  cmSub: { fontSize: 13, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  badgeAttiva: {
    fontSize: 11, padding: '4px 8px', borderRadius: RADIUS.sm, fontWeight: 600,
    background: C.tealDark, color: '#fff', letterSpacing: 0.5,
  } as CSSProperties,
  panel: { background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.xl, padding: 32, boxShadow: SHADOW.card } as CSSProperties,
  err: { marginBottom: 16, padding: 12, background: C.dangerSoft, color: C.danger, border: `1px solid ${C.danger}`, borderRadius: RADIUS.md, fontSize: 14 } as CSSProperties,
  panelLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C.muted, marginBottom: 8, fontWeight: 600 } as CSSProperties,
  panelTitle: { fontSize: 22, fontWeight: 600, marginBottom: 8, color: C.text } as CSSProperties,
  faseSub: { fontSize: 14, color: C.tealDark, marginBottom: 32, fontWeight: 500 } as CSSProperties,
  fasiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 } as CSSProperties,
  faseBtn: {
    padding: '12px 12px', fontSize: 13, fontWeight: 500, borderRadius: RADIUS.md,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
  } as CSSProperties,
  startBtn: {
    width: '100%', padding: '20px 0', fontSize: 17, fontWeight: 700, color: '#fff',
    background: C.tealDark, border: 'none', borderRadius: RADIUS.lg, cursor: 'pointer',
    boxShadow: SHADOW.buttonPrimary, fontFamily: 'inherit', letterSpacing: 0.5,
  } as CSSProperties,
  bigTimer: { fontFamily: FONT.mono, fontSize: 96, textAlign: 'center', margin: '32px 0', letterSpacing: -3, fontWeight: 600 } as CSSProperties,
  ctlGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as CSSProperties,
  ctlBtn: {
    padding: '20px 0', fontSize: 17, fontWeight: 700, borderRadius: RADIUS.lg,
    cursor: 'pointer', fontFamily: 'inherit', border: 'none', color: '#fff',
    boxShadow: SHADOW.button,
  } as CSSProperties,
  storicoBox: { marginTop: 24, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, overflow: 'hidden', fontSize: 14, boxShadow: SHADOW.card } as CSSProperties,
  storicoRow: { padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as CSSProperties,
};

export default function TimerLavoroTablet({ operatoreId, aziendaId, commesseDisponibili }: Props) {
  const { snapshot, storico, loading, error, start, pause, resume, stop } =
    useTimerLavoro({ operatoreId, aziendaId });
  const [commessaSel, setCommessaSel] = useState('');
  const [faseSel, setFaseSel] = useState<FaseLavoro>('posa');

  const stato = snapshot.stato;
  const sessione = snapshot.sessione;
  const commessaAttiva = sessione ? commesseDisponibili.find(c => c.id === sessione.commessa_id) : null;

  return (
    <div style={S.root}>
      <div style={S.container}>
        <div>
          <div style={S.smallLabel}>Commesse del giorno</div>
          <div style={S.cardList}>
            {commesseDisponibili.length === 0 && <div style={S.rowEmpty}>Nessuna commessa assegnata.</div>}
            {commesseDisponibili.map((c, i) => {
              const attiva = sessione?.commessa_id === c.id;
              const sel = commessaSel === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => stato === 'idle' && setCommessaSel(c.id)}
                  disabled={stato !== 'idle'}
                  style={{
                    ...S.cmRow,
                    background: attiva ? C.tealSoft : sel ? C.bgSubtle : 'transparent',
                    borderBottom: i < commesseDisponibili.length - 1 ? `1px solid ${C.border}` : 'none',
                    cursor: stato === 'idle' ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ ...S.dot, background: attiva ? C.tealDark : C.border }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.cmTitle}>{c.numero ?? '—'}</div>
                    <div style={S.cmSub}>{c.cliente_nome ?? 'Cliente'} · {c.indirizzo ?? ''}</div>
                  </div>
                  {attiva && <div style={S.badgeAttiva}>ATTIVA</div>}
                </button>
              );
            })}
          </div>

          {storico.length > 0 && (
            <>
              <div style={{ ...S.smallLabel, marginTop: 24 }}>Ore registrate (ultime)</div>
              <div style={S.storicoBox}>
                {storico.slice(0, 5).map((o, i) => (
                  <div key={o.id} style={{ ...S.storicoRow, borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{FASI_LAVORO_LABEL[o.fase as FaseLavoro] ?? o.fase}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        {new Date(o.start_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ fontFamily: FONT.mono, fontWeight: 600, color: C.tealDark }}>
                      {formatDuration(o.durata_minuti)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <div style={S.panel}>
            {error && <div style={S.err}>{error}</div>}
            {loading ? (
              <div style={{ fontSize: 14, color: C.muted }}>Caricamento…</div>
            ) : stato === 'idle' ? (
              <>
                <div style={S.panelLabel}>Pronto</div>
                <div style={S.panelTitle}>
                  {commessaSel
                    ? (() => {
                        const c = commesseDisponibili.find(x => x.id === commessaSel);
                        return c ? `${c.numero ?? '—'} · ${c.cliente_nome ?? ''}` : 'Commessa';
                      })()
                    : 'Seleziona una commessa'}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={S.smallLabel}>Fase</div>
                  <div style={S.fasiGrid}>
                    {FASI.map(f => (
                      <button
                        key={f}
                        onClick={() => setFaseSel(f)}
                        style={{
                          ...S.faseBtn,
                          background: faseSel === f ? C.tealDark : C.card,
                          color: faseSel === f ? '#fff' : C.text,
                          border: `1px solid ${faseSel === f ? C.tealDark : C.border}`,
                        }}
                      >{FASI_LAVORO_LABEL[f]}</button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => commessaSel && start({ commessaId: commessaSel, fase: faseSel })}
                  disabled={!commessaSel}
                  style={{ ...S.startBtn, opacity: commessaSel ? 1 : 0.4, cursor: commessaSel ? 'pointer' : 'not-allowed' }}
                >▶  AVVIA TIMER</button>
              </>
            ) : (
              <>
                <div style={S.panelLabel}>{stato === 'paused' ? 'In pausa' : 'In esecuzione'}</div>
                <div style={S.panelTitle}>
                  {commessaAttiva ? `${commessaAttiva.numero ?? '—'} · ${commessaAttiva.cliente_nome ?? ''}` : '—'}
                </div>
                <div style={S.faseSub}>
                  {FASI_LAVORO_LABEL[(sessione?.fase as FaseLavoro) ?? 'altro'] ?? sessione?.fase}
                </div>
                <div style={{ ...S.bigTimer, color: stato === 'paused' ? C.warn : C.tealDark }}>
                  {formatHMS(snapshot.elapsedSeconds)}
                </div>
                <div style={S.ctlGrid}>
                  {stato === 'paused' ? (
                    <button onClick={resume} style={{ ...S.ctlBtn, background: C.warn }}>▶  RIPRENDI</button>
                  ) : (
                    <button onClick={pause} style={{ ...S.ctlBtn, background: C.card, color: C.text, border: `2px solid ${C.border}` }}>❚❚  PAUSA</button>
                  )}
                  <button onClick={() => stop()} style={{ ...S.ctlBtn, background: C.danger }}>■  STOP</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
