'use client';

import { useState } from 'react';
import type { NextAction, Ruolo } from '@/lib/codici/types';
import { registraEvento } from '@/lib/codici/client';

type Props = {
  nextAction: NextAction;
  ruolo: Ruolo;
  short: string;
};

export default function VanoView({ nextAction, ruolo, short }: Props) {
  const [eseguendo, setEseguendo] = useState(false);
  const codice = nextAction.codice;
  const payload = codice.payload || {};

  const isHighPriority = nextAction.priorita === 'high';

  async function eseguiAzione() {
    setEseguendo(true);
    await registraEvento({
      short,
      tipo_evento: nextAction.azione,
      ruolo,
      payload: { triggered_at: new Date().toISOString() },
    });
    setTimeout(() => {
      setEseguendo(false);
      if (nextAction.azione === 'lascia_recensione') {
        window.location.href = '/recensione/' + short;
      } else if (nextAction.azione === 'inizia_posa') {
        window.location.href = '/posa/' + short;
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-[#0D1F1F] text-[#EEF8F8]">
      <header className="px-6 pt-12 pb-6 border-b border-[#28A0A0]/30">
        <div className="flex items-center gap-3 text-[#28A0A0] text-sm uppercase tracking-wider">
          <div className="w-2 h-2 bg-[#28A0A0] rounded-full" />
          Vano · {codice.stato}
        </div>
        <h1 className="text-3xl font-bold mt-3">
          {payload.nome || 'Vano'}
        </h1>
        <p className="text-[#EEF8F8]/60 font-mono text-sm mt-1">{short}</p>
      </header>

      <section className="px-6 py-8">
        {isHighPriority && (
          <div className="text-[#28A0A0] text-xs uppercase tracking-widest mb-3">
            ⚡ Azione richiesta
          </div>
        )}

        <button
          onClick={eseguiAzione}
          disabled={eseguendo}
          className={
            'w-full py-6 px-6 rounded-2xl text-lg font-bold transition-all active:scale-[0.98] ' +
            (isHighPriority
              ? 'bg-[#28A0A0] text-white shadow-[0_8px_0_#1a6b6b]'
              : 'bg-[#EEF8F8] text-[#0D1F1F] shadow-[0_8px_0_#C8E4E4]') +
            (eseguendo ? ' opacity-50' : '')
          }
        >
          {eseguendo ? 'In corso...' : nextAction.label} →
        </button>
      </section>

      <section className="px-6 py-6 space-y-4">
        {payload.misure && (
          <DettaglioRow
            label="Misure"
            value={`${payload.misure.larghezza} × ${payload.misure.altezza} mm`}
          />
        )}
        {payload.tipologia && (
          <DettaglioRow label="Tipologia" value={payload.tipologia} />
        )}
        {payload.cliente && (
          <DettaglioRow label="Cliente" value={payload.cliente} />
        )}
        {payload.commessa && (
          <DettaglioRow label="Commessa" value={payload.commessa} />
        )}
        {nextAction.distanza_km !== null && (
          <DettaglioRow
            label="Distanza dall'azienda"
            value={`${nextAction.distanza_km.toFixed(1)} km`}
          />
        )}
      </section>

      {codice.stato_history && codice.stato_history.length > 0 && (
        <section className="px-6 py-6 border-t border-[#28A0A0]/20">
          <h2 className="text-sm uppercase tracking-wider text-[#28A0A0] mb-4">
            Cronologia
          </h2>
          <div className="space-y-3">
            {codice.stato_history.slice(-5).reverse().map((ev, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-[#28A0A0] rounded-full mt-1.5" />
                <div>
                  <div className="font-medium">{ev.stato}</div>
                  <div className="text-[#EEF8F8]/50 text-xs">
                    {new Date(ev.at).toLocaleString('it-IT')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="px-6 py-8 mt-4 border-t border-[#28A0A0]/20">
        <p className="text-xs text-[#EEF8F8]/40 text-center">
          Stai visualizzando come <span className="text-[#28A0A0] font-medium">{ruolo}</span>
        </p>
      </footer>
    </div>
  );
}

function DettaglioRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-[#28A0A0]/10">
      <span className="text-[#EEF8F8]/60 text-sm">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
