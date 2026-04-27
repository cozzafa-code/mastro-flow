'use client';

// ============================================================
// MASTRO — TimerLavoroTablet — sub-components
// ============================================================

import {
  FASI_LAVORO_LABEL,
  type FaseLavoro,
  type CommessaMinima,
} from '@/lib/timer-lavoro-types';
import { formatHMS } from '@/hooks/useTimerLavoro';

const TT = {
  bg: '#F8FAFC', card: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', muted: '#64748B',
  acc: '#0F766E', warn: '#D97706', danger: '#DC2626',
};

const FASI: FaseLavoro[] = [
  'rilievo','taglio','saldatura','assemblaggio','ferratura',
  'imballaggio','carico','trasporto','posa','collaudo','altro',
];

export function IdleSection({
  commessaSel, commesse, fase, setFase, onStart,
}: {
  commessaSel: string;
  commesse: CommessaMinima[];
  fase: FaseLavoro;
  setFase: (v: FaseLavoro) => void;
  onStart: () => void;
}) {
  const commessa = commesse.find((c) => c.id === commessaSel);
  const ready = !!commessaSel;
  return (
    <div>
      <div className="text-xs uppercase tracking-widest mb-2" style={{ color: TT.muted }}>Pronto</div>
      <div className="text-2xl font-semibold mb-6">
        {commessa ? `${commessa.numero ?? '—'} · ${commessa.cliente_nome ?? ''}` : 'Seleziona una commessa'}
      </div>
      <div className="mb-6">
        <label className="text-xs uppercase tracking-wider" style={{ color: TT.muted }}>Fase</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {FASI.map((f) => (
            <button
              key={f}
              onClick={() => setFase(f)}
              className="px-3 py-3 rounded-lg text-sm font-medium transition"
              style={{
                background: fase === f ? TT.acc : 'white',
                color: fase === f ? 'white' : TT.text,
                border: `1px solid ${fase === f ? TT.acc : TT.bdr}`,
              }}
            >
              {FASI_LAVORO_LABEL[f]}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onStart}
        disabled={!ready}
        className="w-full py-5 rounded-xl text-xl font-bold transition active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        style={{ background: TT.acc, color: 'white', boxShadow: '0 4px 0 0 rgba(15,118,110,0.4)' }}
      >
        ▶  AVVIA TIMER
      </button>
    </div>
  );
}

export function ActiveSection({
  elapsed, paused, commessa, fase, onPause, onResume, onStop,
}: {
  elapsed: number;
  paused: boolean;
  commessa: CommessaMinima | null | undefined;
  fase: FaseLavoro;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest mb-2" style={{ color: TT.muted }}>
        {paused ? 'In pausa' : 'In esecuzione'}
      </div>
      <div className="text-2xl font-semibold mb-1">
        {commessa ? `${commessa.numero ?? '—'} · ${commessa.cliente_nome ?? ''}` : '—'}
      </div>
      <div className="text-sm mb-8" style={{ color: TT.acc }}>
        {FASI_LAVORO_LABEL[fase] ?? fase}
      </div>
      <div
        className="font-mono text-8xl text-center my-10 tracking-tight"
        style={{ color: paused ? TT.warn : TT.acc, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
      >
        {formatHMS(elapsed)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {paused ? (
          <button
            onClick={onResume}
            className="py-5 rounded-xl text-lg font-bold active:scale-95 transition"
            style={{ background: TT.warn, color: 'white' }}
          >
            ▶  RIPRENDI
          </button>
        ) : (
          <button
            onClick={onPause}
            className="py-5 rounded-xl text-lg font-bold active:scale-95 transition"
            style={{ background: 'white', color: TT.text, border: `2px solid ${TT.bdr}` }}
          >
            ❚❚  PAUSA
          </button>
        )}
        <button
          onClick={onStop}
          className="py-5 rounded-xl text-lg font-bold active:scale-95 transition"
          style={{ background: TT.danger, color: 'white' }}
        >
          ■  STOP
        </button>
      </div>
    </div>
  );
}
