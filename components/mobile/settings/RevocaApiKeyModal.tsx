// components/mobile/settings/RevocaApiKeyModal.tsx
// Modal revoca API key con conferma typed - design fliwoX

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ApiKey } from '@/lib/types';

const C = {
  navy: '#1E3A5F',
  navyDark: '#122440',
  navyMute: '#B8C5D6',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  amber: '#E89F3F',
  red: '#C44545',
  redDark: '#8E2A2A',
  greenBg: '#E8F0E5',
  greenText: '#2D5F3F',
  borderWarm: '#d8cfc0',
  textMuted: '#6b6358',
};

const FONT_MONO = "'JetBrains Mono', monospace";

interface Props {
  apiKey: ApiKey;
  onClose: () => void;
  onConfirmed: () => void;
}

export default function RevocaApiKeyModal({ apiKey, onClose, onConfirmed }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requiredText = 'REVOCA';
  const canSubmit = confirmText.trim().toUpperCase() === requiredText && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Sessione scaduta. Effettua nuovamente il login.');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/keys?id=${apiKey.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || 'Errore revoca');
        setLoading(false);
        return;
      }

      onConfirmed();
    } catch (e: any) {
      setError(e?.message || 'Errore di rete');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(18, 36, 64, 0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.cream,
          width: '100%',
          maxWidth: 480,
          borderRadius: '24px 24px 0 0',
          maxHeight: '92vh',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Header rosso allerta */}
        <header
          style={{
            background: C.red,
            padding: '20px 20px 24px',
            borderRadius: '24px 24px 0 0',
            color: C.cream,
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: C.cream,
              width: 32,
              height: 32,
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Annulla"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.cream} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
            AZIONE IRREVERSIBILE
          </p>
          <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
            Revoca API key
          </h2>
        </header>

        {/* Body */}
        <div style={{ padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 15, color: C.navy, lineHeight: 1.5 }}>
            Stai per revocare la chiave <strong>{apiKey.name}</strong>.
            Tutte le applicazioni che la usano <strong style={{ color: C.red }}>smetteranno di funzionare immediatamente</strong>.
          </p>

          {/* Card key info */}
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.borderWarm}`,
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.5px' }}>
              CHIAVE DA REVOCARE
            </p>
            <p style={{ margin: '6px 0 4px', fontSize: 16, fontWeight: 700, color: C.navy }}>
              {apiKey.name}
            </p>
            <code style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.textMuted }}>
              {apiKey.key_prefix}…••••••••
            </code>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {apiKey.scopes.map((s) => (
                <span
                  key={s}
                  style={{
                    background: C.borderWarm,
                    color: C.navy,
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontFamily: FONT_MONO,
                    fontWeight: 600,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Conferma typed */}
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: C.navy, letterSpacing: '0.5px' }}>
            DIGITA <span style={{ color: C.red }}>{requiredText}</span> PER CONFERMARE
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Digita ${requiredText}`}
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              background: C.white,
              border: `2px solid ${canSubmit ? C.red : C.borderWarm}`,
              borderRadius: 12,
              fontSize: 15,
              color: C.navy,
              fontWeight: 700,
              fontFamily: FONT_MONO,
              outline: 'none',
              boxSizing: 'border-box',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          />

          {/* Error */}
          {error && (
            <div
              style={{
                background: '#FFE5E5',
                border: `1px solid ${C.red}`,
                color: C.red,
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginTop: 12,
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                background: 'transparent',
                color: C.navy,
                border: `1px solid ${C.borderWarm}`,
                borderRadius: 14,
                padding: 16,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                flex: 1,
                background: canSubmit ? C.red : C.borderWarm,
                color: canSubmit ? C.cream : C.textMuted,
                border: 'none',
                borderRadius: 14,
                padding: 16,
                fontSize: 14,
                fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? `0 4px 0 ${C.redDark}` : 'none',
                letterSpacing: '0.3px',
              }}
            >
              {loading ? 'REVOCA...' : 'REVOCA KEY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
