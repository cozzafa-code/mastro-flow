'use client';

// ============================================================
// MASTRO — TimerLavoroMobile
// Officina/cantiere — fliwoX dark — bottone enorme
// ============================================================

import { useState } from 'react';
import { useTimerLavoro, formatHMS } from '@/hooks/useTimerLavoro';
import {
  FASI_LAVORO_LABEL,
  type FaseLavoro,
  type CommessaMinima,
} from '@/lib/timer-lavoro-types';

// Token fliwoX
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

interface Props {
  operatoreId: string;
  aziendaId: string;
  commesseDisponibili: CommessaMinima[];
}

const FASI: FaseLavoro[] = [
  'rilievo','taglio','saldatura','assemblaggio','ferratura',
  'imballaggio','carico','trasporto','posa','collaudo','altro',
];

export default function TimerLavoroMobile({
  operatoreId,
  aziendaId,
  commesseDisponibili,
}: Props) {
  const { snapshot, loading, error, start, pause, resume, stop } =
    useTimerLavoro({ operatoreId, aziendaId });

  const [commessaId, setCommessaId] = useState<string>('');
  const [fase, setFase] = useState<FaseLavoro>('posa');

  const stato = snapshot.stato;
  const isIdle = stato === 'idle';
  const isRunning = stato === 'running';
  const isPaused = stato === 'paused';

  const commessaAttiva = snapshot.sessione
    ? commesseDisponibili.find((c) => c.id === snapshot.sessione!.commessa_id)
    : null;

  const handleStart = async () => {
    if (!commessaId) return;
    await start({ commessaId, fase });
  };

  if (loading) {
    return (
      <div style={{ background: T.bg, color: T.text }} className="min-h-screen flex items-center justify-center">
        <div className="text-sm" style={{ color: T.muted }}>Caricamento timer…</div>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.text }} className="min-h-screen flex flex-col">
      {/* Header */}
      <div
        className="px-5 pt-6 pb-4 border-b"
        style={{ borderColor: T.bdr }}
      >
        <div className="text-xs uppercase tracking-widest" style={{ color: T.muted }}>
          Timer Lavoro
        </div>
        <div className="text-lg font-semibold mt-1">
          {isIdle ? 'Pronto' : isPaused ? 'In pausa' : 'In corso'}
        </div>
      </div>

      {error && (
        <div
          className="mx-5 mt-3 rounded-lg p-3 text-sm"
          style={{ background: '#3a1d1d', color: T.danger, border: `1px solid ${T.danger}` }}
        >
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-col px-5 pt-4 pb-6">
        {isIdle ? (
          <IdleView
            commesse={commesseDisponibili}
            commessaId={commessaId}
            setCommessaId={setCommessaId}
            fase={fase}
            setFase={setFase}
          />
        ) : (
          <ActiveView
            elapsed={snapshot.elapsedSeconds}
            paused={isPaused}
            commessa={commessaAttiva}
            fase={(snapshot.sessione?.fase as FaseLavoro) ?? 'altro'}
          />
        )}

        {/* CTA gigante */}
        <div className="mt-auto pt-6">
          {isIdle && (
            <BigButton
              label="START"
              disabled={!commessaId}
              onClick={handleStart}
              bg={commessaId ? T.acc : T.accDim}
              fg="#0D1F1F"
            />
          )}
          {isRunning && (
            <div className="space-y-3">
              <BigButton label="STOP" onClick={() => stop()} bg={T.danger} fg="#0D1F1F" />
              <SecondaryButton label="❚❚  Pausa" onClick={pause} />
            </div>
          )}
          {isPaused && (
            <div className="space-y-3">
              <BigButton label="RIPRENDI" onClick={resume} bg={T.warn} fg="#0D1F1F" />
              <SecondaryButton label="STOP" onClick={() => stop()} danger />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------

function IdleView({
  commesse,
  commessaId,
  setCommessaId,
  fase,
  setFase,
}: {
  commesse: CommessaMinima[];
  commessaId: string;
  setCommessaId: (v: string) => void;
  fase: FaseLavoro;
  setFase: (v: FaseLavoro) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider" style={{ color: T.muted }}>
          Commessa
        </label>
        <select
          value={commessaId}
          onChange={(e) => setCommessaId(e.target.value)}
          className="w-full mt-2 rounded-lg px-4 py-4 text-base outline-none"
          style={{
            background: T.card,
            color: T.text,
            border: `1px solid ${T.bdr}`,
          }}
        >
          <option value="">— Seleziona —</option>
          {commesse.map((c) => (
            <option key={c.id} value={c.id}>
              {c.numero ?? '—'} · {c.cliente_nome ?? 'Cliente'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider" style={{ color: T.muted }}>
          Fase
        </label>
        <select
          value={fase}
          onChange={(e) => setFase(e.target.value as FaseLavoro)}
          className="w-full mt-2 rounded-lg px-4 py-4 text-base outline-none"
          style={{
            background: T.card,
            color: T.text,
            border: `1px solid ${T.bdr}`,
          }}
        >
          {FASI.map((f) => (
            <option key={f} value={f}>{FASI_LAVORO_LABEL[f]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ActiveView({
  elapsed,
  paused,
  commessa,
  fase,
}: {
  elapsed: number;
  paused: boolean;
  commessa: CommessaMinima | null | undefined;
  fase: FaseLavoro;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="text-xs uppercase tracking-widest mb-2" style={{ color: T.muted }}>
        {commessa ? `${commessa.numero ?? '—'} · ${commessa.cliente_nome ?? ''}` : 'Commessa'}
      </div>
      <div className="text-sm mb-6" style={{ color: T.acc }}>
        {FASI_LAVORO_LABEL[fase] ?? fase}
      </div>

      <div
        className="font-mono text-7xl tracking-tight"
        style={{
          color: paused ? T.warn : T.acc,
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        }}
      >
        {formatHMS(elapsed)}
      </div>

      <div className="mt-3 text-xs uppercase tracking-widest" style={{ color: T.muted }}>
        {paused ? 'In pausa' : 'In esecuzione'}
      </div>
    </div>
  );
}

function BigButton({
  label,
  onClick,
  bg,
  fg,
  disabled,
}: {
  label: string;
  onClick: () => void;
  bg: string;
  fg: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-7 rounded-2xl text-3xl font-bold tracking-wide transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
      style={{
        background: bg,
        color: fg,
        boxShadow: `0 6px 0 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)`,
      }}
    >
      {label}
    </button>
  );
}

function SecondaryButton({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 rounded-xl text-base font-semibold transition active:scale-95"
      style={{
        background: 'transparent',
        color: danger ? T.danger : T.text,
        border: `1px solid ${danger ? T.danger : T.bdr}`,
      }}
    >
      {label}
    </button>
  );
}
