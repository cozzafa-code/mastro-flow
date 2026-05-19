// components/mobile/settings/GeneraApiKeyModal.tsx
// Modal v4 - LEGACY MODE: usa azienda_id da localStorage (no auth Supabase)

'use client';

import React, { useState, useEffect } from 'react';

const C = {
  navy: '#1E3A5F',
  navyDark: '#0F1B2D',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  amber: '#E89F3F',
  red: '#C44545',
  greenBg: '#E8F0E5',
  greenText: '#2D5F3F',
  borderWarm: '#d8cfc0',
  textMuted: '#6b6358',
};

const SCOPE_GROUPS = [
  { title: 'COMMESSE', scopes: [
    { id: 'commesse:read', label: 'Leggi commesse' },
    { id: 'commesse:write', label: 'Crea/modifica commesse' },
  ]},
  { title: 'FATTURE', scopes: [
    { id: 'fatture:read', label: 'Leggi fatture' },
    { id: 'fatture:write', label: 'Crea fatture' },
  ]},
  { title: 'CLIENTI', scopes: [
    { id: 'clienti:read', label: 'Leggi clienti' },
    { id: 'clienti:write', label: 'Crea/modifica clienti' },
  ]},
  { title: 'TECNICO', scopes: [
    { id: 'vani:read', label: 'Leggi vani' },
    { id: 'vani:write', label: 'Crea/modifica vani' },
    { id: 'cnc:write', label: 'Invia programmi CNC' },
  ]},
  { title: 'LEADS', scopes: [{ id: 'leads:write', label: 'Crea lead da sito web' }] },
  { title: 'SISTEMA', scopes: [{ id: 'webhook:receive', label: 'Ricevi webhook' }] },
];

const EXPIRY_OPTIONS = [
  { days: 30, label: '30 giorni' },
  { days: 90, label: '90 giorni' },
  { days: 365, label: '1 anno' },
  { days: 0, label: 'Mai' },
];

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

function getAziendaId(): string | null {
  if (typeof window === 'undefined') return null;
  // Prova diverse chiavi possibili
  const keys = ['mastro:azienda_id', 'mastro_azienda_id', 'azienda_id'];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
      return v;
    }
  }
  // Fallback: estrai da mastro:azienda
  try {
    const az = localStorage.getItem('mastro:azienda');
    if (az) {
      const obj = JSON.parse(az);
      if (obj?.id && /^[0-9a-f]{8}-/i.test(obj.id)) return obj.id;
    }
  } catch {}
  return null;
}

export default function GeneraApiKeyModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<{ plaintext: string; prefix: string } | null>(null);
  const [aziendaId, setAziendaId] = useState<string | null>(null);

  useEffect(() => {
    const az = getAziendaId();
    setAziendaId(az);
    if (!az) setError('Azienda non rilevata. Ricarica la pagina e rifai login.');
  }, []);

  function toggleScope(s: string) {
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleGenera() {
    setError('');
    if (!aziendaId) { setError('Azienda non rilevata.'); return; }
    if (!name.trim()) { setError('Inserisci un nome'); return; }
    if (scopes.length === 0) { setError('Seleziona almeno uno scope'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azienda_id: aziendaId,
          name: name.trim(),
          scopes,
          expiresInDays: expiresInDays || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.detail || data?.error || `HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      setGenerated({ plaintext: data.plaintext, prefix: data.key_prefix });
      onCreated();
    } catch (e: any) {
      setError(e?.message || 'Errore di rete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,27,45,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: C.cream, width: '100%', maxWidth: 520,
        maxHeight: '92vh', overflowY: 'auto',
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '22px 18px 36px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, color: C.navy, fontSize: 22, fontWeight: 700 }}>Nuova API Key</h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            fontSize: 24, color: C.textMuted, cursor: 'pointer',
            width: 32, height: 32,
          }}>×</button>
        </div>

        {generated ? (
          <div>
            <div style={{
              background: '#FFF8E5', border: `2px solid ${C.amber}`,
              borderRadius: 12, padding: 14, marginBottom: 14,
            }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 11, color: C.amber, letterSpacing: 1 }}>
                ⚠️ COPIA SUBITO — NON SARÀ PIÙ MOSTRATA
              </p>
            </div>
            <code style={{
              display: 'block', padding: 14,
              background: C.navyDark, color: C.cream,
              borderRadius: 10, fontSize: 12, wordBreak: 'break-all',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {generated.plaintext}
            </code>
            <button onClick={() => navigator.clipboard?.writeText(generated.plaintext)} style={{ ...btnPrimary, width: '100%', marginTop: 12 }}>
              📋 COPIA NEGLI APPUNTI
            </button>
            <button onClick={onClose} style={{ ...btnGhost, width: '100%', marginTop: 8 }}>
              CHIUDI
            </button>
          </div>
        ) : (
          <>
            <label style={lblStyle}>NOME</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="es. Sito web produzione"
              style={inputStyle}
            />

            <label style={{ ...lblStyle, marginTop: 16 }}>PERMESSI</label>
            {SCOPE_GROUPS.map(group => (
              <div key={group.title} style={{ marginBottom: 10 }}>
                <p style={{ margin: '8px 0 4px', fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: 1 }}>
                  {group.title}
                </p>
                {group.scopes.map(s => (
                  <label key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: 12, background: C.white,
                    border: `1px solid ${scopes.includes(s.id) ? C.greenText : C.borderWarm}`,
                    borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={scopes.includes(s.id)}
                      onChange={() => toggleScope(s.id)}
                      style={{ margin: 0, cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1 }}>
                      <strong style={{ fontSize: 13, color: C.navy }}>{s.label}</strong>
                      <code style={{ display: 'block', fontSize: 10, color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                        {s.id}
                      </code>
                    </span>
                  </label>
                ))}
              </div>
            ))}

            <label style={{ ...lblStyle, marginTop: 16 }}>SCADENZA</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {EXPIRY_OPTIONS.map(opt => (
                <button key={opt.days} onClick={() => setExpiresInDays(opt.days)} style={{
                  padding: '12px',
                  background: expiresInDays === opt.days ? C.navy : C.white,
                  color: expiresInDays === opt.days ? C.cream : C.navy,
                  border: `1px solid ${C.navy}`, borderRadius: 10,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: 12, background: '#FFE5E5', color: C.red, borderRadius: 10, fontSize: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleGenera}
              disabled={loading || !name.trim() || scopes.length === 0 || !aziendaId}
              style={{
                ...btnPrimary, width: '100%', marginTop: 16,
                opacity: (loading || !name.trim() || scopes.length === 0 || !aziendaId) ? 0.5 : 1,
                cursor: (loading || !name.trim() || scopes.length === 0 || !aziendaId) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Generazione...' : 'GENERA KEY'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: any = {
  width: '100%', padding: '12px 14px',
  border: `1px solid ${C.borderWarm}`, borderRadius: 10,
  fontSize: 14, background: C.white, color: C.navy,
  fontFamily: 'inherit', boxSizing: 'border-box',
};

const lblStyle: any = {
  display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 1,
  color: C.textMuted, marginBottom: 6, marginTop: 4,
};

const btnPrimary: any = {
  background: C.navy, color: C.cream,
  border: 'none', borderRadius: 12,
  padding: '14px 20px', fontWeight: 700, fontSize: 13,
  letterSpacing: 0.5, cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnGhost: any = {
  background: C.white, color: C.navy,
  border: `1px solid ${C.borderWarm}`, borderRadius: 12,
  padding: '12px 18px', fontWeight: 600, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit',
};
