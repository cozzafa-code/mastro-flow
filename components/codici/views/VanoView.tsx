'use client';

import { useState } from 'react';
import type { NextAction, Ruolo } from '@/lib/codici/types';
import { registraEvento } from '@/lib/codici/client';

const C = {
  bg: '#0D1F1F',
  teal: '#28A0A0',
  tealDark: '#1a6b6b',
  light: '#EEF8F8',
  border: '#C8E4E4',
};

type Props = { nextAction: NextAction; ruolo: Ruolo; short: string };

export default function VanoView({ nextAction, ruolo, short }: Props) {
  const [eseguendo, setEseguendo] = useState(false);
  const codice = nextAction.codice;
  const payload = codice.payload || {};
  const isHigh = nextAction.priorita === 'high';

  async function eseguiAzione() {
    setEseguendo(true);
    await registraEvento({
      short, tipo_evento: nextAction.azione, ruolo,
      payload: { triggered_at: new Date().toISOString() },
    });
    setTimeout(() => setEseguendo(false), 600);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.light,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '48px 24px 24px',
        borderBottom: `1px solid ${C.teal}33`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          color: C.teal, fontSize: 12, textTransform: 'uppercase',
          letterSpacing: 2, fontWeight: 600,
        }}>
          <span style={{ width: 8, height: 8, background: C.teal, borderRadius: '50%' }} />
          Vano · {codice.stato}
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 800, margin: '12px 0 4px',
          letterSpacing: -0.5,
        }}>{payload.nome || 'Vano'}</h1>
        <p style={{
          color: `${C.light}99`,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 14, margin: 0,
        }}>{short}</p>
      </header>

      {/* Next Action gigante */}
      <section style={{ padding: '32px 24px' }}>
        {isHigh && (
          <div style={{
            color: C.teal, fontSize: 11, textTransform: 'uppercase',
            letterSpacing: 3, marginBottom: 12, fontWeight: 700,
          }}>⚡ AZIONE RICHIESTA</div>
        )}
        <button
          onClick={eseguiAzione}
          disabled={eseguendo}
          style={{
            width: '100%', padding: '24px 24px', borderRadius: 16,
            fontSize: 17, fontWeight: 800, border: 'none',
            cursor: eseguendo ? 'wait' : 'pointer',
            opacity: eseguendo ? 0.6 : 1,
            background: isHigh ? C.teal : C.light,
            color: isHigh ? 'white' : C.bg,
            boxShadow: isHigh
              ? `0 6px 0 ${C.tealDark}`
              : `0 6px 0 ${C.border}`,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onPointerDown={(e) => {
            e.currentTarget.style.transform = 'translateY(2px)';
            e.currentTarget.style.boxShadow = isHigh
              ? `0 4px 0 ${C.tealDark}` : `0 4px 0 ${C.border}`;
          }}
          onPointerUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isHigh
              ? `0 6px 0 ${C.tealDark}` : `0 6px 0 ${C.border}`;
          }}
        >
          {eseguendo ? 'In corso...' : `${nextAction.label} →`}
        </button>
      </section>

      {/* Dettagli */}
      <section style={{ padding: '8px 24px 24px' }}>
        {payload.misure && (
          <Row label="Misure" value={`${payload.misure.larghezza} × ${payload.misure.altezza} mm`} />
        )}
        {payload.tipologia && <Row label="Tipologia" value={payload.tipologia} />}
        {payload.cliente && <Row label="Cliente" value={payload.cliente} />}
        {payload.commessa && <Row label="Commessa" value={payload.commessa} />}
        {nextAction.distanza_km !== null && (
          <Row label="Distanza" value={`${nextAction.distanza_km.toFixed(1)} km dall'azienda`} />
        )}
      </section>

      {/* Cronologia */}
      {codice.stato_history && codice.stato_history.length > 0 && (
        <section style={{
          padding: '24px', borderTop: `1px solid ${C.teal}22`,
        }}>
          <h2 style={{
            fontSize: 11, textTransform: 'uppercase', letterSpacing: 2,
            color: C.teal, margin: '0 0 16px', fontWeight: 700,
          }}>Cronologia</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {codice.stato_history.slice(-5).reverse().map((ev: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  width: 8, height: 8, background: C.teal, borderRadius: '50%',
                  marginTop: 6, flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{ev.stato}</div>
                  <div style={{ fontSize: 12, color: `${C.light}66`, marginTop: 2 }}>
                    {new Date(ev.at).toLocaleString('it-IT')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        padding: '32px 24px',
        borderTop: `1px solid ${C.teal}22`,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, color: `${C.light}55`, margin: 0 }}>
          Stai visualizzando come{' '}
          <span style={{ color: C.teal, fontWeight: 600 }}>{ruolo}</span>
        </p>
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0', borderBottom: `1px solid ${C.teal}11`,
    }}>
      <span style={{ color: `${C.light}99`, fontSize: 14 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 14 }}>{value}</span>
    </div>
  );
}