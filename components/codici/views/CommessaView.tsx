'use client';
import type { NextAction, Ruolo } from '@/lib/codici/types';

const C = {
  bg: '#0D1F1F', teal: '#28A0A0', tealDark: '#1a6b6b', light: '#EEF8F8',
};

export default function CommessaView({
  nextAction, ruolo, short
}: { nextAction: NextAction; ruolo: Ruolo; short: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.light,
      padding: 24, fontFamily: '-apple-system, sans-serif',
    }}>
      <p style={{
        color: C.teal, fontSize: 11, textTransform: 'uppercase',
        letterSpacing: 2, fontWeight: 700, marginTop: 24,
      }}>COMMESSA</p>
      <h1 style={{
        fontSize: 28, fontWeight: 800, margin: '8px 0',
      }}>{short}</h1>
      <p style={{ color: `${C.light}99`, marginTop: 16 }}>
        Stato: <strong>{nextAction.stato}</strong>
      </p>
      <button style={{
        marginTop: 24, width: '100%', padding: 18,
        background: C.teal, color: 'white', border: 'none',
        borderRadius: 14, fontSize: 16, fontWeight: 800,
        boxShadow: `0 6px 0 ${C.tealDark}`, cursor: 'pointer',
      }}>
        {nextAction.label}
      </button>
      <p style={{
        marginTop: 32, fontSize: 11, color: `${C.light}55`, textAlign: 'center',
      }}>Ruolo: {ruolo}</p>
    </div>
  );
}