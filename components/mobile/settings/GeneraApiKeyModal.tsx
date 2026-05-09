// components/mobile/settings/GeneraApiKeyModal.tsx
// Modal genera API key v3 - auth robusta multi-fallback

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  {
    title: 'COMMESSE',
    scopes: [
      { id: 'commesse:read', label: 'Leggi commesse' },
      { id: 'commesse:write', label: 'Crea/modifica commesse' },
    ],
  },
  {
    title: 'FATTURE',
    scopes: [
      { id: 'fatture:read', label: 'Leggi fatture' },
      { id: 'fatture:write', label: 'Crea fatture' },
    ],
  },
  {
    title: 'CLIENTI',
    scopes: [
      { id: 'clienti:read', label: 'Leggi clienti' },
      { id: 'clienti:write', label: 'Crea/modifica clienti' },
    ],
  },
  {
    title: 'TECNICO',
    scopes: [
      { id: 'vani:read', label: 'Leggi vani' },
      { id: 'vani:write', label: 'Crea/modifica vani' },
      { id: 'cnc:write', label: 'Invia programmi CNC' },
    ],
  },
  {
    title: 'LEADS',
    scopes: [{ id: 'leads:write', label: 'Crea lead da sito web' }],
  },
  {
    title: 'SISTEMA',
    scopes: [{ id: 'webhook:receive', label: 'Ricevi webhook' }],
  },
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

/**
 * Recupera access_token con 4 fallback:
 *  1. supabase.auth.getSession()
 *  2. window.__supabase getSession (eventuale client globale)
 *  3. localStorage chiave 'sb-fgefcigxlbrmbeqqzjmo-auth-token'
 *  4. localStorage chiave 'sb-session' (storage custom MASTRO)
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
  } catch {}

  try {
    const w = window as any;
    if (w.__supabase) {
      const { data: { session } } = await w.__supabase.auth.getSession();
      if (session?.access_token) return session.access_token;
    }
  } catch {}

  if (typeof window !== 'undefined') {
    // Tutte le chiavi localStorage che iniziano con sb-
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('sb-') || k === 'mastro_session' || k === 'supabase.auth.token') {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          // Formato 1: array [access_token, refresh_token, ...]
          if (Array.isArray(parsed) && typeof parsed[0] === 'string' && parsed[0].length > 50) {
            return parsed[0];
          }
          // Formato 2: { access_token: "...", ... } o { currentSession: {...} }
          if (parsed?.access_token) return parsed.access_token;
          if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token;
          if (parsed?.session?.access_token) return parsed.session.access_token;
        } catch {}
      }
    }
  }

  return null;
}

export default function GeneraApiKeyModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<{ plaintext: string; prefix: string } | null>(null);
  const [authReady, setAuthReady] = useState<boolean | null>(null);

  // Verifica auth subito all'apertura
  useEffect(() => {
    (async () => {
      const tok = await getAccessToken();
      setAuthReady(!!tok);
      if (!tok) {
        setError('Sessione non rilevata. Prova a ricaricare la pagina (Ctrl+Shift+R) e ad aprire di nuovo questo modal.');
      }
    })();
  }, []);

  function toggleScope(s: string) {
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleGenera() {
    setError('');
    if (!name.trim()) { setError('Inserisci un nome'); return; }
    if (scopes.length === 0) { setError('Seleziona almeno uno scope'); return; }

    setLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError('Sessione non trovata. Ricarica la pagina e rifai login.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include', // anche cookie
        body: JSON.stringify({
          name: name.trim(),
          scopes,
          expiresInDays: expiresInDays || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || data?.error || `HTTP ${res.status}`);
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, color: C.navy, fontSize: 22, fontWeight: 700 }}>
            Nuova API Key
          </h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            fontSize: 24, color: C.textMuted, cursor: 'pointer',
            width: 32, height: 32,
          }}>×</button>
        </div>

        {/* Banner stato auth */}
        {authReady === false && !generated && (
          <div style={{
            background: '#FFE5E5', border: `1px solid ${C.red}`,
            color: C.red, padding: 12, borderRadius: 10,
            fontSize: 12, marginBottom: 14,
          }}>
            ⚠️ Sessione non rilevata.<br />
            <strong>Soluzione rapida:</strong> chiudi questa finestra, fai Ctrl+Shift+R sulla pagina, riapri il modal.
          </div>
        )}

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
            <button
              onClick={() => { navigator.clipboard?.writeText(generated.plaintext); }}
              style={{ ...btnPrimary, width: '100%', marginTop: 12 }}
            >
              📋 COPIA NEGLI APPUNTI
            </button>
            <button
              onClick={onClose}
              style={{ ...btnGhost, width: '100%', marginTop: 8 }}
            >
              CHIUDI
            </button>
          </div>
        ) : (
          <>
            {/* Nome */}
            <label style={lblStyle}>NOME</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="es. Sito web produzione"
              style={inputStyle}
            />

            {/* Scopes */}
            <label style={{ ...lblStyle, marginTop: 16 }}>PERMESSI</label>
            {SCOPE_GROUPS.map(group => (
              <div key={group.title} style={{ marginBottom: 10 }}>
                <p style={{
                  margin: '8px 0 4px', fontSize: 9, fontWeight: 700,
                  color: C.textMuted, letterSpacing: 1,
                }}>
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
                      <code style={{
                        display: 'block', fontSize: 10, color: C.textMuted,
                        fontFamily: "'JetBrains Mono', monospace", marginTop: 2,
                      }}>
                        {s.id}
                      </code>
                    </span>
                  </label>
                ))}
              </div>
            ))}

            {/* Scadenza */}
            <label style={{ ...lblStyle, marginTop: 16 }}>SCADENZA</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {EXPIRY_OPTIONS.map(opt => (
                <button
                  key={opt.days}
                  onClick={() => setExpiresInDays(opt.days)}
                  style={{
                    padding: '12px',
                    background: expiresInDays === opt.days ? C.navy : C.white,
                    color: expiresInDays === opt.days ? C.cream : C.navy,
                    border: `1px solid ${C.navy}`, borderRadius: 10,
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Errore */}
            {error && (
              <div style={{
                marginTop: 14, padding: 12,
                background: '#FFE5E5', color: C.red,
                borderRadius: 10, fontSize: 12,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleGenera}
              disabled={loading || !name.trim() || scopes.length === 0}
              style={{
                ...btnPrimary, width: '100%', marginTop: 16,
                opacity: (loading || !name.trim() || scopes.length === 0) ? 0.5 : 1,
                cursor: (loading || !name.trim() || scopes.length === 0) ? 'not-allowed' : 'pointer',
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
