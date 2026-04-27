'use client';

// ============================================================
// MASTRO - TimerLavoroTablet
// Light Google-style - 100% inline CSS
// ============================================================

import { useState, type CSSProperties } from 'react';
import { useTimerLavoro, formatHMS, formatDuration } from '@/hooks/useTimerLavoro';
import {
  FASI_LAVORO_LABEL,
  type FaseLavoro,
  type CommessaMinima,
} from '@/lib/timer-lavoro-types';

const TT = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  bdr: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  acc: '#0F766E',
  accSoft: '#CCFBF1',
  warn: '#D97706',
  danger: '#DC2626',
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
    background: TT.bg, color: TT.text, minHeight: '100vh',
    fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
    boxSizing: 'border-box',
  } as CSSProperties,
  container: {
    maxWidth: 1100, margin: '0 auto', padding: 24,
    display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24,
  } as CSSProperties,
  colLeft: {} as CSSProperties,
  colRight: {} as CSSProperties,
  smallLabel: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: TT.muted, marginBottom: 12 } as CSSProperties,
  cardList: {
    background: TT.card, border: `1px solid ${TT.bdr}`, borderRadius: 12,
    overflow: 'hidden',
  } as CSSProperties,
  rowEmpty: { padding: 24, fontSize: 14, color: TT.muted } as CSSProperties,
  cmRow: {
    width: '100%', textAlign: 'left', padding: '14px 18px',
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 14, color: TT.text,
  } as CSSProperties,
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 } as CSSProperties,
  cmTitle: { fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  cmSub: { fontSize: 13, color: TT.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  badgeAttiva: {
    fontSize: 11, padding: '4px 8px', borderRadius: 4, fontWeight: 500,
    background: TT.acc, color: '#fff',
  } as CSSProperties,
  panel: {
    background: TT.card, border: `1px solid ${TT.bdr}`, borderRadius: 16, padding: 32,
  } as CSSProperties,
  err: {
    marginBottom: 16, padding: 12, background: '#FEE2E2',
    color: TT.danger, border: `1px solid ${TT.danger}`, borderRadius: 8, fontSize: 14,
  } as CSSProperties,
  panelLabel: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: TT.muted, marginBottom: 8 } as CSSProperties,
  panelTitle: { fontSize: 22, fontWeight: 600, marginBottom: 8 } as CSSProperties,
  faseSub: { fontSize: 14, color: TT.acc, marginBottom: 32 } as CSSProperties,
  fasiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 } as CSSProperties,
  faseBtn: {
    padding: '12px 12px', fontSize: 13, fontWeight: 500, borderRadius: 8,
    cursor: 'pointer', fontFamily: 'inherit',
  } as CSSProperties,
  startBtn: {
    width: '100%', padding: '20px 0', fontSize: 18, fontWeight: 700, color: '#fff',
    background: TT.acc, border: 'none', borderRadius: 12, cursor: 'pointer',
    boxShadow: '0 4px 0 0 rgba(15,118,110,0.4)', fontFamily: 'inherit',
  } as CSSProperties,
  bigTimer: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 96, textAlign: 'center', margin: '32px 0',
    letterSpacing: -2,
  } as CSSProperties,
  ctlGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as CSSProperties,
  ctlBtn: {
    padding: '20px 0', fontSize: 17, fontWeight: 700, borderRadius: 12,
    cursor: 'pointer', fontFamily: 'inherit', border: 'none', color: '#fff',
  } as CSSProperties,
  storicoBox: {
    marginTop: 24, background: TT.card, border: `1px solid ${TT.bdr}`,
    borderRadius: 12, overflow: 'hidden', fontSize: 14,
  } as CSSProperties,
  storicoRow: {
    padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  } as CSSProperties,
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
        {/* SX */}
        <div style={S.colLeft}>
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
                    background: attiva ? TT.accSoft : sel ? '#F1F5F9' : 'transparent',
                    borderBottom: i < commesseDisponibili.length - 1 ? `1px solid ${TT.bdr}` : 'none',
                    cursor: stato === 'idle' ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ ...S.dot, background: attiva ? TT.acc : TT.bdr }} />
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
              <div style={{ ...S.smallLabel, marginTop: 24 }}>Ore registrate</div>
              <div style={S.storicoBox}>
                {storico.slice(0, 5).map((o, i) => (
                  <div
                    key={o.id}
                    style={{ ...S.storicoRow, borderBottom: i < 4 ? `1px solid ${TT.bdr}` : 'none' }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{FASI_LAVORO_LABEL[o.fase as FaseLavoro] ?? o.fase}</div>
                      <div style={{ fontSize: 12, color: TT.muted }}>
                        {new Date(o.start_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                      {formatDuration(o.durata_minuti)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* DX */}
        <div style={S.colRight}>
          <div style={S.panel}>
            {error && <div style={S.err}>{error}</div>}
            {loading ? (
              <div style={{ fontSize: 14, color: TT.muted }}>Caricamento...</div>
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
                          background: faseSel === f ? TT.acc : '#fff',
                          color: faseSel === f ? '#fff' : TT.text,
                          border: `1px solid ${faseSel === f ? TT.acc : TT.bdr}`,
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
                <div style={{ ...S.bigTimer, color: stato === 'paused' ? TT.warn : TT.acc }}>
                  {formatHMS(snapshot.elapsedSeconds)}
                </div>
                <div style={S.ctlGrid}>
                  {stato === 'paused' ? (
                    <button onClick={resume} style={{ ...S.ctlBtn, background: TT.warn }}>▶  RIPRENDI</button>
                  ) : (
                    <button onClick={pause} style={{ ...S.ctlBtn, background: '#fff', color: TT.text, border: `2px solid ${TT.bdr}` }}>❚❚  PAUSA</button>
                  )}
                  <button onClick={() => stop()} style={{ ...S.ctlBtn, background: TT.danger }}>■  STOP</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
