'use client';

// ============================================================
// MASTRO — TimerLavoroTablet
// Light Google-style — split panel: lista commesse + timer attivo
// ============================================================

import { useState } from 'react';
import { useTimerLavoro, formatDuration } from '@/hooks/useTimerLavoro';
import {
  FASI_LAVORO_LABEL,
  type FaseLavoro,
  type CommessaMinima,
} from '@/lib/timer-lavoro-types';
import { IdleSection, ActiveSection } from './TimerLavoroTabletParts';

const TT = {
  bg: '#F8FAFC', card: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', muted: '#64748B',
  acc: '#0F766E', accSoft: '#CCFBF1',
  warn: '#D97706', danger: '#DC2626',
};

interface Props {
  operatoreId: string;
  aziendaId: string;
  commesseDisponibili: CommessaMinima[];
}

export default function TimerLavoroTablet({
  operatoreId, aziendaId, commesseDisponibili,
}: Props) {
  const { snapshot, storico, loading, error, start, pause, resume, stop } =
    useTimerLavoro({ operatoreId, aziendaId });

  const [commessaSel, setCommessaSel] = useState<string>('');
  const [faseSel, setFaseSel] = useState<FaseLavoro>('posa');

  const stato = snapshot.stato;
  const sessione = snapshot.sessione;
  const commessaAttiva = sessione
    ? commesseDisponibili.find((c) => c.id === sessione.commessa_id)
    : null;

  return (
    <div style={{ background: TT.bg, color: TT.text }} className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Sinistra */}
        <div className="col-span-5">
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: TT.muted }}>
            Commesse del giorno
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: TT.card, border: `1px solid ${TT.bdr}` }}
          >
            {commesseDisponibili.length === 0 && (
              <div className="p-6 text-sm" style={{ color: TT.muted }}>
                Nessuna commessa assegnata.
              </div>
            )}
            {commesseDisponibili.map((c, idx) => {
              const isAttiva = sessione?.commessa_id === c.id;
              const isSelected = commessaSel === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => stato === 'idle' && setCommessaSel(c.id)}
                  disabled={stato !== 'idle'}
                  className="w-full text-left px-5 py-4 transition flex items-center gap-3"
                  style={{
                    background: isAttiva ? TT.accSoft : isSelected ? '#F1F5F9' : 'transparent',
                    borderBottom: idx < commesseDisponibili.length - 1 ? `1px solid ${TT.bdr}` : 'none',
                    cursor: stato === 'idle' ? 'pointer' : 'default',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isAttiva ? TT.acc : TT.bdr }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.numero ?? '—'}</div>
                    <div className="text-sm truncate" style={{ color: TT.muted }}>
                      {c.cliente_nome ?? 'Cliente'} · {c.indirizzo ?? ''}
                    </div>
                  </div>
                  {isAttiva && (
                    <div
                      className="text-xs px-2 py-1 rounded font-medium"
                      style={{ background: TT.acc, color: 'white' }}
                    >
                      ATTIVA
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {storico.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: TT.muted }}>
                Ore registrate
              </div>
              <div
                className="rounded-xl overflow-hidden text-sm"
                style={{ background: TT.card, border: `1px solid ${TT.bdr}` }}
              >
                {storico.slice(0, 5).map((o, idx) => (
                  <div
                    key={o.id}
                    className="px-4 py-3 flex justify-between items-center"
                    style={{ borderBottom: idx < 4 ? `1px solid ${TT.bdr}` : 'none' }}
                  >
                    <div>
                      <div className="font-medium">
                        {FASI_LAVORO_LABEL[o.fase as FaseLavoro] ?? o.fase}
                      </div>
                      <div className="text-xs" style={{ color: TT.muted }}>
                        {new Date(o.start_at).toLocaleString('it-IT', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div
                      className="font-mono font-semibold"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {formatDuration(o.durata_minuti)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Destra */}
        <div className="col-span-7">
          <div
            className="rounded-2xl p-8"
            style={{ background: TT.card, border: `1px solid ${TT.bdr}` }}
          >
            {error && (
              <div
                className="mb-4 rounded-lg p-3 text-sm"
                style={{ background: '#FEE2E2', color: TT.danger, border: `1px solid ${TT.danger}` }}
              >
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-sm" style={{ color: TT.muted }}>Caricamento…</div>
            ) : stato === 'idle' ? (
              <IdleSection
                commessaSel={commessaSel}
                commesse={commesseDisponibili}
                fase={faseSel}
                setFase={setFaseSel}
                onStart={() => commessaSel && start({ commessaId: commessaSel, fase: faseSel })}
              />
            ) : (
              <ActiveSection
                elapsed={snapshot.elapsedSeconds}
                paused={stato === 'paused'}
                commessa={commessaAttiva}
                fase={(sessione?.fase as FaseLavoro) ?? 'altro'}
                onPause={pause}
                onResume={resume}
                onStop={() => stop()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
