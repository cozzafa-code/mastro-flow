// components/mobile/settings/GeneraApiKeyModal.tsx
// Modal generazione API key - design fliwoX (navy + cream + amber)

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const C = {
  navy: '#1E3A5F',
  navyDark: '#122440',
  navyMute: '#B8C5D6',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  amber: '#E89F3F',
  red: '#C44545',
  greenBg: '#E8F0E5',
  greenText: '#2D5F3F',
  borderWarm: '#d8cfc0',
  textMuted: '#6b6358',
};

const FONT_MONO = "'JetBrains Mono', monospace";

const SCOPES_AVAILABLE = [
  { id: 'commesse:read', label: 'Leggi commesse', group: 'Commesse' },
  { id: 'commesse:write', label: 'Crea/modifica commesse', group: 'Commesse' },
  { id: 'fatture:read', label: 'Leggi fatture', group: 'Fatture' },
  { id: 'fatture:write', label: 'Crea fatture', group: 'Fatture' },
  { id: 'clienti:read', label: 'Leggi clienti', group: 'Clienti' },
  { id: 'clienti:write', label: 'Crea/modifica clienti', group: 'Clienti' },
  { id: 'vani:read', label: 'Leggi vani', group: 'Tecnico' },
  { id: 'vani:write', label: 'Crea/modifica vani', group: 'Tecnico' },
  { id: 'cnc:write', label: 'Invia programmi CNC', group: 'Tecnico' },
  { id: 'leads:write', label: 'Crea lead da sito web', group: 'Leads' },
  { id: 'webhook:receive', label: 'Ricevi webhook', group: 'Sistema' },
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

type Step = 'form' | 'success';

export default function GeneraApiKeyModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState<number>(365);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [copied, setCopied] = useState(false);

  const toggleScope = (id: string) => {
    setSelectedScopes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Inserisci un nome per la key');
      return;
    }
    if (selectedScopes.length === 0) {
      setError('Seleziona almeno un permesso');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Recupera token utente da supabase client
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Sessione scaduta. Effettua nuovamente il login.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          scopes: selectedScopes,
          expiresInDays: expiresInDays || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || 'Errore creazione key');
        setLoading(false);
        return;
      }

      setPlaintext(data.plaintext);
      setStep('success');
    } catch (e: any) {
      setError(e?.message || 'Errore di rete');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (step === 'success') {
      onCreated();
    }
    onClose();
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
      onClick={handleClose}
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
        {step === 'form' ? (
          <FormStep
            name={name}
            setName={setName}
            selectedScopes={selectedScopes}
            toggleScope={toggleScope}
            expiresInDays={expiresInDays}
            setExpiresInDays={setExpiresInDays}
            onSubmit={handleSubmit}
            onClose={handleClose}
            loading={loading}
            error={error}
          />
        ) : (
          <SuccessStep
            plaintext={plaintext}
            copied={copied}
            onCopy={handleCopy}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}

// ========== FORM STEP ==========

function FormStep({
  name, setName, selectedScopes, toggleScope, expiresInDays, setExpiresInDays,
  onSubmit, onClose, loading, error,
}: {
  name: string;
  setName: (v: string) => void;
  selectedScopes: string[];
  toggleScope: (id: string) => void;
  expiresInDays: number;
  setExpiresInDays: (n: number) => void;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
  error: string;
}) {
  // Raggruppa scopes
  const grouped: Record<string, typeof SCOPES_AVAILABLE> = {};
  SCOPES_AVAILABLE.forEach((s) => {
    if (!grouped[s.group]) grouped[s.group] = [];
    grouped[s.group].push(s);
  });

  return (
    <div>
      {/* Header navy */}
      <header
        style={{
          background: C.navy,
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
            background: 'rgba(255,255,255,0.15)',
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
          aria-label="Chiudi"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <p style={{ margin: 0, color: C.navyMute, fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
          NUOVA API KEY
        </p>
        <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
          Genera chiave
        </h2>
      </header>

      {/* Body */}
      <div style={{ padding: 20 }}>
        {/* Nome */}
        <Field label="NOME" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Zapier Production"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: C.white,
              border: `1px solid ${C.borderWarm}`,
              borderRadius: 12,
              fontSize: 15,
              color: C.navy,
              fontWeight: 500,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </Field>

        {/* Scopes */}
        <Field label="PERMESSI" required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.6px' }}>
                  {group.toUpperCase()}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((s) => {
                    const checked = selectedScopes.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleScope(s.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          background: checked ? C.navy : C.white,
                          border: `1px solid ${checked ? C.navy : C.borderWarm}`,
                          borderRadius: 10,
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 5,
                            background: checked ? C.amber : 'transparent',
                            border: `2px solid ${checked ? C.amber : C.borderWarm}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: checked ? C.cream : C.navy }}>
                            {s.label}
                          </p>
                          <code style={{ fontSize: 10, color: checked ? C.navyMute : C.textMuted, fontFamily: FONT_MONO }}>
                            {s.id}
                          </code>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Field>

        {/* Expiry */}
        <Field label="SCADENZA">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {EXPIRY_OPTIONS.map((opt) => {
              const active = expiresInDays === opt.days;
              return (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setExpiresInDays(opt.days)}
                  style={{
                    padding: '12px 8px',
                    background: active ? C.navy : C.white,
                    border: `1px solid ${active ? C.navy : C.borderWarm}`,
                    borderRadius: 10,
                    color: active ? C.cream : C.navy,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>

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
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? C.borderWarm : C.navy,
            color: C.cream,
            border: 'none',
            borderRadius: 14,
            padding: 16,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: loading ? 'none' : `0 4px 0 ${C.navyDark}`,
            letterSpacing: '0.3px',
          }}
        >
          {loading ? 'GENERAZIONE…' : 'GENERA KEY'}
        </button>
      </div>
    </div>
  );
}

// ========== SUCCESS STEP ==========

function SuccessStep({
  plaintext, copied, onCopy, onClose,
}: {
  plaintext: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      <header
        style={{
          background: C.navy,
          padding: '20px 20px 24px',
          borderRadius: '24px 24px 0 0',
          color: C.cream,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: C.amber,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
          Key creata!
        </h2>
        <p style={{ margin: '6px 0 0', color: C.navyMute, fontSize: 13 }}>
          Copia la chiave ORA. Non sarà più visibile.
        </p>
      </header>

      <div style={{ padding: 20 }}>
        <div
          style={{
            background: '#FFF8E5',
            border: `2px solid ${C.amber}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
            ⚠️ Salvala subito
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
            Per sicurezza, MASTRO conserva solo un hash. Se la perdi, dovrai generarne una nuova.
          </p>
        </div>

        <div
          style={{
            background: C.navy,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            wordBreak: 'break-all',
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: C.navyMute, marginBottom: 8, fontWeight: 600, letterSpacing: '0.5px' }}>
            LA TUA API KEY
          </p>
          <code
            style={{
              color: C.amber,
              fontSize: 13,
              fontFamily: FONT_MONO,
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            {plaintext}
          </code>
        </div>

        <button
          onClick={onCopy}
          style={{
            width: '100%',
            background: copied ? C.greenBg : C.amber,
            color: copied ? C.greenText : C.navy,
            border: 'none',
            borderRadius: 14,
            padding: 16,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 8,
            boxShadow: copied ? 'none' : `0 4px 0 #B87E2A`,
            letterSpacing: '0.3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {copied ? '✓ COPIATA' : 'COPIA NEGLI APPUNTI'}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: 'transparent',
            color: C.navy,
            border: `1px solid ${C.borderWarm}`,
            borderRadius: 14,
            padding: 16,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}

// ========== Field wrapper ==========

function Field({
  label, required, children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 11,
          fontWeight: 700,
          color: C.navy,
          letterSpacing: '0.8px',
        }}
      >
        {label} {required && <span style={{ color: C.red }}>*</span>}
      </p>
      {children}
    </div>
  );
}
