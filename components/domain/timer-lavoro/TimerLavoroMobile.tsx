'use client';

// ============================================================
// MASTRO — TimerLavoroMobile v7
// Layout a slot fissi: idle e running hanno IDENTICA struttura
// - 1 slot input commessa (h:46)
// - 1 slot input fase (h:46)
// - 1 slot display timer (h:110)
// - 1 slot voce (h:46) sempre presente
// - 1 slot CTA (h:70) sempre 1 solo bottone
// Pausa è inline dentro la card sotto al timer.
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

  // CTA unico bottone
  const ctaConfig = isIdle
    ? {
        label: '▶  AVVIA',
        bg: commessaId ? MC.tealDark : MC.borderStrong,
        disabled: !commessaId,
        onClick: () => commessaId && start({ commessaId, fase }),
      }
    : isPaused
    ? {
        label: '▶  RIPRENDI',
        bg: MC.warn,
        disabled: false,
        onClick: () => resume(),
      }
    : {
        label: '■  STOP',
        bg: MC.danger,
        disabled: false,
        onClick: () => setShowStopModal(true),
      };

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
          {/* CARD: slot identici, contenuto cambia */}
          <div style={SM.card}>
            {/* SLOT 1 - Commessa */}
            <div style={SM.row}>
              <div style={SM.rowLabel}>Commessa</div>
              <div style={SM.inputSlot}>
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
            </div>

            {/* SLOT 2 - Fase */}
            <div style={SM.row}>
              <div style={SM.rowLabel}>Fase</div>
              <div style={SM.inputSlot}>
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
            </div>

            {/* SLOT 3 - Display timer */}
            <div style={SM.display}>
              {isIdle ? (
                <div style={SM.timerNumPlaceholder}>00:00:00</div>
              ) : (
                <>
                  <div style={{ ...SM.timerNum, color: timerColor }}>
                    {formatHMS(snapshot.elapsedSeconds)}
                  </div>
                  {/* Pausa inline (solo running) */}
                  {isRunning && (
                    <button onClick={pause} style={SM.pausaInline}>❚❚  Metti in pausa</button>
                  )}
                  {/* Barra sforamento */}
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

          {/* SLOT VOCE - sempre presente */}
          <div style={SM.voceSlot}>
            {!isIdle && voceSupportata ? (
              <div style={SM.voceBar}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  {inAscolto && <span style={SM.voceLed} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {voceOn ? <>Voce attiva — di <strong>"stop"</strong>, "pausa", "riprendi"</> : 'Voce mani-libere'}
                  </span>
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
            ) : (
              <div style={SM.voceBarIdle}>
                {voceSupportata ? '🎤 Voce mani-libere disponibile dopo l\'avvio' : ''}
              </div>
            )}
          </div>

          {/* SLOT CTA - sempre 1 bottone */}
          <div style={SM.ctaSlot}>
            <button
              onClick={ctaConfig.onClick}
              disabled={ctaConfig.disabled}
              style={{
                ...SM.bigBtn,
                background: ctaConfig.bg,
                cursor: ctaConfig.disabled ? 'not-allowed' : 'pointer',
                opacity: ctaConfig.disabled ? 0.6 : 1,
              }}
            >{ctaConfig.label}</button>
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
