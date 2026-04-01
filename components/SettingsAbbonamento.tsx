'use client';
import { useState, useEffect } from 'react';

interface SubStatus {
  plan: string;
  status: string;
  trialing: boolean;
  trialDaysLeft: number;
  trial_ends_at?: string;
  current_period_end?: string;
}

const PIANI: Record<string, { nome: string; prezzo: number; colore: string }> = {
  base:  { nome: 'BASE',  prezzo: 9,  colore: '#6B7280' },
  start: { nome: 'START', prezzo: 29, colore: '#3B7FE0' },
  pro:   { nome: 'PRO',   prezzo: 59, colore: '#D08008' },
  titan: { nome: 'TITAN', prezzo: 89, colore: '#1A1A1C' },
};

export default function SettingsAbbonamento() {
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portaling, setPortaling] = useState(false);

  useEffect(() => {
    fetch('/api/subscription/status', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(setSub)
      .finally(() => setLoading(false));
  }, []);

  const apriPortal = async () => {
    setPortaling(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setPortaling(false);
    }
  };

  if (loading) return <div style={loadingStyle}>Caricamento abbonamento...</div>;

  const piano = sub?.plan ? PIANI[sub.plan] : null;
  const statusColor = sub?.status === 'active' ? '#1A9E73' : sub?.trialing ? '#3B7FE0' : '#DC4444';
  const statusLabel = sub?.trialing ? `Trial — ${sub.trialDaysLeft} giorni rimasti` : sub?.status === 'active' ? 'Attivo' : sub?.status === 'past_due' ? 'Pagamento scaduto' : sub?.status ?? 'Nessun piano';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Card piano attuale */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E3DC', overflow: 'hidden' }}>
        <div style={{ background: piano?.colore ?? '#6B7280', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Piano attuale</div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>{piano?.nome ?? 'Nessuno'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>€{piano?.prezzo ?? 0}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>/mese</div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
          </div>
          {sub?.current_period_end && (
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              Rinnovo: {new Date(sub.current_period_end).toLocaleDateString('it-IT')}
            </div>
          )}
        </div>
      </div>

      {/* Azioni */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={apriPortal} disabled={portaling} style={{
          flex: 1, padding: '12px 0', background: '#1A1A1C', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
          cursor: portaling ? 'wait' : 'pointer', opacity: portaling ? 0.7 : 1,
          fontFamily: 'Inter, sans-serif',
        }}>
          {portaling ? 'Apertura...' : 'Gestisci abbonamento →'}
        </button>
        {(!sub || sub.status !== 'active') && (
          <button onClick={() => window.location.href = '/onboarding?step=5'} style={{
            flex: 1, padding: '12px 0', background: '#D08008', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            Upgrade piano ↑
          </button>
        )}
      </div>

      {/* Trial warning */}
      {sub?.trialing && sub.trialDaysLeft <= 7 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #D08008', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#92400E' }}>
          ⚠️ Il trial scade tra <strong>{sub.trialDaysLeft} giorni</strong>. Attiva un piano per non perdere i tuoi dati.
        </div>
      )}
    </div>
  );
}

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('sb-access-token') ?? '';
}

const loadingStyle: React.CSSProperties = {
  padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: 14,
};
