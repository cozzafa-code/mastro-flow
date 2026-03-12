import { useState, useRef, useEffect } from 'react';
import { T } from '@/components/mastro-constants';

interface PinModalProps {
  member: { id: string; nome: string };
  azId: string;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
}

export function PinModal({ member, azId, onSuccess, onCancel, title }: PinModalProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  useEffect(() => { refs[0].current?.focus(); }, []);

  const handleDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setError(null);
    if (val && i < 5) refs[i + 1].current?.focus();
    if (next.every(d => d) && val) submit(next.join(''));
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  const submit = async (pin: string) => {
    setLoading(true);
    setError(null);
    const r = await fetch('/api/mastro/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', memberId: member.id, pin, azId }),
    });
    const data = await r.json();
    setLoading(false);
    if (data.ok) { onSuccess(); }
    else {
      setError(data.error);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => refs[0].current?.focus(), 50);
    }
  };

  const S = {
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    box: { background: T.card, borderRadius: 16, padding: 32, width: 320, textAlign: 'center' as const },
    input: { width: 44, height: 52, borderRadius: 10, border: `2px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 22, fontWeight: 700, textAlign: 'center' as const, outline: 'none' },
  };

  return (
    <div style={S.overlay} onClick={onCancel}>
      <div style={S.box} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 4 }}>
          {title || 'Inserisci PIN'}
        </div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 24 }}>{member.nome}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              style={{ ...S.input, borderColor: error ? '#DC4444' : d ? '#D08008' : T.border }}
              disabled={loading}
            />
          ))}
        </div>
        {loading && <div style={{ color: T.sub, fontSize: 13 }}>Verifica...</div>}
        {error && <div style={{ color: '#DC4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button onClick={onCancel} style={{ fontSize: 13, color: T.sub, background: 'none', border: 'none', cursor: 'pointer', marginTop: 8 }}>
          Annulla
        </button>
      </div>
    </div>
  );
}
