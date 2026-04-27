'use client';

// ============================================================
// MASTRO — TimerLavoroTablet
// Light Google-style. Split: lista commesse + pannello timer.
// ============================================================

import { useState, type CSSProperties } from 'react';
import { useTimerLavoro, formatHMS, formatDuration } from '@/hooks/useTimerLavoro';
import { MC, MF, MS, MR, MP, sectionLabel } from '@/constants/design-system';
import { MastroCard, SectionLabel, MastroEmpty } from './_ui';
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
  root: { minHeight: '100vh', background: MC.bg, color: MC.text, fontFamily: MF.ui } as CSSProperties,
  container: { maxWidth: 1100, margin: '0 auto', padding: MP.s6, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: MP.s6 } as CSSProperties,
  cmRow: {
    width: '100%', textAlign: 'left', padding: '14px 18px',
    display: 'flex', alignItems: 'center', gap: MP.s3,
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 14, color: MC.text,
  } as CSSProperties,
  dot: { width: 8, height: 8, borderRadius: MR.full, flexShrink: 0 } as CSSProperties,
  cmTitle: { fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  cmSub: { fontSize: 13, color: MC.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as CSSProperties,
  badgeAttiva: {
    fontSize: 11, padding: '4px 9px', borderRadius: MR.sm, fontWeight: 600,
    background: MC.tealDark, color: '#fff', letterSpacing: 0.5,
  } as CSSProperties,
  err: { marginBottom: MP.s4, padding: MP.s3, background: MC.dangerSoft, color: MC.danger, border: `1px solid ${MC.danger}`, borderRadius: MR.md, fontSize: 14 } as CSSProperties,
  panelTitle: { fontSize: 22, fontWeight: 600, marginBottom: 8, color: MC.text } as CSSProperties,
  faseSub: {
    display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
    color: MC.tealDark, background: MC.tealSoft,
    padding: '4px 12px', borderRadius: MR.full, marginBottom: MP.s8,
  } as CSSProperties,
  fasiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: MP.s2, marginTop: MP.s2 } as CSSProperties,
  faseBtn: {
    padding: '12px 12px', fontSize: 13, fontWeight: 500, borderRadius: MR.md,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
  } as CSSProperties,
  startBtn: {
    width: '100%', padding: '20px 0', fontSize: 17, fontWeight: 700, color: '#fff',
    background: MC.tealDark, border: 'none', borderRadius: MR.lg, cursor: 'pointer',
    boxShadow: MS.buttonPrimary, fontFamily: 'inherit', letterSpacing: 0.5,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  } as CSSProperties,
  bigTimer: { fontFamily: MF.mono, fontSize: 96, textAlign: 'center', margin: `${MP.s8}px 0`, letterSpacing: -3, fontWeight: 600, lineHeight: 1 } as CSSProperties,
  ctlGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: MP.s4 } as CSSProperties,
  ctlBtn: {
    padding: '20px 0', fontSize: 17, fontWeight: 700, borderRadius: MR.lg,
    cursor: 'pointer', fontFamily: 'inherit', border: 'none', color: '#fff',
    boxShadow: MS.button, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  } as CSSProperties,
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
  const commessaSelObj = commesseDisponibili.find(c => c.id === commessaSel);

  return (
    <div style={S.root}>
      <div style={S.container}>
        {/* Sinistra: lista commesse + storico */}
        <div>
          <SectionLabel style={{ marginBottom: MP.s3 }}>Commesse del giorno</SectionLabel>
          <MastroCard padding={0}>
            {commesseDisponibili.length === 0 ? (
              <MastroEmpty title="Nessuna commessa assegnata" hint="Le commesse arrivano dal titolare." />
            ) : commesseDisponibili.map((c, i) => {
              const attiva = sessione?.commessa_id === c.id;
              const sel = commessaSel === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => stato === 'idle' && setCommessaSel(c.id)}
                  disabled={stato !== 'idle'}
                  style={{
                    ...S.cmRow,
                    background: attiva ? MC.tealSoft : sel ? MC.bgSubtle : 'transparent',
                    borderBottom: i < commesseDisponibili.length - 1 ? `1px solid ${MC.border}` : 'none',
                    cursor: stato === 'idle' ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ ...S.dot, background: attiva ? MC.tealDark : MC.borderStrong }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.cmTitle}>{c.numero ?? '—'}</div>
                    <div style={S.cmSub}>{c.cliente_nome ?? 'Cliente'} · {c.indirizzo ?? ''}</div>
                  </div>
                  {attiva && <div style={S.badgeAttiva}>ATTIVA</div>}
                </button>
              );
            })}
          </MastroCard>

          {storico.length > 0 && (
            <>
              <SectionLabel style={{ marginTop: MP.s6, marginBottom: MP.s3 }}>Ore registrate</SectionLabel>
              <MastroCard padding={0}>
                {storico.slice(0, 5).map((o, i) => (
                  <div key={o.id} style={{ ...S.storicoRow, borderBottom: i < Math.min(4, storico.length - 1) ? `1px solid ${MC.border}` : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{FASI_LAVORO_LABEL[o.fase as FaseLavoro] ?? o.fase}</div>
                      <div style={{ fontSize: 12, color: MC.muted }}>
                        {new Date(o.start_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ fontFamily: MF.mono, fontWeight: 600, color: MC.tealDark }}>
                      {formatDuration(o.durata_minuti)}
                    </div>
                  </div>
                ))}
              </MastroCard>
            </>
          )}
        </div>

        {/* Destra: pannello timer */}
        <div>
          <MastroCard padding={MP.s8} elevated>
            {error && <div style={S.err}>{error}</div>}
            {loading ? (
              <div style={{ fontSize: 14, color: MC.muted }}>Caricamento…</div>
            ) : stato === 'idle' ? (
              <>
                <SectionLabel>Pronto</SectionLabel>
                <div style={{ ...S.panelTitle, marginTop: 8 }}>
                  {commessaSelObj
                    ? `${commessaSelObj.numero ?? '—'} · ${commessaSelObj.cliente_nome ?? ''}`
                    : 'Seleziona una commessa'}
                </div>
                <div style={{ marginTop: MP.s5, marginBottom: MP.s6 }}>
                  <SectionLabel>Fase</SectionLabel>
                  <div style={S.fasiGrid}>
                    {FASI.map(f => (
                      <button
                        key={f}
                        onClick={() => setFaseSel(f)}
                        style={{
                          ...S.faseBtn,
                          background: faseSel === f ? MC.tealDark : MC.card,
                          color: faseSel === f ? '#fff' : MC.text,
                          border: `1px solid ${faseSel === f ? MC.tealDark : MC.border}`,
                          boxShadow: faseSel === f ? MS.buttonPrimary : 'none',
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
                <SectionLabel>{stato === 'paused' ? 'In pausa' : 'In esecuzione'}</SectionLabel>
                <div style={{ ...S.panelTitle, marginTop: 8 }}>
                  {commessaAttiva ? `${commessaAttiva.numero ?? '—'} · ${commessaAttiva.cliente_nome ?? ''}` : '—'}
                </div>
                <div style={S.faseSub}>
                  {FASI_LAVORO_LABEL[(sessione?.fase as FaseLavoro) ?? 'altro'] ?? sessione?.fase}
                </div>
                <div style={{ ...S.bigTimer, color: stato === 'paused' ? MC.warn : MC.tealDark }}>
                  {formatHMS(snapshot.elapsedSeconds)}
                </div>
                <div style={S.ctlGrid}>
                  {stato === 'paused' ? (
                    <button onClick={resume} style={{ ...S.ctlBtn, background: MC.warn }}>▶  RIPRENDI</button>
                  ) : (
                    <button onClick={pause} style={{ ...S.ctlBtn, background: MC.card, color: MC.text, border: `2px solid ${MC.border}` }}>❚❚  PAUSA</button>
                  )}
                  <button onClick={() => stop()} style={{ ...S.ctlBtn, background: MC.danger }}>■  STOP</button>
                </div>
              </>
            )}
          </MastroCard>
        </div>
      </div>
    </div>
  );
}
