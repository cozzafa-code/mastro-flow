'use client';

// ============================================================
// MASTRO — TimerLavoroMobile v6
// Pattern A (struttura unica) + voce + sforamento stima/reale
// ============================================================

import { useState } from 'react';
import { useTimerLavoro, formatHMS } from '@/hooks/useTimerLavoro';
import { useVoceStop } from '@/hooks/useVoceStop';
import { MC } from '@/constants/design-system';
import { OperatoreAvatar } from './_ui';
import TimerStopMotivoModal from './TimerStopMotivoModal';
import { SM, KEYFRAMES } from './TimerLavoroMobile.styles';
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

export default function TimerLavoroMobile({
  operatoreId, aziendaId, operatoreNome, commesseDisponibili,
}: Props) {
  const { snapshot, loading, error, sforamento, start, pause, resume, stop } =
    useTimerLavoro({ operatoreId, aziendaId });
  const [commessaId, setCommessaId] = useState('');
  const [fase, setFase] = useState<FaseLavoro>('posa');
  const [showStopModal, setShowStopModal] = useState(false);
  const [voceOn, setVoceOn] = useState(false);

  const stato = snapshot.stato;
  const isIdle = stato === 'idle';
  const isRunning = stato === 'running';
  const isPaused = stato === 'paused';
  const sessione = snapshot.sessione;
  const commessaAttiva = sessione
    ? commesseDisponibili.find(c => c.id === sessione.commessa_id)
    : null;

  const { supportata: voceSupportata, inAscolto } = useVoceStop({
    attivo: voceOn && !isIdle,
    onComando: ({ azione }) => {
      if (azione === 'stop') setShowStopModal(true);
      if (azione === 'pausa' && isRunning) pause();
      if (azione === 'riprendi' && isPaused) resume();
    },
  });

  if (loading) return <div style={SM.loading}>Caricamento timer…</div>;

  let pillBg = MC.bgSubtle, pillFg = MC.muted, pillTxt = '● Pronto';
  if (isRunning) { pillBg = MC.tealSoft; pillFg = MC.tealDark; pillTxt = '● In corso'; }
  if (isPaused)  { pillBg = MC.warnSoft; pillFg = MC.warn;     pillTxt = '❚❚ In pausa'; }

  const sfMap = { verde: MC.tealDark, giallo: MC.warn, rosso: MC.danger, critico: MC.danger, non_definito: MC.tealDark };
  const timerColor = isPaused ? MC.warn : isRunning ? sfMap[sforamento.stato] : MC.text;
  const barColor = sforamento.stato === 'giallo' ? MC.warn
    : (sforamento.stato === 'rosso' || sforamento.stato === 'critico') ? MC.danger
    : MC.tealDark;
  const barWidth = Math.min(100, sforamento.percentuale);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={SM.root}>
        <div style={SM.hero}>
          <OperatoreAvatar nome={operatoreNome ?? 'Operatore'} size={48} />
          <div style={SM.heroText}>
            <div style={SM.heroLabel}>Timer Lavoro</div>
            <div style={SM.heroName}>{operatoreNome ?? 'Operatore'}</div>
          </div>
          <div style={{ ...SM.heroPill, background: pillBg, color: pillFg }}>{pillTxt}</div>
        </div>

        {error && <div style={SM.err}>{error}</div>}

        <div style={SM.body}>
          <div style={SM.card}>
            <div style={SM.row}>
              <div style={SM.rowLabel}>Commessa</div>
              {isIdle ? (
                <select style={SM.rowSelect} value={commessaId} onChange={e => setCommessaId(e.target.value)}>
                  <option value="">— Seleziona —</option>
                  {commesseDisponibili.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.numero ?? '—'} · {c.cliente_nome ?? 'Cliente'}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={SM.rowReadonly}>
                  {commessaAttiva ? `${commessaAttiva.numero ?? '—'} · ${commessaAttiva.cliente_nome ?? ''}` : '—'}
                </div>
              )}
            </div>

            <div style={SM.row}>
              <div style={SM.rowLabel}>Fase</div>
              {isIdle ? (
                <select style={SM.rowSelect} value={fase} onChange={e => setFase(e.target.value as FaseLavoro)}>
                  {FASI.map(f => <option key={f} value={f}>{FASI_LAVORO_LABEL[f]}</option>)}
                </select>
              ) : (
                <div style={SM.rowReadonly}>
                  {FASI_LAVORO_LABEL[(sessione?.fase as FaseLavoro) ?? 'altro'] ?? sessione?.fase}
                </div>
              )}
            </div>

            <div style={SM.display}>
              {isIdle ? (
                <div style={SM.timerNumPlaceholder}>00:00:00</div>
              ) : (
                <>
                  <div style={{ ...SM.timerNum, color: timerColor }}>
                    {formatHMS(snapshot.elapsedSeconds)}
                  </div>
                  {sforamento.stato !== 'non_definito' && (
                    <div style={SM.barWrap}>
                      <div style={SM.barTrack}>
                        <div style={{ ...SM.barFill, width: `${barWidth}%`, background: barColor }} />
                      </div>
                      <div style={SM.barInfo}>
                        <span>
                          {sforamento.percentuale}% di {Math.round((sforamento.stimaMin ?? 0) / 60 * 10) / 10}h stimate
                        </span>
                        <span style={{ color: barColor, fontWeight: 600 }}>
                          {sforamento.stato === 'critico' ? '⚠ Sforamento critico'
                          : sforamento.stato === 'rosso' ? '⚠ Stima superata'
                          : sforamento.stato === 'giallo' ? 'Attenzione tempo'
                          : `${sforamento.restantiMin}min al limite`}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {!isIdle && voceSupportata && (
            <div style={SM.voceBar}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {inAscolto && <span style={SM.voceLed} />}
                {voceOn ? <>Voce attiva — di <strong>"stop"</strong>, "pausa", "riprendi"</> : 'Voce mani-libere'}
              </span>
              <button
                onClick={() => setVoceOn(v => !v)}
                style={{
                  ...SM.voceBtn,
                  background: voceOn ? MC.tealDark : 'transparent',
                  color: voceOn ? '#fff' : MC.tealDark,
                }}
              >{voceOn ? 'Spegni 🎤' : 'Accendi 🎤'}</button>
            </div>
          )}

          <div style={SM.ctaWrap}>
            {isIdle && (
              <button
                onClick={() => commessaId && start({ commessaId, fase })}
                disabled={!commessaId}
                style={{
                  ...SM.bigBtn,
                  background: commessaId ? MC.tealDark : MC.borderStrong,
                  cursor: commessaId ? 'pointer' : 'not-allowed',
                  opacity: commessaId ? 1 : 0.6,
                }}
              >▶  AVVIA</button>
            )}
            {isRunning && (
              <>
                <button onClick={() => setShowStopModal(true)} style={{ ...SM.bigBtn, background: MC.danger }}>
                  ■  STOP
                </button>
                <button onClick={pause} style={SM.secBtn}>❚❚  Pausa</button>
              </>
            )}
            {isPaused && (
              <>
                <button onClick={resume} style={{ ...SM.bigBtn, background: MC.warn }}>
                  ▶  RIPRENDI
                </button>
                <button onClick={() => setShowStopModal(true)} style={{ ...SM.secBtn, color: MC.danger, borderColor: MC.danger }}>
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
