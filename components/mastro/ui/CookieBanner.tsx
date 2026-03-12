'use client';
import { useState, useEffect } from 'react';

const COOKIE_KEY = 'mastro_cookie_consent';

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
};

function loadConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveConsent(c: ConsentState) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify(c));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = loadConsent();
    if (!existing?.decided) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = (all: boolean) => {
    saveConsent({ necessary: true, analytics: all, marketing: all, decided: true });
    setVisible(false);
  };

  const saveCustom = () => {
    saveConsent({ necessary: true, analytics, marketing, decided: true });
    setVisible(false);
  };

  const T = {
    bg: '#1A1A1C',
    card: '#242426',
    border: '#2E2E30',
    text: '#F2F1EC',
    sub: '#8E8E93',
    amber: '#D08008',
    green: '#1A9E73',
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
      padding: '0 0 env(safe-area-inset-bottom)',
      animation: 'slideUp 0.3s ease-out',
    }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .mastro-toggle { position: relative; width: 40px; height: 22px; }
        .mastro-toggle input { opacity: 0; width: 0; height: 0; }
        .mastro-toggle-track {
          position: absolute; inset: 0; border-radius: 11px; cursor: pointer;
          transition: background 0.2s;
        }
        .mastro-toggle input:checked + .mastro-toggle-track { background: #1A9E73; }
        .mastro-toggle input:not(:checked) + .mastro-toggle-track { background: #3A3A3C; }
        .mastro-toggle input:disabled + .mastro-toggle-track { cursor: not-allowed; opacity: 0.6; }
        .mastro-toggle-thumb {
          position: absolute; top: 3px; left: 3px; width: 16px; height: 16px;
          border-radius: 50%; background: white; transition: transform 0.2s; pointer-events: none;
        }
        .mastro-toggle input:checked ~ .mastro-toggle-thumb { transform: translateX(18px); }
      `}</style>

      <div style={{
        background: T.bg, borderTop: `1px solid ${T.border}`,
        padding: '20px 24px', maxWidth: 720, margin: '0 auto',
        borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 22 }}>🍪</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 4 }}>
              Questo sito usa i cookie
            </div>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
              Utilizziamo cookie tecnici necessari al funzionamento e, con il tuo consenso, cookie analitici per migliorare il servizio.
              {' '}<a href="/privacy" style={{ color: T.amber, textDecoration: 'none' }}>Privacy Policy</a>
              {' '}·{' '}
              <a href="/cookie-policy" style={{ color: T.amber, textDecoration: 'none' }}>Cookie Policy</a>
            </div>
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div style={{
            background: T.card, borderRadius: 10, padding: 16, marginBottom: 16,
            border: `1px solid ${T.border}`,
          }}>
            {[
              {
                label: 'Cookie necessari', key: 'necessary', value: true, disabled: true,
                desc: 'Autenticazione, sessione, sicurezza. Non disattivabili.',
              },
              {
                label: 'Cookie analitici', key: 'analytics', value: analytics,
                set: setAnalytics,
                desc: 'Statistiche aggregate anonime per migliorare il prodotto.',
              },
              {
                label: 'Cookie marketing', key: 'marketing', value: marketing,
                set: setMarketing,
                desc: 'Utilizziamo questi dati per misurare campagne pubblicitarie.',
              },
            ].map((item) => (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: item.key !== 'marketing' ? `1px solid ${T.border}` : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{item.desc}</div>
                </div>
                <label className="mastro-toggle">
                  <input
                    type="checkbox"
                    checked={item.value}
                    disabled={item.disabled}
                    onChange={e => item.set?.(e.target.checked)}
                  />
                  <div className="mastro-toggle-track" />
                  <div className="mastro-toggle-thumb" />
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => accept(true)} style={{
            flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 8,
            background: T.green, color: 'white', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13,
          }}>
            Accetta tutti
          </button>
          <button onClick={() => accept(false)} style={{
            flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 8,
            background: T.card, color: T.text, border: `1px solid ${T.border}`,
            cursor: 'pointer', fontWeight: 600, fontSize: 13,
          }}>
            Solo necessari
          </button>
          {expanded ? (
            <button onClick={saveCustom} style={{
              flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 8,
              background: T.amber, color: 'white', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
            }}>
              Salva preferenze
            </button>
          ) : (
            <button onClick={() => setExpanded(true)} style={{
              padding: '10px 16px', borderRadius: 8,
              background: 'none', color: T.sub, border: 'none', cursor: 'pointer',
              fontSize: 12, textDecoration: 'underline',
            }}>
              Personalizza
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook per leggere il consenso da altri componenti
export function useCookieConsent() {
  const consent = loadConsent();
  return {
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
    necessary: true,
    decided: consent?.decided ?? false,
  };
}
